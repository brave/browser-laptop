/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const {StyleSheet, css} = require('aphrodite')

// Components
const ReduxComponent = require('../reduxComponent')
const Favicon = require('./content/favIcon')
const AudioTabIcon = require('./content/audioTabIcon')
const NewSessionIcon = require('./content/newSessionIcon')
const PrivateIcon = require('./content/privateIcon')
const TabTitle = require('./content/tabTitle')
const CloseTabIcon = require('./content/closeTabIcon')
const {NotificationBarCaret} = require('../main/notificationBar')

// Actions
const appActions = require('../../../../js/actions/appActions')
const windowActions = require('../../../../js/actions/windowActions')

// Store
const windowStore = require('../../../../js/stores/windowStore')

// State
const tabContentState = require('../../../common/state/tabContentState')

// Constants
const dragTypes = require('../../../../js/constants/dragTypes')
const settings = require('../../../../js/constants/settings')

// Styles
const styles = require('../styles/tab')

// Utils
const cx = require('../../../../js/lib/classSet')
const {getTextColorForBackground} = require('../../../../js/lib/color')
const {isIntermediateAboutPage} = require('../../../../js/lib/appUrlUtil')
const contextMenus = require('../../../../js/contextMenus')
const dnd = require('../../../../js/dnd')
const throttle = require('../../../../js/lib/throttle')
const frameStateUtil = require('../../../../js/state/frameStateUtil')
const {getTabBreakpoint, tabUpdateFrameRate} = require('../../lib/tabUtil')
const {isWindows} = require('../../../common/lib/platformUtil')
const {getCurrentWindowId} = require('../../currentWindow')
const {getSetting} = require('../../../../js/settings')
const UrlUtil = require('../../../../js/lib/urlutil')
const {hasBreakpoint} = require('../../lib/tabUtil')

class Tab extends React.Component {
  constructor () {
    super()
    this.onMouseEnter = this.onMouseEnter.bind(this)
    this.onMouseLeave = this.onMouseLeave.bind(this)
    this.onUpdateTabSize = this.onUpdateTabSize.bind(this)
    this.onDragStart = this.onDragStart.bind(this)
    this.onDragEnd = this.onDragEnd.bind(this)
    this.onDragOver = this.onDragOver.bind(this)
    this.onClickTab = this.onClickTab.bind(this)
    this.tabNode = null
  }

  get frame () {
    return windowStore.getFrame(this.props.frameKey)
  }

  get draggingOverData () {
    const draggingOverData = this.props.dragData && this.props.dragData.get('dragOverData')
    if (!draggingOverData ||
        draggingOverData.get('draggingOverKey') !== this.props.frameKey ||
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
      sourceDragData.get('key') === this.props.frameKey &&
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

  onDragStart (e) {
    dnd.onDragStart(dragTypes.TAB, this.frame, e)
  }

  onDragEnd (e) {
    dnd.onDragEnd(dragTypes.TAB, this.frame, e)
  }

  onDragOver (e) {
    dnd.onDragOver(dragTypes.TAB, this.tabNode.getBoundingClientRect(), this.props.frameKey, this.draggingOverData, e)
  }

  setActiveFrame (event) {
    event.stopPropagation()
    windowActions.setActiveFrame(this.frame)
  }

  onMouseLeave () {
    if (this.props.previewTabs) {
      window.clearTimeout(this.hoverTimeout)
      windowActions.setPreviewFrame(null)
    }
    windowActions.setTabHoverState(this.props.frameKey, false)
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
        window.setTimeout(windowActions.setPreviewFrame.bind(null, this.props.frameKey), previewMode ? 0 : 200)
    }
    windowActions.setTabHoverState(this.props.frameKey, true)
  }

  onAuxClick (e) {
    this.onClickTab(e)
  }

  onTabClosedWithMouse (event) {
    event.stopPropagation()
    const frame = this.frame

    if (frame && !frame.isEmpty()) {
      const tabWidth = this.fixTabWidth
      windowActions.onTabClosedWithMouse({
        fixTabWidth: tabWidth
      })
      appActions.tabCloseRequested(this.props.tabId)
    }
  }

  onClickTab (e) {
    if (e.button === 1) {
      this.onTabClosedWithMouse(e)
    } else {
      e.stopPropagation()
      appActions.tabActivateRequested(this.props.tabId)
    }
  }

  get tabSize () {
    const tab = this.tabNode
    // Avoid TypeError keeping it null until component is mounted
    return tab && !this.props.isPinnedTab ? tab.getBoundingClientRect().width : null
  }

  onUpdateTabSize () {
    setImmediate(() => {
      const currentSize = getTabBreakpoint(this.tabSize)
      // Avoid updating breakpoint when user enters fullscreen (see #7301)
      !this.props.hasTabInFullScreen && windowActions.setTabBreakpoint(this.props.frameKey, currentSize)
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

  get fixTabWidth () {
    if (!this.tabNode) {
      return 0
    }

    const rect = this.tabNode.parentNode.getBoundingClientRect()
    return rect && rect.width
  }

  mergeProps (state, dispatchProps, ownProps) {
    const currentWindow = state.get('currentWindow')
    const frame = frameStateUtil.getFrameByKey(currentWindow, ownProps.frameKey)
    const notifications = state.get('notifications')
    const notificationOrigins = notifications ? notifications.map(bar => bar.get('frameOrigin')) : false
    const notificationBarActive = frame.get('location') && notificationOrigins &&
      notificationOrigins.includes(UrlUtil.getUrlOrigin(frame.get('location')))
    const hasSeconardImage = tabContentState.hasVisibleSecondaryIcon(currentWindow, ownProps.frameKey)
    const breakpoint = frame.get('breakpoint')
    const partition = typeof frame.get('partitionNumber') === 'string'
      ? frame.get('partitionNumber').replace(/^partition-/i, '')
      : frame.get('partitionNumber')

    const props = {}
    // used in renderer
    props.frameKey = ownProps.frameKey
    props.isPrivateTab = frame.get('isPrivate')
    props.breakpoint = frame.get('breakpoint')
    props.notificationBarActive = notificationBarActive
    props.isActive = frameStateUtil.isFrameKeyActive(currentWindow, props.frameKey)
    props.paintTabs = getSetting(settings.PAINT_TABS)
    props.tabWidth = currentWindow.getIn(['ui', 'tabs', 'fixTabWidth'])
    props.isPinnedTab = frameStateUtil.isPinned(currentWindow, props.frameKey)
    props.canPlayAudio = tabContentState.canPlayAudio(currentWindow, props.frameKey)
    props.themeColor = tabContentState.getThemeColor(currentWindow, props.frameKey)
    props.isTabLoading = tabContentState.isTabLoading(currentWindow, props.frameKey)
    props.isNarrowView = tabContentState.isNarrowView(currentWindow, props.frameKey)
    props.isNarrowestView = tabContentState.isNarrowestView(currentWindow, props.frameKey)
    props.isPlayIndicatorBreakpoint = tabContentState.isMediumView(currentWindow, props.frameKey) || props.isNarrowView
    props.title = frame.get('title')
    props.showSessionIcon = partition && hasSeconardImage
    props.showPrivateIcon = props.isPrivateTab && hasSeconardImage
    props.showFavIcon = !((hasBreakpoint(breakpoint, 'extraSmall') && props.isActive) || frame.get('location') === 'about:newtab')
    props.showAudioIcon = breakpoint === 'default' && !!frame.get('audioPlaybackActive')
    props.partOfFullPageSet = ownProps.partOfFullPageSet
    props.showTitle = !props.isPinnedTab &&
      !(
        (hasBreakpoint(breakpoint, 'small') && props.isActive) ||
        hasBreakpoint(breakpoint, ['extraSmall', 'smallest'])
      )

    // used in other functions
    props.totalTabs = state.get('tabs').size
    props.previewTabs = getSetting(settings.SHOW_TAB_PREVIEWS)
    props.dragData = state.getIn(['dragData', 'type']) === dragTypes.TAB && state.get('dragData')
    props.hasTabInFullScreen = tabContentState.hasTabInFullScreen(currentWindow)
    props.tabId = frame.get('tabId')

    return props
  }

  render () {
    // we don't want themeColor if tab is private
    const perPageStyles = !this.props.isPrivateTab && StyleSheet.create({
      themeColor: {
        color: this.props.themeColor ? getTextColorForBackground(this.props.themeColor) : 'inherit',
        background: this.props.themeColor ? this.props.themeColor : 'inherit',
        ':hover': {
          color: this.props.themeColor ? getTextColorForBackground(this.props.themeColor) : 'inherit',
          background: this.props.themeColor ? this.props.themeColor : 'inherit'
        }
      }
    })
    return <div
      className={cx({
        tabArea: true,
        draggingOverLeft: this.isDraggingOverLeft && !this.isDraggingOverSelf,
        draggingOverRight: this.isDraggingOverRight && !this.isDraggingOverSelf,
        isDragging: this.isDragging,
        isPinned: this.props.isPinnedTab,
        partOfFullPageSet: this.props.partOfFullPageSet || !!this.props.tabWidth
      })}
      style={this.props.tabWidth ? { flex: `0 0 ${this.props.tabWidth}px` } : {}}
      onMouseEnter={this.onMouseEnter}
      onMouseLeave={this.onMouseLeave}>
      {
        this.props.isActive && this.props.notificationBarActive
          ? <NotificationBarCaret />
          : null
      }
      <div
        ref={(node) => { this.tabNode = node }}
        className={css(
          styles.tab,
          // Windows specific style
          isWindows() && styles.tabForWindows,
          this.props.isPinnedTab && styles.isPinned,
          this.props.isActive && styles.active,
          this.props.isPlayIndicatorBreakpoint && this.props.canPlayAudio && styles.narrowViewPlayIndicator,
          this.props.isActive && this.props.themeColor && perPageStyles.themeColor,
          // Private color should override themeColor
          this.props.isPrivateTab && styles.private,
          this.props.isActive && this.props.isPrivateTab && styles.activePrivateTab,
          !this.props.isPinnedTab && this.props.isNarrowView && styles.tabNarrowView,
          !this.props.isPinnedTab && this.props.isNarrowestView && styles.tabNarrowestView,
          !this.props.isPinnedTab && this.props.breakpoint === 'smallest' && styles.tabMinAllowedSize
        )}
        data-test-id='tab'
        data-test-active-tab={this.props.isActive}
        data-test-pinned-tab={this.props.isPinnedTab}
        data-test-private-tab={this.props.isPrivateTab}
        data-frame-key={this.props.frameKey}
        draggable
        title={this.props.title}
        onDragStart={this.onDragStart}
        onDragEnd={this.onDragEnd}
        onDragOver={this.onDragOver}
        onClick={this.onClickTab}
        onContextMenu={contextMenus.onTabContextMenu.bind(this, this.frame)}
      >
        <div className={css(
          styles.tabId,
          this.props.isNarrowView && styles.tabIdNarrowView,
          this.props.breakpoint === 'smallest' && styles.tabIdMinAllowedSize
          )}>
          {
            this.props.showFavIcon
            ? <Favicon frameKey={this.props.frameKey} />
            : null
          }
          {
            this.props.showAudioIcon
            ? <AudioTabIcon frameKey={this.props.frameKey} />
            : null
          }
          {
            this.props.showTitle
            ? <TabTitle frameKey={this.props.frameKey} />
            : null
          }
        </div>
        {
          this.props.showPrivateIcon
          ? <PrivateIcon frameKey={this.props.frameKey} />
          : null
        }
        {
          this.props.showSessionIcon
          ? <NewSessionIcon frameKey={this.props.frameKey} />
          : null
        }
        <CloseTabIcon
          frameKey={this.props.frameKey}
          fixTabWidth={this.fixTabWidth}
        />
      </div>
    </div>
  }
}

module.exports = ReduxComponent.connect(Tab)
