import { loadCompiler } from './runtime';

const { compiler } = await loadCompiler(0);

export const { getStyleRecords, themeHashOf, createTheme } = compiler;
