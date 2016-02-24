/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

// Note that these are webpack requires, not CommonJS node requiring requires
const React = require('react')
const Immutable = require('immutable')
const ImmutableComponent = require('../components/immutableComponent')
const messages = require('../constants/messages')
const aboutActions = require('./aboutActions')

// Stylesheets
require('../../less/about/bookmarks.less')
require('../../node_modules/font-awesome/css/font-awesome.css')

class BookmarkItem extends ImmutableComponent {
  navigate () {
    aboutActions.newFrame({
      location: this.props.bookmark.get('location'),
      partitionNumber: this.props.bookmark.get('partitionNumber')
    })
  }
  render () {
    // Figure out the partition info display
    let partitionNumberInfo
    if (this.props.bookmark.get('partitionNumber')) {
      let l10nArgs = {
        partitionNumber: this.props.bookmark.get('partitionNumber')
      }
      partitionNumberInfo =
        <span> (<span data-l10n-id='partitionNumber' data-l10n-args={JSON.stringify(l10nArgs)}/>)</span>
    }

    return <div role='listitem'
      onContextMenu={aboutActions.contextMenu.bind(this, this.props.bookmark.toJS(), 'bookmark')}
      data-context-menu-disable
      draggable='true'
      onDoubleClick={this.navigate.bind(this)}>
    { this.props.bookmark.get('title')
      ? <span>
        <span>{this.props.bookmark.get('title')}</span>
        {partitionNumberInfo}
        <span className='bookmarkLocation'> - {this.props.bookmark.get('location')}</span>
      </span>
      : <span>
          <span> {this.props.bookmark.get('location')}</span>
          {partitionNumberInfo}
        </span>
    }
    </div>
  }
}

class BookmarksList extends ImmutableComponent {
  render () {
    return <list>
    {
      this.props.bookmarks.map(bookmark =>
          <BookmarkItem bookmark={bookmark}/>)
    }
    </list>
  }
}

class AboutBookmarks extends React.Component {
  constructor () {
    super()
    this.state = {
      bookmarks: window.initBookmarks ? Immutable.fromJS(window.initBookmarks) : Immutable.Map()
    }
    window.addEventListener(messages.BOOKMARKS_UPDATED, (e) => {
      this.setState({
        bookmarks: Immutable.fromJS(e.detail || {})
      })
    })
  }
  render () {
    return <div className='bookmarksPage'>
      <BookmarksList bookmarks={this.state.bookmarks}/>
    </div>
  }
}

module.exports = <AboutBookmarks/>
