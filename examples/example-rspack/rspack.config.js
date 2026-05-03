import { rspack } from '@rspack/core';
import { ReactRefreshRspackPlugin } from '@rspack/plugin-react-refresh';
import plumeria from '@plumeria/unplugin';
import path from 'path';

const isDev = process.env.NODE_ENV === 'development';

export default {
  entry: {
    app: path.resolve(import.meta.dirname, 'src/index.tsx'),
  },
  context: import.meta.dirname,
  output: {
    path: path.resolve(import.meta.dirname, 'dist'),
    filename: 'bundle.js',
    clean: true,
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx'],
  },
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'builtin:swc-loader',
          options: {
            jsc: {
              parser: {
                syntax: 'typescript',
                tsx: true,
              },
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
    new rspack.HtmlRspackPlugin({
      template: './src/index.html',
    }),
    isDev && new ReactRefreshRspackPlugin(),
  ].filter(Boolean),
  devServer: {
    hot: true,
    port: 3001,
  },
};
