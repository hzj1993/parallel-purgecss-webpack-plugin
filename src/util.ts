let path = require('path')
import { PurgeAsset, Chunk } from "./types";

interface Assets {
  [key: string]: {
    source: () => string;
  };
}

function getFormattedFilename(fileName: string): string {
  if (fileName.includes("?")) {
    return fileName.split("?").slice(0, -1).join("");
  }
  return fileName;
}

function isFileOfTypes(filename: string, extensions: string[]): boolean {
  const extension = path.extname(getFormattedFilename(filename));
  return extensions.includes(extension);
}

function getAssets(assets: Assets = {}, extensions: string[]): PurgeAsset[] {
  const purgeAssets: PurgeAsset[] = [];
  for (const [name, asset] of Object.entries(assets)) {
    if (isFileOfTypes(name, extensions)) {
      purgeAssets.push({
        name,
        asset,
      });
    }
  }

  return purgeAssets;
}

function files(
  chunk: Chunk,
  extensions: string[],
  getter: (file: File) => string | undefined
): string[] {
  const mods = [];
  for (const module of Array.from(chunk.modulesIterable || [])) {
    // @ts-ignore
    const file = getter(module);
    if (file && extensions.includes(path.extname(file))) mods.push(file);
  }
  return mods;
}

export default {
  files,
  getAssets,
  isFileOfTypes,
  getFormattedFilename,
};
