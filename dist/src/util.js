"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
let path = require('path');
function getFormattedFilename(fileName) {
    if (fileName.includes("?")) {
        return fileName.split("?").slice(0, -1).join("");
    }
    return fileName;
}
function isFileOfTypes(filename, extensions) {
    const extension = path.extname(getFormattedFilename(filename));
    return extensions.includes(extension);
}
function getAssets(assets = {}, extensions) {
    const purgeAssets = [];
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
function files(chunk, extensions, getter) {
    const mods = [];
    for (const module of Array.from(chunk.modulesIterable || [])) {
        // @ts-ignore
        const file = getter(module);
        if (file && extensions.includes(path.extname(file)))
            mods.push(file);
    }
    return mods;
}
exports.default = {
    files,
    getAssets,
    isFileOfTypes,
    getFormattedFilename,
};
