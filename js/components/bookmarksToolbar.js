/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const ReactDOM = require('react-dom')
const ImmutableComponent = require('./immutableComponent')
const contextMenus = require('../contextMenus')
const windowActions = require('../actions/windowActions')
const bookmarkActions = require('../actions/bookmarkActions')
const appActions = require('../actions/appActions')
const siteTags = require('../constants/siteTags')
const siteUtil = require('../state/siteUtil')
const dragTypes = require('../constants/dragTypes')
const Button = require('../components/button')
const cx = require('../lib/classSet.js')
const dnd = require('../dnd')
const dndData = require('../dndData')
const settings = require('../constants/settings')
const getSetting = require('../settings').getSetting
const calculateTextWidth = require('../lib/textCalculator').calculateTextWidth

class BookmarkToolbarButton extends ImmutableComponent {
  constructor () {
    super()
    this.onClick = this.onClick.bind(this)
    this.onDragStart = this.onDragStart.bind(this)
    this.onDragEnd = this.onDragEnd.bind(this)
    this.onDragEnter = this.onDragEnter.bind(this)
    this.onDragLeave = this.onDragLeave.bind(this)
    this.onDragOver = this.onDragOver.bind(this)
    this.onContextMenu = this.onContextMenu.bind(this)
  }
  onClick (e) {
    if (!bookmarkActions.clickBookmarkItem(this.props.bookmarks, this.props.bookmark, this.props.activeFrame, e) &&
        this.props.bookmark.get('tags').includes(siteTags.BOOKMARK_FOLDER)) {
      if (this.props.contextMenuDetail) {
        windowActions.setContextMenuDetail()
        return
      }
      e.target = ReactDOM.findDOMNode(this)
      contextMenus.onShowBookmarkFolderMenu(this.props.bookmarks, this.props.bookmark, this.props.activeFrame, e)
      return
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
        contextMenus.onShowBookmarkFolderMenu(this.props.bookmarks, this.props.bookmark, this.props.activeFrame, e)
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
    return this.props.bookmark.get('tags').includes(siteTags.BOOKMARK_FOLDER)
  }

  onContextMenu () {
    contextMenus.onBookmarkContextMenu(this.props.bookmark, this.props.activeFrame)
  }

  render () {
    let showFavicon = getSetting(settings.SHOW_BOOKMARKS_TOOLBAR_FAVICON) === true
    const iconSize = 16
    let iconStyle = {
      minWidth: iconSize,
      width: iconSize
    }

    if (showFavicon) {
      let icon = this.props.bookmark.get('favicon')

      if (icon) {
        iconStyle = Object.assign(iconStyle, {
          backgroundImage: `url(${icon})`,
          backgroundSize: iconSize,
          height: iconSize
        })
      } else {
        showFavicon = false
      }
    }

    return <span
      className={cx({
        bookmarkToolbarButton: true,
        draggingOverLeft: this.isDraggingOverLeft && !this.isExpanded,
        draggingOverRight: this.isDraggingOverRight && !this.isExpanded,
        isDragging: this.isDragging
      })}
      draggable
      ref={(node) => { this.bookmarkNode = node }}
      onClick={this.onClick}
      onDragStart={this.onDragStart}
      onDragEnd={this.onDragEnd}
      onDragEnter={this.onDragEnter}
      onDragLeave={this.onDragLeave}
      onDragOver={this.onDragOver}
      onContextMenu={this.onContextMenu}>
      {
        !this.isFolder && showFavicon ? <span className='bookmarkFavicon' style={iconStyle}></span> : null
      }
      <span className='bookmarkText'>
      {
        this.props.bookmark.get('customTitle') || this.props.bookmark.get('title') || this.props.bookmark.get('location')
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
          location: a.href
        }, siteTags.BOOKMARK)
        return
      }
    }
    if (e.dataTransfer.files) {
      Array.from(e.dataTransfer.files).forEach((file) =>
        appActions.addSite({ location: file.path, title: file.name }, siteTags.BOOKMARK))
      return
    }

    let urls = e.dataTransfer.getData('text/uri-list') ||
      e.dataTransfer.getData('text/plain')
    urls = urls.split('\n')
      .map((x) => x.trim())
      .filter((x) => !x.startsWith('#') && x.length > 0)
      .forEach((url) =>
        appActions.addSite({ location: url }, siteTags.BOOKMARK))
  }
  updateBookmarkData (props) {
    const noParentItems = props.bookmarks
      .filter((bookmark) => !bookmark.get('parentFolderId'))
    let widthAccountedFor = 0
    const overflowButtonWidth = 24

    // Dynamically calculate how many bookmark items should appear on the toolbar
    // before it is actually rendered.
    if (!this.root) {
      this.root = window.getComputedStyle(document.querySelector(':root'))
      this.maxWidth = Number.parseInt(this.root.getPropertyValue('--bookmark-item-max-width'), 10)
      this.padding = Number.parseInt(this.root.getPropertyValue('--bookmark-item-padding'), 10) * 2
      this.margin = Number.parseInt(this.root.getPropertyValue('--bookmark-item-margin'), 10) * 2
      this.fontSize = this.root.getPropertyValue('--bookmark-item-font-size')
      this.fontFamily = this.root.getPropertyValue('--default-font-family')
    }
    const showFavicon = getSetting(settings.SHOW_BOOKMARKS_TOOLBAR_FAVICON) === true

    // Loop through until we fill up the entire bookmark toolbar width
    let i
    for (i = 0; i < noParentItems.size; i++) {
      const iconWidth = showFavicon && noParentItems.getIn([i, 'favicon']) ? 20 : 0
      const text = noParentItems.getIn([i, 'customTitle']) || noParentItems.getIn([i, 'title']) || noParentItems.getIn([i, 'location'])
      widthAccountedFor += Math.min(calculateTextWidth(text, `${this.fontSize} ${this.fontFamily}`) + this.padding + iconWidth, this.maxWidth) + this.margin
      if (widthAccountedFor >= window.innerWidth - overflowButtonWidth) {
        break
      }
    }
    this.bookmarksForToolbar = noParentItems.take(i)
    // Show at most 100 items in the overflow menu
    this.overflowBookmarkItems = noParentItems.skip(i).take(100)
  }
  componentWillMount () {
    this.updateBookmarkData(this.props)
  }
  componentWillUpdate (nextProps) {
    if (nextProps.bookmarks !== this.props.bookmarks ||
        nextProps.windowWidth !== this.props.windowWidth) {
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
    contextMenus.onMoreBookmarksMenu(this.props.activeFrame, this.props.bookmarks, this.overflowBookmarkItems, e)
  }
  onContextMenu (e) {
    const closest = dnd.closestFromXOffset(this.bookmarkRefs.filter((x) => !!x), e.clientX).selectedRef
    contextMenus.onTabsToolbarContextMenu(this.props.activeFrame, closest && closest.props.bookmark || undefined, closest && closest.isDroppedOn, e)
  }
  render () {
    let showFavicon = getSetting(settings.SHOW_BOOKMARKS_TOOLBAR_FAVICON) === true
    this.bookmarkRefs = []
    return <div
      className={
        cx({
          bookmarksToolbar: true,
          allowDragging: this.props.shouldAllowWindowDrag,
          showFavicon
        })
      }
      onDrop={this.onDrop}
      onDragEnter={this.onDragEnter}
      onDragOver={this.onDragOver}
      onContextMenu={this.onContextMenu}>
    {
        this.bookmarksForToolbar.map((bookmark) =>
          <BookmarkToolbarButton
            ref={(node) => this.bookmarkRefs.push(node)}
            contextMenuDetail={this.props.contextMenuDetail}
            draggingOverData={this.props.draggingOverData}
            activeFrame={this.props.activeFrame}
            bookmarks={this.props.bookmarks}
            bookmark={bookmark} />)
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
