/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'brand': {
          50: '#fdf8ef',
          100: '#f9ecd5',
          200: '#f3d6a9',
          300: '#ecbb73',
          400: '#e5a04d',
          500: '#cd9540',
          600: '#b47a2e',
          700: '#965e28',
          800: '#7a4c27',
          900: '#654023',
        },
        'brand-gold': '#cd9540',
        'brand-gold-light': '#dfb678',
        'brand-green': '#94b47e',
        'brand-bg': '#f7f7f9',
        'brand-text': '#2c3e50',
        'brand-text-light': '#7f8c8d',
      },
    },
  },
  plugins: [],
}
