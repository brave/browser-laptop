/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const ImmutableComponent = require('./immutableComponent')
const Immutable = require('immutable')
const electron = require('electron')
const ipc = electron.ipcRenderer
// const systemPreferences = electron.remote.systemPreferences

// Actions
const appActions = require('../actions/appActions')
const windowActions = require('../actions/windowActions')
const webviewActions = require('../actions/webviewActions')
const contextMenus = require('../contextMenus')
const getSetting = require('../settings').getSetting

// Components
const NavigationBar = require('./navigationBar')
const Frame = require('./frame')
const TabPages = require('./tabPages')
const TabsToolbar = require('./tabsToolbar')
const FindBar = require('./findbar')
const UpdateBar = require('./updateBar')
const NotificationBar = require('./notificationBar')
const DownloadsBar = require('../../app/renderer/components/downloadsBar')
const Button = require('./button')
const BrowserActionButton = require('../../app/renderer/components/browserActionButton')
const SiteInfo = require('./siteInfo')
const BraveryPanel = require('./braveryPanel')
const ClearBrowsingDataPanel = require('./clearBrowsingDataPanel')
const ImportBrowserDataPanel = require('../../app/renderer/components/importBrowserDataPanel')
const WidevinePanel = require('../../app/renderer/components/widevinePanel')
const AutofillAddressPanel = require('./autofillAddressPanel')
const AutofillCreditCardPanel = require('./autofillCreditCardPanel')
const AddEditBookmark = require('./addEditBookmark')
const LoginRequired = require('./loginRequired')
const ReleaseNotes = require('./releaseNotes')
const BookmarksToolbar = require('../../app/renderer/components/bookmarksToolbar')
const ContextMenu = require('./contextMenu')
const PopupWindow = require('./popupWindow')
const NoScriptInfo = require('./noScriptInfo')
const LongPressButton = require('./longPressButton')
const Menubar = require('../../app/renderer/components/menubar')
const WindowCaptionButtons = require('../../app/renderer/components/windowCaptionButtons')
const CheckDefaultBrowserDialog = require('../../app/renderer/components/checkDefaultBrowserDialog')
// Constants
const appConfig = require('../constants/appConfig')
const messages = require('../constants/messages')
const settings = require('../constants/settings')
const siteTags = require('../constants/siteTags')
const dragTypes = require('../constants/dragTypes')
const keyCodes = require('../../app/common/constants/keyCodes')
const keyLocations = require('../../app/common/constants/keyLocations')
const isWindows = process.platform === 'win32'
const {bookmarksToolbarMode} = require('../../app/common/constants/settingsEnums')

// State handling
const basicAuthState = require('../../app/common/state/basicAuthState')
const extensionState = require('../../app/common/state/extensionState')
const aboutHistoryState = require('../../app/common/state/aboutHistoryState')
const frameStateUtil = require('../state/frameStateUtil')
const siteUtil = require('../state/siteUtil')
const searchProviders = require('../data/searchProviders')
const defaultBrowserState = require('../../app/common/state/defaultBrowserState')

// Util
const cx = require('../lib/classSet')
const eventUtil = require('../lib/eventUtil')
const {isIntermediateAboutPage, getBaseUrl, isNavigatableAboutPage} = require('../lib/appUrlUtil')
const siteSettings = require('../state/siteSettings')
const urlParse = require('../../app/common/urlParse')
const debounce = require('../lib/debounce')
const {currentWindow, isMaximized, isFocused, isFullScreen} = require('../../app/renderer/currentWindow')
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
    this.onHideImportBrowserDataPanel = this.onHideImportBrowserDataPanel.bind(this)
    this.onHideWidevinePanel = this.onHideWidevinePanel.bind(this)
    this.onHideAutofillAddressPanel = this.onHideAutofillAddressPanel.bind(this)
    this.onHideAutofillCreditCardPanel = this.onHideAutofillCreditCardPanel.bind(this)
    this.onHideNoScript = this.onHideNoScript.bind(this)
    this.onHideReleaseNotes = this.onHideReleaseNotes.bind(this)
    this.onHideCheckDefaultBrowserDialog = this.onHideCheckDefaultBrowserDialog.bind(this)
    this.onBraveMenu = this.onBraveMenu.bind(this)
    this.onHamburgerMenu = this.onHamburgerMenu.bind(this)
    this.onTabContextMenu = this.onTabContextMenu.bind(this)
    this.onFind = this.onFind.bind(this)
    this.onFindHide = this.onFindHide.bind(this)
    this.checkForTitleMode = debounce(this.checkForTitleMode.bind(this), 20)
    this.lastKeyPressed = undefined
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

      this.lastKeyPressed = e.which
    })
  }

  registerCustomTitlebarHandlers () {
    if (this.customTitlebar.enabled) {
      document.addEventListener('keyup', (e) => {
        const customTitlebar = this.customTitlebar
        switch (e.which) {
          case keyCodes.ALT:
            // Ignore right alt (AltGr)
            if (e.location === keyLocations.DOM_KEY_LOCATION_RIGHT) {
              break
            }

            // Only show/hide the menu if last key pressed was ALT
            // (typing ALT codes should not toggle menu)
            if (this.lastKeyPressed === keyCodes.ALT) {
              e.preventDefault()

              if (getSetting(settings.AUTO_HIDE_MENU)) {
                windowActions.toggleMenubarVisible(null)
              } else {
                if (customTitlebar.menubarSelectedIndex) {
                  windowActions.setMenuBarSelectedIndex()
                  windowActions.setContextMenuDetail()
                } else {
                  windowActions.setMenuBarSelectedIndex(0)
                }
              }
            }
            break
          case keyCodes.ESC:
            if (getSetting(settings.AUTO_HIDE_MENU) && customTitlebar.menubarVisible && !customTitlebar.menubarSelectedIndex) {
              e.preventDefault()
              windowActions.toggleMenubarVisible(false)
              break
            }
            if (customTitlebar.menubarSelectedIndex) {
              e.preventDefault()
              windowActions.setMenuBarSelectedIndex()
              windowActions.setContextMenuDetail()
            }
            break
        }
      })

      document.addEventListener('focus', (e) => {
        let selector = document.activeElement.id
          ? '#' + document.activeElement.id
          : null

        if (!selector && document.activeElement.tagName === 'WEBVIEW') {
          const frameKeyAttribute = document.activeElement.getAttribute('data-frame-key')
          if (frameKeyAttribute) {
            selector = 'webview[data-frame-key="' + frameKeyAttribute + '"]'
          }
        }

        windowActions.setLastFocusedSelector(selector)
      }, true)
    }
  }

  exitFullScreen () {
    const activeFrame = frameStateUtil.getActiveFrame(this.props.windowState)
    if (activeFrame && activeFrame.get('isFullScreen')) {
      windowActions.setFullScreen(activeFrame, false)
    }
  }

  registerSwipeListener () {
    // Navigates back/forward on macOS two-finger swipe
    var trackingFingers = false
    var swipeGesture = false
    var isSwipeOnEdge = false
    var deltaX = 0
    var deltaY = 0
    var startTime = 0
    var time

    this.mainWindow.addEventListener('wheel', (e) => {
      if (trackingFingers) {
        deltaX = deltaX + e.deltaX
        deltaY = deltaY + e.deltaY
        time = (new Date()).getTime() - startTime
      }
    }, { passive: true })
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
    ipc.on(messages.ENABLE_SWIPE_GESTURE, (e) => {
      swipeGesture = true
    })
    ipc.on(messages.DISABLE_SWIPE_GESTURE, (e) => {
      swipeGesture = false
    })
    ipc.on('scroll-touch-begin', function () {
      if (swipeGesture) {
        // TODO(Anthony): respecting system settings on cr54
        // systemPreferences.isSwipeTrackingFromScrollEventsEnabled()) {
        trackingFingers = true
        isSwipeOnEdge = false
        startTime = (new Date()).getTime()
      }
    })
    ipc.on('scroll-touch-end', function () {
      if (time > 50 && trackingFingers && Math.abs(deltaY) < 50 && isSwipeOnEdge) {
        if (deltaX > 70) {
          ipc.emit(messages.SHORTCUT_ACTIVE_FRAME_FORWARD)
        } else if (deltaX < -70) {
          ipc.emit(messages.SHORTCUT_ACTIVE_FRAME_BACK)
        }
      }
      trackingFingers = false
      deltaX = 0
      deltaY = 0
      startTime = 0
    })
    ipc.on('scroll-touch-edge', function () {
      isSwipeOnEdge = true
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
            autocompleteURL: entry.autocomplete,
            platformClientId: entry.platformClientId
          }))
          this.lastLoadedSearchProviders = engine
          return false
        }
      })
    }
  }

  componentWillUpdate (nextProps) {
    if (!this.props.appState.getIn([appConfig.resourceNames.WIDEVINE, 'ready']) &&
        nextProps.appState.getIn([appConfig.resourceNames.WIDEVINE, 'ready'])) {
      const widevinePanelDetail = this.props.windowState.get('widevinePanelDetail')
      // User may have enabled from preferences and no details are present
      if (!widevinePanelDetail) {
        return
      }
      const origin = siteUtil.getOrigin(widevinePanelDetail.get('location'))
      // This automatically handles reloading the frame as well
      appActions.changeSiteSetting(origin, appConfig.resourceNames.WIDEVINE, widevinePanelDetail.get('alsoAddRememberSiteSetting') ? 1 : 0)
    }
  }

  componentDidUpdate (prevProps) {
    this.loadSearchProviders()
    const activeFrame = frameStateUtil.getActiveFrame(this.props.windowState)
    const activeFramePrev = frameStateUtil.getActiveFrame(prevProps.windowState)
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
    this.registerCustomTitlebarHandlers()

    ipc.on(messages.SHORTCUT_NEW_FRAME, (event, url, options = {}) => {
      if (options.singleFrame) {
        const frameProps = self.props.windowState.get('frames').find((frame) => frame.get('location') === url)
        if (frameProps) {
          windowActions.setActiveFrame(frameProps)
          return
        }
      }
      let openInForeground = getSetting(settings.SWITCH_TO_NEW_TABS) === true || options.openInForeground
      const frameOpts = options.frameOpts || {
        location: url,
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
        left: props.left,
        top: props.top,
        height: props.height,
        width: props.width,
        src
      }))
    })

    ipc.on(messages.SHORTCUT_CLOSE_FRAME, (e, i) => typeof i !== 'undefined' && i !== null
      ? windowActions.closeFrame(self.props.windowState.get('frames'), frameStateUtil.getFrameByKey(self.props.windowState, i))
      : windowActions.closeFrame(self.props.windowState.get('frames'), frameStateUtil.getActiveFrame(this.props.windowState)))
    ipc.on(messages.SHORTCUT_UNDO_CLOSED_FRAME, () => windowActions.undoClosedFrame())

    ipc.on(messages.SHORTCUT_CLOSE_OTHER_FRAMES, (e, key, isCloseRight, isCloseLeft) => {
      const currentIndex = frameStateUtil.getFrameIndex(self.props.windowState, key)
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
      windowActions.setActiveFrame(frameStateUtil.getFrameByDisplayIndex(self.props.windowState, i)))

    ipc.on(messages.SHORTCUT_SET_ACTIVE_FRAME_TO_LAST, () =>
      windowActions.setActiveFrame(self.props.windowState.getIn(['frames', self.props.windowState.get('frames').size - 1])))

    ipc.on(messages.BLOCKED_RESOURCE, (e, blockType, details) => {
      const frameProps = frameStateUtil.getFrameByTabId(self.props.windowState, details.tabId)
      frameProps && windowActions.setBlockedBy(frameProps, blockType, details.url)
    })

    ipc.on(messages.BLOCKED_PAGE, (e, blockType, details) => {
      const frameProps = frameStateUtil.getFrameByTabId(self.props.windowState, details.tabId)
      if (!frameProps) {
        return
      }
    })

    ipc.on(messages.HTTPSE_RULE_APPLIED, (e, ruleset, details) => {
      const frameProps = frameStateUtil.getFrameByTabId(self.props.windowState, details.tabId)
      frameProps && windowActions.setRedirectedBy(frameProps, ruleset, details.url)
    })

    ipc.on(messages.SHORTCUT_ACTIVE_FRAME_BACK, this.onBack)
    ipc.on(messages.SHORTCUT_ACTIVE_FRAME_FORWARD, this.onForward)

    ipc.on(messages.SHORTCUT_ACTIVE_FRAME_LOAD_URL, (e, url) => {
      const activeFrame = frameStateUtil.getActiveFrame(self.props.windowState)
      windowActions.loadUrl(activeFrame, url)
    })

    ipc.on(messages.CERT_ERROR, (e, details) => {
      const frame = frameStateUtil.getFrameByTabId(self.props.windowState, details.tabId)
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
      windowActions.setSecurityState(frameStateUtil.getFrameByKey(self.props.windowState, frameKey),
                                     securityState)
    })

    ipc.on(messages.SHOW_USERNAME_LIST, (e, usernames, origin, action, boundingRect) => {
      const topOffset = this.tabContainer.getBoundingClientRect().top
      contextMenus.onShowUsernameMenu(usernames, origin, action, boundingRect, topOffset)
    })

    ipc.on(messages.HIDE_CONTEXT_MENU, () => {
      windowActions.setContextMenuDetail()
    })

    ipc.on(messages.IMPORTER_LIST, (e, detail) => {
      windowActions.setImportBrowserDataDetail(detail)
      windowActions.setImportBrowserDataSelected({})
    })

    this.loadSearchProviders()

    window.addEventListener('mousemove', (e) => {
      if (e.pageY !== this.pageY) {
        this.pageY = e.pageY
        this.checkForTitleMode()
      }
    })
    window.addEventListener('focus', () => {
      const activeFrame = frameStateUtil.getActiveFrame(self.props.windowState)
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

    const activeFrame = frameStateUtil.getActiveFrame(self.props.windowState)
    if (activeFrame && activeFrame.get('title')) {
      currentWindow.setTitle(activeFrame.get('title'))
    }

    // Handlers for saving window state
    // TODO: revisit this code when window state moves to appStore
    const slidingTimerMilliseconds = 1000

    const onWindowResize = debounce(function (event) {
      const size = event.sender.getSize()
      // NOTE: the default window size is whatever the last window resize was
      appActions.defaultWindowParamsChanged(size)
      windowActions.saveSize(size)
    }, slidingTimerMilliseconds)

    const onWindowMove = debounce(function (event) {
      const position = event.sender.getPosition()
      // NOTE: the default window position is whatever the last window move was
      appActions.defaultWindowParamsChanged(undefined, position)
      windowActions.savePosition(position)
    }, slidingTimerMilliseconds)

    currentWindow.on('maximize', function () {
      windowActions.setMaximizeState(true)
    })
    currentWindow.on('unmaximize', function () {
      windowActions.setMaximizeState(false)
    })
    currentWindow.on('resize', onWindowResize)
    currentWindow.on('move', onWindowMove)
    currentWindow.on('focus', function () {
      windowActions.onFocusChanged(true)
    })
    currentWindow.on('blur', function () {
      appActions.windowBlurred(currentWindow.id)
      windowActions.onFocusChanged(false)
    })
    // Full screen as in F11 (not full screen on a video)
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
    const activeFrame = frameStateUtil.getActiveFrame(this.props.windowState)
    if (!activeFrame) {
      return undefined
    }
    let location = activeFrame.get('location')
    const history = activeFrame.get('history')
    if (isIntermediateAboutPage(location)) {
      const parsedUrl = urlParse(location)
      if (parsedUrl.hash) {
        location = parsedUrl.hash.split('#')[1]
      } else if (history.size > 0) {
        location = history.last()
      }
    }
    return location
  }

  onNav (e, navCheckProp, navType, navAction) {
    const activeFrame = frameStateUtil.getActiveFrame(this.props.windowState)
    const activeTabId = activeFrame.get('tabId')
    const activeTab = activeFrame ? this.props.appState.get('tabs').find((tab) => tab.get('tabId') === activeTabId) : null
    const isNavigatable = isNavigatableAboutPage(getBaseUrl(activeFrame.get('location')))
    if (e && eventUtil.isForSecondaryAction(e) && isNavigatable) {
      if (activeTab && activeTab.get(navCheckProp)) {
        appActions.tabCloned(activeTabId, {
          [navType]: true,
          active: !!e.shiftKey
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

  onBackLongPress (target) {
    contextMenus.onBackButtonHistoryMenu(this.activeFrame, this.activeFrame.getHistory(this.props.appState), target)
  }

  onForwardLongPress (target) {
    contextMenus.onForwardButtonHistoryMenu(this.activeFrame, this.activeFrame.getHistory(this.props.appState), target)
  }

  onBraveMenu () {
    if (!this.braveShieldsDisabled) {
      windowActions.setBraveryPanelDetail({})
    }
  }

  onHamburgerMenu (e) {
    const activeFrame = frameStateUtil.getActiveFrame(this.props.windowState)
    contextMenus.onHamburgerMenu(activeFrame && activeFrame.get('location') || '', e)
  }

  onHideSiteInfo () {
    windowActions.setSiteInfoVisible(false)
  }

  onHideBraveryPanel () {
    windowActions.setBraveryPanelDetail()
  }

  onHideClearBrowsingDataPanel () {
    windowActions.setClearBrowsingDataPanelVisible(false)
  }

  onHideImportBrowserDataPanel () {
    windowActions.setImportBrowserDataDetail()
  }

  onHideWidevinePanel () {
    windowActions.widevinePanelDetailChanged({
      shown: false
    })
  }

  onHideAutofillAddressPanel () {
    windowActions.setAutofillAddressDetail()
  }

  onHideAutofillCreditCardPanel () {
    windowActions.setAutofillCreditCardDetail()
  }

  onHideNoScript () {
    windowActions.setNoScriptVisible(false)
  }

  onHideReleaseNotes () {
    windowActions.setReleaseNotesVisible(false)
  }

  onHideCheckDefaultBrowserDialog () {
    windowActions.setModalDialogDetail('checkDefaultBrowserDialog')
  }

  enableNoScript (settings) {
    return siteSettings.activeSettings(settings, this.props.appState, appConfig).noScript === true
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
      let activeFrame = frameStateUtil.getActiveFrame(this.props.windowState)
      if (activeFrame) {
        windowActions.loadUrl(activeFrame, e.dataTransfer.getData('text/plain'))
      }
    }
  }

  onDoubleClick (e) {
    if (!e.target.className.includes('navigatorWrapper')) {
      return
    }
    return !isMaximized() ? currentWindow.maximize() : currentWindow.unmaximize()
  }

  onMouseDown (e) {
    // TODO(bsclifton): update this to use eventUtil.eventElHasAncestorWithClasses
    let node = e.target
    while (node) {
      if (node.classList &&
          (node.classList.contains('popupWindow') ||
            node.classList.contains('contextMenu') ||
            node.classList.contains('extensionButton') ||
            node.classList.contains('menubarItem') ||
            node.classList.contains('bookmarkHanger'))) {
        // Middle click (on context menu) needs to fire the click event.
        // We need to prevent the default "Auto-Scrolling" behavior.
        if (node.classList.contains('contextMenu') && e.button === 1) {
          e.preventDefault()
        }
        // Click event is handled downstream
        return
      }
      node = node.parentNode
    }
    // Hide context menus, popup menus, and menu selections
    windowActions.resetMenuState()
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
    const activeFrame = frameStateUtil.getActiveFrame(this.props.windowState)
    windowActions.setFindbarShown(activeFrame, false)
    webviewActions.stopFindInPage()
    windowActions.setFindDetail(activeFrame, Immutable.fromJS({
      internalFindStatePresent: false,
      numberOfMatches: -1,
      activeMatchOrdinal: 0
    }))
  }

  onFind (searchString, caseSensitivity, forward, findNext) {
    const activeFrame = frameStateUtil.getActiveFrame(this.props.windowState)
    webviewActions.findInPage(searchString, caseSensitivity, forward, findNext)
    if (!findNext) {
      windowActions.setFindDetail(activeFrame, Immutable.fromJS({
        internalFindStatePresent: true
      }))
    }
  }

  onTabContextMenu (e) {
    const activeFrame = frameStateUtil.getActiveFrame(this.props.windowState)
    contextMenus.onTabsToolbarContextMenu(activeFrame, undefined, undefined, e)
  }

  get allSiteSettings () {
    const activeFrame = frameStateUtil.getActiveFrame(this.props.windowState)
    if (activeFrame && activeFrame.get('isPrivate')) {
      return this.props.appState.get('siteSettings').mergeDeep(this.props.appState.get('temporarySiteSettings'))
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

  get activeTabId () {
    const activeFrame = frameStateUtil.getActiveFrame(this.props.windowState)
    return activeFrame && activeFrame.get('tabId')
  }

  get activeSiteSettings () {
    return this.frameSiteSettings(this.activeRequestedLocation)
  }

  get braveShieldsDisabled () {
    const activeRequestedLocation = this.activeRequestedLocation
    if (!activeRequestedLocation) {
      return true
    }

    const parsedUrl = urlParse(activeRequestedLocation)
    return parsedUrl.protocol !== 'https:' && parsedUrl.protocol !== 'http:' && (parsedUrl.protocol + parsedUrl.host) !== 'about:safebrowsing'
  }

  get extensionButtons () {
    const enabledExtensions = extensionState.getEnabledExtensions(this.props.appState)
    const extensionBrowserActions = enabledExtensions
      .map((extension) => extensionState.getBrowserActionByTabId(this.props.appState, extension.get('id'), this.activeTabId))
      .filter((browserAction) => browserAction)
    let buttons = extensionBrowserActions.map((browserAction, id) =>
      <BrowserActionButton
        browserAction={browserAction}
        extensionId={id}
        tabId={this.activeTabId}
        popupWindowSrc={this.props.windowState.getIn(['popupWindowDetail', 'src'])} />
    ).values()
    buttons = Array.from(buttons)
    if (buttons.length > 0) {
      buttons.push(<span className='buttonSeparator' />)
    }
    return buttons
  }

  get customTitlebar () {
    const customTitlebarEnabled = isWindows
    const captionButtonsVisible = customTitlebarEnabled
    const menubarVisible = customTitlebarEnabled && (!getSetting(settings.AUTO_HIDE_MENU) || this.props.windowState.getIn(['ui', 'menubar', 'isVisible']))
    const selectedIndex = this.props.windowState.getIn(['ui', 'contextMenu', 'selectedIndex'])
    return {
      enabled: customTitlebarEnabled,
      captionButtonsVisible: captionButtonsVisible,
      menubarVisible: menubarVisible,
      menubarTemplate: menubarVisible ? this.props.appState.getIn(['menu', 'template']) : null,
      menubarSelectedIndex: this.props.windowState.getIn(['ui', 'menubar', 'selectedIndex']),
      contextMenuSelectedIndex: typeof selectedIndex === 'object' && Array.isArray(selectedIndex) && selectedIndex.length > 0
        ? selectedIndex
        : null,
      lastFocusedSelector: this.props.windowState.getIn(['ui', 'menubar', 'lastFocusedSelector']),
      isMaximized: isMaximized() || isFullScreen()
    }
  }

  bindHistory (frame) {
    if (frame.get('location') === 'about:history') {
      const history = aboutHistoryState.getHistory(this.props.appState)
      if (history) {
        return history
      }
      appActions.populateHistory()
    }
    return null
  }

  render () {
    const comparatorByKeyAsc = (a, b) => a.get('key') > b.get('key')
      ? 1 : b.get('key') > a.get('key') ? -1 : 0

    // Sort frames by key so that the order of the frames do not change which could
    // cause unexpected reloading when a user moves tabs.
    // All frame operations work off of frame keys and not index though so unsorted frames
    // can be passed everywhere other than the Frame elements.
    const sortedFrames = this.props.windowState.get('frames').sort(comparatorByKeyAsc)
    const activeFrame = frameStateUtil.getActiveFrame(this.props.windowState)
    this.frames = {}
    const allSiteSettings = this.allSiteSettings
    const activeSiteSettings = this.activeSiteSettings
    const nonPinnedFrames = this.props.windowState.get('frames').filter((frame) => !frame.get('pinnedLocation'))
    const tabsPerPage = Number(getSetting(settings.TABS_PER_PAGE))
    const showBookmarksToolbar = getSetting(settings.SHOW_BOOKMARKS_TOOLBAR)
    const btbMode = getSetting(settings.BOOKMARKS_TOOLBAR_MODE)
    const showFavicon = (btbMode === bookmarksToolbarMode.TEXT_AND_FAVICONS || btbMode === bookmarksToolbarMode.FAVICONS_ONLY)
    const showOnlyFavicon = btbMode === bookmarksToolbarMode.FAVICONS_ONLY
    const siteInfoIsVisible = this.props.windowState.getIn(['ui', 'siteInfo', 'isVisible'])
    const braveShieldsDisabled = this.braveShieldsDisabled
    const braveryPanelIsVisible = !braveShieldsDisabled && this.props.windowState.get('braveryPanelDetail')
    const clearBrowsingDataPanelIsVisible = this.props.windowState.getIn(['ui', 'isClearBrowsingDataPanelVisible'])
    const importBrowserDataPanelIsVisible = this.props.windowState.get('importBrowserDataDetail')
    const widevinePanelIsVisible = this.props.windowState.getIn(['widevinePanelDetail', 'shown'])
    const autofillAddressPanelIsVisible = this.props.windowState.get('autofillAddressDetail')
    const autofillCreditCardPanelIsVisible = this.props.windowState.get('autofillCreditCardDetail')
    const activeRequestedLocation = this.activeRequestedLocation
    const noScriptIsVisible = this.props.windowState.getIn(['ui', 'noScriptInfo', 'isVisible'])
    const activeTab = activeFrame ? this.props.appState.get('tabs').find((tab) => tab.get('tabId') === activeFrame.get('tabId')) : null
    const releaseNotesIsVisible = this.props.windowState.getIn(['ui', 'releaseNotes', 'isVisible'])
    const checkDefaultBrowserDialogIsVisible =
      isFocused() && defaultBrowserState.shouldDisplayDialog(this.props.appState)
    const braverySettings = siteSettings.activeSettings(activeSiteSettings, this.props.appState, appConfig)
    const loginRequiredDetail = activeFrame ? basicAuthState.getLoginRequiredDetail(this.props.appState, activeFrame.get('tabId')) : null
    const customTitlebar = this.customTitlebar
    const versionInformation = this.props.appState.getIn(['about', 'brave', 'versionInformation'])
    const braveryDefaults = Immutable.fromJS(siteSettings.braveryDefaults(this.props.appState, appConfig))
    const contextMenuDetail = this.props.windowState.get('contextMenuDetail')
    const shouldAllowWindowDrag = !contextMenuDetail &&
      !this.props.windowState.get('bookmarkDetail') &&
      !siteInfoIsVisible &&
      !braveryPanelIsVisible &&
      !clearBrowsingDataPanelIsVisible &&
      !importBrowserDataPanelIsVisible &&
      !widevinePanelIsVisible &&
      !autofillAddressPanelIsVisible &&
      !autofillCreditCardPanelIsVisible &&
      !releaseNotesIsVisible &&
      !checkDefaultBrowserDialogIsVisible &&
      !noScriptIsVisible &&
      activeFrame && !activeFrame.getIn(['security', 'loginRequiredDetail']) &&
      !customTitlebar.menubarSelectedIndex

    const appStateSites = this.props.appState.get('sites')

    return <div id='window'
      className={cx({
        isFullScreen: activeFrame && activeFrame.get('isFullScreen'),
        isMaximized: customTitlebar.isMaximized,
        frameless: customTitlebar.captionButtonsVisible
      })}
      ref={(node) => { this.mainWindow = node }}
      onMouseDown={this.onMouseDown}
      onClick={this.onClickWindow}>
      {
        contextMenuDetail
        ? <ContextMenu
          lastZoomPercentage={activeFrame && activeFrame.get('lastZoomPercentage')}
          contextMenuDetail={contextMenuDetail}
          selectedIndex={customTitlebar.contextMenuSelectedIndex} />
        : null
      }
      {
        this.props.windowState.get('popupWindowDetail')
        ? <PopupWindow
          detail={this.props.windowState.get('popupWindowDetail')} />
        : null
      }
      <div className='top'>
        <div className={cx({
          navbarCaptionButtonContainer: true,
          allowDragging: shouldAllowWindowDrag
        })}>
          <div className='navbarMenubarFlexContainer'>
            {
              customTitlebar.menubarVisible
                ? <div className='menubarContainer'>
                  <Menubar
                    template={customTitlebar.menubarTemplate}
                    selectedIndex={customTitlebar.menubarSelectedIndex}
                    contextMenuSelectedIndex={customTitlebar.contextMenuSelectedIndex}
                    contextMenuDetail={contextMenuDetail}
                    autohide={getSetting(settings.AUTO_HIDE_MENU)}
                    lastFocusedSelector={customTitlebar.lastFocusedSelector} />
                  <WindowCaptionButtons windowMaximized={customTitlebar.isMaximized} />
                </div>
                : null
            }
            <div className='navigatorWrapper'
              onDoubleClick={this.onDoubleClick}
              onDragOver={this.onDragOver}
              onDrop={this.onDrop}>
              <div className='backforward'>
                <div className={cx({
                  navigationButtonContainer: true,
                  nav: true,
                  disabled: !activeTab || !activeTab.get('canGoBack')
                })}>
                  <LongPressButton
                    l10nId='backButton'
                    className='navigationButton backButton'
                    disabled={!activeTab || !activeTab.get('canGoBack')}
                    onClick={this.onBack}
                    onLongPress={this.onBackLongPress}
                  />
                </div>
                <div className={cx({
                  navigationButtonContainer: true,
                  nav: true,
                  disabled: !activeTab || !activeTab.get('canGoForward')
                })}>
                  <LongPressButton
                    l10nId='forwardButton'
                    className='navigationButton forwardButton'
                    disabled={!activeTab || !activeTab.get('canGoForward')}
                    onClick={this.onForward}
                    onLongPress={this.onForwardLongPress}
                  />
                </div>
              </div>
              <NavigationBar
                ref={(node) => { this.navBar = node }}
                navbar={activeFrame && activeFrame.get('navbar')}
                sites={appStateSites}
                canGoForward={activeTab && activeTab.get('canGoForward')}
                activeFrameKey={activeFrame && activeFrame.get('key') || undefined}
                location={activeFrame && activeFrame.get('location') || ''}
                title={activeFrame && activeFrame.get('title') || ''}
                scriptsBlocked={activeFrame && activeFrame.getIn(['noScript', 'blocked'])}
                partitionNumber={activeFrame && activeFrame.get('partitionNumber') || 0}
                history={activeFrame && activeFrame.get('history') || emptyList}
                suggestionIndex={activeFrame && activeFrame.getIn(['navbar', 'urlbar', 'suggestions', 'selectedIndex']) || 0}
                isSecure={activeFrame && activeFrame.getIn(['security', 'isSecure']) &&
                 !activeFrame.getIn(['security', 'runInsecureContent'])}
                hasLocationValueSuffix={activeFrame && activeFrame.getIn(['navbar', 'urlbar', 'suggestions', 'urlSuffix'])}
                startLoadTime={activeFrame && activeFrame.get('startLoadTime') || undefined}
                endLoadTime={activeFrame && activeFrame.get('endLoadTime') || undefined}
                loading={activeFrame && activeFrame.get('loading')}
                bookmarkDetail={this.props.windowState.get('bookmarkDetail')}
                mouseInTitlebar={this.props.windowState.getIn(['ui', 'mouseInTitlebar'])}
                searchDetail={this.props.windowState.get('searchDetail')}
                enableNoScript={this.enableNoScript(activeSiteSettings)}
                settings={this.props.appState.get('settings')}
                noScriptIsVisible={noScriptIsVisible}
                menubarVisible={customTitlebar.menubarVisible}
                siteSettings={this.props.appState.get('siteSettings')}
                synopsis={this.props.appState.getIn(['publisherInfo', 'synopsis']) || new Immutable.Map()}
              />
              <div className='topLevelEndButtons'>
                <div className={cx({
                  extraDragArea: !customTitlebar.menubarVisible,
                  allowDragging: shouldAllowWindowDrag
                })} />
                {
                  this.extensionButtons
                }
                <Button iconClass='braveMenu'
                  l10nId='braveMenu'
                  className={cx({
                    navbutton: true,
                    braveShieldsDisabled,
                    braveShieldsDown: !braverySettings.shieldsUp,
                    leftOfCaptionButton: customTitlebar.captionButtonsVisible && !customTitlebar.menubarVisible
                  })}
                  onClick={this.onBraveMenu} />
                {
                  customTitlebar.captionButtonsVisible && !customTitlebar.menubarVisible
                  ? <span className='buttonSeparator' />
                  : null
                }
              </div>
            </div>
          </div>
          {
            customTitlebar.captionButtonsVisible && !customTitlebar.menubarVisible
              ? <WindowCaptionButtons windowMaximized={customTitlebar.isMaximized} verticallyCenter='true' />
              : null
          }
        </div>
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
            clearBrowsingDataDefaults={this.props.appState.get('clearBrowsingDataDefaults')}
            onHide={this.onHideClearBrowsingDataPanel} />
          : null
        }
        {
          importBrowserDataPanelIsVisible
          ? <ImportBrowserDataPanel
            importBrowserDataDetail={this.props.windowState.get('importBrowserDataDetail')}
            importBrowserDataSelected={this.props.windowState.get('importBrowserDataSelected')}
            onHide={this.onHideImportBrowserDataPanel} />
          : null
        }
        {
          widevinePanelIsVisible
          ? <WidevinePanel
            widevinePanelDetail={this.props.windowState.get('widevinePanelDetail')}
            widevineReady={this.props.appState.getIn([appConfig.resourceNames.WIDEVINE, 'ready'])}
            onHide={this.onHideWidevinePanel} />
          : null
        }
        {
         autofillAddressPanelIsVisible
          ? <AutofillAddressPanel
            currentDetail={this.props.windowState.getIn(['autofillAddressDetail', 'currentDetail'])}
            originalDetail={this.props.windowState.getIn(['autofillAddressDetail', 'originalDetail'])}
            onHide={this.onHideAutofillAddressPanel} />
          : null
        }
        {
         autofillCreditCardPanelIsVisible
          ? <AutofillCreditCardPanel
            currentDetail={this.props.windowState.getIn(['autofillCreditCardDetail', 'currentDetail'])}
            originalDetail={this.props.windowState.getIn(['autofillCreditCardDetail', 'originalDetail'])}
            onHide={this.onHideAutofillCreditCardPanel} />
          : null
        }
        {
          loginRequiredDetail
            ? <LoginRequired loginRequiredDetail={loginRequiredDetail} tabId={activeFrame.get('tabId')} />
            : null
        }
        {
          this.props.windowState.get('bookmarkDetail') && !this.props.windowState.getIn(['bookmarkDetail', 'isBookmarkHanger'])
          ? <AddEditBookmark
            sites={appStateSites}
            currentDetail={this.props.windowState.getIn(['bookmarkDetail', 'currentDetail'])}
            originalDetail={this.props.windowState.getIn(['bookmarkDetail', 'originalDetail'])}
            destinationDetail={this.props.windowState.getIn(['bookmarkDetail', 'destinationDetail'])}
            shouldShowLocation={this.props.windowState.getIn(['bookmarkDetail', 'shouldShowLocation'])} />
          : null
        }
        {
          noScriptIsVisible
            ? <NoScriptInfo frameProps={activeFrame}
              noScriptGlobalEnabled={this.props.appState.getIn(['noScript', 'enabled'])}
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
        {
          checkDefaultBrowserDialogIsVisible
            ? <CheckDefaultBrowserDialog
              checkDefaultOnStartup={
                this.props.windowState.getIn(['modalDialogDetail', 'checkDefaultBrowserDialog']) === undefined
                ? getSetting(settings.CHECK_DEFAULT_ON_STARTUP)
                : this.props.windowState.getIn(['modalDialogDetail', 'checkDefaultBrowserDialog', 'checkDefaultOnStartup'])
              }
              onHide={this.onHideCheckDefaultBrowserDialog} />
            : null
        }

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
            shouldAllowWindowDrag={shouldAllowWindowDrag && !isWindows}
            activeFrameKey={activeFrame && activeFrame.get('key') || undefined}
            windowWidth={window.innerWidth}
            contextMenuDetail={contextMenuDetail}
            sites={appStateSites}
            selectedFolderId={this.props.windowState.getIn(['ui', 'bookmarksToolbar', 'selectedFolderId'])} />
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
          fixTabWidth={this.props.windowState.getIn(['ui', 'tabs', 'fixTabWidth'])}
          tabs={this.props.windowState.get('tabs')}
          sites={appStateSites}
          key='tab-bar'
          activeFrameKey={activeFrame && activeFrame.get('key') || undefined}
          onMenu={this.onHamburgerMenu}
        />

        {
          activeFrame && activeFrame.get('findbarShown') && !activeFrame.get('isFullScreen')
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
                urlBarFocused={activeFrame && activeFrame.getIn(['navbar', 'urlbar', 'focused'])}
                tabIndex={frameStateUtil.getFrameIndex(this.props.windowState, frame.get('key'))}
                prefOpenInForeground={getSetting(settings.SWITCH_TO_NEW_TABS)}
                onCloseFrame={this.onCloseFrame}
                frameKey={frame.get('key')}
                contextMenuDetail={contextMenuDetail}
                partition={frameStateUtil.getPartition(frame)}
                key={frame.get('key')}
                settings={['about:preferences', 'about:history', 'about:adblock'].includes(getBaseUrl(frame.get('location')))
                  ? this.props.appState.get('settings') || emptyMap
                  : null}
                bookmarks={frame.get('location') === 'about:bookmarks'
                  ? appStateSites
                      .filter((site) => site.get('tags')
                        .includes(siteTags.BOOKMARK)) || emptyMap
                  : null}
                history={this.bindHistory(frame)}
                extensions={frame.get('location') === 'about:extensions'
                  ? this.props.appState.get('extensions') || emptyMap
                  : null}
                preferencesData={frame.get('location') === 'about:preferences#payments'
                  ? this.props.appState.getIn(['ui', 'about', 'preferences']) || emptyMap
                  : null}
                downloads={this.props.appState.get('downloads') || emptyMap}
                bookmarkFolders={frame.get('location') === 'about:bookmarks'
                  ? appStateSites
                      .filter((site) => site.get('tags')
                        .includes(siteTags.BOOKMARK_FOLDER)) || emptyMap
                  : null}
                isFullScreen={frame.get('isFullScreen')}
                isSecure={frame.getIn(['security', 'isSecure'])}
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
                widevine={this.props.appState.get('widevine')}
                cookieblock={this.props.appState.get('cookieblock')}
                allSiteSettings={allSiteSettings}
                sync={this.props.appState.get('sync') || new Immutable.Map()}
                ledgerInfo={this.props.appState.get('ledgerInfo') || new Immutable.Map()}
                publisherInfo={this.props.appState.get('publisherInfo') || new Immutable.Map()}
                frameSiteSettings={this.frameSiteSettings(frame.get('location'))}
                onFindHide={this.onFindHide}
                enableNoScript={this.enableNoScript(this.frameSiteSettings(frame.get('location')))}
                versionInformation={versionInformation}
                braveryDefaults={braveryDefaults}
                isPreview={frame.get('key') === this.props.windowState.get('previewFrameKey')}
                isActive={frameStateUtil.isFrameKeyActive(this.props.windowState, frame.get('key'))}
                autofillCreditCards={this.props.appState.getIn(['autofill', 'creditCards'])}
                autofillAddresses={this.props.appState.getIn(['autofill', 'addresses'])}
                adblockCount={this.props.appState.getIn(['adblock', 'count'])}
                trackedBlockersCount={this.props.appState.getIn(['trackingProtection', 'count'])}
                httpsUpgradedCount={this.props.appState.getIn(['httpsEverywhere', 'count'])}
                newTabDetail={frame.get('location') === 'about:newtab' ? this.props.appState.getIn(['about', 'newtab']) : null}
              />)
          }
        </div>
      </div>
      {
        this.props.windowState.getIn(['ui', 'downloadsToolbar', 'isVisible']) && this.props.appState.get('downloads') && this.props.appState.get('downloads').size > 0
        ? <DownloadsBar
          windowWidth={window.innerWidth}
          downloads={this.props.appState.get('downloads')} />
        : null
      }
    </div>
  }
}

module.exports = Main
