/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const ReactDOM = require('react-dom')
const ImmutableComponent = require('./immutableComponent')
const contextMenus = require('../contextMenus')
const WindowActions = require('../actions/windowActions')
const AppActions = require('../actions/appActions')
const siteTags = require('../constants/siteTags')
const siteUtil = require('../state/siteUtil')
const dragTypes = require('../constants/dragTypes')
const Button = require('../components/button')
const cx = require('../lib/classSet.js')
const dnd = require('../dnd')

// TODO: Obtain from the less file
const bookmarkMaxWidth = 100

class BookmarkToolbarButton extends ImmutableComponent {
  click (e) {
    if (this.props.bookmark.get('tags').includes(siteTags.BOOKMARK_FOLDER)) {
      contextMenus.onShowBookmarkFolderMenu(this.props.bookmark.get('title'), {target: ReactDOM.findDOMNode(this)})
      return
    }
    const isDarwin = process.platform === 'darwin'
    if (e.ctrlKey && !isDarwin ||
        e.metaKey && isDarwin) {
      WindowActions.newFrame({
        location: this.props.bookmark.get('location'),
        partitionNumber: this.props.bookmark.get('partitionNumber')
      }, false)
    } else {
      WindowActions.loadUrl(this.props.activeFrame, this.props.bookmark.get('location'))
    }
  }

  onDragStart (e) {
    dnd.setupDataTransferURL(e.dataTransfer, this.props.bookmark.get('location'), this.props.bookmark.get('title'))
    dnd.onDragStart(dragTypes.BOOKMARK, this.props.bookmark, e)
  }

  onDragEnd (e) {
    dnd.onDragEnd(dragTypes.BOOKMARK, this.props.bookmark, e)
  }

  onDragOver (e) {
    dnd.setupDataTransferURL(e.dataTransfer, this.props.bookmark.get('location'), this.props.bookmark.get('title'))
    dnd.onDragOver(dragTypes.BOOKMARK, this.props.sourceDragData, this.bookmarkNode.getBoundingClientRect(), this.props.bookmark, this.draggingOverData, e)
  }

  get draggingOverData () {
    if (!this.props.draggingOverData ||
        this.props.draggingOverData.get('dragOverKey') !== this.props.bookmark) {
      return
    }

    return this.props.draggingOverData
  }

  get isDragging () {
    return this.props.bookmark === this.props.sourceDragData
  }

  get isDraggingOverLeft () {
    if (!this.draggingOverData) {
      return false
    }
    return this.draggingOverData.get('draggingOverLeftHalf')
  }

  get isDraggingOverRight () {
    if (!this.draggingOverData) {
      return false
    }
    return this.draggingOverData.get('draggingOverRightHalf')
  }

  render () {
    return <span
        className={cx({
          bookmarkToolbarButton: true,
          draggingOverLeft: this.isDraggingOverLeft,
          draggingOverRight: this.isDraggingOverRight,
          isDragging: this.isDragging
        })}
        draggable
        ref={node => this.bookmarkNode = node}
        onClick={this.click.bind(this)}
        onDragStart={this.onDragStart.bind(this)}
        onDragEnd={this.onDragEnd.bind(this)}
        onDragOver={this.onDragOver.bind(this)}
        onContextMenu={contextMenus.onBookmarkContextMenu.bind(this, this.props.bookmark, this.props.activeFrame)}>
      <span>{ this.props.bookmark.get('title') || this.props.bookmark.get('llocation') }</span>
      { this.props.bookmark.get('tags').includes(siteTags.BOOKMARK_FOLDER)
        ? <span className='bookmarkFolderChevron fa fa-chevron-down'/> : null }
    </span>
  }
}

class BookmarksToolbar extends ImmutableComponent {
  onDrop (e) {
    e.preventDefault()
    if (this.props.sourceDragData) {
      const bookmark = this.props.sourceDragData
      // Figure out the droppedOn element filtering out the source drag item
      let droppedOn = dnd.closestFromXOffset(this.bookmarkRefs.filter(bookmarkRef => {
        if (!bookmarkRef) {
          return false
        }
        return !siteUtil.isEquivalent(bookmarkRef.props.bookmark, bookmark)
      }), e.clientX)
      if (droppedOn) {
        const isLeftSide = dnd.isLeftSide(ReactDOM.findDOMNode(droppedOn), e.clientX)
        AppActions.moveSite(bookmark, droppedOn.props.bookmark, isLeftSide)
      }
      return
    }
    const droppedHTML = e.dataTransfer.getData('text/html')
    if (droppedHTML) {
      var parser = new window.DOMParser()
      var doc = parser.parseFromString(droppedHTML, 'text/html')
      var a = doc.querySelector('a')
      if (a && a.href) {
        AppActions.addSite({
          title: a.innerText,
          location: a.href
        }, siteTags.BOOKMARK)
        return
      }
    }

    let urls = e.dataTransfer.getData('text/uri-list') ||
      e.dataTransfer.getData('text/plain')
    urls = urls.split('\n')
      .map(x => x.trim())
      .filter(x => !x.startsWith('#'))
      .forEach(url =>
        AppActions.addSite({ location: url }, siteTags.BOOKMARK))
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
  onDragEnter (e) {
    let intersection = e.dataTransfer.types.filter(x =>
      ['text/plain', 'text/uri-list', 'text/html'].includes(x))
    if (intersection.length > 0) {
      e.preventDefault()
    }
  }
  onDragOver (e) {
    if (this.props.sourceDragData) {
      e.dataTransfer.dropEffect = 'move'
      e.preventDefault()
      return
    }
    // console.log(e.dataTransfer.types, e.dataTransfer.getData('text/plain'), e.dataTransfer.getData('text/uri-list'), e.dataTransfer.getData('text/html'))
    let intersection = e.dataTransfer.types.filter(x =>
      ['text/plain', 'text/uri-list', 'text/html'].includes(x))
    if (intersection.length > 0) {
      e.preventDefault()
    }
  }
  onMoreBookmarksMenu () {
    contextMenus.onMoreBookmarksMenu(this.props.activeFrame, this.props.bookmarks.skip(this.maxItems))
  }
  render () {
    this.bookmarkRefs = []
    return <div className='bookmarksToolbar'
      onDrop={this.onDrop.bind(this)}
      onDragEnter={this.onDragOver.bind(this)}
      onDragOver={this.onDragOver.bind(this)}
      onContextMenu={contextMenus.onTabsToolbarContextMenu.bind(this, this.props.settings, this.props.activeFrame)}>
    {
        this.props.bookmarks.take(this.maxItems).map(bookmark =>
          <BookmarkToolbarButton
            ref={node => this.bookmarkRefs.push(node)}
            sourceDragData={this.props.sourceDragData}
            draggingOverData={this.props.draggingOverData}
            activeFrame={this.props.activeFrame}
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
