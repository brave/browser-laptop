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
const UrlUtil = require('../lib/urlutil')
const messages = require('../constants/messages.js')
const remote = global.require('electron').remote
const contextMenus = require('../contextMenus')
const config = require('../constants/config.js')
const siteHacks = require('../data/siteHacks')
const ipc = global.require('electron').ipcRenderer
const FullScreenWarning = require('./fullScreenWarning')
const debounce = require('../lib/debounce.js')
const getSetting = require('../settings').getSetting
const settings = require('../constants/settings')
const adInfo = require('../data/adInfo.js')
const FindBar = require('./findbar.js')
const consoleStrings = require('../constants/console')
const { aboutUrls, isSourceAboutUrl, isTargetAboutUrl, getTargetAboutUrl, getBaseUrl } = require('../lib/appUrlUtil')
const { isFrameError } = require('../lib/errorUtil')

class Frame extends ImmutableComponent {
  constructor () {
    super()
    this.onUpdateWheelZoom = debounce(this.onUpdateWheelZoom.bind(this), 20)
    this.onFind = this.onFind.bind(this)
    this.onFindHide = this.onFindHide.bind(this)
    this.onFocus = this.onFocus.bind(this)
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
    }

    // send state to about pages
    let aboutDetails = this.props.frame.get('aboutDetails')
    if (this.isAboutPage() && aboutDetails) {
      this.webview.send('state-updated', aboutDetails.toJS())
    }
  }

  shouldCreateWebview () {
    return !this.webview || this.webview.allowRunningInsecureContent !== this.allowRunningInsecureContent()
  }

  allowRunningInsecureContent () {
    let hack = siteHacks[urlParse(this.props.frame.get('location')).hostname]
    return !!(hack && hack.allowRunningInsecureContent)
  }

  updateWebview (cb) {
    // lazy load webview
    if (!this.webview && !this.props.isActive && !this.props.isPreview &&
        // allow force loading of new frames
        this.props.frame.get('unloaded') === true &&
        // don't lazy load about pages
        !aboutUrls.get(getBaseUrl(this.props.frame.get('src'))) &&
        // pinned tabs don't serialize their state so the icon is lost for lazy loading
        !this.props.frame.get('pinnedLocation')) {
      return
    }

    let src = this.props.frame.get('src')
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
      this.webview = document.createElement('webview')
      src = location
      webviewAdded = true
    }
    this.webview.setAttribute('allowDisplayingInsecureContent', true)
    this.webview.setAttribute('data-frame-key', this.props.frame.get('key'))
    this.webview.setAttribute('useragent', getSetting(settings.USERAGENT) || '')

    let partition
    if (this.props.frame.get('isPrivate')) {
      partition = 'private-1'
    } else if (this.props.frame.get('partitionNumber')) {
      partition = `persist:partition-${this.props.frame.get('partitionNumber')}`
    }
    if (partition) {
      ipc.send(messages.INITIALIZE_PARTITION, partition)
      this.webview.setAttribute('partition', partition)
    }
    if (guestInstanceId) {
      this.webview.setAttribute('data-guest-instance-id', this.props.frame.get('guestInstanceId'))
    }

    const hack = siteHacks[urlParse(location).hostname]
    if (hack && hack.userAgent) {
      this.webview.setAttribute('useragent', hack.userAgent)
    }
    if (this.allowRunningInsecureContent()) {
      this.webview.setAttribute('allowRunningInsecureContent', true)
      this.webview.allowRunningInsecureContent = true
    }
    this.webview.setAttribute('src',
                              isSourceAboutUrl(src) ? getTargetAboutUrl(src) : src)
    if (webviewAdded) {
      let runOnDomReady = (e) => {
        this.webview.removeEventListener(e.type, runOnDomReady)
        cb && cb()
      }
      this.webview.addEventListener('load-start', runOnDomReady)
      this.addEventListeners()
      this.webviewContainer.appendChild(this.webview)
    } else {
      cb && cb()
    }
  }

  componentDidMount () {
    const cb = () => {
      this.webview.setActive(this.props.isActive)
      this.webview.setHidden(!(this.props.isPreview || this.props.isActive))
      this.webview.setZoomLevel(this.zoomLevel)
      this.webview.setAudioMuted(this.props.frame.get('audioMuted') || false)
      this.updateAboutDetails()
    }
    this.updateWebview(cb)
  }

  get zoomLevel () {
    if (!this.props.activeSiteSettings || !this.props.activeSiteSettings.get('zoomLevel')) {
      return config.zoom.defaultValue
    }
    return this.props.activeSiteSettings.get('zoomLevel')
  }

  zoom (stepSize) {
    let newZoomLevel = this.zoomLevel
    if (stepSize !== undefined &&
        config.zoom.max >= this.zoomLevel + stepSize &&
      config.zoom.min <= this.zoomLevel + stepSize) {
      newZoomLevel += stepSize
    } else if (stepSize === undefined) {
      newZoomLevel = config.zoom.defaultValue
    }
    appActions.changeSiteSetting(this.origin, 'zoomLevel', newZoomLevel,
                                 this.props.frame.get('isPrivate'))
  }

  zoomIn () {
    this.zoom(config.zoom.step)
  }

  zoomOut () {
    this.zoom(config.zoom.step * -1)
  }

  zoomReset () {
    this.zoom()
  }

  componentDidUpdate (prevProps, prevState) {
    const cb = () => {
      this.webview.setActive(this.props.isActive)
      this.webview.setHidden(!(this.props.isPreview || this.props.isActive))
      this.handleShortcut()
      this.webview.setZoomLevel(this.zoomLevel)
      // give focus when switching tabs
      if (this.props.isActive && !prevProps.isActive) {
        this.webview.focus()
      }
      this.webview.setAudioMuted(this.props.frame.get('audioMuted') || false)
      this.updateAboutDetails()
    }

    if (this.shouldCreateWebview() || this.props.frame.get('src') !== prevProps.frame.get('src')) {
      this.updateWebview(cb)
    } else {
      cb()
    }
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
    }
    if (activeShortcut) {
      windowActions.setActiveFrameShortcut(this.props.frame, null, null)
    }
  }

  addEventListeners () {
    this.webview.addEventListener('set-active', (e) => {
      if (e.active && !this.props.isActive) {
        windowActions.setActiveFrame(this.props.frame)
      }
    })
    this.webview.addEventListener('focus', this.onFocus)
    // @see <a href="https://github.com/atom/electron/blob/master/docs/api/web-view-tag.md#event-new-window">new-window event</a>
    this.webview.addEventListener('new-window', (e) => {
      e.preventDefault()

      let guestInstanceId = e.options && e.options.webPreferences && e.options.webPreferences.guestInstanceId
      let windowOpts = e.options && e.options.windowOptions || {}
      windowOpts.parentWindowKey = remote.getCurrentWindow().id
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
    this.webview.addEventListener('dom-ready', (e) => {
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
        case messages.LINK_HOVERED:
          method = (href, position) => {
            position = position || {}
            const downloadsBarHeight = 50
            let nearBottom = position.y > (window.innerHeight - 150 - downloadsBarHeight) // todo: magic number
            let mouseOnLeft = position.x < (window.innerWidth / 2)
            let showOnRight = nearBottom && mouseOnLeft
            windowActions.setLinkHoverPreview(href, showOnRight)
          }
          break
        case messages.NEW_FRAME:
          method = (frameOpts, openInForeground) => {
            windowActions.newFrame(frameOpts, openInForeground)
          }
      }
      method.apply(this, e.args)
    })

    const loadStart = (e) => {
      if (e.isMainFrame && !e.isErrorPage && !e.isFrameSrcDoc) {
        windowActions.onWebviewLoadStart(this.props.frame, e.url)
        const parsedUrl = urlParse(e.url)
        const isSecure = parsedUrl.protocol === 'https:' && !this.allowRunningInsecureContent()
        windowActions.setSecurityState(this.props.frame, {
          secure: isSecure
        })
        if (isSecure) {
          // Check that there isn't a cert error.
          ipc.send(messages.CHECK_CERT_ERROR_ACCEPTED, parsedUrl.host, this.props.frame.get('key'))
        }
      }
      if (this.props.enableFingerprintingProtection) {
        this.webview.send(messages.BLOCK_CANVAS_FINGERPRINTING)
      }
      windowActions.updateBackForwardState(
        this.props.frame,
        this.webview.canGoBack(),
        this.webview.canGoForward())
    }
    const loadEnd = () => {
      windowActions.onWebviewLoadEnd(
        this.props.frame,
        this.webview.getURL())

      if (this.props.enableAds) {
        this.insertAds(this.webview.getURL())
      }
      this.initSpellCheck()
      this.webview.send(messages.POST_PAGE_LOAD_RUN)
      if (getSetting(settings.PASSWORD_MANAGER_ENABLED)) {
        this.webview.send(messages.AUTOFILL_PASSWORD)
      }

      const parsedUrl = urlParse(this.props.frame.get('location'))
      const protocol = parsedUrl.protocol
      if (!this.props.frame.get('isPrivate') && (protocol === 'http:' || protocol === 'https:')) {
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
      }
    }
    this.webview.addEventListener('load-commit', (e) => {
      loadStart(e)
    })
    this.webview.addEventListener('load-start', (e) => {
      loadStart(e)
      if (this.props.enableFingerprintingProtection) {
        this.webview.send(messages.BLOCK_CANVAS_FINGERPRINTING)
      }
    })
    this.webview.addEventListener('did-navigate', (e) => {
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
        loadFail(e)
      }
    })
    this.webview.addEventListener('did-fail-load', (e) => {
      if (e.isMainFrame) {
        loadEnd()
        loadFail(e)
      }
    })
    this.webview.addEventListener('did-finish-load', () => {
      loadEnd()
    })
    this.webview.addEventListener('did-navigate-in-page', (e) => {
      windowActions.setNavigated(e.url, this.props.frame.get('key'), true)
      loadEnd()
    })
    this.webview.addEventListener('enter-html-full-screen', () => {
      windowActions.setFullScreen(this.props.frame, true, true)
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
    this.webview.addEventListener('console-message', (e) => {
      if (this.props.enableNoScript && e.level === 2 &&
          e.message && e.message.includes(consoleStrings.SCRIPT_BLOCKED)) {
        // Note that the site was blocked
        windowActions.setBlockedBy(this.props.frame,
                                   'noScript', this.getScriptLocation(e.message))
      }
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

  getScriptLocation (msg) {
    const defaultMsg = '[Inline script]'
    if (msg.includes(consoleStrings.EXTERNAL_SCRIPT_BLOCKED)) {
      let match = /'.+?'/.exec(msg)
      return match ? match[0].replace(/'/g, '') : defaultMsg
    } else {
      return defaultMsg
    }
  }

  insertAds (currentLocation) {
    const host = new window.URL(currentLocation).hostname.replace('www.', '')
    const adDivCandidates = adInfo[host] || []
    // Call this even when there are no matches because we have some logic
    // to replace common divs.
    this.webview.send(messages.SET_AD_DIV_CANDIDATES, adDivCandidates, config.vault.replacementUrl)
  }

  initSpellCheck () {
    this.webview.send(messages.INIT_SPELL_CHECK, this.props.dictionaryLocale)
  }

  goBack () {
    this.webview.goBack()
  }

  goForward () {
    this.webview.goForward()
  }

  get origin () {
    const parsedUrl = urlParse(this.props.frame.get('location'))
    return `${parsedUrl.protocol}//${parsedUrl.host}`
  }

  onFocus () {
    windowActions.setTabPageIndexByFrame(this.props.frame)
    windowActions.setUrlBarActive(false)
    windowActions.setContextMenuDetail()
    windowActions.setPopupWindowDetail()
  }

  onFindHide () {
    windowActions.setFindbarShown(this.props.frame, false)
    this.onClearMatch()
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
