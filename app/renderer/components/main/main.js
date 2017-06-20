/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const ImmutableComponent = require('../immutableComponent')
const Immutable = require('immutable')
const electron = require('electron')
const ipc = electron.ipcRenderer

// Actions
const appActions = require('../../../../js/actions/appActions')
const windowActions = require('../../../../js/actions/windowActions')
const webviewActions = require('../../../../js/actions/webviewActions')
const contextMenus = require('../../../../js/contextMenus')
const {getSetting} = require('../../../../js/settings')

// Components
const Navigator = require('../navigation/navigator')
const Frame = require('../frame/frame')
const TabPages = require('../tabs/tabPages')
const TabsToolbar = require('../tabs/tabsToolbar')
const FindBar = require('./findbar')
const UpdateBar = require('./updateBar')
const {NotificationBar} = require('./notificationBar')
const DownloadsBar = require('../download/downloadsBar')
const SiteInfo = require('./siteInfo')
const BraveryPanel = require('./braveryPanel')
const ClearBrowsingDataPanel = require('./clearBrowsingDataPanel')
const ImportBrowserDataPanel = require('./importBrowserDataPanel')
const WidevinePanel = require('./widevinePanel')
const AutofillAddressPanel = require('../autofill/autofillAddressPanel')
const AutofillCreditCardPanel = require('../autofill/autofillCreditCardPanel')
const AddEditBookmarkHanger = require('../bookmarks/addEditBookmarkHanger')
const LoginRequired = require('./loginRequired')
const ReleaseNotes = require('./releaseNotes')
const BookmarksToolbar = require('../bookmarks/bookmarksToolbar')
const ContextMenu = require('../common/contextMenu')
const PopupWindow = require('./popupWindow')
const NoScriptInfo = require('./noScriptInfo')
const CheckDefaultBrowserDialog = require('./checkDefaultBrowserDialog')

// Constants
const appConfig = require('../../../../js/constants/appConfig')
const messages = require('../../../../js/constants/messages')
const settings = require('../../../../js/constants/settings')
const dragTypes = require('../../../../js/constants/dragTypes')
const keyCodes = require('../../../common/constants/keyCodes')
const keyLocations = require('../../../common/constants/keyLocations')
const {bookmarksToolbarMode} = require('../../../common/constants/settingsEnums')

// State handling
const basicAuthState = require('../../../common/state/basicAuthState')
const frameStateUtil = require('../../../../js/state/frameStateUtil')
const siteUtil = require('../../../../js/state/siteUtil')
const searchProviders = require('../../../../js/data/searchProviders')
const defaultBrowserState = require('../../../common/state/defaultBrowserState')
const shieldState = require('../../../common/state/shieldState')
const siteSettingsState = require('../../../common/state/siteSettingsState')
const menuBarState = require('../../../common/state/menuBarState')
const windowState = require('../../../common/state/windowState')

// Util
const _ = require('underscore')
const cx = require('../../../../js/lib/classSet')
const eventUtil = require('../../../../js/lib/eventUtil')
const siteSettings = require('../../../../js/state/siteSettings')
const debounce = require('../../../../js/lib/debounce')
const {isSourceAboutUrl} = require('../../../../js/lib/appUrlUtil')
const {getCurrentWindowId, isMaximized, isFocused, isFullScreen} = require('../../currentWindow')
const {isDarwin, isWindows, isLinux} = require('../../../common/lib/platformUtil')

class Main extends ImmutableComponent {
  constructor () {
    super()
    this.onMouseDown = this.onMouseDown.bind(this)
    this.onClickWindow = this.onClickWindow.bind(this)
    this.onHideSiteInfo = this.onHideSiteInfo.bind(this)
    this.onHideBraveryPanel = this.onHideBraveryPanel.bind(this)
    this.onHideClearBrowsingDataPanel = this.onHideClearBrowsingDataPanel.bind(this)
    this.onHideAutofillAddressPanel = this.onHideAutofillAddressPanel.bind(this)
    this.onHideAutofillCreditCardPanel = this.onHideAutofillCreditCardPanel.bind(this)
    this.onTabContextMenu = this.onTabContextMenu.bind(this)
    this.checkForTitleMode = debounce(this.checkForTitleMode.bind(this), 20)
    this.resetAltMenuProcessing()
  }
  registerWindowLevelShortcuts () {
    // For window level shortcuts that don't work as local shortcuts
    document.addEventListener('keydown', (e) => {
      switch (e.which) {
        case keyCodes.ESC:
          this.exitFullScreen()
          break
        case keyCodes.F12:
          if (!isDarwin()) {
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
    }, { passive: true })
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
      }, { capture: true, passive: true })
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
    let mouseInFrame = false
    let trackingFingers = false
    let startTime = 0
    let isSwipeOnLeftEdge = false
    let isSwipeOnRightEdge = false
    let deltaX = 0
    let deltaY = 0
    let time

    // isSwipeTrackingFromScrollEventsEnabled is only true if "two finger scroll to swipe" is enabled
    ipc.on('scroll-touch-begin', () => {
      mouseInFrame = this.props.windowState.getIn(['ui', 'mouseInFrame'])
      if (mouseInFrame) {
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
      if (mouseInFrame) {
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
          appActions.defaultSearchEngineLoaded(Immutable.fromJS({
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

    // DO NOT ADD TO THIS LIST
    // ipc.on is deprecated and should be replaced by actions/reducers
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

    ipc.on(messages.SHORTCUT_CLOSE_FRAME, (e, i) => {
      const frame = i == null
        ? frameStateUtil.getActiveFrame(this.props.windowState)
        : frameStateUtil.getFrameByKey(self.props.windowState, i)
      if (frame) {
        appActions.tabCloseRequested(frame.get('tabId'))
      }
    })
    ipc.on(messages.SHORTCUT_UNDO_CLOSED_FRAME, () => windowActions.undoClosedFrame())

    ipc.on(messages.SHORTCUT_CLOSE_OTHER_FRAMES, (e, key, isCloseRight, isCloseLeft) => {
      const currentIndex = frameStateUtil.getFrameIndex(self.props.windowState, key)
      if (currentIndex === -1) {
        return
      }

      frameStateUtil.getFrames(self.props.windowState).forEach((frame, i) => {
        if (!frame.get('pinnedLocation') &&
            ((i < currentIndex && isCloseLeft) || (i > currentIndex && isCloseRight))) {
          if (frame) {
            appActions.tabCloseRequested(frame.get('tabId'))
          }
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

    ipc.on(messages.HIDE_CONTEXT_MENU, () => {
      windowActions.setContextMenuDetail()
    })

    ipc.on(messages.IMPORTER_LIST, (e, detail) => {
      windowActions.setImportBrowserDataDetail(detail)
      windowActions.setImportBrowserDataSelected()
    })
    // DO NOT ADD TO THIS LIST - see above

    this.loadSearchProviders()

    window.addEventListener('mousemove', (e) => {
      if (e.pageY !== this.pageY) {
        this.pageY = e.pageY
        this.checkForTitleMode()
      }
    }, { passive: true })
    window.addEventListener('focus', () => {
      const activeFrame = frameStateUtil.getActiveFrame(self.props.windowState)
      windowActions.setFocusedFrame(activeFrame)
      windowActions.onFocus(getCurrentWindowId())
      // For whatever reason other elements are preserved but webviews are not.
      if (document.activeElement && document.activeElement.tagName === 'BODY') {
        webviewActions.setWebviewFocused()
      }
    }, { passive: true })
    windowActions.onFocus(getCurrentWindowId())

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
      windowActions.onBlur(getCurrentWindowId())
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

  onHideSiteInfo () {
    windowActions.setSiteInfoVisible(false)
  }

  onHideBraveryPanel () {
    windowActions.setBraveryPanelDetail()
  }

  onHideClearBrowsingDataPanel () {
    windowActions.setClearBrowsingDataPanelVisible(false)
  }

  onHideAutofillAddressPanel () {
    windowActions.setAutofillAddressDetail()
  }

  onHideAutofillCreditCardPanel () {
    windowActions.setAutofillCreditCardDetail()
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

  onTabContextMenu (e) {
    const activeFrame = frameStateUtil.getActiveFrame(this.props.windowState)
    contextMenus.onTabsToolbarContextMenu(activeFrame.get('title'), activeFrame.get('location'), undefined, undefined, e)
  }

  get allSiteSettings () {
    const activeFrame = frameStateUtil.getActiveFrame(this.props.windowState) || Immutable.Map()
    return siteSettingsState.getAllSiteSettings(this.props.appState, activeFrame.get('isPrivate'))
  }

  frameSiteSettings (location) {
    if (!location) {
      return undefined
    }
    return siteSettings.getSiteSettingsForURL(this.allSiteSettings, location)
  }

  get customTitlebar () {
    const menubarVisible = menuBarState.isMenuBarVisible(this.props.windowState)
    const selectedIndex = this.props.windowState.getIn(['ui', 'contextMenu', 'selectedIndex'])
    return {
      enabled: isWindows(),
      captionButtonsVisible: isWindows(),
      menubarVisible: menubarVisible,
      menubarSelectedIndex: this.props.windowState.getIn(['ui', 'menubar', 'selectedIndex']),
      contextMenuSelectedIndex: typeof selectedIndex === 'object' && Array.isArray(selectedIndex) && selectedIndex.length > 0
        ? selectedIndex
        : null,
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
    const lastCommittedURL = frameStateUtil.getLastCommittedURL(activeFrame)
    const activeSiteSettings = this.frameSiteSettings(lastCommittedURL)
    const nonPinnedFrames = frameStateUtil.getNonPinnedFrames(this.props.windowState)
    const tabsPerPage = Number(getSetting(settings.TABS_PER_PAGE))
    const showBookmarksToolbar = getSetting(settings.SHOW_BOOKMARKS_TOOLBAR)
    const btbMode = getSetting(settings.BOOKMARKS_TOOLBAR_MODE)
    const showFavicon = (btbMode === bookmarksToolbarMode.TEXT_AND_FAVICONS || btbMode === bookmarksToolbarMode.FAVICONS_ONLY)
    const showOnlyFavicon = btbMode === bookmarksToolbarMode.FAVICONS_ONLY
    const siteInfoIsVisible = this.props.windowState.getIn(['ui', 'siteInfo', 'isVisible']) && !isSourceAboutUrl(activeFrame.get('location'))
    const braveryPanelIsVisible = shieldState.braveShieldsEnabled(activeFrame) &&
      this.props.windowState.get('braveryPanelDetail')
    const clearBrowsingDataPanelIsVisible = this.props.windowState.getIn(['ui', 'isClearBrowsingDataPanelVisible'])
    const importBrowserDataPanelIsVisible = this.props.windowState.get('importBrowserDataDetail')
    const widevinePanelIsVisible = this.props.windowState.getIn(['widevinePanelDetail', 'shown']) && !isLinux()
    const autofillAddressPanelIsVisible = this.props.windowState.get('autofillAddressDetail')
    const autofillCreditCardPanelIsVisible = this.props.windowState.get('autofillCreditCardDetail')
    const noScriptIsVisible = this.props.windowState.getIn(['ui', 'noScriptInfo', 'isVisible']) &&
      siteUtil.getOrigin(activeFrame.get('location'))
    const releaseNotesIsVisible = this.props.windowState.getIn(['ui', 'releaseNotes', 'isVisible'])
    const checkDefaultBrowserDialogIsVisible =
      isFocused() && defaultBrowserState.shouldDisplayDialog(this.props.appState)
    const braverySettings = siteSettings.activeSettings(activeSiteSettings, this.props.appState, appConfig)
    const loginRequiredDetail = activeFrame ? basicAuthState.getLoginRequiredDetail(this.props.appState, activeFrame.get('tabId')) : null
    const customTitlebar = this.customTitlebar
    const contextMenuDetail = this.props.windowState.get('contextMenuDetail')
    const shouldAllowWindowDrag = windowState.shouldAllowWindowDrag(this.props.appState, this.props.windowState, activeFrame, isFocused())
    const activeOrigin = activeFrame ? siteUtil.getOrigin(activeFrame.get('location')) : null
    const notificationBarIsVisible = activeOrigin && this.props.appState.get('notifications').filter((item) =>
      item.get('frameOrigin') ? activeOrigin === item.get('frameOrigin') : true).size > 0

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
        ? <ContextMenu />
        : null
      }
      {
        this.props.windowState.get('popupWindowDetail')
        ? <PopupWindow />
        : null
      }
      <div className='top'>
        <Navigator />
        {
          siteInfoIsVisible
          ? <SiteInfo />
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
          ? <ImportBrowserDataPanel />
          : null
        }
        {
          widevinePanelIsVisible
          ? <WidevinePanel />
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
          ? <AddEditBookmarkHanger isModal />
          : null
        }
        {
          noScriptIsVisible
            ? <NoScriptInfo />
            : null
        }
        {
          releaseNotesIsVisible
          ? <ReleaseNotes />
          : null
        }
        {
          checkDefaultBrowserDialogIsVisible
            ? <CheckDefaultBrowserDialog />
            : null
        }

        <UpdateBar updates={this.props.appState.get('updates')} />
        {
          showBookmarksToolbar
          ? <BookmarksToolbar
            draggingOverData={this.props.appState.getIn(['dragData', 'dragOverData', 'draggingOverType']) === dragTypes.BOOKMARK && this.props.appState.getIn(['dragData', 'dragOverData'])}
            showFavicon={showFavicon}
            showOnlyFavicon={showOnlyFavicon}
            shouldAllowWindowDrag={shouldAllowWindowDrag && !isWindows()}
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
            ? <TabPages />
            : null
          }
        </div>
        <TabsToolbar key='tab-bar' />
        {
          notificationBarIsVisible
          ? <NotificationBar />
          : null
        }
        {
          activeFrame && activeFrame.get('findbarShown') && !activeFrame.get('isFullScreen')
          ? <FindBar />
          : null
        }
      </div>
      <div className='mainContainer'>
        <div className='tabContainer'
          ref={(node) => { this.tabContainer = node }}>
          {
            sortedFrames.map((frame) =>
              <Frame
                frameKey={frame.get('key')}
                key={frame.get('key')}
              />)
          }
        </div>
      </div>
      {
        this.props.windowState.getIn(['ui', 'downloadsToolbar', 'isVisible']) && this.props.appState.get('downloads') && this.props.appState.get('downloads').size > 0
        ? <DownloadsBar />
        : null
      }
    </div>
  }
}

module.exports = Main
