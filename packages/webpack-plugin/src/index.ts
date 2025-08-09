import type { Compiler } from 'webpack';
import { Compilation, sources } from 'webpack';
import VirtualModulesPlugin from 'webpack-virtual-modules';

const PLUGIN_NAME = 'PlumeriaPlugin';

export class PlumeriaPlugin {
  private styles = new Map<string, string>();
  private virtualModules?: VirtualModulesPlugin;

  apply(compiler: Compiler) {
    this.virtualModules = new VirtualModulesPlugin();
    this.virtualModules.apply(compiler);

    compiler.hooks.compile.tap(PLUGIN_NAME, () => {
      this.styles.clear();
    });

    compiler.hooks.thisCompilation.tap(PLUGIN_NAME, (compilation) => {
      compilation.hooks.processAssets.tapPromise(
        {
          name: PLUGIN_NAME,
          stage: Compilation.PROCESS_ASSETS_STAGE_ADDITIONS,
        },
        async () => {
          const fullCss = Array.from(this.styles.values()).join('\n');
          compilation.emitAsset('plumeria.css', new sources.RawSource(fullCss));
        },
      );
    });
  }

  registerStyle(virtualFileName: string, css: string) {
    this.styles.set(virtualFileName, css);
    this.virtualModules?.writeModule(virtualFileName, css);
  }
}
