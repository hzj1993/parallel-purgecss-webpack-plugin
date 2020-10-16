const path = require('path')
const glob = require('glob')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const PurgecssWebpackPlugin = require('purgecss-webpack-plugin')
const {ParallelPurgecssWebpackPlugin} = require('../../dist/src/index.js')

const PATHS = {
  src: path.join(__dirname, 'src')
}

module.exports = {
  entry: path.resolve(__dirname, 'index.js'),
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist')
  },
  module: {
    rules: [
      {
        test: /\.css$/i,
        use: [MiniCssExtractPlugin.loader, 'css-loader'],
      },
    ]
  },
  plugins: [
    new MiniCssExtractPlugin(),
    // new PurgecssWebpackPlugin({
    //   paths: glob.sync(`${PATHS.src}/**/*`,  { nodir: true })
    // }),
    new ParallelPurgecssWebpackPlugin({
      paths: glob.sync(`${PATHS.src}/**/*`,  { nodir: true })
    })
  ]
}