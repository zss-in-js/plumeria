import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

const FIXTURE_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'plumeria-'));
const FIXTURE_PATH = path.join(FIXTURE_DIR, 'fixture.tsx');

jest.mock('@rust-gear/glob', () => ({
  globSync: jest.fn((pattern: string | string[]) =>
    (Array.isArray(pattern) ? pattern : [pattern]).includes('fixture.tsx')
      ? [FIXTURE_PATH]
      : [],
  ),
}));

import { compileCSS } from '../src/index';

const wrap = (body: string) => `
import * as css from '@plumeria/core';

const s = css.create({
  p1: { color: 'green' },
  p2: { color: 'olive' },
  p3: { color: 'teal' },
});

${body}
`;

const compile = (body: string) => {
  fs.writeFileSync(FIXTURE_PATH, wrap(body), 'utf-8');
  return compileCSS({ include: ['fixture.tsx'], exclude: ['**'] });
};

afterAll(() => fs.rmSync(FIXTURE_DIR, { recursive: true, force: true }));

// A bracket key is only known at runtime, so every key of the group stays
// reachable and needs its rules emitted -- being nested under a condition
// narrows nothing.
describe('compiler: a bracket group under a condition', () => {
  it.each([
    ['a ternary branch', `on ? s[k] : s.p3`],
    ['the right of a logical &&', `on && s[k]`],
    ['an array element', `[s.p3, on && s[k]]`],
    ['a nested ternary', `a ? (b ? s[k] : s.p1) : s.p3`],
    ['a group two levels deep', `a ? (b ? (on ? s[k] : s.p2) : s.p1) : s.p3`],
    ['an && nested inside a ternary', `a ? (b && s[k]) : s.p3`],
  ])('emits every key of the group in %s', (_label, expr) => {
    const out = compile(
      `export const A = ({ on, a, b, k }: any) => <div classStyle={${expr}} />;`,
    );
    for (const color of ['green', 'olive', 'teal']) {
      expect(out).toContain(`color: ${color}`);
    }
  });
});
