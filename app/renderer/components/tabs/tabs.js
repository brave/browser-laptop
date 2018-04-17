/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const ReactDOM = require('react-dom')
const Immutable = require('immutable')
const {StyleSheet, css} = require('aphrodite/no-important')

// Components
const ReduxComponent = require('../reduxComponent')
const BrowserButton = require('../common/browserButton')
const LongPressButton = require('../common/longPressButton')
const Tab = require('./tab')

// Actions
const appActions = require('../../../../js/actions/appActions')
const windowActions = require('../../../../js/actions/windowActions')

// State
const windowState = require('../../../common/state/windowState')

// Constants
const dragTypes = require('../../../../js/constants/dragTypes')
const settings = require('../../../../js/constants/settings')

// Utils
const contextMenus = require('../../../../js/contextMenus')
const {getCurrentWindowId, isFocused} = require('../../currentWindow')
const dnd = require('../../../../js/dnd')
const dndData = require('../../../../js/dndData')
const frameStateUtil = require('../../../../js/state/frameStateUtil')
const {getSetting} = require('../../../../js/settings')

const globalStyles = require('../styles/global')
const {theme} = require('../styles/theme')

class Tabs extends React.Component {
  constructor (props) {
    super(props)
    this.onDragOver = this.onDragOver.bind(this)
    this.onDrop = this.onDrop.bind(this)
    this.onPrevPage = this.onPrevPage.bind(this)
    this.onNextPage = this.onNextPage.bind(this)
    this.onNewTabLongPress = this.onNewTabLongPress.bind(this)
    this.onMouseLeave = this.onMouseLeave.bind(this)
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
    const clientX = e.clientX
    const sourceDragData = dndData.getDragData(e.dataTransfer, dragTypes.TAB)
    if (sourceDragData) {
      // If this is a different window ID than where the drag started, then
      // the tear off will be done by tab.js
      if (this.props.dragWindowId !== getCurrentWindowId()) {
        return
      }

      // This must be executed async because the state change that this causes
      // will cause the onDragEnd to never run
      setTimeout(() => {
        const key = sourceDragData.get('key')
        let droppedOnTab = dnd.closestFromXOffset(this.tabRefs.filter((node) => node && node.props.frameKey !== key), clientX).selectedRef
        if (droppedOnTab) {
          const isLeftSide = dnd.isLeftSide(ReactDOM.findDOMNode(droppedOnTab), clientX)

          windowActions.moveTab(key, droppedOnTab.props.frameKey, isLeftSide)
          if (sourceDragData.get('pinnedLocation')) {
            appActions.tabPinned(sourceDragData.get('tabId'), false)
          }
        }
      }, 0)
      return
    }

    if (e.dataTransfer.files) {
      Array.from(e.dataTransfer.items).forEach((item) => {
        if (item.kind === 'string') {
          return appActions.createTabRequested({url: item.type})
        }
      })
    }
  }

  onDragOver (e) {
    if (dndData.hasDragData(e.dataTransfer, dragTypes.TAB)) {
      e.dataTransfer.dropEffect = 'move'
      e.preventDefault()
      return
    }
    let intersection = e.dataTransfer.types.filter((x) => ['Files'].includes(x))
    if (intersection.length > 0) {
      e.dataTransfer.dropEffect = 'copy'
      e.preventDefault()
    }
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
    const unpinnedTabs = frameStateUtil.getNonPinnedFrames(currentWindow) || Immutable.List()
    const currentTabs = unpinnedTabs
      .slice(startingFrameIndex, startingFrameIndex + tabsPerTabPage)
      .map((tab) => tab.get('key'))
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

    // used in other functions
    props.fixTabWidth = currentWindow.getIn(['ui', 'tabs', 'fixTabWidth'])
    props.tabPageIndex = currentWindow.getIn(['ui', 'tabs', 'tabPageIndex'])
    props.dragWindowId = dragData.get('windowId')
    props.totalPages = totalPages

    return props
  }

  render () {
    const isTabPreviewing = this.props.previewTabFrameKey != null
    this.tabRefs = []
    return <div className={css(styles.tabs)}
      data-test-id='tabs'
      onMouseLeave={this.onMouseLeave}
    >
      <span className={css(
        styles.tabs__tabStrip,
        (this.props.previewTabPageIndex != null) && styles.tabs__tabStrip_isPreview,
        this.props.shouldAllowWindowDrag && styles.tabs__tabStrip_allowDragging,
        isTabPreviewing && styles.tabs__tabStrip_isTabPreviewing
      )}
        data-test-preview-tab={this.props.previewTabPageIndex != null}
        onDragOver={this.onDragOver}
        onDrop={this.onDrop}>
        {
          this.props.onPreviousPage
            ? <BrowserButton
              iconClass={globalStyles.appIcons.prev}
              size='21px'
              custom={[styles.tabs__tabStrip__navigation, styles.tabs__tabStrip__navigation_prev]}
              onClick={this.onPrevPage}
            />
            : null
        }
        {
          this.props.currentTabs
            .map((frameKey) =>
              <Tab
                key={'tab-' + frameKey}
                ref={(node) => this.tabRefs.push(node)}
                frameKey={frameKey}
                partOfFullPageSet={this.props.partOfFullPageSet}
              />
            )
        }
        {
          this.props.onNextPage
            ? <BrowserButton
              iconClass={`${globalStyles.appIcons.next} ${css(styles.tabs__tabStrip__navigation__icon)}`}
              size='21px'
              custom={[styles.tabs__tabStrip__navigation, styles.tabs__tabStrip__navigation_next]}
              onClick={this.onNextPage}
            />
            : null
        }
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
      </span>
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
    alignItems: 'center'
  },

  tabs__tabStrip__navigation__icon: {
    lineHeight: 0
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
