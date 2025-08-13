import type { Compiler } from 'webpack';
import path from 'path';
import fs from 'fs';

const PLUGIN_NAME = 'PlumeriaPlugin';
export class PlumeriaPlugin {
  private stylesByFile = new Map<string, any>();
  private outFile!: string;

  constructor(private outputFileName = 'zero-virtual.css') {}

  apply(compiler: Compiler) {
    this.outFile = path.resolve(__dirname, '..', this.outputFileName);

    compiler.hooks.compile.tap(PLUGIN_NAME, () => {
      this.stylesByFile.clear();
    });

    compiler.hooks.normalModuleFactory.tap(PLUGIN_NAME, (nmf) => {
      nmf.hooks.createModule.tap(PLUGIN_NAME, (createData) => {
        const modPath =
          createData.matchResource ?? createData.resourceResolveData?.path;

        if (modPath && modPath.includes('zero-virtual.css')) {
          createData.settings ??= {};
          createData.settings.sideEffects = true; // Now webpack won't tree-shake
        }
      });
    });
  }

  registerFileStyles(filePath: string, styles: Partial<any>) {
    const prev = this.stylesByFile.get(filePath) || {
      filePath,
      globalStyles: '',
      keyframeStyles: '',
      varStyles: '',
      themeStyles: '',
      baseStyles: '',
    };
    this.stylesByFile.set(filePath, { ...prev, ...styles });
    this.writeCSS();
  }

  private generateOrderedCSS(): string {
    const allStyles = Array.from(this.stylesByFile.values());

    const globalStylesSet = new Set<string>();
    const keyframeStylesSet = new Set<string>();
    const varStylesSet = new Set<string>();
    const themeStylesSet = new Set<string>();
    const baseStylesSet = new Set<string>();

    for (const s of allStyles) {
      if (s.globalStyles) globalStylesSet.add(s.globalStyles);
      if (s.keyframeStyles) keyframeStylesSet.add(s.keyframeStyles);
      if (s.varStyles) varStylesSet.add(s.varStyles);
      if (s.themeStyles) themeStylesSet.add(s.themeStyles);
      if (s.baseStyles) baseStylesSet.add(s.baseStyles);
    }

    return [
      ...Array.from(globalStylesSet),
      ...Array.from(keyframeStylesSet),
      ...Array.from(varStylesSet),
      ...Array.from(themeStylesSet),
      ...Array.from(baseStylesSet),
    ]
      .filter(Boolean)
      .join('\n');
  }

  private writeCSS() {
    const css = this.generateOrderedCSS();
    if (css.trim().length > 0) {
      fs.mkdirSync(path.dirname(this.outFile), { recursive: true });
      fs.writeFileSync(this.outFile, css, 'utf-8');
    }
  }
}
