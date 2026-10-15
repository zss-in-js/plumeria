import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as vm from 'vm';
import loader, { DEV_BRIDGE_ID, devGenerationsPath } from '../src/index';

/**
 * The script an edited module carries runs in the browser before the module
 * renders. It holds the stylesheet until Turbopack loads the one marked with the
 * same generation, then steps aside so the delivered stylesheet decides alone.
 */

interface FakeNode {
  id: string;
  dataset: Record<string, string>;
  textContent: string;
  remove: () => void;
}

interface FakeSheet {
  ownerNode: { id: string };
  cssRules: Array<{ selectorText?: string }> | null;
}

const createDom = () => {
  const head: FakeNode[] = [];
  const delivered: FakeSheet[] = [];
  const observers = new Set<() => void>();
  const loads = new Set<() => void>();
  const readable = (sheet: FakeSheet) =>
    sheet.cssRules === null
      ? {
          ownerNode: sheet.ownerNode,
          get cssRules(): never {
            throw new Error('SecurityError');
          },
        }
      : sheet;
  const document = {
    get styleSheets() {
      return [
        ...delivered.map(readable),
        ...head.map((node) => ({ ownerNode: node, cssRules: [] })),
      ];
    },
    head: {
      appendChild: (node: FakeNode) => {
        const index = head.indexOf(node);
        if (index >= 0) head.splice(index, 1);
        head.push(node);
        return node;
      },
    },
    getElementById: (id: string) => head.find((node) => node.id === id) ?? null,
    createElement: () => {
      const node: FakeNode = {
        id: '',
        dataset: {},
        textContent: '',
        remove: () => {
          const index = head.indexOf(node);
          if (index >= 0) head.splice(index, 1);
        },
      };
      return node;
    },
    addEventListener: (type: string, listener: () => void) => {
      if (type === 'load') loads.add(listener);
    },
    removeEventListener: (type: string, listener: () => void) => {
      if (type === 'load') loads.delete(listener);
    },
  };
  class MutationObserver {
    constructor(private readonly callback: () => void) {}
    observe() {
      observers.add(this.callback);
    }
    disconnect() {
      observers.delete(this.callback);
    }
  }
  return {
    head,
    observers,
    loads,
    run: (script: string) =>
      vm.runInNewContext(script, { document, MutationObserver }),
    deliver: (generation: string) =>
      delivered.push({
        ownerNode: { id: '' },
        cssRules: [
          { selectorText: '.x1' },
          { selectorText: `[data-plumeria-generation="${generation}"]` },
        ],
      }),
    deliverUnreadable: () =>
      delivered.push({ ownerNode: { id: '' }, cssRules: null }),
    mutate: () => [...observers].forEach((callback) => callback()),
    load: () => [...loads].forEach((callback) => callback()),
  };
};

let projectDir: string;
let previousCwd: string;

const transformClient = (source: string) =>
  new Promise<string>((resolve, reject) => {
    const resourcePath = path.join(projectDir, 'Client.tsx');
    loader
      .call(
        {
          resourcePath,
          context: projectDir,
          rootContext: projectDir,
          getOptions: () => ({}),
          async: () => (err, out) => (err ? reject(err) : resolve(out!)),
          addDependency: () => {},
          clearDependencies: () => {},
        },
        source,
      )
      .catch(reject);
  });

const carried = async (color: string) => {
  const source = `'use client';
import * as css from '@plumeria/core';
const styles = css.create({ box: { color: '${color}' } });
export const Client = () => <div classStyle={styles.box} />;
`;
  fs.writeFileSync(path.join(projectDir, 'Client.tsx'), source);
  await transformClient(`${source}\nexport const before = 0;\n`);
  const out = await transformClient(source);
  const at = out.indexOf('zero-virtual.css";') + 'zero-virtual.css";'.length;
  const match = out.match(
    /\)\(("(?:[^"\\]|\\.)*"), ("[0-9a-f]{16}"), "plumeria-dev-bridge"\);\n$/,
  );
  if (!match) throw new Error('no bridge');
  return {
    script: out.slice(at),
    css: JSON.parse(match[1]) as string,
    id: JSON.parse(match[2]) as string,
  };
};

describe('the carried stylesheet in the browser', () => {
  beforeEach(() => {
    projectDir = fs.realpathSync(
      fs.mkdtempSync(path.join(os.tmpdir(), 'plumeria-dev-bridge-runtime-')),
    );
    previousCwd = process.cwd();
    process.chdir(projectDir);
    jest.replaceProperty(process.env, 'NODE_ENV', 'development');
  });

  afterEach(() => {
    process.chdir(previousCwd);
    fs.rmSync(devGenerationsPath(projectDir), { force: true });
    fs.rmSync(projectDir, { recursive: true, force: true });
    jest.restoreAllMocks();
  });

  it('holds the stylesheet until the delivered one catches up', async () => {
    const { script, css, id } = await carried('#123456');
    const dom = createDom();

    dom.run(script);

    expect(dom.head).toHaveLength(1);
    expect(dom.head[0].id).toBe(DEV_BRIDGE_ID);
    expect(dom.head[0].textContent).toBe(css);
    expect(dom.head[0].dataset.generation).toBe(id);
  });

  it('steps aside once the stylesheet of its generation loads', async () => {
    const { script, id } = await carried('#123456');
    const dom = createDom();
    dom.run(script);

    dom.deliver(id);
    dom.load();

    expect(dom.head).toHaveLength(0);
    expect(dom.observers.size).toBe(0);
    expect(dom.loads.size).toBe(0);
  });

  it('steps aside when the delivered stylesheet shows up through a DOM change', async () => {
    const { script, id } = await carried('#123456');
    const dom = createDom();
    dom.run(script);

    dom.deliver(id);
    dom.mutate();

    expect(dom.head).toHaveLength(0);
  });

  it('stays while only another generation has been delivered', async () => {
    const { script } = await carried('#123456');
    const dom = createDom();
    dom.run(script);

    dom.deliver('0000000000000000');
    dom.load();
    dom.mutate();

    expect(dom.head).toHaveLength(1);
  });

  it('adds nothing when the stylesheet landed before the module ran', async () => {
    const { script, id } = await carried('#123456');
    const dom = createDom();
    dom.deliver(id);

    dom.run(script);

    expect(dom.head).toHaveLength(0);
    expect(dom.observers.size).toBe(0);
  });

  it('removes its own stylesheet when another module of the generation finds it landed', async () => {
    const { script, id } = await carried('#123456');
    const dom = createDom();
    dom.run(script);
    dom.deliver(id);

    dom.run(script);

    expect(dom.head).toHaveLength(0);
  });

  it('lets a later edit take over without the earlier one removing it', async () => {
    const earlier = await carried('#123456');
    const later = await carried('#654321');
    const dom = createDom();
    dom.run(earlier.script);

    dom.run(later.script);
    dom.deliver(earlier.id);
    dom.load();

    expect(dom.head).toHaveLength(1);
    expect(dom.head[0].textContent).toBe(later.css);
    expect(dom.head[0].dataset.generation).toBe(later.id);
    expect(dom.loads.size).toBe(1);

    dom.deliver(later.id);
    dom.load();

    expect(dom.head).toHaveLength(0);
    expect(dom.loads.size).toBe(0);
  });

  it('skips stylesheets it is not allowed to read', async () => {
    const { script, id } = await carried('#123456');
    const dom = createDom();
    dom.deliverUnreadable();

    dom.run(script);
    dom.deliver(id);
    dom.load();

    expect(dom.head).toHaveLength(0);
  });

  it('does nothing outside the browser', async () => {
    const { script } = await carried('#123456');

    expect(() => vm.runInNewContext(script, {})).not.toThrow();
  });
});
