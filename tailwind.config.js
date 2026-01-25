/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Franklin-Covey priority colors
        priority: {
          a: '#EF4444', // Red
          b: '#F97316', // Orange
          c: '#EAB308', // Yellow
          d: '#9CA3AF', // Gray
        },
        // Category colors
        category: {
          red: '#EF4444',
          orange: '#F97316',
          yellow: '#EAB308',
          green: '#22C55E',
          cyan: '#06B6D4',
          blue: '#3B82F6',
          purple: '#8B5CF6',
          pink: '#EC4899',
        },
        // App theme colors (amber/warm)
        app: {
          primary: '#D97706',
          secondary: '#B45309',
          background: '#FEF3E2',
          surface: '#FFFBEB',
        },
      },
    },
  },
  plugins: [],
}
