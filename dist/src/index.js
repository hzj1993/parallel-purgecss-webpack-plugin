"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ParallelPurgecssWebpackPlugin = void 0;
const PurgeCSSPlugin = require("purgecss-webpack-plugin");
const fs = require("fs");
const microjob_1 = require("microjob");
const webpack_sources_1 = require("webpack-sources");
const purgecss_1 = require("purgecss");
const util_1 = __importDefault(require("./util"));
const styleExtensions = [".css", ".scss", ".styl", ".sass", ".less"];
const pluginName = "ParallelPurgeCSS";
class ParallelPurgecssWebpackPlugin extends PurgeCSSPlugin {
    constructor(options) {
        super(options);
    }
    apply(compiler) {
        compiler.hooks.compilation.tap(pluginName, (compilation) => {
            this.initializePlugin(compilation);
        });
        compiler.hooks.done.tap(pluginName, this.onHooksDone.bind(this));
    }
    initializePlugin(compilation) {
        compilation.hooks.additionalAssets.tapPromise(pluginName, () => {
            const entryPaths = typeof this.options.paths === "function"
                ? this.options.paths()
                : this.options.paths;
            entryPaths.forEach((p) => {
                if (!fs.existsSync(p))
                    throw new Error(`Path ${p} does not exist.`);
            });
            return this.runPluginHook(compilation, entryPaths);
        });
    }
    async runPluginHook(compilation, entryPaths) {
        // @ts-ignore
        const assetsFromCompilation = util_1.default.getAssets(compilation.assets, [
            ".css",
        ]);
        const { maxWorkers } = this.options;
        try {
            // start the worker pool
            if (typeof maxWorkers !== 'undefined') {
                await microjob_1.start({ maxWorkers });
            }
            else {
                await microjob_1.start();
            }
            for (const chunk of compilation.chunks) {
                const { files } = chunk;
                const assetsToPurge = this.getAssetsToPurge(assetsFromCompilation, files);
                for (const { name, asset } of assetsToPurge) {
                    const filesToSearch = entryPaths
                        .concat(util_1.default.files(
                    // @ts-ignore
                    chunk, this.options.moduleExtensions || [], 
                    // @ts-ignore
                    (file) => file.resource))
                        .filter((v) => !styleExtensions.some((ext) => v.endsWith(ext)));
                    // Compile through Purgecss and attach to output.
                    // This loses sourcemaps should there be any!
                    const options = {
                        ...purgecss_1.defaultOptions,
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
                    const purgecss = await microjob_1.job(async () => {
                        const { PurgeCSS } = require('PurgeCSS');
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
                        });
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
                    compilation.assets[name] = new webpack_sources_1.ConcatSource(purged.css);
                }
            }
        }
        catch (err) {
            console.error(err);
        }
        finally {
            // shutdown worker pool
            await microjob_1.stop();
        }
    }
}
exports.ParallelPurgecssWebpackPlugin = ParallelPurgecssWebpackPlugin;
