import { unpluginFactory } from './core';

import bun from './bun';
import esbuild from './esbuild';
import farm from './farm';
import rolldown from './rolldown';
import rollup from './rollup';
import rspack from './rspack';
import vite from './vite';
import webpack from './webpack';
import unloader from './unloader';

const plumeria = {
  bun,
  esbuild,
  farm,
  rolldown,
  rollup,
  rspack,
  unloader,
  vite,
  webpack,
  raw: unpluginFactory,
};

export {
  bun,
  esbuild,
  farm,
  rolldown,
  rollup,
  rspack,
  unloader,
  vite,
  webpack,
};

export default plumeria;
