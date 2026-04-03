import * as Babel from '@babel/standalone';
import {
  genBase36Hash,
  splitAtomicAndNested,
  processAtomicProps,
  overrideLonghand,
  transpileAtomic,
  exceptionCamelCase,
} from 'zss-engine';
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
    const localStyleMeta: Record<string, { hashes: string; cssVars?: Record<string, string> }> = {};

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
        if (t.isArrayExpression(node)) {
          return node.elements.map((el: any) => (t.isExpression(el) ? resolveValue(el, path) : undefined));
        }
        if (t.isTemplateLiteral(node)) {
          return node.quasis[0].value.cooked;
        }
        if (t.isMemberExpression(node) && t.isIdentifier(node.object) && t.isIdentifier(node.property)) {
          const obj = resolveValue(node.object, path);
          if (obj && typeof obj === 'object') {
            return obj[node.property.name];
          }
        }
        if (t.isLogicalExpression(node) && node.operator === '&&') {
          return resolveValue(node.right, path);
        }
        if (t.isConditionalExpression(node)) {
          return [resolveValue(node.consequent, path), resolveValue(node.alternate, path)];
        }
        if (t.isArrowFunctionExpression(node) || t.isFunctionExpression(node)) {
          return node;
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
              let varName = '';
              if (t.isVariableDeclarator(path.parentPath.node)) {
                varName = (path.parentPath.node.id as any).name;
              }

              const objExpr = path.node.arguments[0];
              objExpr.properties.forEach((prop: any) => {
                const key = t.isIdentifier(prop.key) ? prop.key.name : (prop.key as any).value;
                const val = prop.value;

                if (t.isArrowFunctionExpression(val) || t.isFunctionExpression(val)) {
                  const params = val.params.map((p: any) => p.name);
                  const cssVars: Record<string, string> = {};
                  params.forEach((p: string) => {
                    cssVars[p] = `--${key}-${p}`;
                  });

                  // Extract styles by assuming variant returns an object literal
                  if (t.isObjectExpression(val.body)) {
                    const resolvedStyle = resolveValue(val.body, path);
                    if (resolvedStyle) {
                      const records = getStyleRecords(resolvedStyle as any);
                      const hashes = records.map((r) => r.hash).join(' ');
                      records.forEach((r) => extractedSheets.add(r.sheet));
                      if (varName) {
                        localStyleMeta[`${varName}.${key}`] = { hashes, cssVars };
                      }
                    }
                  }
                  return;
                }

                const styleObj = resolveValue(val, path);
                if (styleObj && typeof styleObj === 'object' && !t.isNode(styleObj)) {
                  const records = getStyleRecords(styleObj as any);
                  const hashes = records.map((r) => r.hash).join(' ');
                  records.forEach((r) => {
                    extractedSheets.add(r.sheet);
                    classMap[`${key}:${r.key}`] = r.hash;
                  });
                  if (varName) {
                    localStyleMeta[`${varName}.${key}`] = { hashes };
                  }
                }
              });
            }
          },
          JSXAttribute(path: any) {
            if (path.node.name.name !== 'styleName') return;
            if (!t.isJSXExpressionContainer(path.node.value)) return;
            const expr = path.node.value.expression;

            let styleValue: any = null;

            const processStyleName = (e: any): string | null => {
              if (t.isMemberExpression(e) && t.isIdentifier(e.object) && t.isIdentifier(e.property)) {
                const metaKey = `${e.object.name}.${e.property.name}`;
                return localStyleMeta[metaKey]?.hashes || null;
              }
              if (
                t.isCallExpression(e) &&
                t.isMemberExpression(e.callee) &&
                t.isIdentifier(e.callee.object) &&
                t.isIdentifier(e.callee.property)
              ) {
                const metaKey = `${e.callee.object.name}.${e.callee.property.name}`;
                const meta = localStyleMeta[metaKey];
                if (meta) {
                  if (meta.cssVars && e.arguments.length > 0) {
                    const arg = e.arguments[0];
                    if (t.isObjectExpression(arg)) {
                      const props: any[] = [];
                      arg.properties.forEach((p: any) => {
                        const pKey = t.isIdentifier(p.key) ? p.key.name : (p.key as any).value;
                        const vName = meta.cssVars![pKey];
                        if (vName) {
                          let finalVal = p.value;
                          if (t.isNumericLiteral(p.value) && !exceptionCamelCase.includes(pKey)) {
                            finalVal = t.stringLiteral(p.value.value + 'px');
                          }
                          props.push(t.objectProperty(t.stringLiteral(vName), finalVal));
                        }
                      });
                      styleValue = t.objectExpression(props);
                    }
                  }
                  return meta.hashes;
                }
              }
              return null;
            };

            const hashes: string[] = [];
            if (t.isArrayExpression(expr)) {
              expr.elements.forEach((el: any) => {
                const h = processStyleName(el);
                if (h) hashes.push(h);
              });
            } else {
              const h = processStyleName(expr);
              if (h) hashes.push(h);
            }

            if (hashes.length > 0) {
              const classNameValue = t.stringLiteral(hashes.join(' '));
              const openingElement = path.parentPath.node;

              const existingClassName = openingElement.attributes.find(
                (a: any) => t.isJSXAttribute(a) && a.name.name === 'className',
              );
              if (existingClassName) {
                existingClassName.value = t.jsxExpressionContainer(
                  t.callExpression(t.memberExpression(t.identifier('style'), t.identifier('use')), [
                    classNameValue,
                    existingClassName.value.expression || existingClassName.value,
                  ]),
                );
              } else {
                openingElement.attributes.push(t.jsxAttribute(t.jsxIdentifier('className'), classNameValue));
              }

              if (styleValue) {
                const existingStyle = openingElement.attributes.find(
                  (a: any) => t.isJSXAttribute(a) && a.name.name === 'style',
                );
                if (existingStyle) {
                  existingStyle.value = t.jsxExpressionContainer(
                    t.objectExpression([...existingStyle.value.expression.properties, ...styleValue.properties]),
                  );
                } else {
                  openingElement.attributes.push(
                    t.jsxAttribute(t.jsxIdentifier('style'), t.jsxExpressionContainer(styleValue)),
                  );
                }
              }
              path.remove();
              return;
            }

            // Fallback for non-optimizable dynamic cases
            path.node.name.name = 'className';
            path.node.value = t.jsxExpressionContainer(
              t.callExpression(t.memberExpression(t.identifier('style'), t.identifier('use')), [expr]),
            );
          },
        },
      };
    };

    const result = Babel.transform(code, {
      presets: ['typescript'],
      plugins: [extractorPlugin],
      filename: 'playground.tsx',
      configFile: false,
      babelrc: false,
    });

    const finalCss = Array.from(extractedSheets).join('\n');
    console.log('[Compiler] Successfully extracted CSS. Length:', finalCss.length);

    return {
      code: result?.code,
      css: finalCss,
      classMap,
    };
  } catch (error: any) {
    console.error('[Compiler] Error during compilation:', error);
    return { error: error.message };
  }
}
