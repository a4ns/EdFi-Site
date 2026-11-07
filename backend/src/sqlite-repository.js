import { DatabaseSync } from 'node:sqlite';
import { RewardError, fail } from './errors.js';
import { APPLICATION_ID, SCHEMA, SCHEMA_VERSION } from './schema.js';
import { canonical, quantity } from './validation.js';

function rewardFromRow(row) {
  if (!row) return null;
  return {
    id: row.id, issuerId: row.issuer_id, subjectId: row.subject_id,
    sourceResultId: row.source_result_id, evidenceRef: row.evidence_ref,
    quantity: row.quantity, unitId: row.unit_id, status: row.status,
    version: row.version, createdAt: row.created_at, updatedAt: row.updated_at,
  };
}
function ledgerFromRow(row) {
  return {
    rewardId: row.reward_id, direction: row.direction, issuerId: row.issuer_id,
    subjectId: row.subject_id, unitId: row.unit_id, account: row.account,
    quantity: row.quantity, createdAt: row.created_at,
  };
}
const normalizeSql = (sql) => sql.replace(/\s+/g, ' ').trim().replace(/;$/, '');

function storageError(error) {
  if (error instanceof RewardError) return error;
  const busy = error?.errcode === 5 || error?.errcode === 6;
  return new RewardError(busy ? 'STORAGE_BUSY' : 'STORAGE_FAILURE',
    busy ? 'SQLite lock wait exceeded the configured bound' : 'SQLite operation failed', { cause: error });
}

/** Local reference adapter, deliberately synchronous and without a funding API. */
export function createSqliteRewardRepository({ filename, busyTimeoutMs = 1000 } = {}) {
  if (typeof filename !== 'string' || !filename || !Number.isInteger(busyTimeoutMs) || busyTimeoutMs < 0 || busyTimeoutMs > 5000) {
    throw new TypeError('filename and a 0–5000ms busyTimeoutMs are required');
  }
  let db;
  let closed = false;
  const statements = new Map();
  const statement = (sql) => {
    if (closed) fail('REPOSITORY_CLOSED', 'Repository is closed');
    if (!statements.has(sql)) statements.set(sql, db.prepare(sql));
    return statements.get(sql);
  };
  const all = (sql, ...values) => statement(sql).all(...values);
  const get = (sql, ...values) => statement(sql).get(...values);
  const run = (sql, ...values) => statement(sql).run(...values);
  function read(work) {
    try { return work(); } catch (error) { throw storageError(error); }
  }
  function transaction(work) {
    let started = false;
    try {
      db.exec('BEGIN IMMEDIATE');
      started = true;
      const result = work();
      if (result && typeof result.then === 'function') fail('ASYNC_TRANSACTION', 'Transactions must be synchronous');
      db.exec('COMMIT');
      return result;
    } catch (error) {
      if (started) {
        try { db.exec('ROLLBACK'); } catch (rollbackError) {
          closed = true;
          try { db.close(); } catch { /* Preserve both failures below. */ }
          throw new RewardError('STORAGE_FAILURE', 'Transaction and rollback failed; repository closed', { cause: new AggregateError([error, rollbackError]) });
        }
      }
      throw storageError(error);
    }
  }

  function verifySchema() {
    const actual = all("SELECT type, name, sql FROM sqlite_schema WHERE name NOT GLOB 'sqlite_*' ORDER BY name");
    const expected = [...SCHEMA].sort((a, b) => a.name.localeCompare(b.name));
    if (get('PRAGMA user_version').user_version !== SCHEMA_VERSION ||
        get('PRAGMA application_id').application_id !== APPLICATION_ID || actual.length !== expected.length ||
        actual.some((entry, i) => entry.name !== expected[i].name || entry.type !== expected[i].type || normalizeSql(entry.sql) !== normalizeSql(expected[i].sql))) {
      fail('UNKNOWN_SCHEMA', 'Unrecognized SQLite schema; no automatic reset or migration is performed');
    }
  }

  // Exact arithmetic and cross-table checks complement SQLite constraints.
  // Full scans are acceptable only for this bounded offline reference.
  function assertInvariants() {
    const rewards = all('SELECT * FROM rewards');
    const budgets = all('SELECT * FROM budgets');
    const ledger = all('SELECT * FROM ledger');
    const events = all('SELECT * FROM events');
    const receipts = all('SELECT * FROM command_receipts');
    const totals = new Map();
    const key = (issuer, unit) => canonical({ issuer, unit });
    const invalid = () => fail('INVARIANT_VIOLATION', 'Stored reward, budget, ledger or audit invariant failed');
    const byReward = new Map(rewards.map((reward) => [reward.id, reward]));
    for (const reward of rewards) {
      const budgetKey = key(reward.issuer_id, reward.unit_id);
      const total = totals.get(budgetKey) ?? { reserved: 0n, spent: 0n };
      const amount = BigInt(quantity(reward.quantity));
      if (reward.status === 'approved') total.reserved += amount;
      if (reward.status === 'posted') total.spent += amount;
      totals.set(budgetKey, total);
      const lines = ledger.filter((line) => line.reward_id === reward.id);
      if (reward.status === 'posted' ? lines.length !== 2 : lines.length !== 0) invalid();
      for (const line of lines) {
        if (line.quantity !== reward.quantity || line.issuer_id !== reward.issuer_id ||
            line.subject_id !== reward.subject_id || line.unit_id !== reward.unit_id || line.created_at !== reward.updated_at) invalid();
      }
      if (lines.length && (new Set(lines.map((line) => line.direction)).size !== 2 ||
          lines.some((line) => line.account !== (line.direction === 'debit' ? 'issuer_budget' : 'subject')))) invalid();
      const history = events.filter((event) => event.reward_id === reward.id).sort((a, b) => a.version - b.version);
      if (history.length !== reward.version || history.at(-1)?.status !== reward.status) invalid();
      for (let i = 0; i < history.length; i++) {
        const event = history[i];
        const previous = history[i - 1]?.status ?? null;
        const allowed = event.action === 'submit' ? previous === null && event.status === 'pending' :
          event.action === 'approve' ? previous === 'pending' && event.status === 'approved' :
          event.action === 'post' ? previous === 'approved' && event.status === 'posted' :
          event.action === 'revoke' && ['pending', 'approved'].includes(previous) && event.status === 'revoked';
        if (event.version !== i + 1 || event.issuer_id !== reward.issuer_id || event.previous_status !== previous || !allowed) invalid();
      }
    }
    for (const budget of budgets) {
      const total = BigInt(quantity(budget.total, { zero: true }));
      const reserved = BigInt(quantity(budget.reserved, { zero: true }));
      const spent = BigInt(quantity(budget.spent, { zero: true }));
      const expected = totals.get(key(budget.issuer_id, budget.unit_id)) ?? { reserved: 0n, spent: 0n };
      if (reserved + spent > total || expected.reserved !== reserved || expected.spent !== spent) invalid();
      totals.delete(key(budget.issuer_id, budget.unit_id));
    }
    if ([...totals.values()].some((total) => total.reserved !== 0n || total.spent !== 0n)) invalid();
    if (ledger.some((line) => !byReward.has(line.reward_id)) || events.length !== receipts.length) invalid();
    for (const event of events) {
      const receiptRow = receipts.find((row) => row.command_id === event.command_id);
      if (!receiptRow || !byReward.has(event.reward_id)) invalid();
      let receipt;
      let command;
      try { receipt = JSON.parse(receiptRow.receipt_json); command = JSON.parse(receiptRow.fingerprint); } catch { invalid(); }
      const current = rewardFromRow(byReward.get(event.reward_id));
      const historical = { ...current, status: event.status, version: event.version, updatedAt: event.recorded_at };
      const expectedCommand = {
        issuerId: event.issuer_id, actorId: event.actor_id, action: event.action, idempotencyKey: receiptRow.idempotency_key,
        ...(event.action === 'submit' ? {
          subjectId: current.subjectId, sourceResultId: current.sourceResultId, evidenceRef: current.evidenceRef,
          quantity: current.quantity, unitId: current.unitId,
        } : { rewardId: current.id, expectedVersion: event.version - 1 }),
      };
      if (canonical(expectedCommand) !== receiptRow.fingerprint) invalid();
      if (receipt.kind !== 'historical-command-receipt' || receipt.commandId !== event.command_id ||
          receipt.issuerId !== event.issuer_id || receipt.actorId !== event.actor_id || receipt.action !== event.action ||
          receipt.recordedAt !== event.recorded_at || receipt.idempotencyKey !== receiptRow.idempotency_key ||
          receiptRow.issuer_id !== event.issuer_id || receiptRow.reward_id !== event.reward_id ||
          canonical(receipt.reward) !== canonical(historical) || canonical(command) !== receiptRow.fingerprint ||
          command.issuerId !== event.issuer_id || command.actorId !== event.actor_id || command.action !== event.action ||
          command.idempotencyKey !== receiptRow.idempotency_key) invalid();
    }
  }

  try {
    db = new DatabaseSync(filename);
    db.exec(`PRAGMA busy_timeout = ${busyTimeoutMs}; PRAGMA foreign_keys = ON`);
    if (get('PRAGMA integrity_check').integrity_check !== 'ok') fail('CORRUPT_STORAGE', 'SQLite integrity check failed');
    // Recognize an existing database before changing its persistent journal mode.
    if (all("SELECT name FROM sqlite_schema WHERE name NOT GLOB 'sqlite_*'").length ||
        get('PRAGMA user_version').user_version !== 0 || get('PRAGMA application_id').application_id !== 0) {
      verifySchema();
    }
    db.exec('PRAGMA journal_mode = DELETE; PRAGMA synchronous = EXTRA');
    if (get('PRAGMA journal_mode').journal_mode !== 'delete' || get('PRAGMA synchronous').synchronous !== 3 ||
        get('PRAGMA foreign_keys').foreign_keys !== 1) {
      fail('UNSAFE_STORAGE', 'The reference requires file-backed DELETE journaling, EXTRA synchronization and foreign keys');
    }
    transaction(() => {
      const existing = all("SELECT name FROM sqlite_schema WHERE name NOT GLOB 'sqlite_*'");
      if (!existing.length && get('PRAGMA user_version').user_version === 0 && get('PRAGMA application_id').application_id === 0) {
        for (const entry of SCHEMA) db.exec(entry.sql);
        db.exec(`PRAGMA user_version = ${SCHEMA_VERSION}; PRAGMA application_id = ${APPLICATION_ID}`);
      }
      verifySchema();
      if (all('PRAGMA foreign_key_check').length) fail('CORRUPT_STORAGE', 'SQLite foreign key check failed');
      assertInvariants();
    });
  } catch (error) {
    try { db?.close(); } catch { /* Preserve original opening failure. */ }
    throw error;
  }

  function requireReward(issuerId, rewardId) {
    const row = get('SELECT * FROM rewards WHERE id = ? AND issuer_id = ?', rewardId, issuerId);
    if (!row) fail('NOT_FOUND', 'Reward not found for issuer');
    return row;
  }

  function execute(command, metadata) {
    if (closed) fail('REPOSITORY_CLOSED', 'Repository is closed');
    return transaction(() => {
      assertInvariants();
      const fingerprint = canonical(command);
      const old = get('SELECT fingerprint, receipt_json FROM command_receipts WHERE issuer_id = ? AND idempotency_key = ?', command.issuerId, command.idempotencyKey);
      if (old) {
        if (old.fingerprint !== fingerprint) fail('IDEMPOTENCY_CONFLICT', 'This issuer request key belongs to a different command');
        return JSON.parse(old.receipt_json);
      }
      const { commandId, rewardId: newRewardId, recordedAt } = metadata();
      let row;
      let previousStatus = null;
      if (command.action === 'submit') {
        if (get('SELECT id FROM rewards WHERE issuer_id = ? AND source_result_id = ?', command.issuerId, command.sourceResultId)) {
          fail('DUPLICATE_RESULT', 'This issuer result already has a reward');
        }
        run(`INSERT INTO rewards (id, issuer_id, subject_id, source_result_id, evidence_ref, quantity, unit_id, status, version, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', 1, ?, ?)`,
        newRewardId, command.issuerId, command.subjectId, command.sourceResultId, command.evidenceRef, command.quantity, command.unitId, recordedAt, recordedAt);
        row = requireReward(command.issuerId, newRewardId);
      } else {
        row = requireReward(command.issuerId, command.rewardId);
        if (row.version !== command.expectedVersion) fail('VERSION_CONFLICT', 'Reward version changed');
        previousStatus = row.status;
        const nextStatus = { approve: 'approved', post: 'posted', revoke: 'revoked' }[command.action];
        if (!(command.action === 'approve' && row.status === 'pending') &&
            !(command.action === 'post' && row.status === 'approved') &&
            !(command.action === 'revoke' && ['pending', 'approved'].includes(row.status))) {
          fail('INVALID_TRANSITION', 'This reward transition is not allowed');
        }
        const needsBudget = command.action === 'approve' || row.status === 'approved';
        if (needsBudget) {
          const budget = get('SELECT * FROM budgets WHERE issuer_id = ? AND unit_id = ?', row.issuer_id, row.unit_id);
          if (!budget) fail('BUDGET_EXHAUSTED', 'Issuer unit budget is unfunded');
          const amount = BigInt(row.quantity);
          const total = BigInt(budget.total);
          let reserved = BigInt(budget.reserved);
          let spent = BigInt(budget.spent);
          if (command.action === 'approve') {
            if (reserved + spent + amount > total) fail('BUDGET_EXHAUSTED', 'Issuer unit budget is insufficient');
            reserved += amount;
          } else {
            reserved -= amount;
            if (command.action === 'post') spent += amount;
          }
          run('UPDATE budgets SET reserved = ?, spent = ? WHERE issuer_id = ? AND unit_id = ?', reserved.toString(), spent.toString(), row.issuer_id, row.unit_id);
        }
        if (command.action === 'post') {
          for (const [direction, account] of [['debit', 'issuer_budget'], ['credit', 'subject']]) {
            run('INSERT INTO ledger (reward_id, direction, issuer_id, subject_id, unit_id, account, quantity, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
              row.id, direction, row.issuer_id, row.subject_id, row.unit_id, account, row.quantity, recordedAt);
          }
        }
        run('UPDATE rewards SET status = ?, version = version + 1, updated_at = ? WHERE id = ? AND version = ?', nextStatus, recordedAt, row.id, command.expectedVersion);
        row = requireReward(command.issuerId, row.id);
      }
      run('INSERT INTO events (command_id, reward_id, issuer_id, actor_id, action, version, previous_status, status, recorded_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        commandId, row.id, command.issuerId, command.actorId, command.action, row.version, previousStatus, row.status, recordedAt);
      const receipt = {
        kind: 'historical-command-receipt', commandId, issuerId: command.issuerId, actorId: command.actorId,
        action: command.action, idempotencyKey: command.idempotencyKey, recordedAt, reward: rewardFromRow(row),
      };
      run('INSERT INTO command_receipts (issuer_id, idempotency_key, command_id, reward_id, fingerprint, receipt_json) VALUES (?, ?, ?, ?, ?, ?)',
        command.issuerId, command.idempotencyKey, commandId, row.id, fingerprint, JSON.stringify(receipt));
      assertInvariants();
      return receipt;
    });
  }

  return Object.freeze({
    execute,
    getReward({ issuerId, rewardId }) { return read(() => rewardFromRow(requireReward(issuerId, rewardId))); },
    getLedger({ issuerId, rewardId }) {
      return read(() => {
        requireReward(issuerId, rewardId);
        return all('SELECT * FROM ledger WHERE issuer_id = ? AND reward_id = ? ORDER BY direction', issuerId, rewardId).map(ledgerFromRow);
      });
    },
    close() { if (!closed) { db.close(); closed = true; } },
  });
}
