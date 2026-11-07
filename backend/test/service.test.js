import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createRewardService } from '../src/index.js';
import { budget, code, fixture, read, submission, testAuthorization, transition, UNIT } from './helpers.js';

test('pending, approval and posting produce one immutable historical receipt per command', (t) => {
  let tick = 0;
  const { service, inspect } = fixture(t, { clock: () => `2026-01-01T00:00:0${tick++}.000Z` });
  const pending = service.submitPending(submission());
  assert.equal(pending.reward.status, 'pending');
  assert.equal(pending.reward.version, 1);
  assert.deepEqual(service.getLedger(read(pending)), []);
  const approved = service.approve(transition(pending));
  assert.equal(approved.reward.status, 'approved');
  assert.deepEqual(budget(inspect), { total: '100', reserved: '10', spent: '0' });
  assert.deepEqual(service.getLedger(read(pending)), []);
  const posted = service.postCredit(transition(approved));
  assert.equal(posted.reward.status, 'posted');
  assert.equal(posted.reward.version, 3);
  assert.deepEqual(budget(inspect), { total: '100', reserved: '0', spent: '10' });
  const ledger = service.getLedger(read(pending));
  assert.equal(ledger.length, 2);
  assert.equal(ledger.reduce((sum, line) => sum + BigInt(line.quantity) * (line.direction === 'debit' ? -1n : 1n), 0n), 0n);
  assert.deepEqual(service.submitPending(submission()), pending);
  assert.deepEqual(service.approve(transition(pending)), approved);
  assert.deepEqual(service.postCredit(transition(approved)), posted);
  assert.equal(tick, 3, 'replays do not create fresh timestamps or IDs');
  assert.equal(pending.kind, 'historical-command-receipt');
  assert.equal(pending.reward.status, 'pending', 'replay remains an explicitly historical snapshot');
  assert.equal(service.getReward(read(pending)).status, 'posted');
  assert.throws(() => { posted.reward.quantity = '900'; }, TypeError);
  assert.throws(() => { ledger.push({}); }, TypeError);
  for (const method of ['approve', 'postCredit', 'revoke']) {
    assert.throws(() => service[method](transition(posted, { idempotencyKey: `terminal-${method}` })), code('INVALID_TRANSITION'));
  }
});

test('revocation is terminal, approval reserves budget and pre-post revocation releases it', (t) => {
  const { service, inspect } = fixture(t, { total: '10' });
  const pending = service.submitPending(submission());
  const revoked = service.revoke(transition(pending));
  assert.equal(revoked.reward.status, 'revoked');
  assert.deepEqual(budget(inspect), { total: '10', reserved: '0', spent: '0' });
  for (const method of ['approve', 'postCredit', 'revoke']) {
    assert.throws(() => service[method](transition(revoked, { idempotencyKey: `revoked-${method}` })), code('INVALID_TRANSITION'));
  }
  const a = service.submitPending(submission({ sourceResultId: 'result-2', idempotencyKey: 'submit-2' }));
  const b = service.submitPending(submission({ sourceResultId: 'result-3', idempotencyKey: 'submit-3' }));
  const approved = service.approve(transition(a, { idempotencyKey: 'approve-2' }));
  assert.throws(() => service.approve(transition(b, { idempotencyKey: 'approve-3' })), code('BUDGET_EXHAUSTED'));
  service.revoke(transition(approved, { idempotencyKey: 'revoke-2' }));
  service.approve(transition(b, { idempotencyKey: 'approve-3' }));
  assert.deepEqual(budget(inspect), { total: '10', reserved: '10', spent: '0' });
});

for (const total of [null, '0']) {
  test(`default/unfunded budget (${total}) denies approval`, (t) => {
    const { service } = fixture(t, { total });
    const pending = service.submitPending(submission());
    assert.throws(() => service.approve(transition(pending)), code('BUDGET_EXHAUSTED'));
    assert.equal(service.getReward(read(pending)).status, 'pending');
  });
}

test('posting pending fails, expected version is required, stale writes conflict', (t) => {
  const { service } = fixture(t);
  const pending = service.submitPending(submission());
  assert.throws(() => service.postCredit(transition(pending)), code('INVALID_TRANSITION'));
  assert.throws(() => service.approve(transition(pending, { expectedVersion: undefined })), code('INVALID_INPUT'));
  const approved = service.approve(transition(pending));
  assert.throws(() => service.revoke(transition(pending, { idempotencyKey: 'stale-revoke' })), code('VERSION_CONFLICT'));
  assert.throws(() => service.approve(transition(approved)), code('INVALID_TRANSITION'));
});

test('business result replay is issuer-wide, even with new subject or request key', (t) => {
  const { service } = fixture(t);
  service.submitPending(submission());
  assert.throws(() => service.submitPending(submission({ subjectId: 'synthetic-subject-2', idempotencyKey: 'submit-2' })), code('DUPLICATE_RESULT'));
  const other = service.submitPending(submission({ issuerId: 'issuer-b', context: { session: 'issuer-b' } }));
  assert.equal(other.reward.issuerId, 'issuer-b');
});

test('issuer-wide idempotency binds every meaningful field, actor, action and expected version', (t) => {
  const { service } = fixture(t);
  const input = submission();
  const pending = service.submitPending(input);
  for (const change of [
    { subjectId: 'subject-2' }, { sourceResultId: 'result-2' }, { evidenceRef: 'evidence-2' },
    { quantity: '11' }, { unitId: 'synthetic-other-unit' }, { context: { session: 'issuer-a', secondActor: true } },
  ]) assert.throws(() => service.submitPending({ ...input, ...change }), code('IDEMPOTENCY_CONFLICT'));
  assert.throws(() => service.approve(transition(pending, { idempotencyKey: input.idempotencyKey })), code('IDEMPOTENCY_CONFLICT'));
  service.approve(transition(pending));
  assert.throws(() => service.approve(transition(pending, { expectedVersion: 2 })), code('IDEMPOTENCY_CONFLICT'));
});

test('exact BigInt quantities beyond 64-bit survive reservation, posting and budget exhaustion', (t) => {
  const amount = '12345678901234567890123456789012345678901234567890';
  const { service, inspect } = fixture(t, { total: amount });
  const pending = service.submitPending(submission({ quantity: amount }));
  const approved = service.approve(transition(pending));
  assert.equal(budget(inspect).reserved, amount);
  service.postCredit(transition(approved));
  assert.deepEqual(budget(inspect), { total: amount, reserved: '0', spent: amount });
  const extra = service.submitPending(submission({ sourceResultId: 'extra', idempotencyKey: 'extra' }));
  assert.throws(() => service.approve(transition(extra, { idempotencyKey: 'extra-approval' })), code('BUDGET_EXHAUSTED'));
});

test('quantity, identifier, version and unexpected-field validation is strict', (t) => {
  const { service } = fixture(t);
  for (const value of [0, 1, 10n, '', '0', '-1', '+1', '01', '1.0', '1e3', ' 1', '1 ', '9'.repeat(129)]) {
    assert.throws(() => service.submitPending(submission({ quantity: value })), code('INVALID_INPUT'));
  }
  for (const value of ['', ' ', 'a'.repeat(129), 'line\nbreak']) {
    assert.throws(() => service.submitPending(submission({ idempotencyKey: value })), code('INVALID_INPUT'));
  }
  assert.throws(() => service.submitPending(submission({ actorId: 'forged-actor' })), code('INVALID_INPUT'));
  assert.throws(() => service.submitPending(submission({ status: 'posted' })), code('INVALID_INPUT'));
  const max = service.submitPending(submission({ quantity: '9'.repeat(128) }));
  assert.equal(max.reward.quantity.length, 128);
});

test('authorization denies by default before any repository access', () => {
  let calls = 0;
  const repository = Object.fromEntries(['execute', 'getReward', 'getLedger'].map((method) => [method, () => { calls++; }]));
  const service = createRewardService({ repository });
  assert.throws(() => service.submitPending(submission()), code('FORBIDDEN'));
  for (const method of ['approve', 'postCredit', 'revoke']) {
    assert.throws(() => service[method]({ issuerId: 'issuer-a', rewardId: 'reward-1', expectedVersion: 1, idempotencyKey: 'key', context: { actorId: 'admin' } }), code('FORBIDDEN'));
  }
  for (const method of ['getReward', 'getLedger']) {
    assert.throws(() => service[method]({ issuerId: 'issuer-a', rewardId: 'reward-1' }), code('FORBIDDEN'));
  }
  assert.equal(calls, 0);
});

test('false, missing, thrown, malformed, mismatched, promise and thenable decisions fail closed', async (t) => {
  const { repository } = fixture(t);
  const adapters = [
    () => false, () => undefined, () => { throw Error('unavailable'); }, () => true,
    () => ({ allowed: 1, actorId: 'admin' }), () => ({ allowed: true, actorId: 'admin' }),
    (request) => ({ ...testAuthorization(request), issuerId: 'issuer-b' }),
    (request) => ({ ...testAuthorization(request), action: 'post' }),
    (request) => ({ ...testAuthorization(request), resource: { sourceResultId: 'different' } }),
    (request) => ({ ...testAuthorization(request), actorId: '' }),
    (request) => ({ ...testAuthorization(request), extra: true }),
    async (request) => testAuthorization(request), async () => { throw Error('async unavailable'); },
    () => ({ then() {}, allowed: true, actorId: 'admin' }),
  ];
  for (const issuerAuthorization of adapters) {
    const service = createRewardService({ repository, issuerAuthorization });
    assert.throws(() => service.submitPending(submission()), code('FORBIDDEN'));
  }
  await new Promise((resolve) => setImmediate(resolve));
});

test('forged context and cross-issuer reads, transitions and replays stay denied', (t) => {
  let denied = false;
  const { service } = fixture(t, { issuerAuthorization: (request) => denied ? { allowed: false } : testAuthorization(request) });
  const pending = service.submitPending(submission());
  for (const method of ['getReward', 'getLedger']) {
    assert.throws(() => service[method](read(pending, { issuerId: 'issuer-b' })), code('FORBIDDEN'));
    assert.throws(() => service[method](read(pending, { issuerId: 'issuer-b', context: { session: 'issuer-b' } })), code('NOT_FOUND'));
  }
  assert.throws(() => service.approve(transition(pending, { issuerId: 'issuer-b' })), code('FORBIDDEN'));
  assert.throws(() => service.submitPending(submission({ issuerId: 'issuer-b' })), code('FORBIDDEN'));
  assert.throws(() => service.approve(transition(pending, { context: { session: 'issuer-a', deniedAction: 'approve' } })), code('FORBIDDEN'));
  denied = true;
  assert.throws(() => service.submitPending(submission()), code('FORBIDDEN'), 'replay requires current authorization');
});

test('each read resource and command action is explicitly authorized', (t) => {
  const requests = [];
  const { service } = fixture(t, { issuerAuthorization: (request) => { requests.push(request); return testAuthorization(request); } });
  const pending = service.submitPending(submission());
  service.getReward(read(pending));
  service.getLedger(read(pending));
  const approved = service.approve(transition(pending));
  service.postCredit(transition(approved));
  assert.deepEqual(requests.map(({ action, resource }) => [action, resource]), [
    ['submit', { subjectId: 'synthetic-subject-1', sourceResultId: 'synthetic-result-1' }],
    ['read', { kind: 'reward', rewardId: pending.reward.id }],
    ['read', { kind: 'ledger', rewardId: pending.reward.id }],
    ['approve', { rewardId: pending.reward.id }],
    ['post', { rewardId: pending.reward.id }],
  ]);
});

test('unit budgets are independent and no service funding operation exists', (t) => {
  const { service } = fixture(t);
  const pending = service.submitPending(submission({ unitId: `${UNIT}-other` }));
  assert.throws(() => service.approve(transition(pending)), code('BUDGET_EXHAUSTED'));
  assert.equal(service.fund, undefined);
});
