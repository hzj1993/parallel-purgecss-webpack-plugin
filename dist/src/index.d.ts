declare const PurgeCSSPlugin: any;
import { UserOption } from "./types";
import { Compiler, Compilation } from "webpack";
export declare class ParallelPurgecssWebpackPlugin extends PurgeCSSPlugin {
    constructor(options: UserOption);
    apply(compiler: Compiler): void;
    initializePlugin(compilation: Compilation): void;
    runPluginHook(compilation: Compilation, entryPaths: string[]): Promise<void>;
    parallelRunPluginHook(compilation: Compilation, entryPaths: string[]): Promise<void>;
    purge(compilation: Compilation, taskList: any[]): Promise<unknown>;
    getPurgeTasks(compilation: Compilation, entryPaths: string[]): {
        options: any;
        name: any;
    }[];
    getTask(): any;
    done(callback: () => void): void;
}
export {};
