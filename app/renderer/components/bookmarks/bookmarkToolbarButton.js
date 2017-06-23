/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const ReactDOM = require('react-dom')
const Immutable = require('immutable')
const {StyleSheet, css} = require('aphrodite/no-important')

// Components
const ReduxComponent = require('../reduxComponent')

// Actions
const windowActions = require('../../../../js/actions/windowActions')
const appActions = require('../../../../js/actions/appActions')
const bookmarkActions = require('../../../../js/actions/bookmarkActions')

// Store
const windowStore = require('../../../../js/stores/windowStore')

// Constants
const dragTypes = require('../../../../js/constants/dragTypes')
const {iconSize} = require('../../../../js/constants/config')
const {bookmarksToolbarMode} = require('../../../common/constants/settingsEnums')
const settings = require('../../../../js/constants/settings')

// Utils
const siteUtil = require('../../../../js/state/siteUtil')
const {getCurrentWindowId} = require('../../currentWindow')
const dnd = require('../../../../js/dnd')
const cx = require('../../../../js/lib/classSet')
const {getSetting} = require('../../../../js/settings')
const frameStateUtil = require('../../../../js/state/frameStateUtil')
const contextMenus = require('../../../../js/contextMenus')
const bookmarkUtil = require('../../../common/lib/bookmarkUtil')

// Styles
const globalStyles = require('../styles/global')

class BookmarkToolbarButton extends React.Component {
  constructor (props) {
    super(props)
    this.onClick = this.onClick.bind(this)
    this.onAuxClick = this.onAuxClick.bind(this)
    this.onMouseOver = this.onMouseOver.bind(this)
    this.onDragStart = this.onDragStart.bind(this)
    this.onDragEnd = this.onDragEnd.bind(this)
    this.onDragEnter = this.onDragEnter.bind(this)
    this.onDragLeave = this.onDragLeave.bind(this)
    this.onDragOver = this.onDragOver.bind(this)
    this.onContextMenu = this.onContextMenu.bind(this)
    this.openContextMenu = this.openContextMenu.bind(this)
    this.clickBookmarkItem = this.clickBookmarkItem.bind(this)
    this.showBookmarkFolderMenu = this.showBookmarkFolderMenu.bind(this)
  }

  componentDidMount () {
    this.bookmarkNode.addEventListener('auxclick', this.onAuxClick)
  }

  get activeFrame () {
    return windowStore.getFrame(this.props.activeFrameKey)
  }

  onAuxClick (e) {
    if (e.button === 1) {
      this.onClick(e)
    }
  }

  onClick (e) {
    if (!this.clickBookmarkItem(e) && this.props.isFolder) {
      if (this.props.contextMenuDetail) {
        windowActions.setContextMenuDetail()
        return
      }

      e.target = ReactDOM.findDOMNode(this)
      this.showBookmarkFolderMenu(e)
    }
  }

  onMouseOver (e) {
    // Behavior when a bookmarks toolbar folder has its list expanded
    if (this.props.selectedFolderId) {
      if (this.props.isFolder && this.props.selectedFolderId !== this.props.folderId) {
        // Auto-expand the menu if user mouses over another folder
        e.target = ReactDOM.findDOMNode(this)
        this.showBookmarkFolderMenu(e)
      } else if (!this.props.isFolder && this.props.selectedFolderId !== -1) {
        // Hide the currently expanded menu if user mouses over a non-folder
        windowActions.setBookmarksToolbarSelectedFolderId(-1)
        windowActions.setContextMenuDetail()
      }
    }
  }

  onDragStart (e) {
    dnd.onDragStart(dragTypes.BOOKMARK, this.props.bookmark, e)
  }

  onDragEnd (e) {
    dnd.onDragEnd(dragTypes.BOOKMARK, this.props.bookmark, e)
  }

  onDragEnter (e) {
    // Bookmark specific DND code to expand hover when on a folder item
    if (this.props.isFolder) {
      e.target = ReactDOM.findDOMNode(this)
      if (dnd.isMiddle(e.target, e.clientX)) {
        this.showBookmarkFolderMenu(e)
        appActions.draggedOver({
          draggingOverKey: this.props.bookmark,
          draggingOverType: dragTypes.BOOKMARK,
          draggingOverWindowId: getCurrentWindowId(),
          expanded: true
        })
      }
    }
  }

  onDragLeave () {
    // Bookmark specific DND code to expand hover when on a folder item
    if (this.props.isFolder) {
      appActions.draggedOver({
        draggingOverKey: this.props.bookmark,
        draggingOverType: dragTypes.BOOKMARK,
        draggingOverWindowId: getCurrentWindowId(),
        expanded: false
      })
    }
  }

  onDragOver (e) {
    dnd.onDragOver(
      dragTypes.BOOKMARK,
      this.bookmarkNode.getBoundingClientRect(),
      this.props.bookmark,
      this.props.draggingOverData,
      e
    )
  }

  onContextMenu (e) {
    this.openContextMenu(e)
  }

  openContextMenu (e) {
    contextMenus.onSiteDetailContextMenu(this.props.bookmark, this.activeFrame, e)
  }

  clickBookmarkItem (e) {
    return bookmarkActions.clickBookmarkItem(this.props.bookmarks, this.props.bookmark, this.activeFrame, e)
  }

  showBookmarkFolderMenu (e) {
    windowActions.setBookmarksToolbarSelectedFolderId(this.props.folderId)
    contextMenus.onShowBookmarkFolderMenu(this.props.bookmarks, this.props.bookmark, this.activeFrame, e)
  }

  mergeProps (state, ownProps) {
    const currentWindow = state.get('currentWindow')
    const activeFrame = frameStateUtil.getActiveFrame(currentWindow) || Immutable.Map()
    const btbMode = getSetting(settings.BOOKMARKS_TOOLBAR_MODE)
    const bookmark = ownProps.bookmark
    const draggingOverData = bookmarkUtil.getDNDBookmarkData(state, bookmark)

    const props = {}
    // used in renderer
    props.showFavicon = btbMode === bookmarksToolbarMode.TEXT_AND_FAVICONS ||
      btbMode === bookmarksToolbarMode.FAVICONS_ONLY
    props.showOnlyFavicon = btbMode === bookmarksToolbarMode.FAVICONS_ONLY
    props.favIcon = bookmark.get('favicon')
    props.title = bookmark.get('customTitle', bookmark.get('title'))
    props.location = bookmark.get('location')
    props.isFolder = siteUtil.isFolder(bookmark)
    props.isDraggingOverLeft = draggingOverData.get('draggingOverLeftHalf', false)
    props.isDraggingOverRight = draggingOverData.get('draggingOverRightHalf', false)
    props.isExpanded = draggingOverData.get('expanded', false)
    props.isDragging = Immutable.is(dnd.getInterBraveDragData(), bookmark)

    // used in other function
    props.bookmark = bookmark // TODO (nejc) only primitives
    props.bookmarks = siteUtil.getBookmarks(state.get('sites')) // TODO (nejc) only primitives
    props.contextMenuDetail = currentWindow.get('contextMenuDetail') // TODO (nejc) only primitives
    props.draggingOverData = draggingOverData // TODO (nejc) only primitives
    props.activeFrameKey = activeFrame.get('key')
    props.selectedFolderId = currentWindow.getIn(['ui', 'bookmarksToolbar', 'selectedFolderId'])
    props.folderId = bookmark.get('folderId')

    return props
  }

  render () {
    let showingFavicon = this.props.showFavicon
    let iconStyle = {
      minWidth: iconSize,
      width: iconSize
    }

    if (showingFavicon) {
      if (this.props.favIcon) {
        iconStyle = Object.assign(iconStyle, {
          backgroundImage: `url(${this.props.favIcon})`,
          backgroundSize: iconSize,
          height: iconSize
        })
      } else if (!this.props.isFolder) {
        showingFavicon = false
      }
    }

    let hoverTitle = this.props.title
    if (!this.props.isFolder) {
      hoverTitle = this.props.title
        ? this.props.title + '\n' + this.props.location
        : this.props.location
    }

    return <span
      className={css(
        styles.bookmarkToolbarButton,
        (this.props.isDraggingOverLeft && !this.props.isExpanded && !this.props.isDragging) && styles.bookmarkToolbarButton__draggingOverLeft,
        (this.props.isDraggingOverRight && !this.props.isExpanded && !this.props.isDragging) && styles.bookmarkToolbarButton__draggingOverRight,
        this.props.isDragging && styles.bookmarkToolbarButton__isDragging,
        (this.props.showFavicon && this.props.showOnlyFavicon) && styles.bookmarkToolbarButton__showOnlyFavicon
      )}
      data-test-id='bookmarkToolbarButton'
      draggable
      ref={(node) => { this.bookmarkNode = node }}
      title={hoverTitle}
      onClick={this.onClick}
      onMouseOver={this.onMouseOver}
      onDragStart={this.onDragStart}
      onDragEnd={this.onDragEnd}
      onDragEnter={this.onDragEnter}
      onDragLeave={this.onDragLeave}
      onDragOver={this.onDragOver}
      onContextMenu={this.onContextMenu}>
      {
        this.props.isFolder && this.props.showFavicon
          ? <span className={cx({
            fa: true,
            'fa-folder-o': true,
            [css(styles.bookmarkToolbarButton__bookmarkFavicon)]: true,
            [css(styles.bookmarkToolbarButton__bookmarkFolder)]: true
          })}
            data-test-id='bookmarkFavicon'
            style={iconStyle} />
          : null
      }
      {
        // Fill in a favicon if we want one but there isn't one
        !this.props.isFolder && this.props.showFavicon && !showingFavicon
          ? <span className={cx({
            bookmarkFile: true,
            fa: true,
            'fa-file-o': true,
            [css(styles.bookmarkToolbarButton__bookmarkFavicon)]: true,
            [css(styles.bookmarkToolbarButton__bookmarkFile)]: true,
            [css(this.props.showOnlyFavicon && styles.bookmarkToolbarButton__marginRightZero)]: true
          })}
            data-test-id='bookmarkFavicon'
            style={iconStyle} />
          : null
      }
      {
        !this.props.isFolder && showingFavicon
          ? <span className={css(
              styles.bookmarkToolbarButton__bookmarkFavicon,
              this.props.showOnlyFavicon && styles.bookmarkToolbarButton__marginRightZero
            )}
            data-test-id='bookmarkFavicon'
            style={iconStyle} />
          : null
      }
      <span className={css(styles.bookmarkToolbarButton__bookmarkText)} data-test-id='bookmarkText'>
        {
          (this.props.isFolder ? false : (this.props.showFavicon && this.props.showOnlyFavicon))
            ? ''
            : this.props.title || this.props.location
        }
      </span>
      {
        this.props.isFolder
          ? <span className={cx({
            fa: true,
            'fa-chevron-down': true,
            [css(styles.bookmarkToolbarButton__bookmarkFolderChevron)]: true
          })}
            data-test-id='bookmarkFolderChevron' />
          : null
      }
    </span>
  }
}

module.exports = ReduxComponent.connect(BookmarkToolbarButton)

const bookmarkItemMaxWidth = '100px'
const bookmarkItemPadding = '4px'
const bookmarkItemMargin = '3px'
const bookmarkItemChevronMargin = '4px'
const bookmarkToolbarButtonDraggingMargin = '25px'

const styles = StyleSheet.create({
  bookmarkToolbarButton: {
    display: 'flex',
    alignItems: 'center',
    boxSizing: 'border-box',
    borderRadius: '3px',
    color: globalStyles.color.mediumGray,
    cursor: 'default',
    fontSize: '11px',
    lineHeight: '1.3',
    margin: `auto ${bookmarkItemMargin}`,
    maxWidth: bookmarkItemMaxWidth,
    padding: `2px ${bookmarkItemPadding}`,
    textOverflow: 'ellipsis',
    userSelect: 'none',
    whiteSpace: 'nowrap',
    WebkitAppRegion: 'no-drag',

    ':hover': {
      background: '#fff',
      boxShadow: '0 1px 5px 0 rgba(0, 0, 0, 0.1)'
    }
  },
  bookmarkToolbarButton__draggingOverLeft: {
    paddingLeft: bookmarkToolbarButtonDraggingMargin
  },
  bookmarkToolbarButton__draggingOverRight: {
    paddingRight: bookmarkToolbarButtonDraggingMargin
  },
  bookmarkToolbarButton__isDragging: {
    opacity: '0.2'
  },
  bookmarkToolbarButton__showOnlyFavicon: {
    padding: '2px 4px',
    margin: 'auto 0'
  },
  bookmarkToolbarButton__marginRightZero: {
    marginRight: 0
  },
  bookmarkToolbarButton__bookmarkFavicon: {
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    display: 'inline-block',
    marginRight: '4px'
  },
  bookmarkToolbarButton__bookmarkFolder: {
    fontSize: globalStyles.spacing.bookmarksFolderIconSize,
    textAlign: 'center',
    color: globalStyles.color.darkGray
  },
  bookmarkToolbarButton__bookmarkFile: {
    fontSize: globalStyles.spacing.bookmarksFileIconSize,
    textAlign: 'center',
    color: globalStyles.color.darkGray
  },
  bookmarkToolbarButton__bookmarkText: {
    textOverflow: 'ellipsis',
    overflow: 'hidden'
  },
  bookmarkToolbarButton__bookmarkFolderChevron: {
    color: '#676767',
    fontSize: '8px',
    marginLeft: bookmarkItemChevronMargin
  }
})
