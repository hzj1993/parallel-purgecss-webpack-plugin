import { Compilation } from "webpack";

type PathFunction = () => string[];
type ExtractorFunction<T = string> = (content: T) => string[];
type StringRegExpArray = Array<RegExp | string>;
type ComplexSafelist = {
  standard?: StringRegExpArray;
  deep?: RegExp[];
  greedy?: RegExp[];
  variables?: StringRegExpArray;
  keyframes?: StringRegExpArray;
};
type SafelistFunction = () => ComplexSafelist;
type RunHookFunction = (compilation: Compilation, entryPaths: string[]) => Promise<void>

interface Extractors {
  extensions: string[];
  extractor: ExtractorFunction;
}
export interface UserOption {
  paths: string[] | PathFunction;
  defaultExtractor?: ExtractorFunction;
  extractors?: Array<Extractors>;
  fontFace?: boolean;
  keyframes?: boolean;
  moduleExtensions?: string[];
  output?: string;
  rejected?: boolean;
  stdin?: boolean;
  stdout?: boolean;
  variables?: boolean;
  verbose?: boolean;
  safelist?: StringRegExpArray | ComplexSafelist | SafelistFunction;
  blocklist?: StringRegExpArray;
  only?: string[];
  maxWorkers?: number;
}

export interface RunOptions {
  runPluginHook: RunHookFunction;
  compilation: Compilation;
  entryPaths: string[];
}

export interface PurgeAsset {
  asset: {
    source: () => string;
  };
  name: string;
}

export interface File {
  resource?: string;
}

export type Chunk = {
  modulesIterable: File[];
};
