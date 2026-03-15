import * as Babel from '@babel/standalone';
import { genBase36Hash, splitAtomicAndNested, processAtomicProps, overrideLonghand, transpileAtomic } from 'zss-engine';
import type { CSSProperties } from 'zss-engine';

interface StyleRecord {
  key: string;
  hash: string;
  sheet: string;
}

export function getStyleRecords(styleRule: CSSProperties): StyleRecord[] {
  const flat: any = {};
  const nonFlat: any = {};
  const notNormalize = ':not(#\\\\#)';
  splitAtomicAndNested(styleRule, flat, nonFlat);
  const finalFlat = overrideLonghand(flat);
  const records: StyleRecord[] = [];

  Object.entries(finalFlat).forEach(([prop, value]) => {
    const atomicMap = new Map<string, string>();
    processAtomicProps({ [prop]: value }, atomicMap);
    for (const [hash, sheet] of atomicMap) {
      records.push({ key: prop, hash, sheet });
    }
  });

  if (Object.keys(nonFlat).length > 0) {
    Object.entries(nonFlat).forEach(([selector, style]: [string, any]) => {
      const isAtomic = selector.startsWith(':') || selector.startsWith('[');
      if (isAtomic) {
        Object.entries(style).forEach(([prop, value]) => {
          const hashSource = {
            [selector]: {
              [prop]: value,
            },
          };
          const hash = genBase36Hash(hashSource, 1, 8);
          let sheet = transpileAtomic(prop, value as any, hash, selector);
          const notSuffix = prop.startsWith('--') ? '' : notNormalize;
          sheet = sheet.replace(`.${hash}`, `.${hash}${notSuffix}`);
          records.push({
            key: `${selector}:${prop}`,
            hash,
            sheet: sheet + '\n',
          });
        });
      }
    });
  }
  return records;
}

/**
 * Standalone compiler utility using Babel Standalone (browser compatible)
 */
export function compileCode(code: string) {
  const extractedSheets = new Set<string>();
  const classMap: Record<string, string> = {};
  const plumeriaAliases: Record<string, string> = { style: 'NAMESPACE' }; // Default fallback

  try {
    // We use a custom plugin to extract styles during the transformation process
    const extractorPlugin = ({ types: t }: { types: any }) => {
      const resolveValue = (node: any, path: any): any => {
        if (t.isStringLiteral(node) || t.isNumericLiteral(node) || t.isBooleanLiteral(node)) {
          return node.value;
        }
        if (t.isIdentifier(node)) {
          const binding = path.scope.getBinding(node.name);
          if (binding && t.isVariableDeclarator(binding.path.node) && binding.path.node.init) {
            return resolveValue(binding.path.node.init, binding.path);
          }
        }
        if (t.isObjectExpression(node)) {
          const obj: Record<string, any> = {};
          node.properties.forEach((prop: any) => {
            if (t.isObjectProperty(prop)) {
              const key = t.isIdentifier(prop.key) ? prop.key.name : prop.key.value;
              if (key) {
                obj[key] = resolveValue(prop.value, path);
              }
            }
          });
          return obj;
        }
        if (t.isTemplateLiteral(node)) {
          return node.quasis[0].value.cooked;
        }
        return undefined;
      };

      return {
        visitor: {
          ImportDeclaration(path: any) {
            const source = path.node.source.value;
            if (source === '@plumeria/core' || source === 'plumeria') {
              path.node.specifiers.forEach((spec: any) => {
                if (t.isImportNamespaceSpecifier(spec) || t.isImportDefaultSpecifier(spec)) {
                  plumeriaAliases[spec.local.name] = 'NAMESPACE';
                } else if (t.isImportSpecifier(spec)) {
                  const importedName = t.isIdentifier(spec.imported) ? spec.imported.name : spec.imported.value;
                  plumeriaAliases[spec.local.name] = importedName;
                }
              });
            }
          },
          CallExpression(path: any) {
            const callee = path.node.callee;
            let pName: string | undefined;

            if (t.isMemberExpression(callee) && t.isIdentifier(callee.object) && t.isIdentifier(callee.property)) {
              if (plumeriaAliases[callee.object.name] === 'NAMESPACE') pName = callee.property.name;
            } else if (t.isIdentifier(callee)) {
              pName = plumeriaAliases[callee.name];
            }

            if (pName === 'create' && path.node.arguments.length > 0 && t.isObjectExpression(path.node.arguments[0])) {
              const obj = resolveValue(path.node.arguments[0], path);
              if (obj) {
                Object.entries(obj).forEach(([ruleKey, styleObj]) => {
                  const records = getStyleRecords(styleObj as any);
                  records.forEach((r) => {
                    extractedSheets.add(r.sheet);
                    classMap[`${ruleKey}:${r.key}`] = r.hash;
                  });
                });
              }
            }
          },
        },
      };
    };

    Babel.transform(code, {
      presets: ['typescript', 'react'],
      plugins: [extractorPlugin],
      filename: 'playground.tsx',
      configFile: false,
      babelrc: false,
    });

    const finalCss = Array.from(extractedSheets).join('\n');
    console.log('[Compiler] Successfully extracted CSS. Length:', finalCss.length);

    return {
      css: finalCss,
      classMap,
    };
  } catch (error: any) {
    console.error('[Compiler] Error during compilation:', error);
    return { error: error.message };
  }
}
