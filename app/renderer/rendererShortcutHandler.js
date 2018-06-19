/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const electron = require('electron')

const windowStore = require('../../js/stores/windowStore')
const appStore = require('../../js/stores/appStoreRenderer')

const windowActions = require('../../js/actions/windowActions')
const appActions = require('../../js/actions/appActions')
const tabActions = require('../common/actions/tabActions')
const webviewActions = require('../../js/actions/webviewActions')

const tabState = require('../common/state/tabState')
const frameStateUtil = require('../../js/state/frameStateUtil')
const getSetting = require('../../js/settings').getSetting

const UrlUtil = require('../../js/lib/urlutil')
const {
  aboutUrls,
  isSourceMagnetUrl,
  getBaseUrl
} = require('../../js/lib/appUrlUtil')
const config = require('../../js/constants/config')
const settings = require('../../js/constants/settings')

function getWebContents (tabId, cb) {
  electron.remote.getWebContents(tabId, (webContents) => {
    if (webContents && !webContents.isDestroyed()) {
      cb(webContents)
    } else {
      cb()
    }
  })
}

function isAboutPageURL (url) {
  return aboutUrls.get(getBaseUrl(url))
}

function isTorrentViewerURL (url) {
  const isEnabled = getSetting(settings.TORRENT_VIEWER_ENABLED)
  return isEnabled && isSourceMagnetUrl(url)
}

function isPDFJSURL (url) {
  const pdfjsOrigin = `chrome-extension://${config.PDFJSExtensionId}/`
  return url && url.startsWith(pdfjsOrigin)
}

module.exports = {
  handleActiveFrameShortcut (shortcut, e, args) {
    const frameKey = frameStateUtil.getActiveFrame(windowStore.state).get('key')
    handleShortcut(frameKey, shortcut, e, args)
  },
  handleFrameShortcut: handleShortcut
}

function handleShortcut (frameKey, shortcut, e, args) {
  switch (shortcut) {
    case 'toggle-dev-tools': {
      appActions.toggleDevTools(frameStateUtil.getTabIdByFrameKey(windowStore.state, frameKey))
      break
    }
    case 'stop': {
      const tabId = frameStateUtil.getTabIdByFrameKey(windowStore.state, frameKey)
      getWebContents(tabId, (webContents) => {
        if (webContents) {
          webContents.stop()
        }
      })
      break
    }
    case 'zoom-in': {
      const tabId = frameStateUtil.getTabIdByFrameKey(windowStore.state, frameKey)
      getWebContents(tabId, (webContents) => {
        if (webContents) {
          webContents.zoomIn()
          // TODO: better to respond to a muon Tab event `zoom-changed` via ZoomObserver
          // if that is provided in the future
          tabActions.zoomChanged(tabId, webContents.getZoomPercent())
        }
      })
      break
    }
    case 'zoom-out': {
      const tabId = frameStateUtil.getTabIdByFrameKey(windowStore.state, frameKey)
      getWebContents(tabId, (webContents) => {
        if (webContents) {
          webContents.zoomOut()
          // TODO: better to respond to a muon Tab event `zoom-changed` via ZoomObserver
          // if that is provided in the future
          tabActions.zoomChanged(tabId, webContents.getZoomPercent())
        }
      })
      break
    }
    case 'zoom-reset': {
      const tabId = frameStateUtil.getTabIdByFrameKey(windowStore.state, frameKey)
      getWebContents(tabId, (webContents) => {
        if (webContents) {
          webContents.zoomReset()
          // TODO: better to respond to a muon Tab event `zoom-changed` via ZoomObserver
          // if that is provided in the future
          tabActions.zoomChanged(tabId, webContents.getZoomPercent())
        }
      })
      break
    }
    case 'view-source': {
      const tabId = frameStateUtil.getTabIdByFrameKey(windowStore.state, frameKey)
      const tab = tabState.getByTabId(appStore.state, tabId)
      const tabUrl = tab && tab.get('url')
      const sourceLocation = UrlUtil.getViewSourceUrlFromUrl(tabUrl)

      if (sourceLocation !== null) {
        const frame = frameStateUtil.getFrameByKey(windowStore.state, frameKey)
        const isPrivate = frame.get('isPrivate', false)
        appActions.createTabRequested({
          url: sourceLocation,
          isPrivate,
          isTor: frameStateUtil.isTor(frame),
          partitionNumber: frame.get('partitionNumber'),
          openerTabId: tabId,
          active: true
        })
      }
      break
    }
    case 'reload': {
      const frame = frameStateUtil.getFrameByKey(windowStore.state, frameKey)
      const frameLocation = frame.get('location')
      const tabId = frameStateUtil.getTabIdByFrameKey(windowStore.state, frameKey)
      const tab = tabState.getByTabId(appStore.state, tabId)
      const tabUrl = tab && tab.get('url')
      // Ensure that the webview thinks we're on the same location as the browser does.
      // This can happen for pages which don't load properly.
      // Some examples are basic http auth and bookmarklets.
      // In this case both the user display and the user think they're on frameLocation.
      if (tabUrl !== frameLocation &&
        !isAboutPageURL(frameLocation) &&
        !isTorrentViewerURL(frameLocation)) {
      } else if (isPDFJSURL(frameLocation)) {
        appActions.loadURLRequested(tabId,
          UrlUtil.getLocationIfPDF(frameLocation))
      } else {
        tabActions.reload(tabId)
      }
      break
    }
    case 'clean-reload': {
      const frame = frameStateUtil.getFrameByKey(windowStore.state, frameKey)
      const tabId = frameStateUtil.getTabIdByFrameKey(windowStore.state, frameKey)
      if (frameStateUtil.isTor(frame)) {
        // set new tor circuit
        appActions.setTorNewIdentity(tabId, frame.get('location'))
      } else {
        tabActions.reload(tabId, true)
      }
      break
    }
    case 'save': {
      const tabId = frameStateUtil.getTabIdByFrameKey(windowStore.state, frameKey)
      // TODO: Sometimes this tries to save in a non-existent directory
      getWebContents(tabId, (webContents) => {
        if (webContents) {
          const tab = tabState.getByTabId(appStore.state, tabId)
          const tabUrl = tab && tab.get('url')
          const downloadLocation = getSetting(settings.PDFJS_ENABLED)
            ? UrlUtil.getLocationIfPDF(tabUrl)
            : tabUrl
          webContents.downloadURL(downloadLocation, true)
        }
      })
      break
    }
    case 'print': {
      const tabId = frameStateUtil.getTabIdByFrameKey(windowStore.state, frameKey)
      getWebContents(tabId, (webContents) => {
        if (webContents) {
          webContents.print()
        }
      })
      break
    }
    case 'copy': {
      let selection = window.getSelection()
      if (selection && selection.toString()) {
        appActions.clipboardTextCopied(selection.toString())
      } else {
        const tabId = frameStateUtil.getTabIdByFrameKey(windowStore.state, frameKey)
        getWebContents(tabId, (webContents) => {
          if (webContents) {
            webContents.copy()
          }
        })
      }
      break
    }
    case 'show-findbar': {
      windowActions.setFindbarShown(frameKey, true)
      break
    }
    case 'find-next': {
      onFindAgain(frameKey, true)
      break
    }
    case 'find-prev': {
      onFindAgain(frameKey, false)
      break
    }
    case 'focus-webview': {
      webviewActions.setWebviewFocused()
      break
    }
  }
}

function onFindAgain (frameKey, forward) {
  const frame = frameStateUtil.getFrameByKey(windowStore.state, frameKey)
  const findbarShown = frame.get('findbarShown')
  if (!findbarShown) {
    windowActions.setFindbarShown(frameKey, true)
  }
  const searchString = frame.getIn(['findDetail', 'searchString'])
  if (searchString) {
    const caseSensitivity = frame.getIn(['findDetail', 'caseSensitivity'], undefined)
    const findDetailInternalFindStatePresent = frame.getIn(['findDetail', 'internalFindStatePresent'])
    const tabId = frameStateUtil.getTabIdByFrameKey(windowStore.state, frameKey)
    tabActions.findInPageRequest(tabId, searchString, caseSensitivity, forward, findDetailInternalFindStatePresent)
  }
}
