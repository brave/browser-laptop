/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const ReactDOM = require('react-dom')
const {StyleSheet, css} = require('aphrodite/no-important')
const Immutable = require('immutable')

// Components
const ReduxComponent = require('../reduxComponent')
const BrowserButton = require('../common/browserButton')
const BookmarkToolbarButton = require('./bookmarkToolbarButton')

// Actions
const appActions = require('../../../../js/actions/appActions')
const windowActions = require('../../../../js/actions/windowActions')

// State
const windowState = require('../../../common/state/windowState')
const bookmarkToolbarState = require('../../../common/state/bookmarkToolbarState')

// Constants
const dragTypes = require('../../../../js/constants/dragTypes')

// Utils
const {isFocused} = require('../../currentWindow')
const contextMenus = require('../../../../js/contextMenus')
const dnd = require('../../../../js/dnd')
const dndData = require('../../../../js/dndData')
const isWindows = require('../../../common/lib/platformUtil').isWindows()
const frameStateUtil = require('../../../../js/state/frameStateUtil')
const bookmarkUtil = require('../../../common/lib/bookmarkUtil')
const {elementHasDataset} = require('../../../../js/lib/eventUtil')
const {getCurrentWindowId} = require('../../currentWindow')

// Styles
const globalStyles = require('../styles/global')

class BookmarksToolbar extends React.Component {
  constructor (props) {
    super(props)
    this.onDrop = this.onDrop.bind(this)
    this.onDragEnter = this.onDragEnter.bind(this)
    this.onDragOver = this.onDragOver.bind(this)
    this.onContextMenu = this.onContextMenu.bind(this)
    this.onMoreBookmarksMenu = this.onMoreBookmarksMenu.bind(this)
  }

  onDrop (e) {
    e.preventDefault()
    const bookmark = dnd.prepareBookmarkDataFromCompatible(e.dataTransfer)
    if (bookmark) {
      const droppedOn = bookmarkUtil.getClosestFromPos(
        dnd,
        this.bookmarkRefs,
        e.clientX,
        bookmark.get('key')
      )
      const currentNode = ReactDOM.findDOMNode(droppedOn.selectedRef)
      const isRightSide = dnd.isRightSide(currentNode, e.clientX)

      if (droppedOn && droppedOn.selectedRef) {
        appActions.onDropBookmark(
          bookmark,
          droppedOn.selectedRef.props.bookmarkKey,
          droppedOn.selectedRef.state.isFolder,
          droppedOn.isDroppedOn,
          isRightSide
        )
      }
      dnd.onDragEnd()
    }
  }

  onDragEnter (e) {
    if (dndData.hasDragData(e.dataTransfer, dragTypes.BOOKMARK)) {
      if (elementHasDataset(e.target, 'overflowIndicator')) {
        this.onMoreBookmarksMenu(e)
      }
    }
  }

  onDragOver (e) {
    const sourceDragData = dndData.getDragData(e.dataTransfer, dragTypes.BOOKMARK)
    if (sourceDragData) {
      e.dataTransfer.dropEffect = 'move'
      e.preventDefault()
      return
    }

    let intersection = e.dataTransfer.types.filter((x) =>
      ['text/plain', 'text/uri-list', 'text/html', 'Files'].includes(x))
    if (intersection.length > 0) {
      e.dataTransfer.dropEffect = 'copy'
      e.preventDefault()
    }
  }

  onMoreBookmarksMenu (e) {
    const rect = e.target.getBoundingClientRect()
    windowActions.onMoreBookmarksMenu(this.props.hiddenBookmarks, rect.bottom)
  }

  onContextMenu (e) {
    const closest = dnd.closestFromXOffset(this.bookmarkRefs.filter((x) => !!x), e.clientX).selectedRef
    contextMenus.onTabsToolbarContextMenu(
      this.props.title,
      this.props.location,
      (closest && closest.props.bookmark) || undefined,
      closest && closest.isDroppedOn,
      e
    )
  }

  mergeProps (state, ownProps) {
    const currentWindow = state.get('currentWindow')
    const activeFrame = frameStateUtil.getActiveFrame(currentWindow) || Immutable.Map()
    const currentWindowId = getCurrentWindowId()

    const props = {}
    // used in renderer
    props.showOnlyFavicon = bookmarkUtil.showOnlyFavicon()
    props.showFavicon = bookmarkUtil.showFavicon()
    props.shouldAllowWindowDrag = windowState.shouldAllowWindowDrag(state, currentWindow, activeFrame, isFocused(state)) &&
      !isWindows
    props.visibleBookmarks = bookmarkToolbarState.getToolbar(state, currentWindowId)
    props.hiddenBookmarks = bookmarkToolbarState.getOther(state, currentWindowId)

    // used in other functions
    props.activeFrameKey = activeFrame.get('key')
    props.title = activeFrame.get('title')
    props.location = activeFrame.get('location')

    return props
  }

  render () {
    this.bookmarkRefs = []
    return <div className={css(
      styles.bookmarksToolbar,
      this.props.shouldAllowWindowDrag && styles.bookmarksToolbar_allowDragging,
      this.props.showOnlyFavicon && styles.bookmarksToolbar_showOnlyFavicon
    )}
      data-test-id='bookmarksToolbar'
      onDrop={this.onDrop}
      onDragEnter={this.onDragEnter}
      onDragOver={this.onDragOver}
      onContextMenu={this.onContextMenu}
    >
      {
          this.props.visibleBookmarks.map((bookmarkKey, i) =>
            <BookmarkToolbarButton
              ref={(node) => this.bookmarkRefs.push(node)}
              key={`toolbar-button-${i}`}
              bookmarkKey={bookmarkKey}
            />)
      }
      {
        this.props.hiddenBookmarks.size !== 0
        ? <BrowserButton
          bookmarksOverflowIndicator
          iconOnly
          size='14px'
          iconClass={globalStyles.appIcons.angleDoubleRight}
          onClick={this.onMoreBookmarksMenu}
          custom={styles.bookmarksToolbar__overflowIndicator}
        />
        : null
      }
    </div>
  }
}

const styles = StyleSheet.create({
  bookmarksToolbar: {
    boxSizing: 'border-box',
    display: 'flex',
    flex: 1,
    alignItems: 'center', // to align bookmarksToolbar__overflowIndicator to the center
    padding: `0 ${globalStyles.spacing.bookmarksToolbarPadding}`,
    margin: `${globalStyles.spacing.navbarMenubarMargin} 0`
  },

  bookmarksToolbar_allowDragging: {
    WebkitAppRegion: 'drag'
  },

  bookmarksToolbar_showOnlyFavicon: {
    padding: `0 0 0 ${globalStyles.spacing.bookmarksToolbarPadding}`
  },

  bookmarksToolbar__overflowIndicator: {
    margin: '0 5px 0 auto'
  }
})

module.exports = ReduxComponent.connect(BookmarksToolbar)
