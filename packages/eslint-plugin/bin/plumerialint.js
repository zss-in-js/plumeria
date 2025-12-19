#!/usr/bin/env node

const { ESLint } = require('eslint');
const { plumeria } = require('@plumeria/eslint-plugin');

async function run() {
  const eslint = new ESLint({
    cwd: process.cwd(),
    overrideConfig: [plumeria.flatConfigs.recommended],
    ignorePatterns: ['**/.*/**'],
  });

  const results = await eslint.lintFiles('**/*.{ts,tsx,js,jsx}');

  const hasProblem = results.some(
    (r) => r.errorCount > 0 || r.warningCount > 0,
  );

  const formatter = await eslint.loadFormatter('stylish');
  process.stdout.write(formatter.format(results));

  if (hasProblem) {
    process.exitCode = 1;
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
