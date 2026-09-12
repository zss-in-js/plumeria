import { parseArgs } from '../src/cli';

describe('parseArgs', () => {
  let log: jest.SpyInstance;

  beforeEach(() => {
    log = jest.spyOn(console, 'log').mockImplementation(() => undefined);
  });

  afterEach(() => {
    log.mockRestore();
  });

  it('asks nothing and writes nothing on --help', () => {
    expect(parseArgs(['--help'])).toBeNull();
    expect(log).toHaveBeenCalledWith(
      expect.stringContaining('npx @plumeria/init'),
    );
  });

  it('reads the flags that answer a question', () => {
    expect(
      parseArgs(['--physical', '--sizes', '--style-prop', 'sx', '--no-eslint']),
    ).toMatchObject({
      preset: {
        spelling: 'physical',
        sizes: true,
        styleProp: 'sx',
        eslint: false,
      },
    });
  });

  it('reads the bundler it is told to use', () => {
    expect(parseArgs(['--bundler', 'rollup'])?.bundler).toBe('rollup');
  });

  it('refuses a bundler it does not know', () => {
    expect(() => parseArgs(['--bundler', 'parcel'])).toThrow(/unknown bundler/);
  });

  it('refuses --sizes on its own', () => {
    expect(() => parseArgs(['--sizes'])).toThrow(
      /needs --logical or --physical/,
    );
  });

  it('refuses an option it does not know', () => {
    expect(() => parseArgs(['--turbo'])).toThrow(/unknown option/);
  });

  it('refuses a flag whose value is missing', () => {
    expect(() => parseArgs(['--style-prop'])).toThrow(/needs a value/);
  });
});
