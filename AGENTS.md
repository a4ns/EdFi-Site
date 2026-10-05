# EdFi: project guide for AI coding agents

Read this before changing anything. It is the single source of truth for how this repo works. Design details live in `.agents/rules/design-system.md` (loaded automatically when you touch UI files).

## Working with the owner

- The owner, Ansar Kazbekov, writes in **Russian**. Reply in Russian. Write code, comments, commit messages and PR text in **English**.
- He is a product person, not a programmer. Explain what changed and why in plain words, and show the result (screenshots) instead of describing code.
- The repo is public and reviewed by Binance and potential employers. Every commit must look professional. Never commit personal data (phone, email, documents).

## What EdFi is

A Learn-to-Earn platform for universities on BNB Chain. Students earn **EDC** (a BEP-20 token) for verified grades, attendance and research, spend it on campus (Scan Pay) or withdraw it. Won **1st place at Crypto Ideathon Kazakhstan by Binance** (Binance Kazakhstan, Sep–Nov 2025). The planned first campus is Kozybayev University, Petropavlovsk (6,000 students).

Current stage: **concept + web prototype**. There are no smart contracts and no backend yet. Next stage on the roadmap is a testnet pilot.

- Live site: https://ed-fi.vercel.app (auto-deploys from `main` via Vercel; every PR gets a preview URL)
- Repo: https://github.com/a4ns/EdFi-Site

## Commands

```bash
npm install
npm run dev       # Vite dev server, http://localhost:5173
npm run lint      # ESLint, must pass with 0 errors and 0 warnings
npm run build     # must succeed before every commit
npm run preview   # serve dist/ on http://localhost:4173
```

There is no test suite yet. Verification = lint + build + visual check in the browser (see "Definition of done").

## Stack

React 19, Vite 7, Tailwind CSS 3 (design tokens as CSS variables), React Router 7, lucide-react icons, qrcode-generator, IBM Plex Sans self-hosted via @fontsource. Plain JavaScript (JSX), no TypeScript. Deployed as a static SPA on Vercel; `vercel.json` rewrites every path to `index.html`.

## Map of the code

```
src/main.jsx                 Fonts + global CSS + <App/>
src/App.jsx                  Providers (MarketsProvider, BrowserRouter, AuthProvider) and routes
src/index.css                Theme tokens (dark + light) and component classes (.btn, .card, .panel, .tab, .chip, .input…)
tailwind.config.js           Maps Tailwind colors to the CSS variables

src/pages/LandingPage.jsx    "/"        Header, Hero, TrustStats, EarnMarkets, Products, AppDownload, Roadmap, FAQ, StartEarning, Footer
src/pages/DashboardApp.jsx   "/demo"    Logged-in wallet demo; owns all demo state (balance, transactions, tasks, modals, toast)
src/pages/MarketsPage.jsx    "/markets" Market overview: hot/gainers/losers cards + sortable table

src/components/Header.jsx    Site + app header: nav dropdowns, search, download QR, language, theme, mobile drawer
src/components/Footer.jsx    Link columns, mobile accordion, theme row, credits
src/components/home/*        Landing sections
src/components/dashboard/*   Dashboard widgets and dialogs (Modal.jsx is the shared dialog/bottom sheet)
src/components/*.jsx         Shared UI: CoinIcon, PriceCell (Price/Change/ChangePill), Sparkline, QRCode, Logo, Icon, AuthModal, ThemeToggle

src/data/content.js          ALL marketing copy and data: coins, fallback prices, nav, news, stats, reward table, products, roadmap, FAQ, footer
src/components/dashboard/data.js   Demo account data: wallet address, transactions, tasks, merchants, notifications, announcements
src/components/dashboard/nav.js    Sidebar / app-drawer items
src/state/MarketsProvider.jsx      Live prices (see below); read with useMarkets() from state/markets.js
src/state/AuthProvider.jsx         Sign-up / log-in dialog; open with useAuth().openAuth('signup' | 'login', prefill)
src/lib/format.js            Number/price/date formatting (always use these, never ad-hoc toFixed in JSX)
src/lib/theme.js             currentTheme(), applyTheme(): the only place that touches data-theme and localStorage
```

To change text on the site, edit `src/data/content.js` (or `dashboard/data.js`), not the components.

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
- Icons: lucide-react; global CSS sets 1.5px strokes. Use 16px in dense UI, 20px in nav, 24px for feature icons.
- Dialogs: build on `dashboard/Modal.jsx` (Esc, focus trap, focus restore, bottom sheet on phones). Toasts: `showToast()` in `DashboardApp`.
- New routes: add to `src/App.jsx`. Internal links use `<Link>`; in-page anchors use `href="#section"` on `/` and `/#section` elsewhere (Header's `resolveHref` handles this).

## Honesty rules (important, the repo is reviewed by Binance)

- The product is a concept/prototype. Never present demo numbers as real traction (users, volume, "active scholars"). Demo data must be labelled as sample/illustrative/simulated.
- Never use the Binance logo or wordmark, and never imply EdFi is affiliated with Binance. The footer disclaimer must stay.
- Do not claim things that don't exist in code (e.g. deployed smart contracts, a running pilot) on the site or in the README.
- Demo flows (sign-up, payments, withdrawals) must not send data anywhere. They say "Demo only" where relevant.

## Definition of done (every change)

1. `npm run lint` passes with 0 problems; `npm run build` succeeds.
2. Open the page in the browser at **1440px, 820px and 390px** widths: no horizontal scroll, no overlapping or cut-off text, no console errors.
3. Check **both themes** (moon/sun icon in the header).
4. If you touched a flow, click through it (claim → toast → balance; Scan Pay → receipt; withdraw → processing → completed).
5. Commit on a feature branch with a clear English message and open a PR to `main`; check the Vercel preview before merging.

## Roadmap and backlog

Product roadmap (keep in sync with `ROADMAP` in `content.js` and the README):

1. Concept & prototype (2025): done
2. Testnet pilot: smart contracts on BNB Smart Chain testnet, sandbox at Kozybayev University: **next**
3. Full campus economy: mainnet, campus payments
4. National eGov integration (2027)

Suggested next tasks, highest value first:

1. **Smart contracts (Phase 2):** EDC BEP-20 token; a reward minter that only mints against results signed by an allow-listed university oracle key; campus payment contract or merchant transfers. Use Hardhat or Foundry in a separate `contracts/` folder with tests; deploy to BSC testnet; document addresses in the README.
2. **Wallet connection:** connect a real wallet (e.g. wagmi + viem with WalletConnect) on `/demo`, show the real EDC balance on testnet, keep the sample-data mode as a fallback.
3. **Tests:** add Vitest + React Testing Library; start with `lib/format.js`, `BalanceChart` series, and the claim/pay/withdraw reducers in `DashboardApp`.
4. **Design polish:** a custom filled icon set for nav/sidebar; official coin marks (BNB, SOL…) instead of simplified glyphs; a coin detail view on `/markets`.
5. **Localization:** Kazakh and Russian UI plus KZT display (currently shown as "coming with mainnet" in the language menu).
