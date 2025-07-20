const fs = require('fs');
const path = require('path');

const originalCodeMap = new Map<string, string>();
const generatedTsMap = new Map<string, string>();

// css.props extractor function that supports conditional expressions
function extractCssProps(code: string) {
  const propsMatches = [];
  const regex = /css\.props\s*\(/g;
  let match;

  while ((match = regex.exec(code))) {
    const startIndex = match.index + match[0].length;
    let parenCount = 1;
    let currentIndex = startIndex;
    let args = '';

    // Find the matching closing bracket
    while (parenCount > 0 && currentIndex < code.length) {
      const char = code[currentIndex];
      if (char === '(') {
        parenCount++;
      } else if (char === ')') {
        parenCount--;
      }

      // Collect the argument parts (not including the closing bracket)
      if (parenCount > 0 || char !== ')') {
        args += char;
      }
      currentIndex++;
    }

    if (parenCount === 0) {
      // Get the pure argument list with the conditional expressions removed
      const cleanArgs = parseCssPropsArguments(args);
      if (cleanArgs.length > 0) {
        // Reconstruction preserving the original calling format
        propsMatches.push(`css.props(${cleanArgs.join(', ')})`);
      }
    }
  }

  return propsMatches;
}

function parseCssPropsArguments(args: string) {
  const results = [];
  const splitArgs = args.split(/\s*,\s*(?![^(]*\))/);

  for (const arg of splitArgs) {
    // Handle logical AND expressions (&&)
    if (arg.includes('&&')) {
      const match = arg.match(/&&\s*([^\s,]+)/);
      if (match) {
        results.push(match[1]);
        continue;
      }
    }

    // Handle ternary expressions (?:)
    if (arg.includes('?')) {
      const match = arg.match(/([^?]+)\?([^:]+):(.+)$/);
      if (match) {
        // match[2] = then, match[3] = else
        results.push(match[2].trim());
        results.push(match[3].trim());
        continue;
      }
    }

    // Default case (simple argument)
    results.push(arg.trim());
  }

  return results;
}

function extractVueAndSvelte(filePath: string): string {
  const ext = path.extname(filePath);
  if (!(ext === '.svelte' || ext === '.vue')) return filePath;

  const code = fs.readFileSync(filePath, 'utf8');
  originalCodeMap.set(filePath, code);

  const lines = code.split(/\r?\n/);
  let inScript = false;
  const contentLines = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (!inScript && /^<script\b/.test(trimmed)) {
      inScript = true;
      continue;
    }
    if (inScript && /^<\/script>/.test(trimmed)) {
      inScript = false;
      continue;
    }
    if (inScript) {
      contentLines.push(line);
    }
  }
  const tsCode = contentLines.join('\n');

  // Search for css.props in the original code (as it may be in a HTML tags)
  // extract css.props
  const propsMatches = [...extractCssProps(tsCode), ...extractCssProps(code)];
  const calls = propsMatches
    .filter(Boolean)
    .map((call) => `${call};`)
    .join('\n');

  // extract import section
  const importRegex = /^(\s*import\s[^;]+;\s*)+/m;
  const importMatch = tsCode.match(importRegex);
  const importSection = importMatch ? importMatch[0] : '';

  // extract style.create section
  const stylesRegex =
    /const\s+([A-Za-z_$][\w$]*)\s*=\s*css\.create\([\s\S]*?\);\s*/g;
  const stylesMatch = tsCode.match(stylesRegex);
  const stylesSection = stylesMatch ? stylesMatch[0] : '';

  // finale ts code
  let finalCode = '';

  // add import section
  if (importSection) {
    finalCode += importSection + '\n';
  }

  // add style.create section
  if (stylesSection) {
    finalCode += stylesSection + '\n';
  }

  // add calls as they are
  if (calls) {
    finalCode += calls + '\n';
  }

  // console.log('=== Debug Info ===');
  // console.log('File:', filePath);
  // console.log('Found props matches:', propsMatches);
  // console.log('Merged call:', mergedCall);
  // console.log('Final code:');
  // console.log(finalCode);
  // console.log('==================');

  const tsPath = filePath.replace(ext, '.ts');
  fs.writeFileSync(tsPath, finalCode, 'utf8');
  generatedTsMap.set(filePath, tsPath);
  return tsPath;
}

async function extractAndInjectStyleProps(filePath: string) {
  const original = fs.readFileSync(filePath, 'utf8');
  originalCodeMap.set(filePath, original);

  // extract import section
  const importRegex = /^(?:\s*import\s[^;]+;\s*)+/m;
  const importMatch = original.match(importRegex);
  const importSection = importMatch ? importMatch[0] : '';

  // extract css.create section
  const cssCreateRegex =
    /(?:(?:\s*const\s+[a-zA-Z0-9_$]+\s*=\s*css\.create\([\s\S]*?\);\s*))/g;
  const cssCreateSection = (original.match(cssCreateRegex) || []).join('\n');

  // extract css.props
  const propsMatches = extractCssProps(original);
  const calls = propsMatches
    .filter(Boolean)
    .map((call) => `${call};`)
    .join('\n');

  // Assembly
  let finalCode = '';
  if (importSection) finalCode += importSection + '\n';
  if (cssCreateSection) finalCode += cssCreateSection + '\n';
  finalCode += calls;

  fs.writeFileSync(filePath, finalCode, 'utf8');
}

async function restoreAllOriginals() {
  for (const [originalPath, genPath] of generatedTsMap.entries()) {
    if (genPath !== originalPath && fs.existsSync(genPath)) {
      fs.unlinkSync(genPath); // Delete only the files generated by conversion from /.svelte and .vue to .ts
    }
  }
  generatedTsMap.clear();

  // Write all originalCodeMaps back to the original files from JSX/TSX/JS/TS
  for (const [filePath, backup] of originalCodeMap.entries()) {
    fs.writeFileSync(filePath, backup, 'utf8');
  }
  originalCodeMap.clear();
}

// Process-wide error handling (for recovery)
process.on('uncaughtException', async (error) => {
  console.error('Uncaught Exception:', error);
  await restoreAllOriginals();
  process.exit(1);
});

process.on('unhandledRejection', async (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  await restoreAllOriginals();
  process.exit(1);
});

module.exports = {
  extractAndInjectStyleProps,
  restoreAllOriginals,
  extractVueAndSvelte,
  originalCodeMap,
};
