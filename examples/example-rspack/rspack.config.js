import { rspack } from '@rspack/core';
import { ReactRefreshRspackPlugin } from '@rspack/plugin-react-refresh';
import plumeria from '@plumeria/unplugin';

const isDev = process.env.NODE_ENV === 'development';

export default {
  entry: './src/index.tsx',
  output: {
    filename: 'bundle.js',
    clean: true,
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js'],
  },
  module: {
    rules: [
      {
        test: /\.(ts|tsx)?$/,
        use: {
          loader: 'builtin:swc-loader',
          options: {
            jsc: {
              parser: { syntax: 'typescript', tsx: true },
              transform: {
                react: {
                  runtime: 'automatic',
                  development: isDev,
                  refresh: isDev,
                },
              },
            },
          },
        },
      },
    ],
  },
  plugins: [
    plumeria.rspack(),
    new rspack.HtmlRspackPlugin({ template: './src/index.html' }),
    isDev && new ReactRefreshRspackPlugin(),
  ].filter(Boolean),
  devServer: {
    hot: true,
    port: 3000,
  },
};
