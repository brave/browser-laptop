/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */
'use strict'

const UrlUtil = require('../js/lib/urlutil')
const Filtering = require('./filtering')
const config = require('../js/constants/config')
const appActions = require('../js/actions/appActions')
const {getPathFromFileURI} = require('./common/lib/platformUtil')
const extensionState = require('./common/state/extensionState')
const appStore = require('../js/stores/appStore')
const fs = require('fs')
const path = require('path')
const getSetting = require('../js/settings').getSetting
const settings = require('../js/constants/settings')

const pdfjsBaseUrl = `chrome-extension://${config.PDFJSExtensionId}/`
const viewerBaseUrl = `${pdfjsBaseUrl}content/web/viewer.html`

const onBeforeRequest = (details) => {
  const result = { resourceName: 'pdfjs' }
  if (!(details.resourceType === 'mainFrame' &&
    UrlUtil.isFileScheme(details.url) &&
    UrlUtil.isFileType(details.url, 'pdf'))) {
    return result
  }
  // Cancel and redirect to the PDF viewer URL
  const extensions = extensionState.getExtensions(appStore.getState())
  const extensionPath = extensions.getIn([config.PDFJSExtensionId, 'filePath'])
  const pdfPath = getPathFromFileURI(details.url)
  const pdfName = pdfPath.split('/').pop()
  try {
    const writeStream = fs.createWriteStream(path.join(extensionPath, 'tmp', pdfName))
    writeStream.on('close', () => {
      const pdfChromeUrl = `${pdfjsBaseUrl}tmp/${pdfName}`
      const viewerUrl = `${viewerBaseUrl}?file=${encodeURIComponent(pdfChromeUrl)}#${pdfPath}`
      appActions.loadURLRequested(details.tabId, viewerUrl)
    })
    fs.createReadStream(pdfPath).pipe(writeStream)
  } catch (e) {
    return result
  }

  result.cancel = true
  return result
}

/**
 * Load PDF.JS
 */
module.exports.init = () => {
  if (getSetting(settings.PDFJS_ENABLED)) {
    Filtering.registerBeforeRequestFilteringCB(onBeforeRequest)
  }
}
