import { performance } from 'node:perf_hooks';
import { RewardError } from './errors.js';
import { id, quantity, version } from './validation.js';
import { exactObject, validateResponse } from './http-response.js';

const methods = ['submitPending', 'getReward', 'getLedger', 'approve', 'postCredit', 'revoke'];
const submitFields = ['subjectId', 'sourceResultId', 'evidenceRef', 'quantity', 'unitId'];
const transitions = new Map([['approve', 'approve'], ['post', 'postCredit'], ['revoke', 'revoke']]);
const errors = new Map([
  ['INVALID_REQUEST', [400, 'Invalid request.']],
  ['INVALID_INPUT', [400, 'Invalid input.']],
  ['REQUEST_ABORTED', [400, 'Request aborted.']],
  ['FORBIDDEN', [403, 'Access denied.']],
  ['NOT_FOUND', [404, 'Resource not found.']],
  ['METHOD_NOT_ALLOWED', [405, 'Method not allowed.']],
  ['REQUEST_TIMEOUT', [408, 'Request body read timed out.']],
  ['DUPLICATE_RESULT', [409, 'Business result already exists.']],
  ['IDEMPOTENCY_CONFLICT', [409, 'Idempotency key conflicts with an earlier command.']],
  ['VERSION_CONFLICT', [409, 'Reward version conflicts with the command.']],
  ['INVALID_TRANSITION', [409, 'Reward transition is not permitted.']],
  ['BUDGET_EXHAUSTED', [409, 'Available allocation is insufficient.']],
  ['PAYLOAD_TOO_LARGE', [413, 'Request body exceeds the byte limit.']],
  ['UNSUPPORTED_MEDIA_TYPE', [415, 'Unsupported request representation.']],
  ['STORAGE_BUSY', [503, 'Storage is busy; retry the same command later.']],
  ['INTERNAL_ERROR', [500, 'Internal service error.']],
]);
const publicDomainCodes = new Set([
  'INVALID_INPUT', 'FORBIDDEN', 'NOT_FOUND', 'DUPLICATE_RESULT', 'IDEMPOTENCY_CONFLICT',
  'VERSION_CONFLICT', 'INVALID_TRANSITION', 'BUDGET_EXHAUSTED', 'STORAGE_BUSY',
]);

class HttpError extends Error {
  constructor(code, headers = {}) {
    super(code);
    this.code = code;
    this.headers = headers;
  }
}

function json(value, status = 200, headers = {}) {
  return new Response(JSON.stringify(value), {
    status,
    headers: {
      ...headers,
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

function errorResponse(error, request) {
  const code = error instanceof HttpError || (error instanceof RewardError && publicDomainCodes.has(error.code))
    ? error.code : 'INTERNAL_ERROR';
  const [status, message] = errors.get(code);
  const response = json({ error: { code, message } }, status,
    code === 'STORAGE_BUSY' ? { 'Retry-After': '1' } : error instanceof HttpError ? error.headers : {});
  return request instanceof Request && request.method === 'HEAD'
    ? new Response(null, { status, headers: response.headers }) : response;
}

function route(request) {
  const url = new URL(request.url);
  if (!['http:', 'https:'].includes(url.protocol) || request.url.includes('?') || request.url.includes('#')) {
    throw new HttpError('INVALID_REQUEST');
  }
  const parts = url.pathname.split('/');
  if (parts[0] !== '' || parts[1] !== 'v1' || parts[2] !== 'issuers' || parts[4] !== 'rewards' ||
      parts.length < 5 || parts.length > 7) throw new HttpError('NOT_FOUND');
  const issuerId = id(parts[3], 'issuerId');
  let method = 'submitPending';
  let verb = 'POST';
  let rewardId;
  if (parts.length > 5) {
    rewardId = id(parts[5], 'rewardId');
    method = 'getReward';
    verb = 'GET';
  }
  if (parts.length === 7) {
    if (parts[6] === 'ledger') method = 'getLedger';
    else if (transitions.has(parts[6])) {
      method = transitions.get(parts[6]);
      verb = 'POST';
    } else throw new HttpError('NOT_FOUND');
  }
  if (request.method !== verb) throw new HttpError('METHOD_NOT_ALLOWED', { Allow: verb });
  return { issuerId, rewardId, method, verb };
}

function authenticateContext(authenticate, request) {
  try {
    const decision = authenticate(Object.freeze({
      method: request.method, url: request.url, headers: new Headers(request.headers), signal: request.signal,
    }));
    // This reference deliberately supports synchronous trusted adapters only.
    if (decision instanceof Promise) decision.catch(() => {});
    if (!exactObject(decision, ['authenticated', 'context']) || decision.authenticated !== true ||
        !decision.context || Object.getPrototypeOf(decision.context) !== Object.prototype) {
      throw new HttpError('FORBIDDEN');
    }
    return decision.context;
  } catch {
    throw new HttpError('FORBIDDEN');
  }
}

function contentLength(request, maxBodyBytes) {
  const length = request.headers.get('content-length');
  if (length === null) return null;
  if (!/^(0|[1-9][0-9]*)$/.test(length)) throw new HttpError('INVALID_REQUEST');
  // Compare decimal lengths first to avoid parsing an unbounded integer header.
  const maximum = String(maxBodyBytes);
  if (length.length > maximum.length || (length.length === maximum.length && length > maximum)) {
    throw new HttpError('PAYLOAD_TOO_LARGE');
  }
  return Number(length);
}

// A synthetic source can have a cancel() promise that never settles. Observe its
// failure without waiting; cleanup must not extend the body deadline.
function cancel(streamOrReader) {
  try { streamOrReader?.cancel().catch(() => {}); } catch { /* Already closed, errored or locked. */ }
}

async function readBody(request, maxBodyBytes, bodyReadTimeoutMs, declaredLength) {
  if (!request.body || request.bodyUsed || request.body.locked) throw new HttpError('INVALID_REQUEST');
  const reader = request.body.getReader();
  const deadline = performance.now() + bodyReadTimeoutMs;
  let timeout;
  let abort;
  let complete = false;
  const interrupted = new Promise((_, reject) => {
    abort = () => reject(new HttpError('REQUEST_ABORTED'));
    request.signal.addEventListener('abort', abort, { once: true });
    timeout = setTimeout(() => reject(new HttpError('REQUEST_TIMEOUT')), bodyReadTimeoutMs);
    if (request.signal.aborted) abort();
  });
  async function consume() {
    let bytes = 0;
    let text = '';
    const decoder = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true });
    while (true) {
      // Also bound immediately resolving/empty chunks, which can starve timers.
      if (request.signal.aborted) throw new HttpError('REQUEST_ABORTED');
      if (performance.now() >= deadline) throw new HttpError('REQUEST_TIMEOUT');
      const { done, value } = await reader.read();
      if (done) break;
      if (!(value instanceof Uint8Array)) throw new HttpError('INVALID_REQUEST');
      bytes += value.byteLength;
      if (bytes > maxBodyBytes) throw new HttpError('PAYLOAD_TOO_LARGE');
      text += decoder.decode(value, { stream: true });
    }
    text += decoder.decode();
    if (declaredLength !== null && declaredLength !== bytes) throw new HttpError('INVALID_REQUEST');
    return JSON.parse(text);
  }
  try {
    const value = await Promise.race([consume(), interrupted]);
    complete = true;
    return value;
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw new HttpError('INVALID_REQUEST');
  } finally {
    clearTimeout(timeout);
    request.signal.removeEventListener('abort', abort);
    if (!complete) cancel(reader);
    reader.releaseLock();
  }
}

function validatePayload(body, method) {
  const fields = method === 'submitPending' ? submitFields : ['expectedVersion'];
  if (!exactObject(body, fields)) throw new HttpError('INVALID_INPUT');
  if (method === 'submitPending') {
    for (const field of submitFields) {
      if (field === 'quantity') quantity(body[field]);
      else id(body[field], field);
    }
  } else version(body.expectedVersion);
  return body;
}

/** In-process Fetch boundary only: no listener, provider or deployment. */
export function createRewardHttpHandler({
  service, authenticate = () => ({ authenticated: false }), maxBodyBytes = 8192, bodyReadTimeoutMs = 1000,
} = {}) {
  if (!service || !methods.every((method) => typeof service[method] === 'function')) {
    throw new TypeError('A reward service is required');
  }
  if (typeof authenticate !== 'function') throw new TypeError('authenticate must be a function');
  if (!Number.isSafeInteger(maxBodyBytes) || maxBodyBytes < 1 || maxBodyBytes > 65536) {
    throw new TypeError('maxBodyBytes must be an integer from 1 to 65536');
  }
  if (!Number.isSafeInteger(bodyReadTimeoutMs) || bodyReadTimeoutMs < 1 || bodyReadTimeoutMs > 5000) {
    throw new TypeError('bodyReadTimeoutMs must be an integer from 1 to 5000');
  }
  return async function handle(request) {
    try {
      if (!(request instanceof Request)) throw new HttpError('INVALID_REQUEST');
      if (request.signal.aborted) throw new HttpError('REQUEST_ABORTED');
      const { issuerId, rewardId, method, verb } = route(request);
      if (request.headers.has('content-encoding')) throw new HttpError('UNSUPPORTED_MEDIA_TYPE');
      const declaredLength = contentLength(request, maxBodyBytes);
      let idempotencyKey;
      if (verb === 'POST') {
        const type = request.headers.get('content-type');
        if (!type || !/^application\/json(?:[ \t]*;[ \t]*charset=(?:utf-8|"utf-8"))?$/i.test(type)) {
          throw new HttpError('UNSUPPORTED_MEDIA_TYPE');
        }
        idempotencyKey = id(request.headers.get('idempotency-key'), 'Idempotency-Key');
      } else if (request.body !== null || (declaredLength !== null && declaredLength !== 0)) {
        throw new HttpError('INVALID_REQUEST');
      }
      const context = authenticateContext(authenticate, request);
      const body = verb === 'POST'
        ? validatePayload(await readBody(request, maxBodyBytes, bodyReadTimeoutMs, declaredLength), method) : {};
      if (request.signal.aborted) throw new HttpError('REQUEST_ABORTED');
      const input = verb === 'POST' ? { ...body, issuerId, idempotencyKey, context } : { issuerId, context };
      if (rewardId !== undefined) input.rewardId = rewardId;
      // The existing service owns authorization, transactions and replay. Never
      // replace its receipt with a fresh read or retry a failed command here.
      const result = service[method](input);
      if (result instanceof Promise) result.catch(() => {});
      if (result === undefined || (result !== null && typeof result.then === 'function')) {
        throw new Error('The reward service must return a synchronous result');
      }
      return json({ data: validateResponse(result, method, input) });
    } catch (error) {
      return errorResponse(error, request);
    } finally {
      if (request instanceof Request && !request.body?.locked) cancel(request.body);
    }
  };
}
