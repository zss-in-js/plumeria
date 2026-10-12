const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { loadTarget } = require('./bench-target');

const LEAVES = 400;
const HUB_FANIN = 200;
const COMPONENTS = 200;
const SAMPLES = Number(process.env.BENCH_SAMPLES || 30);
const WARMUP = Number(process.env.BENCH_WARMUP || 10);
const COLD_SAMPLES = Number(process.env.BENCH_COLD_SAMPLES || 12);
// Keep edit invalidation enabled regardless of the invoking shell's NODE_ENV.
process.env.NODE_ENV = 'development';

for (const value of [SAMPLES, WARMUP, COLD_SAMPLES]) {
  if (!Number.isInteger(value) || value < 1)
    throw new Error('Sample counts must be positive integers');
}

const leafName = (i) => `styles/leaf-${String(i).padStart(3, '0')}.ts`;
const componentName = (i) =>
  `components/comp-${String(i).padStart(3, '0')}.tsx`;

const leaf = (i) => `import * as css from '@plumeria/core';

export const leaf${i} = css.create({
  box: {
    color: 'rgb(${i % 256}, 0, 0)',
    paddingTop: '${i % 32}px',
  },
});
`;

const hub = () =>
  Array.from(
    { length: HUB_FANIN },
    (_, i) => `export { leaf${i} } from '../${leafName(i)}';`,
  ).join('\n') + '\n';

const component = (i) => `import * as css from '@plumeria/core';
import { leaf${i % HUB_FANIN} } from '../styles/hub';

export const styles = css.create({
  root: { display: 'flex', gap: '${i % 16}px' },
});

export const Comp${i} = () => (
  <div classStyle={[styles.root, leaf${i % HUB_FANIN}.box]} />
);
`;

function fixture() {
  const root = fs.realpathSync(
    fs.mkdtempSync(path.join(os.tmpdir(), 'plumeria-bench-compile-')),
  );
  fs.mkdirSync(path.join(root, 'styles'), { recursive: true });
  fs.mkdirSync(path.join(root, 'components'), { recursive: true });

  for (let i = 0; i < LEAVES; i++) {
    fs.writeFileSync(path.join(root, leafName(i)), leaf(i), 'utf8');
  }
  fs.writeFileSync(path.join(root, 'styles/hub.ts'), hub(), 'utf8');
  for (let i = 0; i < COMPONENTS; i++) {
    fs.writeFileSync(path.join(root, componentName(i)), component(i), 'utf8');
  }
  return root;
}

const target = path.resolve(process.argv[2] || path.join(__dirname, '..'));

const { implementation, scanAll, compileCSS, countParses } = loadTarget(target);

async function parses(fn) {
  if (countParses) return countParses(fn);
  await fn();
  return null;
}

async function time(fn) {
  const start = performance.now();
  await fn();
  return performance.now() - start;
}

const quantile = (values, q) => {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * q))];
};

const summary = (values, parsed) => ({
  ms: Math.min(...values),
  p25: quantile(values, 0.25),
  median: quantile(values, 0.5),
  samples: values.length,
  parsed,
});

const compile = (root) => () =>
  compileCSS({
    include: ['**/*.{ts,tsx}'],
    exclude: [],
    cwd: root,
  });

async function main() {
  let root = fixture();
  const prevCwd = process.cwd();

  try {
    const cold = [];
    let coldParsed = 0;
    for (let i = 0; i < COLD_SAMPLES + WARMUP + 1; i++) {
      // Match scan-bench: fresh path-keyed caches, warm OS cache and runtime.
      const renamed = `${root}-${i}`;
      fs.renameSync(root, renamed);
      root = renamed;
      process.chdir(root);
      const run = compile(root);
      if (i === 0) coldParsed = await parses(run);
      else {
        const elapsed = await time(run);
        if (i > WARMUP) cold.push(elapsed);
      }
    }

    let stamp = Math.floor(Date.now() / 1000);
    const edit = async (relative, measure) => {
      const file = path.join(root, relative);
      const source = fs.readFileSync(file, 'utf8');
      fs.writeFileSync(file, `${source}\nexport const benchmarkBump = 1;\n`);
      fs.utimesSync(file, ++stamp, stamp);
      try {
        return await measure(compile(root));
      } finally {
        fs.writeFileSync(file, source);
        fs.utimesSync(file, ++stamp, stamp);
        scanAll(root);
      }
    };

    const incremental = {};
    const unchanged = [];
    for (let i = 0; i < WARMUP; i++) await time(compile(root));
    for (let i = 0; i < SAMPLES; i++) unchanged.push(await time(compile(root)));
    incremental.unchanged = summary(unchanged, await parses(compile(root)));
    for (const [label, relative] of [
      ['leaf', leafName(LEAVES - 1)],
      ['hub', 'styles/hub.ts'],
      ['component', componentName(0)],
    ]) {
      const parsed = await edit(relative, parses);
      for (let i = 0; i < WARMUP; i++) await edit(relative, time);
      const values = [];
      for (let i = 0; i < SAMPLES; i++) {
        values.push(await edit(relative, time));
      }
      incremental[label] = summary(values, parsed);
    }

    // Check real compilation outside the measurement window.
    const css = await compile(root)();
    if (!css.includes('display: flex') || !css.includes('padding-top')) {
      throw new Error('Fixture project was not compiled to CSS');
    }

    console.log(
      JSON.stringify(
        {
          implementation,
          scale: {
            leaves: LEAVES,
            components: COMPONENTS,
            hubFanIn: HUB_FANIN,
          },
          cold: summary(cold, coldParsed),
          incremental,
        },
        null,
        2,
      ),
    );
  } finally {
    process.chdir(prevCwd);
    fs.rmSync(root, { recursive: true, force: true });
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
