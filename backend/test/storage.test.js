import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { test } from 'node:test';
import { createRewardService, createSqliteRewardRepository } from '../src/index.js';
import { budget, code, fixture, read, submission, testAuthorization, transition } from './helpers.js';

function snapshot(db) {
  return Object.fromEntries(['rewards', 'budgets', 'ledger', 'events', 'command_receipts'].map((table) => [table, db.prepare(`SELECT * FROM ${table}`).all()]));
}

test('file close/reopen preserves exact historical receipts, state, audit and balanced ledger', (t) => {
  const { service, repository, inspect, open } = fixture(t);
  const input = submission();
  const pending = service.submitPending(input);
  const approval = transition(pending);
  const approved = service.approve(approval);
  const posting = transition(approved);
  const posted = service.postCredit(posting);
  const before = snapshot(inspect);
  repository.close();
  const recovered = createRewardService({ repository: open(), issuerAuthorization: testAuthorization, clock: () => { throw Error('replay must not call clock'); } });
  assert.deepEqual(recovered.submitPending(input), pending);
  assert.deepEqual(recovered.approve(approval), approved);
  assert.deepEqual(recovered.postCredit(posting), posted);
  assert.equal(recovered.getReward(read(pending)).status, 'posted');
  assert.deepEqual(snapshot(inspect), before);
});

test('failure after the first ledger line atomically restores reservation and all records', (t) => {
  const { service, inspect } = fixture(t);
  const approved = service.approve(transition(service.submitPending(submission())));
  const input = transition(approved);
  const before = snapshot(inspect);
  inspect.exec("CREATE TRIGGER inject_credit_failure BEFORE INSERT ON ledger WHEN NEW.direction = 'credit' BEGIN SELECT RAISE(ABORT, 'injected credit failure'); END");
  assert.throws(() => service.postCredit(input), code('STORAGE_FAILURE'));
  assert.deepEqual(snapshot(inspect), before);
  assert.equal(service.getReward(read(approved)).status, 'approved');
  assert.deepEqual(budget(inspect), { total: '100', reserved: '10', spent: '0' });
  inspect.exec('DROP TRIGGER inject_credit_failure');
  service.postCredit(input);
  assert.equal(service.getLedger(read(approved)).length, 2);
});

for (const method of ['approve', 'postCredit', 'revoke']) {
  test(`receipt-write failure rolls back ${method}, audit, state and budget together`, (t) => {
    const { service, inspect } = fixture(t);
    const pending = service.submitPending(submission());
    const previous = method === 'approve' ? pending : service.approve(transition(pending));
    const input = transition(previous, { idempotencyKey: `failing-${method}` });
    const before = snapshot(inspect);
    inspect.exec("CREATE TRIGGER inject_receipt_failure BEFORE INSERT ON command_receipts BEGIN SELECT RAISE(ABORT, 'injected receipt failure'); END");
    assert.throws(() => service[method](input), code('STORAGE_FAILURE'));
    assert.deepEqual(snapshot(inspect), before);
    inspect.exec('DROP TRIGGER inject_receipt_failure');
    service[method](input);
  });
}

test('a submit failure leaves neither reward nor a consumed business/request identity', (t) => {
  const { service, inspect } = fixture(t);
  const before = snapshot(inspect);
  inspect.exec("CREATE TRIGGER inject_event_failure BEFORE INSERT ON events BEGIN SELECT RAISE(ABORT, 'injected event failure'); END");
  assert.throws(() => service.submitPending(submission()), code('STORAGE_FAILURE'));
  assert.deepEqual(snapshot(inspect), before);
  inspect.exec('DROP TRIGGER inject_event_failure');
  assert.equal(service.submitPending(submission()).reward.status, 'pending');
});

test('a bounded busy failure acquiring the writer lock does not mutate data', (t) => {
  const { service, inspect, filename } = fixture(t, { busyTimeoutMs: 25 });
  const lock = new DatabaseSync(filename);
  t.after(() => lock.close());
  const before = snapshot(inspect);
  lock.exec('BEGIN IMMEDIATE');
  const start = performance.now();
  assert.throws(() => service.submitPending(submission()), code('STORAGE_BUSY'));
  const elapsed = performance.now() - start;
  lock.exec('ROLLBACK');
  assert.ok(elapsed >= 15 && elapsed < 2000, `bounded lock wait took ${elapsed}ms`);
  assert.deepEqual(snapshot(inspect), before);
  service.submitPending(submission());
});

test('COMMIT failure from a concurrent reader rolls back all prepared changes', (t) => {
  const { service, inspect, filename } = fixture(t, { busyTimeoutMs: 25 });
  const pending = service.submitPending(submission());
  const lock = new DatabaseSync(filename);
  t.after(() => lock.close());
  const before = snapshot(inspect);
  lock.exec('BEGIN');
  lock.prepare('SELECT * FROM rewards').all();
  assert.throws(() => service.approve(transition(pending)), code('STORAGE_BUSY'));
  lock.exec('ROLLBACK');
  assert.deepEqual(snapshot(inspect), before);
  service.approve(transition(pending));
  assert.deepEqual(budget(inspect), { total: '100', reserved: '10', spent: '0' });
});

test('authorized reads expose stable storage errors during an exclusive lock and recover afterward', (t) => {
  const { service, inspect, filename } = fixture(t, { busyTimeoutMs: 25 });
  const pending = service.submitPending(submission());
  const before = snapshot(inspect);
  const lock = new DatabaseSync(filename);
  t.after(() => lock.close());
  lock.exec('BEGIN EXCLUSIVE');
  try {
    for (const method of ['getReward', 'getLedger']) {
      assert.throws(() => service[method](read(pending)), (error) => error.name === 'RewardError' && error.code === 'STORAGE_BUSY');
    }
  } finally {
    lock.exec('ROLLBACK');
  }
  assert.equal(service.getReward(read(pending)).status, 'pending');
  assert.deepEqual(service.getLedger(read(pending)), []);
  assert.deepEqual(snapshot(inspect), before);
});

test('schema constraints protect audit, ledger, receipts, reward identity and terminal states', (t) => {
  const { service, inspect } = fixture(t);
  const pending = service.submitPending(submission());
  const approved = service.approve(transition(pending));
  service.postCredit(transition(approved));
  for (const table of ['ledger', 'events', 'command_receipts', 'rewards']) {
    assert.throws(() => inspect.exec(`DELETE FROM ${table}`));
  }
  for (const [table, field, value] of [['ledger', 'quantity', "'11'"], ['events', 'actor_id', "'forged'"], ['command_receipts', 'receipt_json', "'{}'"], ['rewards', 'subject_id', "'changed'"]]) {
    assert.throws(() => inspect.exec(`UPDATE ${table} SET ${field} = ${value}`));
  }
  assert.throws(() => inspect.exec("UPDATE rewards SET status = 'revoked', version = 3"));
  assert.throws(() => inspect.exec("UPDATE budgets SET total = '999'"));
  assert.throws(() => inspect.exec("UPDATE budgets SET reserved = '-1'"));
  assert.throws(() => inspect.exec("UPDATE budgets SET spent = '101'"));
  assert.throws(() => inspect.exec("INSERT INTO budgets VALUES ('bad', 'unit', '01', '0', '0')"));
  assert.equal(inspect.prepare('SELECT count(*) AS n FROM ledger').get().n, 2);
});

test('unknown version, missing trigger, unrelated schema and corrupt files fail rather than reset', (t) => {
  const { repository, inspect, filename } = fixture(t);
  repository.close();
  inspect.exec('PRAGMA user_version = 99');
  assert.throws(() => createSqliteRewardRepository({ filename }), code('UNKNOWN_SCHEMA'));
  inspect.exec('PRAGMA user_version = 1; DROP TRIGGER ledger_no_delete');
  assert.throws(() => createSqliteRewardRepository({ filename }), code('UNKNOWN_SCHEMA'));
  const unrelated = `${filename}.unrelated`;
  const other = new DatabaseSync(unrelated);
  other.exec('CREATE TABLE unrelated (value TEXT)');
  other.close();
  assert.throws(() => createSqliteRewardRepository({ filename: unrelated }), code('UNKNOWN_SCHEMA'));
  const corrupt = `${filename}.corrupt`;
  writeFileSync(corrupt, 'This is synthetic non-SQLite data.');
  assert.throws(() => createSqliteRewardRepository({ filename: corrupt }));
  assert.throws(() => createSqliteRewardRepository({ filename: join(filename, 'missing', 'db.sqlite') }));
});

test('inconsistent committed counters are detected on open instead of being repaired', (t) => {
  const { repository, inspect, filename } = fixture(t);
  repository.close();
  inspect.exec("UPDATE budgets SET reserved = '1'");
  assert.throws(() => createSqliteRewardRepository({ filename }), code('INVARIANT_VIOLATION'));
  assert.equal(budget(inspect).reserved, '1', 'opening must not rewrite invalid data');
});

test('invalid asynchronous clock fails atomically and closed storage never falls back to memory', (t) => {
  const { repository, inspect } = fixture(t);
  const service = createRewardService({ repository, issuerAuthorization: testAuthorization, clock: async () => '2026-01-01T00:00:00.000Z' });
  assert.throws(() => service.submitPending(submission()), code('INVALID_CLOCK'));
  const throwingClock = createRewardService({ repository, issuerAuthorization: testAuthorization, clock: () => { throw null; } });
  assert.throws(() => throwingClock.submitPending(submission()), code('STORAGE_FAILURE'));
  assert.equal(inspect.prepare('SELECT count(*) AS n FROM rewards').get().n, 0);
  repository.close();
  assert.throws(() => service.submitPending(submission()), code('REPOSITORY_CLOSED'));
});

test('a canonical but mismatched persisted command fingerprint fails startup validation', (t) => {
  const { service, repository, inspect, filename } = fixture(t);
  service.submitPending(submission());
  repository.close();
  const originalTrigger = inspect.prepare("SELECT sql FROM sqlite_schema WHERE name = 'command_receipts_no_update'").get().sql;
  const row = inspect.prepare('SELECT fingerprint FROM command_receipts').get();
  const altered = JSON.parse(row.fingerprint);
  altered.quantity = '11';
  // Simulate storage tampering, then restore the exact recognized schema.
  inspect.exec('DROP TRIGGER command_receipts_no_update');
  inspect.prepare('UPDATE command_receipts SET fingerprint = ?').run(JSON.stringify(altered));
  inspect.exec(originalTrigger);
  assert.throws(() => createSqliteRewardRepository({ filename }), code('INVARIANT_VIOLATION'));
});

test('an unrelated WAL database retains journal mode and data after schema rejection', (t) => {
  const { filename } = fixture(t);
  const otherFile = `${filename}.wal-unrelated`;
  const other = new DatabaseSync(otherFile);
  t.after(() => other.close());
  other.exec("PRAGMA journal_mode = WAL; CREATE TABLE unrelated (value TEXT); INSERT INTO unrelated VALUES ('synthetic-existing-data')");
  assert.throws(() => createSqliteRewardRepository({ filename: otherFile }), code('UNKNOWN_SCHEMA'));
  assert.equal(other.prepare('PRAGMA journal_mode').get().journal_mode, 'wal');
  assert.equal(other.prepare('SELECT value FROM unrelated').get().value, 'synthetic-existing-data');
});

test('sqliteX-prefixed user tables do not make an unrelated WAL database appear empty', (t) => {
  const { filename } = fixture(t);
  const otherFile = `${filename}.prefix-unrelated`;
  const other = new DatabaseSync(otherFile);
  t.after(() => other.close());
  other.exec("PRAGMA journal_mode = WAL; CREATE TABLE sqliteX_custom (value TEXT); INSERT INTO sqliteX_custom VALUES ('synthetic-preserved-data')");
  assert.throws(() => createSqliteRewardRepository({ filename: otherFile }), code('UNKNOWN_SCHEMA'));
  assert.equal(other.prepare('PRAGMA journal_mode').get().journal_mode, 'wal');
  assert.equal(other.prepare('PRAGMA user_version').get().user_version, 0);
  assert.equal(other.prepare('PRAGMA application_id').get().application_id, 0);
  assert.equal(other.prepare('SELECT value FROM sqliteX_custom').get().value, 'synthetic-preserved-data');
  assert.deepEqual(other.prepare("SELECT name FROM sqlite_schema WHERE type = 'table'").all().map((row) => row.name), ['sqliteX_custom']);
});

test('an extra sqliteX-prefixed object is rejected in a known reward database', (t) => {
  const { service, repository, inspect, filename } = fixture(t);
  const pending = service.submitPending(submission());
  repository.close();
  inspect.exec('PRAGMA journal_mode = WAL; CREATE TABLE sqliteX_extra (value TEXT)');
  const before = snapshot(inspect);
  assert.throws(() => createSqliteRewardRepository({ filename }), code('UNKNOWN_SCHEMA'));
  assert.equal(inspect.prepare('PRAGMA journal_mode').get().journal_mode, 'wal');
  assert.deepEqual(snapshot(inspect), before);
  assert.equal(inspect.prepare('SELECT id FROM rewards').get().id, pending.reward.id);
});
