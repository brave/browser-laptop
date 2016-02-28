/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

// Note that these are webpack requires, not CommonJS node requiring requires
const React = require('react')
const Immutable = require('immutable')
const ImmutableComponent = require('../components/immutableComponent')
const messages = require('../constants/messages')
const siteTags = require('../constants/siteTags')
const aboutActions = require('./aboutActions')
const cx = require('../lib/classSet.js')

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
      className='listItem'
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

class BookmarkFolderItem extends ImmutableComponent {
  render () {
    const childBookmarkFolders = this.props.allBookmarkFolders
      .filter(bookmarkFolder => (bookmarkFolder.get('parentFolderId') || 0) === this.props.bookmarkFolder.get('folderId'))
    return <div>
      <div role='listitem'
        onContextMenu={aboutActions.contextMenu.bind(this, this.props.bookmarkFolder.toJS(), 'bookmark-folder')}
        onClick={this.props.onChangeSelectedFolder.bind(null, this.props.bookmarkFolder.get('folderId'))}
        draggable='true'
        className={cx({
          listItem: true,
          selected: this.props.selected
        })}>
        <span className='bookmarkFolderIcon fa fa-folder-o'/>
        <span data-l10n-id={this.props.dataL10nId}>
          {this.props.bookmarkFolder.get('customTitle') || this.props.bookmarkFolder.get('title')}</span>
      </div>
      { childBookmarkFolders.size > 0
        ? <BookmarkFolderList onChangeSelectedFolder={this.props.onChangeSelectedFolder}
            bookmarkFolders={childBookmarkFolders}
            selectedFolderId={this.props.selectedFolderId}
            allBookmarkFolders={this.props.allBookmarkFolders}/>
        : null }
    </div>
  }
}

class BookmarkFolderList extends ImmutableComponent {
  render () {
    return <list className='bookmarkFolderList'>
      { this.props.isRoot
        ? <BookmarkFolderItem selected={this.props.selectedFolderId === 0}
          dataL10nId='bookmarksToolbar'
          onChangeSelectedFolder={this.props.onChangeSelectedFolder}
          allBookmarkFolders={this.props.allBookmarkFolders}
          selectedFolderId={this.props.selectedFolderId}
          bookmarkFolder={Immutable.fromJS({folderId: 0, tags: [siteTags.BOOKMARK_FOLDER]})}/>
        : null }
      {
        this.props.bookmarkFolders.map(bookmarkFolder =>
          <BookmarkFolderItem bookmarkFolder={bookmarkFolder}
            allBookmarkFolders={this.props.allBookmarkFolders}
            selected={this.props.selectedFolderId === bookmarkFolder.get('folderId')}
            selectedFolderId={this.props.selectedFolderId}
            onChangeSelectedFolder={this.props.onChangeSelectedFolder}/>)
      }
    </list>
  }
}

class BookmarksList extends ImmutableComponent {
  render () {
    return <list className='bookmarkList'>
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
    this.onChangeSelectedFolder = this.onChangeSelectedFolder.bind(this)
    this.state = {
      bookmarks: window.initBookmarks ? Immutable.fromJS(window.initBookmarks) : Immutable.Map(),
      bookmarkFolders: window.initBookmarkFolders ? Immutable.fromJS(window.initBookmarkFolders) : Immutable.Map(),
      selectedFolderId: 0
    }
    window.addEventListener(messages.BOOKMARKS_UPDATED, (e) => {
      this.setState({
        bookmarks: Immutable.fromJS(e.detail && e.detail.bookmarks || {}),
        bookmarkFolders: Immutable.fromJS(e.detail && e.detail.bookmarkFolders || {})
      })
    })
  }
  onChangeSelectedFolder (id) {
    this.setState({
      selectedFolderId: id
    })
  }
  render () {
    return <div className='bookmarksPage'>
        <h2>Folders</h2>
      <div className='bookmarkPageContent'>
        <BookmarkFolderList onChangeSelectedFolder={this.onChangeSelectedFolder}
          bookmarkFolders={this.state.bookmarkFolders.filter(bookmark => bookmark.get('parentFolderId') === -1)}
          allBookmarkFolders={this.state.bookmarkFolders}
          isRoot
          selectedFolderId={this.state.selectedFolderId} />
        <BookmarksList bookmarks={this.state.bookmarks.filter(bookmark => (bookmark.get('parentFolderId') || 0) === this.state.selectedFolderId)}/>
      </div>
    </div>
  }
}

module.exports = <AboutBookmarks/>
