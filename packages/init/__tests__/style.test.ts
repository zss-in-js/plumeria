import { Writable } from 'node:stream';
import { paint, style } from '../src/style';

const sink = (): NodeJS.WritableStream =>
  new Writable({
    write(_chunk, _encoding, done) {
      done();
    },
  }) as unknown as NodeJS.WritableStream;

const unlessColorIsForced =
  process.env.FORCE_COLOR === undefined ? it : it.skip;

describe('paint', () => {
  unlessColorIsForced('adds nothing when the target is not a terminal', () => {
    expect(paint(sink(), 'green', 'plumeria.d.ts')).toBe('plumeria.d.ts');
    expect(paint(sink(), ['bold', 'cyan'], '1:')).toBe('1:');
  });

  unlessColorIsForced('never drops the text it is given', () => {
    expect(paint(sink(), 'red', '')).toBe('');
    expect(paint(sink(), 'dim', 'a\nb')).toBe('a\nb');
  });

  it('styles text when the target supports colors', () => {
    const stream = Object.assign(sink(), {
      isTTY: true,
      getColorDepth: () => 24,
    });
    const painted = paint(stream, 'green', 'ready');
    expect(painted).toContain('ready');
    expect(painted).not.toBe('ready');
  });
});

describe('style', () => {
  it('carries the text through every role', () => {
    for (const [role, apply] of Object.entries(style)) {
      expect(apply(`text for ${role}`)).toContain(`text for ${role}`);
    }
  });

  it('names a role for every mark the plan prints', () => {
    for (const role of [
      'install',
      'write',
      'patch',
      'manual',
      'skip',
    ] as const) {
      expect(typeof style[role]).toBe('function');
    }
  });
});
