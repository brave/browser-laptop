/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const electron = require('electron')
const app = electron.app
const appUserModelId = 'BraveSoftware.Brave.browser'

 // windows installation events etc...
if (process.platform === 'win32') {
  // TODO - register browser as HTTP handler in Windows (maybe need to fork)
  if (require('electron-squirrel-startup')) {
    process.exit(0)
  }
}

app.on('will-finish-launching', function () {
  app.setAppUserModelId(appUserModelId)
})
