/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const Immutable = require('immutable')
const {StyleSheet, css} = require('aphrodite/no-important')

// Components
const ReduxComponent = require('../reduxComponent')
const BrowserButton = require('../common/browserButton')
const LongPressButton = require('../common/longPressButton')
const ConnectedDragSortDetachTab = require('./connectedDragSortDetachTab')
const ListWithTransitions = require('./ListWithTransitions')

// Actions
const appActions = require('../../../../js/actions/appActions')
const windowActions = require('../../../../js/actions/windowActions')

// State
const windowState = require('../../../common/state/windowState')
const tabState = require('../../../common/state//tabState')
const tabDraggingState = require('../../../common/state//tabDraggingState')

// Constants
const dragTypes = require('../../../../js/constants/dragTypes')
const settings = require('../../../../js/constants/settings')

// Utils
const contextMenus = require('../../../../js/contextMenus')
const {getCurrentWindowId, isFocused} = require('../../currentWindow')
const frameStateUtil = require('../../../../js/state/frameStateUtil')
const {getSetting} = require('../../../../js/settings')

const globalStyles = require('../styles/global')
const {theme} = require('../styles/theme')

// time to wait before moving page during a tab drag
const DRAG_PAGEMOVE_MS_TIME_BUFFER = 1000

class Tabs extends React.Component {
  constructor (props) {
    super(props)
    this.onDragOver = this.onDragOver.bind(this)
    this.onDrop = this.onDrop.bind(this)
    this.onPrevPage = this.onPrevPage.bind(this)
    this.onNextPage = this.onNextPage.bind(this)
    this.onNewTabLongPress = this.onNewTabLongPress.bind(this)
    this.onMouseLeave = this.onMouseLeave.bind(this)
    this.onTabStartDragSortDetach = this.onTabStartDragSortDetach.bind(this)
    this.onRequestDetachTab = this.onRequestDetachTab.bind(this)
    this.onDragMoveSingleTabWindow = this.onDragMoveSingleTabWindow.bind(this)
    this.onDragChangeIndex = this.onDragChangeIndex.bind(this)
  }

  onMouseLeave () {
    if (this.props.fixTabWidth == null) {
      return
    }

    windowActions.onTabMouseLeave({
      fixTabWidth: null
    })
  }

  onPrevPage () {
    if (this.props.tabPageIndex === 0) {
      return
    }

    windowActions.setTabPageIndex(this.props.tabPageIndex - 1)
  }

  onNextPage () {
    if (this.props.tabPageIndex + 1 === this.props.totalPages) {
      return
    }

    windowActions.setTabPageIndex(this.props.tabPageIndex + 1)
  }

  onDrop (e) {
    appActions.dataDropped(getCurrentWindowId())

    if (e.dataTransfer.files) {
      Array.from(e.dataTransfer.items).forEach((item) => {
        if (item.kind === 'string') {
          return appActions.createTabRequested({url: item.type})
        }
      })
    }
  }

  onDragOver (e) {
    if (e.dataTransfer.types.some(x => x === 'Files')) {
      e.dataTransfer.dropEffect = 'copy'
      e.preventDefault()
    }
  }

  onTabStartDragSortDetach (frame, clientX, clientY, screenX, screenY, dragElementWidth, dragElementHeight, relativeXDragStart, relativeYDragStart) {
    appActions.tabDragStarted(
      getCurrentWindowId(),
      frame,
      frame.get('tabId'),
      clientX,
      clientY,
      screenX,
      screenY,
      dragElementWidth,
      dragElementHeight,
      relativeXDragStart,
      relativeYDragStart,
      this.props.totalTabCount === 1
    )
  }

  onRequestDetachTab (itemX, itemY) {
    appActions.tabDragDetachRequested(itemX, itemY)
  }

  onDragMoveSingleTabWindow (itemX, itemY) {
    // we do not need to send the cursor pos as it will be read by the store, since
    // it may move between here and there
    appActions.tabDragSingleTabMoved(itemX, itemY, getCurrentWindowId())
  }

  onDragChangeIndex (currentIndex, destinationIndex) {
    // we do not need to know which tab is changing index, since
    // the currently-dragged tabId is stored on state
    let shouldPauseDraggingUntilUpdate = false
    // handle any destination index change by dispatching actions to store
    if (currentIndex !== destinationIndex) {
      // only allow to drag to a different page if we hang here for a while
      const firstIndexOnCurrentPage = this.props.firstTabDisplayIndex
      const lastIndexOnCurrentPage = firstIndexOnCurrentPage + this.props.currentTabs.size - 1
      const isDraggingToPreviousPage = destinationIndex < firstIndexOnCurrentPage
      const isDraggingToNextPage = destinationIndex > lastIndexOnCurrentPage
      const isDraggingToDifferentPage = isDraggingToPreviousPage || isDraggingToNextPage
      if (isDraggingToDifferentPage) {
        // dragging to a different page
        // first, at least make sure the tab has moved to the index just next to the threshold
        // (since we might have done a big jump)
        if (isDraggingToNextPage && currentIndex !== lastIndexOnCurrentPage) {
          shouldPauseDraggingUntilUpdate = true
          windowActions.tabDragChangeGroupDisplayIndex(false, lastIndexOnCurrentPage)
        } else if (isDraggingToPreviousPage && currentIndex !== firstIndexOnCurrentPage) {
          shouldPauseDraggingUntilUpdate = true
          windowActions.tabDragChangeGroupDisplayIndex(false, firstIndexOnCurrentPage)
        }
        // make sure the user wants to change page by enforcing a pause
        this.beginOrContinueTimeoutForDragPageIndexMove(destinationIndex, this.props.tabPageIndex, this.props.firstTabDisplayIndex)
      } else {
        // dragging to a different index within the same page,
        // so clear the wait for changing page and move immediately
        this.clearDragPageIndexMoveTimeout()
        // move display index immediately
        shouldPauseDraggingUntilUpdate = true
        windowActions.tabDragChangeGroupDisplayIndex(false, destinationIndex)
      }
    } else {
      // no longer want to change tab page
      this.clearDragPageIndexMoveTimeout()
    }
    return shouldPauseDraggingUntilUpdate
  }

  clearDragPageIndexMoveTimeout () {
    if (this.draggingMoveTabPageTimeout) {
      window.clearTimeout(this.draggingMoveTabPageTimeout)
      this.draggingMoveTabPageTimeout = null
      // let store know we're done waiting
      windowActions.tabDragNotPausingForPageChange()
    }
  }

  beginOrContinueTimeoutForDragPageIndexMove (destinationIndex, currentTabPageIndex, firstTabDisplayIndex) {
    // let store know we're waiting to change
    if (!this.draggingMoveTabPageTimeout) {
      const waitingForPageIndex = currentTabPageIndex + ((destinationIndex > firstTabDisplayIndex) ? 1 : -1)
      windowActions.tabDragPausingForPageChange(waitingForPageIndex)
    }
    this.draggingMoveTabPageTimeout = this.draggingMoveTabPageTimeout || window.setTimeout(() => {
      this.clearDragPageIndexMoveTimeout()
      windowActions.tabDragChangeGroupDisplayIndex(false, destinationIndex)
    }, DRAG_PAGEMOVE_MS_TIME_BUFFER)
  }

  newTab () {
    appActions.createTabRequested({})
  }

  onNewTabLongPress (target) {
    contextMenus.onNewTabContextMenu(target)
  }

  mergeProps (state, ownProps) {
    const currentWindow = state.get('currentWindow')
    const pageIndex = frameStateUtil.getTabPageIndex(currentWindow)
    const tabsPerTabPage = Number(getSetting(settings.TABS_PER_PAGE))
    const startingFrameIndex = pageIndex * tabsPerTabPage
    const unpinnedTabs = frameStateUtil.getNonPinnedFrames(currentWindow)
      .filter(frame => frame.get('tabStripWindowId') === getCurrentWindowId())
    const currentTabs = unpinnedTabs
      .slice(startingFrameIndex, startingFrameIndex + tabsPerTabPage)
      .filter(tab => tab)
    const totalPages = Math.ceil(unpinnedTabs.size / tabsPerTabPage)
    const activeFrame = frameStateUtil.getActiveFrame(currentWindow) || Immutable.Map()
    const dragData = (state.getIn(['dragData', 'type']) === dragTypes.TAB && state.get('dragData')) || Immutable.Map()

    const props = {}
    // used in renderer
    props.previewTabPageIndex = currentWindow.getIn(['ui', 'tabs', 'previewTabPageIndex'])
    props.previewTabFrameKey = frameStateUtil.getPreviewFrameKey(currentWindow)
    props.currentTabs = currentTabs
    props.partOfFullPageSet = currentTabs.size === tabsPerTabPage
    props.onNextPage = currentTabs.size >= tabsPerTabPage && totalPages > pageIndex + 1
    props.onPreviousPage = pageIndex > 0
    props.shouldAllowWindowDrag = windowState.shouldAllowWindowDrag(state, currentWindow, activeFrame, isFocused(state))

    // tab dragging
    props.draggingTabId = tabState.draggingTabId(state)
    props.pausingToChangePageIndex = tabDraggingState.window.getPausingForPageIndex(currentWindow)

    // used in other functions
    props.firstTabDisplayIndex = startingFrameIndex
    props.fixTabWidth = currentWindow.getIn(['ui', 'tabs', 'fixTabWidth'])
    props.tabPageIndex = currentWindow.getIn(['ui', 'tabs', 'tabPageIndex'])
    props.totalTabCount = unpinnedTabs.size
    props.dragData = dragData
    props.dragWindowId = dragData.get('windowId')
    props.totalPages = totalPages
    return props
  }

  render () {
    const isPreview = this.props.previewTabPageIndex != null
    const isTabPreviewing = this.props.previewTabFrameKey != null
    const displayedTabIndex = this.props.previewTabPageIndex != null ? this.props.previewTabPageIndex : this.props.tabPageIndex
    return <div className={css(styles.tabs)}
      data-test-id='tabs'
      onMouseLeave={this.onMouseLeave}
    >
      {[
        <ListWithTransitions className={css(
            styles.tabs__tabStrip,
            isPreview && styles.tabs__tabStrip_isPreview,
            this.props.shouldAllowWindowDrag && styles.tabs__tabStrip_allowDragging,
            isTabPreviewing && styles.tabs__tabStrip_isTabPreviewing
          )}
          key={displayedTabIndex}
          disableAllAnimations={isPreview}
          data-test-preview-tab={isPreview}
          typeName='span'
          duration={710}
          delay={0}
          staggerDelayBy={0}
          easing='cubic-bezier(0.23, 1, 0.32, 1)'
          enterAnimation={this.props.draggingTabId != null ? null : [
            {
              transform: 'translateY(50%)'
            },
            {
              transform: 'translateY(0)'
            }
          ]}
          leaveAnimation={this.props.draggingTabId != null ? null : [
            {
              transform: 'translateY(0)'
            },
            {
              transform: 'translateY(100%)'
            }
          ]}
          onDragOver={this.onDragOver}
          onDrop={this.onDrop}>
          {
            this.props.onPreviousPage
              ? <BrowserButton
                key='prev'
                iconClass={globalStyles.appIcons.prev}
                size='21px'
                custom={[
                  styles.tabs__tabStrip__navigation,
                  styles.tabs__tabStrip__navigation_prev,
                  this.props.pausingToChangePageIndex === this.props.tabPageIndex - 1 && styles.tabs__tabStrip__navigation_isPausing
                ]}
                onClick={this.onPrevPage}
              />
            : null
          }
          {
            this.props.currentTabs
              .map((frame, tabDisplayIndex) =>
                <ConnectedDragSortDetachTab
                  key={`tab-${frame.get('tabId')}-${frame.get('key')}`}
                  // required for tab component
                  frame={frame}
                  partOfFullPageSet={this.props.partOfFullPageSet}
                  // required for DragSortDetachTab
                  dragData={frame}
                  dragCanDetach
                  firstItemDisplayIndex={this.props.firstTabDisplayIndex}
                  displayIndex={tabDisplayIndex + this.props.firstTabDisplayIndex}
                  displayedTabCount={this.props.currentTabs.size}
                  totalTabCount={this.props.totalTabCount}
                  tabPageIndex={displayedTabIndex}
                  onStartDragSortDetach={this.onTabStartDragSortDetach}
                  onRequestDetach={this.onRequestDetachTab}
                  onDragMoveSingleItem={this.onDragMoveSingleTabWindow}
                  onDragChangeIndex={this.onDragChangeIndex}
                />
              )
          }
          {
            this.props.onNextPage
              ? <BrowserButton
                key='next'
                iconClass={`${globalStyles.appIcons.next} ${css(styles.tabs__tabStrip__navigation__icon)}`}
                size='21px'
                custom={[
                  styles.tabs__tabStrip__navigation,
                  styles.tabs__tabStrip__navigation_next,
                  this.props.pausingToChangePageIndex === this.props.tabPageIndex + 1 && styles.tabs__tabStrip__navigation_isPausing
                ]}
                onClick={this.onNextPage}
                />
              : null
          }
          <div
            key='add'
            className={css(
              styles.tabs__postTabButtons,
              // hide during drag but only when there's no 'next page' button
              // as the hiding is to avoid a gap, but that would create a new gap
              this.props.draggingTabId != null && styles.tabs__postTabButtons_ancestorIsDragging,
              this.props.draggingTabId != null && !this.props.onNextPage && styles.tabs__postTabButtons_isInvisible
            )}
            data-prevent-transition-move-right
          >
            <LongPressButton
              className={css(
                styles.tabs__tabStrip__newTabButton
              )}
              label='+'
              l10nId='newTabButton'
              testId='newTabButton'
              disabled={false}
              onClick={this.newTab}
              onLongPress={this.onNewTabLongPress}
            >
              <svg className={css(styles.tabs__tabStrip__newTabButton__icon)} xmlns='http://www.w3.org/2000/svg' viewBox='0 0 14.14 14.14'>
                <path className={css(styles.tabs__tabStrip__newTabButton__icon__line)} d='M7.07 1v12.14M13.14 6.86H1' />
              </svg>
            </LongPressButton>
          </div>
        </ListWithTransitions>
      ]}
    </div>
  }
}

const styles = StyleSheet.create({
  tabs: {
    boxSizing: 'border-box',
    display: 'flex',
    flex: 1,
    padding: 0,
    height: '-webkit-fill-available',
    position: 'relative',
    whiteSpace: 'nowrap',
    zIndex: globalStyles.zindex.zindexTabs
  },

  tabs__tabStrip: {
    display: 'flex',
    flex: 1,
    zIndex: globalStyles.zindex.zindexTabs,
    position: 'relative'
  },

  tabs__tabStrip_isTabPreviewing: {
    overflow: 'initial'
  },

  tabs__tabStrip_isPreview: globalStyles.animations.tabFadeIn,

  tabs__tabStrip_allowDragging: {
    WebkitAppRegion: 'drag'
  },

  tabs__tabStrip__navigation: {
    fontSize: '21px',
    height: 'auto',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ddddddaa',
    zIndex: 400,
    borderRadius: 0
  },

  tabs__tabStrip__navigation__icon: {
    lineHeight: 0
  },

  tabs__tabStrip__navigation_isPausing: {
    backgroundColor: '#dddddd',
    color: theme.tabsToolbar.button.changingPage.toBackgroundColor,
    ':hover': {
      backgroundColor: '#dddddd',
      color: theme.tabsToolbar.button.changingPage.toBackgroundColor
    }
  },

  tabs__tabStrip__navigation_prev: {
    paddingRight: '2px',

    // Override border:none specified with browserButton
    borderWidth: '0 1px 0 0',
    borderStyle: 'solid',
    borderColor: theme.tabsToolbar.tabs.navigation.borderColor
  },

  tabs__tabStrip__navigation_next: {
    paddingLeft: '2px'
  },
  tabs__postTabButtons: {
    background: theme.tabsToolbar.backgroundColor,
    zIndex: 50, // underneath normal tab, on top of dragged tab
    opacity: 1,
    transition: 'opacity 120ms ease-in-out'
  },
  tabs__postTabButtons_ancestorIsDragging: {
    zIndex: 450
  },
  tabs__postTabButtons_isInvisible: {
    opacity: 0
  },
  tabs__tabStrip__newTabButton: {
    '--new-tab-button-line-color': theme.tabsToolbar.button.backgroundColor,
    // no-drag is applied to each button and tab
    WebkitAppRegion: 'no-drag',
    // don't look like a native button
    WebkitAppearance: 'none',
    border: 'none',
    background: 'none',
    // ensure it's a square
    width: globalStyles.spacing.tabsToolbarHeight,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    ':hover': {
      '--new-tab-button-line-color': theme.tabsToolbar.button.onHover.backgroundColor
    }
  },

  tabs__tabStrip__newTabButton__icon: {
    width: '12px'
  },

  tabs__tabStrip__newTabButton__icon__line: {
    fill: 'none',
    stroke: 'var(--new-tab-button-line-color)',
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round',
    'stroke-width': '2px',
    transition: '.12s stroke ease'
  }
})

module.exports = ReduxComponent.connect(Tabs)
