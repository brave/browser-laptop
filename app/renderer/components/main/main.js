/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const ReduxComponent = require('../reduxComponent')
const Immutable = require('immutable')
const electron = require('electron')
const urlResolve = require('url').resolve
const ipc = electron.ipcRenderer

// Actions
const appActions = require('../../../../js/actions/appActions')
const windowActions = require('../../../../js/actions/windowActions')
const webviewActions = require('../../../../js/actions/webviewActions')
const contextMenus = require('../../../../js/contextMenus')
const {getSetting} = require('../../../../js/settings')

// Components
const Navigator = require('../navigation/navigator')
const GuestInstanceRenderer = require('../frame/guestInstanceRenderer')
const TabPages = require('../tabs/tabPages')
const TabsToolbar = require('../tabs/tabsToolbar')
const FindBar = require('./findbar')
const UpdateBar = require('./updateBar')
const {NotificationBar, BraveNotificationBar} = require('./notificationBar')
const DownloadsBar = require('../download/downloadsBar')
const SiteInfo = require('./siteInfo')
const BraveryPanel = require('./braveryPanel')
const ClearBrowsingDataPanel = require('./clearBrowsingDataPanel')
const ImportBrowserDataPanel = require('./importBrowserDataPanel')
const WidevinePanel = require('./widevinePanel')
const AutofillAddressPanel = require('../autofill/autofillAddressPanel')
const AutofillCreditCardPanel = require('../autofill/autofillCreditCardPanel')
const AddEditBookmarkHanger = require('../bookmarks/addEditBookmarkHanger')
const AddEditBookmarkFolder = require('../bookmarks/addEditBookmarkFolder')
const LoginRequired = require('./loginRequired')
const ReleaseNotes = require('./releaseNotes')
const BookmarksToolbar = require('../bookmarks/bookmarksToolbar')
const ContextMenu = require('../common/contextMenu/contextMenu')
const PopupWindow = require('./popupWindow')
const NoScriptInfo = require('./noScriptInfo')
const CheckDefaultBrowserDialog = require('./checkDefaultBrowserDialog')
const HrefPreview = require('../frame/hrefPreview')
const MessageBox = require('../common/messageBox')
const FullScreenWarning = require('../frame/fullScreenWarning')

// Constants
const appConfig = require('../../../../js/constants/appConfig')
const messages = require('../../../../js/constants/messages')
const settings = require('../../../../js/constants/settings')
const keyCodes = require('../../../common/constants/keyCodes')
const keyLocations = require('../../../common/constants/keyLocations')

// State handling
const basicAuthState = require('../../../common/state/basicAuthState')
const frameStateUtil = require('../../../../js/state/frameStateUtil')
const searchProviders = require('../../../../js/data/searchProviders')
const defaultBrowserState = require('../../../common/state/defaultBrowserState')
const shieldState = require('../../../common/state/shieldState')
const menuBarState = require('../../../common/state/menuBarState')
const windowState = require('../../../common/state/windowState')
const updateState = require('../../../common/state/updateState')
const tabState = require('../../../common/state/tabState')
const tabMessageBoxState = require('../../../common/state/tabMessageBoxState')

// Util
const _ = require('underscore')
const cx = require('../../../../js/lib/classSet')
const eventUtil = require('../../../../js/lib/eventUtil')
const {isSourceAboutUrl} = require('../../../../js/lib/appUrlUtil')
const {getCurrentWindowId, isMaximized, isFocused, isFullScreen} = require('../../currentWindow')
const platformUtil = require('../../../common/lib/platformUtil')
const urlUtil = require('../../../../js/lib/urlutil')
const {hasBraveDragData} = require('../../../../js/dndData')
const isDarwin = platformUtil.isDarwin()
const isWindows = platformUtil.isWindows()
const isLinux = platformUtil.isLinux()

const {StyleSheet, css} = require('aphrodite/no-important')
const globalStyles = require('../styles/global')

class Main extends React.Component {
  constructor (props) {
    super(props)
    this.onMouseDown = this.onMouseDown.bind(this)
    this.onClickWindow = this.onClickWindow.bind(this)
    this.onHideSiteInfo = this.onHideSiteInfo.bind(this)
    this.onTabContextMenu = this.onTabContextMenu.bind(this)
    this.resetAltMenuProcessing()
  }
  registerWindowLevelShortcuts () {
    // For window level shortcuts that don't work as local shortcuts
    document.addEventListener('keydown', (e) => {
      // TODO: This Alt+F4 check should not be needed but something
      // is going on in muon causing it to not work when there's a webview.
      if (e.key === 'F4' && e.altKey && isWindows) {
        appActions.closeWindow(getCurrentWindowId())
        return
      }
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
    }, { passive: true })
  }

  resetAltMenuProcessing () {
    this.lastKeyPressed = undefined
    this.keydown = {}
    this.keydownHistory = []
  }

  registerCustomTitleBarHandlers () {
    if (this.props.showCustomTitleBar) {
      document.addEventListener('keyup', (e) => {
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
              if (this.props.menubarSelectedIndex) {
                windowActions.setMenuBarSelectedIndex()
                windowActions.setContextMenuDetail()
              } else {
                windowActions.setMenuBarSelectedIndex(0)
              }
            }
            break
          case keyCodes.ESC:
            if (getSetting(settings.AUTO_HIDE_MENU) && this.props.menubarVisible && !this.props.menubarSelectedIndex) {
              e.preventDefault()
              windowActions.toggleMenubarVisible(false)
              break
            }
            if (this.props.menubarSelectedIndex) {
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

      document.addEventListener('focus', () => {
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
    if (this.props.isFullScreen) {
      appActions.tabSetFullScreen(this.props.tabId, false)
    }
  }

  registerSwipeListener () {
    // Navigates back/forward on macOS two- and or three-finger swipe
    let trackingFingers = false
    let startTime = 0
    let isSwipeOnLeftEdge = false
    let isSwipeOnRightEdge = false
    let deltaX = 0
    let deltaY = 0
    let time

    // isSwipeTrackingFromScrollEventsEnabled is only true if "two finger scroll to swipe" is enabled
    ipc.on('scroll-touch-begin', () => {
      if (this.props.mouseInFrame) {
        trackingFingers = true
        startTime = (new Date()).getTime()
      }
    })

    this.mainWindow.addEventListener('wheel', (e) => {
      if (trackingFingers) {
        deltaX = deltaX + e.deltaX
        deltaY = deltaY + e.deltaY
        const distanceThresholdX = getSetting(settings.SWIPE_NAV_DISTANCE)
        const percent = Math.abs(deltaX) / distanceThresholdX
        if (isSwipeOnRightEdge) {
          if (percent > 1) {
            appActions.swipedRight(1)
          } else {
            appActions.swipedRight(percent)
          }
        } else if (isSwipeOnLeftEdge) {
          if (percent > 1) {
            appActions.swipedLeft(1)
          } else {
            appActions.swipedLeft(percent)
          }
        }
        time = (new Date()).getTime() - startTime
      }
    }, { passive: true })

    ipc.on('scroll-touch-end', () => {
      const distanceThresholdX = getSetting(settings.SWIPE_NAV_DISTANCE)
      const distanceThresholdY = 101
      const timeThreshold = 80
      if (trackingFingers && time > timeThreshold && Math.abs(deltaY) < distanceThresholdY) {
        if (deltaX > distanceThresholdX && isSwipeOnRightEdge) {
          ipc.emit(messages.SHORTCUT_ACTIVE_FRAME_FORWARD)
        } else if (deltaX < -distanceThresholdX && isSwipeOnLeftEdge) {
          ipc.emit(messages.SHORTCUT_ACTIVE_FRAME_BACK)
        }
      }
      appActions.swipedLeft(0)
      appActions.swipedRight(0)
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
      if (this.props.mouseInFrame) {
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
            privateSearchURL: entry.privateSearch,
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
    if (!this.props.isWidevineReady && nextProps.isWidevineReady) {
      // User may have enabled from preferences and no details are present
      if (!this.props.widevineLocation) {
        return
      }

      // This automatically handles reloading the frame as well
      appActions.changeSiteSetting(
        this.props.widevineLocation,
        appConfig.resourceNames.WIDEVINE,
        this.props.widevineRememberSettings
      )
    }
  }

  componentDidUpdate (prevProps) {
    this.loadSearchProviders()
    if (prevProps.title !== this.props.title) {
      windowActions.shouldSetTitle(getCurrentWindowId(), this.props.title)
    }

    // If the tab changes or was closed, exit out of full screen to give a better
    // picture of what's happening.
    if (prevProps.tabId !== this.props.tabId && this.props.isFullScreen) {
      appActions.tabSetFullScreen(this.props.tabId, false)
    }
  }

  componentDidMount () {
    this.registerSwipeListener()
    this.registerWindowLevelShortcuts()
    this.registerCustomTitleBarHandlers()

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
      if (this.props.braveShieldEnabled) {
        windowActions.setBraveryPanelDetail({})
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

    ipc.on(messages.SHORTCUT_CLOSE_FRAME, (e, tabId) => {
      if (tabId == null) {
        tabId = this.props.tabId
      }

      if (tabId) {
        appActions.tabCloseRequested(tabId)
      }
    })

    ipc.on(messages.SHORTCUT_UNDO_CLOSED_FRAME, () => windowActions.undoClosedFrame())

    ipc.on(messages.SHOW_DOWNLOADS_TOOLBAR, () => {
      windowActions.setDownloadsToolbarVisible(true)
    })

    ipc.on(messages.HIDE_DOWNLOADS_TOOLBAR, () => {
      windowActions.setDownloadsToolbarVisible(false)
    })

    ipc.on(messages.BLOCKED_RESOURCE, (e, blockType, details) => {
      windowActions.setBlockedBy(details.tabId, blockType, details.url)
    })

    ipc.on(messages.HTTPSE_RULE_APPLIED, (e, ruleset, details) => {
      windowActions.setRedirectedBy(details.tabId, ruleset, details.url)
    })

    ipc.on(messages.SET_SECURITY_STATE, (e, tabId, securityState) => {
      windowActions.setSecurityState(tabId, securityState)
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

    window.addEventListener('focus', () => {
      windowActions.setFocusedFrame(this.props.location, this.props.tabId)
      // For whatever reason other elements are preserved but webviews are not.
      if (document.activeElement && document.activeElement.tagName === 'BODY') {
        webviewActions.setWebviewFocused()
      }
    }, { passive: true })

    // disable dnd by default
    window.addEventListener('dragover', function (event) {
      // allow webviews to handle dnd as long as the dragged object isn't from
      // Brave itself
      if (event.target.tagName === 'WEBVIEW' &&
        !hasBraveDragData(event.dataTransfer)) {
        return true
      }
      event.dataTransfer.dropEffect = 'none'
      event.preventDefault()
      return false
    }, true)

    window.addEventListener('drop', function (event) {
      // allow webviews to handle dnd as long as the dragged object isn't from
      // Brave itself
      if (event.target.tagName === 'WEBVIEW' &&
        !hasBraveDragData(event.dataTransfer)) {
        return true
      }
      event.preventDefault()
      return false
    }, true)

    if (this.props.title) {
      windowActions.shouldSetTitle(getCurrentWindowId(), this.props.title)
    }

    const self = this
    window.onblur = () => {
      self.resetAltMenuProcessing()
    }
  }

  onHideSiteInfo () {
    windowActions.setSiteInfoVisible(false)
  }

  onMouseDown (e) {
    let node = e.target
    const datasets = [
      'popupWindow',
      'contextMenu',
      'extensionButton',
      'menubarItem',
      'bookmarkHanger'
    ]
    while (node) {
      if (eventUtil.elementHasDataset(node, datasets)) {
        // Middle click (on context menu) needs to fire the click event.
        // We need to prevent the default "Auto-Scrolling" behavior.
        if (eventUtil.elementHasDataset(node, 'contextMenu') && e.button === 1) {
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
    contextMenus.onTabsToolbarContextMenu(this.props.title, this.props.location, undefined, undefined, e)
  }

  mergeProps (state, ownProps) {
    const currentWindow = state.get('currentWindow')
    const activeFrame = frameStateUtil.getActiveFrame(currentWindow) || Immutable.Map()
    const activeTabId = activeFrame.get('tabId', tabState.TAB_ID_NONE)
    const nonPinnedFrames = frameStateUtil.getNonPinnedFrames(currentWindow)
    const tabsPerPage = Number(getSetting(settings.TABS_PER_PAGE))
    const activeOrigin = !activeFrame.isEmpty() ? urlUtil.getOrigin(activeFrame.get('location')) : null
    const widevinePanelDetail = currentWindow.get('widevinePanelDetail', Immutable.Map())
    const loginRequiredDetails = basicAuthState.getLoginRequiredDetail(state, activeTabId)
    const focused = isFocused(state)
    const isTor = frameStateUtil.isTor(activeFrame)
    const torConnectionError = state.getIn(['tor', 'error'])

    const props = {}
    // used in renderer
    props.activeFrameKey = activeFrame.get('key')
    if (window.activeFrameKey !== props.activeFrameKey) {
      window.activeFrameKey = props.activeFrameKey
    }
    props.previewFrameKey = frameStateUtil.getPreviewFrameKey(currentWindow)
    props.isFullScreen = activeFrame.get('isFullScreen', false)
    props.showFullScreenWarning = activeFrame.get('showFullScreenWarning')
    props.isMaximized = isMaximized(state) || isFullScreen(state)
    props.captionButtonsVisible = isWindows
    props.showContextMenu = currentWindow.has('contextMenuDetail')
    props.showPopupWindow = currentWindow.has('popupWindowDetail')
    props.showSiteInfo = (currentWindow.getIn(['ui', 'siteInfo', 'isVisible']) &&
      !isSourceAboutUrl(activeFrame.get('location'))) ||
      (torConnectionError && isTor)
    props.showBravery = shieldState.braveShieldsEnabled(activeFrame) &&
      !!currentWindow.get('braveryPanelDetail')
    props.showClearData = currentWindow.getIn(['ui', 'isClearBrowsingDataPanelVisible'], false)
    props.showImportData = currentWindow.has('importBrowserDataDetail')
    props.showWidevine = currentWindow.getIn(['widevinePanelDetail', 'shown']) && !isLinux
    props.showAutoFillAddress = currentWindow.has('autofillAddressDetail')
    props.showAutoFillCC = currentWindow.has('autofillCreditCardDetail')
    props.showLogin = !!loginRequiredDetails
    props.showBookmarkHanger = currentWindow.has('bookmarkDetail') &&
      !currentWindow.getIn(['bookmarkDetail', 'isBookmarkHanger'])
    props.showBookmarkFolderDialog = currentWindow.has('bookmarkFolderDetail')
    props.showNoScript = currentWindow.getIn(['ui', 'noScriptInfo', 'isVisible']) &&
      urlUtil.getOrigin(activeFrame.get('location'))
    props.showReleaseNotes = currentWindow.getIn(['ui', 'releaseNotes', 'isVisible'])
    props.showCheckDefault = focused && defaultBrowserState.shouldDisplayDialog(state)
    props.showUpdate = updateState.isUpdateVisible(state)
    props.showBookmarksToolbar = getSetting(settings.SHOW_BOOKMARKS_TOOLBAR)
    props.shouldAllowWindowDrag = windowState.shouldAllowWindowDrag(state, currentWindow, activeFrame, focused)
    props.isSinglePage = nonPinnedFrames.size <= tabsPerPage
    props.showTabPages = nonPinnedFrames.size > tabsPerPage
    props.showNotificationBar = activeOrigin && state.get('notifications').filter((item) =>
        item.get('frameOrigin') ? activeOrigin === item.get('frameOrigin') : true).size > 0
    props.showFindBar = activeFrame.get('findbarShown') && !activeFrame.get('isFullScreen')
    props.showDownloadBar = currentWindow.getIn(['ui', 'downloadsToolbar', 'isVisible']) &&
      state.get('downloads') && state.get('downloads').size > 0
    props.title = activeFrame.get('title')
    props.location = activeFrame.get('location')
    props.loginRequiredUrl = loginRequiredDetails
      ? urlResolve(loginRequiredDetails.getIn(['request', 'url']), '/')
      : null
    props.showMessageBox = tabMessageBoxState.hasMessageBoxDetail(state, activeTabId)

    // used in other functions
    props.menubarSelectedIndex = currentWindow.getIn(['ui', 'menubar', 'selectedIndex'])
    props.showCustomTitleBar = isWindows
    props.menubarVisible = menuBarState.isMenuBarVisible(currentWindow)
    props.mouseInFrame = currentWindow.getIn(['ui', 'mouseInFrame'])
    props.braveShieldEnabled = shieldState.braveShieldsEnabled(activeFrame)
    props.tabId = activeTabId
    props.location = activeFrame.get('location')
    props.isWidevineReady = state.getIn([appConfig.resourceNames.WIDEVINE, 'ready'])
    props.widevineLocation = urlUtil.getOrigin(widevinePanelDetail.get('location'))
    props.widevineRememberSettings = widevinePanelDetail.get('alsoAddRememberSiteSetting') ? 1 : 0

    return props
  }

  render () {
    return <div id='window'
      className={cx({
        isFullScreen: this.props.isFullScreen,
        isMaximized: this.props.isMaximized,
        frameless: this.props.captionButtonsVisible
      })}
      ref={(node) => { this.mainWindow = node }}
      onMouseDown={this.onMouseDown}
      onClick={this.onClickWindow}>
      {
        this.props.showContextMenu
        ? <ContextMenu />
        : null
      }
      {
        this.props.showPopupWindow
        ? <PopupWindow />
        : null
      }
      <div className={
          cx({
            top: true,
            allowDragging: this.props.shouldAllowWindowDrag
          })
        }
        onMouseEnter={windowActions.setMouseInTitlebar.bind(null, true)}
        onMouseLeave={windowActions.setMouseInTitlebar.bind(null, false)}
        >
        <Navigator />
        {
          this.props.showSiteInfo
          ? <SiteInfo />
          : null
        }
        {
          this.props.showBravery
          ? <BraveryPanel />
          : null
        }
        {
         this.props.showClearData
          ? <ClearBrowsingDataPanel />
          : null
        }
        {
          this.props.showImportData
          ? <ImportBrowserDataPanel />
          : null
        }
        {
          this.props.showWidevine
          ? <WidevinePanel />
          : null
        }
        {
         this.props.showAutoFillAddress
          ? <AutofillAddressPanel />
          : null
        }
        {
         this.props.showAutoFillCC
          ? <AutofillCreditCardPanel />
          : null
        }
        {
          this.props.showLogin
            ? <LoginRequired
              loginRequiredUrl={this.props.loginRequiredUrl}
              tabId={this.props.tabId}
            />
            : null
        }
        {
          this.props.showBookmarkHanger
          ? <AddEditBookmarkHanger isModal />
          : null
        }
        {
          this.props.showBookmarkFolderDialog
            ? <AddEditBookmarkFolder />
            : null
        }
        {
          this.props.showNoScript
            ? <NoScriptInfo />
            : null
        }
        {
          this.props.showReleaseNotes
          ? <ReleaseNotes />
          : null
        }
        {
          this.props.showCheckDefault
            ? <CheckDefaultBrowserDialog />
            : null
        }
        {
          <BraveNotificationBar />
        }
        {
          this.props.showUpdate
          ? <UpdateBar />
          : null
        }
        {
          this.props.showBookmarksToolbar
          ? <BookmarksToolbar />
          : null
        }
        {
          this.props.isSinglePage
          ? null
          : <div className={css(
            styles.tabPagesWrap,
            this.props.shouldAllowWindowDrag && styles.tabPagesWrap_allowDragging
          )}
            onContextMenu={this.onTabContextMenu}>
            {
              this.props.showTabPages
              ? <TabPages />
              : null
            }
          </div>
        }
        <TabsToolbar key='tab-bar' />
        {
          this.props.showNotificationBar
          ? <NotificationBar />
          : null
        }
        {
          this.props.showFindBar
          ? <FindBar />
          : null
        }
      </div>
      <div className={cx({
        mainContainer: true,
        hasFramePreview: this.props.previewFrameKey != null
      })}>
        {
          this.props.isFullScreen && this.props.showFullScreenWarning
          ? <FullScreenWarning location={this.props.location} />
          : null
        }
        <GuestInstanceRenderer isPreview={!!this.props.previewFrameKey} frameKey={this.props.previewFrameKey != null ? this.props.previewFrameKey : this.props.activeFrameKey} />
        <HrefPreview frameKey={this.props.activeFrameKey} />
        {
          this.props.showMessageBox
          ? <MessageBox
            tabId={this.props.tabId} />
          : null
        }
      </div>
      {
        this.props.showDownloadBar
        ? <DownloadsBar />
        : null
      }
    </div>
  }
}

const styles = StyleSheet.create({
  tabPagesWrap: {
    background: 'none',
    display: 'flex',
    justifyContent: 'center',
    height: globalStyles.spacing.tabPagesHeight,
    margin: `${globalStyles.spacing.navbarMenubarMargin} 0 ${globalStyles.spacing.navbarMenubarMargin} 0`,
    position: 'relative',
    zIndex: globalStyles.zindex.zindexTabs
  },

  tabPagesWrap_allowDragging: {
    WebkitAppRegion: 'drag'
  }
})

module.exports = ReduxComponent.connect(Main)
