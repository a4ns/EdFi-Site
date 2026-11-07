# Demo integrity validation

Original frontend patch validated locally on 2026-10-05, against base commit `e2295e814c46cbb9491e6bbe3c07eecb62f05e7c`.

## Scope

This report records the original frontend patch. It covers demo accounting and disclosure only; it does not integrate a wallet, sign or broadcast transactions, implement an oracle, or deploy contracts. The final combined patch also includes contract hardening; see [integrated validation](integrated-quality.md) for its base, checks and current limitations.

- All editable wallet amounts, rewards and ledger movements use integer hundredths. Parsing, Max, percentage presets and reducer validation use the same units.
- The full in-memory ledger is retained. Only the most recent eight entries are rendered; spending cannot erase earned rewards.
- Daily earnings use the device's local calendar day, including DST, midnight rollover, background-tab return and mounting across midnight. The misleading earnings-growth percentage has been removed.
- Deposit shows a non-wallet QR payload and a warning not to send funds. Payment and withdrawal receipts explicitly describe local simulation and do not invent blockchain hashes.
- The reducer validates amounts, merchant/address inputs and available balances, and deduplicates request IDs and claimed tasks atomically.
- Dialog focus survives scan/form/receipt changes and is restored to the opener on dismissal. Pending simulation timers are cleaned up on unmount.

## Executed checks

Environment: Node.js 24.19.0, npm 11.9.0, Vite 7.3.6, Vitest 4.1.11, jsdom 26.1.0.

| Check | Result |
| --- | --- |
| Clean `npm ci` from lockfile, using the previously populated cache offline | Passed |
| `npm test` | Passed: 188 tests in 5 files |
| `npm run lint` | Passed: no ESLint errors or warnings |
| `npm run build` | Passed |
| `git diff --check` | Passed |
| Independent DOM reproduction of form-to-receipt keyboard focus (desktop/touch variants) | Passed |
| Independent DOM reproduction of the midnight mount/effect boundary | Passed |

npm reports an environment-level `http-proxy` configuration notice. This is not an ESLint finding or build failure.

## Regression coverage

- Pay 449.99 from 450.00, then pay Max 0.01: exactly zero remains
- Pay 448.99, then withdraw Max 1.01: exactly zero remains
- Reject actual one-cent overspends, unsupported precision, negative/zero values, invalid addresses, non-finite and unsafe integer values
- Repeated and stale claim/pay/withdraw requests cannot credit or debit twice
- Eight or more payments do not remove reward earnings; a claimed 25.00 remains included
- Calendar-day boundaries in UTC, Asia/Almaty and 23-/25-hour DST days
- Cancel scan, payment and withdrawal forms; reopen without stale amounts, receipts or balance changes
- Simulated withdrawal processing/completion and timer cleanup
- No network calls from wallet actions; deposit QR is not an address; receipts contain no blockchain transaction hash
- Keyboard submission, receipt focus, forward/backward Tab confinement, ordinary typing, outside-focus recovery and opener restoration

## Still required before merge

- Actual browser rendering and console checks at 1440, 820 and 390 pixels, in both themes
- Real-browser click-through and screenshots for claim, cancel/reopen, pay receipt, withdrawal processing/completion and navigation interruptions
- Review the Vercel preview and relevant CI for the exact published commit
- Refresh documentation screenshots if necessary

Browser checks were not completed: launching a browser from this execution environment failed at socket creation, and the available managed browser rejected local-file URLs. No alternate publication or security-policy bypass was attempted. jsdom tests are not a visual-browser pass.

## Dependency audit and remediation

Audited on 2026-10-05 with the user's permission to transmit package metadata to registry.npmjs.org.

- Initial full frontend graph: 23 affected packages (17 high, 3 moderate, 3 low; none critical)
- Compatible direct updates: react-router-dom 7.13.0 -> 7.18.4, Vite 7.3.1 -> 7.3.6, PostCSS 8.5.6 -> 8.5.28; patched transitive dependencies refreshed without forced major upgrades
- Final production-only audit (`npm audit --omit=dev`): zero reported vulnerabilities
- Final full audit: five high-severity package entries, all from the same build-time braces advisory chain (braces, chokidar, micromatch, fast-glob, Tailwind CSS)
- Clean install, 188 tests, lint with `--max-warnings=0`, and production build passed again after the dependency updates

[GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) concerns stack exhaustion from deeply nested glob patterns. There is no patched braces release as of this audit. Tailwind 3.4.19 still inherits it; the package-manager suggestion is a breaking Tailwind 4 migration, which was not applied blindly. The current static SPA uses repository-defined content patterns and does not expose this processing to site visitors. Untrusted build configurations or patterns remain a development/CI risk. A zero production audit is not a claim that the application is vulnerability-free.

React Router's server/RSC advisories do not match this declarative static SPA (no SSR, RSC, server actions or loaders). The router packages were updated anyway, including the open-redirect fix; current application destinations are code-defined. See [RCE applicability](https://github.com/advisories/GHSA-49rj-9fvp-4h2h), [route matching](https://github.com/advisories/GHSA-chx6-hx7r-mcp5), and [open redirect](https://github.com/advisories/GHSA-wrjc-x8rr-h8h6).

## Publication and CI status

The original patch prepared a separate frontend workflow for Node 22 and 24. In the combined patch these steps are consolidated into `.github/workflows/ci.yml` alongside contract tests and coverage. It checks out the exact PR head, uses pinned official actions, grants only read access, and runs tests, lint and build. The combined workflow has not run remotely.

Publication was attempted only after approval, but GitHub rejected the tree creation with HTTP 403, “Resource not accessible by integration.” No branch, commit, pull request or Vercel preview was created remotely. The connected installation catalog does not include the target personal repository; repository access must be checked before retrying. Main and the existing contract PR remain unchanged.
