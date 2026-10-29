/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        aicte: {
          bg: '#F6F8FB',
          surface: '#FFFFFF',
          muted: '#F1F4F9',
          border: '#DCE3EC',
          ink: '#172B4D',
          subtext: '#52647A',
          blue: '#245AA8',
          blueHover: '#1D4785',
          navy: '#0B1E36',
          navyLight: '#132F52',
          gold: '#B45309',
          goldSurface: '#FFFBEB',
          goldBorder: '#FDE68A',
          green: '#166534',
          greenSurface: '#F0FDF4',
          greenBorder: '#BBF7D0',
          red: '#B91C1C',
          redSurface: '#FEF2F2',
          redBorder: '#FECACA',
        }
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(16, 24, 40, 0.06), 0 1px 2px -1px rgba(16, 24, 40, 0.04)',
        cardHover: '0 4px 8px -2px rgba(16, 24, 40, 0.08), 0 2px 4px -2px rgba(16, 24, 40, 0.04)',
        subtle: '0 1px 2px 0 rgba(16, 24, 40, 0.04)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        devanagari: ['Noto Sans Devanagari', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
