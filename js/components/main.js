/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const ImmutableComponent = require('./immutableComponent')
const Immutable = require('immutable')
const electron = global.require('electron')
const ipc = electron.ipcRenderer
const systemPreferences = electron.remote.systemPreferences

// Actions
const windowActions = require('../actions/windowActions')
const webviewActions = require('../actions/webviewActions')
const contextMenus = require('../contextMenus')
const getSetting = require('../settings').getSetting
const getOrigin = require('../state/siteUtil').getOrigin

// Components
const NavigationBar = require('./navigationBar')
const Frame = require('./frame')
const TabPages = require('./tabPages')
const TabsToolbar = require('./tabsToolbar')
const FindBar = require('./findbar.js')
const UpdateBar = require('./updateBar')
const NotificationBar = require('./notificationBar')
const DownloadsBar = require('./downloadsBar')
const Button = require('./button')
const SiteInfo = require('./siteInfo')
const BraveryPanel = require('./braveryPanel')
const ClearBrowsingDataPanel = require('./clearBrowsingDataPanel')
const AddEditBookmark = require('./addEditBookmark')
const LoginRequired = require('./loginRequired')
const ReleaseNotes = require('./releaseNotes')
const BookmarksToolbar = require('./bookmarksToolbar')
const ContextMenu = require('./contextMenu')
const PopupWindow = require('./popupWindow')
const NoScriptInfo = require('./noScriptInfo')
const LongPressButton = require('./longPressButton')

// Constants
const config = require('../constants/config')
const appConfig = require('../constants/appConfig')
const messages = require('../constants/messages')
const settings = require('../constants/settings')
const siteTags = require('../constants/siteTags')
const dragTypes = require('../constants/dragTypes')
const keyCodes = require('../constants/keyCodes')

// State handling
const FrameStateUtil = require('../state/frameStateUtil')

const searchProviders = require('../data/searchProviders')

// Util
const cx = require('../lib/classSet.js')
const eventUtil = require('../lib/eventUtil')
const { isIntermediateAboutPage, getBaseUrl, isNavigatableAboutPage } = require('../lib/appUrlUtil')
const { getBaseDomain } = require('../lib/baseDomain')
const siteSettings = require('../state/siteSettings')
const urlParse = require('url').parse
const debounce = require('../lib/debounce.js')
const currentWindow = require('../../app/renderer/currentWindow')
const emptyMap = new Immutable.Map()
const emptyList = new Immutable.List()

class Main extends ImmutableComponent {
  constructor () {
    super()
    this.onCloseFrame = this.onCloseFrame.bind(this)
    this.onBack = this.onBack.bind(this)
    this.onForward = this.onForward.bind(this)
    this.onBackLongPress = this.onBackLongPress.bind(this)
    this.onForwardLongPress = this.onForwardLongPress.bind(this)
    this.onMouseDown = this.onMouseDown.bind(this)
    this.onClickWindow = this.onClickWindow.bind(this)
    this.onDoubleClick = this.onDoubleClick.bind(this)
    this.onDragOver = this.onDragOver.bind(this)
    this.onDrop = this.onDrop.bind(this)
    this.onHideSiteInfo = this.onHideSiteInfo.bind(this)
    this.onHideBraveryPanel = this.onHideBraveryPanel.bind(this)
    this.onHideClearBrowsingDataPanel = this.onHideClearBrowsingDataPanel.bind(this)
    this.onHideNoScript = this.onHideNoScript.bind(this)
    this.onHideReleaseNotes = this.onHideReleaseNotes.bind(this)
    this.onBraveMenu = this.onBraveMenu.bind(this)
    this.onHamburgerMenu = this.onHamburgerMenu.bind(this)
    this.onTabContextMenu = this.onTabContextMenu.bind(this)
    this.onFind = this.onFind.bind(this)
    this.onFindHide = this.onFindHide.bind(this)
    this.checkForTitleMode = debounce(this.checkForTitleMode.bind(this), 20)
  }
  registerWindowLevelShortcuts () {
    // For window level shortcuts that don't work as local shortcuts
    const isDarwin = process.platform === 'darwin'
    document.addEventListener('keydown', (e) => {
      switch (e.which) {
        case keyCodes.ESC:
          this.exitFullScreen()
          break
        case keyCodes.F12:
          if (!isDarwin) {
            ipc.emit(messages.SHORTCUT_ACTIVE_FRAME_TOGGLE_DEV_TOOLS)
          }
          break
        case keyCodes.NUMPAD_PLUS:
          if (eventUtil.isForSecondaryAction(e)) {
            ipc.emit(messages.SHORTCUT_ACTIVE_FRAME_ZOOM_IN)
          }
          break
        case keyCodes.NUMPAD_MINUS:
          if (eventUtil.isForSecondaryAction(e)) {
            ipc.emit(messages.SHORTCUT_ACTIVE_FRAME_ZOOM_OUT)
          }
          break
      }
    })
  }

  exitFullScreen () {
    const activeFrame = FrameStateUtil.getActiveFrame(this.props.windowState)
    if (activeFrame && activeFrame.get('isFullScreen')) {
      windowActions.setFullScreen(activeFrame, false)
    }
  }

  registerSwipeListener () {
    // Navigates back/forward on macOS two-finger swipe
    var trackingFingers = false
    var swipeGesture = false
    var canSwipeBack = false
    var canSwipeForward = false
    var deltaX = 0
    var deltaY = 0
    var startTime = 0
    var time

    this.mainWindow.addEventListener('wheel', (e) => {
      if (trackingFingers) {
        deltaX = deltaX + e.deltaX
        deltaY = deltaY + e.deltaY
        time = (new Date()).getTime() - startTime
        if (deltaX > 0) {
          webviewActions.checkSwipe(false)
        } else if (deltaX < 0) {
          webviewActions.checkSwipe(true)
        }
      }
    })
    ipc.on(messages.DEBUG_REACT_PROFILE, (e, args) => {
      window.perf = require('react-addons-perf')
      if (!window.perf.isRunning()) {
        if (!window.isFirstProfiling) {
          window.isFirstProfiling = true
          console.info('See this blog post for more information on profiling: http://benchling.engineering/performance-engineering-with-react/')
        }
        currentWindow.openDevTools()
        console.log('starting to profile...')
        window.perf.start()
      } else {
        window.perf.stop()
        console.log('profiling stopped. Wasted:')
        window.perf.printWasted()
      }
    })
    ipc.on(messages.OPEN_BRAVERY_PANEL, (e) => {
      if (!this.braveShieldsDisabled) {
        this.onBraveMenu()
      } else {
        windowActions.newFrame({
          location: 'about:preferences#shields',
          singleFrame: true
        }, true)
      }
    })
    ipc.on(messages.CAN_SWIPE_BACK, (e) => {
      canSwipeBack = true
    })
    ipc.on(messages.CAN_SWIPE_FORWARD, (e) => {
      canSwipeForward = true
    })
    ipc.on(messages.ENABLE_SWIPE_GESTURE, (e) => {
      swipeGesture = true
    })
    ipc.on(messages.DISABLE_SWIPE_GESTURE, (e) => {
      swipeGesture = false
    })
    ipc.on('scroll-touch-begin', function () {
      if (swipeGesture &&
        systemPreferences.isSwipeTrackingFromScrollEventsEnabled()) {
        trackingFingers = true
        startTime = (new Date()).getTime()
      }
    })
    ipc.on('scroll-touch-end', function () {
      if (time > 50 && trackingFingers && Math.abs(deltaY) < 50) {
        if (deltaX > 100 && canSwipeForward) {
          ipc.emit(messages.SHORTCUT_ACTIVE_FRAME_FORWARD)
        } else if (deltaX < -100 && canSwipeBack) {
          ipc.emit(messages.SHORTCUT_ACTIVE_FRAME_BACK)
        }
      }
      trackingFingers = false
      canSwipeBack = false
      canSwipeForward = false
      deltaX = 0
      deltaY = 0
      startTime = 0
    })
    ipc.on(messages.LEAVE_FULL_SCREEN, this.exitFullScreen.bind(this))
  }

  loadSearchProviders () {
    let entries = searchProviders.providers
    let engine = getSetting(settings.DEFAULT_SEARCH_ENGINE)
    if (this.lastLoadedSearchProviders === undefined || engine !== this.lastLoadedSearchProviders) {
      entries.forEach((entry) => {
        if (entry.name === engine) {
          windowActions.setSearchDetail(Immutable.fromJS({
            searchURL: entry.search,
            autocompleteURL: entry.autocomplete
          }))
          this.lastLoadedSearchProviders = engine
          return false
        }
      })
    }
  }

  componentDidUpdate (prevProps) {
    this.loadSearchProviders()
    const activeFrame = FrameStateUtil.getActiveFrame(this.props.windowState)
    const activeFramePrev = FrameStateUtil.getActiveFrame(prevProps.windowState)
    const activeFrameTitle = activeFrame && (activeFrame.get('title') || activeFrame.get('location')) || ''
    const activeFramePrevTitle = activeFramePrev && (activeFramePrev.get('title') || activeFramePrev.get('location')) || ''
    if (activeFrameTitle !== activeFramePrevTitle) {
      currentWindow.setTitle(activeFrameTitle)
    }

    // If the tab changes or was closed, exit out of full screen to give a better
    // picture of what's happening.
    if (activeFramePrev && activeFrame &&
        activeFrame.get('key') !== activeFramePrev.get('key') && activeFramePrev.get('isFullScreen')) {
      windowActions.setFullScreen(activeFramePrev, false)
    }
  }

  componentDidMount () {
    this.registerSwipeListener()
    this.registerWindowLevelShortcuts()

    ipc.on(messages.SHORTCUT_NEW_FRAME, (event, url, options = {}) => {
      if (options.singleFrame) {
        const frameProps = self.props.windowState.get('frames').find((frame) => frame.get('location') === url)
        if (frameProps) {
          windowActions.setActiveFrame(frameProps)
          return
        }
      }
      let openInForeground = getSetting(settings.SWITCH_TO_NEW_TABS) === true || options.openInForeground
      const frameOpts = {
        location: url || config.defaultUrl,
        isPrivate: !!options.isPrivate,
        isPartitioned: !!options.isPartitioned,
        parentFrameKey: options.parentFrameKey
      }
      if (options.partitionNumber !== undefined) {
        frameOpts.partitionNumber = options.partitionNumber
      }
      windowActions.newFrame(frameOpts, openInForeground)
    })

    ipc.on(messages.NEW_POPUP_WINDOW, function (evt, extensionId, src, props) {
      windowActions.setPopupWindowDetail(Immutable.fromJS({
        left: props.x,
        top: props.y + 100,
        height: props.height,
        width: props.width,
        maxHeight: window.innerHeight - 100,
        minHeight: 400,
        src
      }))
    })

    ipc.on(messages.SHORTCUT_CLOSE_FRAME, (e, i) => typeof i !== 'undefined' && i !== null
      ? windowActions.closeFrame(self.props.windowState.get('frames'), FrameStateUtil.getFrameByKey(self.props.windowState, i))
      : windowActions.closeFrame(self.props.windowState.get('frames'), FrameStateUtil.getActiveFrame(this.props.windowState)))
    ipc.on(messages.SHORTCUT_UNDO_CLOSED_FRAME, () => windowActions.undoClosedFrame())

    ipc.on(messages.SHORTCUT_CLOSE_OTHER_FRAMES, (e, key, isCloseRight, isCloseLeft) => {
      const currentIndex = FrameStateUtil.getFrameIndex(self.props.windowState, key)
      if (currentIndex === -1) {
        return
      }

      self.props.windowState.get('frames').forEach((frame, i) => {
        if (!frame.get('pinnedLocation') &&
            (i < currentIndex && isCloseLeft || i > currentIndex && isCloseRight)) {
          windowActions.closeFrame(self.props.windowState.get('frames'), frame)
        }
      })
    })

    ipc.on(messages.SHOW_DOWNLOADS_TOOLBAR, () => {
      windowActions.setDownloadsToolbarVisible(true)
    })

    ipc.on(messages.HIDE_DOWNLOADS_TOOLBAR, () => {
      windowActions.setDownloadsToolbarVisible(false)
    })

    const self = this
    ipc.on(messages.SHORTCUT_SET_ACTIVE_FRAME_BY_INDEX, (e, i) =>
      windowActions.setActiveFrame(FrameStateUtil.getFrameByDisplayIndex(self.props.windowState, i)))

    ipc.on(messages.SHORTCUT_SET_ACTIVE_FRAME_TO_LAST, () =>
      windowActions.setActiveFrame(self.props.windowState.getIn(['frames', self.props.windowState.get('frames').size - 1])))

    ipc.on(messages.BLOCKED_RESOURCE, (e, blockType, details) => {
      const filteredFrameProps = this.props.windowState.get('frames').filter((frame) => frame.get('provisionalLocation') === details.firstPartyUrl)
      filteredFrameProps.forEach((frameProps) =>
        windowActions.setBlockedBy(frameProps, blockType, details.url))
    })

    ipc.on(messages.BLOCKED_PAGE, (e, blockType, details) => {
      const filteredFrameProps = this.props.windowState.get('frames').filter((frame) => frame.get('provisionalLocation') === details.firstPartyUrl)
      filteredFrameProps.forEach((frameProps) => {
        if (blockType === appConfig.resourceNames.SAFE_BROWSING) {
          // Since Safe Browsing never actually loads the main frame we need to add history here.
          // That way about:safebrowsing can figure out the correct location.
          windowActions.addHistory(frameProps)
        }
        windowActions.loadUrl(frameProps, blockType === appConfig.resourceNames.SAFE_BROWSING ? 'about:safebrowsing' : 'about:blank')
      })
    })

    ipc.on(messages.HTTPSE_RULE_APPLIED, (e, ruleset, details) => {
      const filteredFrameProps = this.props.windowState.get('frames').filter((frame) => frame.get('provisionalLocation') === details.firstPartyUrl)
      filteredFrameProps.forEach((frameProps) =>
        windowActions.setRedirectedBy(frameProps, ruleset, details.url))
    })

    ipc.on(messages.SHOW_NOTIFICATION, (e, text) => {
      void new window.Notification(text)
    })

    ipc.on(messages.SHORTCUT_ACTIVE_FRAME_BACK, this.onBack)
    ipc.on(messages.SHORTCUT_ACTIVE_FRAME_FORWARD, this.onForward)

    ipc.on(messages.SHORTCUT_ACTIVE_FRAME_LOAD_URL, (e, url) => {
      const activeFrame = FrameStateUtil.getActiveFrame(self.props.windowState)
      windowActions.loadUrl(activeFrame, url)
    })

    ipc.on(messages.CERT_ERROR, (e, details) => {
      const frame = FrameStateUtil.getFrameByTabId(self.props.windowState, details.tabId)
      if (frame && (frame.get('location') === details.url ||
                    frame.get('provisionalLocation') === details.url)) {
        windowActions.setFrameError(frame, {
          url: details.url,
          error: details.error
        })
        windowActions.loadUrl(frame, 'about:certerror')
      }
    })

    ipc.on(messages.SET_SECURITY_STATE, (e, frameKey, securityState) => {
      windowActions.setSecurityState(FrameStateUtil.getFrameByKey(self.props.windowState, frameKey),
                                     securityState)
    })

    ipc.on(messages.LOGIN_REQUIRED, (e, detail) => {
      const frames = self.props.windowState.get('frames')
        .filter((frame) => frame.get('location') === detail.url ||
          getOrigin(frame.get('location')) === getOrigin(detail.url) ||
        getBaseDomain(getOrigin(frame.get('location'))) === getBaseDomain(getOrigin(detail.url)))
      frames.forEach((frame) =>
        windowActions.setLoginRequiredDetail(frame, detail))
    })

    ipc.on(messages.SHOW_USERNAME_LIST, (e, usernames, origin, action, boundingRect) => {
      const topOffset = this.tabContainer.getBoundingClientRect().top
      contextMenus.onShowUsernameMenu(usernames, origin, action, boundingRect, topOffset)
    })

    ipc.on(messages.HIDE_CONTEXT_MENU, () => {
      windowActions.setContextMenuDetail()
    })

    this.loadSearchProviders()

    window.addEventListener('mousemove', (e) => {
      if (e.pageY !== this.pageY) {
        this.pageY = e.pageY
        this.checkForTitleMode()
      }
    })
    window.addEventListener('focus', () => {
      const activeFrame = FrameStateUtil.getActiveFrame(self.props.windowState)
      windowActions.setFocusedFrame(activeFrame)
      // For whatever reason other elements are preserved but webviews are not.
      if (document.activeElement && document.activeElement.tagName === 'BODY') {
        webviewActions.setWebviewFocused()
      }
    })

    // disable dnd by default
    window.addEventListener('dragover', function (event) {
      // allow webviews to handle dnd
      if (event.target.tagName === 'WEBVIEW') {
        return true
      }
      event.dataTransfer.dropEffect = 'none'
      event.preventDefault()
      return false
    }, true)

    window.addEventListener('drop', function (event) {
      // allow webviews to handle dnd
      if (event.target.tagName === 'WEBVIEW') {
        return true
      }
      event.preventDefault()
      return false
    }, true)

    const activeFrame = FrameStateUtil.getActiveFrame(self.props.windowState)
    if (activeFrame) {
      currentWindow.setTitle(activeFrame.get('title'))
    }

    // Handlers for saving window state
    currentWindow.on('maximize', function () {
      windowActions.setMaximizeState(true)
    })

    currentWindow.on('unmaximize', function () {
      windowActions.setMaximizeState(false)
    })

    let moveTimeout = null
    currentWindow.on('move', function (event) {
      if (moveTimeout) {
        clearTimeout(moveTimeout)
      }
      moveTimeout = setTimeout(function () {
        windowActions.savePosition(event.sender.getPosition())
      }, 1000)
    })

    currentWindow.on('enter-full-screen', function (event) {
      windowActions.setWindowFullScreen(true)
    })

    currentWindow.on('leave-full-screen', function (event) {
      windowActions.setWindowFullScreen(false)
    })
  }

  checkForTitleMode () {
    const navigator = document.querySelector('.top')
    // Uncaught TypeError: Cannot read property 'getBoundingClientRect' of null
    if (!navigator) {
      return
    }

    const height = navigator.getBoundingClientRect().bottom
    if (this.pageY < height && this.props.windowState.getIn(['ui', 'mouseInTitlebar']) !== true) {
      windowActions.setMouseInTitlebar(true)
    } else if (this.pageY === undefined || this.pageY >= height && this.props.windowState.getIn(['ui', 'mouseInTitlebar']) !== false) {
      windowActions.setMouseInTitlebar(false)
    }
  }

  get activeFrame () {
    return this.frames[this.props.windowState.get('activeFrameKey')]
  }

  // Returns the same as the active frame's location, but returns the requested
  // URL if it's safe browsing, a cert error page or an error page.
  get activeRequestedLocation () {
    const activeFrame = FrameStateUtil.getActiveFrame(this.props.windowState)
    if (!activeFrame) {
      return undefined
    }
    let location = activeFrame.get('location')
    const history = activeFrame.get('history')
    if (isIntermediateAboutPage(location) && history.size > 0) {
      location = history.last()
    }
    return location
  }

  onNav (e, navCheckProp, navType, navAction) {
    const activeFrame = FrameStateUtil.getActiveFrame(this.props.windowState)
    const isNavigatable = isNavigatableAboutPage(getBaseUrl(activeFrame.get('location')))
    if (e && eventUtil.isForSecondaryAction(e) && isNavigatable) {
      if (activeFrame && activeFrame.get(navCheckProp)) {
        currentWindow.webContents.send(messages.SHORTCUT_ACTIVE_FRAME_CLONE, {
          [navType]: true,
          openInForeground: !!e.shiftKey
        })
      }
    } else {
      navAction.call(this.activeFrame)
    }
  }

  onBack (e) {
    this.onNav(e, 'canGoBack', 'back', this.activeFrame.goBack)
  }

  onForward (e) {
    this.onNav(e, 'canGoForward', 'forward', this.activeFrame.goForward)
  }

  onBackLongPress (rect) {
    contextMenus.onBackButtonHistoryMenu(this.activeFrame, this.activeFrame.getHistory(this.props.appState), rect)
  }

  onForwardLongPress (rect) {
    contextMenus.onForwardButtonHistoryMenu(this.activeFrame, this.activeFrame.getHistory(this.props.appState), rect)
  }

  onBraveMenu () {
    if (!this.braveShieldsDisabled) {
      windowActions.setBraveryPanelDetail({})
    }
  }

  onHamburgerMenu (e) {
    const activeFrame = FrameStateUtil.getActiveFrame(this.props.windowState)
    contextMenus.onHamburgerMenu(activeFrame && activeFrame.get('location') || '', e)
  }

  onHideSiteInfo () {
    windowActions.setSiteInfoVisible(false)
  }

  onHideBraveryPanel () {
    windowActions.setBraveryPanelDetail()
  }

  onHideClearBrowsingDataPanel () {
    windowActions.setClearBrowsingDataDetail()
  }

  onHideNoScript () {
    windowActions.setNoScriptVisible(false)
  }

  onHideReleaseNotes () {
    windowActions.setReleaseNotesVisible(false)
  }

  enableNoScript (settings) {
    return siteSettings.activeSettings(settings, this.props.appState, appConfig).noScript
  }

  onCloseFrame (activeFrameProps) {
    windowActions.closeFrame(this.props.windowState.get('frames'), activeFrameProps)
  }

  onDragOver (e) {
    let intersection = e.dataTransfer.types.filter((x) => ['Files'].includes(x))
    if (intersection.length > 0 || e.dataTransfer.getData('text/plain')) {
      e.dataTransfer.dropEffect = 'copy'
      e.preventDefault()
    }
  }

  onDrop (e) {
    if (e.dataTransfer.files.length > 0) {
      Array.from(e.dataTransfer.files).forEach((file) =>
        windowActions.newFrame({location: file.path, title: file.name}))
    } else if (e.dataTransfer.getData('text/plain')) {
      let activeFrame = FrameStateUtil.getActiveFrame(this.props.windowState)
      if (activeFrame) {
        windowActions.loadUrl(activeFrame, e.dataTransfer.getData('text/plain'))
      }
    }
  }

  onDoubleClick (e) {
    if (!e.target.className.includes('navigatorWrapper')) {
      return
    }
    if (currentWindow.isMaximized()) {
      currentWindow.maximize()
    } else {
      currentWindow.unmaximize()
    }
  }

  onMouseDown (e) {
    let node = e.target
    while (node) {
      if (node.classList &&
          (node.classList.contains('popupWindow') || node.classList.contains('contextMenu'))) {
        // Middle click (on context menu) needs to fire the click event.
        // We need to prevent the default "Auto-Scrolling" behavior.
        if (node.classList.contains('contextMenu') && e.button === 1) {
          e.preventDefault()
        }
        return
      }
      node = node.parentNode
    }
    // TODO(bridiver) combine context menu and popup window
    windowActions.setContextMenuDetail()
    windowActions.setPopupWindowDetail()
  }

  onClickWindow (e) {
    // Check for an ancestor of urlbarForm or urlBarSuggestions and if none are found
    // then set the URL bar as non active (no autocomplete).
    let node = e.target
    while (node) {
      if (node.className === 'urlbarForm' || node.className === 'urlBarSuggestions') {
        return
      }
      node = node.parentNode
    }
    windowActions.setUrlBarActive(false)
  }

  onFindHide () {
    const activeFrame = FrameStateUtil.getActiveFrame(this.props.windowState)
    windowActions.setFindbarShown(activeFrame, false)
    webviewActions.stopFindInPage()
  }

  onFind (searchString, caseSensitivity, forward) {
    webviewActions.findInPage(searchString, caseSensitivity, forward)
  }

  onTabContextMenu (e) {
    const activeFrame = FrameStateUtil.getActiveFrame(this.props.windowState)
    contextMenus.onTabsToolbarContextMenu(activeFrame, undefined, undefined, e)
  }

  get allSiteSettings () {
    const activeFrame = FrameStateUtil.getActiveFrame(this.props.windowState)
    if (activeFrame && activeFrame.get('isPrivate')) {
      return this.props.appState.get('temporarySiteSettings')
    }
    return this.props.appState.get('siteSettings')
  }

  frameSiteSettings (location) {
    if (!location) {
      return undefined
    }
    return siteSettings.getSiteSettingsForURL(this.allSiteSettings, location)
  }

  frameBraverySettings (location) {
    return Immutable.fromJS(siteSettings.activeSettings(this.frameSiteSettings(location),
                                                        this.props.appState,
                                                        appConfig))
  }

  get activeSiteSettings () {
    return this.frameSiteSettings(this.activeRequestedLocation)
  }

  get braveShieldsDisabled () {
    const activeFrame = FrameStateUtil.getActiveFrame(this.props.windowState)
    if (activeFrame && activeFrame.get('isPrivate')) {
      return true
    }

    const activeRequestedLocation = this.activeRequestedLocation
    if (!activeRequestedLocation) {
      return true
    }

    const parsedUrl = urlParse(activeRequestedLocation)
    return parsedUrl.protocol !== 'https:' && parsedUrl.protocol !== 'http:' && activeRequestedLocation !== 'about:safebrowsing'
  }

  render () {
    const comparatorByKeyAsc = (a, b) => a.get('key') > b.get('key')
      ? 1 : b.get('key') > a.get('key') ? -1 : 0

    // Sort frames by key so that the order of the frames do not change which could
    // cause unexpected reloading when a user moves tabs.
    // All frame operations work off of frame keys and not index though so unsorted frames
    // can be passed everywhere other than the Frame elements.
    const sortedFrames = this.props.windowState.get('frames').sort(comparatorByKeyAsc)
    const activeFrame = FrameStateUtil.getActiveFrame(this.props.windowState)
    this.frames = {}
    const allSiteSettings = this.allSiteSettings
    const activeSiteSettings = this.activeSiteSettings
    const nonPinnedFrames = this.props.windowState.get('frames').filter((frame) => !frame.get('pinnedLocation'))
    const tabsPerPage = Number(getSetting(settings.TABS_PER_PAGE))
    const showBookmarksToolbar = getSetting(settings.SHOW_BOOKMARKS_TOOLBAR)
    const showFavicon = getSetting(settings.SHOW_BOOKMARKS_TOOLBAR_FAVICON)
    const showOnlyFavicon = getSetting(settings.SHOW_BOOKMARKS_TOOLBAR_ONLY_FAVICON)
    const siteInfoIsVisible = this.props.windowState.getIn(['ui', 'siteInfo', 'isVisible'])
    const braveShieldsDisabled = this.braveShieldsDisabled
    const braveryPanelIsVisible = !braveShieldsDisabled && this.props.windowState.get('braveryPanelDetail')
    const clearBrowsingDataPanelIsVisible = this.props.windowState.get('clearBrowsingDataDetail')
    const activeRequestedLocation = this.activeRequestedLocation
    const noScriptIsVisible = this.props.windowState.getIn(['ui', 'noScriptInfo', 'isVisible'])
    const releaseNotesIsVisible = this.props.windowState.getIn(['ui', 'releaseNotes', 'isVisible'])
    const braverySettings = siteSettings.activeSettings(activeSiteSettings, this.props.appState, appConfig)

    const shouldAllowWindowDrag = !this.props.windowState.get('contextMenuDetail') &&
      !this.props.windowState.get('bookmarkDetail') &&
      !siteInfoIsVisible &&
      !braveryPanelIsVisible &&
      !clearBrowsingDataPanelIsVisible &&
      !releaseNotesIsVisible &&
      !noScriptIsVisible &&
      activeFrame && !activeFrame.getIn(['security', 'loginRequiredDetail'])

    return <div id='window'
      className={cx({
        isFullScreen: activeFrame && activeFrame.get('isFullScreen')
      })}
      ref={(node) => { this.mainWindow = node }}
      onMouseDown={this.onMouseDown}
      onClick={this.onClickWindow}>
      {
        this.props.windowState.get('contextMenuDetail')
        ? <ContextMenu
          lastZoomPercentage={activeFrame && activeFrame.get('lastZoomPercentage')}
          contextMenuDetail={this.props.windowState.get('contextMenuDetail')} />
        : null
      }
      {
        this.props.windowState.get('popupWindowDetail')
        ? <PopupWindow
          detail={this.props.windowState.get('popupWindowDetail')} />
        : null
      }
      <div className='top'>
        <div className='navigatorWrapper'
          onDoubleClick={this.onDoubleClick}
          onDragOver={this.onDragOver}
          onDrop={this.onDrop}>
          <div className='backforward'>
            <LongPressButton
              l10nId='backButton'
              className='back fa fa-angle-left'
              disabled={!activeFrame || !activeFrame.get('canGoBack')}
              onClick={this.onBack}
              onLongPress={this.onBackLongPress}
            />
            <LongPressButton
              l10nId='forwardButton'
              className='forward fa fa-angle-right'
              disabled={!activeFrame || !activeFrame.get('canGoForward')}
              onClick={this.onForward}
              onLongPress={this.onForwardLongPress}
            />
          </div>
          <NavigationBar
            ref={(node) => { this.navBar = node }}
            navbar={activeFrame && activeFrame.get('navbar')}
            frames={this.props.windowState.get('frames')}
            sites={this.props.appState.get('sites')}
            activeFrameKey={activeFrame && activeFrame.get('key') || undefined}
            location={activeFrame && activeFrame.get('location') || ''}
            title={activeFrame && activeFrame.get('title') || ''}
            scriptsBlocked={activeFrame && activeFrame.getIn(['noScript', 'blocked'])}
            partitionNumber={activeFrame && activeFrame.get('partitionNumber') || 0}
            history={activeFrame && activeFrame.get('history') || emptyList}
            suggestionIndex={activeFrame && activeFrame.getIn(['navbar', 'urlbar', 'suggestions', 'selectedIndex']) || 0}
            isSecure={activeFrame && activeFrame.getIn(['security', 'isSecure'])}
            locationValueSuffix={activeFrame && activeFrame.getIn(['navbar', 'urlbar', 'suggestions', 'urlSuffix']) || ''}
            startLoadTime={activeFrame && activeFrame.get('startLoadTime') || undefined}
            endLoadTime={activeFrame && activeFrame.get('endLoadTime') || undefined}
            loading={activeFrame && activeFrame.get('loading')}
            mouseInTitlebar={this.props.windowState.getIn(['ui', 'mouseInTitlebar'])}
            searchDetail={this.props.windowState.get('searchDetail')}
            enableNoScript={this.enableNoScript(activeSiteSettings)}
            settings={this.props.appState.get('settings')}
            noScriptIsVisible={noScriptIsVisible}
          />
          {
            siteInfoIsVisible
            ? <SiteInfo frameProps={activeFrame}
              onHide={this.onHideSiteInfo} />
            : null
          }
          {
            braveryPanelIsVisible
            ? <BraveryPanel frameProps={activeFrame}
              activeRequestedLocation={activeRequestedLocation}
              braveryPanelDetail={this.props.windowState.get('braveryPanelDetail')}
              braverySettings={braverySettings}
              activeSiteSettings={activeSiteSettings}
              onHide={this.onHideBraveryPanel} />
            : null
          }
          {
           clearBrowsingDataPanelIsVisible
            ? <ClearBrowsingDataPanel
              clearBrowsingDataDetail={this.props.windowState.get('clearBrowsingDataDetail')}
              onHide={this.onHideClearBrowsingDataPanel} />
            : null
          }
          {
            activeFrame && activeFrame.getIn(['security', 'loginRequiredDetail'])
            ? <LoginRequired frameProps={activeFrame} />
            : null
          }
          {
            this.props.windowState.get('bookmarkDetail')
            ? <AddEditBookmark sites={this.props.appState.get('sites')}
              currentDetail={this.props.windowState.getIn(['bookmarkDetail', 'currentDetail'])}
              originalDetail={this.props.windowState.getIn(['bookmarkDetail', 'originalDetail'])}
              destinationDetail={this.props.windowState.getIn(['bookmarkDetail', 'destinationDetail'])} />
            : null
          }
          {
            noScriptIsVisible
              ? <NoScriptInfo frameProps={activeFrame}
                onHide={this.onHideNoScript} />
              : null
          }
          {
            releaseNotesIsVisible
            ? <ReleaseNotes
              metadata={this.props.appState.getIn(['updates', 'metadata'])}
              onHide={this.onHideReleaseNotes} />
            : null
          }
          <div className='topLevelEndButtons'>
            <Button iconClass='braveMenu'
              l10nId='braveMenu'
              className={cx({
                navbutton: true,
                braveShieldsDisabled,
                braveShieldsDown: !braverySettings.shieldsUp
              })}
              onClick={this.onBraveMenu} />
          </div>
        </div>
        <UpdateBar updates={this.props.appState.get('updates')} />
        {
          this.props.appState.get('notifications') && this.props.appState.get('notifications').size && activeFrame
          ? <NotificationBar notifications={this.props.appState.get('notifications')}
            activeFrame={activeFrame} />
          : null
        }
        {
          showBookmarksToolbar
          ? <BookmarksToolbar
            draggingOverData={this.props.windowState.getIn(['ui', 'dragging', 'draggingOver', 'dragType']) === dragTypes.BOOKMARK && this.props.windowState.getIn(['ui', 'dragging', 'draggingOver'])}
            showFavicon={showFavicon}
            showOnlyFavicon={showOnlyFavicon}
            shouldAllowWindowDrag={shouldAllowWindowDrag}
            activeFrameKey={activeFrame && activeFrame.get('key') || undefined}
            windowWidth={this.props.appState.get('defaultWindowWidth')}
            contextMenuDetail={this.props.windowState.get('contextMenuDetail')}
            sites={this.props.appState.get('sites')} />
          : null
        }
        <div className={cx({
          tabPages: true,
          allowDragging: shouldAllowWindowDrag,
          singlePage: nonPinnedFrames.size <= tabsPerPage
        })}
          onContextMenu={this.onTabContextMenu}>
          {
            nonPinnedFrames.size > tabsPerPage
            ? <TabPages frames={nonPinnedFrames}
              tabsPerTabPage={tabsPerPage}
              previewTabPage={getSetting(settings.SHOW_TAB_PREVIEWS)}
              tabPageIndex={this.props.windowState.getIn(['ui', 'tabs', 'tabPageIndex'])} />
            : null
          }
        </div>
        <TabsToolbar
          paintTabs={getSetting(settings.PAINT_TABS)}
          shouldAllowWindowDrag={shouldAllowWindowDrag}
          draggingOverData={this.props.windowState.getIn(['ui', 'dragging', 'draggingOver', 'dragType']) === dragTypes.TAB && this.props.windowState.getIn(['ui', 'dragging', 'draggingOver'])}
          previewTabs={getSetting(settings.SHOW_TAB_PREVIEWS)}
          tabsPerTabPage={tabsPerPage}
          tabPageIndex={this.props.windowState.getIn(['ui', 'tabs', 'tabPageIndex'])}
          previewTabPageIndex={this.props.windowState.getIn(['ui', 'tabs', 'previewTabPageIndex'])}
          tabs={this.props.windowState.get('tabs')}
          sites={this.props.appState.get('sites')}
          key='tab-bar'
          activeFrameKey={activeFrame && activeFrame.get('key') || undefined}
          onMenu={this.onHamburgerMenu}
        />

        {
          activeFrame && activeFrame.get('findbarShown')
          ? <FindBar
            paintTabs={getSetting(settings.PAINT_TABS)}
            themeColor={activeFrame.get('themeColor')}
            computedThemeColor={activeFrame.get('computedThemeColor')}
            frameKey={activeFrame.get('key')}
            selected={activeFrame.get('findbarSelected')}
            findDetail={activeFrame.get('findDetail')}
            onFind={this.onFind}
            onFindHide={this.onFindHide} />
          : null
        }
      </div>
      <div className='mainContainer'>
        <div className='tabContainer'
          ref={(node) => { this.tabContainer = node }}>
        {
          sortedFrames.map((frame) =>
            <Frame
              ref={(node) => { this.frames[frame.get('key')] = node }}
              prefOpenInForeground={getSetting(settings.SWITCH_TO_NEW_TABS)}
              onCloseFrame={this.onCloseFrame}
              frameKey={frame.get('key')}
              key={frame.get('key')}
              settings={getBaseUrl(frame.get('location')) === 'about:preferences'
                ? this.props.appState.get('settings') || emptyMap
                : null}
              bookmarks={frame.get('location') === 'about:bookmarks'
                ? this.props.appState.get('sites')
                    .filter((site) => site.get('tags')
                      .includes(siteTags.BOOKMARK)) || emptyMap
                : null}
              history={frame.get('location') === 'about:history'
                ? this.props.appState.get('sites') || emptyMap
                : null}
              downloads={this.props.appState.get('downloads') || emptyMap}
              bookmarkFolders={frame.get('location') === 'about:bookmarks'
                ? this.props.appState.get('sites')
                    .filter((site) => site.get('tags')
                      .includes(siteTags.BOOKMARK_FOLDER)) || emptyMap
                : null}
              isFullScreen={frame.get('isFullScreen')}
              showFullScreenWarning={frame.get('showFullScreenWarning')}
              findbarShown={frame.get('findbarShown')}
              findDetail={frame.get('findDetail')}
              hrefPreview={frame.get('hrefPreview')}
              showOnRight={frame.get('showOnRight')}
              location={frame.get('location')}
              isPrivate={frame.get('isPrivate')}
              partitionNumber={frame.get('partitionNumber')}
              activeShortcut={frame.get('activeShortcut')}
              activeShortcutDetails={frame.get('activeShortcutDetails')}
              provisionalLocation={frame.get('provisionalLocation')}
              pinnedLocation={frame.get('pinnedLocation')}
              src={frame.get('src')}
              guestInstanceId={frame.get('guestInstanceId')}
              tabId={frame.get('tabId')}
              aboutDetails={frame.get('aboutDetails')}
              unloaded={frame.get('unloaded')}
              audioMuted={frame.get('audioMuted')}
              passwords={this.props.appState.get('passwords')}
              adblock={this.props.appState.get('adblock')}
              safeBrowsing={this.props.appState.get('safeBrowsing')}
              httpsEverywhere={this.props.appState.get('httpsEverywhere')}
              trackingProtection={this.props.appState.get('trackingProtection')}
              adInsertion={this.props.appState.get('adInsertion')}
              noScript={this.props.appState.get('noScript')}
              flash={this.props.appState.get('flash')}
              cookieblock={this.props.appState.get('cookieblock')}
              flashInitialized={this.props.appState.get('flashInitialized')}
              allSiteSettings={allSiteSettings}
              ledgerInfo={this.props.appState.get('ledgerInfo') || new Immutable.Map()}
              publisherInfo={this.props.appState.get('publisherInfo') || new Immutable.Map()}
              frameSiteSettings={this.frameSiteSettings(frame.get('location'))}
              enableNoScript={this.enableNoScript(this.frameSiteSettings(frame.get('location')))}
              isPreview={frame.get('key') === this.props.windowState.get('previewFrameKey')}
              isActive={FrameStateUtil.isFrameKeyActive(this.props.windowState, frame.get('key'))}
            />)
        }
        </div>
      </div>
      {
        this.props.windowState.getIn(['ui', 'downloadsToolbar', 'isVisible']) && this.props.appState.get('downloads') && this.props.appState.get('downloads').size > 0
        ? <DownloadsBar
          windowWidth={this.props.appState.get('defaultWindowWidth')}
          downloads={this.props.appState.get('downloads')} />
        : null
      }
    </div>
  }
}

module.exports = Main
