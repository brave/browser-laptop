/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const ReactDOM = require('react-dom')
const ImmutableComponent = require('./immutableComponent')
const contextMenus = require('../contextMenus')
const windowActions = require('../actions/windowActions')
const appActions = require('../actions/appActions')
const siteTags = require('../constants/siteTags')
const siteUtil = require('../state/siteUtil')
const dragTypes = require('../constants/dragTypes')
const Button = require('../components/button')
const cx = require('../lib/classSet.js')
const dnd = require('../dnd')
const dndData = require('../dndData')

// TODO: Obtain from the less file
const bookmarkMaxWidth = 100

class BookmarkToolbarButton extends ImmutableComponent {
  onClick (e) {
    if (this.props.bookmark.get('tags').includes(siteTags.BOOKMARK_FOLDER)) {
      if (this.props.contextMenuDetail) {
        windowActions.setContextMenuDetail()
        return
      }
      e.target = ReactDOM.findDOMNode(this)
      contextMenus.onShowBookmarkFolderMenu(this.props.bookmarks, this.props.bookmark, this.props.activeFrame, e)
      return
    }
    const isDarwin = process.platform === 'darwin'
    if (e.ctrlKey && !isDarwin ||
        e.metaKey && isDarwin ||
        e.button === 1) {
      windowActions.newFrame({
        location: this.props.bookmark.get('location'),
        partitionNumber: this.props.bookmark.get('partitionNumber')
      }, false)
    } else {
      windowActions.loadUrl(this.props.activeFrame, this.props.bookmark.get('location'))
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

  render () {
    return <span
        className={cx({
          bookmarkToolbarButton: true,
          draggingOverLeft: this.isDraggingOverLeft && !this.isExpanded,
          draggingOverRight: this.isDraggingOverRight && !this.isExpanded,
          isDragging: this.isDragging
        })}
        draggable
        ref={node => this.bookmarkNode = node}
        onClick={this.onClick.bind(this)}
        onDragStart={this.onDragStart.bind(this)}
        onDragEnd={this.onDragEnd.bind(this)}
        onDragEnter={this.onDragEnter.bind(this)}
        onDragLeave={this.onDragLeave.bind(this)}
        onDragOver={this.onDragOver.bind(this)}
        onContextMenu={contextMenus.onBookmarkContextMenu.bind(this, this.props.bookmark, this.props.activeFrame)}>
      <span>{ this.props.bookmark.get('customTitle') || this.props.bookmark.get('title') || this.props.bookmark.get('location') }</span>
      { this.isFolder
        ? <span className='bookmarkFolderChevron fa fa-chevron-down'/> : null }
    </span>
  }
}

class BookmarksToolbar extends ImmutableComponent {
  onDrop (e) {
    e.preventDefault()
    const bookmark = dndData.getDragData(e.dataTransfer, dragTypes.BOOKMARK)
    if (bookmark) {
      // Figure out the droppedOn element filtering out the source drag item
      let droppedOn = dnd.closestFromXOffset(this.bookmarkRefs.filter(bookmarkRef => {
        if (!bookmarkRef) {
          return false
        }
        return !siteUtil.isEquivalent(bookmarkRef.props.bookmark, bookmark)
      }), e.clientX)
      if (droppedOn.selectedRef) {
        const isLeftSide = dnd.isLeftSide(ReactDOM.findDOMNode(droppedOn.selectedRef), e.clientX)
        const droppedOnSiteDetail = droppedOn.selectedRef.props.bookmark || droppedOn.selectedRef.props.bookmarkFolder
        appActions.moveSite(bookmark, droppedOnSiteDetail, isLeftSide, droppedOnSiteDetail.get('tags').includes(siteTags.BOOKMARK_FOLDER) && droppedOn.isDroppedOn)
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
      Array.from(e.dataTransfer.files).forEach(file =>
        appActions.addSite({ location: file.path, title: file.name }, siteTags.BOOKMARK))
      return
    }

    let urls = e.dataTransfer.getData('text/uri-list') ||
      e.dataTransfer.getData('text/plain')
    urls = urls.split('\n')
      .map(x => x.trim())
      .filter(x => !x.startsWith('#') && x.length > 0)
      .forEach(url =>
        appActions.addSite({ location: url }, siteTags.BOOKMARK))
  }
  updateBookmarkCount () {
    this.maxItems = window.innerWidth / bookmarkMaxWidth | 0
    this.leftOver = this.props.bookmarks.size - this.maxItems
  }
  componentWillMount () {
    this.updateBookmarkCount()
  }
  componentWillUpdate () {
    this.updateBookmarkCount()
  }
  onDragOver (e) {
    const sourceDragData = dndData.getDragData(e.dataTransfer, dragTypes.BOOKMARK)
    if (sourceDragData) {
      e.dataTransfer.dropEffect = 'move'
      e.preventDefault()
      return
    }
    // console.log(e.dataTransfer.types, e.dataTransfer.getData('text/plain'), e.dataTransfer.getData('text/uri-list'), e.dataTransfer.getData('text/html'))
    let intersection = e.dataTransfer.types.filter(x =>
      ['text/plain', 'text/uri-list', 'text/html', 'Files'].includes(x))
    if (intersection.length > 0) {
      e.dataTransfer.dropEffect = 'copy'
      e.preventDefault()
    }
  }
  onMoreBookmarksMenu (e) {
    contextMenus.onMoreBookmarksMenu(this.props.activeFrame, this.props.bookmarks, this.maxItems, e)
  }
  render () {
    this.bookmarkRefs = []
    return <div className='bookmarksToolbar'
      onDrop={this.onDrop.bind(this)}
      onDragOver={this.onDragOver.bind(this)}
      onContextMenu={contextMenus.onTabsToolbarContextMenu.bind(this, this.props.activeFrame)}>
    {
        this.props.bookmarks
          .filter(bookmark => !bookmark.get('parentFolderId'))
          .take(this.maxItems).map(bookmark =>
          <BookmarkToolbarButton
            ref={node => this.bookmarkRefs.push(node)}
            contextMenuDetail={this.props.contextMenuDetail}
            draggingOverData={this.props.draggingOverData}
            activeFrame={this.props.activeFrame}
            bookmarks={this.props.bookmarks}
            bookmark={bookmark}/>)
    }
    { this.leftOver > 0
      ? <Button iconClass='fa-angle-double-right'
        onClick={this.onMoreBookmarksMenu.bind(this)}
        className='bookmarkButton'/> : null }
    </div>
  }
}

module.exports = BookmarksToolbar
