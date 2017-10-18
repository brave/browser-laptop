/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'

const {getWebContents} = require('./browser/webContentsCache')

const renderToPdf = (appState, action) => {
  const tab = getWebContents(action.tabId)
  if (!tab || tab.isDestroyed()) {
    return
  }

  const savePath = action.savePath

  tab.printToPDF({}, function (err, data) {
    if (err) {
      throw err
    }

    if (tab.isDestroyed()) {
      return
    }

    let pdfDataURI = 'data:application/pdf;base64,' + data.toString('base64')
    tab.downloadURL(pdfDataURI, true, savePath)
  })
  return appState
}

module.exports = {
  renderToPdf
}
