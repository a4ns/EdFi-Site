import assert from 'node:assert/strict';
import { getEventListeners } from 'node:events';
import { test } from 'node:test';
import { createRewardHttpHandler, RewardError } from '../src/index.js';
import { budget, fixture, submission, testAuthorization, UNIT } from './helpers.js';

const collection = '/v1/issuers/issuer-a/rewards';
const context = { session: 'issuer-a' };
const authenticate = () => ({ authenticated: true, context });
const payload = {
  subjectId: 'synthetic-subject-1', sourceResultId: 'synthetic-result-1',
  evidenceRef: 'opaque-evidence-1', quantity: '10', unitId: UNIT,
};
const encoder = new TextEncoder();

function request(path = collection, { method = 'POST', body = payload, headers = {}, signal } = {}) {
  return new Request(`https://reference.invalid${path}`, {
    method, signal,
    headers: method === 'POST'
      ? { 'Content-Type': 'application/json', 'Idempotency-Key': 'submit-1', ...headers } : headers,
    ...(method === 'GET' || method === 'HEAD' ? {} : {
      body: body instanceof ReadableStream || body instanceof Uint8Array || typeof body === 'string'
        ? body : JSON.stringify(body), duplex: 'half',
    }),
  });
}

async function response(handle, input, status = 200, code) {
  const output = await handle(input);
  assert.ok(output instanceof Response);
  assert.equal(output.status, status);
  assert.equal(output.headers.get('content-type'), 'application/json; charset=utf-8');
  assert.equal(output.headers.get('cache-control'), 'no-store');
  assert.equal(output.headers.get('x-content-type-options'), 'nosniff');
  if (input?.method === 'HEAD') {
    assert.equal(output.body, null);
    assert.equal(await output.text(), '');
    return { output };
  }
  const value = await output.json();
  if (status >= 400) {
    assert.deepEqual(Object.keys(value), ['error']);
    assert.deepEqual(Object.keys(value.error), ['code', 'message']);
    if (code) assert.equal(value.error.code, code);
  } else assert.deepEqual(Object.keys(value), ['data']);
  return { output, value, data: value.data };
}

function stubService(implementation = (input) => ({
  kind: 'historical-command-receipt', commandId: 'synthetic-command', issuerId: input.issuerId,
  actorId: 'synthetic-actor', action: 'submit', idempotencyKey: input.idempotencyKey,
  recordedAt: '2026-01-01T00:00:00.000Z', reward: {
    ...payload, id: 'synthetic-reward', issuerId: input.issuerId, status: 'pending', version: 1,
    createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z',
  },
})) {
  return Object.fromEntries(['submitPending', 'getReward', 'getLedger', 'approve', 'postCredit', 'revoke']
    .map((method) => [method, (input) => implementation(input, method)]));
}

function unchanged(inspect) {
  for (const table of ['rewards', 'ledger', 'events', 'command_receipts']) {
    assert.equal(inspect.prepare(`SELECT COUNT(*) AS count FROM ${table}`).get().count, 0, table);
  }
  assert.deepEqual(budget(inspect), { total: '100', reserved: '0', spent: '0' });
}

test('HTTP lifecycle preserves exact historical receipts and separately reads current reward/ledger', async (t) => {
  const authorized = [];
  const { service, inspect } = fixture(t, { issuerAuthorization: (input) => {
    authorized.push(input);
    return testAuthorization(input);
  } });
  const handle = createRewardHttpHandler({ service, authenticate });
  const { data: pending } = await response(handle, request());
  assert.equal(pending.kind, 'historical-command-receipt');
  assert.equal(pending.reward.status, 'pending');
  const path = `${collection}/${pending.reward.id}`;
  assert.deepEqual((await response(handle, request(`${path}/ledger`, { method: 'GET' }))).data, []);
  const approval = () => request(`${path}/approve`, {
    body: { expectedVersion: 1 }, headers: { 'Idempotency-Key': 'approve-1' },
  });
  const { data: approved } = await response(handle, approval());
  assert.equal(approved.reward.status, 'approved');
  assert.deepEqual(budget(inspect), { total: '100', reserved: '10', spent: '0' });
  const post = () => request(`${path}/post`, {
    body: { expectedVersion: 2 }, headers: { 'Idempotency-Key': 'post-1' },
  });
  const { data: posted } = await response(handle, post());
  assert.equal(posted.reward.status, 'posted');
  const replay = await response(handle, approval());
  assert.deepEqual(replay.data, approved);
  assert.deepEqual((await response(handle, request())).data, pending);
  assert.deepEqual((await response(handle, post())).data, posted);
  assert.deepEqual(pending, service.submitPending(submission()), 'no wrapper changes the service receipt');
  assert.equal((await response(handle, request(path, { method: 'GET' }))).data.status, 'posted');
  const ledger = (await response(handle, request(`${path}/ledger`, { method: 'GET' }))).data;
  assert.equal(ledger.length, 2);
  assert.equal(ledger.reduce((sum, line) => sum + BigInt(line.quantity) * (line.direction === 'debit' ? -1n : 1n), 0n), 0n);
  assert.equal(inspect.prepare('SELECT COUNT(*) AS count FROM command_receipts').get().count, 3);
  assert.deepEqual(budget(inspect), { total: '100', reserved: '0', spent: '10' });
  assert.equal(authorized.length, 10, 'each HTTP operation/replay and direct comparison reauthorizes');
  assert.ok(authorized.every((input) => input.context.session === 'issuer-a'));
});

test('HTTP revocation is terminal and releases an approved reservation', async (t) => {
  const { service, inspect } = fixture(t);
  const handle = createRewardHttpHandler({ service, authenticate });
  const { data: pending } = await response(handle, request());
  const path = `${collection}/${pending.reward.id}`;
  await response(handle, request(`${path}/approve`, { body: { expectedVersion: 1 }, headers: { 'Idempotency-Key': 'approve' } }));
  const { data: revoked } = await response(handle, request(`${path}/revoke`, { body: { expectedVersion: 2 }, headers: { 'Idempotency-Key': 'revoke' } }));
  assert.equal(revoked.reward.status, 'revoked');
  assert.deepEqual(budget(inspect), { total: '100', reserved: '0', spent: '0' });
  await response(handle, request(`${path}/post`, { body: { expectedVersion: 3 }, headers: { 'Idempotency-Key': 'post' } }), 409, 'INVALID_TRANSITION');
  assert.deepEqual((await response(handle, request(`${path}/ledger`, { method: 'GET' }))).data, []);
});

test('default/malformed/throwing/async authentication fails closed before service authorization', async (t) => {
  let calls = 0;
  const { service, inspect } = fixture(t, { issuerAuthorization: (input) => { calls++; return testAuthorization(input); } });
  const callbacks = [
    undefined, () => false, () => undefined, () => true, () => ({}), () => ({ authenticated: 1, context }),
    () => ({ authenticated: true }), () => ({ authenticated: true, context, actorId: 'forged' }),
    () => ({ authenticated: true, context: [] }), () => ({ authenticated: true, context: null }),
    () => ({ authenticated: true, context, then() {} }), async () => ({ authenticated: true, context }),
    async () => { throw Error('private asynchronous authentication detail'); },
    () => { throw Error('private token detail'); },
    () => Object.create({ authenticated: true, context }),
    () => Object.defineProperty({ context }, 'authenticated', { get() { return true; } }),
  ];
  for (const callback of callbacks) {
    const handle = createRewardHttpHandler({ service, authenticate: callback });
    const { output } = await response(handle, request(undefined, { headers: {
      Authorization: 'unverified-placeholder', 'X-Actor-Id': 'admin', 'X-Issuer-Id': 'issuer-a',
    } }), 403, 'FORBIDDEN');
    assert.equal(output.headers.get('www-authenticate'), null);
  }
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(calls, 0);
  unchanged(inspect);
});

test('authentication receives transport metadata but only its trusted context reaches the service', async (t) => {
  let seen;
  const { service } = fixture(t, { issuerAuthorization: (input) => { seen = input; return testAuthorization(input); } });
  const incoming = request(undefined, { headers: { 'X-Actor-Id': 'forged' } });
  const handle = createRewardHttpHandler({ service, authenticate(metadata) {
    assert.deepEqual(Object.keys(metadata), ['method', 'url', 'headers', 'signal']);
    assert.ok(Object.isFrozen(metadata));
    assert.equal(metadata.method, 'POST');
    assert.equal(metadata.signal, incoming.signal);
    metadata.headers.set('Idempotency-Key', 'changed-copy');
    return { authenticated: true, context };
  } });
  const { data } = await response(handle, incoming);
  assert.equal(seen.context, context);
  assert.equal(data.actorId, 'test-actor-1');
  assert.equal(data.idempotencyKey, 'submit-1');
  assert.equal(incoming.headers.get('idempotency-key'), 'submit-1');
});

test('request bodies cannot inject authority, route scope, state or request keys', async (t) => {
  const { service, inspect } = fixture(t);
  const handle = createRewardHttpHandler({ service, authenticate });
  for (const field of ['actorId', 'role', 'context', 'issuerId', 'rewardId', 'idempotencyKey', 'status', 'version', '__proto__']) {
    await response(handle, request(undefined, { body: { ...payload, [field]: 'forged' } }), 400, 'INVALID_INPUT');
    await response(handle, request(`${collection}/unknown/approve`, { body: { expectedVersion: 1, [field]: 'forged' } }), 400, 'INVALID_INPUT');
  }
  for (const body of [null, [], true, 1, {}, { ...payload, quantity: 10 }, { ...payload, quantity: '01' },
    { ...payload, subjectId: null }, { ...payload, evidenceRef: 'https://private.invalid/evidence' },
    { ...payload, unitId: 'ü' }, { ...payload, quantity: '9'.repeat(129) }]) {
    await response(handle, request(undefined, { body }), 400, 'INVALID_INPUT');
  }
  for (const expectedVersion of [null, '1', 0, 4, 1.1]) {
    await response(handle, request(`${collection}/unknown/post`, { body: { expectedVersion } }), 400, 'INVALID_INPUT');
  }
  unchanged(inspect);
});

test('cross-issuer scope and revoked permissions cannot be bypassed through reads or replay', async (t) => {
  let denied = false;
  let identity = context;
  const { service } = fixture(t, { issuerAuthorization: (input) => denied ? { allowed: false } : testAuthorization(input) });
  const handle = createRewardHttpHandler({ service, authenticate: () => ({ authenticated: true, context: identity }) });
  const { data: pending } = await response(handle, request());
  const other = `/v1/issuers/issuer-b/rewards/${pending.reward.id}`;
  await response(handle, request(other, { method: 'GET' }), 403, 'FORBIDDEN');
  await response(handle, request(`${other}/approve`, { body: { expectedVersion: 1 } }), 403, 'FORBIDDEN');
  identity = { session: 'issuer-b' };
  await response(handle, request(other, { method: 'GET' }), 404, 'NOT_FOUND');
  await response(handle, request(`${other}/ledger`, { method: 'GET' }), 404, 'NOT_FOUND');
  identity = context;
  denied = true;
  await response(handle, request(), 403, 'FORBIDDEN');
  await response(handle, request(`${collection}/${pending.reward.id}`, { method: 'GET' }), 403, 'FORBIDDEN');
});

test('HTTP conflicts preserve a single result and bind actor, key, action and business inputs', async (t) => {
  let identity = context;
  const { service, inspect } = fixture(t);
  const handle = createRewardHttpHandler({ service, authenticate: () => ({ authenticated: true, context: identity }) });
  const { data: pending } = await response(handle, request());
  await response(handle, request(undefined, { body: { ...payload, quantity: '11' } }), 409, 'IDEMPOTENCY_CONFLICT');
  await response(handle, request(undefined, { headers: { 'Idempotency-Key': 'new-key' } }), 409, 'DUPLICATE_RESULT');
  identity = { session: 'issuer-a', secondActor: true };
  await response(handle, request(), 409, 'IDEMPOTENCY_CONFLICT');
  identity = context;
  await response(handle, request(`${collection}/${pending.reward.id}/approve`, { body: { expectedVersion: 1 } }), 409, 'IDEMPOTENCY_CONFLICT');
  assert.equal(inspect.prepare('SELECT COUNT(*) AS count FROM rewards').get().count, 1);
  assert.equal(inspect.prepare('SELECT COUNT(*) AS count FROM command_receipts').get().count, 1);
});

test('route, query, identifier and method handling is exact with appropriate Allow', async () => {
  let calls = 0;
  const handle = createRewardHttpHandler({ service: stubService(() => { calls++; return {}; }), authenticate });
  for (const path of ['/v2/issuers/issuer-a/rewards', `${collection}/reward/extra`, `${collection}/reward/ledger/extra`, '/']) {
    await response(handle, request(path), 404, 'NOT_FOUND');
  }
  for (const path of [`${collection}?`, `${collection}?actorId=admin`, `${collection}#fragment`,
    '/v1/issuers/%69ssuer-a/rewards', '/v1/issuers/issuer%2Fa/rewards', `${collection}/`,
    `/v1/issuers/${'x'.repeat(129)}/rewards`]) {
    await response(handle, request(path), 400);
  }
  for (const [path, method, allow] of [
    [collection, 'GET', 'POST'], [collection, 'HEAD', 'POST'], [collection, 'OPTIONS', 'POST'],
    [`${collection}/reward`, 'POST', 'GET'], [`${collection}/reward/ledger`, 'POST', 'GET'],
    [`${collection}/reward/approve`, 'GET', 'POST'],
  ]) {
    const { output } = await response(handle, request(path, { method }), 405, 'METHOD_NOT_ALLOWED');
    assert.equal(output.headers.get('allow'), allow);
    assert.equal(output.headers.get('access-control-allow-origin'), null);
  }
  assert.equal(calls, 0);
});

test('only documented JSON media types and unencoded bodies are accepted', async (t) => {
  const { service, inspect } = fixture(t);
  const handle = createRewardHttpHandler({ service, authenticate });
  for (const value of ['', 'text/plain', 'application/json-patch+json', 'application/json; charset=latin1',
    'application/json; charset=utf-8; charset=utf-8', 'application/json; arbitrary=value',
    'application/json;\vcharset=utf-8', 'application/json;\fcharset=utf-8', 'application/json;\u00a0charset=utf-8',
    'application/json; charset =utf-8', 'application/json; charset= utf-8']) {
    await response(handle, request(undefined, { headers: { 'Content-Type': value } }), 415, 'UNSUPPORTED_MEDIA_TYPE');
  }
  const missing = request();
  missing.headers.delete('content-type');
  await response(handle, missing, 415, 'UNSUPPORTED_MEDIA_TYPE');
  for (const value of ['', 'identity', 'gzip', 'br']) {
    await response(handle, request(undefined, { headers: { 'Content-Encoding': value } }), 415, 'UNSUPPORTED_MEDIA_TYPE');
  }
  unchanged(inspect);
  const accepted = createRewardHttpHandler({ service: stubService(), authenticate });
  for (const type of ['application/json', 'Application/JSON; Charset=UTF-8', 'application/json;charset="utf-8"']) {
    await response(accepted, request(undefined, { headers: { 'Content-Type': type } }));
  }
});

test('HEAD stays bodyless for recognized, unknown and invalid-query paths without a service call', async () => {
  let calls = 0;
  const handle = createRewardHttpHandler({ service: stubService(() => { calls++; }), authenticate });
  for (const [path, status] of [[collection, 405], ['/', 404], [`${collection}?x=1`, 400]]) {
    const { output } = await response(handle, request(path, { method: 'HEAD' }), status);
    assert.equal(output.headers.get('allow'), status === 405 ? 'POST' : null);
  }
  assert.equal(calls, 0);
});

test('mutation keys are mandatory identifiers and reads reject positive declared body lengths', async (t) => {
  const { service, inspect } = fixture(t);
  const handle = createRewardHttpHandler({ service, authenticate });
  for (const key of ['', 'with spaces', 'one,two', 'a'.repeat(129)]) {
    await response(handle, request(undefined, { headers: { 'Idempotency-Key': key } }), 400, 'INVALID_INPUT');
  }
  const missing = request();
  missing.headers.delete('idempotency-key');
  await response(handle, missing, 400, 'INVALID_INPUT');
  await response(handle, request(`${collection}/reward`, { method: 'GET', headers: { 'Content-Length': '1' } }), 400, 'INVALID_REQUEST');
  unchanged(inspect);
});

test('actual byte limits apply across chunks and dishonest/absent Content-Length headers', async () => {
  const serialized = JSON.stringify(payload);
  const length = encoder.encode(serialized).length;
  const handle = createRewardHttpHandler({ service: stubService(), authenticate, maxBodyBytes: length });
  await response(handle, request(undefined, { body: serialized }));
  await response(handle, request(undefined, { body: `${serialized} ` }), 413, 'PAYLOAD_TOO_LARGE');
  for (const declared of ['1', String(length)]) {
    const stream = new ReadableStream({ start(controller) {
      controller.enqueue(encoder.encode(serialized));
      controller.enqueue(encoder.encode(' '));
      controller.close();
    } });
    await response(handle, request(undefined, { body: stream, headers: { 'Content-Length': declared } }), 413, 'PAYLOAD_TOO_LARGE');
  }
  for (const declared of ['0', '1']) {
    await response(handle, request(undefined, { headers: { 'Content-Length': declared } }), 400, 'INVALID_REQUEST');
  }
  for (const declared of ['-1', '+1', '01', '1.0', '1,1']) {
    await response(handle, request(undefined, { headers: { 'Content-Length': declared } }), 400, 'INVALID_REQUEST');
  }
  await response(handle, request(undefined, { headers: { 'Content-Length': '9'.repeat(1000) } }), 413, 'PAYLOAD_TOO_LARGE');
  await response(handle, request(undefined, { headers: { 'Content-Length': String(length) } }));
});

test('UTF-8 byte accounting handles split multibyte characters and rejects malformed encodings/JSON', async (t) => {
  const { service, inspect } = fixture(t);
  const multibyte = encoder.encode(JSON.stringify({ ...payload, evidenceRef: 'é' }));
  const allowed = createRewardHttpHandler({ service, authenticate, maxBodyBytes: multibyte.length });
  const stream = new ReadableStream({ start(controller) {
    for (const byte of multibyte) controller.enqueue(Uint8Array.of(byte));
    controller.close();
  } });
  await response(allowed, request(undefined, { body: stream }), 400, 'INVALID_INPUT');
  const smaller = createRewardHttpHandler({ service, authenticate, maxBodyBytes: multibyte.length - 1 });
  await response(smaller, request(undefined, { body: multibyte }), 413, 'PAYLOAD_TOO_LARGE');
  for (const body of [Uint8Array.of(0xc0, 0xaf), Uint8Array.of(0xe2, 0x82),
    Uint8Array.of(0xef, 0xbb, 0xbf, 0x7b, 0x7d), '', '{', '{"quantity":', '{"a":NaN}']) {
    await response(allowed, request(undefined, { body }), 400, 'INVALID_REQUEST');
  }
  unchanged(inspect);
});

test('stalled and endless empty streams time out, cancel and release their reader', async () => {
  for (const emptyChunks of [false, true]) {
    let cancelled = 0;
    let calls = 0;
    const body = new ReadableStream({
      pull(controller) { if (emptyChunks) controller.enqueue(new Uint8Array()); },
      cancel() { cancelled++; return new Promise(() => {}); },
    });
    const input = request(undefined, { body });
    const handle = createRewardHttpHandler({ service: stubService(() => { calls++; }), authenticate, bodyReadTimeoutMs: 20 });
    const started = performance.now();
    await response(handle, input, 408, 'REQUEST_TIMEOUT');
    assert.ok(performance.now() - started < 1000);
    assert.equal(cancelled, 1);
    assert.equal(body.locked, false);
    assert.equal(getEventListeners(input.signal, 'abort').length, 0);
    assert.equal(calls, 0);
  }
});

test('abort before/during reads cancels without service mutation or leaked listeners', async (t) => {
  const { service, inspect } = fixture(t);
  const handle = createRewardHttpHandler({ service, authenticate, bodyReadTimeoutMs: 200 });
  for (const before of [true, false]) {
    const controller = new AbortController();
    let cancelled = 0;
    const body = new ReadableStream({ cancel() { cancelled++; return Promise.reject(Error('private cancel detail')); } });
    const input = request(undefined, { body, signal: controller.signal });
    if (before) controller.abort();
    else setTimeout(() => controller.abort(), 10);
    await response(handle, input, 400, 'REQUEST_ABORTED');
    assert.equal(cancelled, 1);
    assert.equal(body.locked, false);
    assert.equal(getEventListeners(input.signal, 'abort').length, 0);
  }
  unchanged(inspect);
});

test('early rejection cancels unread bodies; locked/consumed/errored streams never dispatch', async () => {
  let cancelled = 0;
  let calls = 0;
  const service = stubService(() => { calls++; });
  const denied = createRewardHttpHandler({ service });
  const body = new ReadableStream({ cancel() { cancelled++; return new Promise(() => {}); } });
  await response(denied, request(undefined, { body }), 403, 'FORBIDDEN');
  assert.equal(cancelled, 1);
  const handle = createRewardHttpHandler({ service, authenticate });
  const consumed = request();
  await consumed.text();
  await response(handle, consumed, 400, 'INVALID_REQUEST');
  const locked = request();
  const reader = locked.body.getReader();
  await response(handle, locked, 400, 'INVALID_REQUEST');
  reader.releaseLock();
  await locked.body.cancel();
  const errored = new ReadableStream({ start(controller) { controller.error(Error('private stream detail')); } });
  await response(handle, request(undefined, { body: errored }), 400, 'INVALID_REQUEST');
  assert.equal(calls, 0);
});

test('known domain errors map consistently while thrown internals remain redacted', async () => {
  const expected = new Map([
    ['INVALID_INPUT', 400], ['FORBIDDEN', 403], ['NOT_FOUND', 404], ['DUPLICATE_RESULT', 409],
    ['IDEMPOTENCY_CONFLICT', 409], ['VERSION_CONFLICT', 409], ['INVALID_TRANSITION', 409],
    ['BUDGET_EXHAUSTED', 409], ['STORAGE_BUSY', 503], ['STORAGE_FAILURE', 500], ['UNKNOWN_SCHEMA', 500],
    ['INVARIANT_VIOLATION', 500], ['INVALID_CLOCK', 500], ['REPOSITORY_CLOSED', 500], ['UNKNOWN', 500],
  ]);
  const secret = 'private-token-context-evidence /private/file.sqlite SELECT secret FROM records';
  for (const [code, status] of expected) {
    const handle = createRewardHttpHandler({ service: stubService(() => { throw new RewardError(code, secret, { cause: Error(secret) }); }), authenticate });
    const { value, output } = await response(handle, request(), status, status === 500 ? 'INTERNAL_ERROR' : code);
    assert.equal(JSON.stringify(value).includes('private'), false);
    assert.equal(output.headers.get('retry-after'), code === 'STORAGE_BUSY' ? '1' : null);
  }
  for (const failure of [Error(secret), { code: 'FORBIDDEN', message: secret }, null, secret]) {
    const handle = createRewardHttpHandler({ service: stubService(() => { throw failure; }), authenticate });
    await response(handle, request(), 500, 'INTERNAL_ERROR');
  }
});

test('actual SQLite lock contention produces bounded retryable failure without consuming a key', async (t) => {
  const { service, inspect } = fixture(t, { busyTimeoutMs: 5 });
  const handle = createRewardHttpHandler({ service, authenticate });
  inspect.exec('BEGIN IMMEDIATE');
  try {
    const { output } = await response(handle, request(), 503, 'STORAGE_BUSY');
    assert.equal(output.headers.get('retry-after'), '1');
  } finally { inspect.exec('ROLLBACK'); }
  unchanged(inspect);
  await response(handle, request());
  assert.equal(inspect.prepare('SELECT COUNT(*) AS count FROM command_receipts').get().count, 1);
});

test('malformed or mismatched service output becomes a generic failure before serialization', async (t) => {
  const { service } = fixture(t);
  const pending = service.submitPending(submission());
  for (const result of [null, true, 'receipt', {}, { ...pending, privateToken: 'private' },
    { ...pending, issuerId: 'issuer-b' }, { ...pending, idempotencyKey: 'wrong-key' },
    { ...pending, action: 'post' }, { ...pending, reward: { ...pending.reward, issuerId: 'issuer-b' } },
    { ...pending, reward: { ...pending.reward, quantity: 10 } }]) {
    const handle = createRewardHttpHandler({ service: stubService(() => result), authenticate });
    await response(handle, request(), 500, 'INTERNAL_ERROR');
  }
  const wrongReward = createRewardHttpHandler({ service: stubService(() => pending.reward), authenticate });
  await response(wrongReward, request(`${collection}/different-reward`, { method: 'GET' }), 500, 'INTERNAL_ERROR');
});

test('factory rejects unbounded options and handler rejects non-Request/async-service results', async () => {
  const service = stubService();
  assert.throws(() => createRewardHttpHandler(), TypeError);
  assert.throws(() => createRewardHttpHandler({ service: {} }), TypeError);
  assert.throws(() => createRewardHttpHandler({ service, authenticate: true }), TypeError);
  for (const maxBodyBytes of [0, -1, 65537, 1.5, Infinity, '8192']) {
    assert.throws(() => createRewardHttpHandler({ service, maxBodyBytes }), TypeError);
  }
  for (const bodyReadTimeoutMs of [0, -1, 5001, 1.5, Infinity, '1000']) {
    assert.throws(() => createRewardHttpHandler({ service, bodyReadTimeoutMs }), TypeError);
  }
  const handle = createRewardHttpHandler({ service, authenticate });
  for (const invalid of [null, undefined, {}, 'https://reference.invalid']) {
    await response(handle, invalid, 400, 'INVALID_REQUEST');
  }
  for (const implementation of [() => undefined, () => Promise.resolve({}), () => Promise.reject(Error('private')), () => ({ then() {} })]) {
    await response(createRewardHttpHandler({ service: stubService(implementation), authenticate }), request(), 500, 'INTERNAL_ERROR');
  }
  await new Promise((resolve) => setImmediate(resolve));
});
