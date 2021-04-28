module.exports = {
  purge: ['./src/**/*.{js,jsx,ts,tsx}', './public/index.html'],
  darkMode: false, // or 'media' or 'class'
  theme: {
    extend: {
      animation: {
        spin: 'spin infinite 20s linear',
      },
    },
  },
  variants: {
    extend: {},
  },
  plugins: [],
};
