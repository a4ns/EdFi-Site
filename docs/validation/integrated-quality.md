# Integrated EdFi quality patch

Validated locally on 5 October 2026. This report covers one combined patch for [PR #4](https://github.com/a4ns/EdFi-Site/pull/4), not a merge or deployment.

> Historical snapshot: subsequent authorized publication of this integrated tree and the next localization layer are recorded in [localization validation](localization.md). The local results below remain unchanged.

## Exact base and scope

- Repository: `a4ns/EdFi-Site`
- PR source branch: `claude/wonderful-euler-eb404w`
- Exact patch base: `a32c874d1c4eeed6ae2ed00526671af0ec9e5146`
- PR head checked read-only before integration and again at 10:31 UTC on 5 October 2026; unchanged
- `main` base: `e2295e814c46cbb9491e6bbe3c07eecb62f05e7c`

The combined patch supersedes applying the standalone frontend and contract-hardening patches separately. It must be applied to the PR head above, **not directly to main**. A new isolated checkout was used; neither source checkout was modified.

The integration preserves all 31 non-documentation/non-workflow result files from the original patches byte-for-byte. It reconciles shared README and AGENTS content, updates the contract setup instructions, and consolidates workflow changes into a single `.github/workflows/ci.yml`. Separate frontend and contract package files/lockfiles remain intact. ESLint still excludes contracts; Vitest still includes only `src` tests.

## Changes retained

### Frontend demo

- Exact integer-hundredth accounting, consistent amount parsing, Max and percentage presets
- Atomic wallet/task/ledger transitions and request deduplication
- Full session ledger for earnings, with only eight entries displayed
- Local-calendar-day earnings, midnight/background-tab refresh and timer cleanup
- Explicit simulation disclosures, a non-wallet deposit QR preview and no invented blockchain transaction hashes
- Dialog focus handling across scan/form/receipt transitions, cancel/reopen and keyboard interaction
- Compatible dependency fixes from the original frontend patch; no additional dependency changes during integration

### Contracts

- Reject a zero EDCToken admin at deployment
- Preserve 35 additional adversarial tests, bringing the suite to 57
- Signature domain/payload validation, cap/deadline boundaries, role revocation and atomic rollback coverage
- Genuine permit front-running, consumed-permit replay, caller/victim isolation and failed-payment atomicity checks
- An explicit line-coverage gate chained into `npm run coverage`
- Correct security documentation: no aggregate issuance budget; role configuration is trusted; order IDs remain receipt metadata and permit fallback remains supported

AGENTS now records both sets of invariants, separate validation commands, demo safety, local-only secret handling and the requirement for authorization before publication, merge or deployment.

## Executed checks

Local runtime: Node.js 24.19.0, npm 11.9.0. Frontend: Vite 7.3.6, Vitest 4.1.11, jsdom 26.1.0. Contracts: Hardhat 2.29.1, Solidity 0.8.28 targeting Cancun, OpenZeppelin 5.6.1, solidity-coverage 0.8.17.

| Check | Result |
| --- | --- |
| Fresh root `npm ci --offline --no-audit --no-fund` using copied cache | Passed; 311 packages |
| Fresh contract `npm ci --offline --no-audit --no-fund` using copied cache, with lifecycle scripts enabled | Passed; 642 packages |
| Root `TZ=UTC npm test` | 188 passed in 5 files |
| Root `npm run lint -- --max-warnings=0` | Passed; 0 errors and 0 warnings |
| Root `npm run build` | Passed |
| Contract `npm test` | 57 passed; clean compilation of 32 Solidity files |
| Contract `npm run coverage` | 57 passed; coverage gate passed |
| Project Solidity line / branch / statement / function coverage | 100% / 100% / 100% / 100% |
| Coverage totals | 43 lines, 50 branches, 34 statements, 13 functions covered |
| Separate reduced-coverage negative check | Rejected 93.02% line coverage, exit 1 |
| Missing-coverage negative check | Rejected, exit 1 |
| JavaScript test syntax | Passed |
| Consolidated CI configuration assertions | Passed |
| Original code/test/config/lockfile preservation | All 31 relevant files match |
| Independent integration review | No findings in code preservation, docs, test isolation or workflow configuration |
| `git diff --check` | Passed |

The clean installs use the committed lockfiles and previously populated package caches. Temporary copied npm/compiler caches and writable XDG directories were used because the environment's home directory is read-only. The normal lifecycle-enabled contract install was rerun after an initial scripts-disabled install. No tracked runtime configuration or dependency lockfile was changed by installation.

npm emitted an environment-level `http-proxy` notice and existing contract transitive-dependency deprecation notices. These are separate from the clean lint/build results. The bundle includes test, build, installation and coverage logs.

## CI configuration

A single workflow now has separate web and contract jobs, each with a Node 22/24 matrix. It checks out the exact PR head (or push SHA), disables persisted checkout credentials, grants only `contents: read`, and uses pinned official actions:

- [actions/checkout v7.0.1](https://github.com/actions/checkout/commit/3d3c42e5aac5ba805825da76410c181273ba90b1)
- [actions/setup-node v6.5.0](https://github.com/actions/setup-node/commit/249970729cb0ef3589644e2896645e5dc5ba9c38)

Web jobs run locked installation, tests, strict lint and build. Contract jobs use the contract lockfile/cache and working directory, then run tests and coverage with the failing threshold. Duplicate frontend workflow execution is removed.

The action commits were independently verified against the official repositories. **The workflow has not run remotely, and Node 22 was not available for local execution.** Matrix configuration is not evidence of a Node 22 pass. If required-status rules refer to the former job display names, review them when publication becomes available; this patch does not change repository settings.

## Dependency-audit limits

The frontend dependency graph is byte-identical to the separately validated frontend patch. Its audit from 5 October 2026 reported zero production vulnerabilities and five high-severity entries in the same build-time braces/Tailwind chain. That audit was not rerun during integration. See [the frontend validation report](demo-integrity.md#dependency-audit-and-remediation) for exact scope and advisory links.

Those results do not cover contract dependencies. No clean contract dependency audit is claimed. No forced major upgrade, new tokenomics, aggregate issuance policy or order-ID policy was introduced.

## Remaining verification and publication limits

- Actual browser rendering/console checks at 1440, 820 and 390 pixels, in both themes, remain required
- Real-browser claim/pay/withdraw flows, cancellation/reopening, navigation interruptions and screenshots remain required
- Existing README screenshots have not been refreshed for these local changes
- Remote CI for the exact published commit and a Vercel preview remain required
- Node 22 execution remains unverified locally
- Contracts remain undeployed and unaudited; full project-source coverage is not a security audit or proof of production readiness

Earlier browser attempts were blocked by native browser socket creation and managed-browser rejection of local-file URLs. This integration did not retry a denied route, bypass security controls or publish an alternative preview. jsdom tests are not a visual-browser pass.

Earlier publication failed with GitHub HTTP 403. No remote write was retried for this integration. No branch, remote commit, PR edit, merge, deployment, key entry or access-setting change was made. The existing live site, main and PR #4 remain unchanged.
