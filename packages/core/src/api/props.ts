import {
  injectClientCSS,
  isServer,
  isTestingDevelopment,
  type CSSProperties,
} from 'zss-engine';
import { styleAtomMap } from './create';
import {
  globalPromise_1,
  initPromise_1,
  resolvePromise_1,
} from '../processors/css';

const injectedStyleSheets = new Set<string>();

export function props(
  ...objects: (false | CSSProperties | null | undefined)[]
): string {
  const seenSheets = new Set<string>();
  const allStyleSheets: string[] = [];
  const classList: string[] = [];
  const chosen = new Map(); // key -> {hash, sheet, propsIdx}
  const rightmostKeys = []; // Keys from the rightmost props
  const orderedKeys = []; // Other keys to be displayed in the order of left props

  for (let i = objects.length - 1; i >= 0; i--) {
    const obj = objects[i];
    if (!obj) continue;
    const records = styleAtomMap.get(obj);
    if (!records) continue;
    for (const { key, hash, sheet } of records) {
      if (!chosen.has(key)) {
        chosen.set(key, { hash, sheet, propsIdx: i });
      }
    }
  }

  // Collect a list of adopted keys for each prop
  for (let i = 0; i < objects.length; i++) {
    const obj = objects[i];
    if (!obj) continue;
    const records = styleAtomMap.get(obj);
    if (!records) continue;
    for (const { key } of records) {
      if (chosen.has(key) && chosen.get(key).propsIdx === i) {
        // The final adoption of this key is the current argument i
        // Change the output timing depending on whether i is the rightmost (last props)
        if (i === objects.length - 1) {
          rightmostKeys.push({ ...chosen.get(key), key });
        } else {
          orderedKeys.push({ ...chosen.get(key), key });
        }
        chosen.delete(key);
      }
    }
  }

  // Output from key in props order
  for (const { hash, sheet } of orderedKeys) {
    if (!seenSheets.has(sheet)) {
      seenSheets.add(sheet);
      classList.push(hash);
      allStyleSheets.push(sheet);
    }
  }
  // Those that are only used in the rightmost props are output last
  for (const { hash, sheet } of rightmostKeys) {
    if (!seenSheets.has(sheet)) {
      seenSheets.add(sheet);
      classList.push(hash);
      allStyleSheets.push(sheet);
    }
  }

  // Extract only non-duplicate styleSheets
  const uniqueStyleSheets = [...allStyleSheets].filter(
    (sheet) => !injectedStyleSheets.has(sheet),
  );

  // Add the new styleSheets to injectedStyleSheets.
  uniqueStyleSheets.forEach((sheet) => injectedStyleSheets.add(sheet));

  // CSS part compilation by the Processor
  if (typeof globalPromise_1 === 'undefined') initPromise_1();
  resolvePromise_1(uniqueStyleSheets.join(''));

  // CSS injection only in test development environment
  if (isTestingDevelopment && !isServer) {
    for (const { hash, sheet } of [...orderedKeys, ...rightmostKeys]) {
      if (uniqueStyleSheets.includes(sheet)) {
        injectClientCSS(hash, sheet);
      }
    }
  }

  return classList.join(' ');
}
