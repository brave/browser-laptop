/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const electron = require('electron')
const BrowserWindow = electron.BrowserWindow
const path = require('path')
const fs = require('fs')
const autoUpdater = require('auto-updater')
const config = require('./appConfig')

// this maps the result of a call to process.platform to an update API identifier
var platforms = {
  'darwin': 'osx'
}

// build the complete update url from the base, platform and version
var buildUpdateUrl = function (baseUrl, platform) {
  var pack = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json')))
  var version = pack.version
  return `${baseUrl}/${platforms[platform]}/${version}`
}

// set the feed url for the auto-update system
exports.init = (platform) => {
  var updateUrl = buildUpdateUrl(config.updates.baseUrl, platform)
  try {
    autoUpdater.setFeedURL(updateUrl)
  } catch (err) {
    console.log(err)
  }
}

exports.checkForUpdate = () => {
  autoUpdater.checkForUpdates()
}

// development version only
exports.fakeCheckForUpdate = () => {
  BrowserWindow.getFocusedWindow().webContents.send('update-available')
}

exports.update = () => {
  console.log('update requested in updater')
  autoUpdater.quitAndInstall()
}

autoUpdater.on('update-downloaded', (evt) => {
  BrowserWindow.getFocusedWindow().webContents.send('update-available')
})

autoUpdater.on('update-available', (evt) => {
  console.log('update downloading')
})

autoUpdater.on('update-not-available', (evt) => {
  console.log('update is not available')
})
