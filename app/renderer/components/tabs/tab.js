/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const {StyleSheet, css} = require('aphrodite')
const ipc = require('electron').ipcRenderer

// Components
const ImmutableComponent = require('../immutableComponent')
const Favicon = require('./content/favIcon')
const AudioTabIcon = require('./content/audioTabIcon')
const NewSessionIcon = require('./content/newSessionIcon')
const PrivateIcon = require('./content/privateIcon')
const TabTitle = require('./content/tabTitle')
const CloseTabIcon = require('./content/closeTabIcon')
const {NotificationBarCaret} = require('../../../../js/components/notificationBar')

// Actions
const appActions = require('../../../../js/actions/appActions')
const windowActions = require('../../../../js/actions/windowActions')

// Store
const windowStore = require('../../../../js/stores/windowStore')

// Constants
const dragTypes = require('../../../../js/constants/dragTypes')
const messages = require('../../../../js/constants/messages')

// Styles
const styles = require('../styles/tab')

// Utils
const locale = require('../../../../js/l10n')
const cx = require('../../../../js/lib/classSet')
const {getTextColorForBackground} = require('../../../../js/lib/color')
const {isIntermediateAboutPage} = require('../../../../js/lib/appUrlUtil')
const contextMenus = require('../../../../js/contextMenus')
const dnd = require('../../../../js/dnd')
const throttle = require('../../../../js/lib/throttle')
const {getTabBreakpoint, tabUpdateFrameRate} = require('../../lib/tabUtil')
const {isWindows} = require('../../../common/lib/platformUtil')
const {getCurrentWindowId} = require('../../currentWindow')
const UrlUtil = require('../../../../js/lib/urlutil')

class Tab extends ImmutableComponent {
  constructor () {
    super()
    this.onMouseEnter = this.onMouseEnter.bind(this)
    this.onMouseLeave = this.onMouseLeave.bind(this)
    this.onUpdateTabSize = this.onUpdateTabSize.bind(this)
  }
  get frame () {
    return windowStore.getFrame(this.props.frame.get('key'))
  }
  get isPinned () {
    return !!this.props.frame.get('pinnedLocation')
  }

  get draggingOverData () {
    const draggingOverData = this.props.dragData && this.props.dragData.get('dragOverData')
    if (!draggingOverData ||
        draggingOverData.get('draggingOverKey') !== this.props.frame.get('key') ||
        draggingOverData.get('draggingOverWindowId') !== getCurrentWindowId()) {
      return
    }

    const sourceDragData = dnd.getInterBraveDragData()
    if (!sourceDragData) {
      return
    }
    const location = sourceDragData.get('location')
    const key = draggingOverData.get('draggingOverKey')
    const draggingOverFrame = windowStore.getFrame(key)
    if ((location === 'about:blank' || location === 'about:newtab' || isIntermediateAboutPage(location)) &&
        (draggingOverFrame && draggingOverFrame.get('pinnedLocation'))) {
      return
    }

    return draggingOverData
  }

  get isDragging () {
    const sourceDragData = dnd.getInterBraveDragData()
    return sourceDragData &&
      sourceDragData.get('key') === this.props.frame.get('key') &&
      sourceDragData.get('draggingOverWindowId') === getCurrentWindowId()
  }

  get isDraggingOverSelf () {
    const draggingOverData = this.props.dragData && this.props.dragData.get('dragOverData')
    const sourceDragData = dnd.getInterBraveDragData()
    if (!draggingOverData || !sourceDragData) {
      return false
    }
    return draggingOverData.get('draggingOverKey') === sourceDragData.get('key')
  }

  get isDraggingOverLeft () {
    if (!this.draggingOverData) {
      return false
    }
    return this.draggingOverData.get('draggingOverLeftHalf')
  }

  get isDraggingOverRight () {
    if (!this.draggingOverData) {
      return false
    }
    return this.draggingOverData.get('draggingOverRightHalf')
  }

  get displayValue () {
    // For renderer initiated navigations, make sure we show Untitled
    // until we know what we're loading.  We should probably do this for
    // all about: pages that we already know the title for so we don't have
    // to wait for the title to be parsed.
    if (this.props.frame.get('location') === 'about:blank') {
      return locale.translation('aboutBlankTitle')
    } else if (this.props.frame.get('location') === 'about:newtab') {
      return locale.translation('newTab')
    }

    // YouTube tries to change the title to add a play icon when
    // there is audio. Since we have our own audio indicator we get
    // rid of it.
    return (this.props.frame.get('title') ||
      this.props.frame.get('location') ||
      '').replace('▶ ', '')
  }

  onDragStart (e) {
    dnd.onDragStart(dragTypes.TAB, this.frame, e)
  }

  onDragEnd (e) {
    dnd.onDragEnd(dragTypes.TAB, this.frame, e)
  }

  onDragOver (e) {
    dnd.onDragOver(dragTypes.TAB, this.tabNode.getBoundingClientRect(), this.props.frame.get('key'), this.draggingOverData, e)
  }

  onTabClosedWithMouse (event) {
    event.stopPropagation()
    if (this.props.onTabClosedWithMouse && this.frame && !this.frame.isEmpty()) {
      this.props.onTabClosedWithMouse(this.tabNode.parentNode.getBoundingClientRect())
      appActions.tabCloseRequested(this.frame.get('tabId'))
    }
  }

  onMuteFrame (muted, event) {
    event.stopPropagation()
    const frame = this.frame
    windowActions.setAudioMuted(frame.get('key'), frame.get('tabId'), muted)
  }

  get loading () {
    return this.frame &&
    (this.props.frame.get('loading') ||
     this.props.frame.get('location') === 'about:blank') &&
    (!this.props.frame.get('provisionalLocation') ||
    !this.props.frame.get('provisionalLocation').startsWith('chrome-extension://mnojpmjdmbbfmejpflffifhffcmidifd/'))
  }

  onMouseLeave () {
    if (this.props.previewTabs) {
      window.clearTimeout(this.hoverTimeout)
      windowActions.setPreviewFrame(null)
    }
    windowActions.setTabHoverState(this.props.frame.get('key'), false)
  }

  onMouseEnter (e) {
    // relatedTarget inside mouseenter checks which element before this event was the pointer on
    // if this element has a tab-like class, then it's likely that the user was previewing
    // a sequency of tabs. Called here as previewMode.
    const previewMode = /tab(?!pages)/i.test(e.relatedTarget.classList)

    // If user isn't in previewMode, we add a bit of delay to avoid tab from flashing out
    // as reported here: https://github.com/brave/browser-laptop/issues/1434
    if (this.props.previewTabs) {
      this.hoverTimeout =
        window.setTimeout(windowActions.setPreviewFrame.bind(null, this.props.frame.get('key')), previewMode ? 0 : 200)
    }
    windowActions.setTabHoverState(this.props.frame.get('key'), true)
  }

  onAuxClick (e) {
    this.onClickTab(e)
  }

  onClickTab (e) {
    if (e.button === 1) {
      this.onTabClosedWithMouse(e)
    } else {
      e.stopPropagation()
      appActions.tabActivateRequested(this.frame.get('tabId'))
    }
  }

  get themeColor () {
    return this.props.paintTabs &&
    (this.props.frame.get('themeColor') || this.props.frame.get('computedThemeColor'))
  }

  get tabSize () {
    const tab = this.tabNode
    // Avoid TypeError keeping it null until component is mounted
    return tab && !this.isPinned ? tab.getBoundingClientRect().width : null
  }

  get mediumView () {
    const sizes = ['large', 'largeMedium']
    return sizes.includes(this.props.frame.get('breakpoint'))
  }

  get narrowView () {
    const sizes = ['medium', 'mediumSmall', 'small', 'extraSmall', 'smallest']
    return sizes.includes(this.props.frame.get('breakpoint'))
  }

  get narrowestView () {
    const sizes = ['extraSmall', 'smallest']
    return sizes.includes(this.props.frame.get('breakpoint'))
  }

  get canPlayAudio () {
    return this.props.frame.get('audioPlaybackActive') || this.props.frame.get('audioMuted')
  }

  onUpdateTabSize () {
    setImmediate(() => {
      const currentSize = getTabBreakpoint(this.tabSize)
      // Avoid updating breakpoint when user enters fullscreen (see #7301)
      !this.props.hasTabInFullScreen && windowActions.setTabBreakpoint(this.props.frame.get('key'), currentSize)
    })
  }

  componentWillMount () {
    this.onUpdateTabSize()
  }

  componentDidMount () {
    this.onUpdateTabSize()
    this.tabNode.addEventListener('auxclick', this.onAuxClick.bind(this))
    window.addEventListener('resize', throttle(this.onUpdateTabSize, tabUpdateFrameRate))
  }

  componentDidUpdate () {
    this.onUpdateTabSize()
  }

  componentWillUnmount () {
    this.onUpdateTabSize()
    window.removeEventListener('resize', this.onUpdateTabSize)
  }

  componentWillReceiveProps (nextProps) {
    // Update breakpoint each time a new tab is open
    if (this.props.totalTabs !== nextProps.totalTabs) {
      this.onUpdateTabSize()
    }
  }

  render () {
    const notificationBarActive = !!this.props.notificationBarActive &&
      this.props.notificationBarActive.includes(UrlUtil.getUrlOrigin(this.props.frame.get('location')))
    const playIndicatorBreakpoint = this.mediumView || this.narrowView
    // we don't want themeColor if tab is private
    const perPageStyles = !this.props.frame.get('isPrivate') && StyleSheet.create({
      themeColor: {
        color: this.themeColor ? getTextColorForBackground(this.themeColor) : 'inherit',
        background: this.themeColor ? this.themeColor : 'inherit',
        ':hover': {
          color: this.themeColor ? getTextColorForBackground(this.themeColor) : 'inherit',
          background: this.themeColor ? this.themeColor : 'inherit'
        }
      }
    })
    return <div
      className={cx({
        tabArea: true,
        draggingOverLeft: this.isDraggingOverLeft && !this.isDraggingOverSelf,
        draggingOverRight: this.isDraggingOverRight && !this.isDraggingOverSelf,
        isDragging: this.isDragging,
        isPinned: this.isPinned,
        partOfFullPageSet: this.props.partOfFullPageSet || !!this.props.tabWidth
      })}
      style={this.props.tabWidth ? { flex: `0 0 ${this.props.tabWidth}px` } : {}}
      onMouseEnter={this.onMouseEnter}
      onMouseLeave={this.onMouseLeave}>
      {
        this.props.isActive && notificationBarActive
          ? <NotificationBarCaret />
          : null
      }
      <div className={css(
        styles.tab,
        // Windows specific style
        isWindows() && styles.tabForWindows,
        this.isPinned && styles.isPinned,
        this.props.isActive && styles.active,
        playIndicatorBreakpoint && this.canPlayAudio && styles.narrowViewPlayIndicator,
        this.props.isActive && this.themeColor && perPageStyles.themeColor,
        // Private color should override themeColor
        this.props.frame.get('isPrivate') && styles.private,
        this.props.isActive && this.props.frame.get('isPrivate') && styles.activePrivateTab,
        !this.isPinned && this.narrowView && styles.tabNarrowView,
        !this.isPinned && this.narrowestView && styles.tabNarrowestView,
        !this.isPinned && this.props.frame.get('breakpoint') === 'smallest' && styles.tabMinAllowedSize
        )}
        data-test-active-tab={this.props.isActive}
        data-test-pinned-tab={this.isPinned}
        data-test-private-tab={this.props.frame.get('isPrivate')}
        data-test-id='tab'
        data-frame-key={this.props.frame.get('key')}
        ref={(node) => { this.tabNode = node }}
        draggable
        title={this.props.frame.get('title')}
        onDragStart={this.onDragStart.bind(this)}
        onDragEnd={this.onDragEnd.bind(this)}
        onDragOver={this.onDragOver.bind(this)}
        onClick={this.onClickTab.bind(this)}
        onContextMenu={contextMenus.onTabContextMenu.bind(this, this.frame)}>
        <div className={css(
          styles.tabId,
          this.narrowView && styles.tabIdNarrowView,
          this.props.frame.get('breakpoint') === 'smallest' && styles.tabIdMinAllowedSize
          )}>
          <Favicon
            isActive={this.props.isActive}
            paintTabs={this.props.paintTabs}
            frame={this.props.frame}
            isLoading={this.loading}
            isPinned={this.isPinned}
          />
          <AudioTabIcon
            frame={this.props.frame}
            onClick={this.onMuteFrame.bind(this, !this.props.frame.get('audioMuted'))}
          />
          <TabTitle
            isActive={this.props.isActive}
            paintTabs={this.props.paintTabs}
            frame={this.props.frame}
            pageTitle={this.displayValue}
          />
        </div>
        <PrivateIcon
          frame={this.props.frame}
          isActive={this.props.isActive}
         />
        <NewSessionIcon
          isActive={this.props.isActive}
          paintTabs={this.props.paintTabs}
          frame={this.props.frame}
          l10nArgs={this.props.frame.get('partitionNumber')}
          l10nId='sessionInfoTab'
        />
        <CloseTabIcon
          isActive={this.props.isActive}
          frame={this.props.frame}
          onClick={this.onTabClosedWithMouse.bind(this)}
          l10nId='closeTabButton'
        />
      </div>
    </div>
  }
}

const paymentsEnabled = () => {
  const getSetting = require('../../../../js/settings').getSetting
  const settings = require('../../../../js/constants/settings')
  return getSetting(settings.PAYMENTS_ENABLED)
}

windowStore.addChangeListener(() => {
  if (paymentsEnabled()) {
    const windowState = windowStore.getState()
    const frames = windowState && windowState.get('frames')
    if (frames) {
      try {
        const presentP = frames.some((frame) => {
          return frame.get('location') === 'about:preferences#payments'
        })
        ipc.send(messages.LEDGER_PAYMENTS_PRESENT, presentP)
      } catch (ex) { }
    }
  }
})
module.exports = Tab
