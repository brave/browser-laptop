/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'

const messages = require('../js/constants/messages')
const electron = require('electron')
const session = electron.session
const BrowserWindow = electron.BrowserWindow
const webContents = electron.webContents
const appStore = require('../js/stores/appStore')
const appActions = require('../js/actions/appActions')
const appConfig = require('../js/constants/appConfig')
const downloadStates = require('../js/constants/downloadStates')
const downloadActions = require('../js/constants/downloadActions')
const urlParse = require('url').parse
const getBaseDomain = require('../js/lib/baseDomain').getBaseDomain
const getSetting = require('../js/settings').getSetting
const appUrlUtil = require('../js/lib/appUrlUtil')
const promisify = require('../js/lib/promisify')
const siteSettings = require('../js/state/siteSettings')
const settings = require('../js/constants/settings')
const userPrefs = require('../js/state/userPrefs')
const config = require('../js/constants/config')
const locale = require('./locale')
const {isSessionPartition} = require('../js/state/frameStateUtil')
const ipcMain = electron.ipcMain
const dialog = electron.dialog
const app = electron.app
const uuid = require('node-uuid')
const path = require('path')
const getOrigin = require('../js/state/siteUtil').getOrigin
const {adBlockResourceName} = require('./adBlock')

const beforeSendHeadersFilteringFns = []
const beforeRequestFilteringFns = []
const beforeRedirectFilteringFns = []
const headersReceivedFilteringFns = []
let initializedPartitions = {}

const transparent1pxGif = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'
const pdfjsOrigin = `chrome-extension://${config.PDFJSExtensionId}`

// Third party domains that require a valid referer to work
const refererExceptions = ['use.typekit.net', 'cloud.typography.com']

/**
 * Maps downloadId to an electron download-item
 */
const downloadMap = {}

/**
 * Maps partition name to the session object
 */
const registeredSessions = {}

/**
 * Maps permission notification bar messages to their callback
 */
const permissionCallbacks = {}

module.exports.registerBeforeSendHeadersFilteringCB = (filteringFn) => {
  beforeSendHeadersFilteringFns.push(filteringFn)
}

module.exports.registerBeforeRequestFilteringCB = (filteringFn) => {
  beforeRequestFilteringFns.push(filteringFn)
}

module.exports.registerBeforeRedirectFilteringCB = (filteringFn) => {
  beforeRedirectFilteringFns.push(filteringFn)
}

module.exports.registerHeadersReceivedFilteringCB = (filteringFn) => {
  headersReceivedFilteringFns.push(filteringFn)
}

/**
 * Register for notifications for webRequest.onBeforeRequest for a particular
 * session.
 * @param {object} session Session to add webRequest filtering on
 */
function registerForBeforeRequest (session, partition) {
  const isPrivate = !partition.startsWith('persist:')
  session.webRequest.onBeforeRequest((details, cb) => {
    if (shouldIgnoreUrl(details.url)) {
      cb({})
      return
    }

    const firstPartyUrl = module.exports.getMainFrameUrl(details)
    // this can happen if the tab is closed and the webContents is no longer available
    if (!firstPartyUrl) {
      cb({ cancel: true })
      return
    }

    if (appUrlUtil.isTargetAboutUrl(details.url)) {
      if (process.env.NODE_ENV === 'development' && !details.url.match(/devServerPort/)) {
        // add webpack dev server port
        let url = details.url
        let urlComponents = url.split('#')
        urlComponents[0] = urlComponents[0] + '?devServerPort=' + (process.env.BRAVE_PORT || process.env.npm_package_config_port)
        cb({
          redirectURL: urlComponents.join('#')
        })
        return
      }
    }

    for (let i = 0; i < beforeRequestFilteringFns.length; i++) {
      let results = beforeRequestFilteringFns[i](details)
      const isAdBlock = results.resourceName === appConfig.resourceNames.ADBLOCK || appConfig[results.resourceName] && appConfig[results.resourceName].resourceType === adBlockResourceName
      const isHttpsEverywhere = results.resourceName === appConfig.resourceNames.HTTPS_EVERYWHERE
      const isTracker = results.resourceName === appConfig.resourceNames.TRACKING_PROTECTION

      if (!module.exports.isResourceEnabled(results.resourceName, firstPartyUrl, isPrivate)) {
        continue
      }
      if (results.cancel) {
        // We have no good way of knowing which BrowserWindow the blocking is for
        // yet so send it everywhere and let listeners decide how to respond.
        let message = details.resourceType === 'mainFrame'
          ? messages.BLOCKED_PAGE
          : messages.BLOCKED_RESOURCE

        // Counts the number of ads and trackers
        let parentResourceName = results.resourceName

        // Adblock can have many different resource names for each alternate
        // data file. But we always want the per level reporting to report
        // it into the window adblock stats.
        if (isAdBlock) {
          parentResourceName = appConfig.resourceNames.ADBLOCK
        }

        if (isAdBlock || isTracker) {
          appActions.addResourceCount(parentResourceName, 1)
        }

        BrowserWindow.getAllWindows().forEach((wnd) =>
          wnd.webContents.send(message, parentResourceName, details))
        if (details.resourceType === 'image') {
          cb({ redirectURL: transparent1pxGif })
        } else {
          cb({ cancel: true })
        }
        return
      } else if (results.resourceName === 'siteHacks' && results.cancel === false) {
        cb({})
        return
      }

      if (results.redirectURL) {
        // Show the ruleset that was applied and the URLs that were upgraded in
        // siteinfo
        if (results.ruleset) {
          // Counts the number of httpsE redirects
          if (isHttpsEverywhere) {
            appActions.addResourceCount(results.resourceName, 1)
          }
          BrowserWindow.getAllWindows().forEach((wnd) =>
            wnd.webContents.send(messages.HTTPSE_RULE_APPLIED, results.ruleset, details))
        }
        cb({redirectURL: results.redirectURL})
        return
      }
    }
    // Redirect to non-script version of DDG when it's blocked
    let url = details.url
    if (details.resourceType === 'mainFrame' &&
      url.startsWith('https://duckduckgo.com/?q') &&
    module.exports.isResourceEnabled('noScript', url, isPrivate)) {
      url = url.replace('?q=', 'html?q=')
      cb({redirectURL: url})
    } else {
      cb({})
    }
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
    if (shouldIgnoreUrl(details.url)) {
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
function registerForBeforeSendHeaders (session, partition) {
  // For efficiency, avoid calculating these settings on every request. This means the
  // browser must be restarted for changes to take effect.
  const sendDNT = getSetting(settings.DO_NOT_TRACK)
  let spoofedUserAgent = getSetting(settings.USERAGENT)
  const braveRegex = new RegExp('brave/.+? ', 'gi')
  const isPrivate = !partition.startsWith('persist:')

  session.webRequest.onBeforeSendHeaders(function (details, cb) {
    // Using an electron binary which isn't from Brave
    if (shouldIgnoreUrl(details.url)) {
      cb({})
      return
    }

    let requestHeaders = details.requestHeaders
    let parsedUrl = urlParse(details.url || '')

    if (!spoofedUserAgent) {
      // To minimize fingerprintability, remove Brave from the UA string.
      // This can be removed once https://github.com/atom/electron/issues/3602 is
      // resolved
      spoofedUserAgent = requestHeaders['User-Agent'].replace(braveRegex, '')
      appActions.changeSetting(settings.USERAGENT, spoofedUserAgent)
    }

    if (!appConfig.uaExceptionHosts.includes(parsedUrl.hostname)) {
      requestHeaders['User-Agent'] = spoofedUserAgent
    }

    const firstPartyUrl = module.exports.getMainFrameUrl(details)
    // this can happen if the tab is closed and the webContents is no longer available
    if (!firstPartyUrl) {
      cb({ cancel: true })
      return
    }

    for (let i = 0; i < beforeSendHeadersFilteringFns.length; i++) {
      let results = beforeSendHeadersFilteringFns[i](details)
      if (!module.exports.isResourceEnabled(results.resourceName, firstPartyUrl, isPrivate)) {
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

    if (module.exports.isResourceEnabled(appConfig.resourceNames.COOKIEBLOCK, firstPartyUrl, isPrivate)) {
      if (module.exports.isThirdPartyHost(urlParse(firstPartyUrl || '').hostname,
                                          parsedUrl.hostname)) {
        // Clear cookie and referer on third-party requests
        if (requestHeaders['Cookie'] &&
            getOrigin(firstPartyUrl) !== pdfjsOrigin) {
          requestHeaders['Cookie'] = undefined
        }
        if (requestHeaders['Referer'] &&
            !refererExceptions.includes(parsedUrl.hostname)) {
          requestHeaders['Referer'] = getOrigin(details.url)
        }
      }
    }
    if (sendDNT) {
      requestHeaders['DNT'] = '1'
    }

    cb({ requestHeaders })
  })
}

/**
 * Register for notifications for webRequest.onHeadersReceived for a particular
 * session.
 * @param {object} session Session to add webRequest filtering on
 */
function registerForHeadersReceived (session, partition) {
  const isPrivate = !partition.startsWith('persist:')
  // Note that onBeforeRedirect listener doesn't take a callback
  session.webRequest.onHeadersReceived(function (details, cb) {
    // Using an electron binary which isn't from Brave
    if (shouldIgnoreUrl(details.url)) {
      cb({})
      return
    }
    const firstPartyUrl = module.exports.getMainFrameUrl(details)
    // this can happen if the tab is closed and the webContents is no longer available
    if (!firstPartyUrl) {
      cb({ cancel: true })
      return
    }
    for (let i = 0; i < headersReceivedFilteringFns.length; i++) {
      let results = headersReceivedFilteringFns[i](details)
      if (!module.exports.isResourceEnabled(results.resourceName, firstPartyUrl, isPrivate)) {
        continue
      }
      if (results.responseHeaders) {
        cb({responseHeaders: results.responseHeaders})
        return
      }
    }
    cb({})
  })
}

/**
 * Register permission request handler
 * @param {Object} session to add permission request handler on
 * @param {string} partition name of the partition
 */
function registerPermissionHandler (session, partition) {
  const isPrivate = !partition.startsWith('persist:')
  // Keep track of per-site permissions granted for this session.
  let permissions = null
  session.setPermissionRequestHandler((origin, mainFrameUrl, permission, cb) => {
    if (!permissions) {
      permissions = {
        media: {
          action: locale.translation('permissionCameraMicrophone')
        },
        geolocation: {
          action: locale.translation('permissionLocation')
        },
        notifications: {
          action: locale.translation('permissionNotifications')
        },
        midiSysex: {
          action: locale.translation('permissionWebMidi')
        },
        pointerLock: {
          action: locale.translation('permissionDisableCursor')
        },
        fullscreen: {
          action: locale.translation('permissionFullscreen')
        },
        openExternal: {
          action: locale.translation('permissionExternal')
        },
        protocolRegistration: {
          action: locale.translation('permissionProtocolRegistration')
        }
      }
    }

    if (!permissions[permission]) {
      console.log('WARNING: got unregistered permission request', permission)
      cb(false)
      return
    }

    // The Torrent Viewer extension is always allowed to show fullscreen media
    if (permission === 'fullscreen' &&
      origin.startsWith('chrome-extension://' + config.torrentExtensionId)) {
      cb(true)
      return
    }

    // The Brave extension and PDFJS are always allowed to open files in an external app
    if (permission === 'openExternal' && (
      origin.startsWith('chrome-extension://' + config.PDFJSExtensionId) ||
      origin.startsWith('chrome-extension://' + config.braveExtensionId))) {
      cb(true)
      return
    }

    // Check whether there is a persistent site setting for this host
    const appState = appStore.getState()
    let settings
    let tempSettings
    if (mainFrameUrl === appUrlUtil.getBraveExtIndexHTML() ||
      origin.startsWith('chrome-extension://' + config.braveExtensionId)) {
      // lookup, display and store site settings by "Brave Browser"
      origin = 'Brave Browser'
      // display on all tabs
      mainFrameUrl = null
      // Lookup by exact host pattern match since 'Brave Browser' is not
      // a parseable URL
      settings = siteSettings.getSiteSettingsForHostPattern(appState.get('siteSettings'), origin)
      tempSettings = siteSettings.getSiteSettingsForHostPattern(appState.get('temporarySiteSettings'), origin)
    } else if (mainFrameUrl.startsWith('magnet:')) {
      // Show "Allow magnet URL to open an external application?", instead of
      // "Allow null to open an external application?"
      // This covers an edge case where you open a magnet link tab, then disable Torrent Viewer
      // and restart Brave. I don't think it needs localization. See 'Brave Browser' above.
      origin = 'Magnet URL'
    } else {
      // Strip trailing slash
      origin = getOrigin(origin)
      settings = siteSettings.getSiteSettingsForURL(appState.get('siteSettings'), origin)
      tempSettings = siteSettings.getSiteSettingsForURL(appState.get('temporarySiteSettings'), origin)
    }

    const permissionName = permission + 'Permission'
    if (settings) {
      let isAllowed = settings.get(permissionName)
      if (typeof isAllowed === 'boolean') {
        cb(isAllowed)
        return
      }
    }
    // Private tabs inherit settings from normal tabs, but not vice versa.
    if (isPrivate && tempSettings) {
      let isAllowed = tempSettings.get(permissionName)
      if (typeof isAllowed === 'boolean') {
        cb(isAllowed)
        return
      }
    }

    const message = locale.translation('permissionMessage').replace(/{{\s*host\s*}}/, origin).replace(/{{\s*permission\s*}}/, permissions[permission].action)

    // If this is a duplicate, clear the previous callback and use the new one
    if (permissionCallbacks[message]) {
      permissionCallbacks[message](0, false)
    }

    appActions.showMessageBox({
      buttons: [
        {text: locale.translation('deny')},
        {text: locale.translation('allow')}
      ],
      frameOrigin: getOrigin(mainFrameUrl),
      options: {
        persist: true
      },
      message
    })

    permissionCallbacks[message] = (buttonIndex, persist) => {
      permissionCallbacks[message] = null
      // hide the message box if this was triggered automatically
      appActions.hideMessageBox(message)
      const result = !!(buttonIndex)
      cb(result)
      if (persist) {
        // remember site setting for this host
        appActions.changeSiteSetting(origin, permission + 'Permission', result, isPrivate)
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

  const downloadItemStartTime = appStore.getState().getIn(['downloads', downloadId, 'startTime'])
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
    const defaultPath = path.join(getSetting(settings.DEFAULT_DOWNLOAD_SAVE_PATH) || app.getPath('downloads'), item.getFilename())
    const savePath = dialog.showSaveDialog(win, { defaultPath })
    // User cancelled out of save dialog prompt
    if (!savePath) {
      event.preventDefault()
      return
    }
    item.setSavePath(savePath)
    appActions.changeSetting(settings.DEFAULT_DOWNLOAD_SAVE_PATH, path.dirname(savePath))

    const downloadId = uuid.v4()
    updateDownloadState(downloadId, item, downloadStates.PENDING)
    if (win) {
      win.webContents.send(messages.SHOW_DOWNLOADS_TOOLBAR)
    }
    item.on('updated', function () {
      let state = downloadStates.IN_PROGRESS
      const downloadItem = appStore.getState().getIn(['downloads', downloadId])
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

function initSession (ses, partition) {
  initializedPartitions[partition] = true
  registeredSessions[partition] = ses
  ses.setEnableBrotli(true)
  ses.userPrefs.setDefaultZoomLevel(getSetting(settings.DEFAULT_ZOOM_LEVEL) || config.zoom.defaultValue)
}

function initForPartition (partition) {
  let fns = [initSession,
    userPrefs.init,
    registerForBeforeRequest,
    registerForBeforeRedirect,
    registerForBeforeSendHeaders,
    registerPermissionHandler,
    registerForHeadersReceived,
    registerForDownloadListener]
  let options = {}
  if (isSessionPartition(partition)) {
    options.parent_partition = ''
  }
  let ses = session.fromPartition(partition, options)
  fns.forEach((fn) => { fn(ses, partition) })
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
  ['default'].forEach((partition) => {
    initForPartition(partition)
  })
  ipcMain.on(messages.INITIALIZE_PARTITION, (e, partition) => {
    if (initializedPartitions[partition]) {
      e.returnValue = true
      return e.returnValue
    }
    initForPartition(partition)
    e.returnValue = true
    return e.returnValue
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
  ipcMain.on(messages.NOTIFICATION_RESPONSE, (e, message, buttonIndex, persist) => {
    if (permissionCallbacks[message]) {
      permissionCallbacks[message](buttonIndex, persist)
    }
  })
}

module.exports.isResourceEnabled = (resourceName, url, isPrivate) => {
  if (resourceName === 'siteHacks') {
    return true
  }

  const appState = appStore.getState()
  let settings
  if (!isPrivate) {
    settings = siteSettings.getSiteSettingsForURL(appState.get('siteSettings'), url)
  } else {
    settings = siteSettings.getSiteSettingsForURL(appState.get('temporarySiteSettings'), url)
  }
  const braverySettings = siteSettings.activeSettings(settings, appState, appConfig)

  // If full shields are down never enable extra protection
  if (braverySettings.shieldsUp === false) {
    return false
  }

  if (resourceName === appConfig.resourceNames.ADBLOCK ||
      appConfig[resourceName] &&
        appConfig[resourceName].enabled &&
        appConfig[resourceName].resourceType === adBlockResourceName ||
      resourceName === appConfig.resourceNames.TRACKING_PROTECTION) {
    // Check the resource vs the ad control setting
    if (braverySettings.adControl === 'allowAdsAndTracking') {
      return false
    } else {
      return true
    }
  }

  // Check the resource vs the cookie setting
  if (resourceName === appConfig.resourceNames.COOKIEBLOCK) {
    if (braverySettings.cookieControl === 'allowAllCookies') {
      return false
    } else {
      return true
    }
  }

  // If the particular resource we're checking is disabled then don't enable
  if (typeof braverySettings[resourceName] === 'boolean') {
    return braverySettings[resourceName]
  }

  return false
}

/**
 * Clears all storage data.
 * This includes: appcache, cookies, filesystem, indexdb, local storage,
 * shadercache, websql, and serviceworkers.
 * @return a promise that always resolves (called on app shutdon so must always)
 */
module.exports.clearStorageData = () => {
  let p = Promise.resolve()
  for (let partition in registeredSessions) {
    let ses = registeredSessions[partition]
    p = p.then(promisify(ses.clearStorageData.bind(ses)).catch(() => {}))
  }
  return p
}

/**
 * Clears all session cache.
 * @return a promise that always resolves (called on app shutdon so must always)
 */
module.exports.clearCache = () => {
  let p = Promise.resolve()
  for (let partition in registeredSessions) {
    let ses = registeredSessions[partition]
    p = p.then(promisify(ses.clearCache.bind(ses)).catch(() => {}))
  }
  return p
}

module.exports.setDefaultZoomLevel = (zoom) => {
  for (let partition in registeredSessions) {
    let ses = registeredSessions[partition]
    ses.userPrefs.setDefaultZoomLevel(zoom)
  }
}

module.exports.getMainFrameUrl = (details) => {
  if (details.resourceType === 'mainFrame') {
    return details.url
  }
  const tabId = details.tabId
  const wc = webContents.getAllWebContents()
  if (wc && tabId) {
    const content = wc.find((item) => item.getId() === tabId)
    if (content) {
      return content.getURL()
    }
  }
  return null
}
