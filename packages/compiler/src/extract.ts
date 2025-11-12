import {
  parse,
  print,
  ImportDeclaration,
  CallExpression,
  Expression,
  Module,
} from '@swc/core';
import { readFile } from 'fs/promises';
import path from 'path';

const generatedTsMap = new Map<string, string>();

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

function expressionToString(expr: Expression): string {
  switch (expr.type) {
    case 'Identifier':
      return expr.value;
    case 'MemberExpression': {
      const obj = expressionToString(expr.object);
      if (obj && expr.property.type === 'Identifier') {
        return `${obj}.${expr.property.value}`;
      }
      break;
    }
    case 'CallExpression': {
      if (expr.callee.type !== 'Super' && expr.callee.type !== 'Import') {
        const callee = expressionToString(expr.callee);
        if (callee) {
          const args = expr.arguments
            .map((arg) => expressionToString(arg.expression))
            .join(', ');
          return `${callee}(${args})`;
        }
      }
      break;
    }
    case 'ObjectExpression': {
      const properties = expr.properties
        .map((prop) => {
          if ('key' in prop && prop.key && prop.key.type === 'Identifier') {
            const key = prop.key.value;
            const value = expressionToString((prop as any).value);
            return `${key}: ${value}`;
          }
          return '[complex property]';
        })
        .join(', ');

      console.warn(
        `css.props: Argument unsupported ${expr.type}: { ${properties} } Use css.create instead.`,
      );
      return '';
    }

    case 'StringLiteral':
      return String(expr.value);
  }

  console.warn(
    `css.props: Argument unsupported ${expr.type}: Use css.create instead.`,
  );
  return '';
}

async function extractCssProps(ast: Module): Promise<string[]> {
  const propsMatches: string[] = [];
  try {
    await visit(ast, {
      CallExpression: async (node: CallExpression) => {
        if (
          node.callee.type === 'MemberExpression' &&
          node.callee.object.type === 'Identifier' &&
          node.callee.object.value === 'css' &&
          node.callee.property.type === 'Identifier' &&
          node.callee.property.value === 'props'
        ) {
          const staticArgs: string[] = [];
          const conditionalStyleObjects: string[] = [];

          for (const arg of node.arguments) {
            if (arg.expression) {
              if (
                arg.expression.type === 'ConditionalExpression' ||
                (arg.expression.type === 'BinaryExpression' &&
                  arg.expression.operator === '&&')
              ) {
                const styles = await extractStyleObjectsFromExpression(
                  arg.expression,
                );
                conditionalStyleObjects.push(...styles);
              } else {
                const argStr = expressionToString(arg.expression);
                if (argStr) {
                  staticArgs.push(argStr);
                }
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
      },
    });
  } catch (e) {
    console.error(`Failed to parse code to extract css.props: ${e}`);
  }

  return propsMatches;
}

function extractStyleObjectsFromExpression(expression: Expression): string[] {
  switch (expression.type) {
    case 'BinaryExpression':
      if (expression.operator === '&&') {
        return extractStyleObjectsFromExpression(expression.right);
      }
      break;
    case 'ConditionalExpression':
      return [
        ...extractStyleObjectsFromExpression(expression.consequent),
        ...extractStyleObjectsFromExpression(expression.alternate),
      ];
    case 'BooleanLiteral':
    case 'NullLiteral':
      return [];
    case 'Identifier':
      if (expression.value === 'undefined') {
        return [];
      }
    // Fallthrough
    case 'ObjectExpression': {
      const str = expressionToString(expression);
      return str ? [str] : [];
    }
  }

  const str = expressionToString(expression);
  if (str) {
    return [str];
  }
  return [];
}

async function extractStaticStringLiteralVariable(
  ast: Module,
): Promise<string> {
  const matches: string[] = [];
  try {
    for (const node of ast.body) {
      if (node.type === 'VariableDeclaration') {
        const allStringLiterals =
          node.declarations.length > 0 &&
          node.declarations.every(
            (decl) => decl.init && decl.init.type === 'StringLiteral',
          );

        if (allStringLiterals) {
          const { code: extractedCode } = await print({
            type: 'Module',
            body: [node],
            span: { start: 0, end: 0, ctxt: 0 },
          } as Module);
          matches.push(extractedCode.trim());
        }
      }
    }
  } catch (e) {
    console.error(
      `Failed to parse code to extract static string literal variables: ${e}`,
    );
  }

  return matches.join('\n');
}

function extractCssPropsFromTemplate(code: string): string[] {
  const matches: string[] = [];
  // Simple regex to find css.props(...) calls, assuming simple arguments in templates.
  const regex = /css\.props\(([^)]*)\)/g;
  let match;

  while ((match = regex.exec(code)) !== null) {
    const matchStart = match.index;

    if (
      isInComment(code, matchStart) ||
      isInString(code, matchStart) ||
      isInHtmlText(code, matchStart)
    ) {
      continue;
    }
    // Exclude matches found within <script> tags, as they are handled by the AST parser.
    const scriptStartIndex = code.indexOf('<script');
    const scriptEndIndex = code.indexOf('</script>');
    if (
      scriptStartIndex !== -1 &&
      scriptEndIndex !== -1 &&
      match.index > scriptStartIndex &&
      match.index < scriptEndIndex
    ) {
      continue;
    }

    const args = match[1];
    // A simple heuristic to avoid complex expressions that regex can't handle well.
    if (args && !args.includes('{') && !args.includes('(')) {
      matches.push(`css.props(${args})`);
    }
  }
  return matches;
}

async function visit(
  node: any,
  visitor: { [key: string]: (node: any) => void },
) {
  if (!node) return;

  const visitorFunc = visitor[node.type];
  if (visitorFunc) {
    await visitorFunc(node);
  }

  for (const key in node) {
    if (typeof node[key] === 'object' && node[key] !== null) {
      if (Array.isArray(node[key])) {
        for (const child of node[key]) {
          await visit(child, visitor);
        }
      } else {
        await visit(node[key], visitor);
      }
    }
  }
}

function importDeclarationToString(node: ImportDeclaration): string {
  const source = node.source.value;

  const defaultImport = node.specifiers.find(
    (s) => s.type === 'ImportDefaultSpecifier',
  );
  const namespaceImport = node.specifiers.find(
    (s) => s.type === 'ImportNamespaceSpecifier',
  );
  const namedImports = node.specifiers.filter(
    (s) => s.type === 'ImportSpecifier',
  ) as any[];

  let importClause = '';

  if (defaultImport) {
    importClause += (defaultImport as any).local.value;
  }

  if (namespaceImport) {
    if (importClause) importClause += ', ';
    importClause += `* as ${(namespaceImport as any).local.value}`;
  }

  if (namedImports.length > 0) {
    if (importClause) importClause += ', ';
    const namedParts = namedImports.map((spec) => {
      if (spec.imported && spec.imported.value !== spec.local.value) {
        return `${spec.imported.value} as ${spec.local.value}`;
      }
      return spec.local.value;
    });
    importClause += `{ ${namedParts.join(', ')} }`;
  }

  if (importClause) {
    return `import ${importClause} from '${source}';`;
  }

  return `import '${source}';`;
}

async function extractImportDeclarations(ast: Module): Promise<string> {
  const importDeclarations: string[] = [];
  try {
    await visit(ast, {
      ImportDeclaration: (node: ImportDeclaration) => {
        importDeclarations.push(importDeclarationToString(node));
      },
    });
  } catch (e) {
    console.error(`Failed to parse code to extract import declarations: ${e}`);
  }
  return importDeclarations.join('\n');
}

async function extractCssMethod(
  ast: Module,
  methodName: string,
): Promise<string> {
  const matches: string[] = [];
  try {
    for (const node of ast.body) {
      if (node.type === 'VariableDeclaration') {
        const containsCssMethod = node.declarations.some(
          (decl) =>
            decl.init &&
            decl.init.type === 'CallExpression' &&
            decl.init.callee.type === 'MemberExpression' &&
            decl.init.callee.object.type === 'Identifier' &&
            decl.init.callee.object.value === 'css' &&
            decl.init.callee.property.type === 'Identifier' &&
            decl.init.callee.property.value === methodName,
        );

        if (containsCssMethod && node.span) {
          const { code: extractedCode } = await print({
            type: 'Module',
            body: [node],
            span: { start: 0, end: 0, ctxt: 0 },
          } as Module);
          matches.push(extractedCode.trim());
        }
      }
    }
  } catch (e) {
    console.error(`Failed to parse code to extract css.${methodName}: ${e}`);
  }

  return matches.join('\n');
}

async function extractVueAndSvelte(filePath: string) {
  const ext = path.extname(filePath);
  if (!(ext === '.svelte' || ext === '.vue')) return filePath;

  const code = await readFile(filePath, 'utf8');

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
  const tsPath = filePath.replace(ext, '.ts');

  // Do nothing if script tag is empty
  if (!tsCode.trim()) {
    generatedTsMap.set(filePath, '');
    return tsPath;
  }

  const ast = await parse(tsCode, {
    syntax: 'typescript',
    tsx: true,
  });

  // extract css.props from both script (AST) and template (regex)
  const propsFromScript = await extractCssProps(ast);
  const propsFromTemplate = extractCssPropsFromTemplate(code);
  const propsMatches = [...new Set([...propsFromScript, ...propsFromTemplate])];

  const calls = propsMatches
    .filter(Boolean)
    .map((call) => `${call};`)
    .join('\n');

  // extract import section
  const importSection = await extractImportDeclarations(ast);

  // extract css.create section using the new function
  const staticVariableSection = await extractStaticStringLiteralVariable(ast);
  const cssCreateSection = await extractCssMethod(ast, 'create');
  const cssKeyframesSection = await extractCssMethod(ast, 'keyframes');
  const cssViewTransitionSection = await extractCssMethod(
    ast,
    'viewTransition',
  );
  const cssDefineConstsSection = await extractCssMethod(ast, 'defineConsts');
  const cssDefineTokensSection = await extractCssMethod(ast, 'defineTokens');

  // finale ts code
  let finalCode = '';

  // add import section
  if (importSection) finalCode += importSection + '\n';
  if (staticVariableSection) finalCode += staticVariableSection + '\n';
  if (cssKeyframesSection) finalCode += cssKeyframesSection + '\n';
  if (cssViewTransitionSection) finalCode += cssViewTransitionSection + '\n';
  if (cssDefineConstsSection) finalCode += cssDefineConstsSection + '\n';
  if (cssDefineTokensSection) finalCode += cssDefineTokensSection + '\n';
  // add style.create section
  if (cssCreateSection) finalCode += cssCreateSection + '\n';
  // add calls as they are
  if (calls) finalCode += calls + '\n';

  generatedTsMap.set(filePath, finalCode);
  return tsPath;
}

async function extractTSFile(filePath: string) {
  const code = await readFile(filePath, 'utf8');
  const ast = await parse(code, {
    syntax: 'typescript',
    tsx: true,
  });

  // extract import section
  const importSection = await extractImportDeclarations(ast);

  // extract static string literal variables
  const staticVariableSection = await extractStaticStringLiteralVariable(ast);

  // extract css.create section using the new function
  const cssCreateSection = await extractCssMethod(ast, 'create');
  const cssKeyframesSection = await extractCssMethod(ast, 'keyframes');
  const cssViewTransitionSection = await extractCssMethod(
    ast,
    'viewTransition',
  );
  const cssDefineConstsSection = await extractCssMethod(ast, 'defineConsts');
  const cssDefineTokensSection = await extractCssMethod(ast, 'defineTokens');

  // extract css.props
  const propsMatches = await extractCssProps(ast);
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

  // Instead of writing to a temp file, store it in memory
  const tempFilePath = filePath.replace(path.extname(filePath), '-temp.ts');
  generatedTsMap.set(filePath, finalCode); // Store content instead of path

  return tempFilePath; // Return the virtual path
}

async function restoreAllOriginals() {
  // The map now holds content, not paths that need deletion at this stage.
  // Clearing the map is sufficient for cleanup.
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

export {
  extractTSFile,
  restoreAllOriginals,
  extractVueAndSvelte,
  generatedTsMap,
};
