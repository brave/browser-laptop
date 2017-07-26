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

// Constants
const dragTypes = require('../../../../js/constants/dragTypes')
const siteTags = require('../../../../js/constants/siteTags')

// Utils
const {isFocused} = require('../../currentWindow')
const contextMenus = require('../../../../js/contextMenus')
const cx = require('../../../../js/lib/classSet')
const dnd = require('../../../../js/dnd')
const dndData = require('../../../../js/dndData')
const isWindows = require('../../../common/lib/platformUtil').isWindows()
const frameStateUtil = require('../../../../js/state/frameStateUtil')
const bookmarkUtil = require('../../../common/lib/bookmarkUtil')

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
      // Figure out the droppedOn element filtering out the source drag item
      let droppedOn = dnd.closestFromXOffset(this.bookmarkRefs.filter((bookmarkRef) => {
        if (!bookmarkRef) {
          return false
        }
        return bookmarkRef.props.bookmarkKey !== bookmark.get('key')
      }), e.clientX)
      if (droppedOn.selectedRef) {
        const isRightSide = !dnd.isLeftSide(ReactDOM.findDOMNode(droppedOn.selectedRef), e.clientX)
        const droppedOnKey = droppedOn.selectedRef.props.bookmarkKey
        const isDestinationParent = droppedOn.selectedRef.props.isFolder && droppedOn && droppedOn.isDroppedOn

        if (bookmark.get('type') === siteTags.BOOKMARK_FOLDER) {
          appActions.moveBookmarkFolder(bookmark.get('key'), droppedOnKey, isRightSide, isDestinationParent)
        } else {
          appActions.moveBookmark(bookmark.get('key'), droppedOnKey, isRightSide, isDestinationParent)
        }
        dnd.onDragEnd()
      }
      return
    }

    const droppedHTML = e.dataTransfer.getData('text/html')
    if (droppedHTML) {
      const parser = new window.DOMParser()
      const doc = parser.parseFromString(droppedHTML, 'text/html')
      const a = doc.querySelector('a')
      if (a && a.href) {
        appActions.addBookmark(Immutable.fromJS({
          title: a.innerText,
          location: e.dataTransfer.getData('text/plain')
        }))
        return
      }
    }

    if (e.dataTransfer.files.length > 0) {
      Array.from(e.dataTransfer.items).forEach((item) => {
        item.getAsString((name) => appActions.addBookmark(Immutable.fromJS({
          location: item.type,
          title: name
        })))
      })
      return
    }

    e.dataTransfer.getData('text/uri-list')
      .split('\n')
      .map((x) => x.trim())
      .filter((x) => !x.startsWith('#') && x.length > 0)
      .forEach((url) =>
        appActions.addBookmark(Immutable.fromJS({ location: url })))
  }

  onDragEnter (e) {
    if (dndData.hasDragData(e.dataTransfer, dragTypes.BOOKMARK)) {
      if (Array.from(e.target.classList).includes('overflowIndicator')) {
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
    const bookmarks = bookmarkUtil.getToolbarBookmarks(state)

    const props = {}
    // used in renderer
    props.showOnlyFavicon = bookmarkUtil.showOnlyFavicon()
    props.showFavicon = bookmarkUtil.showFavicon()
    props.shouldAllowWindowDrag = windowState.shouldAllowWindowDrag(state, currentWindow, activeFrame, isFocused()) &&
      !isWindows
    props.visibleBookmarks = bookmarks.visibleBookmarks
    props.hiddenBookmarks = bookmarks.hiddenBookmarks

    // used in other functions
    props.activeFrameKey = activeFrame.get('key')
    props.title = activeFrame.get('title')
    props.location = activeFrame.get('location')

    return props
  }

  render () {
    this.bookmarkRefs = []
    return <div
      className={cx({
        bookmarksToolbar: true,
        showFavicon: this.props.showFavicon,
        showOnlyFavicon: this.props.showOnlyFavicon,
        [css(styles.bookmarksToolbar)]: true,
        [css(this.props.shouldAllowWindowDrag && styles.bookmarksToolbar__allowDragging)]: true,
        [css(styles.bookmarksToolbar__showOnlyFavicon)]: true
      })}
      data-test-id='bookmarksToolbar'
      onDrop={this.onDrop}
      onDragEnter={this.onDragEnter}
      onDragOver={this.onDragOver}
      onContextMenu={this.onContextMenu}>
      {
          this.props.visibleBookmarks.map((bookmarkKey, i) =>
            <BookmarkToolbarButton
              ref={(node) => this.bookmarkRefs.push(node)}
              key={`toolbar-button-${i}`}
              bookmarkKey={bookmarkKey} />)
      }
      {
        this.props.hiddenBookmarks.size !== 0
        ? <BrowserButton
          iconClass={globalStyles.appIcons.angleDoubleRight}
          onClick={this.onMoreBookmarksMenu}
          custom={[
            styles.bookmarksToolbar__bookmarkButton,
            styles.bookmarksToolbar__overflowIndicator
          ]} />
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
    padding: `${globalStyles.spacing.navbarMenubarMargin} ${globalStyles.spacing.bookmarksToolbarPadding}`
  },
  bookmarksToolbar__allowDragging: {
    WebkitAppRegion: 'drag'
  },
  bookmarksToolbar__showOnlyFavicon: {
    padding: `${globalStyles.spacing.navbarMenubarMargin} 0 ${globalStyles.spacing.tabPagesHeight} ${globalStyles.spacing.bookmarksToolbarPadding}`
  },
  bookmarksToolbar__bookmarkButton: {
    boxSizing: 'border-box',
    fontSize: '14px',
    height: 'auto',
    lineHeight: '12px',
    marginLeft: 'auto',
    marginRight: '5px',
    width: 'auto',
    userSelect: 'none'
  },
  bookmarksToolbar__overflowIndicator: {
    paddingLeft: '6px',
    paddingRight: '11px',
    margin: 'auto 0 auto auto',
    WebkitAppRegion: 'no-drag'
  }
})

module.exports = ReduxComponent.connect(BookmarksToolbar)
