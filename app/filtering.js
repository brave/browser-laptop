/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'

const messages = require('../js/constants/messages')
const electron = require('electron')
const session = electron.session
const BrowserWindow = electron.BrowserWindow
const AppStore = require('../js/stores/appStore')
const appActions = require('../js/actions/appActions')
const appConfig = require('../js/constants/appConfig')
const downloadStates = require('../js/constants/downloadStates')
const downloadActions = require('../js/constants/downloadActions')
const urlParse = require('url').parse
const getBaseDomain = require('../js/lib/baseDomain').getBaseDomain
const getSetting = require('../js/settings').getSetting
const settings = require('../js/constants/settings')
const ipcMain = electron.ipcMain
const dialog = electron.dialog
const app = electron.app
const uuid = require('node-uuid')
const path = require('path')

const beforeSendHeadersFilteringFns = []
const beforeRequestFilteringFns = []
const beforeRedirectFilteringFns = []

const transparent1pxGif = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'

// Third party domains that require a valid referer to work
const refererExceptions = ['use.typekit.net', 'cloud.typography.com']

/**
 * Maps downloadId to an electron download-item
 */
const downloadMap = {}

module.exports.registerBeforeSendHeadersFilteringCB = (filteringFn) => {
  beforeSendHeadersFilteringFns.push(filteringFn)
}

module.exports.registerBeforeRequestFilteringCB = (filteringFn) => {
  beforeRequestFilteringFns.push(filteringFn)
}

module.exports.registerBeforeRedirectFilteringCB = (filteringFn) => {
  beforeRedirectFilteringFns.push(filteringFn)
}

/**
 * Register for notifications for webRequest.onBeforeRequest for a particular
 * session.
 * @param {object} session Session to add webRequest filtering on
 */
function registerForBeforeRequest (session) {
  session.webRequest.onBeforeRequest((details, cb) => {
    // Using an electron binary which isn't from Brave
    if (!details.firstPartyUrl || shouldIgnoreUrl(details.url)) {
      cb({})
      return
    }

    let redirectURL
    for (let i = 0; i < beforeRequestFilteringFns.length; i++) {
      let results = beforeRequestFilteringFns[i](details)
      if (!module.exports.isResourceEnabled(results.resourceName)) {
        continue
      }
      if (results.cancel) {
        // We have no good way of knowing which BrowserWindow the blocking is for
        // yet so send it everywhere and let listeners decide how to respond.
        let message = details.resourceType === 'mainFrame'
          ? messages.BLOCKED_PAGE
          : messages.BLOCKED_RESOURCE
        BrowserWindow.getAllWindows().forEach((wnd) =>
          wnd.webContents.send(message, results.resourceName, details))
        if (details.resourceType === 'image') {
          cb({ redirectURL: transparent1pxGif })
        } else {
          cb({ cancel: true })
        }
        return
      }
      if (results.redirectURL) {
        redirectURL = results.redirectURL
        // Show the ruleset that was applied and the URLs that were upgraded in
        // siteinfo
        if (results.ruleset) {
          BrowserWindow.getAllWindows().forEach((wnd) =>
            wnd.webContents.send(messages.HTTPSE_RULE_APPLIED, results.ruleset, details))
        }
      }
    }
    cb({redirectURL: redirectURL})
  })
}

/**
 * Register for notifications for webRequest.onBeforeRedirect for a particular
 * session.
 * @param {object} session Session to add webRequest filtering on
 */
function registerForBeforeRedirect (session) {
  // Note that onBeforeRedirect listener doesn't take a callback
  session.webRequest.onBeforeRedirect(function (details) {
    // Using an electron binary which isn't from Brave
    if (!details.firstPartyUrl || shouldIgnoreUrl(details.url)) {
      return
    }
    for (let i = 0; i < beforeRedirectFilteringFns.length; i++) {
      // Note that since this isn't supposed to have a return value, the
      // redirect filtering function must check whether the resource is
      // enabled and do nothing if it's not.
      beforeRedirectFilteringFns[i](details)
    }
  })
}

/**
 * Register for notifications for webRequest.onBeforeSendHeaders for
 * a particular session.
 * @param {object} The session to add webRequest filtering on
 */
function registerForBeforeSendHeaders (session) {
  // For efficiency, avoid calculating these settings on every request. This means the
  // browser must be restarted for changes to take effect.
  const sendDNT = getSetting(settings.DO_NOT_TRACK)
  let spoofedUserAgent = getSetting(settings.USERAGENT)
  const braveRegex = new RegExp('brave/.+? ', 'gi')

  session.webRequest.onBeforeSendHeaders(function (details, cb) {
    // Using an electron binary which isn't from Brave
    if (!details.firstPartyUrl || shouldIgnoreUrl(details.url)) {
      cb({})
      return
    }

    let requestHeaders = details.requestHeaders

    if (!spoofedUserAgent) {
      // To minimize fingerprintability, remove Brave from the UA string.
      // This can be removed once https://github.com/atom/electron/issues/3602 is
      // resolved
      spoofedUserAgent = requestHeaders['User-Agent'].replace(braveRegex, '')
      appActions.changeSetting(settings.USERAGENT, spoofedUserAgent)
    }

    requestHeaders['User-Agent'] = spoofedUserAgent

    for (let i = 0; i < beforeSendHeadersFilteringFns.length; i++) {
      let results = beforeSendHeadersFilteringFns[i](details)
      if (!module.exports.isResourceEnabled(results.resourceName)) {
        continue
      }
      if (results.cancel) {
        cb({cancel: true})
        return
      }
      if (results.customCookie) {
        requestHeaders.Cookie = results.customCookie
      }
    }

    let hostname = urlParse(details.url || '').hostname
    if (module.exports.isResourceEnabled(appConfig.resourceNames.COOKIEBLOCK) &&
        module.exports.isThirdPartyHost(urlParse(details.firstPartyUrl || '').hostname,
                                        hostname)) {
      // Clear cookie and referer on third-party requests
      if (requestHeaders['Cookie']) {
        requestHeaders['Cookie'] = undefined
      }
      if (requestHeaders['Referer'] && !refererExceptions.includes(hostname)) {
        requestHeaders['Referer'] = undefined
      }
    }
    if (sendDNT) {
      requestHeaders['DNT'] = '1'
    }

    cb({ requestHeaders })
  })
}

/**
 * Register permission request handler
 * @param {Object} session to add permission request handler on
 */
function registerPermissionHandler (session) {
  // Keep track of per-site permissions granted for this session.
  // TODO: Localize strings
  let permissions = {
    media: {
      action: 'use your camera and/or microphone',
      hosts: {}
    },
    geolocation: {
      action: 'see your location',
      hosts: {}
    },
    notifications: {
      action: 'show you notifications',
      hosts: {}
    },
    midiSysex: {
      action: 'use web MIDI',
      hosts: {}
    },
    pointerLock: {
      action: 'disable your mouse cursor',
      hosts: {}
    },
    fullscreen: {
      action: 'be fullscreen',
      hosts: {}
    }
  }
  session.setPermissionRequestHandler((webContents, permission, cb) => {
    let host = urlParse(webContents.getURL()).host
    if (!permissions[permission]) {
      console.log('WARNING: got registered permission request', permission)
      cb(false)
      return
    }
    let isAllowed = permissions[permission].hosts[host]
    if (isAllowed !== undefined) {
      cb(isAllowed)
    } else {
      // TODO: Add option to remember decision between restarts.
      let result = dialog.showMessageBox({
        type: 'question',
        message: host + ' is requesting permission to ' + permissions[permission].action,
        buttons: ['Deny', 'Allow'],
        defaultId: 0,
        cancelId: 0
      })
      let isTemp = dialog.showMessageBox({
        type: 'question',
        title: 'Remember this decision?',
        message: 'Would you like to remember this decision on ' + host + ' until Brave closes?',
        buttons: ['Yes', 'No'],
        defaultId: 0,
        cancelId: 0
      })
      result = !!(result)
      cb(result)
      if (!isTemp) {
        permissions[permission].hosts[host] = result
      }
    }
  })
}

module.exports.isThirdPartyHost = (baseContextHost, testHost) => {
  // TODO: Always return true if these are IP addresses that aren't the same
  if (!testHost || !baseContextHost) {
    return true
  }
  const documentDomain = getBaseDomain(baseContextHost)
  if (testHost.length > documentDomain.length) {
    return (testHost.substr(testHost.length - documentDomain.length - 1) !== '.' + documentDomain)
  } else {
    return (testHost !== documentDomain)
  }
}

function updateDownloadState (downloadId, item, state) {
  if (state === downloadStates.INTERRUPTED || state === downloadStates.CANCELLED || state === downloadStates.COMPLETED) {
    delete downloadMap[downloadId]
  } else {
    downloadMap[downloadId] = item
  }

  if (!item) {
    appActions.mergeDownloadDetail(downloadId, { state: downloadStates.INTERRUPTED })
    return
  }

  const downloadItemStartTime = AppStore.getState().getIn(['downloads', downloadId, 'startTime'])
  appActions.mergeDownloadDetail(downloadId, {
    startTime: downloadItemStartTime || new Date().getTime(),
    savePath: item.getSavePath(),
    url: item.getURL(),
    filename: item.getSavePath() && path.basename(item.getSavePath()) || item.getFilename(),
    totalBytes: item.getTotalBytes(),
    receivedBytes: item.getReceivedBytes(),
    state
  })
}

function registerForDownloadListener (session) {
  session.on('will-download', function (event, item, webContents) {
    const win = BrowserWindow.getFocusedWindow()
    const savePath = dialog.showSaveDialog(win, {
      defaultPath: path.join(app.getPath('downloads'), item.getFilename())
    })
    // User cancelled out of save dialog prompt
    if (!savePath) {
      event.preventDefault()
      return
    }
    item.setSavePath(savePath)

    const downloadId = uuid.v4()
    updateDownloadState(downloadId, item, downloadStates.PENDING)
    if (win) {
      win.webContents.send(messages.SHOW_DOWNLOADS_TOOLBAR)
    }
    item.on('updated', function () {
      let state = downloadStates.IN_PROGRESS
      const downloadItem = AppStore.getState().getIn(['downloads', downloadId])
      if (downloadItem && downloadItem.get('state') === downloadStates.PAUSED) {
        state = downloadStates.PAUSED
      }
      updateDownloadState(downloadId, item, state)
    })
    item.on('done', function (e, state) {
      updateDownloadState(downloadId, item, state)
    })
  })
}

function initForPartition (partition) {
  ;[registerPermissionHandler, registerForBeforeRequest, registerForBeforeRedirect, registerForBeforeSendHeaders].forEach((fn) => {
    fn(session.fromPartition(partition))
  })
}

function shouldIgnoreUrl (url) {
  // Ensure host is well-formed (RFC 1035) and has a non-empty hostname
  try {
    let host = urlParse(url).hostname
    if (host.includes('..') || host.length > 255 || host.length === 0) {
      return true
    }
  } catch (e) {
    return true
  }
  return false
}

module.exports.init = () => {
  setTimeout(() => {
    registerForDownloadListener(session.defaultSession)
  }, 1000)
  ;['', 'main-1'].forEach((partition) => {
    initForPartition(partition)
  })
  let initializedPartitions = {}
  ipcMain.on(messages.INITIALIZE_PARTITION, (e, partition) => {
    if (initializedPartitions[partition]) {
      return
    }
    initForPartition(partition)
    initializedPartitions[partition] = true
  })
  ipcMain.on(messages.DOWNLOAD_ACTION, (e, downloadId, action) => {
    const item = downloadMap[downloadId]
    switch (action) {
      case downloadActions.CANCEL:
        updateDownloadState(downloadId, item, downloadStates.CANCELLED)
        if (item) {
          item.cancel()
        }
        break
      case downloadActions.PAUSE:
        if (item) {
          item.pause()
        }
        updateDownloadState(downloadId, item, downloadStates.PAUSED)
        break
      case downloadActions.RESUME:
        if (item) {
          item.resume()
        }
        updateDownloadState(downloadId, item, downloadStates.IN_PROGRESS)
        break
    }
  })
}

module.exports.isResourceEnabled = (resourceName) => {
  const enabledFromState = AppStore.getState().getIn([resourceName, 'enabled'])
  if (enabledFromState === undefined) {
    return appConfig[resourceName].enabled
  }
  return enabledFromState
}
