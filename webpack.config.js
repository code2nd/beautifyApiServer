'use strict'
const path = require('path')
const {
  CleanWebpackPlugin
} = require('clean-webpack-plugin')
const UglifyJS = require('uglify-es');
const nodeExternals = require('webpack-node-externals')
const CopyWebpackPlugin = require('copy-webpack-plugin');

function resolve (dir) {
  return path.join(__dirname, dir);
}

module.exports = {
  mode: "development",
  /* entry: './src/app.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'app.js'
  }, */
  node: {
    console: true,
    global: true,
    process: true,
    Buffer: true,
    __filename: true,
    __dirname: true,
    setImmediate: true,
    path: true
  },
  target: 'node',
  externals: [nodeExternals()],
  resolve: {
    modules: [
      path.resolve(__dirname, 'src')
    ]
  },
  plugins: [
    new CleanWebpackPlugin(),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: resolve('./src'),
          to: './dist'
        },
        // { from: path.join(__dirname, './src/views'), to: path.join(__dirname, './dist/views') },
        { from: path.join(__dirname, './package.json'), to: path.join(__dirname, './dist') }
      ]
    })
  ]
}