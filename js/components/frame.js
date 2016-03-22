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
const path = require('path')
const contextMenus = require('../contextMenus')
const config = require('../constants/config.js')
const siteHacks = require('../data/siteHacks')
const ipc = global.require('electron').ipcRenderer
const FullScreenWarning = require('./fullScreenWarning')
import adInfo from '../data/adInfo.js'
import FindBar from './findbar.js'
const { isSourceAboutUrl, getTargetAboutUrl } = require('../lib/appUrlUtil')

class Frame extends ImmutableComponent {
  constructor () {
    super()
    this.previousLocation = 'about:newtab'
  }

  updateWebview () {
    let src = this.props.frame.get('src')
    let location = this.props.frame.get('location')
    const hack = siteHacks[urlParse(location).hostname]
    const allowRunningInsecureContent = !!(hack && hack.allowRunningInsecureContent)
    let appRoot = window.baseHref
      ? 'file://' + path.resolve(__dirname, '..', '..', 'app') + '/'
      : ''

    let contentScripts = [appRoot + 'content/scripts/webviewPreload.js']
    let aboutPreload = false
    if (['about:preferences', 'about:bookmarks', 'about:certerror'].includes(location)) {
      contentScripts.push(appRoot + 'content/scripts/aboutPreload.js')
      aboutPreload = true
    }

    contentScripts = contentScripts.join(',')
    const contentScriptsChanged =
      this.webview && contentScripts !== this.webview.getAttribute('contentScripts')

    // Create the webview dynamically because React doesn't whitelist all
    // of the attributes we need.  Clear out old webviews if the contentScripts change or if
    // allowRunningInsecureContent changes because they cannot change after being added to the DOM.
    if (!this.webview || this.webview.allowRunningInsecureContent !== allowRunningInsecureContent || contentScriptsChanged) {
      while (this.webviewContainer.firstChild) {
        this.webviewContainer.removeChild(this.webviewContainer.firstChild)
      }
      this.webview = document.createElement('webview')
      src = location
    }
    this.webview.setAttribute('allowDisplayingInsecureContent', true)
    this.webview.setAttribute('data-frame-key', this.props.frame.get('key'))
    this.webview.setAttribute('contentScripts', contentScripts)
    // Don't allow dropping on webviews with aboutPreload since they navigate within the same process
    // automatically while keeping the content script loaded.
    if (aboutPreload) {
      this.webviewContainer.addEventListener('drop', (e) => {
        if (e.dataTransfer.getData('text/uri-list')) {
          e.preventDefault()
        }
      })
    }
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
    if (this.props.frame.get('guestInstanceId')) {
      this.webview.setAttribute('data-guest-instance-id', this.props.frame.get('guestInstanceId'))
    }

    if (hack && hack.userAgent) {
      this.webview.setAttribute('useragent', hack.userAgent)
    }
    if (allowRunningInsecureContent) {
      this.webview.setAttribute('allowRunningInsecureContent', true)
      this.webview.allowRunningInsecureContent = true
    }
    this.webview.setAttribute('src',
                              isSourceAboutUrl(src) ? getTargetAboutUrl(src) : src)
    if (!this.webviewContainer.firstChild) {
      this.webviewContainer.appendChild(this.webview)
      this.addEventListeners()
    }
  }

  componentDidMount () {
    this.updateWebview()
  }

  componentDidUpdate (prevProps, prevState) {
    const location = this.props.frame.get('location')
    const prevLocation = prevProps.frame.get('location')
    const didSrcChange = this.props.frame.get('src') !== prevProps.frame.get('src')
    const didLocationChange = location !== prevLocation
    // When auto-redirecting to about:certerror, the frame location change and
    // frame src change are emitted separately. Make sure updateWebview is
    // called when the location changes.
    const hack = siteHacks[urlParse(location).hostname]
    const allowRunningInsecureContent = !!(hack && hack.allowRunningInsecureContent)
    if (didSrcChange || didLocationChange && location === 'about:certerror' || !this.webview ||
        allowRunningInsecureContent !== this.webview.allowRunningInsecureContent) {
      this.updateWebview()
    }
    if (didLocationChange && location !== 'about:certerror' &&
        prevLocation !== 'about:certerror' &&
        urlParse(prevLocation).host !== urlParse(location).host) {
      // Keep track of one previous location so the cert error page can return to
      // it. Don't record same-origin location changes because these will
      // often end up re-triggering the cert error.
      this.previousLocation = prevLocation
    }
    // give focus when switching tabs
    if (this.props.isActive && !prevProps.isActive) {
      this.webview.focus()
    }
    const activeShortcut = this.props.frame.get('activeShortcut')
    const activeShortcutDetails = this.props.frame.get('activeShortcutDetails')
    switch (activeShortcut) {
      case 'stop':
        this.webview.stop()
        break
      case 'reload':
        if (this.props.frame.get('location') === 'about:preferences') {
          break
        }
        // Ensure that the webview thinks we're on the same location as the browser does.
        // This can happen for pages which don't load properly.
        // Some examples are basic http auth and bookmarklets.
        // In this case both the user display and the user think they're on frame.get('location').
        if (this.webview.getURL() !== this.props.frame.get('location')) {
          this.webview.loadURL(this.props.frame.get('location'))
        } else {
          this.webview.reload()
        }
        break
      case 'clean-reload':
        this.webview.reloadIgnoringCache()
        break
      case 'explicitLoadURL':
        this.webview.loadURL(this.props.frame.get('location'))
        break
      case 'zoom-in':
        windowActions.zoomIn(this.props.frame)
        break
      case 'zoom-out':
        windowActions.zoomOut(this.props.frame)
        break
      case 'zoom-reset':
        windowActions.zoomReset(this.props.frame)
        break
      case 'toggle-dev-tools':
        if (this.webview.isDevToolsOpened()) {
          this.webview.closeDevTools()
        } else {
          this.webview.openDevTools()
        }
        break
      case 'view-source':
        const location = UrlUtil.getViewSourceUrlFromUrl(this.webview.getURL())
        windowActions.newFrame({location}, true)
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
                            activeShortcutDetails.get('action'))
        }
    }
    if (activeShortcut) {
      windowActions.setActiveFrameShortcut(this.props.frame, null, null)
    }

    if (this.props.frame.get('location') === 'about:preferences') {
      this.webview.send(messages.SETTINGS_UPDATED, this.props.settings.toJS())
    } else if (this.props.frame.get('location') === 'about:bookmarks') {
      this.webview.send(messages.BOOKMARKS_UPDATED, {
        bookmarks: this.props.bookmarks.toJS(),
        bookmarkFolders: this.props.bookmarkFolders.toJS()
      })
    }
  }

  addEventListeners () {
    this.webview.addEventListener('focus', this.onFocus.bind(this))
    // @see <a href="https://github.com/atom/electron/blob/master/docs/api/web-view-tag.md#event-new-window">new-window event</a>
    this.webview.addEventListener('new-window', (e, url, frameName, disposition, options) => {
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
        case messages.LINK_HOVERED:
          method = (href, position) => {
            position = position || {}
            let nearBottom = position.y > (window.innerHeight - 150) // todo: magic number
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

    const loadStart = (event) => {
      if (event.isMainFrame && !event.isErrorPage && !event.isFrameSrcDoc) {
        // Temporary workaround for https://github.com/brave/browser-laptop/issues/787
        this.webview.insertCSS('input[type="search"]::-webkit-search-results-decoration { -webkit-appearance: none; }')
        // TODO: These 3 events should be combined into one
        windowActions.onWebviewLoadStart(
          this.props.frame)
        const key = this.props.frame.get('key')
        windowActions.setLocation(event.url, key)
        const parsedUrl = urlParse(event.url)
        const hack = siteHacks[parsedUrl.hostname]
        const isSecure = parsedUrl.protocol === 'https:' &&
          (!hack || !hack.allowRunningInsecureContent)
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
    }
    const loadEnd = () => {
      windowActions.onWebviewLoadEnd(
        this.props.frame,
        this.webview.getURL())
      if (this.props.enableAds) {
        this.insertAds(this.webview.getURL())
      }
      this.webview.send(messages.POST_PAGE_LOAD_RUN)
      let security = this.props.frame.get('security')
      if (this.props.frame.get('location') === 'about:certerror' &&
          security && security.get('certDetails')) {
        // Don't send certDetails.cert since it is big and crashes the page
        this.webview.send(messages.CERT_DETAILS_UPDATED, {
          url: security.get('certDetails').url,
          error: security.get('certDetails').error,
          previousLocation: this.previousLocation,
          frameKey: this.props.frame.get('key')
        })
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
    this.webview.addEventListener('load-commit', (event) => {
      loadStart(event)
    })
    this.webview.addEventListener('load-start', (event) => {
      loadStart(event)
    })
    this.webview.addEventListener('did-navigate', (e) => {
      // only give focus focus is this is not the initial default page load
      if (this.props.isActive && this.webview.canGoBack() && document.activeElement !== this.webview) {
        this.webview.focus()
      }
    })
    this.webview.addEventListener('did-fail-load', () => {
      windowActions.onWebviewLoadEnd(
        this.props.frame,
        this.webview.getURL())
    })
    this.webview.addEventListener('did-finish-load', () => {
      loadEnd()
    })
    this.webview.addEventListener('did-navigate-in-page', () => {
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
    this.webview.addEventListener('did-change-theme-color', ({themeColor}) => {
      // Due to a bug in Electron, after navigating to a page with a theme color
      // to a page without a theme color, the background is sent to us as black
      // even know there is no background. To work around this we just ignore
      // the theme color in that case and let the computed theme color take over.
      windowActions.setThemeColor(this.props.frame, themeColor !== '#000000' ? themeColor : null)
    })
    this.webview.addEventListener('found-in-page', (e) => {
      if (e.result !== undefined && (e.result.matches !== undefined || e.result.activeMatchOrdinal !== undefined)) {
        windowActions.setFindDetail(this.props.frame, Immutable.fromJS({
          numberOfMatches: e.result.matches || this.props.frame.getIn(['findDetail', 'numberOfMatches']),
          activeMatchOrdinal: e.result.activeMatchOrdinal || this.props.frame.getIn(['findDetail', 'activeMatchOrdinal'])
        }))
      }
    })

    // Ensure we mute appropriately, the initial value could be set
    // from persisted state.
    if (this.props.frame.get('audioMuted')) {
      this.webview.setAudioMuted(true)
    }
  }

  insertAds (currentLocation) {
    const host = new window.URL(currentLocation).hostname.replace('www.', '')
    const adDivCandidates = adInfo[host] || []
    // Call this even when there are no matches because we have some logic
    // to replace common divs.
    this.webview.send(messages.SET_AD_DIV_CANDIDATES, adDivCandidates, config.vault.replacementUrl)
  }

  goBack () {
    this.webview.goBack()
  }

  goForward () {
    this.webview.goForward()
  }

  onFocus () {
    windowActions.setTabPageIndexByFrame(this.props.frame)
    windowActions.setUrlBarActive(false)
    windowActions.setContextMenuDetail()
  }

  onFindHide () {
    windowActions.setFindbarShown(this.props.frame, false)
    this.onClearMatch()
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

  componentWillReceiveProps (nextProps) {
    if (nextProps.frame.get('audioMuted') &&
      this.props.frame.get('audioMuted') !== true) {
      this.webview.setAudioMuted(true)
    } else if (!nextProps.frame.get('audioMuted') &&
      this.props.frame.get('audioMuted') === true) {
      this.webview.setAudioMuted(false)
    }

    let zoomLevel = nextProps.frame.get('zoomLevel')
    if (zoomLevel !== this.props.frame.get('zoomLevel')) {
      this.webview.setZoomLevel(zoomLevel)
    }
  }

  render () {
    return <div
        className={cx({
          frameWrapper: true,
          isPreview: this.props.isPreview,
          isActive: this.props.isActive
        })}>
      { this.props.frame.get('isFullScreen') && this.props.frame.get('showFullScreenWarning')
        ? <FullScreenWarning frameProps={this.props.frame}/>
        : null
      }
      { this.props.frame.get('findbarShown')
      ? <FindBar
        onFind={this.onFind.bind(this)}
        onFindHide={this.onFindHide.bind(this)}
        frame={this.props.frame}
        selected={this.props.frame.get('findbarSelected')}
        findDetail={this.props.frame.get('findDetail')}
      /> : null }
      <div ref={node => this.webviewContainer = node}
        className={cx({
          webviewContainer: true,
          isPreview: this.props.isPreview
        })}/>
      { this.props.frame.get('hrefPreview')
        ? <div className={cx({
          hrefPreview: true,
          right: this.props.frame.get('showOnRight')
        })}>
          {this.props.frame.get('hrefPreview')}
        </div> : null
      }
    </div>
  }
}

module.exports = Frame
