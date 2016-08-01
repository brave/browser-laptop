/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const urlParse = require('url').parse
const windowActions = require('../actions/windowActions')
const appActions = require('../actions/appActions')
const ImmutableComponent = require('./immutableComponent')
const Immutable = require('immutable')
const cx = require('../lib/classSet.js')
const siteUtil = require('../state/siteUtil')
const FrameStateUtil = require('../state/frameStateUtil')
const UrlUtil = require('../lib/urlutil')
const { getZoomValuePercentage, getNextZoomLevel } = require('../lib/zoom')
const messages = require('../constants/messages.js')
const contextMenus = require('../contextMenus')
const config = require('../constants/config.js')
const siteHacks = require('../data/siteHacks')
const ipc = global.require('electron').ipcRenderer
const clipboard = global.require('electron').clipboard
const FullScreenWarning = require('./fullScreenWarning')
const debounce = require('../lib/debounce.js')
const getSetting = require('../settings').getSetting
const settings = require('../constants/settings')
const FindBar = require('./findbar.js')
const { aboutUrls, isSourceAboutUrl, isTargetAboutUrl, getTargetAboutUrl, getBaseUrl, isNavigatableAboutPage } = require('../lib/appUrlUtil')
const { isFrameError } = require('../lib/errorUtil')
const locale = require('../l10n')
const appConfig = require('../constants/appConfig')
const { getSiteSettingsForHostPattern } = require('../state/siteSettings')
const flash = require('../flash')
const currentWindow = require('../../app/renderer/currentWindow')

const WEBRTC_DEFAULT = 'default'
const WEBRTC_DISABLE_NON_PROXY = 'disable_non_proxied_udp'
// Looks like Brave leaks true public IP from behind system proxy when this option
// is on.
// const WEBRTC_PUBLIC_ONLY = 'default_public_interface_only'

class Frame extends ImmutableComponent {
  constructor () {
    super()
    this.onUpdateWheelZoom = debounce(this.onUpdateWheelZoom.bind(this), 20)
    this.onFind = this.onFind.bind(this)
    this.onFindHide = this.onFindHide.bind(this)
    this.onFocus = this.onFocus.bind(this)
    // Maps notification message to its callback
    this.notificationCallbacks = {}
    // Change to DNT requires restart
    this.doNotTrack = getSetting(settings.DO_NOT_TRACK)
    // Counter for detecting PDF URL redirect loops
    this.reloadCounter = {}
  }

  isAboutPage () {
    return aboutUrls.get(getBaseUrl(this.props.frame.get('location')))
  }

  updateAboutDetails () {
    let location = getBaseUrl(this.props.frame.get('location'))
    if (location === 'about:preferences') {
      this.webview.send(messages.SETTINGS_UPDATED, this.props.settings ? this.props.settings.toJS() : null)
      this.webview.send(messages.SITE_SETTINGS_UPDATED, this.props.allSiteSettings ? this.props.allSiteSettings.toJS() : null)
      this.webview.send(messages.BRAVERY_DEFAULTS_UPDATED, this.props.braveryDefaults)
    } else if (location === 'about:bookmarks') {
      this.webview.send(messages.BOOKMARKS_UPDATED, {
        bookmarks: this.props.bookmarks.toJS(),
        bookmarkFolders: this.props.bookmarkFolders.toJS()
      })
    } else if (location === 'about:downloads') {
      this.webview.send(messages.DOWNLOADS_UPDATED, {
        downloads: this.props.downloads.toJS()
      })
    } else if (location === 'about:passwords') {
      if (this.props.passwords) {
        this.webview.send(messages.PASSWORD_DETAILS_UPDATED, this.props.passwords.toJS())
      }
      if (this.props.allSiteSettings) {
        this.webview.send(messages.PASSWORD_SITE_DETAILS_UPDATED,
                            this.props.allSiteSettings.filter((setting) => setting.get('savePasswords') === false).toJS())
      }
    } else if (location === 'about:flash') {
      this.webview.send(messages.BRAVERY_DEFAULTS_UPDATED, this.props.braveryDefaults)
    }

    // send state to about pages
    let aboutDetails = this.props.frame.get('aboutDetails')
    if (this.isAboutPage() && aboutDetails) {
      this.webview.send(messages.STATE_UPDATED, aboutDetails.toJS())
    }
  }

  shouldCreateWebview () {
    return !this.webview || this.webview.allowRunningInsecureContent !== this.allowRunningInsecureContent() ||
      !!this.webview.allowRunningPlugins !== this.allowRunningPlugins()
  }

  allowRunningInsecureContent () {
    let hack = siteHacks[urlParse(this.props.frame.get('location')).hostname]
    return !!(hack && hack.allowRunningInsecureContent)
  }

  allowRunningPlugins (url) {
    if (!this.props.flashInitialized) {
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
    if (activeSiteSettings && typeof activeSiteSettings.get('flash') === 'number') {
      return true
    }
    return false
  }

  expireFlash (origin) {
    // Expired Flash settings should be deleted when the webview is
    // navigated or closed.
    const activeSiteSettings = getSiteSettingsForHostPattern(this.props.allSiteSettings,
                                                             origin)
    if (activeSiteSettings && typeof activeSiteSettings.get('flash') === 'number') {
      if (activeSiteSettings.get('flash') < Date.now()) {
        // Expired entry. Remove it.
        appActions.removeSiteSetting(origin, 'flash')
      }
    }
  }

  componentWillUnmount () {
    this.expireFlash(this.origin)
  }

  updateWebview (cb) {
    // lazy load webview
    if (!this.webview && !this.props.isActive && !this.props.isPreview &&
        // allow force loading of new frames
        this.props.frame.get('unloaded') === true &&
        // don't lazy load about pages
        !aboutUrls.get(getBaseUrl(this.props.frame.get('location'))) &&
        // pinned tabs don't serialize their state so the icon is lost for lazy loading
        !this.props.frame.get('pinnedLocation')) {
      return
    }

    // TODO see https://github.com/brave/browser-laptop/issues/2473
    // let src = this.props.frame.get('src')
    let location = this.props.frame.get('location')

    // Create the webview dynamically because React doesn't whitelist all
    // of the attributes we need
    let webviewAdded = false
    let guestInstanceId = null
    if (this.shouldCreateWebview()) {
      // only set the guestInstanceId if this is a new frame
      if (this.webview == null) {
        guestInstanceId = this.props.frame.get('guestInstanceId')
      }
      while (this.webviewContainer.firstChild) {
        this.webviewContainer.removeChild(this.webviewContainer.firstChild)
      }
      // the webview tag is where the user's page is rendered (runs in its own process)
      // @see http://electron.atom.io/docs/api/web-view-tag/
      this.webview = document.createElement('webview')

      let partition = FrameStateUtil.getPartition(this.props.frame)
      ipc.sendSync(messages.INITIALIZE_PARTITION, partition)
      this.webview.setAttribute('partition', partition)

      if (guestInstanceId) {
        this.webview.setAttribute('data-guest-instance-id', guestInstanceId)
      }
      webviewAdded = true
    }
    this.webview.setAttribute('allowDisplayingInsecureContent', true)
    this.webview.setAttribute('data-frame-key', this.props.frame.get('key'))

    const parsedUrl = urlParse(location)
    if (!appConfig.uaExceptionHosts.includes(parsedUrl.hostname)) {
      this.webview.setAttribute('useragent', getSetting(settings.USERAGENT) || '')
    }
    const hack = siteHacks[parsedUrl.hostname]
    if (hack && hack.userAgent) {
      this.webview.setAttribute('useragent', hack.userAgent)
    }
    if (this.allowRunningInsecureContent()) {
      this.webview.setAttribute('allowRunningInsecureContent', true)
      this.webview.allowRunningInsecureContent = true
    }
    if (this.allowRunningPlugins()) {
      this.webview.setAttribute('plugins', true)
      this.webview.allowRunningPlugins = true
    }

    if (!guestInstanceId || location !== 'about:blank') {
      this.webview.setAttribute('location', isSourceAboutUrl(location) ? getTargetAboutUrl(location) : location)
    }

    if (webviewAdded) {
      if (cb) {
        this.runOnDomReady = cb
        let eventCallback = (e) => {
          this.webview.removeEventListener(e.type, eventCallback)
          this.runOnDomReady()
          delete this.runOnDomReady
        }
        this.webview.addEventListener('did-attach', eventCallback)
      }
      this.addEventListeners()
      this.webviewContainer.appendChild(this.webview)
    } else {
      cb && cb()
    }
  }

  componentDidMount () {
    const cb = () => {
      this.webview.setActive(this.props.isActive)
      this.webview.setZoomFactor(getZoomValuePercentage(this.zoomLevel) / 100)
      this.webview.setAudioMuted(this.props.frame.get('audioMuted') || false)
      this.updateAboutDetails()
    }
    this.updateWebview(cb)
  }

  get zoomLevel () {
    const activeSiteSettings = this.props.frameSiteSettings
    if (!activeSiteSettings || activeSiteSettings.get('zoomLevel') === undefined) {
      const settingDefaultZoom = getSetting(settings.DEFAULT_ZOOM_LEVEL)
      return settingDefaultZoom === undefined || settingDefaultZoom === null ? config.zoom.defaultValue : settingDefaultZoom
    }
    return activeSiteSettings.get('zoomLevel')
  }

  zoom (zoomIn) {
    const newZoomLevel =
      zoomIn === undefined ? undefined : getNextZoomLevel(this.zoomLevel, zoomIn)
    appActions.changeSiteSetting(this.origin, 'zoomLevel', newZoomLevel,
                                 this.props.frame.get('isPrivate'))
  }

  zoomIn () {
    this.zoom(true)
  }

  zoomOut () {
    this.zoom(false)
  }

  zoomReset () {
    this.zoom()
  }

  componentDidUpdate (prevProps, prevState) {
    const cb = () => {
      if (this.webRTCPolicy !== this.getWebRTCPolicy()) {
        this.webview.setWebRTCIPHandlingPolicy(this.getWebRTCPolicy())
      }
      this.webview.setActive(this.props.isActive)
      this.handleShortcut()
      this.webview.setZoomFactor(getZoomValuePercentage(this.zoomLevel) / 100)
      // give focus when switching tabs
      if (this.props.isActive && !prevProps.isActive) {
        this.webview.focus()
      }

      // make sure the webview content updates to
      // match the fullscreen state of the frame
      if (prevProps.frame.get('isFullScreen') !==
         this.props.frame.get('isFullScreen')) {
        if (this.props.frame.get('isFullScreen')) {
          this.webview.executeJavaScript('document.webkitRequestFullscreen()')
        } else {
          this.webview.executeJavaScript('document.webkitExitFullscreen()')
        }
      }
      this.webview.setAudioMuted(this.props.frame.get('audioMuted') || false)
      this.updateAboutDetails()
    }

    // For cross-origin navigation, clear temp Flash approvals
    const prevOrigin = siteUtil.getOrigin(prevProps.frame.get('location'))
    if (this.origin !== prevOrigin) {
      this.expireFlash(prevOrigin)
    }

    if (this.props.frame.get('location') !== prevProps.frame.get('location')) {
      this.updateWebview(cb)
    } else if (this.shouldCreateWebview()) {
      // plugin/insecure-content allow state has changed. recreate with the current
      // location, not the src.
      this.updateWebview(cb)
    } else {
      if (this.runOnDomReady) {
        // there is already a callback waiting for did-attach
        // so replace it with this callback because it might be a
        // mount callback which is a subset of the update callback
        this.runOnDomReady = cb
      } else {
        cb()
      }
    }
  }

  clone (args) {
    if (!isNavigatableAboutPage(getBaseUrl(this.props.frame.get('location')))) {
      return
    }
    const newGuest = this.webview.clone()
    const newGuestInstanceId = newGuest.getWebPreferences().guestInstanceId
    let cloneAction
    if (args && args.get('back')) {
      cloneAction = newGuest.goBack
    } else if (args && args.get('forward')) {
      cloneAction = () => newGuest.goForward
    }
    if (cloneAction) {
      newGuest.once('did-attach', cloneAction.bind(newGuest))
    }
    windowActions.cloneFrame(this.props.frame, newGuestInstanceId, args && args.get('openInForeground'))
  }

  handleShortcut () {
    const activeShortcut = this.props.frame.get('activeShortcut')
    const activeShortcutDetails = this.props.frame.get('activeShortcutDetails')
    const location = this.props.frame.get('location')
    switch (activeShortcut) {
      case 'stop':
        this.webview.stop()
        break
      case 'reload':
        if (this.isAboutPage()) {
          break
        }
        // Ensure that the webview thinks we're on the same location as the browser does.
        // This can happen for pages which don't load properly.
        // Some examples are basic http auth and bookmarklets.
        // In this case both the user display and the user think they're on frame.get('location').
        if (this.webview.getURL() !== location) {
          this.webview.loadURL(location)
        } else {
          this.webview.reload()
        }
        break
      case 'clean-reload':
        if (this.isAboutPage()) {
          break
        }
        this.webview.reloadIgnoringCache()
        break
      case 'clone':
        this.clone(activeShortcutDetails)
        break
      case 'explicitLoadURL':
        this.webview.loadURL(location)
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
      case 'toggle-dev-tools':
        if (this.webview.isDevToolsOpened()) {
          this.webview.closeDevTools()
        } else {
          this.webview.openDevTools()
        }
        break
      case 'view-source':
        const sourceLocation = UrlUtil.getViewSourceUrlFromUrl(this.webview.getURL())
        windowActions.newFrame({location: sourceLocation}, true)
        // TODO: Make the URL bar show the view-source: prefix
        break
      case 'save':
        // TODO: Sometimes this tries to save in a non-existent directory
        this.webview.downloadURL(this.webview.getURL())
        break
      case 'print':
        this.webview.print()
        break
      case 'show-findbar':
        windowActions.setFindbarShown(this.props.frame, true)
        break
      case 'fill-password':
        let currentUrl = urlParse(this.webview.getURL())
        if (currentUrl &&
            [currentUrl.protocol, currentUrl.host].join('//') === activeShortcutDetails.get('origin')) {
          this.webview.send(messages.GOT_PASSWORD,
                            activeShortcutDetails.get('username'),
                            activeShortcutDetails.get('password'),
                            activeShortcutDetails.get('origin'),
                            activeShortcutDetails.get('action'),
                            true)
        }
        break
      case 'focus-webview':
        setImmediate(() => this.webview.focus())
        break
      case 'load-non-navigatable-url':
        this.webview.loadURL(this.props.frame.get('activeShortcutDetails'))
        break
      case 'copy':
        let selection = window.getSelection()
        if (selection && selection.toString()) {
          clipboard.writeText(selection.toString())
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
    if (activeShortcut) {
      windowActions.setActiveFrameShortcut(this.props.frame, null, null)
    }
  }

  addEventListeners () {
    this.webview.addEventListener('content-blocked', (e) => {
      if (e.details[0] === 'javascript') {
        windowActions.setBlockedBy(this.props.frame, 'noScript', e.details[1])
      }
    })
    this.webview.addEventListener('context-menu', (e) => {
      contextMenus.onMainContextMenu(e.params, this.props.frame)
      e.preventDefault()
      e.stopPropagation()
    })
    this.webview.addEventListener('update-target-url', (e) => {
      const downloadsBarHeight = 50
      let nearBottom = e.y > (window.innerHeight - 150 - downloadsBarHeight) // todo: magic number
      let mouseOnLeft = e.x < (window.innerWidth / 2)
      let showOnRight = nearBottom && mouseOnLeft
      windowActions.setLinkHoverPreview(e.url, showOnRight)
    })
    this.webview.addEventListener('set-active', (e) => {
      if (e.active && currentWindow.isFocused()) {
        windowActions.setFocusedFrame(this.props.frame)
      }
      if (e.active && !this.props.isActive) {
        windowActions.setActiveFrame(this.props.frame)
      }
    })
    this.webview.addEventListener('focus', this.onFocus)
    this.webview.addEventListener('mouseenter', (e) => {
      currentWindow.webContents.send(messages.ENABLE_SWIPE_GESTURE)
    })
    this.webview.addEventListener('mouseleave', (e) => {
      currentWindow.webContents.send(messages.DISABLE_SWIPE_GESTURE)
    })
    // @see <a href="https://github.com/atom/electron/blob/master/docs/api/web-view-tag.md#event-new-window">new-window event</a>
    this.webview.addEventListener('new-window', (e) => {
      e.preventDefault()

      let guestInstanceId = e.options && e.options.webPreferences && e.options.webPreferences.guestInstanceId
      let windowOpts = e.options && e.options.windowOptions || {}
      windowOpts.parentWindowKey = currentWindow.id
      windowOpts.disposition = e.disposition
      let delayedLoadUrl = e.options && e.options.delayedLoadUrl

      let frameOpts = {
        location: e.url,
        parentFrameKey: this.props.frame.get('key'),
        isPrivate: this.props.frame.get('isPrivate'),
        partitionNumber: this.props.frame.get('partitionNumber'),
        // use the delayed load url for the temporary title
        delayedLoadUrl,
        guestInstanceId
      }

      if (e.disposition === 'new-window' || e.disposition === 'new-popup') {
        appActions.newWindow(frameOpts, windowOpts)
      } else {
        let openInForeground = this.props.prefOpenInForeground === true ||
          e.disposition !== 'background-tab'
        windowActions.newFrame(frameOpts, openInForeground)
      }
    })
    this.webview.addEventListener('did-attach', (e) => {
      let tabId = this.webview.getWebContents().getId()
      if (this.props.frame.get('tabId') !== tabId) {
        windowActions.setFrameTabId(this.props.frame, tabId)
      }
    })
    this.webview.addEventListener('destroyed', (e) => {
      this.props.onCloseFrame(this.props.frame)
    })
    this.webview.addEventListener('close', () => {
      this.props.onCloseFrame(this.props.frame)
    })
    this.webview.addEventListener('page-favicon-updated', (e) => {
      if (e.favicons && e.favicons.length > 0) {
        windowActions.setFavicon(this.props.frame, e.favicons[0])
      }
    })
    this.webview.addEventListener('page-title-updated', ({title}) => {
      windowActions.setFrameTitle(this.props.frame, title)
    })
    this.webview.addEventListener('ipc-message', (e) => {
      let method = () => {}
      switch (e.channel) {
        case messages.GOT_CANVAS_FINGERPRINTING:
          method = (detail) => {
            const description = [detail.type, detail.scriptUrl || this.props.frame.get('location')].join(': ')
            windowActions.setBlockedBy(this.props.frame, 'fingerprintingProtection', description)
          }
          break
        case messages.THEME_COLOR_COMPUTED:
          method = (computedThemeColor) =>
            windowActions.setThemeColor(this.props.frame, undefined, computedThemeColor || null)
          break
        case messages.CONTEXT_MENU_OPENED:
          method = (nodeProps, contextMenuType) => {
            contextMenus.onMainContextMenu(nodeProps, this.props.frame, contextMenuType)
          }
          break
        case messages.STOP_LOAD:
          method = () => this.webview.stop()
          break
        case messages.GO_BACK:
          method = () => this.webview.goBack()
          break
        case messages.GO_FORWARD:
          method = () => this.webview.goForward()
          break
        case messages.RELOAD:
          method = () => {
            const location = this.props.frame.get('location')
            this.reloadCounter[location] = this.reloadCounter[location] || 0
            if (this.reloadCounter[location] < 2) {
              this.webview.reload()
              this.reloadCounter[location] = this.reloadCounter[location] + 1
            }
          }
          break
        case messages.CAN_SWIPE_BACK:
          currentWindow.webContents.send(messages.CAN_SWIPE_BACK)
          break
        case messages.CAN_SWIPE_FORWARD:
          currentWindow.webContents.send(messages.CAN_SWIPE_FORWARD)
          break
        case messages.NEW_FRAME:
          method = (frameOpts, openInForeground) => {
            windowActions.newFrame(frameOpts, openInForeground)
          }
      }
      method.apply(this, e.args)
    })

    const interceptFlash = (adobeUrl) => {
      if (!this.origin) {
        return
      }
      const activeSiteSettings = getSiteSettingsForHostPattern(this.props.allSiteSettings,
                                                               this.origin)
      if (activeSiteSettings && activeSiteSettings.get('flash') === false) {
        return
      }

      this.webview.stop()
      // Generate a random string that is unlikely to collide. Not
      // cryptographically random.
      const nonce = Math.random().toString()
      if (this.props.flashInitialized) {
        const message = locale.translation('allowFlashPlayer').replace(/{{\s*origin\s*}}/, this.origin)
        // Show Flash notification bar
        appActions.showMessageBox({
          buttons: [locale.translation('deny'), locale.translation('allow')],
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
              appActions.changeSiteSetting(this.origin, 'flash', Date.now() + 7 * 24 * 1000 * 3600)
            } else {
              appActions.changeSiteSetting(this.origin, 'flash', 1)
            }
          } else {
            appActions.hideMessageBox(message)
            if (persist) {
              appActions.changeSiteSetting(this.origin, 'flash', false)
            }
          }
        }
      } else {
        flash.checkFlashInstalled((installed) => {
          if (installed) {
            currentWindow.webContents.send(messages.SHOW_NOTIFICATION,
                                           locale.translation('flashInstalled'))
          } else {
            windowActions.loadUrl(this.props.frame, adobeUrl)
          }
        })
      }
      ipc.once(messages.NOTIFICATION_RESPONSE + nonce, (e, msg, buttonIndex, persist) => {
        const cb = this.notificationCallbacks[msg]
        if (cb) {
          cb(buttonIndex, persist)
        }
      })
    }

    const loadStart = (e) => {
      const parsedUrl = urlParse(e.url)
      // Instead of telling person to install Flash, ask them if they want to
      // run Flash if it's installed.
      if (e.isMainFrame && !e.isErrorPage && !e.isFrameSrcDoc) {
        if (UrlUtil.isFlashInstallUrl(e.url) &&
            UrlUtil.shouldInterceptFlash(this.props.frame.get('provisionalLocation'))) {
          interceptFlash(e.url)
        }
        windowActions.onWebviewLoadStart(this.props.frame, e.url)
        const isSecure = parsedUrl.protocol === 'https:' && !this.allowRunningInsecureContent()
        windowActions.setSecurityState(this.props.frame, {
          secure: isSecure
        })
        if (isSecure) {
          // Check that there isn't a cert error.
          ipc.send(messages.CHECK_CERT_ERROR_ACCEPTED, parsedUrl.host, this.props.frame.get('key'))
        }
      }
      windowActions.updateBackForwardState(
        this.props.frame,
        this.webview.canGoBack(),
        this.webview.canGoForward())
      const hack = siteHacks[parsedUrl.hostname]
      if (hack && hack.pageLoadStartScript) {
        this.webview.executeJavaScript(hack.pageLoadStartScript)
      }
      if (this.doNotTrack) {
        this.webview.executeJavaScript('Navigator.prototype.__defineGetter__("doNotTrack", () => {return 1});')
      }
    }
    const loadEnd = (savePage) => {
      windowActions.onWebviewLoadEnd(
        this.props.frame,
        this.webview.getURL())

      const parsedUrl = urlParse(this.props.frame.get('location'))
      const protocol = parsedUrl.protocol
      const isError = this.props.frame.getIn(['aboutDetails', 'errorCode'])
      if (!this.props.frame.get('isPrivate') && this.props.frame.get('provisionalLocation') === this.props.frame.get('location') && (protocol === 'http:' || protocol === 'https:') && !isError && savePage) {
        // Register the site for recent history for navigation bar
        appActions.addSite(siteUtil.getDetailFromFrame(this.props.frame))
      }

      const hack = siteHacks[parsedUrl.hostname]
      if (hack && hack.pageLoadEndScript) {
        this.webview.executeJavaScript(hack.pageLoadEndScript)
      }
    }
    const loadFail = (e) => {
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
          this.goBack()
          windowActions.newFrame({location: e.validatedURL}, true)
          return
        }

        windowActions.setFrameError(this.props.frame, {
          event_type: 'did-fail-load',
          errorCode: e.errorCode,
          url: e.validatedURL
        })
        windowActions.loadUrl(this.props.frame, 'about:error')
        appActions.removeSite(siteUtil.getDetailFromFrame(this.props.frame))
      }
    }
    this.webview.addEventListener('load-commit', (e) => {
      loadStart(e)
    })
    this.webview.addEventListener('load-start', (e) => {
      // XXX: loadstart probably does not need to be called twice anymore.
      loadStart(e)
    })

    this.webview.addEventListener('did-navigate', (e) => {
      if (this.props.frame.get('findbarShown')) {
        this.onFindHide()
      }
      for (let message in this.notificationCallbacks) {
        appActions.hideMessageBox(message)
      }
      this.notificationCallbacks = {}
      // only give focus focus is this is not the initial default page load
      if (this.props.isActive && this.webview.canGoBack() && document.activeElement !== this.webview) {
        this.webview.focus()
      }
      windowActions.setNavigated(e.url, this.props.frame.get('key'), false)
    })
    this.webview.addEventListener('crashed', (e) => {
      windowActions.setFrameError(this.props.frame, {
        event_type: 'crashed',
        title: 'unexpectedError',
        url: this.props.frame.get('location')
      })
      windowActions.loadUrl(this.props.frame, 'about:error')
      this.webview = false
    })
    this.webview.addEventListener('did-fail-provisional-load', (e) => {
      if (e.isMainFrame) {
        loadEnd(false)
        loadFail(e)
      }
    })
    this.webview.addEventListener('did-fail-load', (e) => {
      if (e.isMainFrame) {
        loadEnd(false)
        loadFail(e)
      }
    })
    this.webview.addEventListener('did-finish-load', () => {
      loadEnd(true)
    })
    this.webview.addEventListener('did-navigate-in-page', (e) => {
      windowActions.setNavigated(e.url, this.props.frame.get('key'), true)
      loadEnd(true)
    })
    this.webview.addEventListener('enter-html-full-screen', () => {
      windowActions.setFullScreen(this.props.frame, true, true)
      // disable the fullscreen warning after 5 seconds
      setTimeout(windowActions.setFullScreen.bind(this, this.props.frame, undefined, false), 5000)
    })
    this.webview.addEventListener('leave-html-full-screen', () => {
      windowActions.setFullScreen(this.props.frame, false)
    })
    this.webview.addEventListener('media-started-playing', ({title}) => {
      windowActions.setAudioPlaybackActive(this.props.frame, true)
    })
    this.webview.addEventListener('media-paused', ({title}) => {
      windowActions.setAudioPlaybackActive(this.props.frame, false)
    })
    this.webview.addEventListener('did-change-theme-color', ({themeColor}) => {
      // Due to a bug in Electron, after navigating to a page with a theme color
      // to a page without a theme color, the background is sent to us as black
      // even know there is no background. To work around this we just ignore
      // the theme color in that case and let the computed theme color take over.
      windowActions.setThemeColor(this.props.frame, themeColor !== '#000000' ? themeColor : null)
    })
    this.webview.addEventListener('found-in-page', (e) => {
      if (e.result !== undefined && (e.result.matches !== undefined || e.result.activeMatchOrdinal !== undefined)) {
        if (e.result.matches === 0) {
          windowActions.setFindDetail(this.props.frame, Immutable.fromJS({
            numberOfMatches: 0,
            activeMatchOrdinal: 0
          }))
          return
        }
        windowActions.setFindDetail(this.props.frame, Immutable.fromJS({
          numberOfMatches: e.result.matches || this.props.frame.getIn(['findDetail', 'numberOfMatches']),
          activeMatchOrdinal: e.result.activeMatchOrdinal || this.props.frame.getIn(['findDetail', 'activeMatchOrdinal'])
        }))
      }
    })

    // Handle zoom using Ctrl/Cmd and the mouse wheel.
    this.webview.addEventListener('mousewheel', this.onMouseWheel.bind(this))
  }

  goBack () {
    this.webview.goBack()
  }

  getHistoryEntry (sites, webContent, index) {
    const url = webContent.getURLAtIndex(index)
    const title = webContent.getTitleAtIndex(index)

    let entry = {
      index: index,
      url: url,
      display: title || url,
      icon: null
    }

    if (url.startsWith('chrome-extension://')) {
      // TODO: return brave lion (or better: get icon from extension if possible as data URI)
    } else {
      if (sites) {
        const site = sites.find(function (element) { return element.get('location') === url })
        if (site) { entry.icon = site.get('favicon') }
      }

      if (!entry.icon) { entry.icon = UrlUtil.getDefaultFaviconUrl(url) }
    }

    return entry
  }

  getHistory (appState) {
    const webContent = this.webview.getWebContents()
    const historyCount = webContent.getEntryCount()
    const sites = appState ? appState.get('sites') : null

    let history = {
      count: historyCount,
      currentIndex: webContent.getCurrentEntryIndex(),
      entries: []
    }

    for (let index = 0; index < historyCount; index++) {
      history.entries.push(this.getHistoryEntry(sites, webContent, index))
    }

    return history
  }

  goToIndex (index) {
    this.webview.goToIndex(index)
  }

  goForward () {
    this.webview.goForward()
  }

  get origin () {
    return siteUtil.getOrigin(this.props.frame.get('location'))
  }

  onFocus () {
    windowActions.setTabPageIndexByFrame(this.props.frame)
    windowActions.setUrlBarActive(false)
    windowActions.setContextMenuDetail()
    windowActions.setPopupWindowDetail()
  }

  onFindAgain (forward) {
    if (!this.props.frame.get('findbarShown')) {
      windowActions.setFindbarShown(this.props.frame, true)
    }
    const searchString = this.props.frame.getIn(['findDetail', 'searchString'])
    if (searchString) {
      this.onFind(searchString, this.props.frame.getIn(['findDetail', 'caseSensitivity']), forward)
    }
  }

  onFindHide () {
    windowActions.setFindbarShown(this.props.frame, false)
    this.webview.stopFindInPage('keepSelection')
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

  onFind (searchString, caseSensitivity, forward) {
    if (searchString) {
      this.webview.findInPage(searchString, {
        matchCase: caseSensitivity,
        forward: forward !== undefined ? forward : true,
        findNext: forward !== undefined
      })
    } else {
      this.onClearMatch()
    }
  }

  onClearMatch () {
    this.webview.stopFindInPage('clearSelection')
  }

  get webRTCPolicy () {
    return this.webview ? this.webview.getWebRTCIPHandlingPolicy() : WEBRTC_DEFAULT
  }

  getWebRTCPolicy () {
    const braverySettings = this.props.frameBraverySettings
    if (!braverySettings || braverySettings.get('fingerprintingProtection') !== true) {
      return WEBRTC_DEFAULT
    } else {
      return WEBRTC_DISABLE_NON_PROXY
    }
  }

  render () {
    return <div
      className={cx({
        frameWrapper: true,
        isPreview: this.props.isPreview,
        isActive: this.props.isActive
      })}>
      {
        this.props.frame.get('isFullScreen') && this.props.frame.get('showFullScreenWarning')
        ? <FullScreenWarning frameProps={this.props.frame} />
        : null
      }
      {
        this.props.frame.get('findbarShown')
        ? <FindBar
          onFind={this.onFind}
          onFindHide={this.onFindHide}
          frame={this.props.frame}
          selected={this.props.frame.get('findbarSelected')}
          findDetail={this.props.frame.get('findDetail')} />
        : null
      }
      <div ref={(node) => { this.webviewContainer = node }}
        className={cx({
          webviewContainer: true,
          isPreview: this.props.isPreview
        })} />
      {
        this.props.frame.get('hrefPreview')
        ? <div className={cx({
          hrefPreview: true,
          right: this.props.frame.get('showOnRight')
        })}>
          {this.props.frame.get('hrefPreview')}
        </div>
        : null
      }
    </div>
  }
}

module.exports = Frame
