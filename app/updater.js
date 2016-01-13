/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const electron = require('electron')
const BrowserWindow = electron.BrowserWindow
const path = require('path')
const os = require('os')
const fs = require('fs')
const autoUpdater = require('auto-updater')
const config = require('./appConfig')
const messages = require('../js/constants/messages')

// in built mode console.log output is not emitted to the terminal
// in prod mode we pipe to a file
var debug = function (contents) {
  console.log(contents)
  fs.appendFileSync(path.join(os.homedir(), 'output.txt'), contents + '\n')
}

// this maps the result of a call to process.platform to an update API identifier
var platforms = {
  'darwin': 'osx'
}

// build the complete update url from the base, platform and version
exports.updateUrl = function (updates, platform) {
  if (platform === 'darwin') {
    var pack = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json')))
    var version = pack.version
    return `${updates.baseUrl}/${platforms[platform]}/${version}`
  } else {
    return updates.winBaseUrl
  }
}

// set the feed url for the auto-update system
exports.init = (platform) => {
  var updateUrl = exports.updateUrl(config.updates, platform)
  debug('updateUrl = ' + updateUrl)
  try {
    autoUpdater.setFeedURL(updateUrl)
  } catch (err) {
    console.log(err)
  }
}

// make a network request to check for an available update
exports.checkForUpdate = () => {
  debug('checkForUpdates')
  try {
    // TODO call baseUrl on windows for version info
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
