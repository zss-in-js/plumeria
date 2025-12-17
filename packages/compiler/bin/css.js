#!/usr/bin/env node

const path = require('path');
const { styleText } = require('util');
const { enableCompileCache } = require('node:module');

enableCompileCache();

const { register } = require('rscute/register');

register();

try {
  const checkMark = styleText('greenBright', '✓');
  const stats = process.argv.includes('--stats');

  require(path.resolve(__dirname, '../dist/index.js'));

  if (!stats) console.log(` ${checkMark} Compiled...`);
} catch (error) {
  console.error('Compilation failed:', error.message);
  process.exit(1);
}
