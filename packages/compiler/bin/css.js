#!/usr/bin/env node
const path = require('path');
require('rscute/register').register();
require(path.resolve(__dirname, '../dist/index.js'));
