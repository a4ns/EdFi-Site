/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Binance design tokens. Values live in src/index.css as CSS variables (dark + light themes).
      colors: {
        page: 'rgb(var(--c-page) / <alpha-value>)',       // page background
        deep: 'rgb(var(--c-deep) / <alpha-value>)',       // deepest background
        card: 'rgb(var(--c-card) / <alpha-value>)',       // card / vessel
        raised: 'rgb(var(--c-raised) / <alpha-value>)',   // hover, secondary buttons
        line: {
          DEFAULT: 'rgb(var(--c-line) / <alpha-value>)',  // hairline borders
          strong: 'rgb(var(--c-line-strong) / <alpha-value>)', // input borders
        },
        ink: {
          DEFAULT: 'rgb(var(--c-ink) / <alpha-value>)',   // primary text
          2: 'rgb(var(--c-ink-2) / <alpha-value>)',
          3: 'rgb(var(--c-ink-3) / <alpha-value>)',       // secondary text
          4: 'rgb(var(--c-ink-4) / <alpha-value>)',       // tertiary / disabled
        },
        brand: '#F0B90B',       // brand yellow (logo, highlights)
        yellow: {
          DEFAULT: '#FCD535',   // primary button
          hover: '#F0B90B',
          on: '#202630',        // text on yellow
          text: 'rgb(var(--c-yellow-text) / <alpha-value>)', // yellow used as text (darker on light theme)
        },
        up: 'rgb(var(--c-up) / <alpha-value>)',
        down: 'rgb(var(--c-down) / <alpha-value>)',
        'up-on': 'rgb(var(--c-up-on) / <alpha-value>)',
        'down-on': 'rgb(var(--c-down-on) / <alpha-value>)',
        focus: 'rgb(var(--c-focus) / <alpha-value>)',
      },
      fontFamily: {
        sans: ['"IBM Plex Sans"', 'Arial', 'sans-serif'],
      },
      maxWidth: {
        page: '1248px',
      },
      boxShadow: {
        pop: 'var(--shadow-pop)',
      },
      keyframes: {
        'fade-in': { from: { opacity: 0 }, to: { opacity: 1 } },
        'pop-in': {
          from: { opacity: 0, transform: 'translateY(8px) scale(0.98)' },
          to: { opacity: 1, transform: 'translateY(0) scale(1)' },
        },
        'slide-in': { from: { transform: 'translateX(100%)' }, to: { transform: 'translateX(0)' } },
        scan: { '0%, 100%': { top: '8px' }, '50%': { top: 'calc(100% - 10px)' } },
        'flash-up': { '0%, 35%': { color: 'rgb(var(--c-up))' } },
        'flash-down': { '0%, 35%': { color: 'rgb(var(--c-down))' } },
      },
      animation: {
        'fade-in': 'fade-in 150ms ease-out',
        'pop-in': 'pop-in 180ms ease-out',
        'slide-in': 'slide-in 220ms cubic-bezier(0.2, 0, 0, 1)',
        scan: 'scan 2s ease-in-out infinite',
        'flash-up': 'flash-up 700ms ease-out',
        'flash-down': 'flash-down 700ms ease-out',
      },
    },
  },
  plugins: [],
}
