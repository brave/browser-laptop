/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'strict mode'

const electron = require('electron')
const BrowserWindow = electron.BrowserWindow
const path = require('path')
const os = require('os')
const fs = require('fs')
const autoUpdater = require('auto-updater')
const config = require('./appConfig')
const messages = require('../js/constants/messages')
const request = require('request')
const util = require('util')

// in built mode console.log output is not emitted to the terminal
// in prod mode we pipe to a file
var debug = function (contents) {
  console.log(contents)
  fs.appendFileSync(path.join(os.homedir(), 'output.txt'), contents + '\n')
}

// this maps the result of a call to process.platform to an update API identifier
var platforms = {
  'darwin': 'osx',
  'win32': 'winx64'
}

// We are storing this as a package variable because a number of functions need access
// It is set in the init function
var platformBaseUrl = null

// build the complete update url from the base, platform and version
exports.updateUrl = function (updates, platform) {
  var pack = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json')))
  var version = pack.version
  platformBaseUrl = `${updates.baseUrl}/${platforms[platform]}/${version}`
  debug(`platformBaseUrl = ${platformBaseUrl}`)
  if (platform === 'darwin') {
    return platformBaseUrl
  } else {
    return updates.winBaseUrl
  }
}

// set the feed url for the auto-update system
exports.init = (platform) => {
  var baseUrl = exports.updateUrl(config.updates, platform)
  debug('updateUrl = ' + baseUrl)
  try {
    autoUpdater.setFeedURL(baseUrl)
  } catch (err) {
    console.log(err)
  }
}

// Make a request to the update server to retrieve meta data
var requestVersionInfo = () => {
  debug('retrieving version info')
  if (!platformBaseUrl) throw new Error("platformBaseUrl not set")

  request(platformBaseUrl, (err, response, body) => {
    if (!err) {
      // This should be handled by a UI component for the update toolbar
      process.emit(messages.UPDATE_META_DATA_RETRIEVED, body)
    } else {
      // Network error or mis-configuration
      debug(err.toString())
    }
  })
}

// make a network request to check for an available update
exports.checkForUpdate = () => {
  debug('checkForUpdates')
  try {
    if (process.platform === 'win32') {
      requestVersionInfo()
    }
    // On OSx the meta data is automatically retrieved by the autoUpdater
    autoUpdater.checkForUpdates()
  } catch (err) {
    debug(err)
  }
}

// development version only
exports.fakeCheckForUpdate = () => {
  debug('fakeCheckForUpdate')
  BrowserWindow.webContents.send(messages.UPDATE_AVAILABLE)
}

// The UI indicates that we should update the software
exports.update = () => {
  debug('update requested in updater')
  autoUpdater.quitAndInstall()
}

// The download is complete, we send a signal and await UI
autoUpdater.on('update-downloaded', (evt, extra, extra2) => {
  debug('update downloaded')
  process.emit(messages.UPDATE_AVAILABLE)
})

// Download has started
autoUpdater.on(messages.UPDATE_AVAILABLE, (evt) => {
  // TODO add ui notification
  debug('update downloading')
})

// The current version of the software is current
autoUpdater.on(messages.UPDATE_NOT_AVAILABLE, (evt) => {
  // TODO add ui notification
  debug('update not available')
})

// Handle autoUpdater errors (Network, permissions etc...)
autoUpdater.on('error', (err) => {
  debug(err)
})
