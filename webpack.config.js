/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

var webpack = require('webpack')
var WebpackNotifierPlugin = require('webpack-notifier')

module.exports = {
  contentBase: './dist/',
  cache: true,
  inline: true,
  target: 'atom',
  entry: {
    app: ['webpack/hot/dev-server', './js/entry.js']
  },
  devtool: '#source-map',
  output: {
    path: './app/gen',
    filename: 'bundle.js',
    publicPath: './gen/',
    sourceMapFilename: '[file].map',
    stats: { colors: true }
  },
  module: {
    noParse: [],
    loaders: [
      {
        test: /\.js?$/,
        exclude: [
          /node_modules/,
          /bower_components/,
          /\.min.js$/
        ],
        loader: 'babel',
        query: {
          presets: ['react', 'es2015']
        }
      },
      {
        test: /\.less$/,
        loader: 'style-loader!css-loader!less-loader'
      },
      {
        test: /\.css$/,
        loader: 'style-loader!css-loader'
      },
      // Loads font files for Font Awesome
      {
        test: /\.woff(2)?(\?v=[0-9]\.[0-9]\.[0-9])?$/,
        loader: 'url-loader?limit=10000&minetype=application/font-woff'
      },
      {
        test: /\.(ttf|eot|svg|png)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
        loader: 'file-loader'
      }
    ]
  },
  resolve: {
    alias: {
      // The with-addons is only needed for perseus :(
      // example: 'react': path.resolve('node_modules/react/dist/react-with-addons.js'),
    },
    extensions: ['', '.js', '.jsx']
  },
  plugins: [
    new WebpackNotifierPlugin({title: 'Brave-' + process.env.NODE_ENV}),
    new webpack.HotModuleReplacementPlugin(),
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: process.env.NODE_ENV === 'production' ? JSON.stringify('production') : JSON.stringify('development')
      }
    })
  ],
  devServer: {
    contentBase: './public',
    publicPath: 'http://localhost:8080/built/'
  }
}
