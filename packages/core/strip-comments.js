const fs = require('fs');
const path = require('path');

function clean(file) {
  const content = fs.readFileSync(file, 'utf8');
  let previousLineWasRegionComment = false;
  const cleaned = content
    .split(/\r?\n/)
    .map((line) => {
      const isRegionComment = /^\s*\/\/\s*#(end)?region\b/.test(line);
      if (isRegionComment) {
        previousLineWasRegionComment = true;
        return '';
      }

      // Remove /* ... */ style block comments
      let cleanedLine = line.replace(/\s*\/\*.*\*\/\s*/g, '');

      // Remove // #region style comments
      cleanedLine = cleanedLine
        .replace(/\s*\/\/\s*#(end)?region\b.*$/, '')
        .trimEnd();

      // If the previous line was a `#region` / `#endregion` comment, add a blank line
      const lineToAdd = previousLineWasRegionComment
        ? '\n' + cleanedLine
        : cleanedLine;
      previousLineWasRegionComment = false;
      return lineToAdd;
    })
    .filter((line) => line !== '') // Remove blank lines (but leave `\n`)
    .join('\n');
  fs.writeFileSync(file, cleaned);
}

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (/\.(js|mjs|d\.ts)$/.test(entry.name)) clean(full);
  }
}

walk(path.join(__dirname, 'dist'));
