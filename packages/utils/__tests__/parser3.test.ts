import path from 'node:path';
import { scanAll } from '../src/parser';
import * as fs from 'fs';
import * as rs from '@rust-gear/glob';

jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  readFileSync: jest.fn(),
  statSync: jest.fn(),
  existsSync: jest.fn(),
}));

jest.mock('@rust-gear/glob', () => ({
  globSync: jest.fn(),
}));

const mockedFs = fs as jest.Mocked<typeof fs>;
const mockedRs = rs as jest.Mocked<typeof rs>;

describe('parser3 HMR cleanup tests for lines 1259 and 1263', () => {
  test('stripFileContributions delete propTable[propName] (1259) and delete table[compKey] (1263)', () => {
    const childFile = path.resolve(process.cwd(), 'comp/delete-test-child.tsx');
    const parent1 = path.resolve(process.cwd(), 'app/delete-parent1.tsx');
    const parent2 = path.resolve(process.cwd(), 'app/delete-parent2.tsx');

    const childSource =
      'import * as css from "@plumeria/core"; export const Test = ({ styleArr }: any) => <div className={css.use(styleArr)} />;';
    const parentSourceWithStyle = (propKey: string, styleBody: string) =>
      `import * as css from "@plumeria/core"; import { Test } from "../comp/delete-test-child"; const styles = css.create({ ${propKey}: ${styleBody} }); export const P = () => <Test styleArr={styles.${propKey}} />;`;
    const parentSourceWithoutStyle = `import * as css from "@plumeria/core"; const styles = css.create({ dummy: { color: "black" } }); export const P = () => <div />;`;

    const setup = (
      contents: Record<string, string>,
      mtimes: Record<string, number>,
    ) => {
      mockedRs.globSync.mockReturnValue([childFile, parent1, parent2] as any);
      mockedFs.statSync.mockImplementation(
        (p: any) =>
          ({
            mtimeMs: mtimes[path.resolve(p)] ?? 1,
            isDirectory: () => false,
            isFile: () => true,
          }) as any,
      );
      mockedFs.existsSync.mockImplementation((p: any) =>
        [childFile, parent1, parent2].includes(path.resolve(p)),
      );
      mockedFs.readFileSync.mockImplementation(
        (p: any) => contents[path.resolve(p)] || '',
      );
    };

    // 1st scan: parent1 and parent2 both pass styles to Test
    setup(
      {
        [childFile]: childSource,
        [parent1]: parentSourceWithStyle('color', '{ color: "green" }'),
        [parent2]: parentSourceWithStyle('font', '{ fontSize: 50 }'),
      },
      { [childFile]: 1, [parent1]: 1, [parent2]: 1 },
    );

    const first = scanAll();
    const compKey = `${childFile}-Test`;
    expect(first.componentPropsTable![compKey]).toBeDefined();

    // 2nd scan: parent1 stops passing style -> entries filtered > 0 (parent2 remains) -> 1257 line
    setup(
      {
        [childFile]: childSource,
        [parent1]: parentSourceWithoutStyle,
        [parent2]: parentSourceWithStyle('font', '{ fontSize: 50 }'),
      },
      { [childFile]: 1, [parent1]: 2, [parent2]: 1 },
    );
    scanAll();

    // 3rd scan: parent2 also stops passing style -> entries filtered === 0 -> delete propTable['styleArr'] (1259) & delete table[compKey] (1263)
    setup(
      {
        [childFile]: childSource,
        [parent1]: parentSourceWithoutStyle,
        [parent2]: parentSourceWithoutStyle,
      },
      { [childFile]: 1, [parent1]: 2, [parent2]: 2 },
    );

    const third = scanAll();
    expect(third.componentPropsTable![compKey]).toBeUndefined();
  });
});
