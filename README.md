<div align="center">

<img src="public/favicon.svg" width="72" alt="EdFi logo" />

# EdFi

**Academic status, now liquid.**<br>
A Learn-to-Earn platform for universities on BNB Chain.

🏆 **1st place · Crypto Ideathon Kazakhstan by Binance (2025)**

[**Live demo**](https://ed-fi.vercel.app) · [Wallet dashboard](https://ed-fi.vercel.app/demo) · [Markets](https://ed-fi.vercel.app/markets)

</div>

![EdFi homepage](docs/screenshots/home.png)

## The idea

Students put years of effort into results that end up as lines in a transcript. The proposed EdFi model turns verified academic results into **EDC**, a BEP-20 token on BNB Chain that students can spend across campus or withdraw.

- **Earn (planned).** Grades, attendance and published research would be signed by university systems (LMS, registrar, smart-card check-in, DOI registry). The contract design verifies a signed result before minting EDC. The university integration and oracle service are not connected.
- **Spend (planned).** Campus payments would cover canteens, dormitories and merchandise. The current site demonstrates simulated payments only.
- **Withdraw (planned).** Wallet transfers, exchange liquidity and staking require separate implementation and deployment. None is available in this site.

The planned first campus is Kozybayev University in Petropavlovsk, Kazakhstan (6,000 students). This is a concept and web prototype; the pilot is not live.

## What's in this repository

The web prototype (a marketing site and an interactive wallet dashboard) and the [smart contracts](contracts/) for the testnet pilot.

| Route | What you can do |
|---|---|
| [`/`](https://ed-fi.vercel.app) | Landing page with live market card, reward rates, roadmap and FAQ |
| [`/demo`](https://ed-fi.vercel.app/demo) | Wallet dashboard: claim rewards, Scan Pay with receipt, safe deposit preview, withdraw, illustrative balance chart |
| `/markets` | Sortable market overview, sign-correct gainers/losers and explicit snapshot states |
| `/markets/:symbol` | Read-only coin details, 24-hour range, source and simulated/unavailable states |
| Unrecognized routes | Localized 404 with working return destinations |

> [!NOTE]
> Balances, rewards and pilot figures in the demo are sample data, and EDC's price is simulated. No wallet is connected and no funds are sent. The deposit preview has no usable wallet address; do not send funds. A complete valid response from Binance's public market-data API enables live prices for external coins. Failed, partial or invalid responses keep the last good/bundled snapshot and are labeled accordingly. Trend lines are illustrative, not historical price data.

### Wallet dashboard

![Wallet dashboard](docs/screenshots/dashboard.png)

### Mobile

![Mobile screens: home, dashboard and Scan Pay](docs/screenshots/mobile.png)

<details>
<summary><b>More screenshots</b>: markets page, light theme</summary>
<br>

![Markets page](docs/screenshots/markets.png)

![Light theme](docs/screenshots/home-light.png)

</details>

## Smart contracts

The [`contracts/`](contracts/) folder holds the on-chain side of EdFi, written in Solidity with Hardhat and OpenZeppelin:

- **EDCToken**: the BEP-20 EDC token with gasless approvals (EIP-2612).
- **RewardMinter**: mints EDC only for results signed by an allow-listed university oracle (EIP-712), each result once, with expiry, a per-claim cap and an emergency pause.
- **CampusPay**: a registry of verified campus merchants and zero-fee payments with order receipts.

Status: tested locally with an adversarial regression suite and a CI-enforced 100% line-coverage requirement. Not deployed or audited yet. See [contracts/README.md](contracts/README.md) for the security model, role-configuration requirements and deployment steps.

## Features

- **Exchange-grade design system.** Dark and light themes built on design tokens, IBM Plex Sans with tabular figures, dense data layouts.
- **Live market data.** Prices from Binance's public API with flash-on-tick updates, automatic back-off and an offline snapshot fallback.
- **Simulated wallet flows.** Claim sample rewards, Scan Pay (simulated viewfinder, merchant, amount and local demo receipt), a non-wallet deposit QR preview, and demo withdrawal with address validation and simulated processing/completion. All wallet state stays in memory and resets when leaving the dashboard or reloading.
- **Account shell.** Two-step demo sign-up and log-in, sample notifications, account/settings and a sample referral card. These are not production authentication, verified profiles or actual referral earnings.
- **Kazakh, English and Russian.** Switch languages in the header, mobile menu, footer or settings. Translated demo notices, forms, receipts and navigation share consistent terminology; numbers, dates, percentages and plural forms use `Intl`.
- **Responsive.** From 390px phones to wide desktops, with a mobile drawer, bottom tab bar and bottom sheets.
- **Accessible.** Contrast-tested text and focus tokens in both themes; keyboard tabs, radio groups and currency listbox; dismissible disclosures; route/skip-link focus and modal focus restoration; reduced-motion-aware scrolling.

## Tech stack

React 19 · Vite 7 · Tailwind CSS 3 · React Router 7 · lucide-react · qrcode-generator · IBM Plex Sans (self-hosted). Deployed on Vercel.

Contracts: Solidity 0.8.28 · Hardhat · OpenZeppelin Contracts 5 · BNB Smart Chain.

## Getting started

Use Node.js 22.12+ (22.x) or 24.x. CI is configured to run the web and contract checks on both major versions.

```bash
npm ci
npm run dev        # http://localhost:5173
npm test           # deterministic frontend unit and component tests
npm run lint -- --max-warnings=0
npm run build      # production build in dist/
npm run preview    # serve the production build locally

cd contracts
npm ci
npm test           # contract behavior and adversarial regression tests
npm run coverage   # project coverage report + 100% line-coverage gate
```

## Demo accounting

- Wallet amounts use integer hundredths (two decimal places), including validation and Max. These are prototype units, not BEP-20 token base units.
- The full session ledger drives earnings; only the eight most recent entries are displayed.
- “Demo earned today” uses the device's local calendar day and refreshes at midnight or on returning to the tab. Spending does not change earned rewards.
- The chart is illustrative; it is not a recorded on-chain balance history. EDC valuations and the fixed KZT conversion are also illustrative.
- **KZT conversion uses a fixed demo assumption of 1 USD = 520 KZT.** It is not a live exchange rate, a redemption promise or financial guidance. No exchange-rate service is called.
- Root `npm test` covers exact balances, validation, replay protection, daily earnings, cancellation and claim/pay/withdraw UI flows.

Historical local reports are in [docs/validation](docs/validation/). Use the exact commit's CI and current PR review for current results. Each new published candidate still needs browser checks; unit tests and coverage alone do not establish production readiness.

## Localization

Selectors consistently list **Қазақша → English → Русский**. English remains the initial default. The chosen `en`, `ru` or `kk` language is saved under `edfi.locale` when browser storage is available. A blocked or invalid storage value safely falls back to English; switching still works in memory. Language and theme preferences may be persisted; wallet balances and form data are not. Changing language does not reset wallet balances, ledger entries, selected tasks, open forms or receipts. Leaving/reloading the dashboard still resets its demo session.

- `src/i18n/common.js` holds shared terminology; domain dictionaries cover the landing page, dashboard, dialogs, navigation and markets
- English source messages are stable keys; every entry supplies Russian and Kazakh. Use named placeholders instead of concatenating translated sentences
- Plural entries include the categories provided by `Intl.PluralRules` for each language
- Data and reducer records retain source keys and parameters; translation happens when rendering
- Locale-aware display helpers preserve every integer demo hundredth. Input remains ungrouped and accepts a dot or comma decimal separator
- Dictionary tests reject missing translations, mismatched placeholders, duplicate shared keys and unlocalized UI literals

The native mobile apps, live wallet connection and on-chain settlement remain future work. Download-style links open the web demo.

## Project structure

```
src/
├── pages/              LandingPage, DashboardApp, MarketsPage, CoinDetailPage, NotFoundPage
├── components/
│   ├── home/           Landing sections: Hero, EarnMarkets, Products, Roadmap, FAQ…
│   ├── dashboard/      Wallet widgets and dialogs: BalanceCard, TasksCard, PayModal…
│   └── …               Header, Footer, shared UI (CoinIcon, QRCode, Sparkline…)
├── data/content.js     Site copy: navigation, reward rates, roadmap, FAQ
├── i18n/               Shared and domain EN/RU/KK messages, integrity tests
├── state/              Locale/market/auth providers, demo reducer and local-day refresh
├── lib/                Exact demo amounts, formatting, theme and link helpers
└── index.css           Design tokens (dark and light themes) and component classes
contracts/              Solidity contracts, tests and deploy script (Hardhat)
public/                 Favicon, social preview and licensed local coin assets (coins/NOTICE.md)
docs/screenshots/       Images used in this README
```

## Production boundary

The public website and local wallet demo are separate from a production financial service. Production authentication, a durable backend, verified university records, issuer permissions, reward budgets, oracle signing, deployment keys, real wallets, monitoring and operational ownership remain unresolved. Tests use synthetic data and do not establish those capabilities. No real user records or funds should be entered into the demo.

## Roadmap

1. ✅ **Concept & prototype** (2025): token mechanics and the web prototype. 1st place at Crypto Ideathon Kazakhstan by Binance.
2. ⏭️ **Testnet pilot**: smart contracts on BNB Smart Chain testnet and a sandbox pilot at Kozybayev University. Contracts are written and tested; testnet deployment is next.
3. **Full campus economy**: mainnet launch and payments at canteens, dormitories and stores.
4. **National eGov integration** (2027): connect state education databases to scale across Kazakhstan.

## Author

**Ansar Kazbekov**: idea, product design and token mechanics.<br>
[LinkedIn](https://www.linkedin.com/in/ansar-kazbekov-50443439a) · Telegram [@nsrkz](https://t.me/nsrkz)

---

<sub>EdFi is an independent project. It is not affiliated with or endorsed by Binance.</sub>
