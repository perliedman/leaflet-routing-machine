/* eslint-env node */
// eslint-disable-next-line @typescript-eslint/no-var-requires
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const path = require('path');

module.exports = {
  mode: 'development',
  entry: {
    leaflet: './index.js'
  },
  output: {
    publicPath: ''
  },
  plugins: [new MiniCssExtractPlugin()],

  module: {
    rules: [
      {
        test: /\.css$/,
        use: [MiniCssExtractPlugin.loader, 'css-loader']
      },
      {
        test: /\.(png|gif)$/,
        use: ['file-loader']
      }
    ]
  },
  resolve: {
    alias: {
      leaflet: path.resolve('node_modules/leaflet/dist/leaflet'),
    },
  },
};