module.exports = {
  plugins: {
    '@plumeria/postcss-plugin': {
      include: ['./src/**/*.{ts,tsx}'],
      exclude: ['**/node_modules/**', '**/.next/**'],
    },
  },
};
