/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const {StyleSheet, css} = require('aphrodite')
const electron = require('electron')
const ipc = electron.ipcRenderer
const Immutable = require('immutable')

// Actions
const appActions = require('../../../../js/actions/appActions')
const windowActions = require('../../../../js/actions/windowActions')

// Components
const ReduxComponent = require('../reduxComponent')
const NavigationBar = require('./navigationBar')
const LongPressButton = require('../../../../js/components/longPressButton')
const MenuBar = require('./menuBar')
const WindowCaptionButtons = require('../windowCaptionButtons')
const Button = require('../../../../js/components/button')
const BrowserAction = require('./browserAction')

// State
const tabState = require('../../../common/state/tabState')
const extensionState = require('../../../common/state/extensionState')
const siteSettingsState = require('../../../common/state/siteSettingsState')
const menuBarState = require('../../../common/state/menuBarState')
const windowState = require('../../../common/state/windowState')

// Util
const {getCurrentWindowId, isMaximized, isFullScreen, isFocused} = require('../../currentWindow')
const {isWindows} = require('../../../common/lib/platformUtil')
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

class Navigator extends React.Component {
  constructor () {
    super()
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

  get extensionButtons () {
    let buttons = this.props.extensionBrowserActions.map((id) => <BrowserAction extensionId={id} />).values()
    buttons = Array.from(buttons)
    buttons.push(<span className='buttonSeparator' />)

    return buttons
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
      Array.from(e.dataTransfer.files).forEach((file) => {
        const path = encodeURI(file.path)
        appActions.createTabRequested({ url: path })
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

  mergeProps (state, dispatchProps, ownProps) {
    const currentWindow = state.get('currentWindow')
    const activeFrame = frameStateUtil.getActiveFrame(currentWindow) || Immutable.Map()
    const activeTabId = activeFrame.get('tabId') || tabState.TAB_ID_NONE
    const activeTab = tabState.getByTabId(state, activeTabId)
    const activeTabShowingMessageBox = !!(activeTab && tabState.isShowingMessageBox(state, activeTabId))
    const allSiteSettings = siteSettingsState.getAllSiteSettings(state, activeFrame)
    const braverySettings = siteSettings.activeSettings(allSiteSettings, state, appConfig)
    const enabledExtensions = extensionState.getEnabledExtensions(state)
    const extensionBrowserActions = enabledExtensions
      .map((extension) => {
        const browserAction = extensionState.getBrowserActionByTabId(state, extension.get('id'), activeTabId)
        return browserAction ? extension.get('id') : false
      })
      .filter((browserAction) => browserAction)

    const props = {}
    // used in renderer
    props.canGoBack = activeTab && activeTab.get('canGoBack') && !activeTabShowingMessageBox
    props.canGoForward = activeTab && activeTab.get('canGoForward') && !activeTabShowingMessageBox
    props.totalBlocks = activeFrame ? frameStateUtil.getTotalBlocks(activeFrame) : false
    props.shieldsDown = !braverySettings.shieldsUp
    props.shieldEnabled = braveShieldsEnabled(activeFrame)
    props.menuBarVisible = menuBarState.isMenuBarVisible(currentWindow)
    props.isMaximized = isMaximized() || isFullScreen()
    props.isCaptionButton = isWindows() && !props.menuBarVisible
    props.activeTabShowingMessageBox = activeTabShowingMessageBox
    props.extensionBrowserActions = extensionBrowserActions
    props.showBrowserActions = !activeTabShowingMessageBox &&
      extensionBrowserActions &&
      extensionBrowserActions.size > 0
    props.shouldAllowWindowDrag = windowState.shouldAllowWindowDrag(state, currentWindow, activeFrame, isFocused())
    props.isCounterEnabled = getSetting(settings.BLOCKED_COUNT_BADGE) &&
      props.totalBlocks &&
      props.shieldEnabled

    // used in other functions
    props.isNavigable = activeFrame && isNavigatableAboutPage(getBaseUrl(activeFrame.get('location')))
    props.activeTabId = activeTabId

    return Object.assign({}, ownProps, props)
  }

  render () {
    return <div className={cx({
      navbarCaptionButtonContainer: true,
      allowDragging: this.props.shouldAllowWindowDrag
    })}>
      <div className='navbarMenubarFlexContainer'>
        {
          this.props.menuBarVisible
            ? <div className='menubarContainer'>
              <MenuBar />
              <WindowCaptionButtons windowMaximized={this.props.isMaximized} />
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
            fullscreen: isFullScreen()
          })}>
            <div className={cx({
              navigationButtonContainer: true,
              nav: true,
              disabled: !this.props.canGoBack
            })}>
              <LongPressButton
                l10nId='backButton'
                className='normalizeButton navigationButton backButton'
                disabled={!this.props.canGoBack}
                onClick={this.onBack}
                onLongPress={this.onBackLongPress}
              />
            </div>
            <div className={cx({
              navigationButtonContainer: true,
              nav: true,
              disabled: !this.props.canGoForward
            })}>
              <LongPressButton
                l10nId='forwardButton'
                className='normalizeButton navigationButton forwardButton'
                disabled={!this.props.canGoForward}
                onClick={this.onForward}
                onLongPress={this.onForwardLongPress}
              />
            </div>
          </div>
          <NavigationBar />
          <div className='topLevelEndButtons'>
            <div className={cx({
              extraDragArea: !this.props.menuBarVisible,
              allowDragging: this.props.shouldAllowWindowDrag
            })} />
            {
              this.props.showBrowserActions
                ? this.extensionButtons
                : null
            }
            <div className={css(styles.braveMenuContainer)}>
              <Button iconClass='braveMenu'
                l10nId='braveMenu'
                testId='braveShieldButton'
                className={cx({
                  braveShieldsDisabled: !this.props.shieldEnabled,
                  braveShieldsDown: this.props.shieldsDown,
                  leftOfCaptionButton: this.props.isCaptionButton
                })}
                disabled={this.props.activeTabShowingMessageBox}
                onClick={this.onBraveMenu}
              />
              {
                this.props.isCounterEnabled
                  ? <div className={css(
                      styles.lionBadge,
                      (this.props.menuBarVisible || !isWindows()) && styles.lionBadgeRight
                    )}
                    data-test-id='lionBadge'>
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
          ? <WindowCaptionButtons windowMaximized={this.props.isMaximized} verticallyCenter='true' />
          : null
      }
    </div>
  }
}

module.exports = ReduxComponent.connect(Navigator)

const styles = StyleSheet.create({
  lionBadge: {
    left: 'calc(50% - 1px)',
    top: '14px',
    position: 'absolute',
    color: '#FFF',
    borderRadius: '2.5px',
    padding: '1px 2px',
    pointerEvents: 'none',
    font: '6pt "Arial Narrow"',
    textAlign: 'center',
    border: '0px solid #FFF',
    background: '#555555',
    minWidth: '10px',
    WebkitUserSelect: 'none'
  },
  lionBadgeRight: {
    left: 'auto',
    right: '2px'
  },
  braveMenuContainer: {
    position: 'relative'
  }
})
