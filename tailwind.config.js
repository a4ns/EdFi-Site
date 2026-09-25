/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Binance dark design tokens
      colors: {
        page: '#181A20',        // page background
        deep: '#0B0E11',        // deepest background (footer, trading areas)
        card: '#1E2329',        // card / vessel
        raised: '#2B3139',      // hover, secondary buttons, input fill
        line: {
          DEFAULT: '#2B3139',   // hairline borders
          strong: '#474D57',    // input borders
        },
        ink: {
          DEFAULT: '#EAECEF',   // primary text
          2: '#B7BDC6',
          3: '#848E9C',         // secondary text
          4: '#5E6673',         // disabled / tertiary
        },
        brand: '#F0B90B',       // brand yellow (logo, highlights)
        yellow: {
          DEFAULT: '#FCD535',   // primary button
          hover: '#F0B90B',
          on: '#202630',        // text on yellow
        },
        up: '#0ECB81',
        down: '#F6465D',
      },
      fontFamily: {
        sans: ['"IBM Plex Sans"', 'Arial', 'sans-serif'],
      },
      maxWidth: {
        page: '1248px',
      },
      boxShadow: {
        pop: '0 8px 32px rgba(0, 0, 0, 0.48)',
      },
      keyframes: {
        'fade-in': { from: { opacity: 0 }, to: { opacity: 1 } },
        'pop-in': {
          from: { opacity: 0, transform: 'translateY(8px) scale(0.98)' },
          to: { opacity: 1, transform: 'translateY(0) scale(1)' },
        },
        'slide-in': { from: { transform: 'translateX(100%)' }, to: { transform: 'translateX(0)' } },
        'flash-up': { '0%': { backgroundColor: 'rgba(14, 203, 129, 0.18)' }, '100%': { backgroundColor: 'transparent' } },
        'flash-down': { '0%': { backgroundColor: 'rgba(246, 70, 93, 0.18)' }, '100%': { backgroundColor: 'transparent' } },
      },
      animation: {
        'fade-in': 'fade-in 150ms ease-out',
        'pop-in': 'pop-in 180ms ease-out',
        'slide-in': 'slide-in 220ms cubic-bezier(0.2, 0, 0, 1)',
        'flash-up': 'flash-up 900ms ease-out',
        'flash-down': 'flash-down 900ms ease-out',
      },
    },
  },
  plugins: [],
}
