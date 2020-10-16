# parallel-purgecss-webpack-plugin

Run [purgecss-webpack-plugin]() use worker pool

## Installation

Via npm:

```
  $ npm install parallel-purgecss-webpack-plugin --save
```

## Getting Started

**You need to use `parallel-purgecss-webpack-plugin` with `mini-css-extract-plugin`**

**webpack.config.js**

```js
const glob = require('glob')
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const ParallelPurgecssWebpackPlugin = require("parallel-purgecss-webpack-plugin");
const PATHS = {
  src: path.join(__dirname, 'src')
}

module.exports = {
  module: {
    rules: [
      {
        test: /\.css$/i,
        use: [MiniCssExtractPlugin.loader, 'css-loader'],
      },
    ],
  },
  plugins: [
    new MiniCssExtractPlugin(),
    new ParallelPurgecssWebpackPlugin({
      paths: glob.sync(`${PATHS.src}/**/*`,  { nodir: true }),
      // or other purgecss-webpack-plugin options...
    })
  ]
};
```

## Set maxWorkers

You can set `maxWorkers`, `maxWorkers` default equals to the number of cpus

**webpack.config.js**

```js
const ParallelPurgecssWebpackPlugin = require("parallel-purgecss-webpack-plugin");

module.exports = {
  plugins: [
    new ParallelPurgecssWebpackPlugin({
      paths: glob.sync(`${path.join(process.cwd(), "src")}/**/*`, {
        nodir: true,
      }),
      maxWorkers: 10 // default equals to the number of cpus
    })
  ]
};
```