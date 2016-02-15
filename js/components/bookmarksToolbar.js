/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const ImmutableComponent = require('./immutableComponent')
const contextMenus = require('../contextMenus')

/*
class BookmarkToolbarButton extends ImmutableComponent {
  render () {
    return <div className='bookmarkToolbarButton'>
    </div>
  }
}
*/

class BookmarksToolbar extends ImmutableComponent {
  render () {
    return <div className='bookmarksToolbar'
      onContextMenu={contextMenus.onTabsToolbarContextMenu.bind(this, this.props.settings)}>
    </div>
  }
}

module.exports = BookmarksToolbar
