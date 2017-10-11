/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'

const tabs = require('./browser/tabs')
const {fileUrl} = require('../../js/lib/appUrlUtil')
const {getWebContents} = require('./browser/webContentsCache')

const renderToPdf = (appState, action) => {
  const tab = getWebContents(action.tabId)
  if (!tab || tab.isDestroyed()) {
    return
  }

  const savePath = action.savePath
  const openAfterwards = action.openAfterwards

  tab.printToPDF({}, function (err, data) {
    if (err) {
      throw err
    }

    if (tab.isDestroyed()) {
      return
    }

    let pdfDataURI = 'data:application/pdf;base64,' + data.toString('base64')
    tab.downloadURL(pdfDataURI, true, savePath, (downloadItem) => {
      downloadItem.once('done', function (event, state) {
        if (state === 'completed') {
          let finalSavePath = downloadItem.getSavePath()

          if (openAfterwards && finalSavePath) {
            let createProperties = {
              url: fileUrl(finalSavePath)
            }
            if (tab && !tab.isDestoyed()) {
              createProperties.openerTabId = tab.getId()
            }
            tabs.create(createProperties)
          }
        }
      })
    })
  })
  return appState
}

module.exports = {
  renderToPdf
}
