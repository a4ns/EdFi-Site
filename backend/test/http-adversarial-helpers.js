import assert from 'node:assert/strict';

export const COLLECTION = '/v1/issuers/issuer-a/rewards';
export const BUSINESS = Object.freeze({
  subjectId: 'synthetic-subject-1',
  sourceResultId: 'synthetic-result-1',
  evidenceRef: 'opaque-evidence-1',
  quantity: '10',
  unitId: 'synthetic-test-units',
});

export function request({ path = COLLECTION, method = 'POST', body = BUSINESS,
  key = 'submit-1', headers = {}, signal } = {}) {
  const allHeaders = new Headers(headers);
  if (key !== null) allHeaders.set('Idempotency-Key', key);
  const init = { method, headers: allHeaders, signal };
  if (body !== undefined && method !== 'GET' && method !== 'HEAD') {
    if (!allHeaders.has('Content-Type')) allHeaders.set('Content-Type', 'application/json');
    init.body = typeof body === 'string' || body instanceof Uint8Array || body instanceof ReadableStream
      ? body : JSON.stringify(body);
    if (body instanceof ReadableStream) init.duplex = 'half';
  }
  return new Request(`https://synthetic.invalid${path}`, init);
}

export function databaseState(inspect) {
  return JSON.stringify(Object.fromEntries(['budgets', 'rewards', 'ledger', 'events', 'command_receipts']
    .map((table) => [table, inspect.prepare(`SELECT * FROM ${table} ORDER BY rowid`).all()])));
}

export function responseHeaders(response) {
  assert.equal(response.headers.get('content-type'), 'application/json; charset=utf-8');
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
}

export async function bounded(promise, label, timeoutMs = 1000) {
  let timer;
  try {
    return await Promise.race([promise, new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error(`${label} failed to settle within ${timeoutMs}ms`)), timeoutMs);
    })]);
  } finally {
    clearTimeout(timer);
  }
}

export function bytesStream(chunks, { stall = false, cancelRejects = false, cancelStalls = false } = {}) {
  let index = 0;
  let cancellations = 0;
  const body = new ReadableStream({
    pull(controller) {
      if (index < chunks.length) controller.enqueue(chunks[index++]);
      else if (!stall) controller.close();
    },
    cancel() {
      cancellations += 1;
      if (cancelRejects) return Promise.reject(new Error('synthetic cancellation failure'));
      if (cancelStalls) return new Promise(() => {});
    },
  });
  return { body, cancellations: () => cancellations };
}

export async function readJson(response) {
  responseHeaders(response);
  return response.json();
}
