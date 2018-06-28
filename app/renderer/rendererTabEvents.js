/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const Immutable = require('immutable')
const electron = require('electron')

const windowStore = require('../../js/stores/windowStore')
const appStore = require('../../js/stores/appStoreRenderer')

const windowActions = require('../../js/actions/windowActions')
const appActions = require('../../js/actions/appActions')
const tabActions = require('../common/actions/tabActions')

const tabState = require('../common/state/tabState')
const frameStateUtil = require('../../js/state/frameStateUtil')
const contextMenus = require('../../js/contextMenus')
const siteSettings = require('../../js/state/siteSettings')
const siteSettingsState = require('../common/state/siteSettingsState')
const contextMenuState = require('../common/state/contextMenuState')

const domUtil = require('./lib/domUtil')
const faviconUtil = require('../../js/lib/faviconUtil')
const imageUtil = require('../../js/lib/imageUtil')
const historyUtil = require('../common/lib/historyUtil')
const UrlUtil = require('../../js/lib/urlutil')
const {isFrameError, isAborted} = require('../common/lib/httpUtil')
const {
  aboutUrls,
  isTargetAboutUrl
} = require('../../js/lib/appUrlUtil')
const urlParse = require('../common/urlParse')
const locale = require('../../js/l10n')
const config = require('../../js/constants/config')
const appConfig = require('../../js/constants/appConfig')
const messages = require('../../js/constants/messages')

// TODO: cleanup on frame leaving window
const frameNotificationCallbacks = new Map()
// Counter for detecting PDF URL redirect loops
const frameReloadCounter = new Map()

function getFrameByTabId (tabId) {
  return frameStateUtil.getFrameByTabId(windowStore.state, tabId) || Immutable.Map()
}

function getTab (tabId) {
  if (!appStore.state.get('tabs')) {
    return undefined
  }
  return appStore.state.get('tabs').find((tab) => tab.get('tabId') === tabId)
}

const eventsWithNoAction = ['tab-inserted-at', 'will-destroy', 'destroyed']

const api = module.exports = {
  handleTabEvent (tabId, eventType, e, shouldDebug = false, frame = getFrameByTabId(tabId)) {
    // we don't care about certain events
    if (eventsWithNoAction.includes(eventType)) {
      return
    }
    // If frame is not in state yet, queue the event.
    // Whilst any actions dispatched by this function will reach the store
    // *after* the frame creation event, some of these events require the frame to
    // already exist in order to make some processing decisions,
    // though that should be refactored so that the state-processing is done in
    // the reducers.
    if (!frame || frame.isEmpty()) {
      if (shouldDebug) {
        console.debug('%cNo frame for event yet, queueing until later', 'color: red', tabId, eventType)
      }
      windowStore.once(`new-frame-${tabId}`, (newFrame) => {
        if (shouldDebug) {
          console.debug('%cFrame now exists, re-running event handler', 'color: green', tabId, eventType)
        }
        api.handleTabEvent(tabId, eventType, e, shouldDebug, newFrame)
      })
      return
    }

    switch (eventType) {
      case 'tab-detached-at': {
        windowActions.removeFrame(tabId)
        break
      }
      case 'content-blocked': {
        if (e.details[0] === 'javascript' && e.details[1]) {
          windowActions.setBlockedBy(tabId, 'noScript', e.details[1])
        }
        if (e.details[0] === 'autoplay') {
          appActions.autoplayBlocked(tabId)
        }
        break
      }
      case 'did-block-run-insecure-content': {
        windowActions.setBlockedRunInsecureContent(frame, e.details[0])
        break
      }
      case 'context-menu': {
        contextMenus.onMainContextMenu(e.params, frame, getTab(tabId))
        e.preventDefault()
        e.stopPropagation()
        break
      }
      case 'update-target-url': {
        const downloadBarHeight = domUtil.getStyleConstants('download-bar-height')
        let nearBottom = e.y > (window.innerHeight - 150 - downloadBarHeight)
        let mouseOnLeft = e.x < (window.innerWidth / 2)
        let showOnRight = nearBottom && mouseOnLeft
        windowActions.setLinkHoverPreview(e.url, showOnRight)
        break
      }
      case 'page-favicon-updated': {
        if (frameStateUtil.isTor(frame)) {
          // This will be set as a data: URL by the page content script
          break
        }
        if (e.favicons &&
            e.favicons.length > 0) {
          const url = faviconUtil.wrapFaviconUrl(e.favicons[0])
          // Favicon changes lead to recalculation of top site data so only fire
          // this when needed.  Some sites update favicons very frequently.
          if (url !== frame.get('icon')) {
            imageUtil.getWorkingImageUrl(url, (error) => {
              windowActions.setFavicon(frame, error ? null : url)
            })
          }
        }
        break
      }
      case 'show-autofill-settings': {
        appActions.createTabRequested({
          url: 'about:autofill',
          active: true
        })
        break
      }
      case 'show-autofill-popup': {
        contextMenus.onShowAutofillMenu(e.suggestions, e.rect, frame)
        break
      }
      case 'hide-autofill-popup': {
        const contextMenu = contextMenuState.getContextMenu(windowStore.state)
        const isAutoFillContextMenu = contextMenu && contextMenu.get('type') === 'autofill'
        if (isAutoFillContextMenu) {
          windowActions.autofillPopupHidden(tabId)
        }
        break
      }
      case 'load-start': {
        if (
          e.isMainFrame &&
          !e.isErrorPage &&
          !e.isFrameSrcDoc
        ) {
          if (e.url &&
            e.url.startsWith(appConfig.noScript.twitterRedirectUrl) &&
            getSiteSettings(frame).get('noScript')) {
            // This result will be canceled immediately by sitehacks, so don't
            // update the load state; otherwise it will not show the security
            // icon.
            break
          }
          windowActions.onWebviewLoadStart(frame, e.url)
        }
        break
      }
      case 'did-fail-provisional-load': {
        if (e.isMainFrame) {
          loadEnd(tabId, frame, false, e.validatedURL, false)
          loadFail(tabId, frame, e, true, e.currentURL)
        }
        break
      }
      case 'did-fail-load': {
        if (e.isMainFrame) {
          loadEnd(tabId, frame, false, e.validatedURL, false)
          loadFail(tabId, frame, e, false, e.validatedURL)
        }
        break
      }
      case 'did-finish-load': {
        loadEnd(tabId, frame, true, e.validatedURL, false)
        if (getSiteSettings(frame).get('runInsecureContent')) {
          const origin = tabState.getVisibleOrigin(appStore.state, tabId)
          const isPrivate = frame.get('isPrivate', false)
          appActions.removeSiteSetting(origin, 'runInsecureContent', isPrivate)
        }
        break
      }
      case 'did-navigate-in-page': {
        if (e.isMainFrame) {
          windowActions.setNavigated(e.url, frame.get('key'), true, tabId)
          loadEnd(tabId, frame, true, e.url, true)
        }
        break
      }
      case 'did-navigate': {
        const frameKey = frame.get('key')
        const findBarShown = frame.get('findbarShown')
        // hide the find bar if it's showing
        if (findBarShown) {
          frameStateUtil.onFindBarHide(frameKey, tabId)
        }
        // hide notifications
        for (let message in getFrameNotificationCallbacks(frameKey)) {
          appActions.hideNotification(message)
        }
        clearFrameNotificationCallbacks(frameKey)
        windowActions.setNavigated(e.url, frameKey, false, tabId)
        break
      }
      case 'did-change-theme-color': {
        const themeColor = e.themeColor
        // Due to a bug in Electron, after navigating to a page with a theme color
        // to a page without a theme color, the background is sent to us as black
        // even know there is no background. To work around this we just ignore
        // the theme color in that case and let the computed theme color take over.
        windowActions.setThemeColor(frame, themeColor !== '#000000' ? themeColor : null)
        break
      }
      case 'found-in-page': {
        if (e.result !== undefined && (e.result.matches !== undefined || e.result.activeMatchOrdinal !== undefined)) {
          const frameKey = frame.get('key')
          if (e.result.matches === 0) {
            windowActions.setFindDetail(frameKey, Immutable.fromJS({
              numberOfMatches: 0,
              activeMatchOrdinal: 0
            }))
            break
          }

          windowActions.setFindDetail(frameKey, Immutable.fromJS({
            numberOfMatches: e.result.matches || -1,
            activeMatchOrdinal: e.result.activeMatchOrdinal || -1
          }))
        }
        break
      }
      case 'security-style-changed': {
        let isSecure = null
        let runInsecureContent = getSiteSettings(frame).get('runInsecureContent')
        let evCert = null
        if (e.securityState === 'secure') {
          isSecure = true
        } else if (e.securityState === 'insecure') {
          // Passive mixed content should not upgrade an insecure connection to a
          // partially-secure connection. It can only downgrade a secure
          // connection.
          const frameIsSecure = frame.getIn(['security', 'isSecure'])
          isSecure =
            e.securityInfo.mixedContentStatus === 'content-status-displayed' && frameIsSecure !== false
            ? 1
            : false
        } else if (e.securityState === 'broken') {
          isSecure = false
          const location = frame.get('location')
          const parsedUrl = urlParse(location)
          electron.ipcRenderer.send(messages.CHECK_CERT_ERROR_ACCEPTED, parsedUrl.host, tabId)
        }

        if (e.securityInfo.securityLevel === 'ev-secure') {
          if (e.securityInfo.certificate &&
              e.securityInfo.certificate.organizationNames.length) {
            const countryName = e.securityInfo.certificate.countryName
            const organizationName = e.securityInfo.certificate.organizationNames[0]
            evCert = organizationName
            if (countryName) {
              evCert += ` [${countryName}]`
            }
          }
        }
        windowActions.setSecurityState(tabId, {
          secure: runInsecureContent ? false : isSecure,
          runInsecureContent,
          evCert
        })
        break
      }
      case 'ipc-message': {
        handleTabIpcMessage(tabId, frame, e)
        break
      }
    }
  }
}

function handleTabIpcMessage (tabId, frame, e) {
  let method = () => {}
  switch (e.channel) {
    case messages.GOT_CANVAS_FINGERPRINTING: {
      method = (detail) => {
        const provisionalLocation = frame.get('provisionalLocation')
        const description = [detail.type, detail.scriptUrl || provisionalLocation].join(': ')
        windowActions.setBlockedBy(tabId, 'fingerprintingProtection', description)
      }
      break
    }
    case messages.THEME_COLOR_COMPUTED: {
      method = (computedThemeColor) =>
        windowActions.setThemeColor(frame, undefined, computedThemeColor || null)
      break
    }
    case messages.CONTEXT_MENU_OPENED: {
      method = (nodeProps, contextMenuType) => {
        contextMenus.onMainContextMenu(nodeProps, frame, getTab(tabId), contextMenuType)
      }
      break
    }
    case messages.STOP_LOAD: {
      method = () => getWebContents(tabId, (webContents) => webContents && webContents.stop())
      break
    }
    case messages.GO_BACK: {
      method = () => appActions.onGoBack(tabId)
      break
    }
    case messages.GO_FORWARD: {
      method = () => appActions.onGoForward(tabId)
      break
    }
    case messages.RELOAD: {
      method = () => {
        const location = frame.get('location')
        const frameKey = frame.get('key')
        if (!frameReloadCounter.has(frameKey)) {
          frameReloadCounter.set(frameKey, new Map())
        }
        const reloadCounter = frameReloadCounter.get(frameKey)
        const locationReloadCount = reloadCounter.get(location) || 0
        if (locationReloadCount < 2) {
          tabActions.reload(tabId)
          reloadCounter.set(location, locationReloadCount + 1)
        }
      }
      break
    }
    case messages.CLEAR_BROWSING_DATA_NOW: {
      method = () =>
        windowActions.setClearBrowsingDataPanelVisible(true)
      break
    }
    case messages.AUTOFILL_SET_ADDRESS: {
      method = (currentDetail) =>
        windowActions.setAutofillAddressDetail(null, null, currentDetail)
      break
    }
    case messages.AUTOFILL_SET_CREDIT_CARD: {
      method = (currentDetail) =>
        windowActions.setAutofillCreditCardDetail(null, null, currentDetail)
      break
    }
    case messages.HIDE_CONTEXT_MENU: {
      method = () => windowActions.setContextMenuDetail()
      break
    }
    case messages.RECREATE_TOR_TAB: {
      const tab = getTab(tabId)
      method = (torEnabled) => {
        appActions.recreateTorTab(torEnabled, tabId,
          tab ? tab.get('index') : undefined)
      }
      break
    }
    case messages.GOT_PAGE_FAVICON: {
      method = (dataUrl) => {
        if (frameStateUtil.isTor(frame)) {
          windowActions.setFavicon(frame, dataUrl)
        }
      }
      break
    }
  }
  method.apply(null, e.args)
}

function getWebContents (tabId, cb) {
  electron.remote.getWebContents(tabId, (webContents) => {
    if (webContents && !webContents.isDestroyed()) {
      cb(webContents)
    } else {
      cb()
    }
  })
}

function isPDFJSURL (url) {
  const pdfjsOrigin = `chrome-extension://${config.PDFJSExtensionId}/`
  return url && url.startsWith(pdfjsOrigin)
}

function loadEnd (tabId, frame, savePage, url, inPageNav) {
  if (frame.isEmpty()) {
    return
  }
  windowActions.onWebviewLoadEnd(frame, url)
  const parsedUrl = urlParse(url)
  if (!allowRunningWidevinePlugin(tabId, frame)) {
    showWidevineNotification(tabId, frame, () => {
    }, () => {
      appActions.loadURLRequested(tabId, frame.get('provisionalLocation'))
    })
  }

  const protocol = parsedUrl.protocol
  const isPrivate = frame.get('isPrivate')
  const isError = frame.getIn(['aboutDetails', 'errorCode'])
  if (!isPrivate && (protocol === 'http:' || protocol === 'https:') && !isError && savePage && !inPageNav) {
    // Register the site for recent history for navigation bar
    // calling with setTimeout is an ugly hack for a race condition
    // with setTitle and setFavicon.
    // We either need to delay this call until the title and favicon are set,
    // or add a way to update it.
    // However, it's possible that the frame could be destroyed, or in a bad
    // way by then, so make sure we do a null check.
    setTimeout(() => {
      const currentFrame = getFrameByTabId(tabId)
      const siteDetail = historyUtil.getDetailFromFrame(currentFrame)
      if (siteDetail) {
        appActions.addHistorySite(siteDetail)
      } else if (process.env.NODE_ENV !== 'production') {
        // log, in case we decide we want these entries to go in to the history
        // but do not send a null entry to history as it will be rejected
        console.error('frame: siteDetail was null when calling addHistorySite')
      }
    }, 250)
  }

  if (isPDFJSURL(url)) {
    let displayLocation = UrlUtil.getLocationIfPDF(url)
    windowActions.setSecurityState(tabId, {
      secure: urlParse(displayLocation).protocol === 'https:',
      runInsecureContent: false
    })
  }
}

function loadFail (tabId, frame, e, provisionLoadFailure, url) {
  if (isFrameError(e.errorCode)) {
    // temporary workaround for https://github.com/brave/browser-laptop/issues/1817
    if (e.validatedURL === aboutUrls.get('about:newtab') ||
        e.validatedURL === aboutUrls.get('about:blank') ||
        e.validatedURL === aboutUrls.get('about:certerror') ||
        e.validatedURL === aboutUrls.get('about:error') ||
        e.validatedURL === aboutUrls.get('about:safebrowsing')) {
      // this will just display a blank page for errors
      // but we don't want to take the user out of the private tab
      return
    } else if (isTargetAboutUrl(e.validatedURL)) {
      // open a new tab for other about urls
      // and send this tab back to wherever it came from
      appActions.onGoBack(tabId)
      appActions.createTabRequested({
        url: e.validatedURL,
        active: true
      })
      return
    }

    windowActions.setFrameError(frame, {
      event_type: 'did-fail-load',
      errorCode: e.errorCode,
      url: e.validatedURL
    })
    const key = historyUtil.getKey(frame)
    appActions.loadURLRequested(tabId, 'about:error')
    appActions.removeHistorySite(key)
  } else if (isAborted(e.errorCode)) {
    // just stay put
  } else if (provisionLoadFailure) {
    windowActions.setNavigated(url, frame.get('key'), true, tabId)
  }
}

function getSiteSettings (frame) {
  const location = frame.get('location')
  const isPrivate = frame.get('isPrivate', false)
  const allSiteSettings = siteSettingsState.getAllSiteSettings(appStore.state, isPrivate)
  const frameSiteSettings = siteSettings.getSiteSettingsForURL(allSiteSettings, location) || Immutable.Map()
  return frameSiteSettings
}

function allowRunningWidevinePlugin (tabId, frame) {
  const state = appStore.state
  const isWidevineEnabled = state.get('widevine') && state.getIn(['widevine', 'enabled'])
  const origin = tabState.getVisibleOrigin(state, tabId)
  const frameSiteSettings = getSiteSettings(frame)
  const isPrivate = frame && frame.get('isPrivate', false)
  const hasAllSiteSettings = !!siteSettingsState.getAllSiteSettings(appStore.state, isPrivate)
  const widevine = frameSiteSettings.get('widevine')
  if (!isWidevineEnabled) {
    return false
  }
  if (!origin) {
    return false
  }
  // Check for at least one CtP allowed on this origin
  if (!hasAllSiteSettings) {
    return false
  }
  if (typeof widevine === 'number') {
    return true
  }
  return false
}

/**
 * Shows a Widevine CtP notification if Widevine is installed and enabled.
 * If not enabled, alert user that Widevine is installed.
 * @param {string} origin - frame origin that is requesting to run widevine.
 *   can either be main frame or subframe.
 * @param {function=} noWidevineCallback - Optional callback to run if Widevine is not
 *   installed
 * @param {function=} widevineCallback - Optional callback to run if Widevine is
 *   accepted
 */
function showWidevineNotification (tabId, frame, noWidevineCallback, widevineCallback) {
  if (frameStateUtil.isTor(frame)) {
    // Never show widevine prompts on a Tor tab (needed for
    // https://github.com/brave/browser-laptop/issues/13626)
    return
  }
  // https://www.nfl.com is said to be a widevine site but it actually uses Flash for me Oct 10, 2016
  const widevineSites = ['https://www.netflix.com',
    'http://bitmovin.com',
    'https://www.primevideo.com',
    'https://www.spotify.com',
    'https://shaka-player-demo.appspot.com']
  const state = appStore.state
  const origin = tabState.getVisibleOrigin(state, tabId)
  const location = frame.get('location')
  const isForWidevineTest = process.env.NODE_ENV === 'test' && location.endsWith('/drm.html')
  if (!isForWidevineTest && (!origin || !widevineSites.includes(origin))) {
    noWidevineCallback()
    return
  }

  // Generate a random string that is unlikely to collide. Not
  // cryptographically random.
  const nonce = Math.random().toString()
  const isWidevineEnabled = state.get('widevine') && state.getIn(['widevine', 'enabled'])
  if (isWidevineEnabled) {
    const message = locale.translation('allowWidevine').replace(/{{\s*origin\s*}}/, origin)
    // Show Widevine notification bar
    appActions.showNotification({
      buttons: [
        {text: locale.translation('deny')},
        {text: locale.translation('allow')}
      ],
      message,
      frameOrigin: origin,
      options: {
        nonce,
        persist: true
      }
    })
    getFrameNotificationCallbacks(frame.get('key'))[message] = (buttonIndex, persist) => {
      if (buttonIndex === 1) {
        if (persist) {
          appActions.changeSiteSetting(origin, 'widevine', 1)
        } else {
          appActions.changeSiteSetting(origin, 'widevine', 0)
        }
        if (widevineCallback) {
          widevineCallback()
        }
      } else {
        if (persist) {
          appActions.changeSiteSetting(origin, 'widevine', false)
        }
      }
      appActions.hideNotification(message)
    }
  } else {
    windowActions.widevineSiteAccessedWithoutInstall()
  }

  electron.ipcRenderer.once(messages.NOTIFICATION_RESPONSE + nonce, (e, msg, buttonIndex, persist) => {
    const cb = getFrameNotificationCallbacks(frame.get('key'))[msg]
    if (cb) {
      cb(buttonIndex, persist)
    }
  })
}

function getFrameNotificationCallbacks (frameKey, message, cb) {
  if (!frameNotificationCallbacks.has(frameKey)) {
    frameNotificationCallbacks.set(frameKey, { })
  }
  return frameNotificationCallbacks.get(frameKey)
}

function clearFrameNotificationCallbacks (frameKey) {
  frameNotificationCallbacks.delete(frameKey)
}
