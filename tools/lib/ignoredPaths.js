/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

module.exports = [
  'test/',
  'tools/',
  'abp-filter-parser-cpp/(node_modules|test|perf|sample|scripts|test|vendor|ABPFilterParserData.dat)',
  'tracking-protection/(node_modules|test|data|scripts|vendor)',
  'sqlite3/(src|deps)',
  'sqlite3/build/Release/(obj|obj.target|.deps)',
  'abp-filter-parser-cpp/build/Release/(obj|obj.target|.deps)',
  'tracking-protection/build/Release/(obj|obj.target|.deps)',
  'nsp/node_modules',
  'electron-installer-squirrel-windows',
  'electron-chromedriver',
  'node-notifier/vendor',
  'node-gyp',
  'npm',
  '.brave-gyp',
  'electron-download',
  'electron-rebuild',
  'electron-packager',
  'electron-builder',
  'electron-prebuilt',
  'electron-rebuild',
  'electron-winstaller',
  'electron-winstaller-fixed',
  'electron-installer-redhat',
  'flow-bin',
  'mkdirp',
  'babel$',
  'babel-(?!polyfill|regenerator-runtime)'
]
