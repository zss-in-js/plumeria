const { readFileSync, writeFileSync } = require('fs');
const { join } = require('path');

const comments = {
  'static create': `/**
   * Returns an object whose values can be used with \`css.props\`.
   * @param object A style object containing CSS properties.
   * @see https://plumeria.dev/docs/api-reference/create
   */`,

  'static props': `/**
   * Returns unique hashes based on properties.
   * @param objects Style objects containing CSS properties.
   * @see https://plumeria.dev/docs/api-reference/props
   */`,

  'static keyframes': `/**
   * Returns a unique hash identifier that can be used in keyframes animation.
   * @param object A style object containing keyframes properties.
   * @see https://plumeria.dev/docs/api-reference/keyframes
   */`,

  'static viewTransition': `/**
   * Returns the unique name for the viewTransition.
   * @param object A style object containing viewTransition properties.
   * @see https://plumeria.dev/docs/api-reference/viewTransition
   */`,

  'static defineConsts': `/**
   * Returns the same object, with its type narrowed for better autocompletion.
   * @param object A map of keys to constant string or number values.
   * @see https://plumeria.dev/docs/api-reference/defineConsts
   */`,

  'static defineTokens': `/**
   * Returns an object containing CSS variable names and the original token values.
   * @param object A nested object defining design tokens.
   * @see https://plumeria.dev/docs/api-reference/defineTokens
   */`,
};

const dtsPath = join(process.cwd(), 'dist/index.d.ts');
let content = readFileSync(dtsPath, 'utf-8');

Object.entries(comments).forEach(([methodSignature, comment]) => {
  const regex = new RegExp(
    `(\\n)(  )(${methodSignature.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`,
    'g',
  );
  content = content.replace(regex, `$1$2${comment}\n$2$3`);
});

writeFileSync(dtsPath, content, 'utf-8');
