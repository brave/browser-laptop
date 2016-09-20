/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

// Note that these are webpack requires, not CommonJS node requiring requires
const React = require('react')
const Immutable = require('immutable')
const Sticky = require('react-stickynode')
const ImmutableComponent = require('../components/immutableComponent')
const messages = require('../constants/messages')
const siteTags = require('../constants/siteTags')
const dragTypes = require('../constants/dragTypes')
const aboutActions = require('./aboutActions')
const dndData = require('../dndData')
const cx = require('../lib/classSet.js')

const ipc = window.chrome.ipc

// Stylesheets
require('../../less/about/itemList.less')
require('../../less/about/siteDetails.less')
require('../../less/about/bookmarks.less')
require('../../node_modules/font-awesome/css/font-awesome.css')

class BookmarkItem extends ImmutableComponent {
  onDragStart (e) {
    e.dataTransfer.effectAllowed = 'all'
    dndData.setupDataTransferBraveData(e.dataTransfer, dragTypes.BOOKMARK, this.props.bookmark)
    // TODO: Pass the location here when content scripts are fixed
    dndData.setupDataTransferURL(e.dataTransfer, '', this.props.bookmark.get('customTitle') || this.props.bookmark.get('title'))
  }
  onDragOver (e) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }
  onDrop (e) {
    const bookmark = dndData.getDragData(e.dataTransfer, dragTypes.BOOKMARK)
    if (bookmark) {
      aboutActions.moveSite(bookmark.toJS(), this.props.bookmark.toJS(), dndData.shouldPrependVerticalItem(e.target, e.clientY), false)
    }
  }
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
        <span>&nbsp;(<span data-l10n-id='partitionNumber' data-l10n-args={JSON.stringify(l10nArgs)} />)</span>
    }

    var className = 'listItem'

    // If the bookmark item is in the selected folder, show
    // it as selected
    if (this.props.inSelectedFolder) {
      className += ' selected'
    }

    return <div role='listitem'
      onDrop={this.onDrop.bind(this)}
      onDragStart={this.onDragStart.bind(this)}
      onDragOver={this.onDragOver.bind(this)}
      className={className}
      onContextMenu={aboutActions.contextMenu.bind(this, this.props.bookmark.toJS(), 'bookmark')}
      data-context-menu-disable
      draggable='true'
      onDoubleClick={this.navigate.bind(this)}>
      {
        this.props.bookmark.get('customTitle') || this.props.bookmark.get('title')
        ? <span className='aboutListItem' title={this.props.bookmark.get('location')}>
          <span className='aboutItemTitle'>{this.props.bookmark.get('customTitle') || this.props.bookmark.get('title')}</span>
          {partitionNumberInfo}
          <span className='aboutItemSeparator'>-</span><span className='aboutItemLocation'>{this.props.bookmark.get('location')}</span>
        </span>
        : <span className='aboutListItem' title={this.props.bookmark.get('location')}>
          <span>{this.props.bookmark.get('location')}</span>
          {partitionNumberInfo}
        </span>
      }
    </div>
  }
}

class BookmarkFolderItem extends ImmutableComponent {
  onDragStart (e) {
    if (this.props.draggable !== false) {
      e.dataTransfer.effectAllowed = 'all'
      dndData.setupDataTransferURL(e.dataTransfer, this.props.bookmarkFolder.get('location'), this.props.bookmarkFolder.get('customTitle') || this.props.bookmarkFolder.get('title'))
      dndData.setupDataTransferBraveData(e.dataTransfer, dragTypes.BOOKMARK, this.props.bookmarkFolder)
    }
  }
  onDragOver (e) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  onDrop (e) {
    const bookmark = dndData.getDragData(e.dataTransfer, dragTypes.BOOKMARK)
    if (bookmark) {
      aboutActions.moveSite(bookmark.toJS(), this.props.bookmarkFolder.toJS(), dndData.shouldPrependVerticalItem(e.target, e.clientY), true)
    }
  }
  render () {
    const childBookmarkFolders = this.props.bookmarkFolder.get('folderId') === -1
      ? []
      : this.props.allBookmarkFolders
          .filter((bookmarkFolder) => (bookmarkFolder.get('parentFolderId') || 0) === this.props.bookmarkFolder.get('folderId'))
    return <div>
      <div role='listitem'
        onDrop={this.onDrop.bind(this)}
        onDragStart={this.onDragStart.bind(this)}
        onDragOver={this.onDragOver.bind(this)}
        onContextMenu={aboutActions.contextMenu.bind(this, this.props.bookmarkFolder.toJS(), 'bookmark-folder')}
        onClick={this.props.onChangeSelectedFolder.bind(null, this.props.bookmarkFolder.get('folderId'))}
        draggable={this.props.draggable !== false ? 'true' : 'false'}
        className={cx({
          listItem: true,
          selected: this.props.selected
        })}>
        <span className='bookmarkFolderIcon fa fa-folder-o' />
        <span data-l10n-id={this.props.dataL10nId}>
          {this.props.bookmarkFolder.get('customTitle') || this.props.bookmarkFolder.get('title')}</span>
      </div>
      {
        childBookmarkFolders.size > 0
        ? <BookmarkFolderList onChangeSelectedFolder={this.props.onChangeSelectedFolder}
          bookmarkFolders={childBookmarkFolders}
          selectedFolderId={this.props.selectedFolderId}
          allBookmarkFolders={this.props.allBookmarkFolders} />
        : null
      }
    </div>
  }
}

class BookmarkFolderList extends ImmutableComponent {
  render () {
    return <list className='bookmarkFolderList'>
      {
        this.props.isRoot
        ? <BookmarkFolderItem selected={this.props.selectedFolderId === 0}
          dataL10nId='bookmarksToolbar'
          draggable={false}
          onChangeSelectedFolder={this.props.onChangeSelectedFolder}
          allBookmarkFolders={this.props.allBookmarkFolders}
          selectedFolderId={this.props.selectedFolderId}
          bookmarkFolder={Immutable.fromJS({folderId: 0, tags: [siteTags.BOOKMARK_FOLDER]})} />
        : null
      }
      {
        this.props.bookmarkFolders.map((bookmarkFolder) =>
          <BookmarkFolderItem bookmarkFolder={bookmarkFolder}
            allBookmarkFolders={this.props.allBookmarkFolders}
            selected={this.props.selectedFolderId === bookmarkFolder.get('folderId')}
            selectedFolderId={this.props.selectedFolderId}
            onChangeSelectedFolder={this.props.onChangeSelectedFolder} />)
      }
      {
        this.props.isRoot
        ? <BookmarkFolderItem selected={this.props.selectedFolderId === -1}
          dataL10nId='otherBookmarks'
          draggable={false}
          onChangeSelectedFolder={this.props.onChangeSelectedFolder}
          allBookmarkFolders={this.props.allBookmarkFolders}
          selectedFolderId={this.props.selectedFolderId}
          bookmarkFolder={Immutable.fromJS({folderId: -1, tags: [siteTags.BOOKMARK_FOLDER]})} />
        : null
      }
    </list>
  }
}

class BookmarksList extends ImmutableComponent {
  render () {
    return <list className='siteDetailsList'>
      {
        this.props.bookmarks.map((bookmark) =>
          <BookmarkItem bookmark={bookmark} />)
      }
    </list>
  }
}

class SearchResults extends React.Component {
  render () {
    // Sort bookmarks by title
    var sortedBookmarks = this.props.bookmarks.sort((a, b) => {
      if (a.get('title').toUpperCase() < b.get('title').toUpperCase()) return -1
      if (a.get('title').toUpperCase() > b.get('title').toUpperCase()) return 1
      return 0
    })

    // Flag each bookmark if it is in the selected folder
    var selectedFolderIndex = sortedBookmarks.map((bookmark, idx) => {
      return sortedBookmarks.get(idx).get('parentFolderId') === this.props.selectedFolderId
    })

    return (
      <list className='siteDetailsList'>
        {
          sortedBookmarks.map((bookmark, idx) => <BookmarkItem bookmark={bookmark} inSelectedFolder={selectedFolderIndex.get(idx)} />)
        }
      </list>
    )
  }
}

class AboutBookmarks extends React.Component {
  constructor () {
    super()
    this.onChangeSelectedFolder = this.onChangeSelectedFolder.bind(this)
    this.onChangeSearch = this.onChangeSearch.bind(this)
    this.onClearSearchText = this.onClearSearchText.bind(this)
    this.state = {
      bookmarks: Immutable.Map(),
      bookmarkFolders: Immutable.Map(),
      selectedFolderId: 0,
      search: ''
    }
    ipc.on(messages.BOOKMARKS_UPDATED, (e, detail) => {
      this.setState({
        bookmarks: Immutable.fromJS(detail && detail.bookmarks || {}),
        bookmarkFolders: Immutable.fromJS(detail && detail.bookmarkFolders || {})
      })
    })
  }
  onChangeSelectedFolder (id) {
    this.setState({
      selectedFolderId: id,
      search: ''
    })
  }
  onChangeSearch (evt) {
    this.setState({
      search: evt.target.value
    })
  }
  onClearSearchText (evt) {
    this.setState({
      search: ''
    })
  }
  searchedBookmarks (searchTerm, bookmarks) {
    return bookmarks.filter((bookmark) => {
      const title = bookmark.get('customTitle') + bookmark.get('title') + bookmark.get('location')
      return title.match(new RegExp(searchTerm, 'gi'))
    })
  }
  componentDidMount () {
    this.refs.bookmarkSearch.focus()
  }
  render () {
    return <div className='siteDetailsPage'>
      <h2 data-l10n-id='folders' />
      <input type='text' className='searchInput' ref='bookmarkSearch' id='bookmarkSearch' value={this.state.search} onChange={this.onChangeSearch} data-l10n-id='bookmarkSearch' />
      {
        this.state.search
        ? <span onClick={this.onClearSearchText} className='fa fa-close searchInputClear' />
        : null
      }
      <div className='siteDetailsPageContent'>
        <Sticky enabled top={10}>
          <BookmarkFolderList onChangeSelectedFolder={this.onChangeSelectedFolder}
            bookmarkFolders={this.state.bookmarkFolders.filter((bookmark) => bookmark.get('parentFolderId') === -1)}
            allBookmarkFolders={this.state.bookmarkFolders}
            isRoot
            selectedFolderId={this.state.selectedFolderId} />
        </Sticky>
        {
          this.state.search
          ? <SearchResults bookmarks={this.searchedBookmarks(this.state.search, this.state.bookmarks)} selectedFolderId={this.state.selectedFolderId} />
          : <BookmarksList bookmarks={this.state.bookmarks.filter((bookmark) => (bookmark.get('parentFolderId') || 0) === this.state.selectedFolderId)} />
        }
      </div>
    </div>
  }
}

module.exports = <AboutBookmarks />
