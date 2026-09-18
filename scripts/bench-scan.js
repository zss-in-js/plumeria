const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const LEAVES = 400;
const HUB_FANIN = 200;
const COMPONENTS = 200;
const SAMPLES = Number(process.env.BENCH_SAMPLES || 60);
const WARMUP = Number(process.env.BENCH_WARMUP || 10);
const COLD_SAMPLES = Number(process.env.BENCH_COLD_SAMPLES || 24);
for (const value of [SAMPLES, WARMUP, COLD_SAMPLES]) {
  if (!Number.isInteger(value) || value < 1)
    throw new Error('Sample counts must be positive integers');
}

const leafName = (i) => `styles/leaf-${String(i).padStart(3, '0')}.ts`;
const componentName = (i) =>
  `components/comp-${String(i).padStart(3, '0')}.tsx`;

const leaf = (i) => `import { css } from '@plumeria/core';

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

const component = (i) => `import { css } from '@plumeria/core';
import { leaf${i % HUB_FANIN} } from '../styles/hub';

export const styles = css.create({
  root: { display: 'flex', gap: '${i % 16}px' },
});

export const Comp${i} = () => (
  <div className={css.props(styles.root, leaf${i % HUB_FANIN}.box)} />
);
`;

function fixture() {
  const root = fs.realpathSync(
    fs.mkdtempSync(path.join(os.tmpdir(), 'plumeria-bench-')),
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

const swc = require(
  require.resolve('@swc/core', {
    paths: [path.join(target, 'packages/utils')],
  }),
);

function parses(fn) {
  const parseSync = swc.parseSync;
  let seen = 0;
  swc.parseSync = (...args) => {
    seen++;
    return parseSync(...args);
  };
  try {
    fn();
  } finally {
    swc.parseSync = parseSync;
  }
  return seen;
}

// Timed without the counting wrapper in place, so nothing but the scan is on
// the clock.
function time(fn) {
  const start = performance.now();
  fn();
  return performance.now() - start;
}

const quantile = (values, q) => {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * q))];
};

// Keep the minimum for diagnostics; comparisons use the lower quartile.
const summary = (values, parsed) => ({
  ms: Math.min(...values),
  p25: quantile(values, 0.25),
  median: quantile(values, 0.5),
  samples: values.length,
  parsed,
});

function main() {
  const { scanAll } = require(
    path.join(target, 'packages/utils/dist/parser.js'),
  );

  const cold = [];
  let coldParsed = 0;
  let uncached = fixture();
  for (let i = 0; i < COLD_SAMPLES + WARMUP + 1; i++) {
    // The scan keys its cache by file path, so renaming the directory makes
    // every file in it uncached again — the same fixture, none of the cost of
    // writing it out once per sample.
    const renamed = `${uncached}-${i}`;
    fs.renameSync(uncached, renamed);
    uncached = renamed;
    process.chdir(uncached);
    if (i === 0) coldParsed = parses(() => scanAll(uncached));
    else {
      const elapsed = time(() => scanAll(uncached));
      if (i > WARMUP) cold.push(elapsed);
    }
  }
  process.chdir(__dirname);
  fs.rmSync(uncached, { recursive: true, force: true });

  const root = fixture();
  process.chdir(root);
  scanAll(root);

  let stamp = Math.floor(Date.now() / 1000);
  const edit = (relative, measure) => {
    const file = path.join(root, relative);
    const source = fs.readFileSync(file, 'utf8');
    fs.writeFileSync(
      file,
      `${source}\nexport const benchmarkBump = 1;\n`,
      'utf8',
    );
    fs.utimesSync(file, ++stamp, stamp);
    const result = measure(() => scanAll(root));
    fs.writeFileSync(file, source, 'utf8');
    fs.utimesSync(file, ++stamp, stamp);
    scanAll(root);
    return result;
  };

  const incremental = {};
  for (const [label, relative] of [
    ['leaf', leafName(LEAVES - 1)],
    ['hub', 'styles/hub.ts'],
    ['component', componentName(0)],
  ]) {
    const parsed = edit(relative, parses);
    for (let i = 0; i < WARMUP; i++) edit(relative, time);
    const values = [];
    for (let i = 0; i < SAMPLES; i++) values.push(edit(relative, time));
    incremental[label] = summary(values, parsed);
  }

  process.chdir(__dirname);
  fs.rmSync(root, { recursive: true, force: true });

  console.log(
    JSON.stringify(
      {
        scale: { leaves: LEAVES, components: COMPONENTS, hubFanIn: HUB_FANIN },
        cold: summary(cold, coldParsed),
        incremental,
      },
      null,
      2,
    ),
  );
}

main();
