/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const ReactDOM = require('react-dom')
const Immutable = require('immutable')
const {StyleSheet, css} = require('aphrodite/no-important')

// Components
const ImmutableComponent = require('../immutableComponent')

// Actions
const windowActions = require('../../../../js/actions/windowActions')
const appActions = require('../../../../js/actions/appActions')

// Store
const windowStore = require('../../../../js/stores/windowStore')

// Constants
const siteTags = require('../../../../js/constants/siteTags')
const dragTypes = require('../../../../js/constants/dragTypes')
const {iconSize} = require('../../../../js/constants/config')

// Utils
const siteUtil = require('../../../../js/state/siteUtil')
const {getCurrentWindowId} = require('../../currentWindow')
const dnd = require('../../../../js/dnd')
const cx = require('../../../../js/lib/classSet')

// Styles
const globalStyles = require('../styles/global')

class BookmarkToolbarButton extends ImmutableComponent {
  constructor () {
    super()
    this.onClick = this.onClick.bind(this)
    this.onMouseOver = this.onMouseOver.bind(this)
    this.onDragStart = this.onDragStart.bind(this)
    this.onDragEnd = this.onDragEnd.bind(this)
    this.onDragEnter = this.onDragEnter.bind(this)
    this.onDragLeave = this.onDragLeave.bind(this)
    this.onDragOver = this.onDragOver.bind(this)
    this.onContextMenu = this.onContextMenu.bind(this)
  }
  componentDidMount () {
    this.bookmarkNode.addEventListener('auxclick', this.onAuxClick.bind(this))
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
    if (!this.props.clickBookmarkItem(this.props.bookmark, e) &&
      this.props.bookmark.get('tags').includes(siteTags.BOOKMARK_FOLDER)) {
      if (this.props.contextMenuDetail) {
        windowActions.setContextMenuDetail()
        return
      }
      e.target = ReactDOM.findDOMNode(this)
      this.props.showBookmarkFolderMenu(this.props.bookmark, e)
    }
  }

  onMouseOver (e) {
    // Behavior when a bookmarks toolbar folder has its list expanded
    if (this.props.selectedFolderId) {
      if (this.isFolder && this.props.selectedFolderId !== this.props.bookmark.get('folderId')) {
        // Auto-expand the menu if user mouses over another folder
        e.target = ReactDOM.findDOMNode(this)
        this.props.showBookmarkFolderMenu(this.props.bookmark, e)
      } else if (!this.isFolder && this.props.selectedFolderId !== -1) {
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
    if (this.isFolder) {
      e.target = ReactDOM.findDOMNode(this)
      if (dnd.isMiddle(e.target, e.clientX)) {
        this.props.showBookmarkFolderMenu(this.props.bookmark, e)
        appActions.draggedOver({
          draggingOverKey: this.props.bookmark,
          draggingOverType: dragTypes.BOOKMARK,
          draggingOverWindowId: getCurrentWindowId(),
          expanded: true
        })
      }
    }
  }

  onDragLeave (e) {
    // Bookmark specific DND code to expand hover when on a folder item
    if (this.isFolder) {
      appActions.draggedOver({
        draggingOverKey: this.props.bookmark,
        draggingOverType: dragTypes.BOOKMARK,
        draggingOverWindowId: getCurrentWindowId(),
        expanded: false
      })
    }
  }

  onDragOver (e) {
    dnd.onDragOver(dragTypes.BOOKMARK, this.bookmarkNode.getBoundingClientRect(), this.props.bookmark, this.draggingOverData, e)
  }

  get draggingOverData () {
    if (!this.props.draggingOverData ||
      !Immutable.is(this.props.draggingOverData.get('draggingOverKey'), this.props.bookmark)) {
      return
    }

    return this.props.draggingOverData
  }

  get isDragging () {
    return Immutable.is(this.props.bookmark, dnd.getInterBraveDragData())
  }

  get isDraggingOverLeft () {
    if (!this.draggingOverData) {
      return false
    }
    return this.draggingOverData.get('draggingOverLeftHalf')
  }

  get isExpanded () {
    if (!this.props.draggingOverData) {
      return false
    }
    return this.props.draggingOverData.get('expanded')
  }

  get isDraggingOverRight () {
    if (!this.draggingOverData) {
      return false
    }
    return this.draggingOverData.get('draggingOverRightHalf')
  }

  get isFolder () {
    return siteUtil.isFolder(this.props.bookmark)
  }

  onContextMenu (e) {
    this.props.openContextMenu(this.props.bookmark, e)
  }

  render () {
    let showingFavicon = this.props.showFavicon
    let iconStyle = {
      minWidth: iconSize,
      width: iconSize
    }

    if (showingFavicon) {
      let icon = this.props.bookmark.get('favicon')

      if (icon) {
        iconStyle = Object.assign(iconStyle, {
          backgroundImage: `url(${icon})`,
          backgroundSize: iconSize,
          height: iconSize
        })
      } else if (!this.isFolder) {
        showingFavicon = false
      }
    }

    const siteDetailTitle = this.props.bookmark.get('customTitle') || this.props.bookmark.get('title')
    const siteDetailLocation = this.props.bookmark.get('location')
    let hoverTitle
    if (this.isFolder) {
      hoverTitle = siteDetailTitle
    } else {
      hoverTitle = siteDetailTitle
        ? siteDetailTitle + '\n' + siteDetailLocation
        : siteDetailLocation
    }

    return <span
      className={css(
        styles.bookmarkToolbarButton,
        (this.isDraggingOverLeft && !this.isExpanded && !this.isDragging) && styles.bookmarkToolbarButton__draggingOverLeft,
        (this.isDraggingOverRight && !this.isExpanded && !this.isDragging) && styles.bookmarkToolbarButton__draggingOverRight,
        this.isDragging && styles.bookmarkToolbarButton__isDragging,
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
        this.isFolder && this.props.showFavicon
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
        !this.isFolder && this.props.showFavicon && !showingFavicon
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
        !this.isFolder && showingFavicon
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
          (this.isFolder ? false : (this.props.showFavicon && this.props.showOnlyFavicon))
            ? ''
            : siteDetailTitle || siteDetailLocation
        }
      </span>
      {
        this.isFolder
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

module.exports = BookmarkToolbarButton

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
