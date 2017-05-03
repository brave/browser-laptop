/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const {StyleSheet, css} = require('aphrodite')
const electron = require('electron')
const ipc = electron.ipcRenderer

// Actions
const appActions = require('../../../../js/actions/appActions')
const windowActions = require('../../../../js/actions/windowActions')
const getSetting = require('../../../../js/settings').getSetting

// Components
const ImmutableComponent = require('../immutableComponent')
const NavigationBar = require('./navigationBar')
const LongPressButton = require('../../../../js/components/longPressButton')
const MenuBar = require('./menuBar')
const WindowCaptionButtons = require('../windowCaptionButtons')
const Button = require('../../../../js/components/button')
const BrowserAction = require('../browserAction')

// State
const tabState = require('../../../common/state/tabState')
const extensionState = require('../../../common/state/extensionState')
const siteSettingsState = require('../../../common/state/siteSettingsState')

// Util
const {getCurrentWindowId, isMaximized, isFullScreen} = require('../../currentWindow')
const {makeImmutable} = require('../../../common/state/immutableUtil')
const platformUtil = require('../../../common/lib/platformUtil')
const {braveShieldsEnabled} = require('../../../common/state/shieldState')
const eventUtil = require('../../../../js/lib/eventUtil')
const {isNavigatableAboutPage, getBaseUrl} = require('./../../../../js/lib/appUrlUtil')
const frameStateUtil = require('../../../../js/state/frameStateUtil')
const siteSettings = require('../../../../js/state/siteSettings')
const cx = require('../../../../js/lib/classSet')

// Constants
const messages = require('../../../../js/constants/messages')
const settings = require('../../../../js/constants/settings')
const appConfig = require('../../../../js/constants/appConfig')

class Navigator extends ImmutableComponent {
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
    const activeFrame = frameStateUtil.getActiveFrame(this.props.windowState)
    const activeTab = tabState.getActiveTab(this.props.appState)
    const activeTabId = tabState.getActiveTabId(this.props.appState)
    const isNavigable = isNavigatableAboutPage(getBaseUrl(activeFrame.get('location')))
    if (e && eventUtil.isForSecondaryAction(e) && isNavigable) {
      if (activeTab && activeTab.get(navCheckProp)) {
        appActions.tabCloned(activeTabId, {
          [navType]: true,
          active: !!e.shiftKey
        })
      }
    } else {
      navAction.call(this, this.props.activeTab.get('tabId'))
    }
  }

  getTotalBlocks (frames) {
    if (!frames) {
      return false
    }

    frames = makeImmutable(frames)

    const ads = frames.getIn(['adblock', 'blocked'])
    const trackers = frames.getIn(['trackingProtection', 'blocked'])
    const scripts = frames.getIn(['noScript', 'blocked'])
    const fingerprint = frames.getIn(['fingerprintingProtection', 'blocked'])
    const blocked = (ads && ads.size ? ads.size : 0) +
      (trackers && trackers.size ? trackers.size : 0) +
      (scripts && scripts.size ? scripts.size : 0) +
      (fingerprint && fingerprint.size ? fingerprint.size : 0)

    return (blocked === 0)
      ? false
      : ((blocked > 99)
        ? '99+'
        : blocked)
  }

  get extensionButtons () {
    const activeTabId = tabState.getActiveTabId(this.props.appState)
    const enabledExtensions = extensionState.getEnabledExtensions(this.props.appState)
    const extensionBrowserActions = enabledExtensions
      .map((extension) => extensionState.getBrowserActionByTabId(this.props.appState, extension.get('id'), activeTabId))
      .filter((browserAction) => browserAction)

    let buttons = extensionBrowserActions.map((browserAction, id) =>
      <BrowserAction
        browserAction={browserAction}
        extensionId={id}
        tabId={activeTabId}
        popupWindowSrc={this.props.windowState.getIn(['popupWindowDetail', 'src'])} />
    ).values()
    buttons = Array.from(buttons)
    if (buttons.length > 0) {
      buttons.push(<span className='buttonSeparator' />)
    }
    return buttons
  }

  get activeFrame () {
    return this.props.frames[this.props.windowState.get('activeFrameKey')]
  }

  onBack (e) {
    this.onNav(e, 'canGoBack', 'back', appActions.onGoBack)
  }

  onForward (e) {
    this.onNav(e, 'canGoForward', 'forward', appActions.onGoForward)
  }

  onBackLongPress (target) {
    const activeTab = this.props.activeTab
    const rect = target.parentNode.getBoundingClientRect()
    appActions.onGoBackLong(activeTab.get('tabId'), {
      left: rect.left,
      bottom: rect.bottom
    })
  }

  onForwardLongPress (target) {
    const activeTab = this.props.activeTab
    const rect = target.parentNode.getBoundingClientRect()
    appActions.onGoForwardLong(activeTab.get('tabId'), {
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
        return windowActions.newFrame({location: path, title: file.name})
      })
    } else if (e.dataTransfer.getData('text/plain')) {
      let activeFrame = frameStateUtil.getActiveFrame(this.props.windowState)
      if (activeFrame) {
        windowActions.loadUrl(activeFrame, e.dataTransfer.getData('text/plain'))
      }
    }
  }

  onBraveMenu () {
    const activeFrame = frameStateUtil.getActiveFrame(this.props.windowState)
    if (braveShieldsEnabled(activeFrame)) {
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

  render () {
    const activeTab = this.props.activeTab
    const activeTabShowingMessageBox = !!(activeTab && tabState.isShowingMessageBox(this.props.appState, activeTab.get('tabId')))
    const activeFrame = frameStateUtil.getActiveFrame(this.props.windowState)
    const totalBlocks = activeFrame ? this.getTotalBlocks(activeFrame) : false
    const contextMenuDetail = this.props.windowState.get('contextMenuDetail')
    const braverySettings = siteSettings.activeSettings(this.props.activeSiteSettings, this.props.appState, appConfig)
    const shieldEnabled = braveShieldsEnabled(activeFrame)

    return <div className={cx({
      navbarCaptionButtonContainer: true,
      allowDragging: this.props.shouldAllowWindowDrag
    })}>
      <div className='navbarMenubarFlexContainer'>
        {
          this.props.customTitlebar.menubarVisible
            ? <div className='menubarContainer'>
              <MenuBar
                template={this.props.customTitlebar.menubarTemplate}
                selectedIndex={this.props.customTitlebar.menubarSelectedIndex}
                contextMenuSelectedIndex={this.props.customTitlebar.contextMenuSelectedIndex}
                contextMenuDetail={contextMenuDetail}
                autohide={getSetting(settings.AUTO_HIDE_MENU)}
                lastFocusedSelector={this.props.customTitlebar.lastFocusedSelector} />
              <WindowCaptionButtons windowMaximized={this.props.customTitlebar.isMaximized} />
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
              disabled: !activeTab || !activeTab.get('canGoBack') || activeTabShowingMessageBox
            })}>
              <LongPressButton
                l10nId='backButton'
                className='navigationButton backButton'
                disabled={!activeTab || !activeTab.get('canGoBack') || activeTabShowingMessageBox}
                onClick={this.onBack}
                onLongPress={this.onBackLongPress}
              />
            </div>
            <div className={cx({
              navigationButtonContainer: true,
              nav: true,
              disabled: !activeTab || !activeTab.get('canGoForward') || activeTabShowingMessageBox
            })}>
              <LongPressButton
                l10nId='forwardButton'
                className='navigationButton forwardButton'
                disabled={!activeTab || !activeTab.get('canGoForward') || activeTabShowingMessageBox}
                onClick={this.onForward}
                onLongPress={this.onForwardLongPress}
              />
            </div>
          </div>
          <NavigationBar
            enableNoScript={siteSettingsState.isNoScriptEnabled(this.props.appState, this.props.activeSiteSettings)}
            menubarVisible={this.props.customTitlebar.menubarVisible}
          />
          <div className='topLevelEndButtons'>
            <div className={cx({
              extraDragArea: !this.props.customTitlebar.menubarVisible,
              allowDragging: this.props.shouldAllowWindowDrag
            })} />
            {
              activeTabShowingMessageBox
                ? null
                : this.extensionButtons
            }
            <div className={css(styles.braveMenuContainer)}>
              <Button iconClass='braveMenu'
                l10nId='braveMenu'
                testId='braveShieldButton'
                className={cx({
                  navbutton: true,
                  braveShieldsDisabled: !shieldEnabled,
                  braveShieldsDown: !braverySettings.shieldsUp,
                  leftOfCaptionButton: this.props.customTitlebar.captionButtonsVisible && !this.props.customTitlebar.menubarVisible
                })}
                disabled={activeTabShowingMessageBox}
                onClick={this.onBraveMenu}
              />
              {
                shieldEnabled && totalBlocks
                  ? <div className={css(
                      styles.lionBadge,
                      (this.props.customTitlebar.menubarVisible || !platformUtil.isWindows()) && styles.lionBadgeRight
                    )}
                    data-test-id='lionBadge'>
                    {totalBlocks}
                  </div>
                  : null
              }
            </div>
            {
              this.props.customTitlebar.captionButtonsVisible && !this.props.customTitlebar.menubarVisible
                ? <span className='buttonSeparator' />
                : null
            }
          </div>
        </div>
      </div>
      {
        this.props.customTitlebar.captionButtonsVisible && !this.props.customTitlebar.menubarVisible
          ? <WindowCaptionButtons windowMaximized={this.props.customTitlebar.isMaximized} verticallyCenter='true' />
          : null
      }
    </div>
  }
}

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

module.exports = Navigator
