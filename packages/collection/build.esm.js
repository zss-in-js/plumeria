const fg = require('fast-glob');
const fs = require('fs/promises');

async function buildESM() {
  const files = await fg('dist/**/*.js');

  await Promise.all(
    files.map(async file => {
      const newPath = file.replace(/\.js$/, '.mjs');
      await fs.rename(file, newPath);
    })
  );
}

buildESM();
