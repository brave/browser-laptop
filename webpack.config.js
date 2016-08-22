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
            path.resolve(__dirname, 'app', 'extensions', '*')
          ],
          loader: 'babel'
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
          test: /\.(ttf|eot|svg|png|jpg)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
          loader: 'file-loader'
        }
      ]
    },
    resolve: {
      extensions: ['', '.js', '.jsx']
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
      __filename: true,
      __dirname: true
    }
  }
}

function development () {
  var dev = config()
  dev.devServer = {
    publicPath: 'http://localhost:' + port + '/gen/'
  }
  return dev
}

function production () {
  var prod = config()
  prod.plugins.push(new webpack.optimize.DedupePlugin())
  prod.plugins.push(new webpack.optimize.OccurrenceOrderPlugin(true))
  prod.plugins.push(new webpack.optimize.UglifyJsPlugin({
    compress: {
      warnings: false
    },
    mangle: {
      except: ['module', 'exports', 'require']
    }
  }))
  return prod
}

function merge (config, env) {
  var merged = Object.assign({}, config, env)
  merged.plugins = (config.plugins || []).concat(env.plugins || [])
  return merged
}

var app = {
  name: 'app',
  target: 'electron',
  entry: ['./js/entry.js'],
  output: {
    path: path.resolve(__dirname, 'app', 'extensions', 'brave', 'gen'),
    filename: 'app.entry.js',
    publicPath: './gen/'
  }
}

var aboutPages = {
  name: 'about',
  target: 'web',
  entry: ['./js/about/entry.js'],
  output: {
    path: path.resolve(__dirname, 'app', 'extensions', 'brave', 'gen'),
    filename: 'aboutPages.entry.js',
    publicPath: './gen/'
  }
}

module.exports = {
  development: [
    merge(app, development()),
    merge(aboutPages, development())
  ],
  production: [
    merge(app, production()),
    merge(aboutPages, production())
  ],
  test: [
    merge(app, production()),
    merge(aboutPages, production())
  ]
}[env]
