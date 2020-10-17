const { PurgeCSS } = require("PurgeCSS");

interface runOption {
  content: String;
  css: String;
  defaultExtractor: String;
  extractors: String;
  fontFace: String;
  keyframes: String;
  output: String;
  rejected: String;
  variables: String;
  safelist: String;
}

interface PurgeResult {
  css: String;
}

async function run(options: runOption): Promise<PurgeResult> {
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

process.on('message', async function(data) {
  const { name, options, type } = data
  if (type === 'exit') {
    process.exit(0)
    return
  }
  console.log()
  console.log('purge start')
  console.log()

  const purged = await run(options)
  // @ts-ignore
  process.send({name, purged})
})
