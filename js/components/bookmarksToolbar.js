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
const dragTypes = require('../constants/dragTypes')
const cx = require('../lib/classSet.js')
const dnd = require('../dnd')

// TODO: Obtain from the less file
const bookmarkMaxWidth = 100

class BookmarkToolbarButton extends ImmutableComponent {
  navigate () {
    WindowActions.loadUrl(this.props.activeFrame, this.props.location)
  }

  onDragStart (e) {
    dnd.onDragStart(dragTypes.BOOKMARK, this.props.location, e)
  }

  onDragEnd (e) {
    dnd.onDragEnd(dragTypes.BOOKMARK, this.props.location, e)
  }

  onDragOver (e) {
    dnd.onDragOver(dragTypes.BOOKMARK, this.props.sourceDragData, this.bookmarkNode.getBoundingClientRect(), this.props.location, this.draggingOverData, e)
  }

  get draggingOverData () {
    if (!this.props.draggingOverData ||
        this.props.draggingOverData.get('dragOverKey') !== this.props.location) {
      return
    }

    return this.props.draggingOverData
  }

  get isDragging () {
    return this.props.location === this.props.sourceDragData
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
      onClick={this.navigate.bind(this)}
      onDragStart={this.onDragStart.bind(this)}
      onDragEnd={this.onDragEnd.bind(this)}
      onDragOver={this.onDragOver.bind(this)}
      onContextMenu={contextMenus.onBookmarkContextMenu.bind(this, this.props.location, this.props.title, this.props.activeFrame)}>
    { this.props.title || this.props.location }
    </span>
  }
}

class BookmarksToolbar extends ImmutableComponent {
  onDrop (e) {
    e.preventDefault()
    if (this.props.sourceDragData) {
      const location = this.props.sourceDragData
      let droppedOn = dnd.closestFromXOffset(this.bookmarkRefs.filter(bookmarkRef => bookmarkRef && bookmarkRef.props.location !== location), e.clientX)
      if (droppedOn) {
        const isLeftSide = dnd.isLeftSide(ReactDOM.findDOMNode(droppedOn), e.clientX)
        AppActions.moveSite(location, droppedOn.props.location, isLeftSide)
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
    this.maxItems = window.innerWidth / bookmarkMaxWidth
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
            location={bookmark.get('location')}
            title={bookmark.get('title')}/>)
    }
    </div>
  }
}

module.exports = BookmarksToolbar
