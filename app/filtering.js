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
const appUrlUtil = require('../js/lib/appUrlUtil')
const promisify = require('../js/lib/promisify')
const siteSettings = require('../js/state/siteSettings')
const settings = require('../js/constants/settings')
const userPrefs = require('../js/state/userPrefs')
const config = require('../js/constants/config')
const locale = require('./locale')
const ipcMain = electron.ipcMain
const dialog = electron.dialog
const app = electron.app
const uuid = require('node-uuid')
const path = require('path')
const getOrigin = require('../js/state/siteUtil').getOrigin

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
function registerForBeforeRequest (session) {
  session.webRequest.onBeforeRequest((details, cb) => {
    // Using an electron binary which isn't from Brave
    if (!details.firstPartyUrl || shouldIgnoreUrl(details.url)) {
      cb({})
      return
    }

    for (let i = 0; i < beforeRequestFilteringFns.length; i++) {
      let results = beforeRequestFilteringFns[i](details)
      const isAdBlock = results.resourceName === appConfig.resourceNames.ADBLOCK
      const isHttpsEverywhere = results.resourceName === appConfig.resourceNames.HTTPS_EVERYWHERE
      const isTracker = results.resourceName === appConfig.resourceNames.TRACKING_PROTECTION

      if (!module.exports.isResourceEnabled(results.resourceName, details.firstPartyUrl)) {
        continue
      }
      if (results.cancel) {
        // We have no good way of knowing which BrowserWindow the blocking is for
        // yet so send it everywhere and let listeners decide how to respond.
        let message = details.resourceType === 'mainFrame'
          ? messages.BLOCKED_PAGE
          : messages.BLOCKED_RESOURCE

        // Counts the number of ads and trackers
        if (isAdBlock || isTracker) {
          appActions.addResourceCount(results.resourceName, 1)
        }

        BrowserWindow.getAllWindows().forEach((wnd) =>
          wnd.webContents.send(message, results.resourceName, details))
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
    module.exports.isResourceEnabled('noScript', url)) {
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

    for (let i = 0; i < beforeSendHeadersFilteringFns.length; i++) {
      let results = beforeSendHeadersFilteringFns[i](details)
      if (!module.exports.isResourceEnabled(results.resourceName, details.firstPartyUrl)) {
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

    if (module.exports.isResourceEnabled(appConfig.resourceNames.COOKIEBLOCK, details.firstPartyUrl)) {
      if (module.exports.isThirdPartyHost(urlParse(details.firstPartyUrl || '').hostname,
                                          parsedUrl.hostname)) {
        // Clear cookie and referer on third-party requests
        if (requestHeaders['Cookie'] &&
            getOrigin(details.firstPartyUrl) !== pdfjsOrigin) {
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
function registerForHeadersReceived (session) {
  // Note that onBeforeRedirect listener doesn't take a callback
  session.webRequest.onHeadersReceived(function (details, cb) {
    // Using an electron binary which isn't from Brave
    if (!details.firstPartyUrl || shouldIgnoreUrl(details.url)) {
      cb({})
      return
    }
    for (let i = 0; i < headersReceivedFilteringFns.length; i++) {
      let results = headersReceivedFilteringFns[i](details)
      if (!module.exports.isResourceEnabled(results.resourceName, details.firstPartyUrl)) {
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
  session.setPermissionRequestHandler((origin, embedderOrigin, permission, cb) => {
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
    const url = origin || embedderOrigin
    // Allow notifications for the main app
    if (url === appUrlUtil.getIndexHTML() && permission === 'notifications' ||
        url.startsWith('chrome-extension://') && permission === 'openExternal') {
      cb(true)
      return
    }

    if (!permissions[permission]) {
      console.log('WARNING: got unregistered permission request', permission)
      cb(false)
      return
    }

    // Check whether there is a persistent site setting for this host
    const appState = AppStore.getState()
    const settings = siteSettings.getSiteSettingsForURL(appState.get('siteSettings'), url)
    const tempSettings = siteSettings.getSiteSettingsForURL(appState.get('temporarySiteSettings'), url)
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

    const urlOrigin = getOrigin(url)
    const frameOrigin = getOrigin(embedderOrigin)
    if (!urlOrigin || !frameOrigin) {
      return
    }
    const message = locale.translation('permissionMessage').replace(/{{\s*host\s*}}/, urlOrigin).replace(/{{\s*permission\s*}}/, permissions[permission].action)

    // If this is a duplicate, clear the previous callback and use the new one
    if (permissionCallbacks[message]) {
      permissionCallbacks[message](0, false)
    }

    appActions.showMessageBox({
      buttons: [
        {text: locale.translation('deny')},
        {text: locale.translation('allow')}
      ],
      frameOrigin,
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
        // remember site setting for this host over http(s)
        appActions.changeSiteSetting(urlOrigin, permission + 'Permission', result, isPrivate)
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
  let ses = session.fromPartition(partition)
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

module.exports.isResourceEnabled = (resourceName, url) => {
  if (resourceName === 'siteHacks') {
    return true
  }

  const appState = AppStore.getState()
  const settings = siteSettings.getSiteSettingsForURL(appState.get('siteSettings'), url)
  const braverySettings = siteSettings.activeSettings(settings, appState, appConfig)

  // If full shields are down never enable extra protection
  if (braverySettings.shieldsUp === false) {
    return false
  }

  if ((resourceName === appConfig.resourceNames.ADBLOCK ||
       resourceName === appConfig.resourceNames.TRACKING_PROTECTION)) {
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

module.exports.addAutofillAddress = (detail) => {
  let guidMap = {}
  for (let partition in registeredSessions) {
    let ses = registeredSessions[partition]
    let guid = ses.autofill.addProfile({
      full_name: detail.name,
      company_name: detail.organization,
      street_address: detail.streetAddress,
      city: detail.city,
      state: detail.state,
      postal_code: detail.postalCode,
      country_code: detail.country,
      phone: detail.phone,
      email: detail.email
    })
    guidMap[partition] = guid
  }
  return guidMap
}

module.exports.removeAutofillAddress = (guid) => {
  for (let partition in registeredSessions) {
    let ses = registeredSessions[partition]
    if (guid[partition] !== undefined) {
      ses.autofill.removeProfile(guid[partition])
    }
  }
}

module.exports.addAutofillCreditCard = (detail) => {
  let guidMap = {}
  for (let partition in registeredSessions) {
    let ses = registeredSessions[partition]
    let guid = ses.autofill.addCreditCard({
      name: detail.name,
      card_number: detail.card,
      expiration_month: detail.month,
      expiration_year: detail.year
    })
    guidMap[partition] = guid
  }
  return guidMap
}

module.exports.removeAutofillCreditCard = (guid) => {
  for (let partition in registeredSessions) {
    let ses = registeredSessions[partition]
    if (guid[partition] !== undefined) {
      ses.autofill.removeCreditCard(guid[partition])
    }
  }
}

module.exports.clearAutocompleteData = () => {
  for (let partition in registeredSessions) {
    let ses = registeredSessions[partition]
    ses.autofill.clearAutocompleteData()
  }
}

module.exports.clearAutofillData = () => {
  for (let partition in registeredSessions) {
    let ses = registeredSessions[partition]
    ses.autofill.clearAutofillData()
  }
}
