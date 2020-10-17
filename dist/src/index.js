"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ParallelPurgecssWebpackPlugin = void 0;
const PurgeCSSPlugin = require("purgecss-webpack-plugin");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { fork } = require("child_process");
const chalk = require("chalk");
// const { PurgeCSS } = require("PurgeCSS");
const microjob_1 = require("microjob");
const webpack_sources_1 = require("webpack-sources");
const purgecss_1 = require("purgecss");
const util_1 = __importDefault(require("./util"));
const styleExtensions = [".css", ".scss", ".styl", ".sass", ".less"];
const pluginName = "ParallelPurgeCSS";
const WORKER_PATH = path.resolve(__dirname, "./worker.js");
let currentTaskIndex = -1;
let finishTaskNumber = 0;
function calculateNumberOfWorkers() {
    // There are situations when this call will return undefined so
    // we are fallback here to 1.
    // More info on: https://github.com/nodejs/node/issues/19022
    const cpus = os.cpus() || { length: 1 };
    return Math.max(1, cpus.length - 1);
}
class ParallelPurgecssWebpackPlugin extends PurgeCSSPlugin {
    constructor(options) {
        super(options);
        this.workers = [];
        this.taskList = [];
        this.options.maxWorkers =
            this.options.maxWorkers || calculateNumberOfWorkers();
    }
    apply(compiler) {
        compiler.hooks.compilation.tap(pluginName, (compilation) => {
            this.initializePlugin(compilation);
        });
        compiler.hooks.done.tap(pluginName, this.onHooksDone.bind(this));
    }
    initializePlugin(compilation) {
        compilation.hooks.additionalAssets.tapPromise(pluginName, async () => {
            const entryPaths = typeof this.options.paths === "function"
                ? this.options.paths()
                : this.options.paths;
            entryPaths.forEach((p) => {
                if (!fs.existsSync(p))
                    throw new Error(`Path ${p} does not exist.`);
            });
            return await this.parallelRunPluginHook(compilation, entryPaths);
        });
    }
    async runPluginHook(compilation, entryPaths) {
        let startTime = Date.now();
        // @ts-ignore
        const assetsFromCompilation = util_1.default.getAssets(compilation.assets, [".css"]);
        console.log(`getAssets耗时：${Date.now() - startTime} ms`);
        const { maxWorkers } = this.options;
        try {
            // start the worker pool
            if (typeof maxWorkers !== "undefined") {
                await microjob_1.start({ maxWorkers });
            }
            else {
                await microjob_1.start();
            }
            for (const chunk of compilation.chunks) {
                const { files } = chunk;
                startTime = Date.now();
                const assetsToPurge = this.getAssetsToPurge(assetsFromCompilation, files);
                console.log(`getAssetsToPurge耗时：${Date.now() - startTime} ms`);
                console.log(`assetsToPurge：`, assetsToPurge);
                for (const { name, asset } of assetsToPurge) {
                    const filesToSearch = entryPaths
                        .concat(util_1.default.files(
                    // @ts-ignore
                    chunk, this.options.moduleExtensions || [], 
                    // @ts-ignore
                    (file) => file.resource))
                        .filter((v) => !styleExtensions.some((ext) => v.endsWith(ext)));
                    console.log("filesToSearch: ", filesToSearch);
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
                        const { PurgeCSS } = require("PurgeCSS");
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
                            options,
                        },
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
    async parallelRunPluginHook(compilation, entryPaths) {
        let taskList = this.getPurgeTasks(compilation, entryPaths);
        // @ts-ignore
        return await this.purge(compilation, taskList);
    }
    purge(compilation, taskList) {
        console.log(taskList);
        const workerPool = this;
        return new Promise((resolve, reject) => {
            if (taskList.length) {
                let { maxWorkers } = this.options;
                let numberOfWorker = taskList.length >= maxWorkers ? maxWorkers : taskList.length;
                console.log(chalk.green(`[ParallelPurgeCSS] start ${numberOfWorker} workers.`));
                for (let i = 0; i < numberOfWorker; i++) {
                    let worker = fork(WORKER_PATH);
                    this.workers.push(worker);
                    // @ts-ignore
                    worker.on("message", function ({ purged, name }) {
                        // @ts-ignore
                        const worker = this;
                        if (purged.rejected) {
                            workerPool.purgedStats[name] = purged.rejected;
                        }
                        finishTaskNumber++;
                        // @ts-ignore
                        compilation.assets[name] = new webpack_sources_1.ConcatSource(purged.css);
                        const task = workerPool.getTask();
                        if (task) {
                            worker.send({
                                type: "purge",
                                ...task,
                            });
                        }
                        else {
                            workerPool.done(() => {
                                resolve();
                            });
                        }
                    });
                    const task = this.getTask();
                    if (task) {
                        worker.send({
                            type: "purge",
                            ...task,
                        });
                    }
                    else {
                        this.done(() => {
                            resolve();
                        });
                    }
                }
            }
            else {
                resolve();
            }
        });
    }
    getPurgeTasks(compilation, entryPaths) {
        let taskList = [];
        // @ts-ignore
        const assetsFromCompilation = util_1.default.getAssets(compilation.assets, [".css"]);
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
                taskList.push({
                    options,
                    name,
                });
            }
        }
        this.taskList = taskList;
        return taskList;
    }
    getTask() {
        if (finishTaskNumber < this.taskList.length) {
            return this.taskList[++currentTaskIndex];
        }
        return null;
    }
    done(callback) {
        setTimeout(() => {
            for (const worker of this.workers)
                worker.send({
                    type: "exit",
                });
            callback();
        });
    }
}
exports.ParallelPurgecssWebpackPlugin = ParallelPurgecssWebpackPlugin;
