#!/usr/bin/env node

const { main } = require('../dist/cli.js');

main(process.argv.slice(2)).then(
  (code) => {
    process.exitCode = code;
  },
  (error) => {
    console.error(`✖ ${(error && error.message) || error}`);
    process.exitCode = 1;
  },
);
