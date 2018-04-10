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

// State
const bookmarksState = require('../../../common/state/bookmarksState')

// Constants
const dragTypes = require('../../../../js/constants/dragTypes')
const {iconSize} = require('../../../../js/constants/config')
const siteTags = require('../../../../js/constants/siteTags')

// Utils
const {getCurrentWindowId} = require('../../currentWindow')
const dnd = require('../../../../js/dnd')
const cx = require('../../../../js/lib/classSet')
const frameStateUtil = require('../../../../js/state/frameStateUtil')
const bookmarkUtil = require('../../../common/lib/bookmarkUtil')
const bookmarkFoldersUtil = require('../../../common/lib/bookmarkFoldersUtil')

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
    dnd.onDragStart(dragTypes.BOOKMARK, Immutable.fromJS({
      location: this.props.location,
      title: this.props.title,
      key: this.props.bookmarkKey,
      type: this.props.isFolder ? siteTags.BOOKMARK_FOLDER : siteTags.BOOKMARK
    }), e)
  }

  onDragEnd () {
    dnd.onDragEnd()
  }

  onDragEnter (e) {
    // Bookmark specific DND code to expand hover when on a folder item
    if (this.props.isFolder) {
      e.target = ReactDOM.findDOMNode(this)
      if (dnd.isMiddle(e.target, e.clientX)) {
        this.showBookmarkFolderMenu(e)
        appActions.draggedOver({
          draggingOverKey: this.props.bookmarkKey,
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
        draggingOverKey: this.props.bookmarkKey,
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
      this.props.bookmarkKey,
      Immutable.fromJS({
        draggingOverLeftHalf: this.props.isDraggingOverLeft,
        draggingOverRightHalf: this.props.isDraggingOverRight
      }),
      e
    )
  }

  onContextMenu (e) {
    this.openContextMenu(e)
  }

  openContextMenu (e) {
    if (e) {
      e.stopPropagation()
    }
    windowActions.onSiteDetailMenu(this.props.bookmarkKey, this.props.isFolder ? siteTags.BOOKMARK_FOLDER : siteTags.BOOKMARK)
  }

  clickBookmarkItem (e) {
    return bookmarkActions.clickBookmarkItem(this.props.bookmarkKey, this.props.tabId, this.props.isFolder, e)
  }

  showBookmarkFolderMenu (e) {
    const rectLeft = e.target.getBoundingClientRect()
    const rectBottom = e.target.parentNode.getBoundingClientRect()
    const left = (rectLeft.left | 0) - 2
    const top = (rectBottom.bottom | 0) - 1

    if (e && e.stopPropagation) {
      e.stopPropagation()
    }

    // TODO merge this two actions into one
    windowActions.onShowBookmarkFolderMenu(this.props.bookmarkKey, left, top)
    windowActions.setBookmarksToolbarSelectedFolderId(this.props.folderId)
  }

  mergeProps (state, ownProps) {
    const currentWindow = state.get('currentWindow')
    const activeFrame = frameStateUtil.getActiveFrame(currentWindow) || Immutable.Map()
    const bookmarkKey = ownProps.bookmarkKey
    let bookmark = bookmarksState.findBookmark(state, bookmarkKey)

    const draggingOverData = bookmarkUtil.getDNDBookmarkData(state, bookmarkKey)

    const props = {}
    // used in renderer
    props.showFavicon = bookmarkUtil.showFavicon()
    props.showOnlyFavicon = bookmarkUtil.showOnlyFavicon()
    props.favIcon = bookmark.get('favicon')
    props.title = bookmark.get('title')
    props.location = bookmark.get('location')
    props.isFolder = bookmarkFoldersUtil.isFolder(bookmark)
    props.isDraggingOverLeft = draggingOverData.get('draggingOverLeftHalf', false)
    props.isDraggingOverRight = draggingOverData.get('draggingOverRightHalf', false)
    props.isExpanded = draggingOverData.get('expanded', false)
    props.isDragging = state.getIn(['dragData', 'data', 'key']) === bookmarkKey

    // used in other function
    props.bookmarkKey = bookmarkKey
    props.activeFrameKey = activeFrame.get('key')
    props.tabId = activeFrame.get('tabId')
    props.contextMenuDetail = currentWindow.has('contextMenuDetail')
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
      data-bookmark-key={this.props.bookmarkKey}
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
            data-test-id='defaultIcon'
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

const styles = StyleSheet.create({
  bookmarkToolbarButton: {
    WebkitAppRegion: 'no-drag',
    boxSizing: 'border-box',
    borderRadius: '3px',
    color: globalStyles.color.mediumGray,
    cursor: 'default',
    fontSize: globalStyles.spacing.bookmarksItemFontSize,
    lineHeight: '1.3',
    // margin-bottom hides the second row of items on the bookmark bar
    margin: `0 ${globalStyles.spacing.bookmarksItemMargin} 0 ${globalStyles.spacing.bookmarksItemMargin}`,
    maxWidth: globalStyles.spacing.bookmarksItemMaxWidth,
    padding: `2px ${globalStyles.spacing.bookmarksItemPadding}`,
    textOverflow: 'ellipsis',
    userSelect: 'none',
    whiteSpace: 'nowrap',
    display: 'flex',
    alignItems: 'center',

    ':hover': {
      background: '#fff',
      boxShadow: '0 1px 5px 0 rgba(0, 0, 0, 0.1)'
    }
  },
  bookmarkToolbarButton__draggingOverLeft: {
    paddingLeft: globalStyles.spacing.bookmarksToolbarButtonDraggingMargin
  },
  bookmarkToolbarButton__draggingOverRight: {
    paddingRight: globalStyles.spacing.bookmarksToolbarButtonDraggingMargin
  },
  bookmarkToolbarButton__isDragging: {
    opacity: '0.2'
  },
  bookmarkToolbarButton__showOnlyFavicon: {
    padding: `2px ${globalStyles.spacing.bookmarksItemPadding}`,
    margin: 'auto 0'
  },
  bookmarkToolbarButton__marginRightZero: {
    marginRight: 0
  },
  bookmarkToolbarButton__bookmarkFavicon: {
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    display: 'inline-block',
    marginRight: globalStyles.spacing.bookmarksItemMargin
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
    fontSize: globalStyles.spacing.bookmarksItemChevronFontSize,
    marginLeft: globalStyles.spacing.bookmarksItemChevronMargin
  }
})
