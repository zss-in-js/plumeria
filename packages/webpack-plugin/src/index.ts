import type { Compiler } from 'webpack';
import { Compilation, sources } from 'webpack';
import VirtualModulesPlugin from 'webpack-virtual-modules';

const PLUGIN_NAME = 'PlumeriaPlugin';

export class PlumeriaPlugin {
  private stylesByFile = new Map<string, any>();
  private virtualModules?: VirtualModulesPlugin;

  apply(compiler: Compiler) {
    this.virtualModules = new VirtualModulesPlugin();
    this.virtualModules.apply(compiler);

    compiler.hooks.compile.tap(PLUGIN_NAME, () => {
      this.stylesByFile.clear();
    });

    compiler.hooks.thisCompilation.tap(PLUGIN_NAME, (compilation) => {
      compilation.hooks.processAssets.tapPromise(
        {
          name: PLUGIN_NAME,
          stage: Compilation.PROCESS_ASSETS_STAGE_ADDITIONS,
        },
        async () => {
          const css = this.generateOrderedCSS(this.stylesByFile);
          compilation.emitAsset('plumeria.css', new sources.RawSource(css));
        },
      );
    });
  }

  registerStyle(virtualFileName: string, styles: any) {
    this.stylesByFile.set(virtualFileName, styles);
    const css = this.generateOrderedCSS(this.stylesByFile);
    this.virtualModules?.writeModule(virtualFileName, css);
  }

  private generateOrderedCSS(styles: any): string {
    const allStyles = Array.from(styles.values()) as any;
    const globalStyles: string[] = [];
    const keyframeStylesSet = new Set<string>();
    const varStylesSet = new Set<string>();
    const themeStylesSet = new Set<string>();
    const baseStyles: string[] = [];

    for (const s of allStyles) {
      if (s.globalStyles) globalStyles.push(s.globalStyles);
      if (s.keyframeStyles) keyframeStylesSet.add(s.keyframeStyles);
      if (s.varStyles) varStylesSet.add(s.varStyles);
      if (s.themeStyles) themeStylesSet.add(s.themeStyles);
      if (s.baseStyles) baseStyles.push(s.baseStyles);
    }
    return [
      ...globalStyles,
      ...Array.from(keyframeStylesSet),
      ...Array.from(varStylesSet),
      ...Array.from(themeStylesSet),
      ...baseStyles,
    ]
      .filter(Boolean)
      .join('\n');
  }
}
