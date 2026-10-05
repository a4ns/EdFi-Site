# EdFi localization and demo-rate validation

Validated locally on 5 October 2026. This is a point-in-time report for the EN/RU/KK localization layer. It does not claim a browser pass, a merge, a deployment or production readiness.

## Exact bases and scope

- Repository: `a4ns/EdFi-Site`
- Isolated local checkout: feature branch `feat/localize-student-interface`
- Incremental base: `08848713f02871f5399982f4ec1c939a41142717`, the verified integrated quality tree
- Cumulative patch base: PR #4 head `a32c874d1c4eeed6ae2ed00526671af0ec9e5146`
- The original integrated checkout was left unchanged

The cumulative patch includes the earlier demo-accounting fixes and contract-hardening checks, followed by this localization layer. Apply that patch to the exact PR #4 head above, not to `main`. Alternatively, apply only the incremental patch to the integrated tree. Do not apply both patches to the same checkout.

No runtime or development dependency, lockfile, Solidity source, contract test or CI workflow was changed in this layer. The only reducer change adds language-neutral display metadata to a withdrawal recipient; the original value and accounting behavior remain intact.

## Delivered behavior

- English, Russian and Kazakh across landing sections, markets, dashboard, navigation, search, authentication demo, account/settings, notifications, forms, errors, toasts and receipts
- 422 unique source messages, including 50 shared messages defined once; parity, placeholder, plural-category and source-use checks
- Accessible language selectors in the desktop header, mobile drawer, footer and settings, using language autonyms
- Explicit English default; safe `edfi.locale` preference persistence, invalid-value rejection, in-memory fallback for blocked storage and cross-tab sync
- Localized document language and page titles; no route/provider remount keyed by language
- `Intl` number, date, percent, currency, compact-number and plural formatting
- Exact integer-hundredth EDC display, including negative and largest safe amounts; dot/comma input support and integer Max/percentage calculations preserved
- Open form values, selected merchant, tasks, balances, full ledger, pending settlement, notifications and receipts survive a language change
- Fixed `1 USD = 520 KZT` conversion visibly described as a demo assumption, not a live exchange rate; no FX service added
- Prototype copy corrected to distinguish sample rewards, planned campus pilot, undeployed contracts and web demo from future live/native-app features
- Translated labels allowed to wrap in cards, dialogs and navigation; long receipt IDs and dates kept within flexible containers

English source keys remain in data and reducer state. Translation happens on render, so earlier transactions and active toasts also change language without mutating financial records. Demo amounts remain distinct from the token's 18-decimal base units.

## Executed checks

Runtime: Node.js 24.19.0, npm 11.9.0. Frontend: Vite 7.3.6, Vitest 4.1.11, jsdom 26.1.0. Contracts: Hardhat 2.29.1, Solidity 0.8.28, OpenZeppelin 5.6.1.

| Check | Result |
| --- | --- |
| Fresh root locked install, offline cache, lifecycle scripts enabled | Passed; 311 packages |
| Fresh contract locked install, offline cache, lifecycle scripts enabled | Passed; 642 packages |
| Full frontend `npm test` | 241 passed in 12 files, including all prior regressions |
| Strict `npm run lint -- --max-warnings=0` | Passed; 0 errors and warnings |
| `npm run build` | Passed; no chunk-size warning |
| Contract `npm test` | 57 passed |
| Contract `npm run coverage` and enforced line gate | Passed; 57 tests |
| Solidity line / branch / statement / function coverage | 100% / 100% / 100% / 100% |
| Dictionary keys, duplicates, placeholders, plural categories and UI literal audit | Passed |
| Localized claim, pay, withdraw, receipts, invalid input and no-network assertions | Passed |
| Locale storage denial, invalid values, reload preference and listener cleanup | Passed |
| Form, filter, sorting, notification, FAQ and wallet state preservation | Passed |
| Independent implementation and Kazakh/Russian terminology review | Completed; reported title/copy findings corrected and rechecked |
| `git diff --check` | Passed |

Compared with the integrated baseline, the frontend suite adds 53 tests. It covers both successful and interrupted/repeated demo flows; it is not snapshot-only. The independent review also checked 6,000 signed amount-format cases around the safe-integer range. Existing exact-accounting, request deduplication, full-ledger/day-boundary and contract adversarial checks still pass.

Install, final test, lint, build and coverage logs are included in the delivery ZIP. Temporary writable npm/compiler caches and XDG directories were used because this environment's home directories are read-only. The committed configuration was not changed for installation. Existing npm environment/deprecation/update notices are distinct from lint or build failures.

## Publication status of the earlier integrated base

During this task, the separately authorized publisher created [draft PR #5](https://github.com/a4ns/EdFi-Site/pull/5) on `fix/integrated-quality`, stacked on the unchanged PR #4 branch. Published base commit `963086458d69fc1395009a7ff1b5c4b8f4db7b3a` has the same tree (`3649c61ef34318fcca0aaf3b66b0156ed5b54dd8`) as local incremental base `0884871`.

The publisher verified [the integrated base's CI run](https://github.com/a4ns/EdFi-Site/actions/runs/37298721892): web and contract jobs passed on Node 22 and 24 for that exact remote base. Those results validate the earlier integrated tree, **not this new localization layer**. Localization still needs publication and exact-head CI verification through the authorized publisher. Its commit metadata must not be forced over the remote branch history.

The earlier reports in this folder are historical pre-publication snapshots. Their then-current GitHub access and Node 22 limits are superseded only for the integrated base by the verified run above.

## Remaining limits and required follow-through

- Real-browser visual/console QA at 1440, 820 and 390 pixels, in both themes and all languages, remains unverified
- Real-browser claim/pay/withdraw, modal dismissal/reopen, navigation interruptions and screenshots remain required
- Prior local browser attempts were blocked by socket creation and rejection of local-file URLs; no denied route was bypassed or retried for this layer
- The published integrated-base preview was reported ready but required Vercel sign-in; this is not evidence that localization has been visually checked
- Node 22 was not available for this local localization run; its exact-head CI is still required after publication
- Existing README screenshots have not been refreshed and do not demonstrate the new translations
- Native-speaker product review can still refine wording; the independent technical/language review is not a user acceptance test
- Dependency audits were not rerun because package graphs are unchanged. The earlier frontend audit reported zero production findings and five high build-time entries in the braces/Tailwind chain; see [the baseline audit scope](demo-integrity.md#dependency-audit-and-remediation). No clean contract audit is claimed
- Contracts are undeployed and unaudited. Full coverage does not prove security, economics or production readiness

No new wallet connection, real payment, rate API, backend, testnet deployment, key handling, merge or production deployment is included. Completion of this local layer does not mean every AGENTS roadmap item is complete.
