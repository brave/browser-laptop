/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const ReactDOM = require('react-dom')
const ImmutableComponent = require('../../../js/components/immutableComponent')
const contextMenus = require('../../../js/contextMenus')
const windowActions = require('../../../js/actions/windowActions')
const bookmarkActions = require('../../../js/actions/bookmarkActions')
const appActions = require('../../../js/actions/appActions')
const siteTags = require('../../../js/constants/siteTags')
const siteUtil = require('../../../js/state/siteUtil')
const dragTypes = require('../../../js/constants/dragTypes')
const Button = require('../../../js/components/button')
const cx = require('../../../js/lib/classSet')
const dnd = require('../../../js/dnd')
const dndData = require('../../../js/dndData')
const calculateTextWidth = require('../../../js/lib/textCalculator').calculateTextWidth
const windowStore = require('../../../js/stores/windowStore')
const iconSize = require('../../common/lib/faviconUtil').iconSize

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
  get activeFrame () {
    return windowStore.getFrame(this.props.activeFrameKey)
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
      return
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
        e.target.getBoundingClientRect
        this.props.showBookmarkFolderMenu(this.props.bookmark, e)
        windowActions.setIsBeingDraggedOverDetail(dragTypes.BOOKMARK, this.props.bookmark, {
          expanded: true
        })
      }
    }
  }

  onDragLeave (e) {
    // Bookmark specific DND code to expand hover when on a folder item
    if (this.isFolder) {
      windowActions.setIsBeingDraggedOverDetail(dragTypes.BOOKMARK, this.props.bookmark, {
        expanded: false
      })
    }
  }

  onDragOver (e) {
    dnd.onDragOver(dragTypes.BOOKMARK, this.bookmarkNode.getBoundingClientRect(), this.props.bookmark, this.draggingOverData, e)
  }

  get draggingOverData () {
    if (!this.props.draggingOverData ||
        this.props.draggingOverData.get('dragOverKey') !== this.props.bookmark) {
      return
    }

    return this.props.draggingOverData
  }

  get isDragging () {
    return this.props.bookmark === dnd.getInProcessDragData()
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
      className={cx({
        bookmarkToolbarButton: true,
        draggingOverLeft: this.isDraggingOverLeft && !this.isExpanded,
        draggingOverRight: this.isDraggingOverRight && !this.isExpanded,
        isDragging: this.isDragging,
        showOnlyFavicon: this.props.showFavicon && this.props.showOnlyFavicon
      })}
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
        ? <span className='bookmarkFavicon bookmarkFolder fa fa-folder-o' style={iconStyle} />
        : null
      }
      {
        // Fill in a favicon if we want one but there isn't one
        !this.isFolder && this.props.showFavicon && !showingFavicon
        ? <span className='bookmarkFavicon bookmarkFile fa fa-file-o' style={iconStyle} />
        : null
      }
      {
        !this.isFolder && showingFavicon ? <span className='bookmarkFavicon' style={iconStyle} /> : null
      }
      <span className='bookmarkText'>
        {
          (this.isFolder ? false : (this.props.showFavicon && this.props.showOnlyFavicon))
          ? ''
          : siteDetailTitle || siteDetailLocation
        }
      </span>
      {
        this.isFolder
        ? <span className='bookmarkFolderChevron fa fa-chevron-down' />
        : null
      }
    </span>
  }
}

class BookmarksToolbar extends ImmutableComponent {
  constructor () {
    super()
    this.onDrop = this.onDrop.bind(this)
    this.onDragEnter = this.onDragEnter.bind(this)
    this.onDragOver = this.onDragOver.bind(this)
    this.onContextMenu = this.onContextMenu.bind(this)
    this.onMoreBookmarksMenu = this.onMoreBookmarksMenu.bind(this)
    this.openContextMenu = this.openContextMenu.bind(this)
    this.clickBookmarkItem = this.clickBookmarkItem.bind(this)
    this.showBookmarkFolderMenu = this.showBookmarkFolderMenu.bind(this)
  }
  get activeFrame () {
    return windowStore.getFrame(this.props.activeFrameKey)
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
        return !siteUtil.isEquivalent(bookmarkRef.props.bookmark, bookmark)
      }), e.clientX)
      if (droppedOn.selectedRef) {
        const isLeftSide = dnd.isLeftSide(ReactDOM.findDOMNode(droppedOn.selectedRef), e.clientX)
        const droppedOnSiteDetail = droppedOn.selectedRef.props.bookmark || droppedOn.selectedRef.props.bookmarkFolder
        appActions.moveSite(bookmark, droppedOnSiteDetail, isLeftSide, droppedOnSiteDetail.get('tags').includes(siteTags.BOOKMARK_FOLDER) && droppedOn && droppedOn.isDroppedOn)
        windowActions.setIsBeingDraggedOverDetail()
      }
      return
    }
    const droppedHTML = e.dataTransfer.getData('text/html')
    if (droppedHTML) {
      var parser = new window.DOMParser()
      var doc = parser.parseFromString(droppedHTML, 'text/html')
      var a = doc.querySelector('a')
      if (a && a.href) {
        appActions.addSite({
          title: a.innerText,
          location: e.dataTransfer.getData('text/plain')
        }, siteTags.BOOKMARK)
        return
      }
    }
    if (e.dataTransfer.files.length > 0) {
      Array.from(e.dataTransfer.files).forEach((file) =>
        appActions.addSite({ location: file.path, title: file.name }, siteTags.BOOKMARK))
      return
    }

    e.dataTransfer.getData('text/uri-list')
      .split('\n')
      .map((x) => x.trim())
      .filter((x) => !x.startsWith('#') && x.length > 0)
      .forEach((url) =>
        appActions.addSite({ location: url }, siteTags.BOOKMARK))
  }
  openContextMenu (bookmark, e) {
    contextMenus.onSiteDetailContextMenu(bookmark, this.activeFrame, e)
  }
  clickBookmarkItem (bookmark, e) {
    return bookmarkActions.clickBookmarkItem(this.bookmarks, bookmark, this.activeFrame, e)
  }
  showBookmarkFolderMenu (bookmark, e) {
    windowActions.setBookmarksToolbarSelectedFolderId(bookmark.get('folderId'))
    contextMenus.onShowBookmarkFolderMenu(this.bookmarks, bookmark, this.activeFrame, e)
  }
  updateBookmarkData (props) {
    this.bookmarks = siteUtil.getBookmarks(props.sites)

    const noParentItems = this.bookmarks
      .filter((bookmark) => !bookmark.get('parentFolderId'))
    let widthAccountedFor = 0
    const overflowButtonWidth = 25

    // Dynamically calculate how many bookmark items should appear on the toolbar
    // before it is actually rendered.
    if (!this.root) {
      this.root = window.getComputedStyle(document.querySelector(':root'))
      this.maxWidth = Number.parseInt(this.root.getPropertyValue('--bookmark-item-max-width'), 10)
      this.padding = Number.parseInt(this.root.getPropertyValue('--bookmark-item-padding'), 10) * 2
      // Toolbar padding is only on the left
      this.toolbarPadding = Number.parseInt(this.root.getPropertyValue('--bookmarks-toolbar-padding'), 10)
      this.bookmarkItemMargin = Number.parseInt(this.root.getPropertyValue('--bookmark-item-margin'), 10) * 2
      // No margin for show only favicons
      this.chevronMargin = Number.parseInt(this.root.getPropertyValue('--bookmark-item-chevron-margin'), 10)
      this.fontSize = this.root.getPropertyValue('--bookmark-item-font-size')
      this.fontFamily = this.root.getPropertyValue('--default-font-family')
      this.chevronWidth = this.chevronMargin + Number.parseInt(this.fontSize)
    }
    const margin = props.showFavicon && props.showOnlyFavicon ? 0 : this.bookmarkItemMargin
    widthAccountedFor += this.toolbarPadding

    // Loop through until we fill up the entire bookmark toolbar width
    let i
    let noParentItemsList = noParentItems.toList()
    for (i = 0; i < noParentItemsList.size; i++) {
      let iconWidth = props.showFavicon ? iconSize : 0
      // font-awesome file icons are 3px smaller
      if (props.showFavicon && !noParentItemsList.getIn([i, 'folderId']) && !noParentItemsList.getIn([i, 'favicon'])) {
        iconWidth -= 3
      }
      const chevronWidth = props.showFavicon && noParentItemsList.getIn([i, 'folderId']) ? this.chevronWidth : 0
      if (props.showFavicon && props.showOnlyFavicon) {
        widthAccountedFor += this.padding + iconWidth + chevronWidth
      } else {
        const text = noParentItemsList.getIn([i, 'customTitle']) || noParentItemsList.getIn([i, 'title']) || noParentItemsList.getIn([i, 'location'])
        widthAccountedFor += Math.min(calculateTextWidth(text, `${this.fontSize} ${this.fontFamily}`) + this.padding + iconWidth + chevronWidth, this.maxWidth)
      }
      widthAccountedFor += margin
      if (widthAccountedFor >= props.windowWidth - overflowButtonWidth) {
        break
      }
    }
    this.bookmarksForToolbar = noParentItems.take(i).sort(siteUtil.siteSort)
    // Show at most 100 items in the overflow menu
    this.overflowBookmarkItems = noParentItems.skip(i).take(100).sort(siteUtil.siteSort)
  }
  componentWillMount () {
    this.updateBookmarkData(this.props)
  }
  componentWillUpdate (nextProps) {
    if (nextProps.sites !== this.props.sites ||
        nextProps.windowWidth !== this.props.windowWidth ||
        nextProps.showFavicon !== this.props.showFavicon ||
        nextProps.showOnlyFavicon !== this.props.showOnlyFavicon) {
      this.updateBookmarkData(nextProps)
    }
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
    // console.log(e.dataTransfer.types, e.dataTransfer.getData('text/plain'), e.dataTransfer.getData('text/uri-list'), e.dataTransfer.getData('text/html'))
    let intersection = e.dataTransfer.types.filter((x) =>
      ['text/plain', 'text/uri-list', 'text/html', 'Files'].includes(x))
    if (intersection.length > 0) {
      e.dataTransfer.dropEffect = 'copy'
      e.preventDefault()
    }
  }
  onMoreBookmarksMenu (e) {
    contextMenus.onMoreBookmarksMenu(this.activeFrame, this.bookmarks, this.overflowBookmarkItems, e)
  }
  onContextMenu (e) {
    const closest = dnd.closestFromXOffset(this.bookmarkRefs.filter((x) => !!x), e.clientX).selectedRef
    contextMenus.onTabsToolbarContextMenu(this.activeFrame, closest && closest.props.bookmark || undefined, closest && closest.isDroppedOn, e)
  }
  render () {
    let showFavicon = this.props.showFavicon
    let showOnlyFavicon = this.props.showOnlyFavicon

    this.bookmarkRefs = []
    return <div
      className={
        cx({
          bookmarksToolbar: true,
          allowDragging: this.props.shouldAllowWindowDrag,
          showFavicon,
          showOnlyFavicon
        })
      }
      onDrop={this.onDrop}
      onDragEnter={this.onDragEnter}
      onDragOver={this.onDragOver}
      onContextMenu={this.onContextMenu}>
      {
          this.bookmarksForToolbar.map((bookmark, i) =>
            <BookmarkToolbarButton
              ref={(node) => this.bookmarkRefs.push(node)}
              key={i}
              contextMenuDetail={this.props.contextMenuDetail}
              activeFrameKey={this.props.activeFrameKey}
              draggingOverData={this.props.draggingOverData}
              openContextMenu={this.openContextMenu}
              clickBookmarkItem={this.clickBookmarkItem}
              showBookmarkFolderMenu={this.showBookmarkFolderMenu}
              bookmark={bookmark}
              showFavicon={this.props.showFavicon}
              showOnlyFavicon={this.props.showOnlyFavicon}
              selectedFolderId={this.props.selectedFolderId} />)
      }
      {
        this.overflowBookmarkItems.size !== 0
        ? <Button iconClass='overflowIndicator fa-angle-double-right'
          onClick={this.onMoreBookmarksMenu}
          className='bookmarkButton' />
        : null
      }
    </div>
  }
}

module.exports = BookmarksToolbar
