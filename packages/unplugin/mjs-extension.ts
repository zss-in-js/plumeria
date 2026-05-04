const fs = require('fs');
const path = require('path');

const convert = (dir: string) => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);

    if (e.isDirectory()) {
      convert(p);
      continue;
    }
    if (!e.isFile() || !p.endsWith('.js')) continue;

    const mjs = p.replace(/\.js$/, '.mjs');
    if (fs.existsSync(mjs)) {
      continue;
    }

    try {
      fs.renameSync(p, mjs);
      let content = fs.readFileSync(mjs, 'utf8');
      content = content.replace(
        /(from\s+['"])(\.\.?\/[^'"]+?)(?=['"])/g,
        (_: string, pre: string, rel: string) =>
          /\.\w+$/.test(rel) ? `${pre}${rel}` : `${pre}${rel}.mjs`,
      );
      fs.writeFileSync(mjs, content);
    } catch (e) {
      console.error(`Failed: ${p}`, e);
    }
  }
};

const dir = path.resolve('dist');

if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) {
  console.error(`Invalid directory: ${dir}`);
  process.exit(1);
}

convert(dir);
