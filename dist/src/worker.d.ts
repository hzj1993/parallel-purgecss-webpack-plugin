declare const PurgeCSS: any;
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
declare function run(options: runOption): Promise<PurgeResult>;
