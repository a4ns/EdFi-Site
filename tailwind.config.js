/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#05050A', // Deep OLED Black
        surface: '#0A0A14',    // Dark Surface
        surfaceHover: '#13131F', // Lighter Surface
        primary: '#FFFFFF',    // Pure White Text
        secondary: '#A1A1AA',  // Zinc-400 Text
        accent: '#6366F1',     // Web3 Indigo/Purple
        dark: '#05050A',
        green: '#10B981',      // Emerald
        red: '#EF4444',        // Red
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
