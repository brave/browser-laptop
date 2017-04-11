/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const Immutable = require('immutable')
const {StyleSheet, css} = require('aphrodite')

// Actions
const appActions = require('../../../../js/actions/appActions')
const windowActions = require('../../../../js/actions/windowActions')
const contextMenus = require('../../../../js/contextMenus')
const getSetting = require('../../../../js/settings').getSetting

// Components
const ImmutableComponent = require('../../../../js/components/immutableComponent')
const NavigationBar = require('./navigationBar')
const LongPressButton = require('../../../../js/components/longPressButton')
const Menubar = require('../menubar')
const WindowCaptionButtons = require('../windowCaptionButtons')
const Button = require('../../../../js/components/button')
const BrowserAction = require('../browserAction')

// State
const tabState = require('../../../common/state/tabState')
const extensionState = require('../../../common/state/extensionState')
const siteSettingsState = require('../../../common/state/siteSettingsState')

// Util
const {getCurrentWindowId, isMaximized} = require('../../currentWindow')
const {makeImmutable} = require('../../../common/state/immutableUtil')
const platformUtil = require('../../../common/lib/platformUtil')
const {braveShieldsEnabled} = require('../../../common/state/shieldState')
const tabUtil = require('../../lib/tabUtil')
const eventUtil = require('../../../../js/lib/eventUtil')
const {isNavigatableAboutPage, getBaseUrl} = require('./../../../../js/lib/appUrlUtil')
const frameStateUtil = require('../../../../js/state/frameStateUtil')
const siteSettings = require('../../../../js/state/siteSettings')
const cx = require('../../../../js/lib/classSet')

// Constants
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
    const activeTabId = tabUtil.activeTabId(this.props.windowState)
    const activeTab = activeFrame ? this.props.appState.get('tabs').find((tab) => tab.get('tabId') === activeTabId) : null
    const isNavigable = isNavigatableAboutPage(getBaseUrl(activeFrame.get('location')))
    if (e && eventUtil.isForSecondaryAction(e) && isNavigable) {
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
    const activeTabId = tabUtil.activeTabId(this.props.windowState)
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

  render () {
    const activeTab = this.props.activeTab
    const activeTabShowingMessageBox = !!(activeTab && tabState.isShowingMessageBox(this.props.appState, activeTab.get('tabId')))
    const activeFrame = frameStateUtil.getActiveFrame(this.props.windowState)
    const totalBlocks = activeFrame ? this.getTotalBlocks(activeFrame) : false
    const contextMenuDetail = this.props.windowState.get('contextMenuDetail')
    const noScriptIsVisible = this.props.windowState.getIn(['ui', 'noScriptInfo', 'isVisible'])
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
              <Menubar
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
          <div className='backforward'>
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
            navbar={activeFrame && activeFrame.get('navbar')}
            sites={this.props.appState.get('sites')}
            canGoForward={activeTab && activeTab.get('canGoForward')}
            activeFrameKey={(activeFrame && activeFrame.get('key')) || undefined}
            location={(activeFrame && activeFrame.get('location')) || ''}
            title={(activeFrame && activeFrame.get('title')) || ''}
            scriptsBlocked={activeFrame && activeFrame.getIn(['noScript', 'blocked'])}
            partitionNumber={(activeFrame && activeFrame.get('partitionNumber')) || 0}
            history={(activeFrame && activeFrame.get('history')) || new Immutable.List()}
            suggestionIndex={(activeFrame && activeFrame.getIn(['navbar', 'urlbar', 'suggestions', 'selectedIndex'])) || 0}
            isSecure={activeFrame ? activeFrame.getIn(['security', 'isSecure']) : null}
            hasLocationValueSuffix={activeFrame && activeFrame.getIn(['navbar', 'urlbar', 'suggestions', 'urlSuffix'])}
            startLoadTime={(activeFrame && activeFrame.get('startLoadTime')) || undefined}
            endLoadTime={(activeFrame && activeFrame.get('endLoadTime')) || undefined}
            loading={activeFrame && activeFrame.get('loading')}
            bookmarkDetail={this.props.windowState.get('bookmarkDetail')}
            mouseInTitlebar={this.props.windowState.getIn(['ui', 'mouseInTitlebar'])}
            searchDetail={this.props.windowState.get('searchDetail')}
            enableNoScript={siteSettingsState.isNoScriptEnabled(this.props.activeSiteSettings, this.props.appState)}
            settings={this.props.appState.get('settings')}
            noScriptIsVisible={noScriptIsVisible}
            menubarVisible={this.props.customTitlebar.menubarVisible}
            siteSettings={this.props.appState.get('siteSettings')}
            synopsis={this.props.appState.getIn(['publisherInfo', 'synopsis']) || new Immutable.Map()}
            activeTabShowingMessageBox={activeTabShowingMessageBox}
            locationInfo={this.props.appState.get('locationInfo')}
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
