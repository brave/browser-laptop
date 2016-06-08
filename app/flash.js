// @flow
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const electron = require('electron')
const app = electron.app
const fs = require('fs')
const path = require('path')

module.exports.init = () => {
  const pepperFlashSystemPluginPath = app.getPath('pepperFlashSystemPlugin')
  const pepperFlashManifestPath = path.resolve(pepperFlashSystemPluginPath, '..', 'manifest.json')
  // TODO: This only works if sync currently
  const data = fs.readFileSync(pepperFlashManifestPath)
  if (!data) {
    return
  }

  const pepperFlashManifest = JSON.parse(data)
  app.commandLine.appendSwitch('ppapi-flash-path', pepperFlashSystemPluginPath)
  app.commandLine.appendSwitch('ppapi-flash-version', pepperFlashManifest.version)
}
