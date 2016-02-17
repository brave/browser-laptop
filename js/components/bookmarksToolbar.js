/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const ImmutableComponent = require('./immutableComponent')
const contextMenus = require('../contextMenus')
const WindowActions = require('../actions/windowActions')
const AppActions = require('../actions/appActions')
const siteTags = require('../constants/siteTags')

class BookmarkToolbarButton extends ImmutableComponent {
  navigate () {
    WindowActions.loadUrl(this.props.activeFrame, this.props.location)
  }
  render () {
    return <span className='bookmarkToolbarButton'
      onClick={this.navigate.bind(this)}
      onContextMenu={contextMenus.onBookmarkContextMenu.bind(this, this.props.location, this.props.title)}>
    { this.props.title || this.props.location }
    </span>
  }
}

class BookmarksToolbar extends ImmutableComponent {
  onDrop (e) {
    let urls = e.dataTransfer.getData('text/uri-list') ||
      e.dataTransfer.getData('text/plain')
    urls = urls.split('\n')
      .map(x => x.trim())
      .filter(x => !x.startsWith('#'))
      .forEach(url =>
        AppActions.addSite({ location: url }, siteTags.BOOKMARK))
  }
  onDragEnter (e) {
    let intersection = e.dataTransfer.types.filter(x =>
      ['text/plain', 'text/uri-list'].includes(x))
    if (intersection.length > 0) {
      e.preventDefault()
    }
  }
  onDragOver (e) {
    let intersection = e.dataTransfer.types.filter(x =>
      ['text/plain', 'text/uri-list'].includes(x))
    if (intersection.length > 0) {
      e.preventDefault()
    }
  }
  render () {
    return <div className='bookmarksToolbar'
      onDrop={this.onDrop.bind(this)}
      onDragEnter={this.onDragOver.bind(this)}
      onDragOver={this.onDragOver.bind(this)}
      onContextMenu={contextMenus.onTabsToolbarContextMenu.bind(this, this.props.settings)}>
    {
        this.props.bookmarks.map(bookmark =>
          <BookmarkToolbarButton
            activeFrame={this.props.activeFrame}
            location={bookmark.get('location')}
            title={bookmark.get('title')}/>)
    }
    </div>
  }
}

module.exports = BookmarksToolbar
