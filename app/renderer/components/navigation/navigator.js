/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const Immutable = require('immutable')

// Actions
const appActions = require('../../../../js/actions/appActions')
const windowActions = require('../../../../js/actions/windowActions')

// Components
const ReduxComponent = require('../reduxComponent')
const NavigationBar = require('./navigationBar')
const MenuBar = require('./menuBar')
const WindowCaptionButtons = require('./buttons/windowCaptionButtons')
const BrowserButton = require('../common/browserButton')
const BrowserAction = require('./browserAction')
const BackButton = require('./buttons/backButton')
const ForwardButton = require('./buttons/forwardButton')

// State
const tabState = require('../../../common/state/tabState')
const extensionState = require('../../../common/state/extensionState')
const siteSettingsState = require('../../../common/state/siteSettingsState')
const menuBarState = require('../../../common/state/menuBarState')
const windowState = require('../../../common/state/windowState')

// Util
const {getCurrentWindowId, isMaximized, isFullScreen, isFocused} = require('../../currentWindow')
const isWindows = require('../../../common/lib/platformUtil').isWindows()
const {braveShieldsEnabled} = require('../../../common/state/shieldState')
const frameStateUtil = require('../../../../js/state/frameStateUtil')
const siteSettings = require('../../../../js/state/siteSettings')
const cx = require('../../../../js/lib/classSet')
const {getSetting} = require('../../../../js/settings')

// Constants
const appConfig = require('../../../../js/constants/appConfig')
const settings = require('../../../../js/constants/settings')

// Styles
const {StyleSheet, css} = require('aphrodite/no-important')
const globalStyles = require('../styles/global')
const {theme} = require('../styles/theme')

class Navigator extends React.Component {
  constructor (props) {
    super(props)
    this.onDoubleClick = this.onDoubleClick.bind(this)
    this.onDragOver = this.onDragOver.bind(this)
    this.onDrop = this.onDrop.bind(this)
    this.onBraveMenu = this.onBraveMenu.bind(this)
  }

  get extensionButtons () {
    let buttons = this.props.extensionBrowserActions.map((id) => <BrowserAction extensionId={id} />).values()
    buttons = Array.from(buttons)
    buttons.push(<span className='buttonSeparator' />)

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

  onBraveMenu () {
    if (this.props.shieldEnabled) {
      windowActions.setBraveryPanelDetail({})
    }
  }

  onDoubleClick (e) {
    if (!e.target.className.includes('navigatorWrapper')) {
      return
    }

    return !this.props.isMaximized
      ? windowActions.shouldMaximize(getCurrentWindowId())
      : windowActions.shouldMinimize(getCurrentWindowId())
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
    props.shouldAllowWindowDrag = windowState.shouldAllowWindowDrag(state, currentWindow, activeFrame, isFocused(state))
    props.isCounterEnabled = getSetting(settings.BLOCKED_COUNT_BADGE) &&
      props.totalBlocks &&
      props.shieldEnabled
    props.isWideURLbarEnabled = getSetting(settings.WIDE_URL_BAR)
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
            <div className={css(
              styles.braveMenu,

              // See #9696
              this.props.activeTabShowingMessageBox && styles.braveMenu_disabled
            )}>
              <BrowserButton
                iconOnly
                size={globalStyles.spacing.navbarBraveButtonWidth}
                custom={[
                  styles.braveMenu__braveShield,
                  this.props.shieldsDown && styles.braveMenu__braveShield_down,
                  !this.props.shieldEnabled && styles.braveMenu__braveShield_disabled,
                  this.props.isCaptionButton && styles.braveMenu__braveShield_isCaptionButton,

                  // See #9696: Cancel the opacity of browserButton_disabled
                  // to inherit the value set by braveMenu_disabled above.
                  this.props.activeTabShowingMessageBox && styles.braveMenu__braveShield_cancelOpacity
                ]}
                iconClass='braveMenu'
                l10nId='braveMenu'
                testId={cx({
                  braveMenu: this.props.shieldEnabled,
                  braveMenuDisabled: !this.props.shieldEnabled
                })}
                test2Id={`shield-down-${this.props.shieldsDown}`}
                disabled={this.props.activeTabShowingMessageBox}
                onClick={this.onBraveMenu}
              />
              {
                this.props.isCounterEnabled
                  ? <div className={css(
                      styles.braveMenu__counter,
                      (this.props.menuBarVisible || !isWindows) && styles.braveMenu__counter_right,

                      // delay badge show-up.
                      // this is also set for extension badge
                      // in a way that both can appear at the same time.
                      styles.braveMenu__counter_subtleShowUp
                    )}
                    data-test-id='lionBadge'
                  >
                    {this.props.totalBlocks}
                  </div>
                  : null
              }
            </div>
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

  braveMenu: {
    position: 'relative'
  },

  braveMenu_disabled: {
    // See: browserButton_disabled
    pointerEvents: 'none',
    animation: 'none',
    opacity: 0.25
  },

  braveMenu__braveShield: {
    marginRight: globalStyles.spacing.navbarButtonSpacing
  },

  braveMenu__braveShield_down: {
    filter: 'grayscale(100%)'
  },

  braveMenu__braveShield_disabled: {
    filter: 'grayscale(100%)',
    opacity: 0.4
  },

  braveMenu__braveShield_isCaptionButton: {
    marginRight: '3px'
  },

  braveMenu__braveShield_cancelOpacity: {
    // Without this the disabled lion icon gets lighter than it should be.
    opacity: 1
  },

  braveMenu__counter: {
    left: 'calc(50% - 1px)',
    top: '14px',
    position: 'absolute',
    color: theme.navigator.braveMenu.counter.color,
    borderRadius: '2.5px',
    padding: '1px 2px',
    pointerEvents: 'none',
    font: '6pt "Arial Narrow"',
    textAlign: 'center',
    background: theme.navigator.braveMenu.counter.backgroundColor,
    minWidth: '10px',
    WebkitUserSelect: 'none'
  },

  braveMenu__counter_right: {
    left: 'auto',
    right: '2px'
  },

  braveMenu__counter_subtleShowUp: globalStyles.animations.subtleShowUp
})

module.exports = ReduxComponent.connect(Navigator)
