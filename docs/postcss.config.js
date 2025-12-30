module.exports = {
  plugins: {
    '@plumeria/postcss-plugin': {
      include: '**/*.{ts,tsx}',
      exclude: ['**/node_modules/**', '**/.next/**'],
    },
  },
};
