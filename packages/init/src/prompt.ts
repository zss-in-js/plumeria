import readline from 'node:readline/promises';
import { DEFAULT_ANSWERS, DEFAULT_STYLE_PROP, assertStyleProp } from './setup';
import { style } from './style';
import type { Answers, Spelling } from './setup';

const SPELLINGS: Record<string, Spelling> = {
  '1': 'logical',
  '2': 'physical',
  '3': 'both',
  l: 'logical',
  logical: 'logical',
  p: 'physical',
  physical: 'physical',
  b: 'both',
  both: 'both',
};

export interface Asker {
  question: (prompt: string) => Promise<string>;
  close: () => void;
}

export const terminal = (): Asker => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return {
    question: (prompt) => rl.question(prompt),
    close: () => rl.close(),
  };
};

const confirm = async (
  asker: Asker,
  prompt: string,
  fallback: boolean,
): Promise<boolean> => {
  const answer = (
    await asker.question(
      `${prompt} ${style.faint(fallback ? '(Y/n)' : '(y/N)')} `,
    )
  )
    .trim()
    .toLowerCase();
  if (answer === '') return fallback;
  return answer === 'y' || answer === 'yes';
};

export const ask = async (
  asker: Asker,
  preset: Partial<Answers>,
): Promise<Answers> => {
  const answers: Answers = { ...DEFAULT_ANSWERS, ...preset };

  if (preset.spelling === undefined) {
    const choices: [string, Spelling, string][] = [
      ['1', 'logical', 'marginBlockStart, insetInlineStart'],
      ['2', 'physical', 'marginTop, left'],
      ['3', 'both', 'no policy'],
    ];
    console.log(
      `\nWhich spelling of a two-named property does this project write?`,
    );
    for (const [key, name, hint] of choices) {
      console.log(
        `  ${style.choice(`${key}:`)} ${name.padEnd(9)}${style.faint(hint)}`,
      );
    }
    console.log('');
    for (;;) {
      const answer = (
        await asker.question(`Spelling ${style.faint('(1/2/3) [3]')} `)
      )
        .trim()
        .toLowerCase();
      if (answer === '') break;
      const spelling = SPELLINGS[answer];
      if (spelling) {
        answers.spelling = spelling;
        break;
      }
      console.log(`${style.failure('✖')} answer 1, 2 or 3.`);
    }
  }

  if (answers.spelling !== 'both' && preset.sizes === undefined) {
    answers.sizes = await confirm(
      asker,
      'Reject the size axis too (width/height ↔ inlineSize/blockSize)?',
      false,
    );
  }

  if (preset.expandBorderShorthands === undefined) {
    answers.expandBorderShorthands = await confirm(
      asker,
      'Expand a border shorthand into the three declarations it sets?',
      true,
    );
  }

  if (preset.styleProp === undefined) {
    const answer = (
      await asker.question(
        `Which JSX prop carries styles? ${style.faint(`[${DEFAULT_STYLE_PROP}]`)} `,
      )
    ).trim();
    if (answer !== '') {
      answers.styleProp = assertStyleProp(answer);
    }
  }

  if (preset.eslint === undefined) {
    answers.eslint = await confirm(
      asker,
      'Set up @plumeria/eslint-plugin and the plumerialint build guard?',
      true,
    );
  }

  return answers;
};
