import readline from 'node:readline/promises';
import { ask, terminal } from '../src/prompt';
import { DEFAULT_ANSWERS } from '../src/setup';
import type { Asker } from '../src/prompt';

jest.mock('node:readline/promises', () => ({
  __esModule: true,
  default: { createInterface: jest.fn() },
}));

const mockedCreateInterface = jest.mocked(readline.createInterface);

const scripted = (replies: string[]): Asker & { asked: string[] } => {
  const asked: string[] = [];
  return {
    asked,
    question: (prompt: string) => {
      asked.push(prompt);
      return Promise.resolve(replies.shift() ?? '');
    },
    close: () => undefined,
  };
};

describe('ask', () => {
  let log: jest.SpyInstance;

  beforeEach(() => {
    log = jest.spyOn(console, 'log').mockImplementation(() => undefined);
  });

  afterEach(() => {
    log.mockRestore();
  });

  it('takes every default on an empty answer', async () => {
    const asker = scripted([]);
    await expect(ask(asker, {})).resolves.toEqual(DEFAULT_ANSWERS);
  });

  it('skips the size question when both spellings are allowed', async () => {
    const asker = scripted(['3']);
    await ask(asker, {});
    expect(asker.asked.some((prompt) => prompt.includes('size axis'))).toBe(
      false,
    );
  });

  it('asks about the size axis once a spelling is chosen', async () => {
    const asker = scripted(['logical', 'y', 'y', '', 'y']);
    await expect(ask(asker, {})).resolves.toMatchObject({
      spelling: 'logical',
      sizes: true,
      expandBorderShorthands: true,
      styleProp: 'classStyle',
      eslint: true,
    });
  });

  it.each([
    ['1', 'logical'],
    ['2', 'physical'],
    ['3', 'both'],
    ['p', 'physical'],
    ['both', 'both'],
  ])('reads %s as %s', async (reply, expected) => {
    const answers = await ask(scripted([reply, 'n']), {});
    expect(answers.spelling).toBe(expected);
  });

  it('asks again on an answer it cannot read', async () => {
    const asker = scripted(['maybe', '2', 'n']);
    const answers = await ask(asker, {});
    expect(answers.spelling).toBe('physical');
    expect(
      asker.asked.filter((prompt) => prompt.startsWith('Spelling')),
    ).toHaveLength(2);
  });

  it('leaves out every question the flags already answered', async () => {
    const asker = scripted([]);
    const answers = await ask(asker, {
      spelling: 'physical',
      sizes: false,
      styleProp: 'sx',
      expandBorderShorthands: false,
      eslint: false,
    });
    expect(asker.asked).toEqual([]);
    expect(answers).toMatchObject({
      spelling: 'physical',
      styleProp: 'sx',
      eslint: false,
    });
  });

  it('takes a renamed styling prop', async () => {
    const answers = await ask(scripted(['3', 'n', 'sx', 'n']), {});
    expect(answers.styleProp).toBe('sx');
  });

  it('refuses a styling prop that is not an identifier', async () => {
    await expect(ask(scripted(['3', 'n', 'class-style']), {})).rejects.toThrow(
      /not a valid identifier/,
    );
  });

  it('turns ESLint off when told to', async () => {
    const answers = await ask(scripted(['3', 'n', '', 'n']), {});
    expect(answers.eslint).toBe(false);
  });
});

describe('terminal', () => {
  it('delegates questions and closing to readline', async () => {
    const question = jest.fn().mockResolvedValue('yes');
    const close = jest.fn();
    mockedCreateInterface.mockReturnValue({ question, close } as never);

    const asker = terminal();

    expect(mockedCreateInterface).toHaveBeenCalledWith({
      input: process.stdin,
      output: process.stdout,
    });
    await expect(asker.question('Apply? ')).resolves.toBe('yes');
    expect(question).toHaveBeenCalledWith('Apply? ');
    asker.close();
    expect(close).toHaveBeenCalled();
  });
});
