import { PurgeAsset, Chunk } from "./types";
interface Assets {
    [key: string]: {
        source: () => string;
    };
}
declare function getFormattedFilename(fileName: string): string;
declare function isFileOfTypes(filename: string, extensions: string[]): boolean;
declare function getAssets(assets: Assets | undefined, extensions: string[]): PurgeAsset[];
declare function files(chunk: Chunk, extensions: string[], getter: (file: File) => string | undefined): string[];
declare const _default: {
    files: typeof files;
    getAssets: typeof getAssets;
    isFileOfTypes: typeof isFileOfTypes;
    getFormattedFilename: typeof getFormattedFilename;
};
export default _default;
