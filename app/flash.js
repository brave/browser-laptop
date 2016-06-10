// @flow
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const electron = require('electron')
const app = electron.app
const fs = require('fs')
const path = require('path')

const pepperFlashSystemPluginPath = app.getPath('pepperFlashSystemPlugin')
const pepperFlashManifestPath = path.resolve(pepperFlashSystemPluginPath, '..', 'manifest.json')

module.exports.init = () => {
  // TODO: This only works if sync currently
  try {
    const data = fs.readFileSync(pepperFlashManifestPath)
    if (!data) {
      return false
    }

    const pepperFlashManifest = JSON.parse(data)
    app.commandLine.appendSwitch('ppapi-flash-path', pepperFlashSystemPluginPath)
    app.commandLine.appendSwitch('ppapi-flash-version', pepperFlashManifest.version)
    return true
  } catch (e) {
    return false
  }
}

module.exports.checkForFlash = () => {
  // Check if Flash is installed by looking for the manifest path
  try {
    fs.accessSync(pepperFlashManifestPath)
    return true
  } catch (e) {
    return false
  }
}
