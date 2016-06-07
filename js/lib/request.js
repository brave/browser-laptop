/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'

const electron = require('electron')
const BrowserWindow = electron.BrowserWindow
const ipcMain = electron.ipcMain
const messages = require('../constants/messages')

const getWebContents = () => {
  try {
    return BrowserWindow.getFocusedWindow().webContents
  } catch (e) {
    return null
  }
}

var nonce = 0

/**
 * Sends a network request using Chromium's networks stack instead of Node's.
 * Depends on there being a loaded browser window available.
 * @param {string} url - the url to load
 * @param {function} callback - callback to call with the response metadata and
 *   body
 */
module.exports.request = (url, callback) => {
  const webContents = getWebContents()
  if (!webContents) {
    callback(new Error('Request failed, no webContents available'))
  } else {
    // Send a message to the main webcontents to make an XHR to the URL
    nonce++
    webContents.send(messages.SEND_XHR_REQUEST, url, nonce)
    ipcMain.once(messages.GOT_XHR_RESPONSE + nonce, (wnd, response, body) => {
      callback(null, response, body)
    })
  }
}
