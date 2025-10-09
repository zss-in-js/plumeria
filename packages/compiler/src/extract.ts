import fs from 'fs';
import path from 'path';

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
  // Search backward from position to find the most recent quote
  let quotePosition = -1;

  for (let i = position - 1; i >= 0; i--) {
    const char = code[i];
    if (char === '"' || char === "'") {
      quotePosition = i;
      break;
    }
  }

  if (quotePosition === -1) return false;

  // Check if there is a Vue attribute pattern before the quote
  const beforeQuote = code.substring(
    Math.max(0, quotePosition - 30),
    quotePosition,
  );

  // Vue attribute pattern (CSS related only)
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
      const originalArgs = args.split(/\s*,\s*(?![^(]*\))/);

      const staticArgs = [];
      const conditionalStyleObjects = [];

      for (const arg of originalArgs) {
        const trimmedArg = arg.trim();
        if (trimmedArg) {
          if (trimmedArg.includes('&&') || trimmedArg.includes('?')) {
            const styles = parseCssPropsArguments(trimmedArg);
            conditionalStyleObjects.push(...styles);
          } else {
            staticArgs.push(trimmedArg);
          }
        }
      }

      if (staticArgs.length > 0) {
        propsMatches.push(`css.props(${staticArgs.join(', ')})`);
      }

      for (const styleObj of conditionalStyleObjects) {
        if (
          styleObj &&
          styleObj !== 'false' &&
          styleObj !== 'null' &&
          styleObj !== 'undefined'
        ) {
          propsMatches.push(`css.props(${styleObj})`);
        }
      }
    }
  }

  return propsMatches;
}

function extractStaticStringLiteralVariable(code: string) {
  const matches: string[] = [];

  const regex =
    /\b(?:var|let|const)\s+[a-zA-Z_$][\w$]*\s*=\s*(['"])(.*?)\1\s*;?/gm;

  let match;
  while ((match = regex.exec(code))) {
    const index = match.index;

    if (
      isInComment(code, index) ||
      isInString(code, index) ||
      isInHtmlText(code, index)
    ) {
      continue;
    }

    matches.push(match[0]);
  }

  return matches.join('\n');
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

function extractCssKeyframes(code: string) {
  const cssCreateMatches = [];
  const regex =
    /(?:(?:\s*const\s+[a-zA-Z0-9_$]+\s*=\s*css\.keyframes\([\s\S]*?\);\s*))/g;
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

function extractCssViewTransition(code: string) {
  const cssCreateMatches = [];
  const regex =
    /(?:(?:\s*const\s+[a-zA-Z0-9_$]+\s*=\s*css\.viewTransition\([\s\S]*?\);\s*))/g;
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

function extractCssDefineConsts(code: string) {
  const cssCreateMatches = [];
  const regex =
    /(?:(?:\s*const\s+[a-zA-Z0-9_$]+\s*=\s*css\.defineConsts\([\s\S]*?\);\s*))/g;
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

function extractCssDefineTokens(code: string) {
  const cssCreateMatches = [];
  const regex =
    /(?:(?:\s*const\s+[a-zA-Z0-9_$]+\s*=\s*css\.defineTokens\([\s\S]*?\);\s*))/g;
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

  // extract css.create section using the new function
  const staticVariableSection = extractStaticStringLiteralVariable(tsCode);
  const cssCreateSection = extractCssCreate(tsCode);
  const cssKeyframesSection = extractCssKeyframes(tsCode);
  const cssViewTransitionSection = extractCssViewTransition(tsCode);
  const cssDefineConstsSection = extractCssDefineConsts(tsCode);
  const cssDefineTokensSection = extractCssDefineTokens(tsCode);

  // finale ts code
  let finalCode = '';

  // add import section
  if (importSection) {
    finalCode += importSection + '\n';
  }

  if (staticVariableSection) {
    finalCode += staticVariableSection + '\n';
  }

  if (cssKeyframesSection) {
    finalCode += cssKeyframesSection + '\n';
  }

  if (cssViewTransitionSection) {
    finalCode += cssViewTransitionSection + '\n';
  }

  if (cssDefineConstsSection) {
    finalCode += cssDefineConstsSection + '\n';
  }

  if (cssDefineTokensSection) {
    finalCode += cssDefineTokensSection + '\n';
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

  // extract static string literal variables
  const staticVariableSection = extractStaticStringLiteralVariable(code);

  // extract css.create section using the new function
  const cssCreateSection = extractCssCreate(code);
  const cssKeyframesSection = extractCssKeyframes(code);
  const cssViewTransitionSection = extractCssViewTransition(code);
  const cssDefineConstsSection = extractCssDefineConsts(code);
  const cssDefineTokensSection = extractCssDefineTokens(code);

  // extract css.props
  const propsMatches = extractCssProps(code);
  const calls = propsMatches
    .filter(Boolean)
    .map((call) => `${call};`)
    .join('\n');

  // Assembly
  let finalCode = '';
  if (importSection) finalCode += importSection + '\n';
  if (staticVariableSection) finalCode += staticVariableSection + '\n';
  if (cssKeyframesSection) finalCode += cssKeyframesSection + '\n';
  if (cssViewTransitionSection) finalCode += cssViewTransitionSection + '\n';
  if (cssDefineConstsSection) finalCode += cssDefineConstsSection + '\n';
  if (cssDefineTokensSection) finalCode += cssDefineTokensSection + '\n';
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

export { extractTSFile, restoreAllOriginals, extractVueAndSvelte };
