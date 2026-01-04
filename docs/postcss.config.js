module.exports = {
  plugins: {
    '@plumeria/postcss-plugin': {
      include: ['./app/**/*.{ts,tsx}', './component/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
      exclude: ['**/node_modules/**', '**/.next/**'],
    },
  },
};
