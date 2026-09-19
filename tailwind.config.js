/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0B0E11', // Binance Dark Backgroun
        surface: '#181A20',    // Binance Dark Card Background
        surfaceHover: '#2B3139', // Binance Hover State
        primary: '#EAECEF',    // White/Light Gray Text
        secondary: '#848E9C',  // Medium Gray Text
        accent: '#FCD535',     // Binance Yellow
        dark: '#0B0E11',       // Keeping this for compatibility
        green: '#0ECB81',      // Binance Green Positive
        red: '#F6465D',        // Binance Red Negative
      },
      fontFamily: {
        sans: ['"Inter"', 'sans-serif'],
        heading: ['"Inter"', 'sans-serif'],
        drama: ['"Space Grotesk"', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
}
