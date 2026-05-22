/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx,js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0D0D0D',
        foreground: '#F9FAFB',
        surface: '#111111',
        primary: {
          DEFAULT: '#5EEAD4',
          foreground: '#0D0D0D',
        },
        border: '#222222',
        muted: {
          DEFAULT: '#1A1A1A',
          foreground: '#A1A1AA',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
