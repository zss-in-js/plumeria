import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const output = path.join(
  import.meta.dirname,
  '..',
  'src',
  'util',
  'cssPropertyData.ts',
);

type Support = { prefix?: string; alternative_name?: string } | null;
type Feature = {
  __compat?: { support: Record<string, Support | Support[]> };
  [key: string]: unknown;
};

const kept = [
  '-apple-pay-button-style',
  '-apple-pay-button-type',
  '-ms-flex-align',
  '-ms-flex-item-align',
  '-ms-flex-line-pack',
  '-ms-flex-negative',
  '-ms-flex-order',
  '-ms-flex-pack',
  '-ms-flex-preferred-size',
  '-ms-flex-flow',
  '-ms-flex-wrap',
  '-ms-grid-column',
  '-ms-grid-column-align',
  '-ms-grid-column-span',
  '-ms-grid-row',
  '-ms-grid-row-align',
  '-ms-grid-row-span',
  '-ms-text-size-adjust',
];

const names = new Set<string>(kept);

if (fs.existsSync(output)) {
  for (const match of fs
    .readFileSync(output, 'utf8')
    .matchAll(/^  '(.+)',$/gm)) {
    names.add(match[1]);
  }
}

const mdnProperties = require('mdn-data/css/properties.json') as Record<
  string,
  unknown
>;
for (const name of Object.keys(mdnProperties)) names.add(name);

const collect = (name: string, feature: Feature) => {
  for (const support of Object.values(feature.__compat?.support ?? {})) {
    for (const entry of [support].flat()) {
      if (entry?.prefix) names.add(entry.prefix + name);
      if (entry?.alternative_name) names.add(entry.alternative_name);
    }
  }
  for (const [key, value] of Object.entries(feature)) {
    if (key !== '__compat' && value && typeof value === 'object') {
      collect(name, value as Feature);
    }
  }
};

const bcd = require('@mdn/browser-compat-data') as {
  css: { properties: Record<string, Feature> };
};
for (const [name, feature] of Object.entries(bcd.css.properties)) {
  if (name !== 'custom-property') names.add(name);
  collect(name, feature);
}

const sorted = [...names].filter((name) => /^-?[a-z][a-z0-9-]*$/.test(name));
sorted.sort();

fs.writeFileSync(
  output,
  `const cssPropertyData = [\n${sorted.map((name) => `  '${name}',`).join('\n')}\n];\n\nexport { cssPropertyData };\n`,
);

console.log(`${sorted.length} properties written to ${output}`);
