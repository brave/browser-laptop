/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'

const messages = require('../js/constants/messages')
const electron = require('electron')
const session = electron.session
const BrowserWindow = electron.BrowserWindow
const webContents = electron.webContents
const appActions = require('../js/actions/appActions')
const appConfig = require('../js/constants/appConfig')
const hostContentSettings = require('./browser/contentSettings/hostContentSettings')
const downloadStates = require('../js/constants/downloadStates')
const urlParse = require('./common/urlParse')
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
const {updateElectronDownloadItem} = require('./browser/electronDownloadItem')
const {fullscreenOption} = require('./common/constants/settingsEnums')

let appStore = null

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
  const isPrivate = module.exports.isPrivate(partition)
  session.webRequest.onBeforeRequest((details, cb) => {
    if (process.env.NODE_ENV === 'development') {
      let page = appUrlUtil.getGenDir(details.url)
      if (page) {
        let redirectURL = 'http://localhost:' + (process.env.BRAVE_PORT || process.env.npm_package_config_port) + '/' + page
        cb({
          redirectURL
        })
        return
      }
    }

    if (shouldIgnoreUrl(details)) {
      cb({})
      return
    }

    const firstPartyUrl = module.exports.getMainFrameUrl(details)
    // this can happen if the tab is closed and the webContents is no longer available
    if (!firstPartyUrl) {
      cb({ cancel: true })
      return
    }

    for (let i = 0; i < beforeRequestFilteringFns.length; i++) {
      let results = beforeRequestFilteringFns[i](details, isPrivate)
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
          wnd.webContents.send(message, parentResourceName, {
            tabId: details.tabId,
            url: details.url
          }))

        if (parentResourceName === appConfig.resourceNames.SAFE_BROWSING) {
          cb({ redirectURL: appUrlUtil.getTargetAboutUrl('about:safebrowsing#' + details.url) })
        } else if (details.resourceType === 'image') {
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
            wnd.webContents.send(messages.HTTPSE_RULE_APPLIED, results.ruleset, {
              tabId: details.tabId,
              url: details.url
            }))
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
function registerForBeforeRedirect (session, partition) {
  const isPrivate = module.exports.isPrivate(partition)
  // Note that onBeforeRedirect listener doesn't take a callback
  session.webRequest.onBeforeRedirect(function (details) {
    // Using an electron binary which isn't from Brave
    if (shouldIgnoreUrl(details)) {
      return
    }
    for (let i = 0; i < beforeRedirectFilteringFns.length; i++) {
      // Note that since this isn't supposed to have a return value, the
      // redirect filtering function must check whether the resource is
      // enabled and do nothing if it's not.
      beforeRedirectFilteringFns[i](details, isPrivate)
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
  const isPrivate = module.exports.isPrivate(partition)

  session.webRequest.onBeforeSendHeaders(function (details, cb) {
    // Using an electron binary which isn't from Brave
    if (shouldIgnoreUrl(details)) {
      cb({})
      return
    }

    let requestHeaders = details.requestHeaders

    const firstPartyUrl = module.exports.getMainFrameUrl(details)
    // this can happen if the tab is closed and the webContents is no longer available
    if (!firstPartyUrl) {
      cb({ cancel: true })
      return
    }

    for (let i = 0; i < beforeSendHeadersFilteringFns.length; i++) {
      let results = beforeSendHeadersFilteringFns[i](details, isPrivate)
      if (!module.exports.isResourceEnabled(results.resourceName, firstPartyUrl, isPrivate)) {
        continue
      }
      if (results.cancel) {
        cb({cancel: true})
        return
      }

      if (results.requestHeaders) {
        requestHeaders = results.requestHeaders
      }

      if (results.customCookie) {
        requestHeaders.Cookie = results.customCookie
      }
    }

    if (module.exports.isResourceEnabled(appConfig.resourceNames.COOKIEBLOCK, firstPartyUrl, isPrivate)) {
      const parsedTargetUrl = urlParse(details.url || '')
      const parsedFirstPartyUrl = urlParse(firstPartyUrl)

      if (module.exports.isThirdPartyHost(parsedFirstPartyUrl.hostname, parsedTargetUrl.hostname)) {
        // Clear cookie and referer on third-party requests
        if (requestHeaders['Cookie'] &&
            getOrigin(firstPartyUrl) !== pdfjsOrigin) {
          requestHeaders['Cookie'] = undefined
        }
        if (requestHeaders['Referer'] &&
            !refererExceptions.includes(parsedTargetUrl.hostname)) {
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
  const isPrivate = module.exports.isPrivate(partition)
  // Note that onBeforeRedirect listener doesn't take a callback
  session.webRequest.onHeadersReceived(function (details, cb) {
    // Using an electron binary which isn't from Brave
    if (shouldIgnoreUrl(details)) {
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
      let results = headersReceivedFilteringFns[i](details, isPrivate)
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
  const isPrivate = module.exports.isPrivate(partition)
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

    // Always allow fullscreen if setting is ON
    const alwaysAllowFullscreen = module.exports.alwaysAllowFullscreen() === fullscreenOption.ALWAYS_ALLOW
    if (permission === 'fullscreen' && alwaysAllowFullscreen) {
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
    let isAllowed
    if (settings) {
      isAllowed = settings.get(permissionName)
    }
    // Private tabs inherit settings from normal tabs, but not vice versa.
    if (isPrivate && tempSettings) {
      isAllowed = tempSettings.get(permissionName)
    }
    if (typeof isAllowed === 'boolean') {
      cb(isAllowed)
      return
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
  updateElectronDownloadItem(downloadId, item, state)

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

    // special handling for data URLs where another 'will-download' event handler is trying to suggest a filename via item.setSavePath
    // see the IPC handler for RENDER_URL_TO_PDF in app/index.js for example
    let itemFilename
    if (item.getURL().match(/^data:/) && item.getSavePath()) {
      itemFilename = path.basename(item.getSavePath())
    } else {
      itemFilename = item.getFilename()
    }

    const defaultPath = path.join(getSetting(settings.DEFAULT_DOWNLOAD_SAVE_PATH) || app.getPath('downloads'), itemFilename)
    const savePath = (process.env.SPECTRON ? defaultPath : dialog.showSaveDialog(win, { defaultPath }))

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

function registerForMagnetHandler (session) {
  const webtorrentUrl = appUrlUtil.getTorrentExtUrl('webtorrent.html')
  try {
    if (getSetting(settings.TORRENT_VIEWER_ENABLED)) {
      session.protocol.registerNavigatorHandler('magnet', `${webtorrentUrl}#%s`)
    } else {
      session.protocol.unregisterNavigatorHandler('magnet', `${webtorrentUrl}#%s`)
    }
  } catch (e) {
    console.warn('Could not register magnet URL handler. Are you using the latest electron?')
  }
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
    hostContentSettings.init,
    registerForBeforeRequest,
    registerForBeforeRedirect,
    registerForBeforeSendHeaders,
    registerPermissionHandler,
    registerForHeadersReceived,
    registerForDownloadListener,
    registerForMagnetHandler]
  let options = {}
  if (isSessionPartition(partition)) {
    options.parent_partition = ''
  }
  let ses = session.fromPartition(partition, options)
  fns.forEach((fn) => { fn(ses, partition, module.exports.isPrivate(partition)) })
}

const filterableProtocols = ['http:', 'https:']

function shouldIgnoreUrl (details) {
  // internal requests
  if (details.tabId === -1) {
    return true
  }

  // data:, is a special origin from SecurityOrigin::urlWithUniqueSecurityOrigin
  // and usually occurs when there is an https in an http main frame
  if (details.firstPartyUrl === 'data:,') {
    return false
  }

  // Ensure host is well-formed (RFC 1035) and has a non-empty hostname
  try {
    const firstPartyUrl = urlParse(details.firstPartyUrl)
    if (!filterableProtocols.includes(firstPartyUrl.protocol)) {
      return true
    }
  } catch (e) {
    console.warn('Error parsing ' + details.firstPartyUrl)
  }

  try {
    // TODO(bridiver) - handle RFS check and cancel http/https requests with 0 or > 255 length hostames
    const parsedUrl = urlParse(details.url)
    if (filterableProtocols.includes(parsedUrl.protocol)) {
      return false
    }
  } catch (e) {
    console.warn('Error parsing ' + details.url)
  }
  return true
}

module.exports.isPrivate = (partition) => {
  return !partition.startsWith('persist:')
}

module.exports.init = (state, action, store) => {
  appStore = store

  setImmediate(() => {
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
    ipcMain.on(messages.NOTIFICATION_RESPONSE, (e, message, buttonIndex, persist) => {
      if (permissionCallbacks[message]) {
        permissionCallbacks[message](buttonIndex, persist)
      }
    })
  })

  return state
}

module.exports.getSiteSettings = (url, isPrivate) => {
  const appState = appStore.getState()
  let settings = appState.get('siteSettings')
  if (isPrivate) {
    settings = settings.mergeDeep(appState.get('temporarySiteSettings'))
  }
  return siteSettings.getSiteSettingsForURL(settings, url)
}

module.exports.isResourceEnabled = (resourceName, url, isPrivate) => {
  if (resourceName === 'siteHacks') {
    return true
  }

  // TODO(bridiver) - need to clean up the rest of this so web can
  // remove this because it duplicates checks made in siteSettings
  // and not all resources  are controlled by shields up/down
  if (resourceName === 'flash' || resourceName === 'webtorrent') {
    return true
  }

  const appState = appStore.getState()
  const settings = siteSettings.getSiteSettingsForURL(appState.get('siteSettings'), url)
  const tempSettings = siteSettings.getSiteSettingsForURL(appState.get('temporarySiteSettings'), url)

  let braverySettings = siteSettings.activeSettings(settings, appState, appConfig)
  if (isPrivate && tempSettings) {
    braverySettings = siteSettings.activeSettings(tempSettings, appState, appConfig)
  }

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
  const tab = webContents.fromTabID(details.tabId)
  if (tab && !tab.isDestroyed()) {
    return tab.getURL()
  }
  return null
}

module.exports.alwaysAllowFullscreen = () => {
  return getSetting(settings.FULLSCREEN_CONTENT)
}
