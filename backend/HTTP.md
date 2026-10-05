# In-process HTTP reference contract

`createRewardHttpHandler` adapts the [offline reward service](README.md) to built-in Fetch `Request` and `Response` objects on Node 22.12/24. It is dependency-free and does not start a listener or make network calls. Use synthetic fixtures only.

This is not a running server, real authentication provider, production transport guarantee, CORS policy, or deployment. It supplies no login UI, credential scheme, TLS, proxy configuration, request-header limit, rate limiting, origin policy, CSRF protection, pagination, operational monitoring, or real academic verification/funding. Verification through a trusted institutional system is intended; issuer onboarding, the concrete trusted adapter, access and event semantics remain unresolved. A future hosting/authentication design must address these concerns before exposing it to a network. Passing in-process tests is not a security audit.

## Factory and trust boundary

```js
import { createRewardHttpHandler } from './src/index.js';

const handle = createRewardHttpHandler({
  service,                    // Existing synchronous reward service; required.
  authenticate,               // Trusted synchronous callback; default denies all.
  maxBodyBytes: 8192,          // Integer 1–65536, actual UTF-8 bytes.
  bodyReadTimeoutMs: 1000,     // Integer 1–5000, total body-read deadline.
});
const response = await handle(request);
```

Invalid configuration throws `TypeError` when constructing the handler. Each invocation requires a built-in `Request`; malformed input returns a JSON error. The returned handler is asynchronous only to read the request body. The service and authentication callback are synchronous; Promise/thenable results are unsupported, and rejected native Promises are observed.

`authenticate` receives a frozen object `{ method, url, headers, signal }`. `headers` is a separate mutable `Headers` copy; `signal` is the incoming request signal. It receives no body. This metadata is untrusted input for a future trusted adapter to verify; the handler never converts a header, cookie, URL issuer, body field, or claimed role into an identity itself.

The only successful authentication decision is a plain object with exactly two own data properties:

```js
{ authenticated: true, context: trustedContext }
```

`trustedContext` must be a plain object supplied by trusted configuration. It is passed unchanged to the existing service and is never merged with request fields. Missing/false/throwing/malformed/async decisions deny access with `403 FORBIDDEN`. A default handler denies even if caller-supplied headers claim an actor, issuer, session, role, or token. No authentication scheme or challenge has been selected, so the handler does not emit `401` or `WWW-Authenticate`.

Authentication does not grant issuer permissions. The service's separate `issuerAuthorization` must still authorize the exact issuer, action and resource and supply the trusted actor, on every call including reads and historical replays. The URL issuer is routing scope only. Body validation occurs before any service call; authentication occurs before reading a mutation body. Trusted callbacks must be short and nonblocking: the body deadline cannot interrupt synchronous JavaScript, synchronous SQLite work, or a synchronous callback.

## Routes and bodies

All paths below are exact and case-sensitive; no endpoint aliases or method override are supported. `{issuerId}` and `{rewardId}` are literal identifier segments, not braces in a request.

| Method | Path | Service operation | JSON body |
| --- | --- | --- | --- |
| POST | `/v1/issuers/{issuerId}/rewards` | `submitPending` | Submission object below |
| GET | `/v1/issuers/{issuerId}/rewards/{rewardId}` | `getReward` | None |
| GET | `/v1/issuers/{issuerId}/rewards/{rewardId}/ledger` | `getLedger` | None |
| POST | `/v1/issuers/{issuerId}/rewards/{rewardId}/approve` | `approve` | `{ "expectedVersion": 1 }` |
| POST | `/v1/issuers/{issuerId}/rewards/{rewardId}/post` | `postCredit` | `{ "expectedVersion": 2 }` |
| POST | `/v1/issuers/{issuerId}/rewards/{rewardId}/revoke` | `revoke` | `{ "expectedVersion": 1 }` or version 2 |

Submission requires exactly these five fields:

```json
{
  "subjectId": "synthetic-subject-1",
  "sourceResultId": "synthetic-result-1",
  "evidenceRef": "opaque-evidence-1",
  "quantity": "10",
  "unitId": "synthetic-test-units"
}
```

Every mutation requires `Idempotency-Key`. Identifiers and this key match `[A-Za-z0-9][A-Za-z0-9._:-]{0,127}`. Body identifiers must be strings; quantity is a canonical positive decimal integer string of at most 128 digits. `expectedVersion` is an integer JSON number from 1 to 3; the service determines the allowed transition and current version. No token scale or economic entitlement is implied.

Objects must contain every listed field and no others. Arrays, null, missing fields, wrong types, and unknown fields are refused. In particular, `actorId`, `role`, `context`, `issuerId`, `rewardId`, `idempotencyKey`, state, and timestamps cannot be supplied in the body. Transitions cannot alter immutable reward fields.

Only HTTP(S) Fetch URLs are accepted. Queries (including a bare `?`) and fragments are refused with 400. Percent-encoded identifier segments, Unicode, slashes inside identifiers, and empty identifiers are refused; no further URL decoding is performed. Unknown path structures/suffixes return 404; identifier syntax errors, including an empty reward segment after a trailing slash, return 400. `Request`/`URL` may have normalized the URL before the handler sees it, including dot segments; this handler cannot validate lost wire-level spelling. A network adapter would need its own raw-target policy.

Only the listed method for a recognized route is allowed. Other methods, including HEAD and OPTIONS, return 405 with `Allow: GET` or `Allow: POST` as appropriate. Every actual HEAD response has an empty body, including 400/404/405 errors, while retaining the response headers. HEAD does not invoke a service read. Reads require an absent body and absent or zero `Content-Length`.

## Representation and bounded reads

Mutation `Content-Type` must be `application/json`, optionally with the sole `charset=utf-8` parameter (case-insensitive; quoted `"utf-8"` is also accepted). Only HTTP optional whitespace (space/tab) is accepted around the semicolon, with no whitespace around `=`. JSON suffix media types, other parameters, charsets, malformed whitespace, missing media types and every `Content-Encoding` header, including `identity`, return 415. No decompression is performed.

The body must be well-formed UTF-8 and JSON; a byte-order mark is refused. Actual incoming bytes are counted across chunks, including multibyte text. An absent or dishonest `Content-Length` never bypasses the limit. A provided length must be a canonical nonnegative decimal integer: malformed lengths return 400, lengths above the configured maximum return 413, and a completed body's length mismatch returns 400. Oversized actual content returns 413 even when the declared length is smaller.

The total body-read deadline covers stalled reads and streaming chunks. The handler also checks elapsed time between immediately available chunks, including empty chunks. Deadline expiry returns 408; an aborted request returns 400 `REQUEST_ABORTED`. No service call occurs if abort is observed before dispatch. Once a synchronous service operation begins, a response loss/abort cannot establish that it rolled back: retry the exact key and command to recover its receipt.

On failure, the handler requests stream cancellation, observes cancellation rejection, removes its abort listener, clears its timer and releases its own reader. It never waits indefinitely for a synthetic source's cancellation promise. It does not take over a body reader already locked by another caller. The byte and time bounds apply to this body reader, not to memory already allocated by a caller or to hostile synchronous code inside a trusted adapter/stream implementation. An external server must separately bound network connections, headers and buffering.

## Responses, replay and errors

All successful operations return status 200 and exactly `{ "data": result }`, where `result` is the unchanged service result: a historical command receipt for mutations, current reward object for `getReward`, or current ledger array for `getLedger`. Receipt/reward/ledger field definitions are in [the service contract](README.md#idempotency-and-current-state). There is no fabricated success response after a thrown service error and no automatic retry loop.

Repeating the same authorized command/key returns the exact historical receipt, including its original actor, IDs, version and timestamps. Thus an old approval replay can still report `approved` after posting. Use the GET reward route for current state. A changed actor, action, or business input with that key conflicts. The handler neither caches authentication nor replaces a replay with a fresh read.

Every response, including errors, has `Content-Type: application/json; charset=utf-8`, `Cache-Control: no-store` and `X-Content-Type-Options: nosniff`. It emits no CORS headers. Except for bodyless HEAD responses, errors have only `{ "error": { "code": "...", "message": "..." } }`; messages are fixed public text, never an exception message, stack, cause, SQL, filesystem path, context, token, or evidence details. Service response fields/types and route scope are validated before serialization: malformed/async results, accidental extra fields and mismatched issuer/reward/key/action become generic 500. This DTO check does not replace the existing domain and ledger invariants.

| Status | Public error codes |
| --- | --- |
| 400 | `INVALID_REQUEST`, `INVALID_INPUT`, `REQUEST_ABORTED` |
| 403 | `FORBIDDEN` |
| 404 | `NOT_FOUND` |
| 405 | `METHOD_NOT_ALLOWED` (includes `Allow`) |
| 408 | `REQUEST_TIMEOUT` |
| 409 | `DUPLICATE_RESULT`, `IDEMPOTENCY_CONFLICT`, `VERSION_CONFLICT`, `INVALID_TRANSITION`, `BUDGET_EXHAUSTED` |
| 413 | `PAYLOAD_TOO_LARGE` |
| 415 | `UNSUPPORTED_MEDIA_TYPE` |
| 503 | `STORAGE_BUSY` (includes `Retry-After: 1`; retry the same command/key later) |
| 500 | `INTERNAL_ERROR` |

Only the listed public domain codes on actual `RewardError` instances are exposed. Other storage/invariant/schema/clock/closed-repository failures, unknown errors, and plain objects with a forged `code` become generic 500. The service's transaction and bounded SQLite lock-wait behavior is unchanged.

## Local verification

`npm test --prefix backend` runs Fetch handler tests and the existing service/persistence suite. Exact Node 22.12 needs `--experimental-sqlite`, as already included in the package command. The handler tests use real in-process `Request`/`Response` objects, synthetic SQLite records, stream stalls/abort/byte limits, and failure injection; they never listen on a socket or contact a provider.

## Future institutional adapter decisions

The intended verification source is the university's system, with Moodle also used for some learning activity. KU's public [Registrar transcript documentation](https://www.ku.edu.kz/page/view?id=1310&lang=ru) refers to the Electronic Rectorate, and a [KU Moodle site](https://moodle.ku.edu.kz/?lang=ru) exists. These observations do not establish API/export access, consent to process student records, an authoritative source for each reward, or an enabled EdFi integration. No connector is implemented here.

The future trusted adapter must keep source-namespaced transport events separate from canonical academic results. A source/event ID can identify an incoming delivery; the same academic achievement appearing in Moodle and the Registrar must still map to one canonical business result. `Idempotency-Key` and `sourceResultId` are distinct current fields, not a complete cross-system reconciliation policy. Corrections need an explicit result-version/finality policy and must not automatically issue another reward. In particular, the existing `posted` terminal state provides no automatic clawback or correction mechanism. Source authority, mappings, permitted fields, access, and correction rules require institutional decisions before real ingestion; student browser assertions cannot replace them.
