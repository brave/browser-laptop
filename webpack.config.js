/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

var webpack = require('webpack')
var WebpackNotifierPlugin = require('webpack-notifier')
var port = process.env.npm_package_config_port
var path = require('path')
var env = process.env.NODE_ENV === 'production' ? 'production'
  : (process.env.NODE_ENV === 'test' ? 'test' : 'development')

function config () {
  return {
    devtool: '#source-map',
    cache: true,
    module: {
      loaders: [
        {
          test: /\.js?$/,
          exclude: [
            /node_modules/,
            /\.min.js$/,
            path.resolve(__dirname, 'app', 'browser', '*'),
            path.resolve(__dirname, 'app', 'extensions', '*')
          ],
          loader: 'babel'
        },
        {
          test: /\.less$/,
          loader: 'style-loader!css-loader?-minimize!less-loader'
        },
        {
          test: /\.css$/,
          loader: 'style-loader!css-loader?-minimize'
        },
        {
          test: /\.json$/,
          loader: 'json'
        },
        // Loads font files for Font Awesome
        {
          test: /\.woff(2)?(\?v=[0-9]\.[0-9]\.[0-9])?$/,
          loader: 'url-loader?limit=10000&minetype=application/font-woff'
        },
        {
          test: /\.(ttf|eot|svg|png|jpg)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
          loader: 'file-loader'
        }
      ]
    },
    resolve: {
      extensions: ['', '.js', '.jsx']
    },
    externals: {
      'electron': 'chrome'
    },
    plugins: [
      new WebpackNotifierPlugin({title: 'Brave-' + env}),
      new webpack.IgnorePlugin(/^\.\/stores\/appStore$/),
      new webpack.IgnorePlugin(/^spellchecker/),
      new webpack.DefinePlugin({
        'process.env': {
          NODE_ENV: JSON.stringify(env),
          BRAVE_PORT: port
        }
      })
    ],
    node: {
      process: false,
      __filename: true,
      __dirname: true,
      fs: 'empty'
    }
  }
}

function watchOptions () {
  return {
    watchOptions: {
      ignored: [
        /node_modules/,
        'test/**'
      ]
    }
  }
}

function development () {  // eslint-disable-line
  var dev = config()
  dev.devServer = {
    publicPath: 'http://localhost:' + port + '/gen/',
    headers: { 'Access-Control-Allow-Origin': '*' }
  }
  return Object.assign(dev, watchOptions())
}

function production () {  // eslint-disable-line
  var prod = config()
  prod.plugins.push(new webpack.optimize.DedupePlugin())
  prod.plugins.push(new webpack.optimize.OccurrenceOrderPlugin(true))
  if (env !== 'test') {
    prod.plugins.push(new webpack.optimize.UglifyJsPlugin({
      compress: {
        warnings: false
      },
      mangle: {
        except: ['module', 'exports', 'require']
      }
    }))
  }
  return prod
}

function test () {  // eslint-disable-line
  return Object.assign(production(), watchOptions())
}

function merge (config, env) {
  var merged = Object.assign({}, env, config)
  merged.plugins = (config.plugins || []).concat(env.plugins || [])
  return merged
}

var app = {
  target: 'web',
  entry: {
    app: [ path.resolve(__dirname, 'js', 'entry.js') ],
    aboutPages: [ path.resolve(__dirname, 'js', 'about', 'entry.js') ]
  },
  output: {
    path: path.resolve(__dirname, 'app', 'extensions', 'brave', 'gen'),
    filename: '[name].entry.js',
    publicPath: './gen/'
  }
}

var devTools = {
  target: 'web',
  entry: {
    devTools: [ path.resolve(__dirname, 'js', 'devTools.js') ]
  },
  output: {
    path: path.resolve(__dirname, 'app', 'extensions', 'brave', 'gen'),
    filename: 'lib.[name].js',
    publicPath: './gen/',
    library: '[name]'
  }
}

var webtorrentPage = {
  name: 'webtorrent',
  target: 'web',
  entry: ['./js/webtorrent/entry.js'],
  output: {
    path: path.resolve(__dirname, 'app', 'extensions', 'torrent', 'gen'),
    filename: 'webtorrentPage.entry.js',
    publicPath: './gen/'
  }
}

const envConfig = eval(env)  // eslint-disable-line
module.exports = [
  merge(app, envConfig()),
  merge(devTools, envConfig()),
  merge(webtorrentPage, envConfig())
]
