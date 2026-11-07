import assert from 'node:assert/strict';
import test from 'node:test';
import { createRewardHttpHandler, createRewardService, RewardError } from '../src/index.js';
import { fixture, submission, read, budget } from './helpers.js';
import { BUSINESS, COLLECTION, bounded, bytesStream, databaseState, readJson, request, responseHeaders } from './http-adversarial-helpers.js';

const METHODS = ['submitPending', 'getReward', 'getLedger', 'approve', 'postCredit', 'revoke'];
const CREDENTIAL = Symbol('synthetic trusted credential');
const CONTEXT = Object.freeze({ credential: CREDENTIAL, issuer: 'issuer-a', actor: 'synthetic-actor-a' });
const authenticate = () => ({ authenticated: true, context: CONTEXT });
const authorize = ({ context, issuerId, action, resource }) => context?.credential === CREDENTIAL && context.issuer === issuerId
  ? { allowed: true, actorId: context.actor, issuerId, action, resource } : { allowed: false };
const serviceOptions = { issuerAuthorization: authorize };

function configured(t, options = {}) {
  const f = fixture(t, serviceOptions);
  return { ...f, handler: createRewardHttpHandler({ service: f.service, authenticate, ...options }) };
}

function fakeService(method) {
  return Object.fromEntries(METHODS.map((name) => [name, (...args) => method(name, ...args)]));
}

async function failure(response, status, expectedCode) {
  responseHeaders(response);
  assert.equal(response.status, status);
  const value = await response.json();
  assert.deepEqual(Object.keys(value), ['error']);
  assert.deepEqual(Object.keys(value.error).sort(), ['code', 'message']);
  assert.equal(typeof value.error.code, 'string');
  assert.equal(typeof value.error.message, 'string');
  if (expectedCode) assert.equal(value.error.code, expectedCode);
  return value;
}

async function submit(handler, overrides = {}) {
  const response = await handler(request(overrides));
  assert.equal(response.status, 200);
  return (await readJson(response)).data;
}

async function command(handler, reward, action, key, body = { expectedVersion: reward.version }) {
  return handler(request({ path: `${COLLECTION}/${reward.id}/${action}`, key, body }));
}

test('adversarial HTTP rejects route and method ambiguity before service access', async () => {
  let calls = 0;
  const handler = createRewardHttpHandler({ service: fakeService(() => { calls += 1; throw new Error('unexpected service access'); }), authenticate });
  const paths = [
    '/v1/issuers/issuer-a/rewards/', '/v1//issuers/issuer-a/rewards',
    '/v1/issuers/issuer-a%2Frewards/rewards', '/v1/issuers/issuer-a%5Crewards/rewards',
    '/v1/issuers/issuer%2Da/rewards', '/v1/issuers/issuer-a%252Fother/rewards',
    '/v1/issuers/issuer-a/rewards/reward%2Fother', '/v1/issuers/issuer-a/rewards?issuerId=issuer-b',
    '/v1/issuers/issuer-a/rewards?actorId=admin', '/v1/issuers/issuer-a/rewards/reward-1/approve/extra',
    '/v1/issuers/issuer-a/rewards/%ZZ', '/v1/issuers/issuer-a/rewards/%00',
  ];
  for (const path of paths) {
    const response = await handler(request({ path }));
    responseHeaders(response);
    assert.ok(response.status >= 400 && response.status < 500, `${path}: ${response.status}`);
  }
  for (const [path, method, allow] of [
    [COLLECTION, 'GET', 'POST'], [COLLECTION, 'PUT', 'POST'],
    [`${COLLECTION}/reward-1`, 'POST', 'GET'], [`${COLLECTION}/reward-1/ledger`, 'DELETE', 'GET'],
    [`${COLLECTION}/reward-1/approve`, 'OPTIONS', 'POST'], [`${COLLECTION}/reward-1/post`, 'PATCH', 'POST'],
    [`${COLLECTION}/reward-1/revoke`, 'HEAD', 'POST'],
  ]) {
    const response = await handler(request({ path, method }));
    responseHeaders(response);
    assert.equal(response.status, 405, `${method} ${path}`);
    assert.equal(response.headers.get('allow'), allow);
    if (method === 'HEAD') assert.equal(await response.text(), '');
  }
  assert.equal(calls, 0);
});

test('adversarial HTTP default, malformed and exceptional authentication never invoke service', async () => {
  let calls = 0;
  const service = fakeService(() => { calls += 1; });
  const decisions = [undefined, null, false, true, {}, [], { authenticated: true },
    { authenticated: 1, context: {} }, { authenticated: true, context: null },
    { authenticated: true, context: [] }, { authenticated: true, context: {}, actorId: 'admin' },
    { authenticated: true, context: new Date() }, Object.create(null),
    { get authenticated() { throw new Error('private auth getter'); }, context: {} },
    { authenticated: true, context: {}, then() {} }];
  await failure(await createRewardHttpHandler({ service })(request()), 403);
  for (const decision of decisions) {
    const handler = createRewardHttpHandler({ service, authenticate: () => decision });
    await failure(await handler(request()), 403);
  }
  for (const auth of [() => { throw new Error('/private/auth.key SELECT secret FROM sessions'); },
    () => Promise.resolve({ authenticated: true, context: {} }),
    () => Promise.reject(new Error('synthetic rejected auth')), () => new Promise(() => {})]) {
    await failure(await bounded(createRewardHttpHandler({ service, authenticate: auth })(request()), 'authentication denial'), 403);
  }
  assert.equal(calls, 0);
});

test('adversarial HTTP client assertions cannot replace trusted context or grant default service authority', async (t) => {
  const f = configured(t);
  const initial = databaseState(f.inspect);
  for (const forged of [{ actorId: 'admin' }, { role: 'issuer-admin' }, { issuerId: 'issuer-b' },
    { context: CONTEXT }, { context: { session: 'issuer-a' } }, { allowed: true }, { authenticated: true }]) {
    await failure(await f.handler(request({ body: { ...BUSINESS, ...forged } })), 400);
    assert.equal(databaseState(f.inspect), initial);
  }
  const denied = createRewardHttpHandler({ service: f.service });
  await failure(await denied(request({ headers: { authorization: 'Bearer admin', 'x-actor-id': 'admin', 'x-issuer-id': 'issuer-a', 'x-role': 'issuer-admin' } })), 403);
  const noServiceAuthority = createRewardHttpHandler({ service: createRewardService({ repository: f.repository }), authenticate });
  await failure(await noServiceAuthority(request()), 403);
  assert.equal(databaseState(f.inspect), initial);
  const receipt = await submit(f.handler, { headers: { 'x-actor-id': 'forged-actor', 'x-issuer-id': 'issuer-b', 'x-http-method-override': 'DELETE' } });
  assert.equal(receipt.actorId, CONTEXT.actor);
  assert.equal(receipt.issuerId, CONTEXT.issuer);
});

test('adversarial HTTP authentication receives bounded metadata without a body or mutable request headers', async (t) => {
  let supplied;
  const f = configured(t, { authenticate(metadata) {
    supplied = metadata;
    assert.equal(Object.isFrozen(metadata), true);
    assert.equal('body' in metadata, false);
    assert.equal('request' in metadata, false);
    metadata.headers.set('Idempotency-Key', 'auth-overwrite');
    return authenticate();
  } });
  const input = request();
  const response = await f.handler(input);
  assert.equal(response.status, 200);
  const receipt = (await readJson(response)).data;
  assert.equal(receipt.idempotencyKey, 'submit-1');
  assert.equal(input.headers.get('Idempotency-Key'), 'submit-1');
  assert.equal(supplied.method, 'POST');
  assert.equal(typeof supplied.url, 'string');
  assert.equal(supplied.signal instanceof AbortSignal, true);
});

test('adversarial HTTP rejects unsupported media types and content encodings without mutation', async (t) => {
  const f = configured(t);
  const before = databaseState(f.inspect);
  for (const contentType of ['', 'text/plain', 'application/problem+json', 'application/json-patch+json',
    'application/json; charset=iso-8859-1', 'application/json; charset=utf-16',
    'application/json; profile=synthetic', 'application/json; charset=utf-8; charset=utf-8',
    'application/json, application/json', 'application/json;\u000bcharset=utf-8',
    'application/json;\u000ccharset=utf-8', 'application/json;\u00a0charset=utf-8',
    'application/json; charset =utf-8', 'application/json; charset= utf-8']) {
    const input = request({ headers: { 'content-type': contentType } });
    if (contentType === '') input.headers.delete('content-type');
    await failure(await f.handler(input), 415);
    assert.equal(databaseState(f.inspect), before);
  }
  for (const encoding of ['gzip', 'br', 'deflate', 'identity', 'identity, gzip']) {
    await failure(await f.handler(request({ headers: { 'content-encoding': encoding } })), 415);
    assert.equal(databaseState(f.inspect), before);
  }
});

test('adversarial HTTP rejects invalid JSON, UTF-8, unknown fields and mutation keys without mutation', async (t) => {
  const f = configured(t);
  const before = databaseState(f.inspect);
  const invalidBodies = ['', '{', 'null', '[]', 'true', '42', '"text"', '{"__proto__":{"actor":"admin"}}',
    { ...BUSINESS, unexpected: 'field' }, { ...BUSINESS, idempotencyKey: 'body-key' },
    { ...BUSINESS, quantity: 10 }, { ...BUSINESS, quantity: '01' },
    new Uint8Array([0x7b, 0x22, 0x78, 0x22, 0x3a, 0x22, 0xc3, 0x28, 0x22, 0x7d])];
  for (const body of invalidBodies) {
    await failure(await f.handler(request({ body })), 400);
    assert.equal(databaseState(f.inspect), before);
  }
  for (const key of [null, '', 'bad,key', 'bad key', 'a'.repeat(129)]) {
    await failure(await f.handler(request({ key })), 400);
    assert.equal(databaseState(f.inspect), before);
  }
  const input = request();
  input.headers.append('Idempotency-Key', 'second-key');
  await failure(await f.handler(input), 400);
  assert.equal(databaseState(f.inspect), before);
});

test('adversarial HTTP transition body cannot override version, reward, actor or issuer', async (t) => {
  const f = configured(t);
  const pending = await submit(f.handler);
  const before = databaseState(f.inspect);
  for (const body of [{}, { expectedVersion: '1' }, { expectedVersion: 0 }, { expectedVersion: 1.5 },
    { expectedVersion: 1, rewardId: 'another-reward' }, { expectedVersion: 1, actorId: 'admin' },
    { expectedVersion: 1, issuerId: 'issuer-b' }, { expectedVersion: 1, context: { session: 'issuer-a' } },
    { expectedVersion: 1, quantity: '1000' }, { expectedVersion: 1, idempotencyKey: 'other-key' }]) {
    await failure(await command(f.handler, pending.reward, 'approve', 'approve-1', body), 400);
    assert.equal(databaseState(f.inspect), before);
  }
});

test('adversarial HTTP actual byte budget rejects multibyte streamed bodies despite a false Content-Length', async (t) => {
  const maxBodyBytes = 256;
  const f = configured(t, { maxBodyBytes });
  const before = databaseState(f.inspect);
  const text = JSON.stringify({ ...BUSINESS, subjectId: 'é'.repeat(70) });
  const encoded = new TextEncoder().encode(text);
  assert.ok(text.length < maxBodyBytes && encoded.byteLength > maxBodyBytes);
  const stream = bytesStream(Array.from(encoded, (byte) => Uint8Array.of(byte)), { stall: true, cancelRejects: true });
  await failure(await bounded(f.handler(request({ body: stream.body, headers: { 'content-length': '1' } })), 'oversize body'), 413);
  assert.equal(stream.cancellations(), 1);
  assert.equal(databaseState(f.inspect), before);
});

test('adversarial HTTP exact actual byte limit works and false Content-Length cannot produce success', async (t) => {
  const text = JSON.stringify(BUSINESS);
  const length = Buffer.byteLength(text);
  const f = configured(t, { maxBodyBytes: length });
  const chunks = [new TextEncoder().encode(text.slice(0, 17)), new TextEncoder().encode(text.slice(17))];
  const receipt = await submit(f.handler, { body: bytesStream(chunks).body });
  assert.equal(receipt.reward.quantity, BUSINESS.quantity);
  const before = databaseState(f.inspect);
  await failure(await f.handler(request({ headers: { 'content-length': '1' } })), 400);
  assert.equal(databaseState(f.inspect), before);
  const smaller = createRewardHttpHandler({ service: f.service, authenticate, maxBodyBytes: length - 1 });
  await failure(await smaller(request()), 413);
  assert.equal(databaseState(f.inspect), before);
});

test('adversarial HTTP stalled stream times out, cancels and releases its reader without service work', async (t) => {
  const f = configured(t, { bodyReadTimeoutMs: 25 });
  const before = databaseState(f.inspect);
  const stream = bytesStream([Uint8Array.of(0x7b)], { stall: true, cancelRejects: true });
  await failure(await bounded(f.handler(request({ body: stream.body })), 'body timeout'), 408);
  assert.equal(stream.cancellations(), 1);
  assert.equal(stream.body.locked, false);
  assert.equal(databaseState(f.inspect), before);
});

test('adversarial HTTP abort before dispatch and during stream reading prevents mutation and cleans up', async (t) => {
  const f = configured(t, { bodyReadTimeoutMs: 500 });
  const before = databaseState(f.inspect);
  const early = new AbortController();
  early.abort(new Error('private abort reason /keys/session'));
  const alreadyAborted = await bounded(f.handler(request({ signal: early.signal })), 'already aborted request');
  responseHeaders(alreadyAborted);
  assert.ok(alreadyAborted.status >= 400);
  const active = new AbortController();
  const stream = bytesStream([Uint8Array.of(0x7b)], { stall: true });
  const pending = f.handler(request({ body: stream.body, signal: active.signal }));
  setTimeout(() => active.abort(new Error('private abort reason')), 10);
  const response = await bounded(pending, 'midstream abort');
  responseHeaders(response);
  assert.ok(response.status >= 400);
  assert.equal(stream.cancellations(), 1);
  assert.equal(stream.body.locked, false);
  assert.equal(databaseState(f.inspect), before);
});

test('adversarial HTTP stream read failures and nonbyte chunks do not become success', async (t) => {
  const f = configured(t);
  const before = databaseState(f.inspect);
  for (const body of [new ReadableStream({ start(controller) { controller.error(new Error('/private/transport SELECT secret')); } }),
    new ReadableStream({ start(controller) { controller.enqueue('not Uint8Array'); controller.close(); } })]) {
    const response = await bounded(f.handler(request({ body })), 'invalid body stream');
    responseHeaders(response);
    assert.ok(response.status >= 400);
    assert.doesNotMatch(await response.text(), /private|SELECT|Uint8Array|transport/);
    assert.equal(databaseState(f.inspect), before);
  }
});

test('adversarial HTTP cross-issuer reads, transitions and replay require new authorization', async (t) => {
  const f = configured(t);
  const receipt = await submit(f.handler);
  const before = databaseState(f.inspect);
  for (const suffix of ['', '/ledger', '/approve', '/post', '/revoke']) {
    const method = suffix === '' || suffix === '/ledger' ? 'GET' : 'POST';
    const response = await f.handler(request({ path: `/v1/issuers/issuer-b/rewards/${receipt.reward.id}${suffix}`, method,
      key: suffix === '' || suffix === '/ledger' ? null : 'submit-1', body: { expectedVersion: 1 } }));
    await failure(response, 403);
    assert.equal(databaseState(f.inspect), before);
  }
  const issuerB = createRewardHttpHandler({ service: f.service, authenticate: () => ({ authenticated: true,
    context: { ...CONTEXT, issuer: 'issuer-b' } }) });
  for (const suffix of ['', '/ledger', '/approve']) {
    await failure(await issuerB(request({ path: `/v1/issuers/issuer-b/rewards/${receipt.reward.id}${suffix}`,
      method: suffix === '/approve' ? 'POST' : 'GET', body: { expectedVersion: 1 }, key: 'submit-1' })), 404);
    assert.equal(databaseState(f.inspect), before);
  }
  const revokedAuthorization = createRewardHttpHandler({ service: f.service, authenticate: () => ({ authenticated: true, context: {} }) });
  await failure(await revokedAuthorization(request()), 403);
  assert.equal(databaseState(f.inspect), before);
});

test('adversarial HTTP exact replay is historical; conflicting actor, payload, action and version never mutate', async (t) => {
  const f = configured(t);
  const submitted = await submit(f.handler);
  const submitState = databaseState(f.inspect);
  const reordered = Object.fromEntries(Object.entries(BUSINESS).reverse());
  assert.deepEqual(await submit(f.handler, { body: reordered }), submitted);
  assert.equal(databaseState(f.inspect), submitState);
  await failure(await f.handler(request({ body: { ...BUSINESS, quantity: '11' } })), 409, 'IDEMPOTENCY_CONFLICT');
  const otherActor = createRewardHttpHandler({ service: f.service, authenticate: () => ({ authenticated: true,
    context: { ...CONTEXT, actor: 'synthetic-actor-b' } }) });
  await failure(await otherActor(request()), 409, 'IDEMPOTENCY_CONFLICT');
  await failure(await command(f.handler, submitted.reward, 'approve', 'submit-1'), 409, 'IDEMPOTENCY_CONFLICT');
  assert.equal(databaseState(f.inspect), submitState);
  const approvedResponse = await command(f.handler, submitted.reward, 'approve', 'approve-1');
  assert.equal(approvedResponse.status, 200);
  const approved = (await readJson(approvedResponse)).data;
  const approvedState = databaseState(f.inspect);
  await failure(await command(f.handler, approved.reward, 'approve', 'approve-1'), 409, 'IDEMPOTENCY_CONFLICT');
  assert.equal(databaseState(f.inspect), approvedState);
  const postedResponse = await command(f.handler, approved.reward, 'post', 'post-1');
  assert.equal(postedResponse.status, 200);
  const posted = (await readJson(postedResponse)).data;
  const postedState = databaseState(f.inspect);
  const historical = await command(f.handler, submitted.reward, 'approve', 'approve-1');
  assert.equal(historical.status, 200);
  assert.deepEqual((await readJson(historical)).data, approved);
  assert.deepEqual(await submit(f.handler), submitted);
  assert.deepEqual(budget(f.inspect), { total: '100', reserved: '0', spent: '10' });
  const current = await f.handler(request({ path: `${COLLECTION}/${posted.reward.id}`, method: 'GET' }));
  assert.deepEqual((await readJson(current)).data, posted.reward);
  const ledgerResponse = await f.handler(request({ path: `${COLLECTION}/${posted.reward.id}/ledger`, method: 'GET' }));
  const ledger = (await readJson(ledgerResponse)).data;
  assert.equal(ledger.length, 2);
  assert.deepEqual(ledger.map((line) => line.quantity), ['10', '10']);
  await failure(await command(f.handler, posted.reward, 'revoke', 'revoke-1'), 409, 'INVALID_TRANSITION');
  assert.equal(databaseState(f.inspect), postedState);
});

test('adversarial HTTP idempotency key spaces stay issuer scoped with the real SQLite service', async (t) => {
  const f = configured(t);
  const first = await submit(f.handler);
  const secondHandler = createRewardHttpHandler({ service: f.service, authenticate: () => ({ authenticated: true,
    context: { ...CONTEXT, issuer: 'issuer-b' } }) });
  const second = await submit(secondHandler, { path: '/v1/issuers/issuer-b/rewards' });
  assert.equal(second.idempotencyKey, first.idempotencyKey);
  assert.equal(second.issuerId, 'issuer-b');
  assert.notEqual(second.reward.id, first.reward.id);
  const before = databaseState(f.inspect);
  assert.deepEqual(await submit(secondHandler, { path: '/v1/issuers/issuer-b/rewards' }), second);
  assert.equal(databaseState(f.inspect), before);
});

test('adversarial HTTP unknown and storage errors redact messages, causes and internal fields', async () => {
  const marker = 'PRIVATE_EVIDENCE SELECT secret FROM rewards /private/database.sqlite actor.context stack';
  for (const thrown of [new Error(marker), new RewardError('STORAGE_FAILURE', marker, { cause: new Error(marker) }),
    new RewardError('UNKNOWN_SCHEMA', marker), new RewardError('INVARIANT_VIOLATION', marker),
    Object.assign(new Error(marker), { code: 'NON_PUBLIC_CODE', context: marker, evidenceRef: marker })]) {
    const handler = createRewardHttpHandler({ service: fakeService(() => { throw thrown; }), authenticate });
    const response = await handler(request());
    responseHeaders(response);
    assert.equal(response.status, 500);
    const body = await response.text();
    assert.doesNotMatch(body, /PRIVATE|SELECT|database|actor|context|stack|NON_PUBLIC_CODE|UNKNOWN_SCHEMA|INVARIANT/);
    const parsed = JSON.parse(body);
    assert.deepEqual(Object.keys(parsed), ['error']);
    assert.deepEqual(Object.keys(parsed.error).sort(), ['code', 'message']);
  }
});

test('adversarial HTTP malformed or async service results cannot be emitted as success', async (t) => {
  const f = fixture(t);
  const valid = f.service.submitPending(submission());
  const current = f.service.getReward(read(valid));
  const malformed = [undefined, null, false, 42, 'success', {}, [], { ...valid, reward: null },
    { ...valid, issuerId: 'issuer-b' }, { ...valid, kind: 'current-command-receipt' },
    { ...valid, reward: { ...valid.reward, quantity: 10 } }];
  for (const value of malformed) {
    const handler = createRewardHttpHandler({ service: fakeService(() => value), authenticate });
    await failure(await handler(request()), 500);
  }
  for (const returned of [() => Promise.resolve(valid), () => Promise.reject(new Error('private rejected service')), () => new Promise(() => {})]) {
    const handler = createRewardHttpHandler({ service: fakeService(returned), authenticate });
    await failure(await bounded(handler(request()), 'async service result'), 500);
  }
  for (const [path, value] of [[`${COLLECTION}/${current.id}`, { ...current, id: 'other-reward' }],
    [`${COLLECTION}/${current.id}/ledger`, {}], [`${COLLECTION}/${current.id}/ledger`, [current]]]) {
    const handler = createRewardHttpHandler({ service: fakeService(() => value), authenticate });
    await failure(await handler(request({ path, method: 'GET' })), 500);
  }
});

test('adversarial HTTP timeout cleanup remains bounded when the source cancellation never resolves', async (t) => {
  const f = configured(t, { bodyReadTimeoutMs: 25 });
  const before = databaseState(f.inspect);
  const stream = bytesStream([Uint8Array.of(0x7b)], { stall: true, cancelStalls: true });
  await failure(await bounded(f.handler(request({ body: stream.body })), 'nonsettling cancellation'), 408);
  assert.equal(stream.cancellations(), 1);
  assert.equal(stream.body.locked, false);
  assert.equal(databaseState(f.inspect), before);
});

test('adversarial HTTP Content-Length framing rejects malformed headers and body claims on reads', async (t) => {
  const f = configured(t);
  const receipt = await submit(f.handler);
  const before = databaseState(f.inspect);
  for (const length of ['01', '-1', '1.0', '1e2', '1, 1', '+1']) {
    await failure(await f.handler(request({ headers: { 'content-length': length } })), 400);
    assert.equal(databaseState(f.inspect), before);
  }
  await failure(await f.handler(request({ headers: { 'content-length': '9999999999999999999999999' } })), 413);
  await failure(await f.handler(request({ path: `${COLLECTION}/${receipt.reward.id}`, method: 'GET', headers: { 'content-length': '1' } })), 400);
  assert.equal(databaseState(f.inspect), before);
});

test('adversarial HTTP accepted JSON media types preserve the exact synthetic command', async (t) => {
  const f = configured(t);
  for (const [index, mediaType] of ['application/json', 'Application/JSON; charset=UTF-8', 'application/json; charset="utf-8"'].entries()) {
    const sourceResultId = `synthetic-media-result-${index}`;
    const receipt = await submit(f.handler, { body: { ...BUSINESS, sourceResultId }, key: `media-${index}`,
      headers: { 'content-type': mediaType } });
    assert.equal(receipt.reward.sourceResultId, sourceResultId);
    assert.equal(receipt.reward.quantity, '10');
  }
});

test('adversarial HTTP abort during synchronous authentication prevents service dispatch', async () => {
  const controller = new AbortController();
  let calls = 0;
  const handler = createRewardHttpHandler({ service: fakeService(() => { calls += 1; }), authenticate() {
    controller.abort();
    return authenticate();
  } });
  const response = await handler(request({ path: `${COLLECTION}/reward-1`, method: 'GET', signal: controller.signal }));
  await failure(response, 400, 'REQUEST_ABORTED');
  assert.equal(calls, 0);
});

test('adversarial HTTP storage contention is retryable without disclosing storage internals', async () => {
  const handler = createRewardHttpHandler({ service: fakeService(() => {
    throw new RewardError('STORAGE_BUSY', 'SQLITE_BUSY /private/ledger.sqlite locked transaction');
  }), authenticate });
  const response = await handler(request());
  const value = await failure(response, 503, 'STORAGE_BUSY');
  assert.equal(response.headers.get('retry-after'), '1');
  assert.doesNotMatch(value.error.message, /SQLITE|private|ledger|transaction/);
});
