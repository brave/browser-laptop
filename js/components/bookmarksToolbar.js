/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const ImmutableComponent = require('./immutableComponent')
const contextMenus = require('../contextMenus')
const WindowActions = require('../actions/windowActions')

class BookmarkToolbarButton extends ImmutableComponent {
  navigate () {
    WindowActions.loadUrl(this.props.activeFrame, this.props.location)
  }
  render () {
    return <spin className='bookmarkToolbarButton'
      onClick={this.navigate.bind(this)}
      onContextMenu={contextMenus.onBookmarkContextMenu.bind(this, this.props.location, this.props.title)}>
    { this.props.title }
    </spin>
  }
}

class BookmarksToolbar extends ImmutableComponent {
  render () {
    return <div className='bookmarksToolbar'
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
