const fs = require('fs');
const path = require('path');

function clean(file: string) {
  const content = fs.readFileSync(file, 'utf8');

  const lines = content.split(/\r?\n/);
  const resultLines: string[] = [];
  let skipNextBlank = false; // Flag to not insert extra blank lines after deleting #region/#endregion

  for (const line of lines) {
    const isRegionComment = /^\s*\/\/\s*#(end)?region\b/.test(line);

    if (isRegionComment) {
      // Completely delete the #region or #endregion line.
      // After deleting, make sure there is no blank line before the next non-blank line.
      skipNextBlank = true;
      continue;
    }

    // Also remove inline comments like //#region at the end of the line.
    const cleanedLine = line
      .replace(/\s*\/\/\s*#(end)?region\b.*$/i, '')
      .trimEnd();

    if (cleanedLine === '') {
      // In the case of an original blank line
      if (!skipNextBlank) {
        resultLines.push('');
      }
      skipNextBlank = false; // Reset if you add a blank line
    } else {
      // For actual code lines
      if (
        skipNextBlank &&
        resultLines.length > 0 &&
        resultLines[resultLines.length - 1] !== ''
      ) {
        // If there is no blank line immediately before, fill in a blank line (maintain natural spacing)
        resultLines.push('');
      }
      resultLines.push(cleanedLine);
      skipNextBlank = false;
    }
  }

  // Remove leading blank lines (prevents blank lines at the beginning of the file)
  while (resultLines.length > 0 && resultLines[0] === '') {
    resultLines.shift();
  }

  // Lightly trim the end if there are too many blank lines
  while (
    resultLines.length > 1 &&
    resultLines[resultLines.length - 1] === '' &&
    resultLines[resultLines.length - 2] === ''
  ) {
    resultLines.pop();
  }

  const cleaned = resultLines.join('\n');

  // Leave a single newline at the end of the file (common practice)
  fs.writeFileSync(file, cleaned + (cleaned ? '\n' : ''));
}

function walk(dir: string) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full);
    } else if (/\.(js|mjs|d\.ts)$/.test(entry.name)) {
      clean(full);
    }
  }
}

walk(path.join(__dirname, 'dist'));
