/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'

const messages = require('../js/constants/messages')
const electron = require('electron')
const session = electron.session
const BrowserWindow = electron.BrowserWindow
const webContents = electron.webContents
const webContentsCache = require('./browser/webContentsCache')
const appActions = require('../js/actions/appActions')
const appConfig = require('../js/constants/appConfig')
const hostContentSettings = require('./browser/contentSettings/hostContentSettings')
const downloadStates = require('../js/constants/downloadStates')
const urlParse = require('./common/urlParse')
const getSetting = require('../js/settings').getSetting
const {getExtensionsPath} = require('../js/lib/appUrlUtil')
const appUrlUtil = require('../js/lib/appUrlUtil')
const faviconUtil = require('../js/lib/faviconUtil')
const siteSettings = require('../js/state/siteSettings')
const settings = require('../js/constants/settings')
const userPrefs = require('../js/state/userPrefs')
const config = require('../js/constants/config')
const locale = require('./locale')
const {isSessionPartition} = require('../js/state/frameStateUtil')
const ipcMain = electron.ipcMain
const app = electron.app
const path = require('path')
const getOrigin = require('../js/lib/urlutil').getOrigin
const {isTorrentFile} = require('./browser/webtorrent')
const {adBlockResourceName} = require('./adBlock')
const {updateElectronDownloadItem} = require('./browser/electronDownloadItem')
const {fullscreenOption} = require('./common/constants/settingsEnums')
const isThirdPartyHost = require('./browser/isThirdPartyHost')
const extensionState = require('./common/state/extensionState')
const ledgerUtil = require('./common/lib/ledgerUtil')
const {cookieExceptions, isRefererException} = require('../js/data/siteHacks')
const {getBraverySettingsCache, updateBraverySettingsCache} = require('./common/cache/braverySettingsCache')
const {shouldDebugTabEvents} = require('./cmdLine')
const {getTorSocksProxy} = require('./channel')
const tor = require('./tor')

let appStore = null

const tabMessageBox = require('./browser/tabMessageBox')
const beforeSendHeadersFilteringFns = []
const beforeRequestFilteringFns = []
const beforeRedirectFilteringFns = []
const headersReceivedFilteringFns = []
let partitionsToInitialize = ['default']
let initializedPartitions = {}

const transparent1pxGif = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'
const pdfjsOrigin = `chrome-extension://${config.PDFJSExtensionId}`

/**
 * Maps partition name to the session object
 */
const registeredSessions = {}

/**
 * Maps permission notification bar messages to their callback
 */
const permissionCallbacks = {}

/**
 * A set to keep track of URLs fetching favicons that need special treatment later
 */
const faviconURLs = new Set()

const getBraverySettingsForUrl = (url, appState, isPrivate) => {
  const cachedBraverySettings = getBraverySettingsCache(url, isPrivate)
  if (cachedBraverySettings) {
    return cachedBraverySettings
  }
  const savedSettings = siteSettings.getSiteSettingsForURL(appState.get('siteSettings'), url)
  const tempSettings = siteSettings.getSiteSettingsForURL(appState.get('temporarySiteSettings'), url)

  let braverySettings = siteSettings.activeSettings(savedSettings, appState, appConfig)
  if (isPrivate && tempSettings) {
    braverySettings = siteSettings.activeSettings(tempSettings, appState, appConfig)
  }
  updateBraverySettingsCache(url, isPrivate, braverySettings)

  return braverySettings
}

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

// Protocols which are safe to load in tor tabs
const whitelistedTorProtocols = ['http:', 'https:', 'chrome-extension:', 'chrome-devtools:']
if (process.env.NODE_ENV === 'development') {
  // Needed for connection to webpack local server
  whitelistedTorProtocols.push('ws:')
}

/**
 * Register for notifications for webRequest.onBeforeRequest for a particular
 * session.
 * @param {object} session Session to add webRequest filtering on
 */
function registerForBeforeRequest (session, partition) {
  const isPrivate = module.exports.isPrivate(partition)
  session.webRequest.onBeforeRequest((details, muonCb) => {
    if (partition === appConfig.tor.partition) {
      if (!details.url) {
        muonCb({ cancel: true })
        return
      }
      // To minimize leakage risk, only allow whitelisted protocols in Tor
      // sessions
      const protocol = urlParse(details.url).protocol
      if (!whitelistedTorProtocols.includes(protocol)) {
        onBlockedInTor(details, muonCb)
        return
      }
    }

    if (process.env.NODE_ENV === 'development') {
      let page = appUrlUtil.getGenDir(details.url)
      if (page) {
        let redirectURL = 'http://localhost:' + (process.env.BRAVE_PORT || process.env.npm_package_config_port) + '/' + page
        muonCb({
          redirectURL
        })
        return
      }
    }

    const url = details.url
    // filter out special urls for fetching favicons
    if (faviconUtil.isWrappedFaviconUrl(url)) {
      const redirectURL = faviconUtil.unwrapFaviconUrl(url)
      faviconURLs.add(redirectURL)
      muonCb({ redirectURL })
      return
    }

    if (shouldIgnoreUrl(details)) {
      muonCb({})
      return
    }

    const firstPartyUrl = module.exports.getMainFrameUrl(details)
    // this can happen if the tab is closed and the webContents is no longer available
    if (!firstPartyUrl) {
      muonCb({})
      return
    }

    if (!isPrivate && module.exports.isResourceEnabled('ledger') && module.exports.isResourceEnabled('ledgerMedia')) {
      // Ledger media
      const provider = ledgerUtil.getMediaProvider(url, firstPartyUrl, details.referrer)
      if (provider) {
        appActions.onLedgerMediaData(url, provider, details)
      }
    }

    for (let i = 0; i < beforeRequestFilteringFns.length; i++) {
      let results = beforeRequestFilteringFns[i](details, isPrivate)
      const isAdBlock = (results.resourceName === appConfig.resourceNames.ADBLOCK) ||
        (appConfig[results.resourceName] && appConfig[results.resourceName].resourceType === adBlockResourceName)
      const isHttpsEverywhere = results.resourceName === appConfig.resourceNames.HTTPS_EVERYWHERE
      const isTracker = results.resourceName === appConfig.resourceNames.TRACKING_PROTECTION

      if (!module.exports.isResourceEnabled(results.resourceName, firstPartyUrl, isPrivate)) {
        continue
      }
      if (results.cancel) {
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

        // TODO(bridiver) - convert to appActions/appState
        setImmediate(() => {
          const tab = webContents.fromTabID(details.tabId)
          if (tab && tab.hostWebContents) {
            tab.hostWebContents.send(message, parentResourceName, {
              tabId: details.tabId,
              url: details.url
            })
          }
        })

        if (parentResourceName === appConfig.resourceNames.SAFE_BROWSING) {
          let redirectURL = appUrlUtil.getTargetAboutUrl('about:safebrowsing#' + details.url)
          muonCb({ redirectURL })
          // Workaround #8905
          appActions.loadURLRequested(details.tabId, redirectURL)
        } else if (details.resourceType === 'image') {
          muonCb({ redirectURL: transparent1pxGif })
        } else {
          muonCb({ cancel: true })
        }
        return
      } else if (results.resourceName === 'siteHacks' && results.cancel === false) {
        muonCb({})
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
          // TODO(bridiver) - convert to appActions/appState
          setImmediate(() => {
            const tab = webContents.fromTabID(details.tabId)
            if (tab && tab.hostWebContents) {
              tab.hostWebContents.send(messages.HTTPSE_RULE_APPLIED, results.ruleset, {
                tabId: details.tabId,
                url: details.url
              })
            }
          })
        }
        muonCb({redirectURL: results.redirectURL})
        return
      }
    }
    // Redirect to non-script version of DDG when it's blocked
    if (details.resourceType === 'mainFrame' &&
      url.startsWith('https://duckduckgo.com/?q') &&
    module.exports.isResourceEnabled('noScript', url, isPrivate)) {
      muonCb({redirectURL: url.replace('?q=', 'html?q=')})
    } else {
      muonCb({})
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

module.exports.applyCookieSetting = (requestHeaders, url, firstPartyUrl, isPrivate) => {
  const cookieSetting = module.exports.isResourceEnabled(appConfig.resourceNames.COOKIEBLOCK, firstPartyUrl, isPrivate)
  if (cookieSetting) {
    const targetHostname = urlParse(url || '').hostname
    const firstPartyHostname = urlParse(firstPartyUrl).hostname
    const targetOrigin = getOrigin(url)
    const referer = requestHeaders['Referer']

    if (cookieSetting === 'blockAllCookies' ||
      isThirdPartyHost(firstPartyHostname, targetHostname)) {
      let hasCookieException = false
      const firstPartyOrigin = getOrigin(firstPartyUrl)
      if (cookieExceptions.hasOwnProperty(firstPartyOrigin)) {
        const subResources = cookieExceptions[firstPartyOrigin]
        for (let i = 0; i < subResources.length; ++i) {
          if (subResources[i] === targetOrigin) {
            hasCookieException = true
            break
          } else if (subResources[i].includes('*')) {
            const regSubResource = new RegExp(subResources[i].replace('//', '\\/\\/').replace('*', '.*'), 'g')
            if (targetOrigin.match(regSubResource)) {
              hasCookieException = true
              break
            }
          }
        }
      }

      // Clear cookie on third-party requests
      if (requestHeaders['Cookie'] &&
          firstPartyOrigin !== pdfjsOrigin && !hasCookieException) {
        requestHeaders['Cookie'] = undefined
      }
    }

    if (referer &&
        cookieSetting !== 'allowAllCookies' &&
        !isRefererException(targetHostname) &&
        isThirdPartyHost(targetHostname, urlParse(referer).hostname)) {
      // Spoof third party referer
      requestHeaders['Referer'] = targetOrigin
    }
  }

  return requestHeaders
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

  session.webRequest.onBeforeSendHeaders(function (details, muonCb) {
    // strip cookies from all requests fetching favicons
    if (faviconURLs.has(details.url)) {
      faviconURLs.delete(details.url)
      delete details.requestHeaders['Cookie']
    }

    // Using an electron binary which isn't from Brave
    if (shouldIgnoreUrl(details)) {
      muonCb({ requestHeaders: details.requestHeaders })
      return
    }

    let requestHeaders = details.requestHeaders

    const firstPartyUrl = module.exports.getMainFrameUrl(details)
    // this can happen if the tab is closed and the webContents is no longer available
    if (!firstPartyUrl) {
      muonCb({})
      return
    }

    for (let i = 0; i < beforeSendHeadersFilteringFns.length; i++) {
      let results = beforeSendHeadersFilteringFns[i](details, isPrivate)
      if (!module.exports.isResourceEnabled(results.resourceName, firstPartyUrl, isPrivate)) {
        continue
      }
      if (results.cancel) {
        muonCb({cancel: true})
        return
      }

      if (results.requestHeaders) {
        requestHeaders = results.requestHeaders
      }

      if (results.customCookie) {
        requestHeaders.Cookie = results.customCookie
      }
    }

    requestHeaders = module.exports.applyCookieSetting(requestHeaders, details.url, firstPartyUrl, isPrivate)

    if (sendDNT) {
      requestHeaders['DNT'] = '1'
    }

    muonCb({ requestHeaders })
  })
}

function onBlockedInTor (details, muonCb) {
  const cb = () => muonCb({cancel: true})
  if (details.tabId && details.resourceType === 'mainFrame') {
    tabMessageBox.show(details.tabId, {
      message: `${locale.translation('urlBlockedInTor')}`,
      title: 'Brave',
      buttons: [locale.translation('urlWarningOk')]
    }, cb)
  } else {
    cb()
  }
}

/**
 * Register for notifications for webRequest.onHeadersReceived for a particular
 * session.
 * @param {object} session Session to add webRequest filtering on
 */
function registerForHeadersReceived (session, partition) {
  const isPrivate = module.exports.isPrivate(partition)
  session.webRequest.onHeadersReceived(function (details, muonCb) {
    // Using an electron binary which isn't from Brave
    if (shouldIgnoreUrl(details)) {
      muonCb({})
      return
    }
    if ((isTorrentFile(details)) && partition === appConfig.tor.partition) {
      onBlockedInTor(details, muonCb)
      return
    }
    const firstPartyUrl = module.exports.getMainFrameUrl(details)
    // this can happen if the tab is closed and the webContents is no longer available
    if (!firstPartyUrl) {
      muonCb({})
      return
    }

    let parsedTargetUrl = urlParse(details.url || '')
    let parsedFirstPartyUrl = urlParse(firstPartyUrl)
    const trackableSecurityHeaders = ['Strict-Transport-Security', 'Expect-CT',
      'Public-Key-Pins', 'Public-Key-Pins-Report-Only']
    if (isThirdPartyHost(parsedFirstPartyUrl.hostname, parsedTargetUrl.hostname)) {
      trackableSecurityHeaders.forEach(function (header) {
        delete details.responseHeaders[header]
        delete details.responseHeaders[header.toLowerCase()]
      })
    }

    for (let i = 0; i < headersReceivedFilteringFns.length; i++) {
      let results = headersReceivedFilteringFns[i](details, isPrivate)
      if (!module.exports.isResourceEnabled(results.resourceName, firstPartyUrl, isPrivate)) {
        continue
      }
      if (results.cancel) {
        muonCb({ cancel: true })
        return
      }
      if (results.responseHeaders) {
        muonCb({
          responseHeaders: results.responseHeaders,
          statusLine: results.statusLine
        })
        return
      }
    }
    muonCb({
      responseHeaders: details.responseHeaders,
      statusLine: details.statusLine
    })
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
  session.setPermissionRequestHandler((mainFrameOrigin, requestingUrl, permissionTypes, muonCb) => {
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

    // TODO(bridiver) - the permission handling should be converted to an action because we should never call `appStore.getState()`
    // Check whether there is a persistent site setting for this host
    const appState = appStore.getState()
    const isBraveOrigin = mainFrameOrigin.startsWith(`chrome-extension://${config.braveExtensionId}/`)
    const isPDFOrigin = mainFrameOrigin.startsWith(`${pdfjsOrigin}/`)
    let response = []

    if (!requestingUrl) {
      response = new Array(permissionTypes.length)
      response.fill(false, 0, permissionTypes.length)
      muonCb(response)
      return
    }

    for (let i = 0; i < permissionTypes.length; i++) {
      const responseSizeThisIteration = response.length
      const permission = permissionTypes[i]
      const alwaysAllowFullscreen = module.exports.alwaysAllowFullscreen() === fullscreenOption.ALWAYS_ALLOW
      const isFullscreen = permission === 'fullscreen'
      const isOpenExternal = permission === 'openExternal'

      let requestingOrigin

      if (requestingUrl === appUrlUtil.getBraveExtIndexHTML() || isPDFOrigin || isBraveOrigin) {
        // lookup, display and store site settings by the origin alias
        requestingOrigin = isPDFOrigin ? 'PDF Viewer' : 'Brave Browser'
        // display on all tabs
        mainFrameOrigin = null
      } else if (isOpenExternal) {
        // Open external is a special case since we want to apply the permission
        // for the entire scheme to avoid cluttering the saved permissions. See
        // https://github.com/brave/browser-laptop/issues/13642
        const protocol = urlParse(requestingUrl).protocol
        requestingOrigin = protocol ? `${protocol} URLs` : requestingUrl
      } else {
        requestingOrigin = getOrigin(requestingUrl) || requestingUrl
      }

      // Look up by host pattern since requestingOrigin is not necessarily
      // a parseable URL
      const settings = siteSettings.getSiteSettingsForHostPattern(appState.get('siteSettings'), requestingOrigin)
      const tempSettings = siteSettings.getSiteSettingsForHostPattern(appState.get('temporarySiteSettings'), requestingOrigin)

      if (!permissions[permission]) {
        console.warn('WARNING: got unregistered permission request', permission)
        response.push(false)
      } else if (permission === 'geolocation' && partition === appConfig.tor.partition) {
        // Never allow geolocation in Tor mode
        response.push(false)
      } else if (isFullscreen && mainFrameOrigin &&
        // The Torrent Viewer extension is always allowed to show fullscreen media
        mainFrameOrigin.startsWith('chrome-extension://' + config.torrentExtensionId)) {
        response.push(true)
      } else if (isFullscreen && alwaysAllowFullscreen) {
        // Always allow fullscreen if setting is ON
        response.push(true)
      } else if (isOpenExternal && (
        // The Brave extension and PDFJS are always allowed to open files in an external app
        isPDFOrigin || isBraveOrigin)) {
        response.push(true)
      } else {
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
          response.push(isAllowed)
        }
      }

      const message = locale.translation('permissionMessage').replace(/{{\s*host\s*}}/, requestingOrigin).replace(/{{\s*permission\s*}}/, permissions[permission].action)

      // If this is a duplicate, clear the previous callback and use the new one
      if (permissionCallbacks[message]) {
        permissionCallbacks[message](0, false)
      }

      const responseAutoAdded = responseSizeThisIteration !== response.length
      if (!responseAutoAdded) {
        appActions.showNotification({
          buttons: [
            {text: locale.translation('deny')},
            {text: locale.translation('allow')}
          ],
          frameOrigin: getOrigin(mainFrameOrigin),
          options: {
            persist: !!requestingOrigin,
            index: i
          },
          message
        })

        // Use a closure here for the index instead of passing an index to the
        // function because ipcMain.on(messages.NOTIFICATION_RESPONSE above
        // calls into the callback without knowing an index.
        const index = i
        permissionCallbacks[message] = (buttonIndex, persist) => {
          // hide the notification if this was triggered automatically
          appActions.hideNotification(message)
          const result = !!(buttonIndex)
          response[index] = result
          if (persist) {
            // remember site setting for this host
            appActions.changeSiteSetting(requestingOrigin, permission + 'Permission', result, isPrivate)
          }
          if (response.length === permissionTypes.length) {
            permissionCallbacks[message] = null
            muonCb(response)
          }
        }
      }
    }
    if (response.length === permissionTypes.length) {
      muonCb(response)
    }
  })
}

function updateDownloadState (win, downloadId, item, state) {
  updateElectronDownloadItem(win, downloadId, item, state)

  if (!item) {
    appActions.mergeDownloadDetail(downloadId, { state: downloadStates.INTERRUPTED })
    return
  }

  const downloadItemStartTime = appStore.getState().getIn(['downloads', downloadId, 'startTime'])
  appActions.mergeDownloadDetail(downloadId, {
    startTime: downloadItemStartTime || new Date().getTime(),
    savePath: item.getSavePath(),
    url: item.getURL(),
    filename: (item.getSavePath() && path.basename(item.getSavePath())) || item.getFilename(),
    totalBytes: item.getTotalBytes(),
    receivedBytes: item.getReceivedBytes(),
    state
  })
}

function registerForDownloadListener (session) {
  var repaint = false
  session.on('default-download-directory-changed', (e, newPath) => {
    if (newPath !== getSetting(settings.DOWNLOAD_DEFAULT_PATH)) {
      appActions.changeSetting(settings.DOWNLOAD_DEFAULT_PATH, newPath)
    }
  })

  session.on('will-download', function (event, item, webContents) {
    if (webContents.isDestroyed()) {
      if (shouldDebugTabEvents) {
        console.log(`Tab [DESTROYED] will-download`)
      }
      event.preventDefault()
      return
    }

    if (shouldDebugTabEvents) {
      const tabId = webContents.getId ? webContents.getId() : 'NOT_TAB'
      console.log(`Tab [${tabId}] will-download`)
    }
    const hostWebContents = webContents.hostWebContents || webContents
    const win = BrowserWindow.fromWebContents(hostWebContents) || BrowserWindow.getFocusedWindow()

    item.setPrompt(getSetting(settings.DOWNLOAD_ALWAYS_ASK) || false)

    const downloadId = item.getGuid()
    repaint = true
    item.on('updated', function (e, st) {
      if (!item.getSavePath()) {
        return
      }
      const state = item.isPaused() ? downloadStates.PAUSED : downloadStates.IN_PROGRESS
      updateDownloadState(win, downloadId, item, state)
      if (win && !win.isDestroyed() && !win.webContents.isDestroyed() && repaint) {
        win.webContents.send(messages.SHOW_DOWNLOADS_TOOLBAR)
        repaint = false
      }
      item.on('removed', function () {
        updateElectronDownloadItem(downloadId, item, downloadStates.CANCELLED)
        appActions.mergeDownloadDetail(downloadId)
      })

      // Change state if download path is protected
      const fs = require('fs')
      fs.access(path.dirname(item.getSavePath()), fs.constants.R_OK | fs.constants.W_OK, (err) => {
        if (err) {
          const state = downloadStates.UNAUTHORIZED
          updateDownloadState(win, downloadId, item, state)
        }
      })
    })

    item.on('done', function (e, state) {
      if (!item.getSavePath()) {
        return
      }
      updateDownloadState(win, downloadId, item, state)
    })
  })
}

function registerForMagnetHandler (session, partition) {
  if (partition === appConfig.tor.partition) {
    return
  }
  const webtorrentUrl = appUrlUtil.getTorrentExtUrl('webtorrent.html')
  try {
    if (getSetting(settings.TORRENT_VIEWER_ENABLED)) {
      // Loading webtorrentUrl from external sources will fail since it is
      // not whitelisted in web_accessible_resources. However the protocol
      // registration is needed so that onBeforeRequest can handle magnet:
      // requests.
      session.protocol.registerNavigatorHandler('magnet', `${webtorrentUrl}#%s`)
    } else {
      session.protocol.unregisterNavigatorHandler('magnet', `${webtorrentUrl}#%s`)
    }
  } catch (e) {
    console.warn('Could not register magnet URL handler. Are you using the latest electron?')
  }
}

module.exports.setTorNewIdentity = (url, tabId) => {
  const ses = session.fromPartition(appConfig.tor.partition)
  if (!ses || !url) {
    return
  }
  ses.setTorNewIdentity(url, () => {
    const tab = webContentsCache.getWebContents(tabId)
    if (tab && !tab.isDestroyed()) {
      tab.reload(true)
    }
  })
}

module.exports.relaunchTor = () => {
  const ses = session.fromPartition(appConfig.tor.partition)
  if (!ses) {
    console.log('Tor session no longer exists. Cannot restart Tor.')
    return
  }
  appActions.onTorOnline(false)
  try {
    console.log('tor: relaunch')
    ses.relaunchTor()
  } catch (e) {
    appActions.onTorError(`Could not restart Tor: ${e}`)
  }
}

function initSession (ses, partition) {
  registeredSessions[partition] = ses
  ses.setEnableBrotli(true)
  ses.userPrefs.setDefaultZoomLevel(getSetting(settings.DEFAULT_ZOOM_LEVEL) || config.zoom.defaultValue)
}

const initPartition = (partition) => {
  const isTorPartition = partition === appConfig.tor.partition
  // Partitions can only be initialized once the app is ready
  if (!app.isReady()) {
    partitionsToInitialize.push(partition)
    return
  }
  if (initializedPartitions[partition]) {
    return
  }
  initializedPartitions[partition] = true

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
  if (isTorPartition) {
    try {
      setupTor()
    } catch (e) {
      appActions.onTorError(`Could not start Tor: ${e}`)
    }
    // TODO(riastradh): Duplicate logic in app/browser/tabs.js.
    options.isolated_storage = true
    options.parent_partition = ''
    options.tor_proxy = getTorSocksProxy()
    if (process.platform === 'win32') {
      options.tor_path = path.join(getExtensionsPath('bin'), 'tor.exe')
    } else {
      options.tor_path = path.join(getExtensionsPath('bin'), 'tor')
    }
  }

  let ses = session.fromPartition(partition, options)

  fns.forEach((fn) => {
    fn(ses, partition, module.exports.isPrivate(partition))
  })
  ses.on('register-navigator-handler', (e, protocol, location) => {
    appActions.navigatorHandlerRegistered(ses.partition, protocol, location)
  })
  ses.on('unregister-navigator-handler', (e, protocol, location) => {
    appActions.navigatorHandlerUnregistered(ses.partition, protocol, location)
  })
  ses.protocol.getNavigatorHandlers().forEach((handler) => {
    appActions.navigatorHandlerRegistered(ses.partition, handler.protocol, handler.location)
  })
}
module.exports.initPartition = initPartition

function setupTor () {
  let timer = null
  const setTorErrorOnTimeout = (delay, msg) => {
    if (timer === null) {
      timer = setTimeout(() => {
        appActions.onTorError(msg)
        console.log(`tor timeout: ${msg}`)
      }, delay)
    }
  }
  const initialized = () => {
    if (timer !== null) {
      clearTimeout(timer)
      timer = null
    }
  }
  const onTorError = (msg) => {
    initialized()
    appActions.onTorError(msg)
    console.warn(`tor error: ${msg}`)
  }
  const onTorOnline = (online) => {
    initialized()
    appActions.onTorOnline(online)
  }
  // If Tor has not successfully initialized or thrown an error within 20s,
  // assume it's broken.
  setTorErrorOnTimeout(20000, 'Tor could not start.')
  // Set up the tor daemon watcher.  (NOTE: We don't actually start
  // the tor daemon here; that happens in C++ code.  But we do talk to
  // its control socket.)
  const torDaemon = new tor.TorDaemon()
  torDaemon.setup((err) => {
    if (err) {
      onTorError(`Tor failed to make directories: ${err}`)
      return
    }
    torDaemon.on('exit', () => onTorError('The Tor process has exited.'))
    torDaemon.on('launch', (socksAddr) => {
      const version = torDaemon.getVersion()
      console.log(`tor: daemon listens on ${socksAddr}, version ${version}`)
      if (version) {
        appActions.setVersionInfo('Tor', version)
      }
      const bootstrapped = (err, progress) => {
        if (err) {
          console.warn(`tor: bootstrap ${progress}% error: ${err}`)
          onTorError(`Tor bootstrap error: ${err}`)
          return
        }
        appActions.onTorInitPercentage(progress)
      }
      const networkLiveness = (live) => {
        if (live) {
          // Network is now live.
          onTorOnline(true)
        } else if (timer === null) {
          // We were online before; now we are not.
          onTorOnline(false)
          // Wait for tor to reconnect.
          setTorErrorOnTimeout(17000, 'Tor could not reconnect.')
        }
      }
      const circuitEstablished = (err, established) => {
        if (err && established === null) {
          onTorError(`Tor circuit error: ${err}`)
          return
        }
        if (established) {
          // Circuit is now established.
          onTorOnline(true)
        } else if (timer === null) {
          // We were online before; now we are not.
          onTorOnline(false)
          // Wait for tor to reconnect.
          setTorErrorOnTimeout(17000, 'Tor could not reconnect.')
        }
      }
      torDaemon.onBootstrap(bootstrapped, (err) => {
        if (err) {
          onTorError(`Tor error subscribing to bootstrap event: ${err}`)
        }
        torDaemon.onNetworkLiveness(networkLiveness, (err) => {
          if (err) {
            onTorError(`Tor error subscribing to network liveness: ${err}`)
          }
          torDaemon.onCircuitEstablished(circuitEstablished, (err) => {
            if (err) {
              onTorError(
                `Tor error subscribing to circuit establishment: ${err}`)
            }
          })
        })
      })
    })
    torDaemon.start()
  })
}

const filterableProtocols = ['http:', 'https:', 'ws:', 'wss:', 'magnet:', 'file:']

function shouldIgnoreUrl (details) {
  // data:, is a special origin from SecurityOrigin::urlWithUniqueSecurityOrigin
  // and usually occurs when there is an https in an http main frame
  if (details.firstPartyUrl === 'data:,' || details.url === 'data:,') {
    return false
  }

  // Ensure host is well-formed (RFC 1035) and has a non-empty hostname
  try {
    // firstPartyUrl can be empty in some cases so fallback to the url
    const firstPartyUrl = urlParse(details.firstPartyUrl || details.url)
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
  const ses = session.fromPartition(partition)
  if (!ses) {
    return false
  }
  return ses.isOffTheRecord()
}

module.exports.init = (state, action, store) => {
  appStore = store

  partitionsToInitialize.forEach((partition) => {
    initPartition(partition)
  })
  ipcMain.on(messages.NOTIFICATION_RESPONSE, (e, message, buttonIndex, persist) => {
    if (permissionCallbacks[message]) {
      permissionCallbacks[message](buttonIndex, persist)
    }
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

/**
 * Returns whether a resource is enabled for url. For COOKIEBLOCK, returns
 * the either false or the string value of the cookie setting.
 * @param {string} resourceName
 * @param {string} url
 * @param {boolean=} isPrivate
 * @returns {boolean|string}
 */
module.exports.isResourceEnabled = (resourceName, url, isPrivate) => {
  if (resourceName === 'siteHacks') {
    return true
  }

  // TODO(bridiver) - need to clean up the rest of this so web can
  // remove this because it duplicates checks made in siteSettings
  // and not all resources  are controlled by shields up/down
  if (resourceName === 'flash') {
    return true
  }
  const appState = appStore.getState()
  const settingsState = appState.get('settings')

  if (resourceName === 'pdfjs') {
    return getSetting(settings.PDFJS_ENABLED, settingsState)
  }

  if (resourceName === 'webtorrent') {
    return extensionState.isWebTorrentEnabled(appState)
  }

  if (resourceName === 'ledger') {
    return getSetting(settings.PAYMENTS_ENABLED, settingsState)
  }

  if (resourceName === 'ledgerMedia') {
    return getSetting(settings.PAYMENTS_ALLOW_MEDIA_PUBLISHERS, settingsState)
  }

  if (resourceName === 'firewall') {
    return siteSettings.braveryDefaults(appState, appConfig).firewall
  }

  const braverySettings = getBraverySettingsForUrl(url, appState, isPrivate)

  // If full shields are down never enable extra protection
  if (braverySettings.shieldsUp === false) {
    return false
  }

  if (resourceName === appConfig.resourceNames.ADBLOCK ||
      (appConfig[resourceName] &&
        appConfig[resourceName].enabled &&
        appConfig[resourceName].resourceType === adBlockResourceName) ||
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
      // Return the cookieControl setting
      return braverySettings.cookieControl
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
 */
module.exports.clearStorageData = () => {
  for (let partition in registeredSessions) {
    let ses = registeredSessions[partition]
    setImmediate(() => {
      ses.clearStorageData.bind(ses)(() => {})
    })
  }
}

module.exports.clearHSTSData = () => {
  for (let partition in registeredSessions) {
    let ses = registeredSessions[partition]
    setImmediate(() => {
      ses.clearHSTSData.bind(ses)(() => {})
    })
  }
}

/**
 * Clears all session caches.
 */
module.exports.clearCache = () => {
  for (let partition in registeredSessions) {
    let ses = registeredSessions[partition]
    setImmediate(() => {
      ses.clearCache.bind(ses)(() => {})
    })
  }
}

module.exports.clearHistory = () => {
  for (let partition in registeredSessions) {
    let ses = registeredSessions[partition]
    setImmediate(ses.clearHistory.bind(ses))
  }
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
  let url = null
  const tab = webContents.fromTabID(details.tabId)
  if (tab && !tab.isDestroyed()) {
    url = tab.getURL()
  }
  if (!url && details.firstPartyUrl) {
    url = details.firstPartyUrl
  }
  return url
}

module.exports.alwaysAllowFullscreen = () => {
  return getSetting(settings.FULLSCREEN_CONTENT)
}
