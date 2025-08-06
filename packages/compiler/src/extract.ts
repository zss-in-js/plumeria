const fs = require('fs');
const path = require('path');

const generatedTsMap = new Map<string, string>();

// Helper function to check if a position is within a comment
function isInComment(code: string, position: number): boolean {
  const beforePosition = code.substring(0, position);

  // Check for single-line comments
  const lines = beforePosition.split('\n');
  const currentLine = lines[lines.length - 1];
  const singleLineCommentIndex = currentLine.indexOf('//');
  if (singleLineCommentIndex !== -1) {
    return true;
  }

  // Check for multi-line comments
  let inMultiLineComment = false;
  let i = 0;

  while (i < position) {
    if (code.substring(i, i + 2) === '/*') {
      inMultiLineComment = true;
      i += 2;
    } else if (code.substring(i, i + 2) === '*/') {
      inMultiLineComment = false;
      i += 2;
    } else {
      i++;
    }
  }

  return inMultiLineComment;
}

function isInVueAttribute(code: string, position: number): boolean {
  // positionから逆方向に検索して、最近のクォートを探す
  let quotePosition = -1;

  for (let i = position - 1; i >= 0; i--) {
    const char = code[i];
    if (char === '"' || char === "'") {
      quotePosition = i;
      break;
    }
  }

  if (quotePosition === -1) return false;

  // そのクォートの前にVue属性パターンがあるかチェック
  const beforeQuote = code.substring(
    Math.max(0, quotePosition - 30),
    quotePosition,
  );

  // Vue属性パターン（CSS関連のもののみ）
  const vueAttributePattern = /(:|v-bind:)(class|style)\s*=\s*$/;

  return vueAttributePattern.test(beforeQuote);
}

function isInString(code: string, position: number) {
  let inSingleQuote = false;
  let inDoubleQuote = false;
  let inBacktick = false;
  let escape = false;

  for (let i = 0; i < position; i++) {
    const char = code[i];

    if (escape) {
      escape = false;
      continue;
    }

    if (char === '\\') {
      escape = true;
      continue;
    }

    if (!inSingleQuote && !inDoubleQuote && !inBacktick) {
      if (char === "'") {
        inSingleQuote = true;
      } else if (char === '"') {
        inDoubleQuote = true;
      } else if (char === '`') {
        inBacktick = true;
      }
    } else {
      if (inSingleQuote && char === "'") {
        inSingleQuote = false;
      } else if (inDoubleQuote && char === '"') {
        inDoubleQuote = false;
      } else if (inBacktick && char === '`') {
        inBacktick = false;
      }
    }
  }

  const inStringLiteral = inSingleQuote || inDoubleQuote || inBacktick;

  // Vue attributes are picked up
  if (inStringLiteral && isInVueAttribute(code, position)) return false;

  return inStringLiteral;
}

function isInHtmlText(code: string, position: number): boolean {
  // Find the last occurrence of < and > before position
  let lastOpenTag = -1;
  let lastCloseTag = -1;

  for (let i = position - 1; i >= 0; i--) {
    if (code[i] === '>' && lastCloseTag === -1) {
      lastCloseTag = i;
    }
    if (code[i] === '<') {
      lastOpenTag = i;
      break;
    }
  }

  // Find the first occurrence of < after position
  let nextOpenTag = -1;
  for (let i = position; i < code.length; i++) {
    if (code[i] === '<') {
      nextOpenTag = i;
      break;
    }
  }

  // Conditions for text within HTML tags:
  // If there is a > immediately before and a < immediately after
  return lastCloseTag > lastOpenTag && nextOpenTag > position;
}

// css.props extractor function that supports conditional expressions
function extractCssProps(code: string) {
  const propsMatches = [];
  const regex = /css\.props\s*\(/g;
  let match;

  while ((match = regex.exec(code))) {
    // Skip if this match is within a comment
    if (
      isInComment(code, match.index) ||
      isInString(code, match.index) ||
      isInHtmlText(code, match.index)
    ) {
      continue;
    }

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
      // Normalize whitespace and newlines in args for better parsing
      const normalizedArgs = args.replace(/\s+/g, ' ').trim();

      // Get the pure argument list with the conditional expressions removed
      const cleanArgs = parseCssPropsArguments(normalizedArgs);
      if (cleanArgs.length > 0) {
        // Reconstruction preserving the code calling format
        propsMatches.push(`css.props(${cleanArgs.join(', ')})`);
      }
    }
  }

  return propsMatches;
}

// Enhanced css.create extractor that skips commented code
function extractCssCreate(code: string) {
  const cssCreateMatches = [];
  const regex =
    /(?:(?:\s*const\s+[a-zA-Z0-9_$]+\s*=\s*css\.create\([\s\S]*?\);\s*))/g;
  let match;

  while ((match = regex.exec(code))) {
    // Skip if this match is within a comment
    if (
      isInComment(code, match.index) ||
      isInString(code, match.index) ||
      isInHtmlText(code, match.index)
    ) {
      continue;
    }

    cssCreateMatches.push(match[0]);
  }

  return cssCreateMatches.join('\n');
}

// Enhanced css.global extractor that skips commented code
function extractCssGlobal(code: string) {
  const cssCreateMatches = [];
  // const regex = /(?:(?:\s*\s*=\s*css\.global\([\s\S]*?\);\s*))/g;
  const regex = /\bcss\.global\(\s*([\s\S]*?)\s*\);/g;

  let match;

  while ((match = regex.exec(code))) {
    // Skip if this match is within a comment
    if (
      isInComment(code, match.index) ||
      isInString(code, match.index) ||
      isInHtmlText(code, match.index)
    ) {
      continue;
    }

    cssCreateMatches.push(match[0]);
  }

  return cssCreateMatches.join('\n');
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

async function extractVueAndSvelte(filePath: string) {
  const ext = path.extname(filePath);
  if (!(ext === '.svelte' || ext === '.vue')) return filePath;

  const code = fs.readFileSync(filePath, 'utf8');

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

  // Search for css.props in the code code (as it may be in a HTML tags)
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

  // extract css.create and css.global section using the new function
  const cssCreateSection = extractCssCreate(code);
  const cssGlobalSection = extractCssGlobal(code);

  // finale ts code
  let finalCode = '';

  // add import section
  if (importSection) {
    finalCode += importSection + '\n';
  }

  // add css.global section
  if (cssGlobalSection) {
    finalCode += cssGlobalSection + '\n';
  }

  // add style.create section
  if (cssCreateSection) {
    finalCode += cssCreateSection + '\n';
  }

  // add calls as they are
  if (calls) {
    finalCode += calls + '\n';
  }

  const tsPath = filePath.replace(ext, '.ts');
  fs.writeFileSync(tsPath, finalCode, 'utf8');
  generatedTsMap.set(filePath, tsPath);
  return tsPath;
}

async function extractTSFile(filePath: string) {
  const code = fs.readFileSync(filePath, 'utf8');

  // extract import section
  const importRegex = /^(?:\s*import\s[^;]+;\s*)+/m;
  const importMatch = code.match(importRegex);
  const importSection = importMatch ? importMatch[0] : '';

  // extract css.create section using the new function
  const cssCreateSection = extractCssCreate(code);

  // extract css.global section using the new function
  const cssGlobalSection = extractCssGlobal(code);

  // extract css.props
  const propsMatches = extractCssProps(code);
  const calls = propsMatches
    .filter(Boolean)
    .map((call) => `${call};`)
    .join('\n');

  // Assembly
  let finalCode = '';
  if (importSection) finalCode += importSection + '\n';
  if (cssGlobalSection) finalCode += cssGlobalSection + '\n';
  if (cssCreateSection) finalCode += cssCreateSection + '\n';
  finalCode += calls;

  const ext = path.extname(filePath);
  const tempFilePath = filePath.replace(ext, '-temp.ts');
  fs.writeFileSync(tempFilePath, finalCode, 'utf8');
  generatedTsMap.set(filePath, tempFilePath);

  return tempFilePath;
}

async function restoreAllOriginals() {
  for (const [originalPath, genPath] of generatedTsMap.entries()) {
    if (genPath !== originalPath && fs.existsSync(genPath)) {
      fs.unlinkSync(genPath); // Delete only the files generated by conversion from /.svelte and .vue to .ts
    }
  }
  generatedTsMap.clear();
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
  extractTSFile,
  restoreAllOriginals,
  extractVueAndSvelte,
};
