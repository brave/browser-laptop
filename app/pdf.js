/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'

const electron = require('electron')
const config = require('../js/constants/config')
const BrowserWindow = electron.BrowserWindow

const renderUrlToPdf = (appState, action, testingMode) => {
  let url = action.url
  let savePath = action.savePath
  let openAfterwards = action.openAfterwards

  let currentBw = BrowserWindow.getFocusedWindow()

  let bw = new BrowserWindow({show: !!testingMode, backgroundColor: '#ffffff'})

  let wv = bw.webContents

  let whenReadyToGeneratePDF = () => {
    wv.printToPDF({}, function (err, data) {
      if (err) {
        throw err
      }

      let pdfDataURI = 'data:application/pdf;base64,' + data.toString('base64')

      // need to put our event handler first so we can set filename
      //   specifically, needs to execute ahead of app/filtering.js:registerForDownloadListener (which opens the dialog box)
      let listeners = wv.session.listeners('will-download')
      wv.session.removeAllListeners('will-download')

      wv.downloadURL(pdfDataURI)
      wv.session.once('will-download', function (event, item) {
        if (savePath) {
          item.setSavePath(savePath)
        }

        item.once('done', function (event, state) {
          if (state === 'completed') {
            let finalSavePath = item && item.getSavePath()

            if (openAfterwards && savePath) {
              currentBw.webContents.loadURL('file://' + finalSavePath)
            }

            if (bw && !testingMode) {
              try {
                bw.close()
              } catch (exc) {}
            }
          }
        })
      })
      // add back other event handlers (esp. add/filtering.js:registerForDownloadListener which opens the dialog box)
      listeners.forEach(function (listener) {
        wv.session.on('will-download', listener)
      })
    })
  }

  let afterLoaded = () => {
    let removeCharEncodingArtifactJS = 'document.body.outerHTML = document.body.outerHTML.replace(/Â/g, "")'
    wv.executeScriptInTab(config.braveExtensionId, removeCharEncodingArtifactJS, {}, whenReadyToGeneratePDF)
  }

  bw.loadURL(url)
  wv.on('did-finish-load', afterLoaded)

  return appState
}

module.exports = {
  renderUrlToPdf
}

