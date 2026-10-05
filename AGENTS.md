# EdFi: project guide for AI coding agents

Read this before changing anything. It is the single source of truth for how this repo works. Design details live in `.agents/rules/design-system.md` (loaded automatically when you touch UI files).

**Local notes:** if `.agents/rules/owner.local.md` exists, read it first. It holds the owner's machine-local notes and current task queue, is git-ignored, and takes precedence over this file. Never copy it into tracked files.

## Working with the owner

- The owner, Ansar Kazbekov, writes in **Russian**. Reply in Russian. Write code, comments, commit messages and PR text in **English**.
- He is a product person, not a programmer. Explain what changed and why in plain words, and show the result (screenshots) instead of describing code.
- The repo is public and reviewed by Binance and potential employers. Every commit must look professional. Never commit personal data (phone, email, documents).

## What EdFi is

A Learn-to-Earn platform for universities on BNB Chain. Students earn **EDC** (a BEP-20 token) for verified grades, attendance and research, spend it on campus (Scan Pay) or withdraw it. Won **1st place at Crypto Ideathon Kazakhstan by Binance** (Binance Kazakhstan, Sep–Nov 2025). The planned first campus is Kozybayev University, Petropavlovsk (6,000 students).

Current stage: **web prototype + locally tested smart contracts + offline reward-ledger foundation**. The contracts in `contracts/` are not deployed. `backend/` is an isolated reference package with synthetic tests, not a running production backend. Next stage on the roadmap is the testnet pilot.

- Live site: https://ed-fi.vercel.app (auto-deploys from `main` via Vercel; every PR gets a preview URL)
- Repo: https://github.com/a4ns/EdFi-Site

## Commands

```bash
npm ci
npm run dev       # Vite dev server, http://localhost:5173
npm test          # deterministic frontend unit and component tests
npm run lint      # ESLint, must pass with 0 errors and 0 warnings
npm run build     # must succeed before every commit
npm run preview   # serve dist/ on http://localhost:4173

cd contracts
npm ci
npm test               # Hardhat tests for the Solidity contracts, must all pass
npm run coverage       # coverage report; fails below 100% line coverage (also enforced in CI)

cd ../backend
npm ci --ignore-scripts # zero third-party dependencies
npm test               # local SQLite persistence and adversarial service tests
```

Use Node.js 22.12+ (22.x) or 24.x. CI has separate web, contract and backend jobs; the backend additionally checks exact Node 22.12.0. Its test command includes `--experimental-sqlite` for that minimum version. Vitest and React Testing Library cover demo amounts, wallet transitions and UI flows; Hardhat covers contract behavior and adversarial cases; `node:test` covers the offline backend. Verification = tests + lint + build + contract coverage + visual checks (see "Definition of done"). Root ESLint ignores `contracts/` and applies Node rules to `backend/`.

Deployment is a separate, explicitly authorized task. See `contracts/README.md`; never run a public-network deployment as part of routine validation.

## Stack

React 19, Vite 7, Tailwind CSS 3 (design tokens as CSS variables), React Router 7, lucide-react icons, qrcode-generator, IBM Plex Sans self-hosted via @fontsource. Plain JavaScript (JSX), no TypeScript. Deployed as a static SPA on Vercel; `vercel.json` rewrites every path to `index.html`.

## Map of the code

```
src/main.jsx                 Fonts + global CSS + <App/>
src/App.jsx                  Providers (LocaleProvider, MarketsProvider, BrowserRouter, AuthProvider) and routes
src/index.css                Theme tokens (dark + light) and component classes (.btn, .card, .panel, .tab, .chip, .input…)
tailwind.config.js           Maps Tailwind colors to the CSS variables

src/pages/LandingPage.jsx    "/"        Header, Hero, TrustStats, EarnMarkets, Products, AppDownload, Roadmap, FAQ, StartEarning, Footer
src/pages/DashboardApp.jsx   "/demo"    Logged-in wallet demo; owns all demo state (balance, transactions, tasks, modals, toast)
src/pages/MarketsPage.jsx    "/markets" Market overview: sign-filtered summaries, keyboard tabs and sortable table
src/pages/CoinDetailPage.jsx  "/markets/:symbol" Read-only quote details and source status
src/pages/NotFoundPage.jsx    Unknown routes: localized recovery destinations

src/components/Header.jsx    Site + app header: nav dropdowns, search, download QR, language, theme, mobile drawer
src/components/Footer.jsx    Link columns, mobile accordion, theme row, credits
src/components/home/*        Landing sections
src/components/dashboard/*   Dashboard widgets and dialogs (Modal.jsx is the shared dialog/bottom sheet)
src/components/*.jsx         Shared UI: CoinIcon, PriceCell (Price/Change/ChangePill), Sparkline, QRCode, Logo, Icon, AuthModal, ThemeToggle

src/data/content.js          ALL marketing copy and data: coins, fallback prices, nav, news, stats, reward table, products, roadmap, FAQ, footer
src/i18n/*.js                Shared + domain EN/RU/KK message dictionaries; English source strings are stable keys
src/components/dashboard/data.js   Demo copy/payload, transactions, tasks, merchants, notifications, announcements
src/components/dashboard/nav.js    Sidebar / app-drawer items
src/state/MarketsProvider.jsx      Live prices (see below); read with useMarkets() from state/markets.js
src/state/AuthProvider.jsx         Sign-up / log-in dialog; open with useAuth().openAuth('signup' | 'login', prefill)
src/state/LocaleProvider.jsx       Persistent display language, document lang and cross-tab preference sync; useLocale() from state/locale.js
src/state/demoWallet.js      Atomic demo reducer + full session ledger in integer hundredths
src/state/useLocalDay.js     Local-day refresh at midnight and on returning to the tab
src/lib/demoAmount.js        Two-decimal demo amount parsing/formatting (not token base units)
src/lib/format.js            Number/price/date formatting (always use these, never ad-hoc toFixed in JSX)
src/lib/theme.js             currentTheme(), applyTheme(): the only place that touches data-theme and localStorage

contracts/src/EDCToken.sol       BEP-20 EDC token (ERC20Permit + AccessControl, MINTER_ROLE)
contracts/src/RewardMinter.sol   Mints EDC for EIP-712 results signed by an ORACLE_ROLE key; replay-safe, capped per claim, pausable
contracts/src/CampusPay.sol      Merchant registry + zero-fee pay / payWithPermit with order ids
contracts/test/*.test.js        Hardhat + chai behavior and adversarial tests (keep line coverage at 100%)
contracts/scripts/deploy.js      Deploys all three, wires roles, adds sample merchants, prints addresses

backend/src/index.js             Offline service and SQLite repository exports
backend/src/service.js           Validated commands and explicit issuer-authorization boundary
backend/src/sqlite-repository.js Atomic reward, budget, audit, ledger and idempotency persistence
backend/src/schema.js            Versioned SQLite schema and append-only constraints
backend/src/http.js              In-process Request/Response boundary; no listener or real authentication
backend/HTTP.md                  Exact transport routes, validation, errors and limits
backend/test/                    Synthetic persistence and adversarial tests
```

Data-driven source copy lives in `src/data/content.js` or `dashboard/data.js`; translations live in `src/i18n/`. UI source messages use `t(source, values)`. When changing a source key, update all three languages and the corresponding data/call sites together. Put terminology used by multiple areas in `i18n/common.js` only; dictionary tests reject duplicate keys and missing translations. Keep brands, token symbols and opaque IDs language-neutral.

## Live market data

- `MarketsProvider` polls `https://data-api.binance.vision/api/v3/ticker/24hr` every 5 s. This is Binance's public, read-only, CORS-enabled market-data host. Do **not** switch to `api.binance.com`: it is geo-blocked in some regions.
- On failure it keeps `FALLBACK_MARKETS` from `content.js` and backs off to 60 s after 3 failures. The UI shows "Live prices from Binance market data" only when live.
- **EDC is simulated**: a small random walk in `MarketsProvider`. Always label it as simulated/pilot in the UI.
- Each quote has `tick` and `dir`; `<Price>` uses them to flash green/red on change.

## Conventions and known pitfalls

- **Color naming:** never name a Tailwind color like a font-size utility. A color called `base` once collided with `text-base` and made text invisible. The page background token is `page`.
- **Theme tokens:** colors are RGB triplets in `src/index.css` under `:root, [data-theme="dark"]` and `[data-theme="light"]`. When adding a color, add it to **both** themes and map it in `tailwind.config.js`. Check every UI change in both themes.
- **Yellow:** `bg-yellow` (#FCD535) for primary buttons with `text-yellow-on` (#202630). For yellow *text* use `text-yellow-text` (it darkens on the light theme). Never put #FCD535 text on white.
- **ESLint (react-hooks v7) is strict:**
  - No impure calls in render (`Date.now()`, `Math.random()`). Capture once: `const [now] = useState(() => Date.now())`, or do it in event handlers/effects.
  - Don't mutate module-level values or the DOM from render or handlers inside components. Put that in helpers (see `lib/theme.js`).
  - Don't define components inside components. Hoist them.
  - Generators with local mutable state (seeded random) must be module-level pure functions (see `buildSeries` in `BalanceChart.jsx`).
- **Fast refresh:** files that export components must export only components. Put data, hooks' contexts and helpers in separate `.js` files.
- `no-unused-vars` ignores Capitalized names (component params used only in JSX), by design.
- Numbers: add the `num` class (tabular figures) to every price, amount, percentage and date.
- Localization: use `useLocale()` and pass `locale` to shared `Intl` format helpers. Keep stable IDs, source keys and named parameters in state; do not store translated ledger, error, receipt or toast strings. Never key providers/routes by locale or reset financial state when language changes. Language options are ordered kk, en, ru; English is the explicit default; persist the locale safely, keep wallet state in memory, and keep storage failures non-fatal.
- Icons: lucide-react; global CSS sets 1.5px strokes. Use 16px in dense UI, 20px in nav, 24px for feature icons.
- Dialogs: build on `dashboard/Modal.jsx` (Esc, focus trap, focus restore, bottom sheet on phones). Toasts: `showToast()` in `DashboardApp`.
- New routes: add to `src/App.jsx`. Internal links use `<Link>`; in-page anchors use `href="#section"` on `/` and `/#section` elsewhere (Header's `resolveHref` handles this).

## Demo accounting and safety

- Use integer hundredths for every demo balance, reward, amount, Max and percentage preset. Parse and format through `src/lib/demoAmount.js`; these units are distinct from the token's 18-decimal base units.
- Keep balance, ledger and task updates atomic in `demoWalletReducer`. Validate again in the reducer and preserve request-ID / task deduplication; disabling a button alone is not enough.
- Retain the full session ledger for earnings. Apply the eight-entry limit only when rendering recent transactions; spending must not reduce earned rewards.
- “Demo earned today” uses the device's local calendar day, including DST. Preserve midnight and visibility refresh plus unmount cleanup in `useLocalDay`.
- Wallet actions stay in memory and reset on dashboard unmount/reload. No connected wallet, usable deposit address, blockchain hash, network submission or real settlement may be implied.
- KZT display uses the fixed illustrative assumption `KZT_PER_USD = 520`. Keep the localized demo-rate disclaimer visible. Do not imply this is a live quote or introduce a rate service without a separate task.
- Demo GPA/research verification is an explicit local step. Only claimable tasks may credit rewards; verification itself never mints or credits.
- Hash destinations /demo#pay and /demo#withdraw open local dialogs; Back/Forward must preserve session receipts and never repeat a debit.
- Use the shared modal and test focus across scan/form/receipt changes, keyboard submission, cancel/reopen, navigation and pending-timer cleanup. Keep illustrative chart, price and conversion labels explicit.

## Contract invariants

- Preserve the signed EIP-712 fields, domain separation, current role checks, result-ID replay protection and atomic rollback if minting fails.
- `maxRewardPerClaim` limits one claim, not total issuance or oracle exposure. Aggregate issuance budgets and token economics require a separate product decision.
- `CampusPay.orderId` is receipt metadata, not payment deduplication. Failed/front-run permits may fall back to a sufficient allowance from the caller; do not silently change either policy.
- A zero admin must be rejected by all three constructors. Token minter and admin roles are trusted powers; tests are not a security audit.
- Test locally without real keys. Keep `.env`, wallet credentials and machine-local notes out of tracked files. Testnet deployment, role changes, keys and addresses need explicit authorization and verified results.

## Offline backend invariants

- Keep the reference package isolated from the website, contracts and network services. It has no HTTP server or real authentication, funding, academic verification, signing or settlement.
- Authorization comes only from the explicitly supplied trusted adapter. Default deny; reauthorize reads and retries. Never treat issuer/actor fields from client input as authenticated identity.
- Quantities are bounded canonical decimal strings with `BigInt` arithmetic. They have no implied EDC scale or price. Never use floating point, SQL `SUM` or arithmetic coercion on stored quantity text.
- Budgets are issuer/unit scoped and default to zero. Synthetic fixtures may provision test allocations; the service must not expose funding or invent reward economics.
- Approval reserves allocation without credit. Posting consumes the reserve and writes exactly one balanced ledger pair. Revocation before posting releases the reserve. `posted` and `revoked` are terminal; no post-to-revoke, deletion, reversal or implicit clawback.
- Business-result uniqueness is `(issuerId, sourceResultId)`. Idempotency keys are unique inside the issuer; fingerprints bind the trusted actor, action and canonical payload. Replay receipts describe historical command outcomes, not current reward state.
- State/version, budget, audit event, both ledger entries and receipt must commit in one synchronous SQLite transaction. Preserve optimistic version checks, bounded lock waiting, append-only history and startup schema/invariant validation. Storage errors must not silently fall back to memory or reset data.
- Exercise actual file reopen, concurrent processes, replay, budget contention, permission failures and rollback. Tests of process crashes do not prove hardware power-loss durability. SQLite remains a reference choice until production storage, custody, operators and recovery policies are defined.
- The HTTP adapter is an in-process contract only. Keep its trusted authentication decision separate from issuer authorization; request body/header actor claims must never supply authority. Preserve strict route/method/field validation, actual-byte and body-time bounds, cancellation cleanup, fixed public errors and response headers. A future network server still needs explicit authentication, origin, header/connection limits and operational decisions.

## Honesty rules (important, the repo is reviewed by Binance)

- The product is a concept/prototype. Never present demo numbers as real traction (users, volume, "active scholars"). Demo data must be labelled as sample/illustrative/simulated.
- Never use the Binance logo or wordmark, and never imply EdFi is affiliated with Binance. The footer disclaimer must stay.
- Do not claim things that don't exist in code (e.g. deployed smart contracts, a running pilot) on the site or in the README. The contracts are tested locally but not deployed; only add addresses after a real deployment.
- Never commit private keys or `contracts/.env`.
- Demo flows (sign-up, payments, withdrawals) must not send data anywhere. They say "Demo only" where relevant.

## Definition of done (every change)

1. From the root, `npm ci`, `npm test`, `npm run lint -- --max-warnings=0` and `npm run build` pass. From `contracts/`, `npm ci`, `npm test` and `npm run coverage` pass; the coverage command enforces 100% project line coverage. From `backend/`, `npm ci --ignore-scripts` and `npm test` pass, including the Node 22.12 compatibility check when backend code changes.
2. Open the page in the browser at **1440px, 820px and 390px** widths: no horizontal scroll, no overlapping or cut-off text, no console errors.
3. Check **both themes** (moon/sun icon in the header).
4. If you touched a flow, click through it (claim → toast → balance; Scan Pay → receipt; withdraw → processing → completed).
5. Run `git diff --check`. State which checks passed, failed or were blocked; jsdom is not a visual-browser pass. See `docs/validation/` for recorded validation and remaining limits.
6. When publication is authorized, commit on a feature branch with a clear English message and open a PR to `main`; verify remote CI and the Vercel preview for that exact commit. Never commit directly to `main`, merge, or deploy without authorization.

## Roadmap and backlog

Product roadmap (keep in sync with `ROADMAP` in `content.js` and the README):

1. Concept & prototype (2025): done
2. Testnet pilot: smart contracts on BNB Smart Chain testnet, sandbox at Kozybayev University: **next**
3. Full campus economy: mainnet, campus payments
4. National eGov integration (2027)

Suggested next tasks, highest value first:

1. **Testnet deployment (Phase 2):** the contracts in `contracts/` are written and tested. Remaining: deploy to BSC testnet with the owner's test wallet, verify on BscScan, list the addresses in `contracts/README.md` and the root README, move admin roles to a multisig, and build a small oracle signer service (signs `Reward` typed data from registrar exports).
2. **Wallet connection:** connect a real wallet (e.g. wagmi + viem with WalletConnect) on `/demo`, show the real EDC balance on testnet, claim via `RewardMinter.claim` and pay via `CampusPay.payWithPermit`, keep the sample-data mode as a fallback.
3. **Tests:** extend the Vitest + React Testing Library suite. Demo flows, clipboard failures, task verification, route navigation, `BalanceChart` ranges/DST/tiny values and market-data validation/failure/recovery are covered. Extend meaningful regressions when changing these paths. Keep contract adversarial coverage and the line-coverage gate passing.
4. **Design polish:** filled navigation icons, locally served licensed coin marks and `/markets/:symbol` details are implemented. Keep coin provenance in `public/coins/NOTICE.md`; do not describe curated artwork as issuer-approved. Maintain contrast-tested tokens and shared keyboard filter tabs.
5. **Localization follow-through:** English, Russian and Kazakh UI and explicit demo KZT display are implemented. Complete real-browser review at all required widths/themes for each published candidate; native-speaker/product review can refine terminology. Do not describe unverified layouts or translations as production-ready.
