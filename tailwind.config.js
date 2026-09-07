/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        qmax: {
          red: '#DC2626',
          redHover: '#B91C1C',
          redDark: '#991B1B',
          redLight: '#FEF2F2',
          redBorder: '#FECACA',
          black: '#0F172A',
          dark: '#1E293B',
          gray: '#475569',
          border: '#E2E8F0',
          bg: '#F8FAFC',
          card: '#FFFFFF'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Roboto Mono', 'monospace']
      }
    },
  },
  plugins: [],
}
