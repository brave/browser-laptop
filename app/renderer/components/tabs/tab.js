/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const {StyleSheet, css} = require('aphrodite')
const Immutable = require('immutable')

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
const tabState = require('../../../common/state/tabState')

// Constants
const dragTypes = require('../../../../js/constants/dragTypes')

// Styles
const globalStyles = require('../styles/global')

// Utils
const cx = require('../../../../js/lib/classSet')
const {getTextColorForBackground} = require('../../../../js/lib/color')
const {isIntermediateAboutPage} = require('../../../../js/lib/appUrlUtil')
const contextMenus = require('../../../../js/contextMenus')
const dnd = require('../../../../js/dnd')
const throttle = require('../../../../js/lib/throttle')
const frameStateUtil = require('../../../../js/state/frameStateUtil')
const {
  getTabBreakpoint,
  tabUpdateFrameRate,
  hasBreakpoint,
  hasTabAsRelatedTarget
} = require('../../lib/tabUtil')
const isWindows = require('../../../common/lib/platformUtil').isWindows()
const {getCurrentWindowId} = require('../../currentWindow')
const UrlUtil = require('../../../../js/lib/urlutil')

class Tab extends React.Component {
  constructor (props) {
    super(props)
    this.onMouseMove = this.onMouseMove.bind(this)
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
        draggingOverData.get('draggingOverKey') !== this.props.tabId ||
        draggingOverData.get('draggingOverWindowId') !== getCurrentWindowId()) {
      return
    }

    const sourceDragData = dnd.getInterBraveDragData()
    if (!sourceDragData) {
      return
    }
    const location = sourceDragData.get('location')
    const tabId = draggingOverData.get('draggingOverKey')
    const draggingOverFrame = windowStore.getFrameByTabId(tabId)
    if ((location === 'about:blank' || location === 'about:newtab' || isIntermediateAboutPage(location)) &&
        (draggingOverFrame && draggingOverFrame.get('pinnedLocation'))) {
      return
    }

    return draggingOverData
  }

  get isDragging () {
    const sourceDragData = dnd.getInterBraveDragData()
    return sourceDragData &&
      sourceDragData.get('tabId') === this.props.tabId &&
      sourceDragData.get('draggingOverWindowId') === getCurrentWindowId()
  }

  get isDraggingOverSelf () {
    const draggingOverData = this.props.dragData && this.props.dragData.get('dragOverData')
    const sourceDragData = dnd.getInterBraveDragData()
    if (!draggingOverData || !sourceDragData) {
      return false
    }
    return draggingOverData.get('draggingOverKey') === sourceDragData.get('tabId')
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
    dnd.onDragOver(dragTypes.TAB, this.tabNode.getBoundingClientRect(), this.props.tabId, this.draggingOverData, e)
  }

  onMouseLeave (e) {
    // mouseleave will keep the previewMode
    // as long as the related target is another tab
    windowActions.setTabHoverState(this.props.frameKey, false, hasTabAsRelatedTarget(e))
  }

  onMouseEnter (e) {
    // if mouse entered a tab we only trigger a new preview
    // if user is in previewMode, which is defined by mouse move
    windowActions.setTabHoverState(this.props.frameKey, true, this.props.previewMode)
  }

  onMouseMove () {
    // dispatch a message to the store so it can delay
    // and preview the tab based on mouse idle time
    windowActions.onTabMouseMove(this.props.frameKey)
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
    switch (e.button) {
      case 2:
        // Ignore right click
        return
      case 1:
        // Close tab with middle click
        // This is ignored for pinned tabs
        // TODO: @cezaraugusto remove conditional
        // when #4063 is resolved
        if (!this.props.isPinnedTab) {
          this.onTabClosedWithMouse(e)
        }
        break
      default:
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
    const currentSize = getTabBreakpoint(this.tabSize)
    // Avoid updating breakpoint when user enters fullscreen (see #7301)
    // Also there can be a race condition for pinned tabs if we update when not needed
    // since a new tab component with the same key gets created which is not pinned.
    if (this.props.breakpoint !== currentSize && !this.props.hasTabInFullScreen) {
      windowActions.setTabBreakpoint(this.props.frameKey, currentSize)
    }
  }

  componentDidMount () {
    this.onUpdateTabSize()
    this.tabNode.addEventListener('auxclick', this.onAuxClick.bind(this))
    window.addEventListener('resize', throttle(this.onUpdateTabSize, tabUpdateFrameRate), { passive: true })
  }

  componentDidUpdate () {
    this.onUpdateTabSize()
  }

  componentWillUnmount () {
    window.removeEventListener('resize', this.onUpdateTabSize)
  }

  get fixTabWidth () {
    if (!this.tabNode) {
      return 0
    }

    const rect = this.tabNode.parentNode.getBoundingClientRect()
    return rect && rect.width
  }

  mergeProps (state, ownProps) {
    const currentWindow = state.get('currentWindow')
    const frame = frameStateUtil.getFrameByKey(currentWindow, ownProps.frameKey) || Immutable.Map()
    const notifications = state.get('notifications')
    const notificationOrigins = notifications ? notifications.map(bar => bar.get('frameOrigin')) : false
    const notificationBarActive = frame.get('location') && notificationOrigins &&
      notificationOrigins.includes(UrlUtil.getUrlOrigin(frame.get('location')))
    const hasSeconardImage = tabContentState.hasVisibleSecondaryIcon(currentWindow, ownProps.frameKey)
    const breakpoint = frame.get('breakpoint')
    const partition = typeof frame.get('partitionNumber') === 'string'
      ? frame.get('partitionNumber').replace(/^partition-/i, '')
      : frame.get('partitionNumber')
    const tabId = frame.get('tabId', tabState.TAB_ID_NONE)

    const props = {}
    // used in renderer
    props.frameKey = ownProps.frameKey
    props.isPrivateTab = frame.get('isPrivate')
    props.breakpoint = frame.get('breakpoint')
    props.notificationBarActive = notificationBarActive
    props.isActive = frameStateUtil.isFrameKeyActive(currentWindow, props.frameKey)
    props.tabWidth = currentWindow.getIn(['ui', 'tabs', 'fixTabWidth'])
    props.isPinnedTab = tabState.isTabPinned(state, tabId)
    props.canPlayAudio = tabContentState.canPlayAudio(currentWindow, props.frameKey)
    props.themeColor = tabContentState.getThemeColor(currentWindow, props.frameKey)
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
        (hasBreakpoint(breakpoint, ['mediumSmall', 'small']) && props.isActive) ||
        hasBreakpoint(breakpoint, ['extraSmall', 'smallest'])
      )

    // used in other functions
    props.totalTabs = state.get('tabs').size
    props.dragData = state.getIn(['dragData', 'type']) === dragTypes.TAB && state.get('dragData')
    props.hasTabInFullScreen = tabContentState.hasTabInFullScreen(currentWindow)
    props.tabId = tabId
    props.previewMode = currentWindow.getIn(['ui', 'tabs', 'previewMode'])

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
      data-tab-area
      className={cx({
        tabArea: true,
        draggingOverLeft: this.isDraggingOverLeft && !this.isDraggingOverSelf,
        draggingOverRight: this.isDraggingOverRight && !this.isDraggingOverSelf,
        isDragging: this.isDragging,
        isPinned: this.props.isPinnedTab,
        partOfFullPageSet: this.props.partOfFullPageSet || !!this.props.tabWidth
      })}
      style={this.props.tabWidth ? { flex: `0 0 ${this.props.tabWidth}px` } : {}}
      onMouseMove={this.onMouseMove}
      onMouseEnter={this.onMouseEnter}
      onMouseLeave={this.onMouseLeave}
      data-test-id='tab-area'
      data-frame-key={this.props.frameKey}>
      {
        this.props.isActive && this.props.notificationBarActive
          ? <NotificationBarCaret />
          : null
      }
      <div
        data-tab
        ref={(node) => { this.tabNode = node }}
        className={css(
          styles.tab,
          // Windows specific style
          isWindows && styles.tabForWindows,
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

const styles = StyleSheet.create({
  // Windows specific style
  tabForWindows: {
    color: '#555'
  },

  tab: {
    borderWidth: '0 1px 0 0',
    borderStyle: 'solid',
    borderColor: '#bbb',
    boxSizing: 'border-box',
    color: '#5a5a5a',
    display: 'flex',
    marginTop: '0',
    transition: `transform 200ms ease, ${globalStyles.transition.tabBackgroundTransition}`,
    left: '0',
    opacity: '1',
    width: '100%',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: globalStyles.spacing.defaultTabPadding,
    position: 'relative',

    // globalStyles.spacing.tabHeight has been set to globalStyles.spacing.tabsToolbarHeight,
    // which is 1px extra due to the border-top of .tabsToolbar
    height: '-webkit-fill-available',

    ':hover': {
      background: 'linear-gradient(to bottom, rgba(255, 255, 255, 0.8), rgba(250, 250, 250, 0.4))'
    }
  },

  // Custom classes based on tab's width and behaviour
  tabNarrowView: {
    padding: '0 2px'
  },

  narrowViewPlayIndicator: {
    '::before': {
      content: `''`,
      display: 'block',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: '2px',
      background: 'lightskyblue'
    }
  },

  tabNarrowestView: {
    justifyContent: 'center'
  },

  tabMinAllowedSize: {
    padding: 0
  },

  tabIdNarrowView: {
    flex: 'inherit'
  },

  tabIdMinAllowedSize: {
    overflow: 'hidden'
  },

  alternativePlayIndicator: {
    borderTop: '2px solid lightskyblue'
  },

  tabId: {
    justifyContent: 'center',
    alignItems: 'center',
    display: 'flex',
    flex: '1',

    // @see https://bugzilla.mozilla.org/show_bug.cgi?id=1108514#c5
    minWidth: '0',

    // prevent the icons wrapper from being the target of mouse events.
    pointerEvents: 'none'
  },

  isPinned: {
    padding: 0,
    width: `calc(${globalStyles.spacing.tabsToolbarHeight} * 1.1)`,
    justifyContent: 'center'
  },

  active: {
    background: `rgba(255, 255, 255, 1.0)`,
    marginTop: '0',
    borderWidth: '0 1px 0 0',
    borderStyle: 'solid',
    borderColor: '#bbb',
    color: '#000',

    ':hover': {
      background: `linear-gradient(to bottom, #fff, ${globalStyles.color.chromePrimary})`
    }
  },

  activePrivateTab: {
    background: globalStyles.color.privateTabBackgroundActive,

    ':hover': {
      background: globalStyles.color.privateTabBackgroundActive
    }
  },

  private: {
    background: 'rgba(75, 60, 110, 0.2)',

    ':hover': {
      background: globalStyles.color.privateTabBackgroundActive
    }
  },

  dragging: {
    ':hover': {
      closeTab: {
        opacity: '0'
      }
    }
  },

  icon: {
    width: globalStyles.spacing.iconSize,
    minWidth: globalStyles.spacing.iconSize,
    height: globalStyles.spacing.iconSize,
    backgroundSize: globalStyles.spacing.iconSize,
    fontSize: globalStyles.fontSize.tabIcon,
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    paddingLeft: globalStyles.spacing.defaultIconPadding,
    paddingRight: globalStyles.spacing.defaultIconPadding
  },

  icon_audio: {
    color: globalStyles.color.highlightBlue,

    // 16px
    fontSize: `calc(${globalStyles.fontSize.tabIcon} + 2px)`,

    // equal spacing around audio icon (favicon and tabTitle)
    padding: globalStyles.spacing.defaultTabPadding,
    paddingRight: '0 !important'
  }
})

module.exports = ReduxComponent.connect(Tab)
