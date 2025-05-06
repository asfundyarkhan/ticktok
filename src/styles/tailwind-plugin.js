import plugin from 'tailwindcss/plugin';

export default plugin(function({ addBase, theme }) {
  addBase({
    'body': {
      backgroundColor: theme('colors.gray.50'),
      color: theme('colors.gray.900'),
    },
  })
});