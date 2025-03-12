import fs from 'fs/promises';
import { globSync } from 'fs';

(async () => {
  const files = globSync('dist/**/*.js');

  await Promise.all(
    files.map(async (file) => {
      const newPath = file.replace(/\.js$/, '.mjs');
      await fs.rename(file, newPath);
    }),
  );
})();
