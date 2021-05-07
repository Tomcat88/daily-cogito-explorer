const colors = require('tailwindcss/colors');

module.exports = {
  purge: ['./src/**/*.{js,jsx,ts,tsx}', './public/index.html'],
  darkMode: false, // or 'media' or 'class'
  theme: {
    extend: {
      theme: {
        colors: {
          'dc-green': '#00d95f',
        },
      },
    },
  },
  variants: {
    extend: {},
  },
  plugins: [],
};
