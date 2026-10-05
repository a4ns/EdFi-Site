---
trigger: glob
globs: "src/**/*.jsx, src/**/*.js, src/**/*.css, tailwind.config.js, index.html"
---

# EdFi design system (Binance design language)

EdFi deliberately follows Binance's web and app design language: dark-first, dense, data-rich, yellow accents. It must stay its own brand: never use the Binance logo or wordmark. Use the EdFi mortarboard mark (`src/components/Logo.jsx`). The bar: a Binance product designer should feel at home.

## Color tokens

Defined as RGB triplets in `src/index.css`, mapped in `tailwind.config.js`. Use the Tailwind names, never raw hex in JSX (except brand marks such as coin colors and the logo).

| Token | Dark | Light | Use |
|---|---|---|---|
| `page` | #181A20 | #FFFFFF | Page background, header |
| `deep` | #0B0E11 | #F5F5F5 | Deepest surfaces (phone frame, viewfinder) |
| `card` | #1E2329 | #F5F5F5 | Filled cards (homepage cards, dialogs, menus) |
| `raised` | #2B3139 | #EAECEF | Hover, secondary buttons, icon tiles |
| `line` | #2B3139 | #EAECEF | Hairline borders, dividers, outlined `.panel` |
| `line-strong` | #474D57 | #D8DCE1 | Input borders |
| `ink` | #EAECEF | #1E2329 | Primary text |
| `ink-2` | #B7BDC6 | #474D57 | Body text on cards |
| `ink-3` | #848E9C | #707A8A | Secondary text, labels, table headers |
| `ink-4` | #5E6673 | #929AA5 | Placeholders, disabled only (too low-contrast for readable text) |
| `up` / `down` | #0ECB81 / #F6465D | #03A66D / #CF304A | Gains/losses, success/error. Green means positive, never use red for "live" |
| `yellow` | #FCD535 | same | Primary buttons, active tab bar, focus ring |
| `yellow-hover` | #F0B90B | same | Primary button hover |
| `yellow-on` | #202630 | same | Text on yellow (never pure black) |
| `yellow-text` | #FCD535 | #C99400 | Yellow used as text/links/icons |
| `brand` | #F0B90B | same | Logo only |

Rules: boxes inside an outlined `.panel` use `bg-card` (a `bg-page` box disappears). Nested inset blocks inside a `card` (summaries, previews) use `bg-page`.

## Typography

- IBM Plex Sans (the open base of Binance's BinancePlex), weights 400/500/600/700. Loaded in `src/main.jsx`.
- Add class `num` (tabular figures) to all prices, amounts, percentages, dates, counts.
- Scale: hero 44/68/76px semibold uppercase (mobile/tablet/desktop); `.section-title` 28/40px semibold; card titles 16px semibold; body 14–16px; labels 12px `ink-3`.
- Sentence case for headings and buttons ("Sign Up", "Scan Pay" are product names and stay capitalized).

## Components (classes in `src/index.css`)

- Container: `.page-x` (max-width 1248px, 16px/24px side padding). Header spans the full width.
- Buttons: `.btn` + size `.btn-sm` (32px, radius 6px) / `.btn-md` (40px) / `.btn-lg` (48px), radius 8px; variant `.btn-primary` (yellow) or `.btn-secondary` (raised gray). One primary action per view. Disabled primary turns gray, not faded yellow. No scale or bounce on hover, only color.
- Icon buttons: `.icon-btn` (32px, `ink-2`, yellow on hover).
- Inputs: `.input` (48px, 8px radius, `line-strong` border, yellow border on hover/focus). Suffix actions (Max, Paste) are yellow text inside the field.
- Surfaces: `.card` (filled `card`, 16px radius) on the marketing site; `.panel` (1px `line` border, transparent, 16px radius) on the dashboard. FAQ rows use 12px radius; trust stats and the roadmap stepper sit directly on the page without boxes.
- Tabs: `.tab` with `role="tab"` and `aria-selected`; active = `ink` text + 16×3px yellow underline. Tab strips scroll horizontally on mobile with an edge fade.
- Chips: `.chip` (12px, 4px radius), tinted backgrounds like `bg-yellow/10 text-yellow-text` or `bg-up/10 text-up`.
- Links: `.link-more` ("View All >", `ink-3`, yellow on hover).
- Tables: 12px `ink-3` headers; 56–64px rows; numbers right-aligned with `num`; row hover `bg-card`; sortable headers show arrow icons and `aria-sort`.
- Dialogs: always `dashboard/Modal.jsx`. Bottom sheet with drag handle under 640px, centered card above. Max width 420px, 24px padding.
- Toasts: top-center card surface with a green check, auto-dismiss in about 2.6 s, cleared when a dialog opens.
- Prices: `<Price quote>` flashes green/red on tick; `<Change>` colors the percentage; `<ChangePill>` is the solid app-style badge.
- Coin icons: `<CoinIcon symbol size>`; EDC uses the EdFi mark on brand yellow.

## Layout patterns

- Homepage follows binance.com: big uppercase hero with Sign Up form and social sign-in on the left, Popular/Top Gainers card + News card on the right, trust stats, a markets-style table, product cards, app download with a real QR code, numbered FAQ accordion, "Start earning today", multi-column footer (accordion on mobile).
- Dashboard follows the Binance account dashboard: 240px left sidebar (hidden under 1024px; the header drawer takes over), profile row with UID, card grid where rows align, bottom tab bar with a raised center Pay button on mobile.
- Section rhythm: about 64–96px between homepage sections; avoid empty bands.

## Icons and motion

- lucide-react with 1.5px strokes (global CSS). Active nav items may use a subtle fill.
- Motion is short and functional: 150–220ms fades/slides, price flashes, scan line. Respect `prefers-reduced-motion` (handled globally). No parallax, glows, gradients on text, or noise overlays.

## Responsive and accessibility

- Must work at 390px, 820px and 1440px with no horizontal page scroll.
- Every interactive element is a real `<button>` or `<a>` with an accessible name; dialogs trap focus; visible yellow focus ring (`:focus-visible`).
- Minimum readable text color is `ink-3`; `ink-4` is only for placeholders and disabled states.
