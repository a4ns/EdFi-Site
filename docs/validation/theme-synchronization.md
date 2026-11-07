# Theme control synchronization

Validated locally on 5 October 2026, on top of localization commit
`6a6be9e2693471cf1fcdabe8049456cf50f1dcfa` (tree
`7676b91c755d632f001f26489cd7428473d9a460`).

## Scope

The header toggle, mobile drawer, footer and account settings previously kept
separate theme state. Selecting a theme in one control could leave the others'
labels and selected states stale. In particular, resizing from mobile to desktop
could make the first header click appear ineffective.

All four controls now subscribe to the same theme snapshot through React's
`useSyncExternalStore`. Application-time DOM, browser-color and local-storage
updates remain in `src/lib/theme.js`; the existing pre-paint bootstrap in
`index.html` is unchanged. Unsupported theme values are ignored, and blocked
storage does not prevent updates to mounted controls.

No dependencies, source labels, translations, styles, financial state, contracts,
CI configuration or cross-tab preference behavior changed.

## Checks

- Fresh locked root install using the existing offline npm cache: passed
- Six component regression cases against the original implementation: all failed
- Full frontend suite after the fix: 258 tests passed in 14 files, including 17 new tests
- ESLint with `--max-warnings=0`: passed
- Production build: passed
- Fresh locked contract install using the existing contract-specific offline npm cache: passed
- Contract tests: 57 passed; coverage and the 100% line-coverage gate passed
- Independent review: no blocking or P1–P3 findings
- `git diff --check`: passed

Regression coverage includes the still-mounted desktop control after drawer
selection and a resize event, synchronization among all four controls, changes
in both directions, Enter/Space and repeated toggles, remounts, Russian/Kazakh
labels, invalid setter inputs, persistence, unavailable storage, browser-color
metadata and subscription removal.

The first contract install used the frontend cache, which lacked a contract
dependency. The final clean install used the contract cache successfully. Contract
checks used the existing writable XDG/compiler cache directories; no committed
configuration was changed. Contract files and lockfiles remain byte-identical to
the localization base.

## Limits

The resize regression runs in jsdom and cannot verify CSS visibility or layout.
Local Chromium could not launch because the executor rejected socket creation.
No local visual-browser pass is claimed. The publisher owns verification of the
actual preview, including the mobile-to-desktop first-click regression and the
1440/820/390-pixel, light/dark checks for the exact published revision.

This report does not claim publication, passing remote CI, a merge or deployment.
