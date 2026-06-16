/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        wealth: {
          bg: '#0F172A',         // Slate 900
          card: '#1E293B',       // Slate 800
          border: '#334155',     // Slate 700
          accent: '#3B82F6',     // Blue 500
          accentHover: '#2563EB',// Blue 600
          emerald: '#10B981',    // Emerald 500
          rose: '#F43F5E',       // Rose 500
          textPrimary: '#F8FAFC',// Slate 50
          textSecondary: '#94A3B8'// Slate 400
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
