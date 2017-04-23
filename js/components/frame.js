/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const urlParse = require('../../app/common/urlParse')
const windowActions = require('../actions/windowActions')
const appActions = require('../actions/appActions')
const webviewActions = require('../actions/webviewActions')
const ImmutableComponent = require('../../app/renderer/components/immutableComponent')
const Immutable = require('immutable')
const cx = require('../lib/classSet')
const siteUtil = require('../state/siteUtil')
const frameStateUtil = require('../state/frameStateUtil')
const UrlUtil = require('../lib/urlutil')
const {getZoomLevel} = require('../lib/zoom')
const messages = require('../constants/messages')
const contextMenus = require('../contextMenus')
const ipc = require('electron').ipcRenderer
const FullScreenWarning = require('../../app/renderer/components/fullScreenWarning')
const debounce = require('../lib/debounce')
const getSetting = require('../settings').getSetting
const config = require('../constants/config')
const settings = require('../constants/settings')
const {aboutUrls, isSourceMagnetUrl, isSourceAboutUrl, isTargetAboutUrl, getTargetAboutUrl, getBaseUrl, isIntermediateAboutPage} = require('../lib/appUrlUtil')
const {isFrameError, isAborted} = require('../../app/common/lib/httpUtil')
const locale = require('../l10n')
const appConfig = require('../constants/appConfig')
const {getSiteSettingsForHostPattern} = require('../state/siteSettings')
const {isFocused} = require('../../app/renderer/currentWindow')
const windowStore = require('../stores/windowStore')
const appStoreRenderer = require('../stores/appStoreRenderer')
const siteSettings = require('../state/siteSettings')
const imageUtil = require('../lib/imageUtil')
const MessageBox = require('../../app/renderer/components/messageBox')

const WEBRTC_DEFAULT = 'default'
const WEBRTC_DISABLE_NON_PROXY = 'disable_non_proxied_udp'
// Looks like Brave leaks true public IP from behind system proxy when this option
// is on.
// const WEBRTC_PUBLIC_ONLY = 'default_public_interface_only'

const pdfjsOrigin = `chrome-extension://${config.PDFJSExtensionId}/`

function isTorrentViewerURL (url) {
  const isEnabled = getSetting(settings.TORRENT_VIEWER_ENABLED)
  return isEnabled && isSourceMagnetUrl(url)
}

class Frame extends ImmutableComponent {
  constructor () {
    super()
    this.onCloseFrame = this.onCloseFrame.bind(this)
    this.onUpdateWheelZoom = debounce(this.onUpdateWheelZoom.bind(this), 20)
    this.onFocus = this.onFocus.bind(this)
    this.onAppStateChange = this.onAppStateChange.bind(this)
    // Maps notification message to its callback
    this.notificationCallbacks = {}
    // Counter for detecting PDF URL redirect loops
    this.reloadCounter = {}
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

  onCloseFrame () {
    windowActions.closeFrame(this.frame)
  }

  getFrameBraverySettings (props) {
    props = props || this.props
    const frameSiteSettings =
      siteSettings.getSiteSettingsForURL(props.allSiteSettings, props.location)
    return Immutable.fromJS(siteSettings.activeSettings(frameSiteSettings,
                                                        appStoreRenderer.state,
                                                        appConfig))
  }

  isAboutPage () {
    return aboutUrls.get(getBaseUrl(this.props.location))
  }

  isIntermediateAboutPage () {
    return isIntermediateAboutPage(getBaseUrl(this.props.location))
  }

  shouldCreateWebview () {
    return !this.webview
  }

  runInsecureContent () {
    const activeSiteSettings = getSiteSettingsForHostPattern(this.props.allSiteSettings, this.origin)
    return activeSiteSettings === undefined
      ? false : activeSiteSettings.get('runInsecureContent')
  }

  allowRunningWidevinePlugin (url) {
    if (!this.props.widevine || !this.props.widevine.get('enabled')) {
      return false
    }
    const origin = url ? siteUtil.getOrigin(url) : this.origin
    if (!origin) {
      return false
    }
    // Check for at least one CtP allowed on this origin
    if (!this.props.allSiteSettings) {
      return false
    }
    const activeSiteSettings = getSiteSettingsForHostPattern(this.props.allSiteSettings,
                                                             origin)
    if (activeSiteSettings && typeof activeSiteSettings.get('widevine') === 'number') {
      return true
    }
    return false
  }

  expireContentSettings (origin) {
    // Expired Flash settings should be deleted when the webview is
    // navigated or closed. Same for NoScript's allow-once option.
    const activeSiteSettings = getSiteSettingsForHostPattern(this.props.allSiteSettings,
                                                             origin)
    if (!activeSiteSettings) {
      return
    }
    if (typeof activeSiteSettings.get('flash') === 'number') {
      if (activeSiteSettings.get('flash') < Date.now()) {
        appActions.removeSiteSetting(origin, 'flash', this.props.isPrivate)
      }
    }
    if (activeSiteSettings.get('widevine') === 0) {
      appActions.removeSiteSetting(origin, 'widevine', this.props.isPrivate)
    }
    if (activeSiteSettings.get('noScript') === 0) {
      appActions.removeSiteSetting(origin, 'noScript', this.props.isPrivate)
    }
    const noScriptExceptions = activeSiteSettings.get('noScriptExceptions')
    if (noScriptExceptions) {
      appActions.noScriptExceptionsAdded(origin, noScriptExceptions.filter((value, host) => value !== 0))
    }
  }

  componentWillUnmount () {
    appStoreRenderer.removeChangeListener(this.onAppStateChange)
    this.expireContentSettings(this.origin)
  }

  updateWebview (cb, prevProps, newSrc) {
    // lazy load webview
    if (!this.webview && !this.props.isActive && !this.props.isPreview &&
        // allow force loading of new frames
        this.props.unloaded === true &&
        // don't lazy load about pages
        !aboutUrls.get(getBaseUrl(this.props.src)) &&
        // pinned tabs don't serialize their state so the icon is lost for lazy loading
        !this.props.pinnedLocation) {
      return
    }

    newSrc = newSrc || this.props.src

    if (isSourceAboutUrl(newSrc)) {
      newSrc = getTargetAboutUrl(newSrc)
    }

    // Create the webview dynamically because React doesn't whitelist all
    // of the attributes we need
    if (this.shouldCreateWebview()) {
      this.webview = document.createElement('webview')
      this.webview.setAttribute('data-frame-key', this.props.frameKey)

      this.addEventListeners()
      if (cb) {
        this.runOnDomReady = cb
        let eventCallback = (e) => {
          this.webview.removeEventListener(e.type, eventCallback)
          this.runOnDomReady()
          delete this.runOnDomReady
        }
        let zoomCallback = (e) => {
          if (!e.isMainFrame) {
            return
          }
          this.webview.removeEventListener(e.type, zoomCallback)
          const zoomPercentage = this.frame && this.frame.get('lastZoomPercentage')
          if (zoomPercentage !== this.webview.getZoomPercent()) {
            this.webview.setZoomLevel(getZoomLevel(zoomPercentage))
          }
        }
        this.webview.addEventListener('did-attach', eventCallback)
        this.webview.addEventListener('load-commit', zoomCallback)
      }

      if (!this.props.guestInstanceId || !this.webview.attachGuest(this.props.guestInstanceId)) {
        // The partition is guaranteed to be initialized by now by the browser process
        this.webview.setAttribute('partition', frameStateUtil.getPartition(this.frame))
        this.webview.setAttribute('src', newSrc)
      }
      this.webviewContainer.appendChild(this.webview)
    } else {
      cb && cb(prevProps)
    }
  }

  onPropsChanged (prevProps = {}) {
    if (this.props.isActive && !prevProps.isActive) {
      windowActions.setActiveFrame(this.frame)
    }
    if (this.props.tabIndex !== prevProps.tabIndex) {
      this.webview.setTabIndex(this.props.tabIndex)
    }
    if (this.props.isActive && isFocused()) {
      windowActions.setFocusedFrame(this.frame)
    }
  }

  onAppStateChange () {
    if (!this.frame.isEmpty() && this.tab && !this.tab.delete('frame').equals(this.lastTab)) {
      windowActions.tabDataChanged(this.frame, this.tab)
    }
    this.lastTab = this.tab && this.tab.delete('frame')
  }

  componentDidMount () {
    appStoreRenderer.addChangeListener(this.onAppStateChange)
    if (this.props.isActive) {
      windowActions.setActiveFrame(this.frame)
    }
    this.updateWebview(this.onPropsChanged)
    if (this.props.activeShortcut) {
      this.handleShortcut()
    }
  }

  zoomIn () {
    if (this.webview) {
      this.webview.zoomIn()
      windowActions.setLastZoomPercentage(this.frame, this.webview.getZoomPercent())
    }
  }

  zoomOut () {
    if (this.webview) {
      this.webview.zoomOut()
      windowActions.setLastZoomPercentage(this.frame, this.webview.getZoomPercent())
    }
  }

  zoomReset () {
    if (this.webview) {
      this.webview.zoomReset()
      windowActions.setLastZoomPercentage(this.frame, this.webview.getZoomPercent())
    }
  }

  enterHtmlFullScreen () {
    if (this.webview) {
      this.webview.executeScriptInTab(config.braveExtensionId, 'document.documentElement.webkitRequestFullScreen()', {})
      this.webview.focus()
    }
  }

  exitHtmlFullScreen () {
    if (this.webview) {
      this.webview.executeScriptInTab(config.braveExtensionId, 'document.webkitExitFullscreen()', {})
    }
  }

  componentDidUpdate (prevProps) {
    // TODO: This title should be set in app/browser/tabs.js and then we should use the
    // app state for the tabData everywhere and remove windowState's title completely.
    if (this.props.activeShortcut !== prevProps.activeShortcut) {
      this.handleShortcut()
    }

    if (!this.frame.isEmpty() && !this.frame.delete('lastAccessedTime').equals(this.lastFrame)) {
      appActions.frameChanged(this.frame)
    }

    this.lastFrame = this.frame.delete('lastAccessedTime')

    const cb = (prevProps = {}) => {
      this.onPropsChanged(prevProps)
      if (this.getWebRTCPolicy(prevProps) !== this.getWebRTCPolicy(this.props)) {
        this.webview.setWebRTCIPHandlingPolicy(this.getWebRTCPolicy(this.props))
      }

      if (this.props.isActive && !prevProps.isActive && !this.props.urlBarFocused) {
        this.webview.focus()
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

    // For cross-origin navigation, clear temp approvals
    const prevOrigin = siteUtil.getOrigin(prevProps.location)
    if (this.origin !== prevOrigin) {
      this.expireContentSettings(prevOrigin)
    }

    if (this.props.src !== prevProps.src) {
      this.updateWebview(cb, prevProps)
    } else if (this.shouldCreateWebview()) {
      // plugin/insecure-content allow state has changed. recreate with the current
      // location, not the src.
      this.updateWebview(cb, prevProps, this.props.location)
    } else {
      if (this.runOnDomReady) {
        // there is already a callback waiting for did-attach
        // so replace it with this callback because it might be a
        // mount callback which is a subset of the update callback
        this.runOnDomReady = cb
      } else {
        cb(prevProps)
      }
    }
  }

  handleShortcut () {
    switch (this.props.activeShortcut) {
      case 'stop':
        this.webview.stop()
        break
      case 'reload':
        // Ensure that the webview thinks we're on the same location as the browser does.
        // This can happen for pages which don't load properly.
        // Some examples are basic http auth and bookmarklets.
        // In this case both the user display and the user think they're on this.props.location.
        if (this.tab.get('url') !== this.props.location &&
          !this.isAboutPage() &&
          !isTorrentViewerURL(this.props.location)) {
          this.webview.loadURL(this.props.location)
        } else if (this.isIntermediateAboutPage() &&
          this.tab.get('url') !== this.props.location &&
          this.tab.get('url') !== this.props.aboutDetails.get('url')) {
          appActions.loadURLRequested(this.props.aboutDetails.get('url'),
            this.props.aboutDetails.get('frameKey'))
        } else {
          this.webview.reload()
        }
        break
      case 'clean-reload':
        this.webview.reloadIgnoringCache()
        break
      case 'explicitLoadURL':
        this.webview.loadURL(this.props.location)
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
        const sourceLocation = UrlUtil.getViewSourceUrlFromUrl(this.tab.get('url'))
        if (sourceLocation !== null) {
          appActions.createTabRequested({
            url: sourceLocation,
            isPrivate: this.frame.get('isPrivate'),
            partitionNumber: this.frame.get('partitionNumber'),
            openerTabId: this.frame.get('tabId'),
            active: true
          })
        }
        // TODO: Make the URL bar show the view-source: prefix
        break
      case 'save':
        const downloadLocation = getSetting(settings.PDFJS_ENABLED)
          ? UrlUtil.getLocationIfPDF(this.tab.get('url'))
          : this.tab.get('url')
        // TODO: Sometimes this tries to save in a non-existent directory
        this.webview.downloadURL(downloadLocation, true)
        break
      case 'print':
        this.webview.print()
        break
      case 'show-findbar':
        windowActions.setFindbarShown(this.frame, true)
        break
      case 'fill-password':
        let currentUrl = urlParse(this.tab.get('url'))
        if (currentUrl &&
            [currentUrl.protocol, currentUrl.host].join('//') === this.props.activeShortcutDetails.get('origin')) {
          this.webview.send(messages.GOT_PASSWORD,
                            this.props.activeShortcutDetails.get('username'),
                            this.props.activeShortcutDetails.get('password'),
                            this.props.activeShortcutDetails.get('origin'),
                            this.props.activeShortcutDetails.get('action'),
                            true)
        }
        break
      case 'focus-webview':
        setImmediate(() => this.webview.focus())
        break
      case 'copy':
        let selection = window.getSelection()
        if (selection && selection.toString()) {
          appActions.clipboardTextCopied(selection.toString())
        } else {
          this.webview.copy()
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
  showWidevineNotification (location, origin, noWidevineCallback, widevineCallback) {
    // https://www.nfl.com is said to be a widevine site but it actually uses Flash for me Oct 10, 2016
    const widevineSites = ['https://www.netflix.com',
      'http://bitmovin.com',
      'https://www.primevideo.com',
      'https://www.spotify.com',
      'https://shaka-player-demo.appspot.com']
    const isForWidevineTest = process.env.NODE_ENV === 'test' && location.endsWith('/drm.html')
    if (!isForWidevineTest && (!origin || !widevineSites.includes(origin))) {
      noWidevineCallback()
      return
    }

    // Generate a random string that is unlikely to collide. Not
    // cryptographically random.
    const nonce = Math.random().toString()

    if (this.props.widevine && this.props.widevine.get('enabled')) {
      const message = locale.translation('allowWidevine').replace(/{{\s*origin\s*}}/, this.origin)
      // Show Widevine notification bar
      appActions.showNotification({
        buttons: [
          {text: locale.translation('deny')},
          {text: locale.translation('allow')}
        ],
        message,
        frameOrigin: this.origin,
        options: {
          nonce,
          persist: true
        }
      })
      this.notificationCallbacks[message] = (buttonIndex, persist) => {
        if (buttonIndex === 1) {
          if (persist) {
            appActions.changeSiteSetting(this.origin, 'widevine', 1)
          } else {
            appActions.changeSiteSetting(this.origin, 'widevine', 0)
          }
          if (widevineCallback) {
            widevineCallback()
          }
        } else {
          if (persist) {
            appActions.changeSiteSetting(this.origin, 'widevine', false)
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

  addEventListeners () {
    this.webview.addEventListener('tab-id-changed', (e) => {
      if (this.frame.isEmpty()) {
        return
      }

      windowActions.frameTabIdChanged(this.frame, this.props.tabId, e.tabID)
    })
    this.webview.addEventListener('guest-ready', (e) => {
      if (this.frame.isEmpty()) {
        return
      }

      windowActions.frameGuestInstanceIdChanged(this.frame, this.props.guestInstanceId, e.guestInstanceId)
    })
    this.webview.addEventListener('content-blocked', (e) => {
      if (this.frame.isEmpty()) {
        return
      }
      if (e.details[0] === 'javascript' && e.details[1]) {
        windowActions.setBlockedBy(this.frame, 'noScript', e.details[1])
      }
    })
    this.webview.addEventListener('did-block-run-insecure-content', (e) => {
      if (this.frame.isEmpty()) {
        return
      }
      windowActions.setBlockedRunInsecureContent(this.frame, e.details[0])
    })
    this.webview.addEventListener('enable-pepper-menu', (e) => {
      if (this.frame.isEmpty()) {
        return
      }
      contextMenus.onFlashContextMenu(e.params, this.frame)
      e.preventDefault()
      e.stopPropagation()
    })
    this.webview.addEventListener('context-menu', (e) => {
      if (this.frame.isEmpty()) {
        return
      }
      contextMenus.onMainContextMenu(e.params, this.frame, this.tab)
      e.preventDefault()
      e.stopPropagation()
    })
    this.webview.addEventListener('update-target-url', (e) => {
      if (!this.root) {
        this.root = window.getComputedStyle(document.querySelector(':root'))
        this.downloadsBarHeight = Number.parseInt(this.root.getPropertyValue('--downloads-bar-height'), 10)
      }
      let nearBottom = e.y > (window.innerHeight - 150 - this.downloadsBarHeight)
      let mouseOnLeft = e.x < (window.innerWidth / 2)
      let showOnRight = nearBottom && mouseOnLeft
      windowActions.setLinkHoverPreview(e.url, showOnRight)
    })
    this.webview.addEventListener('focus', this.onFocus)
    this.webview.addEventListener('mouseenter', (e) => {
      windowActions.onFrameMouseEnter(this.props.tabId)
    })
    this.webview.addEventListener('mouseleave', (e) => {
      windowActions.onFrameMouseLeave(this.props.tabId)
    })
    this.webview.addEventListener('destroyed', (e) => {
      if (this.frame.isEmpty()) {
        return
      }
      this.onCloseFrame(this.frame, true)
    })
    this.webview.addEventListener('close', () => {
      if (this.frame.isEmpty()) {
        return
      }
      this.onCloseFrame(this.frame)
    })
    this.webview.addEventListener('page-favicon-updated', (e) => {
      if (this.frame.isEmpty()) {
        return
      }
      if (e.favicons && e.favicons.length > 0) {
        imageUtil.getWorkingImageUrl(e.favicons[0], (imageFound) => {
          windowActions.setFavicon(this.frame, imageFound ? e.favicons[0] : null)
        })
      }
    })
    this.webview.addEventListener('show-autofill-settings', (e) => {
      appActions.createTabRequested({
        url: 'about:autofill',
        active: true
      })
    })
    this.webview.addEventListener('show-autofill-popup', (e) => {
      if (this.frame.isEmpty()) {
        return
      }
      contextMenus.onShowAutofillMenu(e.suggestions, e.rect, this.frame)
    })
    this.webview.addEventListener('hide-autofill-popup', (e) => {
      if (this.props.contextMenuDetail && this.props.contextMenuDetail.get('type') === 'autofill') {
        windowActions.autofillPopupHidden(this.props.tabId)
      }
    })
    this.webview.addEventListener('ipc-message', (e) => {
      let method = () => {}
      switch (e.channel) {
        case messages.GOT_CANVAS_FINGERPRINTING:
          if (this.frame.isEmpty()) {
            return
          }
          method = (detail) => {
            const description = [detail.type, detail.scriptUrl || this.props.provisionalLocation].join(': ')
            windowActions.setBlockedBy(this.frame, 'fingerprintingProtection', description)
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
          method = () => this.webview.stop()
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
              this.webview.reload()
              this.reloadCounter[this.props.location] = this.reloadCounter[this.props.location] + 1
            }
          }
          break
        case messages.CLEAR_BROWSING_DATA_NOW:
          method = () =>
            windowActions.setClearBrowsingDataPanelVisible(true)
          break
        case messages.AUTOFILL_SET_ADDRESS:
          method = (currentDetail, originalDetail) =>
            windowActions.setAutofillAddressDetail(currentDetail, originalDetail)
          break
        case messages.AUTOFILL_SET_CREDIT_CARD:
          method = (currentDetail, originalDetail) =>
            windowActions.setAutofillCreditCardDetail(currentDetail, originalDetail)
          break
        case messages.HIDE_CONTEXT_MENU:
          method = () => windowActions.setContextMenuDetail()
          break
      }
      method.apply(this, e.args)
    })

    const loadStart = (e) => {
      if (this.frame.isEmpty()) {
        return
      }
      if (e.isMainFrame && !e.isErrorPage && !e.isFrameSrcDoc) {
        if (e.url && e.url.startsWith(appConfig.noScript.twitterRedirectUrl) &&
          this.getFrameBraverySettings(this.props).get('noScript') === true) {
          // This result will be canceled immediately by sitehacks, so don't
          // update the load state; otherwise it will not show the security
          // icon.
          return
        }
        windowActions.onWebviewLoadStart(this.frame, e.url)
      }
    }

    const loadEnd = (savePage, url) => {
      if (this.frame.isEmpty()) {
        return
      }
      windowActions.onWebviewLoadEnd(this.frame, url)
      const parsedUrl = urlParse(url)
      if (!this.allowRunningWidevinePlugin()) {
        this.showWidevineNotification(this.props.location, this.origin, () => {
        }, () => {
          appActions.loadURLRequested(this.frame.get('tabId'), this.props.provisionalLocation)
        })
      }

      const protocol = parsedUrl.protocol
      const isError = this.props.aboutDetails && this.props.aboutDetails.get('errorCode')
      if (!this.props.isPrivate && (protocol === 'http:' || protocol === 'https:') && !isError && savePage) {
        // Register the site for recent history for navigation bar
        // calling with setTimeout is an ugly hack for a race condition
        // with setTitle. We either need to delay this call until the title is
        // or add a way to update it
        setTimeout(() => {
          appActions.addSite(siteUtil.getDetailFromFrame(this.frame))
        }, 250)
      }

      if (url.startsWith(pdfjsOrigin)) {
        let displayLocation = UrlUtil.getLocationIfPDF(url)
        windowActions.setSecurityState(this.frame, {
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
        appActions.loadURLRequested(this.frame.get('tabId'), 'about:error')
        appActions.removeSite(siteUtil.getDetailFromFrame(this.frame))
      } else if (isAborted(e.errorCode)) {
        // just stay put
        windowActions.navigationAborted(this.frame.get('tabId'), url)
      } else if (provisionLoadFailure) {
        windowActions.setNavigated(url, this.props.frameKey, true, this.frame.get('tabId'))
      }
    }
    this.webview.addEventListener('security-style-changed', (e) => {
      if (this.frame.isEmpty()) {
        return
      }
      let isSecure = null
      let runInsecureContent = this.runInsecureContent()
      if (e.securityState === 'secure') {
        isSecure = true
      } else if (['broken', 'insecure'].includes(e.securityState)) {
        isSecure = false
      } else if (this.props.isSecure !== false &&
        ['warning', 'passive-mixed-content'].includes(e.securityState)) {
        // Passive mixed content should not upgrade an insecure connection to a
        // partially-secure connection. It can only downgrade a secure
        // connection.
        isSecure = 1
      }
      windowActions.setSecurityState(this.frame, {
        secure: runInsecureContent ? false : isSecure,
        runInsecureContent
      })
      if (isSecure) {
        // Check that there isn't a cert error.
        const parsedUrl = urlParse(this.props.location)
        ipc.send(messages.CHECK_CERT_ERROR_ACCEPTED, parsedUrl.host, this.props.frameKey)
      }
    })
    this.webview.addEventListener('load-start', (e) => {
      loadStart(e)
    })
    this.webview.addEventListener('did-navigate', (e) => {
      if (this.props.findbarShown) {
        this.props.onFindHide()
      }

      for (let message in this.notificationCallbacks) {
        appActions.hideNotification(message)
      }
      this.notificationCallbacks = {}
      const isNewTabPage = getBaseUrl(e.url) === getTargetAboutUrl('about:newtab')
      // Only take focus away from the urlBar if:
      // The tab is active, it's not the new tab page, and the webview isn't already active.
      if (this.props.isActive && !isNewTabPage && document.activeElement !== this.webview) {
        this.webview.focus()
      }
      if (!this.frame.isEmpty()) {
        windowActions.setNavigated(e.url, this.props.frameKey, false, this.frame.get('tabId'))
      }
      // force temporary url display for tabnapping protection
      windowActions.setMouseInTitlebar(true)
    })
    this.webview.addEventListener('crashed', (e) => {
      if (this.frame.isEmpty()) {
        return
      }
      windowActions.setFrameError(this.frame, {
        event_type: 'crashed',
        title: 'unexpectedError',
        url: this.props.location
      })
      appActions.loadURLRequested(this.frame.get('tabId'), 'about:error')
      this.webview = false
    })
    this.webview.addEventListener('did-fail-provisional-load', (e) => {
      if (e.isMainFrame) {
        loadEnd(false, e.validatedURL)
        loadFail(e, true, e.currentURL)
      }
    })
    this.webview.addEventListener('did-fail-load', (e) => {
      if (e.isMainFrame) {
        loadEnd(false, e.validatedURL)
        loadFail(e, false, e.validatedURL)
      }
    })
    this.webview.addEventListener('did-finish-load', (e) => {
      loadEnd(true, e.validatedURL)
      if (this.runInsecureContent()) {
        appActions.removeSiteSetting(this.origin, 'runInsecureContent', this.props.isPrivate)
      }
    })
    this.webview.addEventListener('did-navigate-in-page', (e) => {
      if (this.frame.isEmpty()) {
        return
      }
      if (e.isMainFrame) {
        windowActions.setNavigated(e.url, this.props.frameKey, true, this.frame.get('tabId'))
        loadEnd(true, e.url)
      }
    })
    this.webview.addEventListener('enter-html-full-screen', () => {
      if (this.frame.isEmpty()) {
        return
      }
      windowActions.setFullScreen(this.frame, true, true)
      // disable the fullscreen warning after 5 seconds
      setTimeout(windowActions.setFullScreen.bind(this, this.frame, undefined, false), 5000)
    })
    this.webview.addEventListener('leave-html-full-screen', () => {
      if (this.frame.isEmpty()) {
        return
      }
      windowActions.setFullScreen(this.frame, false)
    })
    this.webview.addEventListener('media-started-playing', ({title}) => {
      if (this.frame.isEmpty()) {
        return
      }
      windowActions.setAudioPlaybackActive(this.frame, true)
    })
    this.webview.addEventListener('media-paused', ({title}) => {
      if (this.frame.isEmpty()) {
        return
      }
      windowActions.setAudioPlaybackActive(this.frame, false)
    })
    this.webview.addEventListener('did-change-theme-color', ({themeColor}) => {
      if (this.frame.isEmpty()) {
        return
      }
      // Due to a bug in Electron, after navigating to a page with a theme color
      // to a page without a theme color, the background is sent to us as black
      // even know there is no background. To work around this we just ignore
      // the theme color in that case and let the computed theme color take over.
      windowActions.setThemeColor(this.frame, themeColor !== '#000000' ? themeColor : null)
    })
    this.webview.addEventListener('found-in-page', (e) => {
      if (this.frame.isEmpty()) {
        return
      }
      if (e.result !== undefined && (e.result.matches !== undefined || e.result.activeMatchOrdinal !== undefined)) {
        if (e.result.matches === 0) {
          windowActions.setFindDetail(this.frame, Immutable.fromJS({
            numberOfMatches: 0,
            activeMatchOrdinal: 0
          }))
          return
        }
        windowActions.setFindDetail(this.frame, Immutable.fromJS({
          numberOfMatches: e.result.matches || (this.props.findDetail && this.props.findDetail.get('numberOfMatches')) || 0,
          activeMatchOrdinal: e.result.activeMatchOrdinal || (this.props.findDetail && this.props.findDetail.get('activeMatchOrdinal'))
        }))
      }
    })
    this.webview.addEventListener('did-get-response-details', (details) => {
      if (this.frame.isEmpty()) {
        return
      }
      windowActions.gotResponseDetails(this.frame.get('tabId'), details)
    })
    // Handle zoom using Ctrl/Cmd and the mouse wheel.
    this.webview.addEventListener('mousewheel', this.onMouseWheel.bind(this))
  }

  get origin () {
    return siteUtil.getOrigin(this.props.location)
  }

  onFocus () {
    if (!this.frame.isEmpty()) {
      windowActions.setTabPageIndexByFrame(this.frame)
    }

    // Make sure urlBar focused state is updated so that on tab
    // changes the focus state doesn't go back to the urlBar
    windowActions.setUrlBarFocused(false)
    windowActions.setUrlBarActive(false)

    windowActions.setContextMenuDetail()
    windowActions.setPopupWindowDetail()
  }

  onFindAgain (forward) {
    if (!this.props.findbarShown) {
      windowActions.setFindbarShown(this.frame, true)
    }
    const searchString = this.props.findDetail && this.props.findDetail.get('searchString')
    if (searchString) {
      webviewActions.findInPage(searchString, (this.props.findDetail && this.props.findDetail.get('caseSensitivity')) || undefined, forward, this.props.findDetail.get('internalFindStatePresent'), this.webview)
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

  getWebRTCPolicy (props) {
    const braverySettings = this.getFrameBraverySettings(props)
    if (!braverySettings || braverySettings.get('fingerprintingProtection') !== true) {
      return WEBRTC_DEFAULT
    } else {
      return WEBRTC_DISABLE_NON_PROXY
    }
  }

  render () {
    const messageBoxDetail = this.tab && this.tab.get('messageBoxDetail')
    return <div
      data-partition={frameStateUtil.getPartition(this.frame)}
      className={cx({
        frameWrapper: true,
        isPreview: this.props.isPreview,
        isActive: this.props.isActive
      })}>
      {
        this.props.isFullScreen && this.props.showFullScreenWarning
        ? <FullScreenWarning location={this.props.location} />
        : null
      }
      <div ref={(node) => { this.webviewContainer = node }}
        className={cx({
          webviewContainer: true,
          isPreview: this.props.isPreview
        })} />
      {
        this.props.hrefPreview
        ? <div className={cx({
          hrefPreview: true,
          right: this.props.showOnRight
        })}>
          {this.props.hrefPreview}
        </div>
        : null
      }
      {
        messageBoxDetail
        ? <MessageBox
          isActive={this.props.isActive}
          tabId={this.frame.get('tabId')}
          detail={messageBoxDetail} />
        : null
      }
    </div>
  }
}

module.exports = Frame
