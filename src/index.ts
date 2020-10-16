const PurgeCSSPlugin = require("purgecss-webpack-plugin");
const fs = require("fs");
import { job, stop, start } from "microjob";
import { UserOption/*, RunOptions*/ } from "./types";
import { Compiler, Compilation } from "webpack";
import { ConcatSource } from "webpack-sources";
import { defaultOptions } from "purgecss";
import util from "./util"
const styleExtensions = [".css", ".scss", ".styl", ".sass", ".less"];

const pluginName = "ParallelPurgeCSS";

export class ParallelPurgecssWebpackPlugin extends PurgeCSSPlugin {
  constructor(options: UserOption) {
    super(options);
  }
  apply(compiler: Compiler): void {
    compiler.hooks.compilation.tap(pluginName, (compilation: Compilation) => {
      this.initializePlugin(compilation);
    });
    compiler.hooks.done.tap(pluginName, this.onHooksDone.bind(this));
  }
  initializePlugin(compilation: Compilation): void {
    compilation.hooks.additionalAssets.tapPromise(pluginName, () => {
      const entryPaths =
        typeof this.options.paths === "function"
          ? this.options.paths()
          : this.options.paths;

      entryPaths.forEach((p: string) => {
        if (!fs.existsSync(p)) throw new Error(`Path ${p} does not exist.`);
      });

      return this.runPluginHook(compilation, entryPaths);
    });
  }
  async runPluginHook(
    compilation: Compilation,
    entryPaths: string[]
  ): Promise<void> {
    // @ts-ignore
    const assetsFromCompilation = util.getAssets(compilation.assets, [
      ".css",
    ]);

    const { maxWorkers } = this.options

    try {
      // start the worker pool
      if (typeof maxWorkers !== 'undefined') {
        await start({ maxWorkers });
      } else {
        await start();
      }
      

      for (const chunk of compilation.chunks) {
        const { files } = chunk;
        const assetsToPurge = this.getAssetsToPurge(assetsFromCompilation, files);
  
        for (const { name, asset } of assetsToPurge) {
          const filesToSearch = entryPaths
            .concat(
              util.files(
      // @ts-ignore
                chunk,
                this.options.moduleExtensions || [],
      // @ts-ignore
                (file: File) => file.resource
              )
            )
            .filter((v) => !styleExtensions.some((ext) => v.endsWith(ext)));
  
          // Compile through Purgecss and attach to output.
          // This loses sourcemaps should there be any!
          const options = {
            ...defaultOptions,
            ...this.options,
            content: filesToSearch,
            css: [
              {
                raw: asset.source(),
              },
            ],
          };
  
          if (typeof options.safelist === "function") {
            options.safelist = options.safelist();
          }
          // this function will be executed in another thread
          const purgecss = await job(async () => {
            const { PurgeCSS } = require('PurgeCSS')
            return await new PurgeCSS().purge({
              content: options.content,
              css: options.css,
              defaultExtractor: options.defaultExtractor,
              extractors: options.extractors,
              fontFace: options.fontFace,
              keyframes: options.keyframes,
              output: options.output,
              rejected: options.rejected,
              variables: options.variables,
              safelist: options.safelist,
            })
          }, {
            ctx: {
              options
            }
          });
          // const purgecss = await new PurgeCSS().purge({
          //   content: options.content,
          //   css: options.css,
          //   defaultExtractor: options.defaultExtractor,
          //   extractors: options.extractors,
          //   fontFace: options.fontFace,
          //   keyframes: options.keyframes,
          //   output: options.output,
          //   rejected: options.rejected,
          //   variables: options.variables,
          //   safelist: options.safelist,
          // });
          const purged = purgecss[0];
  
          if (purged.rejected) {
            this.purgedStats[name] = purged.rejected;
          }
      // @ts-ignore
          compilation.assets[name] = new ConcatSource(purged.css);
        }
      }


      
  
    } catch (err) {
      console.error(err);
    } finally {
      // shutdown worker pool
      await stop();
    }
    
  }
}
