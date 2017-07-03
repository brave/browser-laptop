/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const electron = require('electron')
const ipc = electron.ipcRenderer
const Immutable = require('immutable')

// Actions
const appActions = require('../../../../js/actions/appActions')
const windowActions = require('../../../../js/actions/windowActions')

// Components
const ReduxComponent = require('../reduxComponent')
const NavigationBar = require('./navigationBar')
const NavigationBarButtonContainer = require('./buttons/navigationBarButtonContainer')
const LongPressButton = require('../common/longPressButton')
const MenuBar = require('./menuBar')
const WindowCaptionButtons = require('./windowCaptionButtons')
const BrowserButton = require('../common/button')
const BrowserAction = require('./browserAction')

// State
const tabState = require('../../../common/state/tabState')
const extensionState = require('../../../common/state/extensionState')
const siteSettingsState = require('../../../common/state/siteSettingsState')
const menuBarState = require('../../../common/state/menuBarState')
const windowState = require('../../../common/state/windowState')

// Util
const {getCurrentWindowId, isMaximized, isFullScreen, isFocused} = require('../../currentWindow')
const {isWindows, isDarwin} = require('../../../common/lib/platformUtil')
const {braveShieldsEnabled} = require('../../../common/state/shieldState')
const eventUtil = require('../../../../js/lib/eventUtil')
const {isNavigatableAboutPage, getBaseUrl} = require('./../../../../js/lib/appUrlUtil')
const frameStateUtil = require('../../../../js/state/frameStateUtil')
const siteSettings = require('../../../../js/state/siteSettings')
const cx = require('../../../../js/lib/classSet')
const {getSetting} = require('../../../../js/settings')

// Constants
const messages = require('../../../../js/constants/messages')
const appConfig = require('../../../../js/constants/appConfig')
const settings = require('../../../../js/constants/settings')

// Styles
const {StyleSheet, css} = require('aphrodite/no-important')
const globalStyles = require('../styles/global')

const backButton = require('../../../../img/toolbar/back_btn.svg')
const forwardButton = require('../../../../img/toolbar/forward_btn.svg')
const braveButton1x = require('../../../../app/extensions/brave/img/braveBtn.png')
const braveButton2x = require('../../../../app/extensions/brave/img/braveBtn2x.png')
const braveButton3x = require('../../../../app/extensions/brave/img/braveBtn3x.png')
const braveButtonHover1x = require('../../../../app/extensions/brave/img/braveBtn_hover.png')
const braveButtonHover2x = require('../../../../app/extensions/brave/img/braveBtn2x_hover.png')
const braveButtonHover3x = require('../../../../app/extensions/brave/img/braveBtn3x_hover.png')

class Navigator extends React.Component {
  constructor (props) {
    super(props)
    this.onBack = this.onBack.bind(this)
    this.onForward = this.onForward.bind(this)
    this.onBackLongPress = this.onBackLongPress.bind(this)
    this.onForwardLongPress = this.onForwardLongPress.bind(this)
    this.onDoubleClick = this.onDoubleClick.bind(this)
    this.onDragOver = this.onDragOver.bind(this)
    this.onDrop = this.onDrop.bind(this)
    this.onBraveMenu = this.onBraveMenu.bind(this)
  }

  onNav (e, navCheckProp, navType, navAction) {
    if (e && eventUtil.isForSecondaryAction(e) && this.props.isNavigable) {
      if (this.props[navCheckProp]) {
        appActions.tabCloned(this.props.activeTabId, {
          [navType]: true,
          active: !!e.shiftKey
        })
      }
    } else {
      navAction.call(this, this.props.activeTabId)
    }
  }

  onBack (e) {
    this.onNav(e, 'canGoBack', 'back', appActions.onGoBack)
  }

  onForward (e) {
    this.onNav(e, 'canGoForward', 'forward', appActions.onGoForward)
  }

  onBackLongPress (target) {
    const rect = target.parentNode.getBoundingClientRect()
    appActions.onGoBackLong(this.props.activeTabId, {
      left: rect.left,
      bottom: rect.bottom
    })
  }

  onForwardLongPress (target) {
    const rect = target.parentNode.getBoundingClientRect()
    appActions.onGoForwardLong(this.props.activeTabId, {
      left: rect.left,
      bottom: rect.bottom
    })
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
      Array.from(e.dataTransfer.items).forEach((item) => {
        if (item.kind === 'string') {
          appActions.createTabRequested({ url: item.type })
        }
      })
    } else if (e.dataTransfer.getData('text/plain')) {
      if (this.props.activeTabId) {
        appActions.loadURLRequested(this.props.activeTabId, e.dataTransfer.getData('text/plain'))
      }
    }
  }

  onBraveMenu () {
    if (this.props.shieldsEnabled) {
      windowActions.setBraveryPanelDetail({})
    }
  }

  onDoubleClick (e) {
    if (!e.target.className.includes('navigationBarWrapper')) {
      return
    }
    return !isMaximized() ? windowActions.shouldMaximize(getCurrentWindowId()) : windowActions.shouldMinimize(getCurrentWindowId())
  }

  componentDidMount () {
    ipc.on(messages.SHORTCUT_ACTIVE_FRAME_BACK, this.onBack)
    ipc.on(messages.SHORTCUT_ACTIVE_FRAME_FORWARD, this.onForward)
  }

  componentWillUnmount () {
    ipc.off(messages.SHORTCUT_ACTIVE_FRAME_BACK, this.onBack)
    ipc.off(messages.SHORTCUT_ACTIVE_FRAME_FORWARD, this.onForward)
  }

  // BEM Level: navigator__menuBarAndNavigationBar__navigationBarWrapper
  get navigationBarWrapper () {
    return <div className={cx({
      navigationBarWrapper: true,
      [css(styles.navigationBarWrapper)]: true
    })}
      onDoubleClick={this.onDoubleClick}
      onDragOver={this.onDragOver}
      onDrop={this.onDrop}
    >
      {this.topLevelStartButtons}
      <NavigationBar />
      {this.topLevelEndButtons}
    </div>
  }

  // BEM Level: navigator__menuBarAndNavigationBar__navigationBarWrapper__topLevelStartButtons
  get topLevelStartButtons () {
    return <div className={cx({
      topLevelStartButtons: true,
      [css(styles.topLevelStartButtons, this.props.isWindows && styles.topLevelStartButtons_isWindows, this.props.isDarwin && styles.topLevelStartButtons_isDarwin, (this.props.isDarwin && this.props.isFullScreen) && styles.topLevelStartButtons_isDarwin_isFullScreen)]: true,
      fullscreen: isFullScreen()
    })}>
      {this.backButton}
      {this.forwardButton}
    </div>
  }

  // BEM Level: navigator__menuBarAndNavigationBar__navigationBarWrapper__topLevelStartButtons__topLevelStartButtonContainer
  get backButton () {
    return <NavigationBarButtonContainer isStandalone
      containerFor={[
        styles.topLevelStartButtonContainer,
        !this.props.canGoBack && styles.topLevelStartButtonContainer_disabled
      ]}

      // TODO (Suguru): Convert with Aphrodite
      style={{
        transform: this.props.canGoBack ? `scale(${this.props.swipeLeftPercent})` : `scale(1)`,
        opacity: `${this.props.swipeLeftOpacity}`
      }}

      testId={!this.props.canGoBack
        ? 'navigationBackButtonDisabled'
        : 'navigationBackButton'
      }>
      <LongPressButton className={cx({
        normalizeButton: true,
        [css(styles.topLevelStartButtonContainer__topLevelStartButton_backButton)]: true,
        [css(styles.topLevelStartButtonContainer__topLevelStartButton_disabled)]: !this.props.canGoBack,
        [css(styles.topLevelStartButtonContainer__topLevelStartButton_enabled)]: this.props.canGoBack
      })}
        l10nId='backButton'
        testId={!this.props.canGoBack ? 'backButtonDisabled' : 'backButton'}
        disabled={!this.props.canGoBack}
        onClick={this.onBack}
        onLongPress={this.onBackLongPress}
      />
    </NavigationBarButtonContainer>
  }

  // BEM Level: navigator__menuBarAndNavigationBar__navigationBarWrapper__topLevelStartButtons__topLevelStartButtonContainer
  get forwardButton () {
    return <NavigationBarButtonContainer isStandalone
      containerFor={[
        styles.topLevelStartButtonContainer,
        !this.props.canGoForward && styles.topLevelStartButtonContainer_disabled
      ]}

      // TODO (Suguru): Convert with Aphrodite
      style={{
        transform: this.props.canGoForward ? `scale(${this.props.swipeRightPercent})` : `scale(1)`,
        opacity: `${this.props.swipeRightOpacity}`
      }}

      testId={!this.props.canGoForward
        ? 'navigationForwardButtonDisabled'
        : 'navigationForwardButton'
      }>
      <LongPressButton className={cx({
        normalizeButton: true,
        [css(styles.topLevelStartButtonContainer__topLevelStartButton_forwardButton)]: true,
        [css(styles.topLevelStartButtonContainer__topLevelStartButton_disabled)]: !this.props.canGoForward,
        [css(styles.topLevelStartButtonContainer__topLevelStartButton_enabled)]: this.props.canGoForward
      })}
        l10nId='forwardButton'
        testId={!this.props.canGoForward ? 'forwardButtonDisabled' : 'forwardButton'}
        disabled={!this.props.canGoForward}
        onClick={this.onForward}
        onLongPress={this.onForwardLongPress}
      />
    </NavigationBarButtonContainer>
  }

  // BEM Level: navigator__menuBarAndNavigationBar__navigationBarWrapper__topLevelEndButtons
  get topLevelEndButtons () {
    return <div className={cx({
      topLevelEndButtons: true,
      [css(styles.topLevelEndButtons, this.props.isWideURLbarEnabled && styles.topLevelEndButtons_isWideURLbarEnabled)]: true
    })}>
      <div className={cx({
        extraDragArea: !this.props.menuBarVisible,
        allowDragging: this.props.shouldAllowWindowDrag,
        [css(styles.topLevelEndButtons__extraDragArea_disabled)]: this.props.isWideURLbarEnabled
      })} />
      {
        this.props.showBrowserActions
          ? this.extensionButtons
          : null
      }
      {this.braveMenuButton}
      {
        this.props.isCounterEnabled
          ? this.counterBraveMenu
          : null
      }
      {
        this.props.isCaptionButton
          ? <span className={css(styles.topLevelEndButtons__buttonSeparator)} />
          : null
      }
    </div>
  }

  get extensionButtons () {
    let buttons = this.props.extensionBrowserActions.map((id) => <BrowserAction extensionId={id} />).values()
    buttons = Array.from(buttons)
    buttons.push(<span className={css(styles.topLevelEndButtons__buttonSeparator)} />)

    return buttons
  }

  // BEM Level: navigator__menuBarAndNavigationBar__navigationBarWrapper__topLevelEndButtons__braveMenuButton
  get braveMenuButton () {
    return <BrowserButton className={css(
      styles.braveMenuButton,
      !this.props.shieldsEnabled && styles.braveMenuButton_shieldsDisabled,
      this.props.shieldsDown && styles.braveMenuButton_shieldsDown,
      this.props.isCaptionButton && styles.braveMenuButton_leftOfCaptionButton
    )}
      l10nId='braveMenu'
      testId={!this.props.shieldsEnabled ? 'braveMenuDisabled' : 'braveMenu'}
      test2Id={`shield-down-${this.props.shieldsDown}`}
      disabled={this.props.activeTabShowingMessageBox}
      onClick={this.onBraveMenu}
    />
  }

  // BEM Level: navigator__menuBarAndNavigationBar__navigationBarWrapper__topLevelEndButtons__counter_braveMenu
  get counterBraveMenu () {
    return <div data-test-id='counterBraveMenu'
      className={css(
        styles.counterBraveMenu,
        (this.props.menuBarVisible || !isWindows()) && styles.counterBraveMenu_right,

        // delay badge show-up.
        // this is also set for extension badge
        // in a way that both can appear at the same time.
        styles.counterBraveMenu_subtleShowUp
      )}>
      {this.props.totalBlocks}
    </div>
  }

  mergeProps (state, ownProps) {
    const currentWindow = state.get('currentWindow')
    const swipeLeftPercent = state.get('swipeLeftPercent')
    const swipeRightPercent = state.get('swipeRightPercent')
    const activeFrame = frameStateUtil.getActiveFrame(currentWindow) || Immutable.Map()
    const activeFrameKey = activeFrame.get('key')
    const activeTabId = activeFrame.get('tabId') || tabState.TAB_ID_NONE
    const activeTab = tabState.getByTabId(state, activeTabId)
    const activeTabShowingMessageBox = !!(activeTab && tabState.isShowingMessageBox(state, activeTabId))
    const allSiteSettings = siteSettingsState.getAllSiteSettings(state, activeFrame)
    const activeSiteSettings = siteSettings.getSiteSettingsForURL(allSiteSettings, activeFrame.get('location'))
    const braverySettings = siteSettings.activeSettings(activeSiteSettings, state, appConfig)
    const enabledExtensions = extensionState.getEnabledExtensions(state)
    const extensionBrowserActions = enabledExtensions
      .map((extension) => {
        const browserAction = extensionState.getBrowserActionByTabId(state, extension.get('id'), activeTabId)
        return browserAction ? extension.get('id') : false
      })
      .filter((browserAction) => browserAction)
      .toList()

    const props = {}
    // used in renderer
    props.canGoBack = activeTab && activeTab.get('canGoBack') && !activeTabShowingMessageBox
    props.canGoForward = activeTab && activeTab.get('canGoForward') && !activeTabShowingMessageBox
    props.totalBlocks = activeFrame ? frameStateUtil.getTotalBlocks(activeFrame) : false
    props.shieldsDown = !braverySettings.shieldsUp
    props.shieldsEnabled = braveShieldsEnabled(activeFrame)
    props.menuBarVisible = menuBarState.isMenuBarVisible(currentWindow)
    props.isMaximized = isMaximized() || isFullScreen()
    props.isFullScreen = isFullScreen()
    props.isWindows = isWindows()
    props.isDarwin = isDarwin()
    props.isCaptionButton = isWindows() && !props.menuBarVisible
    props.activeTabShowingMessageBox = activeTabShowingMessageBox
    props.extensionBrowserActions = extensionBrowserActions
    props.showBrowserActions = !activeTabShowingMessageBox &&
      extensionBrowserActions &&
      extensionBrowserActions.size > 0
    props.shouldAllowWindowDrag = windowState.shouldAllowWindowDrag(state, currentWindow, activeFrame, isFocused())
    props.isCounterEnabled = getSetting(settings.BLOCKED_COUNT_BADGE) &&
      props.totalBlocks &&
      props.shieldsEnabled
    props.isWideURLbarEnabled = getSetting(settings.WIDE_URL_BAR)
    props.showNavigationBar = activeFrameKey !== undefined &&
      state.get('siteSettings') !== undefined
    props.swipeLeftPercent = swipeLeftPercent ? (swipeLeftPercent + 1) * 1.2 : 1
    props.swipeRightPercent = swipeRightPercent ? (swipeRightPercent + 1) * 1.2 : 1
    // 0.85 is the default button opacity in less/navigationBar.less
    // Remove this magic number once we migrate to Aphrodite
    props.swipeLeftOpacity = 0.85 - (swipeLeftPercent > 0.65 ? 0.65 : swipeLeftPercent)
    props.swipeRightOpacity = 0.85 - (swipeRightPercent > 0.65 ? 0.65 : swipeRightPercent)
    if (swipeLeftPercent === 1) {
      props.swipeLeftOpacity = 0.85
    }
    if (swipeRightPercent === 1) {
      props.swipeRightOpacity = 0.85
    }

    // used in other functions
    props.isNavigable = activeFrame && isNavigatableAboutPage(getBaseUrl(activeFrame.get('location')))
    props.activeTabId = activeTabId

    return props
  }

  render () {
    return <div className={cx({
      navigator: true,
      allowDragging: this.props.shouldAllowWindowDrag
    })}>
      <div className={css(styles.navigator__menuBarAndNavigationBar)}>
        {
          this.props.menuBarVisible
            ? <div className='menubarContainer'>
              <MenuBar />
              <WindowCaptionButtons windowMaximized={this.props.isMaximized} />
            </div>
            : null
        }
        {this.navigationBarWrapper}
      </div>
      {
        this.props.isCaptionButton
          ? <WindowCaptionButtons windowMaximized={this.props.isMaximized} verticallyCenter='true' />
          : null
      }
    </div>
  }
}

const styles = StyleSheet.create({
  navigator__menuBarAndNavigationBar: {
    display: 'flex',
    flex: 1,
    flexDirection: 'column',
    boxSizing: 'border-box',
    position: 'relative',
    overflow: 'visible',
    whiteSpace: 'nowrap'
  },

  navigationBarWrapper: {
    boxSizing: 'border-box',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: globalStyles.spacing.navbarMenubarMargin
  },

  topLevelStartButtons: {
    display: 'flex',
    zIndex: globalStyles.zindex.zindexNavigationBar
  },

  topLevelStartButtons_isWindows: {
    paddingLeft: '5px'
  },

  topLevelStartButtons_isDarwin: {
    paddingLeft: globalStyles.spacing.navbarLeftMarginDarwin
  },

  topLevelStartButtons_isDarwin_isFullScreen: {
    paddingLeft: '4px'
  },

  // cf: navigationBar__navigationButtonContainer on navitionBar.js
  topLevelStartButtonContainer: {
    width: '34px'
  },

  topLevelStartButtonContainer_disabled: {
    ':hover': {
      background: 'transparent',
      boxShadow: 'none'
    }
  },

  topLevelStartButtonContainer__topLevelStartButton_backButton: {
    background: `url(${backButton}) center no-repeat`,
    backgroundSize: '14px 14px',

    // ref: https://github.com/brave/browser-laptop/blob/48e9b4e792612b5fc17d7202bc7f2b5e8fbcfc2b/less/navigationBar.less#L467-L472
    width: '100%',
    height: '100%',
    margin: 0
  },

  topLevelStartButtonContainer__topLevelStartButton_forwardButton: {
    background: `url(${forwardButton}) center no-repeat`,
    backgroundSize: '14px 14px',

    // ref: https://github.com/brave/browser-laptop/blob/48e9b4e792612b5fc17d7202bc7f2b5e8fbcfc2b/less/navigationBar.less#L467-L472
    width: '100%',
    height: '100%',
    margin: 0
  },

  topLevelStartButtonContainer__topLevelStartButton_disabled: {
    opacity: 0.2
  },

  topLevelStartButtonContainer__topLevelStartButton_enabled: {
    opacity: 0.85,
    WebkitAppRegion: 'no-drag'
  },

  topLevelEndButtons: {
    display: 'flex',
    flexDirection: 'row',
    position: 'relative'
  },

  topLevelEndButtons_isWideURLbarEnabled: {
    marginLeft: '6px'
  },

  // TODO (Suguru): Refactor navigationBar.less to remove !important
  topLevelEndButtons__extraDragArea_disabled: {
    display: 'none !important'
  },

  topLevelEndButtons__buttonSeparator: {
    width: '1px',
    borderLeft: '1px solid #e2e2e2',
    margin: '4px 3px 4px 3px'
  },

  braveMenuButton: {
    backgroundImage: `-webkit-image-set(url(${braveButton1x}) 1x, url(${braveButton2x}) 2x, url(${braveButton3x}) 3x)`,
    backgroundRepeat: 'no-repeat',
    height: globalStyles.navigationBar.urlbarForm.height,
    width: globalStyles.spacing.navbarBraveButtonWidth,
    marginRight: globalStyles.spacing.navbarButtonSpacing,
    userSelect: 'none',
    position: 'relative',
    WebkitAppRegion: 'no-drag',

    ':hover': {
      backgroundImage: `-webkit-image-set(url(${braveButtonHover1x}) 1x, url(${braveButtonHover2x}) 2x, url(${braveButtonHover3x}) 3x)`
    }
  },

  braveMenuButton_shieldsDisabled: {
    filter: 'grayscale(100%)',
    opacity: 0.4
  },

  braveMenuButton_shieldsDown: {
    filter: 'grayscale(100%)'
  },

  braveMenuButton_leftOfCaptionButton: {
    marginRight: '3px'
  },

  counterBraveMenu: {
    position: 'absolute',
    left: 'calc(50% - 1px)',
    top: '14px',
    color: '#fff',
    font: '6pt "Arial Narrow"',
    textAlign: 'center',
    padding: '1px 2px',
    border: '0px solid #fff',
    borderRadius: '2.5px',
    background: '#555',
    minWidth: '10px',
    pointerEvents: 'none',
    WebkitUserSelect: 'none'
  },

  counterBraveMenu_right: {
    left: 'auto',
    right: '2px'
  },

  counterBraveMenu_subtleShowUp: globalStyles.animations.subtleShowUp
})

module.exports = ReduxComponent.connect(Navigator)
