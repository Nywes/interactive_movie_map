/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'oscar-gold': '#D6BB6E',
        'oscar-dark-gold': '#B69F66',
        'oscar-black': '#111111',
        'oscar-white': '#ffffff',
        'oscar-red': '#801B1D',
      },
      fontFamily: {
        'futura-pt': ['Futura PT Light Book', 'Futura', 'sans-serif'],
        'futura-pt-medium': ['Futura PT Medium', 'Futura', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
