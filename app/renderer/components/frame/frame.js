/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const Immutable = require('immutable')
const ipc = require('electron').ipcRenderer
const remote = require('electron').remote

// Actions
const appActions = require('../../../../js/actions/appActions')
const tabActions = require('../../../common/actions/tabActions')
const windowActions = require('../../../../js/actions/windowActions')
const webviewActions = require('../../../../js/actions/webviewActions')
const getSetting = require('../../../../js/settings').getSetting

// Components
const ReduxComponent = require('../reduxComponent')

// Store
const windowStore = require('../../../../js/stores/windowStore')
const appStoreRenderer = require('../../../../js/stores/appStoreRenderer')

// State
const contextMenuState = require('../../../common/state/contextMenuState')
const siteSettings = require('../../../../js/state/siteSettings')
const siteSettingsState = require('../../../common/state/siteSettingsState')
const tabState = require('../../../common/state/tabState')

// Utils
const frameStateUtil = require('../../../../js/state/frameStateUtil')
const UrlUtil = require('../../../../js/lib/urlutil')
const urlParse = require('../../../common/urlParse')
const contextMenus = require('../../../../js/contextMenus')
const domUtil = require('../../lib/domUtil')
const {
  aboutUrls,
  isSourceMagnetUrl,
  isTargetAboutUrl,
  getTargetAboutUrl,
  getBaseUrl,
  isIntermediateAboutPage
} = require('../../../../js/lib/appUrlUtil')
const {isFrameError, isAborted} = require('../../../common/lib/httpUtil')
const {isFocused} = require('../../currentWindow')
const debounce = require('../../../../js/lib/debounce')
const locale = require('../../../../js/l10n')
const imageUtil = require('../../../../js/lib/imageUtil')
const historyUtil = require('../../../common/lib/historyUtil')

// Constants
const settings = require('../../../../js/constants/settings')
const appConfig = require('../../../../js/constants/appConfig')
const messages = require('../../../../js/constants/messages')
const config = require('../../../../js/constants/config')

function isTorrentViewerURL (url) {
  const isEnabled = getSetting(settings.TORRENT_VIEWER_ENABLED)
  return isEnabled && isSourceMagnetUrl(url)
}

function isPDFJSURL (url) {
  const pdfjsOrigin = `chrome-extension://${config.PDFJSExtensionId}/`
  return url && url.startsWith(pdfjsOrigin)
}

class Frame extends React.Component {
  constructor (props) {
    super(props)
    this.onUpdateWheelZoom = debounce(this.onUpdateWheelZoom.bind(this), 20)
    // Maps notification message to its callback
    this.notificationCallbacks = {}
    // Counter for detecting PDF URL redirect loops
    this.reloadCounter = {}
    // TODO: use something more purpose-built than a fake element for event emitting
    this.tabEventEmitter = document.createElement('div')
  }

  get frame () {
    return windowStore.getFrame(this.props.frameKey) || Immutable.fromJS({})
  }

  get tab () {
    const frame = this.frame
    if (!appStoreRenderer.state.get('tabs')) {
      return undefined
    }
    return appStoreRenderer.state.get('tabs').find((tab) => tab.get('tabId') === frame.get('tabId'))
  }

  isAboutPage () {
    return aboutUrls.get(getBaseUrl(this.props.location))
  }

  isIntermediateAboutPage () {
    return isIntermediateAboutPage(getBaseUrl(this.props.location))
  }

  allowRunningWidevinePlugin () {
    if (!this.props.isWidevineEnabled) {
      return false
    }
    if (!this.props.origin) {
      return false
    }
    // Check for at least one CtP allowed on this origin
    if (!this.props.hasAllSiteSettings) {
      return false
    }
    if (typeof this.props.widevine === 'number') {
      return true
    }
    return false
  }

  expireContentSettings (props) {
    // Expired Flash settings should be deleted when the webview is
    // navigated or closed. Same for NoScript's allow-once option.
    if (typeof props.flash === 'number') {
      if (props.flash < Date.now()) {
        appActions.removeSiteSetting(props.origin, 'flash', props.isPrivate)
      }
    }
    if (props.widevine === 0) {
      appActions.removeSiteSetting(props.origin, 'widevine', props.isPrivate)
    }
    if (props.noScript === 0) {
      appActions.removeSiteSetting(props.origin, 'noScript', props.isPrivate)
    }
    if (props.noScriptExceptions) {
      appActions.noScriptExceptionsAdded(props.origin, props.noScriptExceptions.map(value => value === 0 ? false : value))
    }
  }

  componentWillUnmount () {
    this.expireContentSettings(this.props)
  }

  onPropsChanged (prevProps = {}) {
    if (this.props.isActive && !prevProps.isActive && this.props.isFocused) {
      windowActions.setFocusedFrame(this.props.location, this.props.tabId)
    }
  }

  componentDidMount () {
    this.addEventListeners()
    this.onPropsChanged()
    if (this.props.activeShortcut) {
      this.handleShortcut()
    }
  }

  get zoomLevel () {
    const zoom = this.props.siteZoomLevel
    appActions.removeSiteSetting(this.props.origin, 'zoomLevel', this.props.isPrivate)
    return zoom
  }

  zoomIn () {
    if (this.webContents) {
      this.webContents.zoomIn()
      windowActions.setLastZoomPercentage(this.frame, this.webContents.getZoomPercent())
    }
  }

  zoomOut () {
    if (this.webContents) {
      this.webContents.zoomOut()
      windowActions.setLastZoomPercentage(this.frame, this.webContents.getZoomPercent())
    }
  }

  zoomReset () {
    if (this.webContents) {
      this.webContents.zoomReset()
      windowActions.setLastZoomPercentage(this.frame, this.webContents.getZoomPercent())
    }
  }

  enterHtmlFullScreen () {
    if (this.webContents) {
      this.webContents.executeScriptInTab(config.braveExtensionId, 'document.documentElement.webkitRequestFullScreen()', {})
      this.webContents.focus()
    }
  }

  exitHtmlFullScreen () {
    if (this.webContents) {
      this.webContents.executeScriptInTab(config.braveExtensionId, 'document.webkitExitFullscreen()', {})
    }
  }

  componentDidUpdate (prevProps) {

    // tab id changed
    if (prevProps.tabId && this.props.tabId !== prevProps.tabId) {
      console.log('cdu frame tab id changed', this.props.tabId)
      this.unregisterEventListener(prevProps.tabId)
      this.registerEventListener(this.props.tabId)
    }
    // TODO: This title should be set in app/browser/tabs.js and then we should use the
    // app state for the tabData everywhere and remove windowState's title completely.
    if (this.props.activeShortcut !== prevProps.activeShortcut) {
      this.handleShortcut()
    }

    if (!this.frame.isEmpty() && !this.frame.delete('lastAccessedTime').equals(this.lastFrame)) {
      appActions.frameChanged(this.frame)
    }

    this.lastFrame = this.frame.delete('lastAccessedTime')

    // For cross-origin navigation, clear temp approvals
    if (this.props.origin !== prevProps.origin) {
      this.expireContentSettings(prevProps)
    }

    this.onPropsChanged(prevProps)
    if (this.props.isActive && !prevProps.isActive && !this.props.urlBarFocused) {
      if (this.webContents && !this.webContents.isDestroyed()) {
        this.webContents.focus()
      }
    }

    // make sure the webview content updates to
    // match the fullscreen state of the frame
    if (prevProps.isFullScreen !== this.props.isFullScreen ||
      (this.props.isFullScreen && !this.props.isActive)) {
      if (this.props.isFullScreen && this.props.isActive) {
        this.enterHtmlFullScreen()
      } else {
        this.exitHtmlFullScreen()
      }
    }
  }

  handleShortcut () {
    console.log('handle shortcut', this.props.activeShortcut, this.props.tabId)
    switch (this.props.activeShortcut) {
      case 'stop':
        this.webContents.stop()
        break
      case 'reload':
        // Ensure that the webview thinks we're on the same location as the browser does.
        // This can happen for pages which don't load properly.
        // Some examples are basic http auth and bookmarklets.
        // In this case both the user display and the user think they're on this.props.location.
        if (this.props.tabUrl !== this.props.location &&
          !this.isAboutPage() &&
          !isTorrentViewerURL(this.props.location)) {
        } else if (isPDFJSURL(this.props.location)) {
          appActions.loadURLRequested(this.props.tabId,
            UrlUtil.getLocationIfPDF(this.props.location))
        } else {
          tabActions.reload(this.props.tabId)
        }
        break
      case 'clean-reload':
        tabActions.reload(this.props.tabId, true)
        break
      case 'zoom-in':
        this.zoomIn()
        break
      case 'zoom-out':
        this.zoomOut()
        break
      case 'zoom-reset':
        this.zoomReset()
        break
      case 'view-source':
        const sourceLocation = UrlUtil.getViewSourceUrlFromUrl(this.props.tabUrl)
        if (sourceLocation !== null) {
          appActions.createTabRequested({
            url: sourceLocation,
            isPrivate: this.props.isPrivate,
            partitionNumber: this.props.partitionNumber,
            openerTabId: this.props.tabId,
            active: true
          })
        }
        // TODO: Make the URL bar show the view-source: prefix
        break
      case 'save':
        const downloadLocation = getSetting(settings.PDFJS_ENABLED)
          ? UrlUtil.getLocationIfPDF(this.props.tabUrl)
          : this.props.tabUrl
        // TODO: Sometimes this tries to save in a non-existent directory
        this.webContents.downloadURL(downloadLocation, true)
        break
      case 'print':
        this.webContents.print()
        break
      case 'show-findbar':
        windowActions.setFindbarShown(this.props.frameKey, true)
        break
      case 'focus-webview':
        setImmediate(() => {
          if (this.webContents) {
            this.webContents.focus()
          }
        })
        break
      case 'copy':
        let selection = window.getSelection()
        if (selection && selection.toString()) {
          appActions.clipboardTextCopied(selection.toString())
        } else {
          this.webContents.copy()
        }
        break
      case 'find-next':
        this.onFindAgain(true)
        break
      case 'find-prev':
        this.onFindAgain(false)
        break
    }
    if (this.props.activeShortcut) {
      windowActions.frameShortcutChanged(this.frame, null, null)
    }
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
  showWidevineNotification (noWidevineCallback, widevineCallback) {
    // https://www.nfl.com is said to be a widevine site but it actually uses Flash for me Oct 10, 2016
    const widevineSites = ['https://www.netflix.com',
      'http://bitmovin.com',
      'https://www.primevideo.com',
      'https://www.spotify.com',
      'https://shaka-player-demo.appspot.com']
    const origin = this.props.origin
    const location = this.props.location
    const isForWidevineTest = process.env.NODE_ENV === 'test' && location.endsWith('/drm.html')
    if (!isForWidevineTest && (!origin || !widevineSites.includes(origin))) {
      noWidevineCallback()
      return
    }

    // Generate a random string that is unlikely to collide. Not
    // cryptographically random.
    const nonce = Math.random().toString()

    if (this.props.isWidevineEnabled) {
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
      this.notificationCallbacks[message] = (buttonIndex, persist) => {
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

    ipc.once(messages.NOTIFICATION_RESPONSE + nonce, (e, msg, buttonIndex, persist) => {
      const cb = this.notificationCallbacks[msg]
      if (cb) {
        cb(buttonIndex, persist)
      }
    })
  }

  eventListener (event) {
    if (event.type === 'destroyed') {
      console.log('tab destroyed, unregistering remote webcontents event listener')
      this.unregisterEventListener(this.props.tabId)
    }
    console.debug(this.props.tabId, event.type)
    this.tabEventEmitter.dispatchEvent(event)
  }

  registerEventListener (tabId) {
    this.webContents = null
    remote.getWebContents(tabId, (webContents) => {
      this.webContents = webContents
    })
    remote.registerEvents(tabId, this.eventListener)
  }

  unregisterEventListener (tabId) {
    if (tabId == null)
      return

    remote.unregisterEvents(tabId, this.eventListener)
  }

  addEventListeners () {
    console.log(this.props.tabId, 'registering event listeners')
    // Webview also exposes the 'tab-id-changed' event, with e.tabID as the new tabId.
    // We don't handle that event anymore, in favor of tab-replaced-at in the browser process.
    // Keeping this comment here as it is not documented - petemill.
    this.eventListener = this.eventListener.bind(this)

    if (this.props.tabId) {
      this.registerEventListener(this.props.tabId)
    }

    this.tabEventEmitter.addEventListener('tab-replaced-at', (e, windowId, tabIndex, newContents) => {
      console.log(this.props.tabId, 'frame tab replaced at', newContents)
    })

    this.tabEventEmitter.addEventListener('tab-id-changed', (e) => {
      console.log('frame tab id changed')
      if (this.props.tabId !== e.tabID) {
        this.unregisterEventListener(this.props.tabId)
        this.registerEventListener(e.tabID)
      }
    })
    this.tabEventEmitter.addEventListener('guest-ready', (e) => {
      if (this.frame.isEmpty()) {
        return
      }
      if (this.props.guestInstanceId !== e.guestInstanceId) {
        console.warn('[disabled] wanted to change guest from ', this.props.guestInstanceId, 'to', e.guestInstanceId)
        // (petemill) this is disabled as it was changing guest IDs of some frames to the exact same as other frames
        // ...better that this is controlled by the browser process / app state
        // windowActions.frameGuestInstanceIdChanged(this.frame, this.props.guestInstanceId, e.guestInstanceId)
      }
    }, { passive: true })
    this.tabEventEmitter.addEventListener('content-blocked', (e) => {
      if (this.frame.isEmpty()) {
        return
      }
      if (e.details[0] === 'javascript' && e.details[1]) {
        windowActions.setBlockedBy(this.props.tabId, 'noScript', e.details[1])
      }
      if (e.details[0] === 'autoplay') {
        appActions.autoplayBlocked(this.props.tabId)
      }
    }, { passive: true })
    this.tabEventEmitter.addEventListener('did-block-run-insecure-content', (e) => {
      if (this.frame.isEmpty()) {
        return
      }
      windowActions.setBlockedRunInsecureContent(this.frame, e.details[0])
    }, { passive: true })
    this.tabEventEmitter.addEventListener('context-menu', (e) => {
      console.log('cont menu')
      if (this.frame.isEmpty()) {
        return
      }
      contextMenus.onMainContextMenu(e.params, this.frame, this.tab)
      e.preventDefault()
      e.stopPropagation()
    })
    this.tabEventEmitter.addEventListener('update-target-url', (e) => {
      const downloadBarHeight = domUtil.getStyleConstants('download-bar-height')
      let nearBottom = e.y > (window.innerHeight - 150 - downloadBarHeight)
      let mouseOnLeft = e.x < (window.innerWidth / 2)
      let showOnRight = nearBottom && mouseOnLeft
      windowActions.setLinkHoverPreview(e.url, showOnRight)
    }, { passive: true })

    this.tabEventEmitter.addEventListener('page-favicon-updated', (e) => {
      console.log('page-fav-upd')
      if (this.frame.isEmpty()) {
        return
      }
      if (e.favicons &&
          e.favicons.length > 0 &&
          // Favicon changes lead to recalculation of top site data so only fire
          // this when needed.  Some sites update favicons very frequently.
          e.favicons[0] !== this.frame.get('icon')) {
        imageUtil.getWorkingImageUrl(e.favicons[0], (error) => {
          windowActions.setFavicon(this.frame, error ? null : e.favicons[0])
        })
      }
    }, { passive: true })
    this.tabEventEmitter.addEventListener('show-autofill-settings', (e) => {
      appActions.createTabRequested({
        url: 'about:autofill',
        active: true
      })
    }, { passive: true })
    this.tabEventEmitter.addEventListener('show-autofill-popup', (e) => {
      if (this.frame.isEmpty()) {
        return
      }
      contextMenus.onShowAutofillMenu(e.suggestions, e.rect, this.frame)
    }, { passive: true })
    this.tabEventEmitter.addEventListener('hide-autofill-popup', (e) => {
      if (this.props.isAutFillContextMenu) {
        windowActions.autofillPopupHidden(this.props.tabId)
      }
    }, { passive: true })
    this.tabEventEmitter.addEventListener('ipc-message', (e) => {
      let method = () => {}
      switch (e.channel) {
        case messages.GOT_CANVAS_FINGERPRINTING:
          if (this.frame.isEmpty()) {
            return
          }
          method = (detail) => {
            const description = [detail.type, detail.scriptUrl || this.props.provisionalLocation].join(': ')
            windowActions.setBlockedBy(this.props.tabId, 'fingerprintingProtection', description)
          }
          break
        case messages.THEME_COLOR_COMPUTED:
          if (this.frame.isEmpty()) {
            return
          }
          method = (computedThemeColor) =>
            windowActions.setThemeColor(this.frame, undefined, computedThemeColor || null)
          break
        case messages.CONTEXT_MENU_OPENED:
          if (this.frame.isEmpty()) {
            return
          }
          method = (nodeProps, contextMenuType) => {
            contextMenus.onMainContextMenu(nodeProps, this.frame, this.tab, contextMenuType)
          }
          break
        case messages.STOP_LOAD:
          method = () => this.webContents.stop()
          break
        case messages.GO_BACK:
          method = () => appActions.onGoBack(this.props.tabId)
          break
        case messages.GO_FORWARD:
          method = () => appActions.onGoForward(this.props.tabId)
          break
        case messages.RELOAD:
          method = () => {
            this.reloadCounter[this.props.location] = this.reloadCounter[this.props.location] || 0
            if (this.reloadCounter[this.props.location] < 2) {
              tabActions.reload(this.props.tabId)
              this.reloadCounter[this.props.location] = this.reloadCounter[this.props.location] + 1
            }
          }
          break
        case messages.CLEAR_BROWSING_DATA_NOW:
          method = () =>
            windowActions.setClearBrowsingDataPanelVisible(true)
          break
        case messages.AUTOFILL_SET_ADDRESS:
          method = (currentDetail) =>
            windowActions.setAutofillAddressDetail(null, null, currentDetail)
          break
        case messages.AUTOFILL_SET_CREDIT_CARD:
          method = (currentDetail) =>
            windowActions.setAutofillCreditCardDetail(null, null, currentDetail)
          break
        case messages.HIDE_CONTEXT_MENU:
          method = () => windowActions.setContextMenuDetail()
          break
      }
      method.apply(this, e.args)
    }, { passive: true })

    const loadStart = (e) => {
      if (this.frame.isEmpty()) {
        return
      }
      if (e.isMainFrame && !e.isErrorPage && !e.isFrameSrcDoc) {
        if (e.url && e.url.startsWith(appConfig.noScript.twitterRedirectUrl) &&
          this.props.noScript === true) {
          // This result will be canceled immediately by sitehacks, so don't
          // update the load state; otherwise it will not show the security
          // icon.
          return
        }
        windowActions.onWebviewLoadStart(this.frame, e.url)
      }
    }

    const loadEnd = (savePage, url, inPageNav) => {
      if (this.frame.isEmpty()) {
        return
      }
      windowActions.onWebviewLoadEnd(this.frame, url)
      const parsedUrl = urlParse(url)
      if (!this.allowRunningWidevinePlugin()) {
        this.showWidevineNotification(() => {
        }, () => {
          appActions.loadURLRequested(this.props.tabId, this.props.provisionalLocation)
        })
      }

      const protocol = parsedUrl.protocol
      const isError = this.props.aboutDetailsErrorCode
      if (!this.props.isPrivate && (protocol === 'http:' || protocol === 'https:') && !isError && savePage && !inPageNav) {
        // Register the site for recent history for navigation bar
        // calling with setTimeout is an ugly hack for a race condition
        // with setTitle. We either need to delay this call until the title is
        // or add a way to update it
        // However, it's possible that the frame could be destroyed, or in a bad
        // way by then, so make sure we do a null check.
        setTimeout(() => {
          const siteDetail = historyUtil.getDetailFromFrame(this.frame)
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
        windowActions.setSecurityState(this.props.tabId, {
          secure: urlParse(displayLocation).protocol === 'https:',
          runInsecureContent: false
        })
      }
    }

    const loadFail = (e, provisionLoadFailure, url) => {
      if (this.frame.isEmpty()) {
        return
      }
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
          appActions.onGoBack(this.props.tabId)
          appActions.createTabRequested({
            url: e.validatedURL,
            active: true
          })
          return
        }

        windowActions.setFrameError(this.frame, {
          event_type: 'did-fail-load',
          errorCode: e.errorCode,
          url: e.validatedURL
        })
        const key = historyUtil.getKey(this.frame)
        appActions.loadURLRequested(this.props.tabId, 'about:error')
        appActions.removeHistorySite(key)
      } else if (isAborted(e.errorCode)) {
        // just stay put
      } else if (provisionLoadFailure) {
        windowActions.setNavigated(url, this.props.frameKey, true, this.props.tabId)
      }
    }
    this.tabEventEmitter.addEventListener('security-style-changed', (e) => {
      if (this.frame.isEmpty()) {
        return
      }
      let isSecure = null
      let runInsecureContent = this.props.runInsecureContent
      let evCert = null
      if (e.securityState === 'secure') {
        isSecure = true
      } else if (e.securityState === 'insecure') {
        // Passive mixed content should not upgrade an insecure connection to a
        // partially-secure connection. It can only downgrade a secure
        // connection.
        isSecure =
          e.securityInfo.mixedContentStatus === 'content-status-displayed' && this.props.isSecure !== false
          ? 1
          : false
      } else if (e.securityState === 'broken') {
        isSecure = false
        const parsedUrl = urlParse(this.props.location)
        ipc.send(messages.CHECK_CERT_ERROR_ACCEPTED, parsedUrl.host, this.props.tabId)
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
      windowActions.setSecurityState(this.props.tabId, {
        secure: runInsecureContent ? false : isSecure,
        runInsecureContent,
        evCert
      })
    }, { passive: true })
    this.tabEventEmitter.addEventListener('load-start', (e) => {
      loadStart(e)
    }, { passive: true })
    this.tabEventEmitter.addEventListener('did-navigate', (e) => {
      if (this.props.findbarShown) {
        frameStateUtil.onFindBarHide(this.props.frameKey)
      }

      for (let message in this.notificationCallbacks) {
        appActions.hideNotification(message)
      }
      this.notificationCallbacks = {}
      const isNewTabPage = getBaseUrl(e.url) === getTargetAboutUrl('about:newtab')
      // Only take focus away from the urlBar if:
      // The tab is active, it's not the new tab page, and the webview isn't already active.
      if (this.props.isActive && !isNewTabPage && this.webContents) {
        this.webContents.focus()
      }
      if (!this.frame.isEmpty()) {
        windowActions.setNavigated(e.url, this.props.frameKey, false, this.props.tabId)
      }
    }, { passive: true })
    this.tabEventEmitter.addEventListener('did-fail-provisional-load', (e) => {
      if (e.isMainFrame) {
        loadEnd(false, e.validatedURL, false)
        loadFail(e, true, e.currentURL)
      }
    })
    this.tabEventEmitter.addEventListener('did-fail-load', (e) => {
      if (e.isMainFrame) {
        loadEnd(false, e.validatedURL, false)
        loadFail(e, false, e.validatedURL)
      }
    })
    this.tabEventEmitter.addEventListener('did-finish-load', (e) => {
      loadEnd(true, e.validatedURL, false)
      if (this.props.runInsecureContent) {
        appActions.removeSiteSetting(this.props.origin, 'runInsecureContent', this.props.isPrivate)
      }
    })
    this.tabEventEmitter.addEventListener('did-navigate-in-page', (e) => {
      if (this.frame.isEmpty()) {
        return
      }
      if (e.isMainFrame) {
        windowActions.setNavigated(e.url, this.props.frameKey, true, this.props.tabId)
        loadEnd(true, e.url, true)
      }
    })
    this.tabEventEmitter.addEventListener('enter-html-full-screen', () => {
      if (this.frame.isEmpty()) {
        return
      }
      windowActions.setFullScreen(this.props.tabId, true, true)
      // disable the fullscreen warning after 5 seconds
      setTimeout(windowActions.setFullScreen.bind(this, this.props.tabId, undefined, false), 5000)
    })
    this.tabEventEmitter.addEventListener('leave-html-full-screen', () => {
      if (this.frame.isEmpty()) {
        return
      }
      windowActions.setFullScreen(this.props.tabId, false)
    })
    this.tabEventEmitter.addEventListener('did-change-theme-color', ({themeColor}) => {
      if (this.frame.isEmpty()) {
        return
      }
      // Due to a bug in Electron, after navigating to a page with a theme color
      // to a page without a theme color, the background is sent to us as black
      // even know there is no background. To work around this we just ignore
      // the theme color in that case and let the computed theme color take over.
      windowActions.setThemeColor(this.frame, themeColor !== '#000000' ? themeColor : null)
    })
    this.tabEventEmitter.addEventListener('found-in-page', (e) => {
      if (this.frame.isEmpty()) {
        return
      }

      if (e.result !== undefined && (e.result.matches !== undefined || e.result.activeMatchOrdinal !== undefined)) {
        if (e.result.matches === 0) {
          windowActions.setFindDetail(this.props.frameKey, Immutable.fromJS({
            numberOfMatches: 0,
            activeMatchOrdinal: 0
          }))
          return
        }

        windowActions.setFindDetail(this.props.frameKey, Immutable.fromJS({
          numberOfMatches: e.result.matches || -1,
          activeMatchOrdinal: e.result.activeMatchOrdinal || -1
        }))
      }
    })
    // Handle zoom using Ctrl/Cmd and the mouse wheel.
    this.tabEventEmitter.addEventListener('mousewheel', this.onMouseWheel.bind(this))
  }

  onFindAgain (forward) {
    if (!this.props.findbarShown) {
      windowActions.setFindbarShown(this.props.frameKey, true)
    }
    const searchString = this.props.findDetailSearchString
    if (searchString) {
      webviewActions.findInPage(searchString, this.props.findDetailCaseSensitivity, forward, this.props.findDetailInternalFindStatePresent, this.webContents)
    }
  }

  onUpdateWheelZoom () {
    if (this.wheelDeltaY > 0) {
      this.zoomIn()
    } else if (this.wheelDeltaY < 0) {
      this.zoomOut()
    }
    this.wheelDeltaY = 0
  }

  onMouseWheel (e) {
    if (e.ctrlKey) {
      e.preventDefault()
      this.wheelDeltaY = (this.wheelDeltaY || 0) + e.wheelDeltaY
      this.onUpdateWheelZoom()
    } else {
      this.wheelDeltaY = 0
    }
  }

  mergeProps (state, ownProps) {
    const currentWindow = state.get('currentWindow')
    const frame = frameStateUtil.getFrameByKey(currentWindow, ownProps.frameKey) || Immutable.Map()
    const tabId = frame.get('tabId', tabState.TAB_ID_NONE)

    const location = frame.get('location')
    const origin = tabState.getVisibleOrigin(state, tabId)
    const isPrivate = frame.get('isPrivate', false)

    const allSiteSettings = siteSettingsState.getAllSiteSettings(state, isPrivate)
    const frameSiteSettings = siteSettings.getSiteSettingsForURL(allSiteSettings, location) || Immutable.Map()

    const contextMenu = contextMenuState.getContextMenu(currentWindow)
    const tab = tabId && tabId > -1 && tabState.getByTabId(state, tabId)

    const previewFrameKey = currentWindow.get('previewFrameKey')

    const props = {}
    // used in renderer
    props.isFullScreen = frame.get('isFullScreen')
    props.isActive = frameStateUtil.isFrameKeyActive(currentWindow, frame.get('key'))
    props.location = location
    props.tabId = tabId
    props.isFocused = isFocused(state)

    // used in other functions
    props.frameKey = ownProps.frameKey
    props.origin = origin
    props.runInsecureContent = frameSiteSettings.get('runInsecureContent')
    props.noScript = frameSiteSettings.get('noScript')
    props.noScriptExceptions = frameSiteSettings.get('noScriptExceptions')
    props.widevine = frameSiteSettings.get('widevine')
    props.flash = frameSiteSettings.get('flash')
    props.urlBarFocused = frame && frame.getIn(['navbar', 'urlbar', 'focused'])
    props.isAutFillContextMenu = contextMenu && contextMenu.get('type') === 'autofill'
    props.isSecure = frame.getIn(['security', 'isSecure'])
    props.findbarShown = frame.get('findbarShown')
    props.findDetailCaseSensitivity = frame.getIn(['findDetail', 'caseSensitivity'], undefined)
    props.findDetailSearchString = frame.getIn(['findDetail', 'searchString'])
    props.findDetailInternalFindStatePresent = frame.getIn(['findDetail', 'internalFindStatePresent'])
    props.isPrivate = frame.get('isPrivate')
    props.activeShortcut = frame.get('activeShortcut')
    props.shortcutDetailsUsername = frame.getIn(['activeShortcutDetails', 'username'])
    props.shortcutDetailsPassword = frame.getIn(['activeShortcutDetails', 'password'])
    props.shortcutDetailsOrigin = frame.getIn(['activeShortcutDetails', 'origin'])
    props.shortcutDetailsAction = frame.getIn(['activeShortcutDetails', 'action'])
    props.provisionalLocation = frame.get('provisionalLocation')
    props.src = frame.get('src')
    props.guestInstanceId = frame.get('guestInstanceId')
    props.aboutDetailsUrl = frame.getIn(['aboutDetails', 'url'])
    props.aboutDetailsFrameKey = frame.getIn(['aboutDetails', 'frameKey'])
    props.aboutDetailsErrorCode = frame.getIn(['aboutDetails', 'errorCode'])
    props.unloaded = frame.get('unloaded')
    props.isWidevineEnabled = state.get('widevine') && state.getIn(['widevine', 'enabled'])
    props.siteZoomLevel = frameSiteSettings.get('zoomLevel')
    props.hasAllSiteSettings = !!allSiteSettings
    props.tabUrl = tab && tab.get('url')
    props.partitionNumber = frame.get('partitionNumber')

    return props
  }

  render () {
    return null
    // return <div
    //   data-partition={this.props.partition}
    //   data-test-id='frameWrapper'
    //   data-test2-id={this.props.isActive ? 'activeFrame' : null}
    //   data-test3-id={this.props.isPreview ? 'previewFrame' : null}
    //   className={cx({
    //     frameWrapper: true,
    //     [this.props.className]: this.props.className,
    //     isPreview: this.props.isPreview,
    //     isActive: this.props.isActive,
    //     isDefaultNewTabLocation: this.props.isDefaultNewTabLocation,
    //     isBlankLocation: this.props.isBlankLocation
    //   })}>



    // </div>
  }
}

module.exports = ReduxComponent.connect(Frame)
