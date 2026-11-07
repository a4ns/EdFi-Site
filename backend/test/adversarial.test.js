import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { writeFileSync, readFileSync, mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createRewardService, createSqliteRewardRepository } from '../src/index.js';
import {
  authorize, fixture, submission, transition, readInput, rejected,
  snapshot, budget, assertLedger, race, crashPost, ISSUER, OTHER_ISSUER, UNIT, NOW,
} from './adversarial-helpers.js';

test('current authorization is required for historical replay and every read', t => {
  let enabled = true;
  const f = fixture(t, { total: '20', issuerAuthorization: request => enabled ? authorize(request) : { allowed: false } });
  const input = submission();
  const pending = f.service.submitPending(input);
  const approvalInput = transition(pending, 'approve-1');
  const approved = f.service.approve(approvalInput);
  const postInput = transition(approved, 'post-1');
  f.service.postCredit(postInput);
  const before = snapshot(f.inspector);
  enabled = false;
  for (const operation of [
    () => f.service.submitPending(input),
    () => f.service.approve(approvalInput),
    () => f.service.postCredit(postInput),
    () => f.service.getReward(readInput(pending)),
    () => f.service.getLedger(readInput(pending)),
  ]) {
    const error = rejected(operation);
    assert.doesNotMatch(JSON.stringify(error) + error.message, /synthetic-subject-secret-marker|synthetic-evidence-secret-marker/);
  }
  assert.deepEqual(snapshot(f.inspector), before);
});

test('default, malformed, throwing, asynchronous and mismatched adapters fail closed', t => {
  const f = fixture(t);
  const before = snapshot(f.inspector);
  const adapters = [
    undefined,
    () => undefined,
    () => true,
    () => ({ allowed: true }),
    () => { throw new Error('untrusted adapter failure'); },
    request => Promise.resolve(authorize(request)),
    () => Promise.reject(new Error('synthetic rejected authorization promise')),
    request => ({ ...authorize(request), then() {} }),
    request => ({ ...authorize(request), action: 'unknown-action' }),
    request => ({ ...authorize(request), issuerId: OTHER_ISSUER }),
    request => ({ ...authorize(request), resource: { subjectId: 'different', sourceResultId: 'different' } }),
    request => ({ ...authorize(request), get allowed() { throw new Error('accessor failure'); } }),
  ];
  for (const issuerAuthorization of adapters) {
    const service = createRewardService({ repository: f.repository, issuerAuthorization, clock: () => NOW });
    rejected(() => service.submitPending(submission()));
    assert.deepEqual(snapshot(f.inspector), before);
  }
});

test('same key and source identifier are isolated by issuer, with no cross-issuer read or transition', t => {
  const f = fixture(t, { total: '50' });
  f.inspector.prepare('INSERT INTO budgets (issuer_id, unit_id, total) VALUES (?, ?, ?)').run(OTHER_ISSUER, UNIT, '50');
  const a = f.service.submitPending(submission());
  const b = f.service.submitPending(submission({ issuerId: OTHER_ISSUER, context: 'session-b', quantity: '9' }));
  assert.notEqual(a.reward.id, b.reward.id);
  const ap = f.service.postCredit(transition(f.service.approve(transition(a, 'approve-1')), 'post-1'));
  const bp = f.service.postCredit(transition(f.service.approve(transition(b, 'approve-1')), 'post-1'));
  assertLedger(f.service.getLedger(readInput(ap)), ap.reward);
  assertLedger(f.service.getLedger(readInput(bp)), bp.reward);
  const before = snapshot(f.inspector);
  for (const operation of [
    () => f.service.getReward(readInput(ap, { issuerId: OTHER_ISSUER, context: 'session-b' })),
    () => f.service.getLedger(readInput(ap, { issuerId: OTHER_ISSUER, context: 'session-b' })),
    () => f.service.revoke(transition(ap, 'revoke-cross', { issuerId: OTHER_ISSUER, context: 'session-b' })),
    () => f.service.getReward(readInput(ap, { context: 'session-b' })),
  ]) {
    const error = rejected(operation);
    assert.doesNotMatch(JSON.stringify(error) + error.message, /synthetic-subject-secret-marker|synthetic-evidence-secret-marker/);
  }
  assert.deepEqual(snapshot(f.inspector), before);
  assert.deepEqual(budget(f.inspector), { total: '50', reserved: '0', spent: '7' });
  assert.deepEqual(budget(f.inspector, OTHER_ISSUER), { total: '50', reserved: '0', spent: '9' });
});

test('fingerprints bind actor, action, immutable payload and expected version; exact replay precedes live version check', t => {
  const f = fixture(t, { total: '20' });
  const input = submission();
  const pending = f.service.submitPending(input);
  const approvalInput = transition(pending, 'approve-1');
  const approved = f.service.approve(approvalInput);
  const posted = f.service.postCredit(transition(approved, 'post-1'));
  const before = snapshot(f.inspector);
  assert.deepEqual(f.service.submitPending(input), pending);
  assert.deepEqual(f.service.approve(approvalInput), approved);
  assert.equal(f.service.getReward(readInput(posted)).status, 'posted');
  for (const operation of [
    () => f.service.submitPending({ ...input, context: 'session-a2' }),
    () => f.service.submitPending({ ...input, quantity: '8' }),
    () => f.service.submitPending({ ...input, subjectId: 'different-subject' }),
    () => f.service.submitPending({ ...input, evidenceRef: 'different-evidence' }),
    () => f.service.submitPending({ ...input, unitId: 'different-unit' }),
    () => f.service.approve({ ...approvalInput, expectedVersion: approved.reward.version }),
    () => f.service.revoke({ ...approvalInput }),
    () => f.service.approve(transition(pending, input.idempotencyKey)),
    () => f.service.submitPending({ ...input, idempotencyKey: 'new-key-same-result' }),
  ]) rejected(operation);
  assert.deepEqual(snapshot(f.inspector), before);
});

test('exact replay remains historical after repository and service restart', t => {
  const f = fixture(t, { total: '20' });
  const input = submission();
  const pending = f.service.submitPending(input);
  const approvalInput = transition(pending, 'approve-1');
  const approved = f.service.approve(approvalInput);
  const postInput = transition(approved, 'post-1');
  const posted = f.service.postCredit(postInput);
  const before = snapshot(f.inspector);
  f.close();
  const restarted = fixture(t, { filename: f.filename });
  assert.deepEqual(restarted.service.submitPending(input), pending);
  assert.deepEqual(restarted.service.approve(approvalInput), approved);
  assert.deepEqual(restarted.service.postCredit(postInput), posted);
  assert.deepEqual(snapshot(restarted.inspector), before);
});

test('no budget and wrong-unit budget are zero; rejected approval is completely atomic', t => {
  const f = fixture(t, { total: '50' });
  const pending = f.service.submitPending(submission({ unitId: 'unfunded-unit' }));
  const before = snapshot(f.inspector);
  rejected(() => f.service.approve(transition(pending, 'approve-unfunded')));
  assert.deepEqual(snapshot(f.inspector), before);
  assert.deepEqual(budget(f.inspector), { total: '50', reserved: '0', spent: '0' });
  assert.deepEqual(budget(f.inspector, ISSUER, 'unfunded-unit'), { total: '0', reserved: '0', spent: '0' });
});

test('128-digit quantities preserve exact reserves, spending and release above signed 64-bit', t => {
  const total = '9'.repeat(128);
  const large = (BigInt(total) - 13n).toString();
  const f = fixture(t, { total });
  const first = f.service.submitPending(submission({ quantity: large }));
  const approved = f.service.approve(transition(first, 'approve-large'));
  assert.deepEqual(budget(f.inspector), { total, reserved: large, spent: '0' });
  const second = f.service.submitPending(submission({ quantity: '14', sourceResultId: 'result-2', idempotencyKey: 'submit-2' }));
  const before = snapshot(f.inspector);
  rejected(() => f.service.approve(transition(second, 'approve-over-budget')));
  assert.deepEqual(snapshot(f.inspector), before);
  f.service.revoke(transition(approved, 'release-large'));
  assert.deepEqual(budget(f.inspector), { total, reserved: '0', spent: '0' });
  const third = f.service.submitPending(submission({ quantity: total, sourceResultId: 'result-3', idempotencyKey: 'submit-3' }));
  const posted = f.service.postCredit(transition(f.service.approve(transition(third, 'approve-all')), 'post-all'));
  assert.deepEqual(budget(f.inspector), { total, reserved: '0', spent: total });
  assertLedger(f.service.getLedger(readInput(posted)), posted.reward);
});

test('noncanonical, nonstring and oversized quantities cannot leave receipts or rewards', t => {
  const f = fixture(t);
  const before = snapshot(f.inspector);
  for (const quantity of ['0', '00', '01', '-1', '+1', ' 1', '1 ', '1.0', '1e3', '1_000', '１', '1\n', '9'.repeat(129), 1, 1n, NaN, Infinity, null]) {
    rejected(() => f.service.submitPending(submission({ quantity })));
    assert.deepEqual(snapshot(f.inspector), before);
  }
});

test('two competing approvals cannot jointly reserve more than total budget', { timeout: 20_000 }, async t => {
  const f = fixture(t, { total: '10' });
  const a = f.service.submitPending(submission());
  const b = f.service.submitPending(submission({ sourceResultId: 'result-b', idempotencyKey: 'submit-b' }));
  const outcomes = await race(f.filename, [
    { method: 'approve', input: transition(a, 'approve-a') },
    { method: 'approve', input: transition(b, 'approve-b') },
  ]);
  assert.equal(outcomes.filter(result => result.ok).length, 1, JSON.stringify(outcomes));
  assert.deepEqual(budget(f.inspector), { total: '10', reserved: '7', spent: '0' });
  const states = [a, b].map(receipt => f.service.getReward(readInput(receipt)).status).sort();
  assert.deepEqual(states, ['approved', 'pending']);
  const rows = snapshot(f.inspector);
  assert.equal(rows.command_receipts.length, 3);
  assert.equal(rows.events.length, 3);
  assert.equal(rows.ledger.length, 0);
});

test('simultaneous post and revoke result in one terminal state and one coherent budget', { timeout: 20_000 }, async t => {
  const f = fixture(t, { total: '10' });
  const approved = f.service.approve(transition(f.service.submitPending(submission()), 'approve-1'));
  const outcomes = await race(f.filename, [
    { method: 'postCredit', input: transition(approved, 'post-race') },
    { method: 'revoke', input: transition(approved, 'revoke-race') },
  ]);
  assert.equal(outcomes.filter(result => result.ok).length, 1, JSON.stringify(outcomes));
  const reward = f.service.getReward(readInput(approved));
  assert.ok(['posted', 'revoked'].includes(reward.status));
  assert.equal(reward.version, approved.reward.version + 1);
  const ledger = f.service.getLedger(readInput(approved));
  assert.deepEqual(budget(f.inspector), { total: '10', reserved: '0', spent: reward.status === 'posted' ? '7' : '0' });
  if (reward.status === 'posted') assertLedger(ledger, reward);
  else assert.deepEqual(ledger, []);
  const rows = snapshot(f.inspector);
  assert.equal(rows.events.length, 3);
  assert.equal(rows.command_receipts.length, 3);
});

test('simultaneous duplicate posts under different keys create exactly one pair', { timeout: 20_000 }, async t => {
  const f = fixture(t, { total: '10' });
  const approved = f.service.approve(transition(f.service.submitPending(submission()), 'approve-1'));
  const outcomes = await race(f.filename, ['post-a', 'post-b'].map(key => ({ method: 'postCredit', input: transition(approved, key) })));
  assert.equal(outcomes.filter(result => result.ok).length, 1, JSON.stringify(outcomes));
  assertLedger(f.service.getLedger(readInput(approved)), approved.reward);
  assert.deepEqual(budget(f.inspector), { total: '10', reserved: '0', spent: '7' });
  const rows = snapshot(f.inspector);
  assert.equal(rows.events.length, 3);
  assert.equal(rows.command_receipts.length, 3);
});

test('simultaneous exact post retries return the same historical receipt and one ledger pair', { timeout: 20_000 }, async t => {
  const f = fixture(t, { total: '10' });
  const approved = f.service.approve(transition(f.service.submitPending(submission()), 'approve-1'));
  const command = { method: 'postCredit', input: transition(approved, 'post-shared-key') };
  const outcomes = await race(f.filename, [command, command]);
  assert.equal(outcomes.filter(result => result.ok).length, 2, JSON.stringify(outcomes));
  assert.deepEqual(outcomes[0].receipt, outcomes[1].receipt);
  assertLedger(f.service.getLedger(readInput(approved)), approved.reward);
  assert.deepEqual(budget(f.inspector), { total: '10', reserved: '0', spent: '7' });
  const rows = snapshot(f.inspector);
  assert.equal(rows.events.length, 3);
  assert.equal(rows.command_receipts.length, 3);
});

test('post and revoke are terminal, including new keys and current versions', t => {
  const f = fixture(t, { total: '20' });
  const posted = f.service.postCredit(transition(f.service.approve(transition(f.service.submitPending(submission()), 'approve-1')), 'post-1'));
  const revoked = f.service.revoke(transition(f.service.submitPending(submission({ sourceResultId: 'result-b', idempotencyKey: 'submit-b' })), 'revoke-b'));
  const before = snapshot(f.inspector);
  for (const receipt of [posted, revoked]) {
    for (const method of ['approve', 'postCredit', 'revoke']) {
      rejected(() => f.service[method](transition(receipt, `${method}-${receipt.reward.status}`)));
    }
  }
  assert.deepEqual(snapshot(f.inspector), before);
  assertLedger(f.service.getLedger(readInput(posted)), posted.reward);
  assert.deepEqual(f.service.getLedger(readInput(revoked)), []);
});

test('failure on final receipt insertion rolls back approval reservation and allows same-key retry', t => {
  const f = fixture(t, { total: '20' });
  const pending = f.service.submitPending(submission());
  const input = transition(pending, 'approve-1');
  const before = snapshot(f.inspector);
  f.inspector.exec("CREATE TRIGGER independent_abort_receipt BEFORE INSERT ON command_receipts BEGIN SELECT RAISE(ABORT, 'synthetic receipt failure'); END");
  rejected(() => f.service.approve(input));
  assert.deepEqual(snapshot(f.inspector), before);
  f.inspector.exec('DROP TRIGGER independent_abort_receipt');
  const approved = f.service.approve(input);
  assert.equal(approved.reward.status, 'approved');
  assert.deepEqual(budget(f.inspector), { total: '20', reserved: '7', spent: '0' });
});

test('failure on second ledger side and final post receipt leaves no partial effect', t => {
  for (const stage of ['ledger', 'command_receipts']) {
    const f = fixture(t, { total: '20' });
    const approved = f.service.approve(transition(f.service.submitPending(submission()), 'approve-1'));
    const input = transition(approved, 'post-1');
    const before = snapshot(f.inspector);
    const condition = stage === 'ledger' ? 'WHEN (SELECT COUNT(*) FROM ledger) = 1' : '';
    f.inspector.exec(`CREATE TRIGGER independent_abort_write BEFORE INSERT ON ${stage} ${condition} BEGIN SELECT RAISE(ABORT, 'synthetic late-write failure'); END`);
    rejected(() => f.service.postCredit(input));
    assert.deepEqual(snapshot(f.inspector), before);
    f.inspector.exec('DROP TRIGGER independent_abort_write');
    const posted = f.service.postCredit(input);
    assertLedger(f.service.getLedger(readInput(posted)), posted.reward);
    assert.deepEqual(budget(f.inspector), { total: '20', reserved: '0', spent: '7' });
  }
});

test('failed approved revoke does not release budget or record a receipt', t => {
  const f = fixture(t, { total: '20' });
  const approved = f.service.approve(transition(f.service.submitPending(submission()), 'approve-1'));
  const input = transition(approved, 'revoke-1');
  const before = snapshot(f.inspector);
  f.inspector.exec("CREATE TRIGGER independent_abort_revoke BEFORE INSERT ON command_receipts BEGIN SELECT RAISE(ABORT, 'synthetic revoke failure'); END");
  rejected(() => f.service.revoke(input));
  assert.deepEqual(snapshot(f.inspector), before);
  f.inspector.exec('DROP TRIGGER independent_abort_revoke');
  const revoked = f.service.revoke(input);
  assert.equal(revoked.reward.status, 'revoked');
  assert.deepEqual(budget(f.inspector), { total: '20', reserved: '0', spent: '0' });
});

test('unknown schema fails closed without replacing unrelated records', t => {
  const f = fixture(t);
  f.inspector.exec('CREATE TABLE unrelated_private_records (value TEXT)');
  f.inspector.exec("INSERT INTO unrelated_private_records VALUES ('synthetic-preserve-me')");
  f.close();
  rejected(() => createSqliteRewardRepository({ filename: f.filename }));
  const reader = new DatabaseSync(f.filename);
  try {
    assert.equal(reader.prepare('SELECT value FROM unrelated_private_records').get().value, 'synthetic-preserve-me');
  } finally { reader.close(); }
});

test('malformed database bytes fail closed and are preserved', t => {
  const directory = mkdtempSync(join(tmpdir(), 'edfi-corrupt-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const filename = join(directory, 'corrupt.sqlite');
  const content = Buffer.from('This is deliberately not a SQLite database.\n');
  writeFileSync(filename, content);
  rejected(() => createSqliteRewardRepository({ filename }));
  assert.deepEqual(readFileSync(filename), content);
});

test('refusing an unknown WAL database preserves its original journal configuration', t => {
  const directory = mkdtempSync(join(tmpdir(), 'edfi-unknown-wal-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const filename = join(directory, 'unknown.sqlite');
  const db = new DatabaseSync(filename);
  db.exec("PRAGMA journal_mode=WAL; CREATE TABLE synthetic_other_app (value TEXT); INSERT INTO synthetic_other_app VALUES ('preserve');");
  db.close();
  rejected(() => createSqliteRewardRepository({ filename }));
  const reader = new DatabaseSync(filename);
  try {
    assert.equal(reader.prepare('PRAGMA journal_mode').get().journal_mode, 'wal');
    assert.equal(reader.prepare('SELECT value FROM synthetic_other_app').get().value, 'preserve');
  } finally { reader.close(); }
});

test('lock timeout is bounded and failure leaves no command effects', t => {
  const f = fixture(t, { total: '20' });
  const pending = f.service.submitPending(submission());
  const before = snapshot(f.inspector);
  f.inspector.exec('BEGIN IMMEDIATE');
  const started = performance.now();
  try {
    rejected(() => f.service.approve(transition(pending, 'approve-locked')));
    assert.ok(performance.now() - started < 3000, 'Lock wait remains bounded');
  } finally { f.inspector.exec('ROLLBACK'); }
  assert.deepEqual(snapshot(f.inspector), before);
  const approved = f.service.approve(transition(pending, 'approve-locked'));
  assert.equal(approved.reward.status, 'approved');
});

test('adapter uses DELETE, EXTRA, foreign keys, strict tables and requested bounded timeout', t => {
  const directory = mkdtempSync(join(tmpdir(), 'edfi-config-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const filename = join(directory, 'config.sqlite');
  const originalExec = DatabaseSync.prototype.exec;
  let connection;
  let repository;
  DatabaseSync.prototype.exec = function (...args) {
    connection = this;
    return Reflect.apply(originalExec, this, args);
  };
  try {
    repository = createSqliteRewardRepository({ filename, busyTimeoutMs: 123 });
  } finally {
    DatabaseSync.prototype.exec = originalExec;
  }
  t.after(() => repository?.close());
  assert.ok(connection, 'Observe the repository connection at the SQLite API boundary');
  assert.equal(connection.prepare('PRAGMA journal_mode').get().journal_mode, 'delete');
  assert.equal(connection.prepare('PRAGMA synchronous').get().synchronous, 3);
  assert.equal(connection.prepare('PRAGMA foreign_keys').get().foreign_keys, 1);
  assert.equal(connection.prepare('PRAGMA busy_timeout').get().timeout, 123);
  for (const table of connection.prepare('PRAGMA table_list').all().filter(row => !row.name.startsWith('sqlite_'))) {
    assert.equal(table.strict, 1, `${table.name} must be a STRICT table`);
  }
  assert.deepEqual(connection.prepare('PRAGMA foreign_key_check').all(), []);
});

test('committed ledger, audit, receipt and reward identity reject direct mutation', t => {
  const f = fixture(t, { total: '20' });
  const posted = f.service.postCredit(transition(f.service.approve(transition(f.service.submitPending(submission()), 'approve-1')), 'post-1'));
  const before = snapshot(f.inspector);
  for (const sql of [
    "UPDATE rewards SET quantity='8'",
    "UPDATE rewards SET issuer_id='other-issuer'",
    "UPDATE rewards SET subject_id='other-subject'",
    "UPDATE rewards SET source_result_id='other-source'",
    "UPDATE rewards SET evidence_ref='other-evidence'",
    "UPDATE rewards SET unit_id='other-unit'",
    'DELETE FROM rewards',
    "UPDATE ledger SET quantity='8'",
    'DELETE FROM ledger',
    'UPDATE events SET command_id=command_id',
    'DELETE FROM events',
    'UPDATE command_receipts SET command_id=command_id',
    'DELETE FROM command_receipts',
  ]) {
    rejected(() => f.inspector.exec(sql));
    assert.deepEqual(snapshot(f.inspector), before);
  }
  assertLedger(f.service.getLedger(readInput(posted)), posted.reward);
});

test('SIGKILL between writes or immediately after COMMIT recovers one atomic posting', { timeout: 30_000 }, async t => {
  for (const point of ['budgets', 'ledger', 'rewards', 'events', 'command_receipts', 'commit']) {
    await t.test(`process killed after ${point}`, async t => {
      const f = fixture(t, { total: '20' });
      const approved = f.service.approve(transition(f.service.submitPending(submission()), 'approve-1'));
      const input = transition(approved, 'post-crash');
      const before = snapshot(f.inspector);
      f.close();
      const result = await crashPost(f.filename, point, input);
      assert.equal(result.signal, 'SIGKILL', JSON.stringify(result));
      assert.match(result.stdout, new RegExp(`reached:${point}`));
      const recovered = fixture(t, { filename: f.filename });
      const recoveredRows = snapshot(recovered.inspector);
      const current = recovered.service.getReward(readInput(approved));
      if (point === 'commit') {
        assert.equal(current.status, 'posted');
        assert.equal(recoveredRows.events.length, before.events.length + 1);
        assert.equal(recoveredRows.command_receipts.length, before.command_receipts.length + 1);
        assertLedger(recovered.service.getLedger(readInput(approved)), approved.reward);
      } else {
        assert.deepEqual(recoveredRows, before, `Uncommitted ${point} write must roll back`);
        assert.equal(current.status, 'approved');
      }
      const posted = recovered.service.postCredit(input);
      const after = snapshot(recovered.inspector);
      assert.equal(posted.reward.status, 'posted');
      assert.deepEqual(recovered.service.postCredit(input), posted);
      assert.deepEqual(snapshot(recovered.inspector), after);
      assertLedger(recovered.service.getLedger(readInput(posted)), posted.reward);
      assert.deepEqual(budget(recovered.inspector), { total: '20', reserved: '0', spent: '7' });
      assert.equal(after.events.length, 3);
      assert.equal(after.command_receipts.length, 3);
    });
  }
});
