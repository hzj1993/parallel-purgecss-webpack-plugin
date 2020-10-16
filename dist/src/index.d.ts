declare const PurgeCSSPlugin: any;
import { UserOption } from "./types";
import { Compiler, Compilation } from "webpack";
export declare class ParallelPurgecssWebpackPlugin extends PurgeCSSPlugin {
    constructor(options: UserOption);
    apply(compiler: Compiler): void;
    initializePlugin(compilation: Compilation): void;
    runPluginHook(compilation: Compilation, entryPaths: string[]): Promise<void>;
}
export {};
