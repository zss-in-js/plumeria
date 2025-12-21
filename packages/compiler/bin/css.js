#!/usr/bin/env node

const path = require('path');
const { styleText } = require('util');
const { enableCompileCache } = require('node:module');

enableCompileCache();

const { register } = require('rscute/register');

register();

try {
  const stats = process.argv.includes('--stats');
  const view = process.argv.includes('--view');
  const paths = process.argv.includes('--paths');

  require(path.resolve(__dirname, '../dist/index.js'));

  if (!stats && !view && !paths)
    console.log(styleText(['green', 'bold'], '✓ extract...'));
} catch (error) {
  console.error('Compilation failed:', error.message);
  process.exit(1);
}
