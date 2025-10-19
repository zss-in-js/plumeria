import type { Compiler } from 'webpack';
import { CSSObject } from './types';
import path from 'path';
import fs from 'fs';

const PLUGIN_NAME = 'PlumeriaPlugin';

interface PlumeriaPluginOptions {
  entryPaths: string;
}

export class PlumeriaPlugin {
  private stylesByFile = new Map<string, any>();
  private currentPageFiles = new Set<string>();
  private outFile!: string;
  private options: PlumeriaPluginOptions;

  constructor(options: PlumeriaPluginOptions) {
    this.options = options;
  }

  apply(compiler: Compiler) {
    this.outFile = path.resolve(__dirname, '..', 'zero-virtual.css');

    compiler.hooks.invalid.tap(PLUGIN_NAME, (filename) => {
      if (filename) {
        const absPath = path.resolve(filename);
        this.stylesByFile.delete(absPath);
        this.currentPageFiles.delete(absPath);
      }
    });

    compiler.hooks.watchRun.tap(PLUGIN_NAME, (compiler) => {
      this.updateCurrentPageFiles(compiler);
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

  private updateCurrentPageFiles(compiler: any) {
    this.stylesByFile.clear();
    const entries = compiler.options.entry;
    if (entries && typeof entries === 'object') {
      this.currentPageFiles.clear();
      Object.keys(entries).forEach((entryName) => {
        if (entryName.startsWith(this.options.entryPaths)) {
          const entry = entries[entryName];
          if (Array.isArray(entry)) {
            entry.forEach((file) => {
              this.currentPageFiles.add(path.resolve(file));
            });
          } else if (typeof entry === 'string') {
            this.currentPageFiles.add(path.resolve(entry));
          }
        }
      });
    }
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

    const isCurrentPage = this.isCurrentPageFile(absPath);
    const updatedStyles = {
      ...prev,
      ...styles,
      isCurrentPage,
      lastAccessed: Date.now(),
    };

    this.stylesByFile.set(absPath, updatedStyles);
    this.writeCSS();
  }

  private isCurrentPageFile(filePath: string): boolean {
    return (
      this.currentPageFiles.has(filePath) ||
      Array.from(this.currentPageFiles).some((pageFile) =>
        filePath.includes(path.dirname(pageFile)),
      )
    );
  }

  private generateOrderedCSS(): string {
    const allStyles = Array.from(this.stylesByFile.values());

    if (allStyles.length === 0) {
      return '';
    }

    const sortedStyles = allStyles.sort(
      (a, b) => (b.lastAccessed || 0) - (a.lastAccessed || 0),
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
