import assert from 'node:assert/strict';
import { fork } from 'node:child_process';
import { test } from 'node:test';
import { budget, fixture, read, submission, transition } from './helpers.js';

async function race(t, filename, commands) {
  const workers = commands.map(() => {
    const child = fork(new URL('./race-worker.js', import.meta.url), [filename], { execArgv: ['--experimental-sqlite'], stdio: ['ignore', 'ignore', 'pipe', 'ipc'] });
    t.after(() => { if (!child.killed) child.kill(); });
    let stderr = '';
    child.stderr.on('data', (chunk) => { stderr += chunk; });
    let acceptReady;
    let acceptResult;
    let rejectResult;
    const ready = new Promise((resolve) => { acceptReady = resolve; });
    const result = new Promise((resolve, reject) => { acceptResult = resolve; rejectResult = reject; });
    child.on('message', (message) => { if (message.ready) acceptReady(); else acceptResult(message); });
    child.on('error', rejectResult);
    child.on('exit', (exitCode) => { if (exitCode) rejectResult(Error(`race worker failed: ${stderr}`)); });
    return { child, ready, result };
  });
  await Promise.all(workers.map((worker) => worker.ready));
  for (let i = 0; i < workers.length; i++) workers[i].child.send(commands[i]);
  return Promise.all(workers.map((worker) => worker.result));
}

test('separate processes cannot jointly reserve more than the issuer unit budget', { timeout: 15000 }, async (t) => {
  const { filename, service, inspect } = fixture(t, { total: '10' });
  const a = service.submitPending(submission({ quantity: '6' }));
  const b = service.submitPending(submission({ quantity: '6', sourceResultId: 'result-2', idempotencyKey: 'submit-2' }));
  const results = await race(t, filename, [
    { method: 'approve', input: transition(a, { idempotencyKey: 'approve-a' }) },
    { method: 'approve', input: transition(b, { idempotencyKey: 'approve-b' }) },
  ]);
  assert.equal(results.filter((result) => result.ok).length, 1);
  assert.equal(results.find((result) => !result.ok).code, 'BUDGET_EXHAUSTED');
  assert.deepEqual(budget(inspect), { total: '10', reserved: '6', spent: '0' });
});

test('separate processes approving the same version produce one approval', { timeout: 15000 }, async (t) => {
  const { filename, service, inspect } = fixture(t);
  const pending = service.submitPending(submission());
  const results = await race(t, filename, ['a', 'b'].map((key) => ({ method: 'approve', input: transition(pending, { idempotencyKey: `approve-${key}` }) })));
  assert.equal(results.filter((result) => result.ok).length, 1);
  assert.equal(results.find((result) => !result.ok).code, 'VERSION_CONFLICT');
  assert.equal(budget(inspect).reserved, '10');
});

test('separate processes posting with different request keys write exactly one pair', { timeout: 15000 }, async (t) => {
  const { filename, service, inspect } = fixture(t);
  const approved = service.approve(transition(service.submitPending(submission())));
  const results = await race(t, filename, ['a', 'b'].map((key) => ({ method: 'postCredit', input: transition(approved, { idempotencyKey: `post-${key}` }) })));
  assert.equal(results.filter((result) => result.ok).length, 1);
  assert.equal(results.find((result) => !result.ok).code, 'VERSION_CONFLICT');
  assert.equal(service.getLedger(read(approved)).length, 2);
  assert.deepEqual(budget(inspect), { total: '100', reserved: '0', spent: '10' });
});

test('same request key racing across processes returns exactly the same receipt', { timeout: 15000 }, async (t) => {
  const { filename, service, inspect } = fixture(t);
  const approved = service.approve(transition(service.submitPending(submission())));
  const command = { method: 'postCredit', input: transition(approved) };
  const results = await race(t, filename, [command, command]);
  assert.ok(results.every((result) => result.ok));
  assert.deepEqual(results[0].receipt, results[1].receipt);
  assert.equal(inspect.prepare('SELECT count(*) AS n FROM command_receipts').get().n, 3);
  assert.equal(service.getLedger(read(approved)).length, 2);
});

test('post versus revoke across processes has exactly one terminal winner', { timeout: 15000 }, async (t) => {
  const { filename, service, inspect } = fixture(t);
  const approved = service.approve(transition(service.submitPending(submission())));
  const results = await race(t, filename, [
    { method: 'postCredit', input: transition(approved, { idempotencyKey: 'race-post' }) },
    { method: 'revoke', input: transition(approved, { idempotencyKey: 'race-revoke' }) },
  ]);
  assert.equal(results.filter((result) => result.ok).length, 1);
  assert.equal(results.find((result) => !result.ok).code, 'VERSION_CONFLICT');
  const winner = service.getReward(read(approved));
  assert.ok(['posted', 'revoked'].includes(winner.status));
  assert.equal(service.getLedger(read(approved)).length, winner.status === 'posted' ? 2 : 0);
  assert.deepEqual(budget(inspect), { total: '100', reserved: '0', spent: winner.status === 'posted' ? '10' : '0' });
});
