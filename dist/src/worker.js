"use strict";
const { PurgeCSS } = require("PurgeCSS");
async function run(options) {
    const purgecss = await new PurgeCSS().purge({
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
    return purgecss[0];
}
process.on('message', async function (data) {
    const { name, options, type } = data;
    if (type === 'exit') {
        process.exit(0);
        return;
    }
    console.log();
    console.log('purge start');
    console.log();
    const purged = await run(options);
    // @ts-ignore
    process.send({ name, purged });
});
