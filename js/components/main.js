/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const ImmutableComponent = require('../../app/renderer/components/immutableComponent')
const Immutable = require('immutable')
const electron = require('electron')
const ipc = electron.ipcRenderer
const systemPreferences = electron.remote.systemPreferences

// Actions
const appActions = require('../actions/appActions')
const windowActions = require('../actions/windowActions')
const webviewActions = require('../actions/webviewActions')
const contextMenus = require('../contextMenus')
const getSetting = require('../settings').getSetting

// Components
const Navigator = require('../../app/renderer/components/navigation/navigator')
const Frame = require('./frame')
const TabPages = require('../../app/renderer/components/tabs/tabPages')
const TabsToolbar = require('../../app/renderer/components/tabs/tabsToolbar')
const FindBar = require('./findbar')
const UpdateBar = require('./updateBar')
const {NotificationBar} = require('./notificationBar')
const DownloadsBar = require('../../app/renderer/components/downloadsBar')
const SiteInfo = require('./siteInfo')
const BraveryPanel = require('./braveryPanel')
const ClearBrowsingDataPanel = require('../../app/renderer/components/clearBrowsingDataPanel')
const ImportBrowserDataPanel = require('../../app/renderer/components/importBrowserDataPanel')
const WidevinePanel = require('../../app/renderer/components/widevinePanel')
const AutofillAddressPanel = require('../../app/renderer/components/autofill/autofillAddressPanel')
const AutofillCreditCardPanel = require('../../app/renderer/components/autofill/autofillCreditCardPanel')
const AddEditBookmark = require('../../app/renderer/components/bookmarks/addEditBookmark')
const LoginRequired = require('../../app/renderer/components/loginRequired')
const ReleaseNotes = require('../../app/renderer/components/releaseNotes')
const BookmarksToolbar = require('../../app/renderer/components/bookmarks/bookmarksToolbar')
const ContextMenu = require('./contextMenu')
const PopupWindow = require('./popupWindow')
const NoScriptInfo = require('./noScriptInfo')
const CheckDefaultBrowserDialog = require('../../app/renderer/components/checkDefaultBrowserDialog')

// Constants
const appConfig = require('../constants/appConfig')
const messages = require('../constants/messages')
const settings = require('../constants/settings')
const dragTypes = require('../constants/dragTypes')
const keyCodes = require('../../app/common/constants/keyCodes')
const keyLocations = require('../../app/common/constants/keyLocations')
const isWindows = process.platform === 'win32'
const {bookmarksToolbarMode} = require('../../app/common/constants/settingsEnums')

// State handling
const basicAuthState = require('../../app/common/state/basicAuthState')
const frameStateUtil = require('../state/frameStateUtil')
const siteUtil = require('../state/siteUtil')
const searchProviders = require('../data/searchProviders')
const defaultBrowserState = require('../../app/common/state/defaultBrowserState')
const shieldState = require('../../app/common/state/shieldState')
const siteSettingsState = require('../../app/common/state/siteSettingsState')
const tabState = require('../../app/common/state/tabState')

// Util
const _ = require('underscore')
const cx = require('../lib/classSet')
const eventUtil = require('../lib/eventUtil')
const siteSettings = require('../state/siteSettings')
const debounce = require('../lib/debounce')
const {getCurrentWindowId, isMaximized, isFocused, isFullScreen} = require('../../app/renderer/currentWindow')
const platformUtil = require('../../app/common/lib/platformUtil')

class Main extends ImmutableComponent {
  constructor () {
    super()
    this.onMouseDown = this.onMouseDown.bind(this)
    this.onClickWindow = this.onClickWindow.bind(this)
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
    this.onHamburgerMenu = this.onHamburgerMenu.bind(this)
    this.onTabContextMenu = this.onTabContextMenu.bind(this)
    this.onFind = this.onFind.bind(this)
    this.onFindHide = this.onFindHide.bind(this)
    this.checkForTitleMode = debounce(this.checkForTitleMode.bind(this), 20)
    this.resetAltMenuProcessing()
  }
  registerWindowLevelShortcuts () {
    // For window level shortcuts that don't work as local shortcuts
    const isDarwin = platformUtil.isDarwin()
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
      this.keydown[e.which] = true
      this.lastKeyPressed = e.which
    })
  }

  resetAltMenuProcessing () {
    this.lastKeyPressed = undefined
    this.keydown = {}
    this.keydownHistory = []
  }

  registerCustomTitlebarHandlers () {
    if (this.customTitlebar.enabled) {
      document.addEventListener('keyup', (e) => {
        const customTitlebar = this.customTitlebar
        switch (e.which) {
          case keyCodes.LEFT:
          case keyCodes.RIGHT:
          case keyCodes.PRINT_SCREEN:
            // these keys don't register key down when pressed in combination w/ ALT
            this.lastKeyPressed = e.which
            break
          case keyCodes.ALT:
            /*
             Only show/hide the menu if:
             - the left ALT key is pressed (ignore AltGr)
             - last key pressed was ALT (typing ALT codes should not toggle menu)
             - no other key is being pushed simultaneously
             - since initial keydown, ALT has been the only key pressed
            */
            if (e.location === keyLocations.DOM_KEY_LOCATION_RIGHT ||
                this.lastKeyPressed !== keyCodes.ALT ||
                Object.keys(this.keydown).length > 1 ||
                this.keydownHistory.length > 0) {
              break
            }

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

        // For ALT menu processing
        if (Object.keys(this.keydown).length > 1) {
          this.keydownHistory.push(e.which)
        } else {
          this.keydownHistory = []
        }
        delete this.keydown[e.which]
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
    // Navigates back/forward on macOS two- and or three-finger swipe
    let swipeGesture = false
    let trackingFingers = false
    let startTime = 0
    let isSwipeOnLeftEdge = false
    let isSwipeOnRightEdge = false
    let deltaX = 0
    let deltaY = 0
    let time

    ipc.on(messages.ENABLE_SWIPE_GESTURE, (e) => {
      swipeGesture = true
    })

    ipc.on(messages.DISABLE_SWIPE_GESTURE, (e) => {
      swipeGesture = false
    })

    // isSwipeTrackingFromScrollEventsEnabled is only true if "two finger scroll to swipe" is enabled
    ipc.on('scroll-touch-begin', () => {
      if (swipeGesture && systemPreferences.isSwipeTrackingFromScrollEventsEnabled()) {
        trackingFingers = true
        startTime = (new Date()).getTime()
      }
    })

    this.mainWindow.addEventListener('wheel', (e) => {
      if (trackingFingers) {
        deltaX = deltaX + e.deltaX
        deltaY = deltaY + e.deltaY
        time = (new Date()).getTime() - startTime
      }
    }, { passive: true })

    ipc.on('scroll-touch-end', () => {
      if (trackingFingers && time > 30 && Math.abs(deltaY) < 80) {
        if (deltaX > 70 && isSwipeOnRightEdge) {
          ipc.emit(messages.SHORTCUT_ACTIVE_FRAME_FORWARD)
        } else if (deltaX < -70 && isSwipeOnLeftEdge) {
          ipc.emit(messages.SHORTCUT_ACTIVE_FRAME_BACK)
        }
      }
      trackingFingers = false
      deltaX = 0
      deltaY = 0
      startTime = 0
    })

    ipc.on('scroll-touch-edge', () => {
      if (trackingFingers) {
        if (!isSwipeOnRightEdge && deltaX > 0) {
          isSwipeOnRightEdge = true
          isSwipeOnLeftEdge = false
          time = 0
          deltaX = 0
        } else if (!isSwipeOnLeftEdge && deltaX < 0) {
          isSwipeOnLeftEdge = true
          isSwipeOnRightEdge = false
          time = 0
          deltaX = 0
        }
      }
    })

    const throttledSwipe = _.throttle(direction => {
      if (swipeGesture) {
        if (direction === 'left') {
          ipc.emit(messages.SHORTCUT_ACTIVE_FRAME_BACK)
        } else if (direction === 'right') {
          ipc.emit(messages.SHORTCUT_ACTIVE_FRAME_FORWARD)
        }
      }
    }, 500, {leading: true, trailing: false})
    // the swipe gesture handler will only fire if the three finger swipe setting is on, so the complete off setting and three and two finger together is also taken care of
    ipc.on('swipe', (e, direction) => { throttledSwipe(direction) })
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
    const activeFrameTitle = (activeFrame && (activeFrame.get('title') || activeFrame.get('location'))) || ''
    const activeFramePrevTitle = (activeFramePrev && (activeFramePrev.get('title') || activeFramePrev.get('location'))) || ''
    if (activeFrameTitle !== activeFramePrevTitle) {
      windowActions.shouldSetTitle(getCurrentWindowId(), activeFrameTitle)
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

    ipc.on(messages.LEAVE_FULL_SCREEN, this.exitFullScreen.bind(this))

    ipc.on(messages.DEBUG_REACT_PROFILE, (e, args) => {
      window.perf = require('react-addons-perf')
      if (!window.perf.isRunning()) {
        if (!window.isFirstProfiling) {
          window.isFirstProfiling = true
          console.info('See this blog post for more information on profiling: http://benchling.engineering/performance-engineering-with-react/')
        }
        windowActions.shouldOpenDevTools()
        console.log('starting to profile...')
        window.perf.start()
      } else {
        window.perf.stop()
        console.log('profiling stopped. Wasted:')
        window.perf.printWasted()
      }
    })

    ipc.on(messages.OPEN_BRAVERY_PANEL, () => {
      const activeFrame = frameStateUtil.getActiveFrame(self.props.windowState)
      if (shieldState.braveShieldsEnabled(activeFrame)) {
        this.onBraveMenu()
      } else {
        appActions.maybeCreateTabRequested({
          url: 'about:preferences#shields'
        })
      }
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
      ? windowActions.closeFrame(frameStateUtil.getFrameByKey(self.props.windowState, i))
      : windowActions.closeFrame(frameStateUtil.getActiveFrame(this.props.windowState)))
    ipc.on(messages.SHORTCUT_UNDO_CLOSED_FRAME, () => windowActions.undoClosedFrame())

    ipc.on(messages.SHORTCUT_CLOSE_OTHER_FRAMES, (e, key, isCloseRight, isCloseLeft) => {
      const currentIndex = frameStateUtil.getFrameIndex(self.props.windowState, key)
      if (currentIndex === -1) {
        return
      }

      frameStateUtil.getFrames(self.props.windowState).forEach((frame, i) => {
        if (!frame.get('pinnedLocation') &&
            ((i < currentIndex && isCloseLeft) || (i > currentIndex && isCloseRight))) {
          windowActions.closeFrame(frame)
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
      windowActions.setActiveFrame(self.props.windowState.getIn(['frames', frameStateUtil.getFrames(self.props.windowState).size - 1])))

    ipc.on(messages.BLOCKED_RESOURCE, (e, blockType, details) => {
      const frameProps = frameStateUtil.getFrameByTabId(self.props.windowState, details.tabId)
      frameProps && windowActions.setBlockedBy(frameProps, blockType, details.url)
    })

    ipc.on(messages.BLOCKED_PAGE, (e, blockType, details) => {
      // const frameProps = frameStateUtil.getFrameByTabId(self.props.windowState, details.tabId)
      // if (!frameProps) {
      //   return
      // }
    })

    ipc.on(messages.HTTPSE_RULE_APPLIED, (e, ruleset, details) => {
      const frameProps = frameStateUtil.getFrameByTabId(self.props.windowState, details.tabId)
      frameProps && windowActions.setRedirectedBy(frameProps, ruleset, details.url)
    })

    ipc.on(messages.CERT_ERROR, (e, details) => {
      const frame = frameStateUtil.getFrameByTabId(self.props.windowState, details.tabId)
      if (frame && (frame.get('location') === details.url ||
                    frame.get('provisionalLocation') === details.url)) {
        windowActions.setFrameError(frame, {
          url: details.url,
          error: details.error
        })
        appActions.loadURLRequested(frame.get('tabId'), 'about:certerror')
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
      windowActions.shouldSetTitle(getCurrentWindowId(), activeFrame.get('title'))
    }

    window.onblur = () => {
      self.resetAltMenuProcessing()
    }
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
    } else if (this.pageY === undefined || (this.pageY >= height && this.props.windowState.getIn(['ui', 'mouseInTitlebar']) !== false)) {
      windowActions.setMouseInTitlebar(false)
    }
  }

  onBraveMenu () {
    const activeFrame = frameStateUtil.getActiveFrame(this.props.windowState)
    if (shieldState.braveShieldsEnabled(activeFrame)) {
      windowActions.setBraveryPanelDetail({})
    }
  }

  onHamburgerMenu (e) {
    const activeFrame = frameStateUtil.getActiveFrame(this.props.windowState)
    contextMenus.onHamburgerMenu((activeFrame && activeFrame.get('location')) || '', e)
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

  onMouseDown (e) {
    // TODO(bsclifton): update this to use eventUtil.eventElHasAncestorWithClasses
    let node = e.target
    while (node) {
      if (node.classList &&
          (node.matches('[class^="popupWindow"]') ||
            node.classList.contains('contextMenu') ||
            node.matches('[class*="extensionButton_"]') ||
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

  render () {
    // Sort frames by key so that the order of the frames do not change which could
    // cause unexpected reloading when a user moves tabs.
    // All frame operations work off of frame keys and not index though so unsorted frames
    // can be passed everywhere other than the Frame elements.
    const sortedFrames = frameStateUtil.getSortedFrames(this.props.windowState)
    const activeFrame = frameStateUtil.getActiveFrame(this.props.windowState)
    const allSiteSettings = this.allSiteSettings
    const lastCommittedURL = frameStateUtil.getLastCommittedURL(activeFrame)
    const activeSiteSettings = this.frameSiteSettings(lastCommittedURL)
    const nonPinnedFrames = frameStateUtil.getNonPinnedFrames(this.props.windowState)
    const tabsPerPage = Number(getSetting(settings.TABS_PER_PAGE))
    const showBookmarksToolbar = getSetting(settings.SHOW_BOOKMARKS_TOOLBAR)
    const btbMode = getSetting(settings.BOOKMARKS_TOOLBAR_MODE)
    const showFavicon = (btbMode === bookmarksToolbarMode.TEXT_AND_FAVICONS || btbMode === bookmarksToolbarMode.FAVICONS_ONLY)
    const showOnlyFavicon = btbMode === bookmarksToolbarMode.FAVICONS_ONLY
    const siteInfoIsVisible = this.props.windowState.getIn(['ui', 'siteInfo', 'isVisible'])
    const braveryPanelIsVisible = shieldState.braveShieldsEnabled(activeFrame) &&
      this.props.windowState.get('braveryPanelDetail')
    const clearBrowsingDataPanelIsVisible = this.props.windowState.getIn(['ui', 'isClearBrowsingDataPanelVisible'])
    const importBrowserDataPanelIsVisible = this.props.windowState.get('importBrowserDataDetail')
    const widevinePanelIsVisible = this.props.windowState.getIn(['widevinePanelDetail', 'shown'])
    const autofillAddressPanelIsVisible = this.props.windowState.get('autofillAddressDetail')
    const autofillCreditCardPanelIsVisible = this.props.windowState.get('autofillCreditCardDetail')
    const noScriptIsVisible = this.props.windowState.getIn(['ui', 'noScriptInfo', 'isVisible'])
    const activeTab = tabState.getActiveTabValue(this.props.appState, getCurrentWindowId())
    const releaseNotesIsVisible = this.props.windowState.getIn(['ui', 'releaseNotes', 'isVisible'])
    const checkDefaultBrowserDialogIsVisible =
      isFocused() && defaultBrowserState.shouldDisplayDialog(this.props.appState)
    const braverySettings = siteSettings.activeSettings(activeSiteSettings, this.props.appState, appConfig)
    const loginRequiredDetail = activeFrame ? basicAuthState.getLoginRequiredDetail(this.props.appState, activeFrame.get('tabId')) : null
    const customTitlebar = this.customTitlebar
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

    const notifications = this.props.appState.get('notifications')
    const hasNotifications = notifications && notifications.size
    const notificationBarOrigin = notifications.map(bar => bar.get('frameOrigin'))

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
        <Navigator
          appState={this.props.appState}
          windowState={this.props.windowState}
          activeTab={activeTab}
          shouldAllowWindowDrag={shouldAllowWindowDrag}
          customTitlebar={customTitlebar}
          activeSiteSettings={activeSiteSettings}
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
            lastCommittedURL={lastCommittedURL}
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
          showBookmarksToolbar
          ? <BookmarksToolbar
            draggingOverData={this.props.appState.getIn(['dragData', 'dragOverData', 'draggingOverType']) === dragTypes.BOOKMARK && this.props.appState.getIn(['dragData', 'dragOverData'])}
            showFavicon={showFavicon}
            showOnlyFavicon={showOnlyFavicon}
            shouldAllowWindowDrag={shouldAllowWindowDrag && !isWindows}
            activeFrameKey={(activeFrame && activeFrame.get('key')) || undefined}
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
          dragData={this.props.appState.getIn(['dragData', 'type']) === dragTypes.TAB && this.props.appState.get('dragData')}
          previewTabs={getSetting(settings.SHOW_TAB_PREVIEWS)}
          tabsPerTabPage={tabsPerPage}
          tabPageIndex={this.props.windowState.getIn(['ui', 'tabs', 'tabPageIndex'])}
          previewTabPageIndex={this.props.windowState.getIn(['ui', 'tabs', 'previewTabPageIndex'])}
          fixTabWidth={this.props.windowState.getIn(['ui', 'tabs', 'fixTabWidth'])}
          tabs={this.props.windowState.get('tabs')}
          sites={appStateSites}
          key='tab-bar'
          activeFrameKey={(activeFrame && activeFrame.get('key')) || undefined}
          onMenu={this.onHamburgerMenu}
          notificationBarActive={notificationBarOrigin}
          hasTabInFullScreen={
            sortedFrames
              .map((frame) => frame.get('isFullScreen'))
              .some(fullScreenMode => fullScreenMode === true)
          }
        />
        {
          hasNotifications && activeFrame
          ? <NotificationBar notifications={notifications} activeFrame={activeFrame} />
          : null
        }

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
                urlBarFocused={activeFrame && activeFrame.getIn(['navbar', 'urlbar', 'focused'])}
                tabIndex={frameStateUtil.getFrameIndex(this.props.windowState, frame.get('key'))}
                prefOpenInForeground={getSetting(settings.SWITCH_TO_NEW_TABS)}
                frameKey={frame.get('key')}
                contextMenuDetail={contextMenuDetail}
                partition={frameStateUtil.getPartition(frame)}
                key={frame.get('key')}
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
                noScript={this.props.appState.get('noScript')}
                flash={this.props.appState.get('flash')}
                widevine={this.props.appState.get('widevine')}
                allSiteSettings={allSiteSettings}
                frameSiteSettings={this.frameSiteSettings(frame.get('location'))}
                onFindHide={this.onFindHide}
                enableNoScript={siteSettingsState.isNoScriptEnabled(this.props.appState, this.frameSiteSettings(frame.get('location')))}
                braveryDefaults={braveryDefaults}
                isPreview={frame.get('key') === this.props.windowState.get('previewFrameKey')}
                isActive={frameStateUtil.isFrameKeyActive(this.props.windowState, frame.get('key'))}
              />)
          }
        </div>
      </div>
      {
        this.props.windowState.getIn(['ui', 'downloadsToolbar', 'isVisible']) && this.props.appState.get('downloads') && this.props.appState.get('downloads').size > 0
        ? <DownloadsBar
          windowWidth={window.innerWidth}
          deleteConfirmationVisible={this.props.appState.get('deleteConfirmationVisible')}
          downloads={this.props.appState.get('downloads')} />
        : null
      }
    </div>
  }
}

module.exports = Main
