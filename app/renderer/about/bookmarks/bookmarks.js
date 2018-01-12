/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

// Note that these are webpack requires, not CommonJS node requiring requires
const React = require('react')
const Immutable = require('immutable')
const ipc = window.chrome.ipcRenderer

const cx = require('../../../../js/lib/classSet')
const {StyleSheet, css} = require('aphrodite/no-important')

// Components
const {AboutPageSectionTitle} = require('../../components/common/sectionTitle')
const BookmarkFolderList = require('./bookmarkFolderList')
const BookmarksList = require('./bookmarksList')

// Constants
const messages = require('../../../../js/constants/messages')
const siteTags = require('../../../../js/constants/siteTags')

// Actions
const aboutActions = require('../../../../js/about/aboutActions')
const windowActions = require('../../../../js/actions/windowActions')

// Stylesheets
require('../../../../less/about/bookmarks.less')
require('../../../../node_modules/font-awesome/css/font-awesome.css')

class Bookmarks extends React.Component {
  constructor (props) {
    super(props)
    this.onChangeSelectedFolder = this.onChangeSelectedFolder.bind(this)
    this.onChangeSearch = this.onChangeSearch.bind(this)
    this.onClearSearchText = this.onClearSearchText.bind(this)
    this.importBrowserData = this.importBrowserData.bind(this)
    this.exportBookmarks = this.exportBookmarks.bind(this)
    this.onContextMenu = this.onContextMenu.bind(this)
    this.addBookmarkFolder = this.addBookmarkFolder.bind(this)
    this.onClick = this.onClick.bind(this)
    this.clearSelection = this.clearSelection.bind(this)
    this.state = {
      bookmarks: Immutable.Map(),
      bookmarkFolders: Immutable.Map(),
      bookmarkOrder: Immutable.Map(),
      selectedFolderId: 0,
      search: ''
    }

    ipc.on(messages.BOOKMARKS_UPDATED, (e, handle) => {
      const detail = handle.memory()
      this.setState({
        bookmarks: Immutable.fromJS((detail && detail.bookmarks) || {}),
        bookmarkFolders: Immutable.fromJS((detail && detail.bookmarkFolders) || {}),
        bookmarkOrder: Immutable.fromJS((detail && detail.bookmarkOrder) || {})
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

  onClearSearchText () {
    this.setState({
      search: ''
    })
  }

  onClick (e) {
    // Determine if click was on sortableTable
    let targetElement = e.target
    while (targetElement) {
      if (targetElement.tagName === 'TBODY') {
        return
      }
      targetElement = targetElement.parentNode
    }

    // Click was not a child element of sortableTable; clear selection
    this.clearSelection()
  }

  searchedBookmarks (searchTerm, bookmarks) {
    return bookmarks.filter((bookmark) => {
      const title = bookmark.get('title') + bookmark.get('location')
      return title.match(new RegExp(searchTerm, 'gi'))
    })
  }

  get bookmarksInFolder () {
    const cached = this.state.bookmarkOrder.get(this.state.selectedFolderId.toString())

    if (cached == null) {
      return Immutable.Map()
    }

    return cached
      .filter(item => item.get('type') === siteTags.BOOKMARK)
      .map(bookmark => this.state.bookmarks.get(bookmark.get('key')))
  }

  get bookmarkFolders () {
    return this.state.bookmarkFolders.filter((bookmark) => bookmark.get('parentFolderId') === -1)
  }

  importBrowserData () {
    aboutActions.importBrowserDataNow()
  }

  exportBookmarks () {
    aboutActions.exportBookmarks()
  }

  addBookmarkFolder () {
    windowActions.addBookmarkFolder(Immutable.fromJS({
      parentFolderId: this.state.selectedFolderId
    }))
  }

  clearSelection () {
    this.refs.bookmarkList.clearSelection()
  }

  componentDidMount () {
    this.refs.bookmarkSearch.focus()
  }

  onContextMenu (e) {
    aboutActions.contextMenu({
      folderId: this.state.selectedFolderId,
      isEditable: false,
      inputFieldType: 'none'
    }, '', e)
  }

  render () {
    return <div
      className='siteDetailsPage bookmarksManager'
      onClick={this.onClick}
      onContextMenu={this.onContextMenu}
    >
      <div className={cx({
        siteDetailsPageHeader: true,
        [css(styles.bookmarksManager__header)]: true
      })}>
        <AboutPageSectionTitle data-l10n-id='bookmarkManager' />
        <div className='headerActions'>
          <span data-l10n-id='importBrowserData' className='importBrowserData' onClick={this.importBrowserData} />
          <span data-l10n-id='exportBookmarks' className='exportBookmarks' onClick={this.exportBookmarks} />
          <input type='text' className='searchInput' ref='bookmarkSearch' id='bookmarkSearch' value={this.state.search} onChange={this.onChangeSearch} data-l10n-id='bookmarkSearch' />
          {
            this.state.search
              ? <span onClick={this.onClearSearchText} className='fa fa-close searchInputClear' />
              : <span className='fa fa-search searchInputPlaceholder' />
          }
        </div>
      </div>

      <div className='siteDetailsPageContent'>
        <div className='folderView'>
          <div className='columnHeader'>
            <span data-l10n-id='folders' />
            <span className='addBookmarkFolder'
              data-l10n-id='addBookmarkFolder'
              data-test-id='addBookmarkFolder'
              onClick={this.addBookmarkFolder}
            />
          </div>
          <BookmarkFolderList
            onClearSelection={this.clearSelection}
            onChangeSelectedFolder={this.onChangeSelectedFolder}
            bookmarkFolders={this.bookmarkFolders}
            allBookmarkFolders={this.state.bookmarkFolders}
            isRoot
            selectedFolderId={this.state.selectedFolderId}
            search={this.state.search}
            bookmarkOrder={this.state.bookmarkOrder}
          />
        </div>
        <div className='organizeView'>
          <BookmarksList
            ref='bookmarkList'
            bookmarks={
              this.state.search
                ? this.searchedBookmarks(this.state.search, this.state.bookmarks)
                : this.bookmarksInFolder
            }
            allBookmarkFolders={this.state.bookmarkFolders}
            sortable={false}
            draggable={!this.state.search}
            selectedFolderId={this.state.selectedFolderId}
          />
        </div>
      </div>
    </div>
  }
}

const styles = StyleSheet.create({
  bookmarksManager__header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  }
})

module.exports = <Bookmarks />
