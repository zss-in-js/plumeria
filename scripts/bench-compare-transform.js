const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const ALTERNATIONS = Number(process.env.BENCH_ALTERNATIONS || 6);
if (!Number.isInteger(ALTERNATIONS) || ALTERNATIONS < 2 || ALTERNATIONS % 2) {
  throw new Error('BENCH_ALTERNATIONS must be a positive even integer');
}
const NOISE = 5;
const FLOOR = 0.5;

const ROWS = [
  ['cold', 'transform all components'],
  ['leaf', 'transform a leaf style'],
  ['hub', 'transform the hub'],
  ['component', 'transform a component'],
];

// The harness is always this checkout's. Only the build it measures changes,
// so a pull request that introduces the benchmark can still measure its base.
const run = (dir) =>
  JSON.parse(
    execFileSync(
      process.execPath,
      [path.join(__dirname, 'bench-transform.js'), dir],
      {
        encoding: 'utf-8',
        stdio: ['ignore', 'pipe', 'inherit'],
      },
    ),
  );

const entry = (report, key) =>
  key === 'cold' ? report.cold : report.incremental[key];

const median = (values) => {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return (sorted[middle - 1] + sorted[middle]) / 2;
};

const ms = (value) => `${value.toFixed(value < 10 ? 2 : 1)} ms`;

const delta = (base, head) => {
  const percent = ((head - base) / base) * 100;
  const sign = percent >= 0 ? '+' : '−';
  const body = `${sign}${Math.abs(percent).toFixed(1)}%`;
  const notable = Math.abs(percent) >= NOISE && Math.abs(head - base) >= FLOOR;
  return notable ? `**${body}**` : body;
};

function main() {
  const [baseDir, headDir] = process.argv.slice(2);
  if (!baseDir || !headDir) {
    console.error('usage: bench-compare-transform.js <base-dir> <head-dir>');
    process.exit(2);
  }

  const reports = { base: [], head: [] };
  for (let i = 0; i < ALTERNATIONS; i++) {
    for (const side of i % 2 ? ['head', 'base'] : ['base', 'head']) {
      reports[side].push(run(side === 'base' ? baseDir : headDir));
    }
  }

  const scale = reports.head[0].scale;
  const isDev = reports.head[0].isDev;
  const lines = [];
  let regressed = false;

  for (const [key, label] of ROWS) {
    const base = reports.base.map((report) => entry(report, key));
    const head = reports.head.map((report) => entry(report, key));
    const baseParsed = base[0].parsed;
    const headParsed = head[0].parsed;
    if (
      base.some((one) => one.parsed !== baseParsed) ||
      head.some((one) => one.parsed !== headParsed)
    ) {
      throw new Error(`Inconsistent parse counts for ${key}`);
    }
    if (headParsed > baseParsed) regressed = true;

    const parsed =
      baseParsed === headParsed
        ? `${headParsed}`
        : `**${baseParsed} → ${headParsed}**`;
    const baseMs = median(base.map((one) => one.p25));
    const headMs = median(head.map((one) => one.p25));

    lines.push(
      `| ${label} | ${parsed} | ${ms(baseMs)} | ${ms(headMs)} | ${delta(baseMs, headMs)} |`,
    );
  }

  const total = scale.leaves + scale.components + 1;
  const measuredAt = new Date();
  const formatTime = (date) =>
    date
      .toISOString()
      .replace('T', ' ')
      .replace(/\.\d{3}Z$/, '');
  const measuredAtJst = new Date(measuredAt.getTime() + 9 * 60 * 60 * 1000);
  console.log(`<!-- plumeria-transform-bench -->
### Transform benchmark (${isDev ? 'dev' : 'production'} output)

| Scenario | SWC parse calls | Base | PR | Change |
| --- | ---: | ---: | ---: | ---: |
${lines.join('\n')}

Negative change is faster. **Bold** timing changes exceed both ${NOISE}% and ${FLOOR} ms thresholds; smaller changes may be noise.

<details>
<summary>Measurement details</summary>

- Fixture: ${total} files (${scale.leaves} leaf modules, 1 hub, ${scale.components} components). The hub re-exports ${scale.hubFanIn} leaves.
- Cold transform measures transformSource across all ${scale.components} components with fresh path-keyed caches, including the initial scan. OS file cache and runtime are warm.
- Incremental scenarios edit a leaf style module, the hub, or a consumer component, then transform that module (including scan invalidation). They do not measure a full HMR rebuild of affected consumers. File reads, edits, and restoration are outside the timer.
- SWC parse calls includes repeated parsing of the same file per measurement iteration. An arrow shows base → PR; an increase fails the benchmark.
- ${ALTERNATIONS} base/PR pairs on the same runner, reversing order each pair. Times summarize each run's lower quartile using the median; change is (PR / Base − 1) × 100, calculated before rounding.
- NODE_ENV is development in both output modes so scan invalidation remains enabled. This measures transformSource, not a full bundler build.
- Shared-runner noise remains. Compare base and PR within this report; absolute times across runs are not directly comparable.

</details>

Measured at: ${formatTime(measuredAtJst)} JST (${formatTime(measuredAt)} UTC)`);

  if (process.env.GITHUB_OUTPUT) {
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `regressed=${regressed}\n`);
  }
}

main();
