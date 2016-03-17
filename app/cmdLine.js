/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'

const Immutable = require('immutable')
const electron = require('electron')
const app = electron.app
const messages = require('../js/constants/messages')
const BrowserWindow = electron.BrowserWindow
const appActions = require('../js/actions/appActions')
let appInitialized = false

app.on('will-finish-launching', () => {
  // User clicked a link when w were the default or via command line like:
  // open -a Brave http://www.brave.com
  app.on('open-url', (event, path) => {
    event.preventDefault()

    if (appInitialized) {
      let wnd = BrowserWindow.getFocusedWindow()
      if (!wnd) {
        const wnds = BrowserWindow.getAllWindows()
        if (wnds.length > 0) {
          wnd = wnds[0]
        }
      }
      if (wnd) {
        wnd.webContents.send(messages.SHORTCUT_NEW_FRAME, path)
      } else {
        appActions.newWindow(Immutable.fromJS({
          location: path
        }))
      }
    } else {
      module.exports.newWindowURL = path
    }
  })
})

process.on(messages.APP_INITIALIZED, () => appInitialized = true)
