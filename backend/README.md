# Offline reward ledger reference

This package is a local reference implementation for reviewing reward accounting and failure behavior. It is not a running backend, a production-ready system, a pilot, or a connection to EDC or any blockchain. Use synthetic data only.

It has no HTTP server, login or authentication implementation, eligibility verification, real funding, wallet connection, signing keys, token issuance, campus payment, or frontend/contract integration. No live service or network call is made. Passing tests is not a security audit.

## Run locally

Use Node.js 22.12+ on the 22.x line, or Node.js 24.x. There are no third-party dependencies. Node 22.12 needs the experimental SQLite flag, included in the test command:

```sh
npm ci --prefix backend
npm test --prefix backend
```

Tests create temporary SQLite files and synthetic budgets. They never use real credentials, customers or funds. The package does not start a server.

## Service boundary

Exports live in `src/index.js`:

```js
import { createRewardService, createSqliteRewardRepository } from './src/index.js';

const repository = createSqliteRewardRepository({
  filename: '/absolute/path/to/local-reference.sqlite',
  busyTimeoutMs: 1000, // Integer from 0 to 5000; no automatic retry loop.
});
const service = createRewardService({ repository });
// This default service denies every command and every read.
// Close the file connection when finished:
repository.close();
```

All methods are synchronous. `createRewardService` accepts `repository`, optional `issuerAuthorization`, and optional `clock`. The clock returns a canonical UTC ISO timestamp such as `2026-01-01T00:00:00.000Z`; the default uses server time. The service generates reward IDs, command IDs, timestamps and versions. An application must keep the repository and filesystem private to trusted server code. The repository is an internal persistence interface, not an authorization boundary or a client API.

A future trusted server adapter must authenticate the caller independently, check the exact issuer, action and resource, and supply an actor identity. Client context is passed opaquely to this adapter; context fields and an issuer ID never authorize themselves. The adapter is invoked before any repository access, including idempotency replay and reads.

The authorization request is `{ context, issuerId, action, resource }`. A valid decision must contain exactly `{ allowed: true, actorId, issuerId, action, resource }`, matching the requested issuer, action and resource. `actorId` must be a valid identifier. A false, missing, thrown, malformed, mismatched, Promise or thenable decision denies access. Async adapters are unsupported; do not put network authorization into this synchronous reference.

Permissions are separate: `submit`, `approve`, `post`, `revoke`, and `read`. Resources are `{ subjectId, sourceResultId }` for submit, `{ rewardId }` for transitions, and `{ kind: 'reward' | 'ledger', rewardId }` for reads. A read permission for one kind need not grant the other.

The public service methods take named objects:

- `submitPending({ issuerId, subjectId, sourceResultId, evidenceRef, quantity, unitId, idempotencyKey, context })`
- `approve({ issuerId, rewardId, expectedVersion, idempotencyKey, context })`
- `postCredit({ issuerId, rewardId, expectedVersion, idempotencyKey, context })`
- `revoke({ issuerId, rewardId, expectedVersion, idempotencyKey, context })`
- `getReward({ issuerId, rewardId, context })`
- `getLedger({ issuerId, rewardId, context })`

Identifiers and request keys are 1–128 ASCII characters: first character alphanumeric, remaining characters alphanumeric or `.`, `_`, `:`, `-`. `evidenceRef` is an opaque identifier only; it is not a document upload, URL fetch, or assertion that evidence was verified. Unknown input fields are rejected.

## Lifecycle, amounts and budgets

The accepted state transitions are:

```text
pending (version 1) -> approved (version 2) -> posted (version 3, terminal)
pending (version 1) -> revoked (version 2, terminal)
approved (version 2) -> revoked (version 3, terminal)
```

Submission credits nothing. Approval atomically reserves issuer/unit budget and credits nothing. Posting consumes that reservation into spent budget and writes exactly two immutable ledger entries: a debit to `issuer_budget` and an equal credit to `subject`. Revoking an approved reward releases its reservation. A posted reward cannot be revoked. This stage defines no reversals, clawbacks, settlement or refunds.

The issuer, subject, source result, evidence reference, quantity and unit of a reward are immutable. `UNIQUE(issuer_id, source_result_id)` blocks business-result reuse even with a new request key or different subject.

Quantities are canonical positive base-10 integer strings, such as `'123456789012345678901234567890'`. Budgets also allow `'0'`. Arithmetic uses `BigInt`; SQLite amounts are `TEXT`, never floating point or SQLite integer amounts. Fractional, signed, scientific, leading-zero and whitespace forms are rejected. The 128-digit cap is a technical resource limit, not an issuance policy or denomination. Units are explicit; tests use `synthetic-test-units`. No EDC decimal scale, reward amount, exchange rate, entitlement or token economics is assumed.

Budget identity is `(issuerId, unitId)`, with `total`, `reserved` and `spent`. Missing budgets are unfunded, equivalent to zero. Invariants require nonnegative counters, `reserved + spent <= total`, reserved equal to approved unposted rewards, and spent equal to posted rewards. There is deliberately no public funding command. Only test fixture setup inserts synthetic budgets through its own database connection. Production funding, issuer onboarding, eligibility, approval policy and the authority that chooses a quantity remain unresolved design work.

## Idempotency and current state

A request key is unique across all actors and actions within one issuer. Its canonical fingerprint contains the exact actor supplied by authorization, action, issuer, request key and every meaningful command input, including `expectedVersion` for transitions. The same key and exact command return the same immutable historical command receipt. Any different actor, action or payload with that key conflicts. Different issuers have isolated key spaces.

Replay authorization happens first; then a matching stored receipt is returned before checking a fresh version. A successful old approval can therefore replay after the reward was posted, but its receipt remains explicitly historical:

```js
{
  kind: 'historical-command-receipt',
  commandId, issuerId, actorId, action, idempotencyKey, recordedAt,
  reward: {
    id, issuerId, subjectId, sourceResultId, evidenceRef,
    quantity, unitId, status, version, createdAt, updatedAt,
  },
}
```

Use `getReward` for current state. `getLedger` returns the current balanced pair for a posted reward, or an empty array for an existing unposted reward. Each line has `rewardId`, `direction`, `issuerId`, `subjectId`, `unitId`, `account`, `quantity`, and `createdAt`. Responses are deeply frozen. Cross-issuer reward access returns `NOT_FOUND` only after successful authorization for the requested issuer. Failed commands do not consume request keys.

## Persistence and failure behavior

The adapter uses file-backed native `node:sqlite`, prepared statements, STRICT tables, foreign keys, uniqueness constraints and CHECK constraints. Append-only triggers protect ledger lines, events and command receipts; additional triggers preserve reward identity, state transitions and fixed budget totals. These protections do not claim to resist a database administrator who can modify schema or files.

Connections require `journal_mode=DELETE`, `synchronous=EXTRA`, foreign keys enabled, and a bounded busy timeout. Each command uses `BEGIN IMMEDIATE`; state/version, reservations/spend, ledger entries, audit event and receipt commit together. No `await` occurs inside a transaction. Write or COMMIT failures trigger rollback. A rollback failure closes the adapter and surfaces an error. Optimistic `expectedVersion` is checked inside the write transaction.

On open, the adapter checks SQLite integrity, recognizes the exact versioned schema before changing persistent journaling settings, and checks cross-table invariants. Unknown versions, schema changes, corrupt files, inaccessible paths and invariant violations fail. It never resets a database, migrates downward or falls back to memory. Empty files initialize schema version 1; no migration mechanism is provided. Full invariant scans run on open and at command boundaries, including fingerprint reconstruction from immutable reward/event history.

This synchronous, full-scan implementation blocks its Node process and is intended only for small offline review fixtures. It has no pagination, operational monitoring, backup/restore workflow, authentication infrastructure, privacy/retention policy, production availability guarantee or load qualification. Filesystem access, recovery, migrations and a scalable transactional adapter need separate design before real use.

Service failures expose a `RewardError` with a stable `code`, including `INVALID_INPUT`, `FORBIDDEN`, `NOT_FOUND`, `DUPLICATE_RESULT`, `IDEMPOTENCY_CONFLICT`, `VERSION_CONFLICT`, `INVALID_TRANSITION`, `BUDGET_EXHAUSTED`, `STORAGE_BUSY`, `STORAGE_FAILURE`, `UNKNOWN_SCHEMA`, `INVARIANT_VIOLATION`, `INVALID_CLOCK`, and `REPOSITORY_CLOSED`. Low-level open failures can also be native SQLite/filesystem errors. No failure should be interpreted as a successful reward.

## Verification coverage

The tests exercise authorization failures and forged/cross-issuer requests; every lifecycle path; result/key replay and conflicts; historical receipts versus current state; file close/reopen; exact amounts beyond 64-bit; budget exhaustion and reservation release; optimistic conflicts; schema protection and unknown/corrupt storage; injected partial-ledger, audit and receipt failures; rollback after COMMIT fails; bounded lock errors; and real child-process races for competing approvals, duplicate posting and posting versus revocation.

An independently written suite also kills real child processes after budget, first ledger-side, reward, event and receipt writes, and after COMMIT before the response returns. Every case requires proof that the selected crash point was reached, then reopens storage and retries to verify a single complete outcome. This establishes process-crash behavior on the test filesystem, not durability under power loss, disk failure or distributed deployment. The crash wrappers exist only in isolated test processes; the service has no fault-injection API.

Implementation references: [Node 22.12 SQLite API](https://nodejs.org/download/release/v22.12.0/docs/api/sqlite.html), [Node 24.19 SQLite API](https://nodejs.org/download/release/v24.19.0/docs/api/sqlite.html), [SQLite transactions](https://www.sqlite.org/lang_transaction.html), and [SQLite synchronization settings](https://www.sqlite.org/pragma.html#pragma_synchronous).
