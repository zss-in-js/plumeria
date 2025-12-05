import type { Compiler } from 'webpack';
import type { CSSObject } from '@plumeria/utils';
import path from 'path';
import fs from 'fs';

const PLUGIN_NAME = 'PlumeriaPlugin';

export class PlumeriaPlugin {
  private stylesByFile = new Map<string, any>();
  private outFile!: string;

  constructor() {}

  apply(compiler: Compiler) {
    this.outFile = path.resolve(__dirname, '..', 'zero-virtual.css');

    compiler.hooks.invalid.tap(PLUGIN_NAME, (filename) => {
      if (filename) {
        const absPath = path.resolve(filename);
        this.stylesByFile.delete(absPath);
      }
    });

    compiler.hooks.watchRun.tap(PLUGIN_NAME, () => {
      this.stylesByFile.clear();
    });

    compiler.hooks.normalModuleFactory.tap(PLUGIN_NAME, (nmf) => {
      nmf.hooks.createModule.tap(PLUGIN_NAME, (createData) => {
        const modPath =
          createData.matchResource ?? createData.resourceResolveData?.path;

        if (modPath && modPath.includes('zero-virtual.css')) {
          createData.settings ??= {};
          createData.settings.sideEffects = true;
        }
      });
    });
  }

  registerFileStyles(filePath: string, styles: CSSObject) {
    const absPath = path.resolve(filePath);
    const prev = this.stylesByFile.get(absPath) || {
      filePath,
      keyframeStyles: '',
      viewTransitionStyles: '',
      tokenStyles: '',
      baseStyles: '',
    };

    const updatedStyles = {
      ...prev,
      ...styles,
      lastAccessed: Date.now(),
    };

    this.stylesByFile.set(absPath, updatedStyles);
    this.writeCSS();
  }

  private generateOrderedCSS(): string {
    const allStyles = Array.from(this.stylesByFile.values());

    if (allStyles.length === 0) {
      return '';
    }

    const sortedStyles = allStyles.sort(
      (b, a) => (b.lastAccessed || 0) - (a.lastAccessed || 0),
    );

    const keyframeStylesSet = new Set<string>();
    const viewTransitionStylesSet = new Set<string>();
    const tokenStylesSet = new Set<string>();
    const baseStylesSet = new Set<string>();

    for (const s of sortedStyles) {
      if (s.keyframeStyles?.trim().length > 0)
        keyframeStylesSet.add(s.keyframeStyles);
      if (s.viewTransitionStyles?.trim().length > 0)
        viewTransitionStylesSet.add(s.viewTransitionStyles);
      if (s.tokenStyles?.trim().length > 0) tokenStylesSet.add(s.tokenStyles);
      if (s.baseStyles?.trim().length > 0) baseStylesSet.add(s.baseStyles);
    }

    return [
      ...Array.from(keyframeStylesSet),
      ...Array.from(viewTransitionStylesSet),
      ...Array.from(tokenStylesSet),
      ...Array.from(baseStylesSet),
    ]
      .filter(Boolean)
      .join('\n');
  }

  private writeCSS() {
    const css = this.generateOrderedCSS();
    fs.writeFileSync(this.outFile, css, 'utf-8');
  }
}
