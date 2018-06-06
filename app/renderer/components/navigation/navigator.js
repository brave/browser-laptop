/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const Immutable = require('immutable')
const {StyleSheet, css} = require('aphrodite/no-important')

// Actions
const appActions = require('../../../../js/actions/appActions')
const windowActions = require('../../../../js/actions/windowActions')

// Components
const ReduxComponent = require('../reduxComponent')
const NavigationBar = require('./navigationBar')
const MenuBar = require('./menuBar')
const WindowCaptionButtons = require('./buttons/windowCaptionButtons')
const BrowserAction = require('./browserAction')
const HomeButton = require('./buttons/homeButton')
const BackButton = require('./buttons/backButton')
const ForwardButton = require('./buttons/forwardButton')
const ShieldsButton = require('./buttons/shieldsButton')
const NavigationButton = require('./buttons/navigationButton')
const MenuIcon = require('../../../../icons/menu_2')

// State
const tabState = require('../../../common/state/tabState')
const extensionState = require('../../../common/state/extensionState')
const siteSettingsState = require('../../../common/state/siteSettingsState')
const menuBarState = require('../../../common/state/menuBarState')
const windowState = require('../../../common/state/windowState')
const contextMenuState = require('../../../common/state/contextMenuState')

// Util
const {getCurrentWindowId, isMaximized, isFullScreen, isFocused} = require('../../currentWindow')
const isWindows = require('../../../common/lib/platformUtil').isWindows()
const {braveShieldsEnabled} = require('../../../common/state/shieldState')
const frameStateUtil = require('../../../../js/state/frameStateUtil')
const siteSettings = require('../../../../js/state/siteSettings')
const cx = require('../../../../js/lib/classSet')
const {getSetting} = require('../../../../js/settings')
const contextMenus = require('../../../../js/contextMenus')

// Constants
const appConfig = require('../../../../js/constants/appConfig')
const settings = require('../../../../js/constants/settings')

class Navigator extends React.Component {
  constructor (props) {
    super(props)
    this.onDoubleClick = this.onDoubleClick.bind(this)
    this.onDragOver = this.onDragOver.bind(this)
    this.onDrop = this.onDrop.bind(this)
    this.onHamburgerMenu = this.onHamburgerMenu.bind(this)
  }

  get extensionButtons () {
    let buttons = this.props.extensionBrowserActions.map((id) => <BrowserAction extensionId={id} />).values()
    buttons = Array.from(buttons)
    buttons.push(<span className={css(styles.browserActionSeparator)} />)

    return buttons
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

  onDoubleClick (e) {
    if (!e.target.classList.contains('navigatorWrapper')) {
      return
    }

    return !this.props.isMaximized
      ? windowActions.shouldMaximize(getCurrentWindowId())
      : windowActions.shouldMinimize(getCurrentWindowId())
  }

  onHamburgerMenu (e) {
    contextMenus.onHamburgerMenu(this.props.activeFrameLocation, e)
  }

  mergeProps (state, ownProps) {
    const currentWindow = state.get('currentWindow')
    const activeFrame = frameStateUtil.getActiveFrame(currentWindow) || Immutable.Map()
    const activeFrameKey = activeFrame.get('key')
    const activeTabId = activeFrame.get('tabId', tabState.TAB_ID_NONE)
    const activeTab = tabState.getByTabId(state, activeTabId) || Immutable.Map()
    const activeTabShowingMessageBox = !!(!activeTab.isEmpty() && tabState.isShowingMessageBox(state, activeTabId))
    const allSiteSettings = siteSettingsState.getAllSiteSettings(state, activeFrame.get('isPrivate'))
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
    const fullScreen = isFullScreen(state)
    const maximized = isMaximized(state)

    const props = {}
    // used in renderer
    props.totalBlocks = activeFrame ? frameStateUtil.getTotalBlocks(activeFrame) : false
    props.shieldsDown = !braverySettings.shieldsUp
    props.shieldEnabled = braveShieldsEnabled(activeFrame)
    props.menuBarVisible = menuBarState.isMenuBarVisible(currentWindow)
    props.isMaximizedFullScreen = maximized || fullScreen
    props.isMaximized = maximized
    props.isFullScreen = fullScreen
    props.isCaptionButton = isWindows && !props.menuBarVisible
    props.activeTabShowingMessageBox = activeTabShowingMessageBox
    props.extensionBrowserActions = extensionBrowserActions
    props.showBrowserActions = !activeTabShowingMessageBox &&
      extensionBrowserActions &&
      extensionBrowserActions.size > 0
    props.showHomeButton = getSetting(settings.SHOW_HOME_BUTTON)
    props.shouldAllowWindowDrag = windowState.shouldAllowWindowDrag(state, currentWindow, activeFrame, isFocused(state))
    props.isCounterEnabled = getSetting(settings.BLOCKED_COUNT_BADGE) &&
      props.totalBlocks &&
      props.shieldEnabled
    props.isWideURLbarEnabled = getSetting(settings.WIDE_URL_BAR)
    props.isHamburgerMenuOpen = contextMenuState.isHamburgerMenuOpen(currentWindow)
    props.showNavigationBar = activeFrameKey !== undefined &&
      state.get('siteSettings') !== undefined

    // used in other functions
    props.activeTabId = activeTabId

    return props
  }

  render () {
    return <div className={cx({
      navbarCaptionButtonContainer: true,
      allowDragging: this.props.shouldAllowWindowDrag,
      [css(this.props.activeTabShowingMessageBox && styles.navigatorWrapper_activeTabShowingMessageBox)]: true
    })}>
      <div className='navbarMenubarFlexContainer'>
        {
          this.props.menuBarVisible
            ? <div className='menubarContainer'>
              <MenuBar />
              <WindowCaptionButtons
                windowMaximizedFullScreen={this.props.isMaximizedFullScreen}
                windowMaximized={this.props.isMaximized}
                windowFullScreen={this.props.isFullScreen}
              />
            </div>
            : null
        }
        <div className='navigatorWrapper'
          onDoubleClick={this.onDoubleClick}
          onDragOver={this.onDragOver}
          onDrop={this.onDrop}
        >
          <div className={cx({
            backforward: true,
            fullscreen: this.props.isFullScreen
          })}>
            <BackButton />
            <ForwardButton />
            {
              this.props.showHomeButton
              ? <HomeButton activeTabId={this.props.activeTabId} />
              : null
            }
          </div>
          {
            this.props.showNavigationBar
            ? <NavigationBar />
            : null
          }
          <div className={cx({
            topLevelEndButtons: true,
            [css(styles.navigatorWrapper__topLevelEndButtons_isWideURLbarEnabled)]: this.props.isWideURLbarEnabled
          })}>
            <div className={cx({
              extraDragArea: !this.props.menuBarVisible,
              allowDragging: this.props.shouldAllowWindowDrag,
              [css(styles.navigatorWrapper__topLevelEndButtons__extraDragArea_disabled)]: this.props.isWideURLbarEnabled
            })} />
            {
              this.props.showBrowserActions
                ? this.extensionButtons
                : null
            }
            <ShieldsButton />
            <NavigationButton
              l10nId='menuButton'
              testId='menuButton'
              onClick={this.onHamburgerMenu}
              active={this.props.isHamburgerMenuOpen}
              styles={styles.navigatorWrapper__button_menu}
            >
              <MenuIcon />
            </NavigationButton>
            {
              this.props.isCaptionButton
                ? <span className='buttonSeparator' />
                : null
            }
          </div>
        </div>
      </div>
      {
        this.props.isCaptionButton
          ? <WindowCaptionButtons
            windowMaximizedFullScreen={this.props.isMaximizedFullScreen}
            windowMaximized={this.props.isMaximized}
            windowFullScreen={this.props.isFullScreen}
            verticallyCenter='true'
          />
          : null
      }
    </div>
  }
}

const styles = StyleSheet.create({
  navigatorWrapper_activeTabShowingMessageBox: {
    pointerEvents: 'none'
  },

  // TODO: Refactor navigator.js with Aphrodite to remove !important
  navigatorWrapper__topLevelEndButtons_isWideURLbarEnabled: {
    marginLeft: '6px !important'
  },

  navigatorWrapper__topLevelEndButtons__extraDragArea_disabled: {
    display: 'none'
  },

  navigatorWrapper__button_menu: {
    margin: '0 5px 0 0'
  },

  browserActionSeparator: {
    width: '1px',
    background: '#D6DADD',
    margin: '4px 1px 4px 4px'
  }

})

module.exports = ReduxComponent.connect(Navigator)
