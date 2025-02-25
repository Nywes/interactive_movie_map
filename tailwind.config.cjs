/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'oscar-gold': '#d4af37',
        'oscar-dark-gold': '#b8860b',
        'oscar-black': '#111111',
        'oscar-white': '#ffffff',
      },
      fontFamily: {
        'futura-pt': ['Futura PT Light Book', 'Futura', 'sans-serif'],
        'futura-pt-medium': ['Futura PT Medium', 'Futura', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
