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
const BrowserButton = require('../../components/common/browserButton')
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

const globalStyles = require('../../components/styles/global')
const addBookmarkFolder = require('../../../../img/toolbar/add_BM_folder_btn.svg')
const importBrowserData = require('../../../../img/toolbar/bookmarks_import.svg')
const exportBookmarks = require('../../../../img/toolbar/bookmarks_export.svg')

class Bookmarks extends React.Component {
  constructor (props) {
    super(props)
    this.onChangeSelectedFolder = this.onChangeSelectedFolder.bind(this)
    this.onChangeSearch = this.onChangeSearch.bind(this)
    this.onClearSearchText = this.onClearSearchText.bind(this)
    this.importBrowserData = this.importBrowserData.bind(this)
    this.exportBookmarks = this.exportBookmarks.bind(this)
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

  render () {
    return <div className='siteDetailsPage bookmarksManager' onClick={this.onClick}>
      <div className={cx({
        siteDetailsPageHeader: true,
        [css(styles.bookmarksManager__header)]: true
      })}>
        <AboutPageSectionTitle data-l10n-id='bookmarkManager' />
        <div className='headerActions'>
          <div className='searchWrapper'>
            <BrowserButton
              isMaskImage
              custom={[
                styles.headerActions__search__button,
                styles.headerActions__search__button_importBrowserData
              ]}
              l10nId='importBrowserData'
              onClick={this.importBrowserData}
            />
            <BrowserButton
              isMaskImage
              custom={[
                styles.headerActions__search__button,
                styles.headerActions__search__button_exportBookmarks
              ]}
              l10nId='exportBookmarks'
              onClick={this.exportBookmarks}
            />
            <input type='text' className='searchInput' ref='bookmarkSearch' id='bookmarkSearch' value={this.state.search} onChange={this.onChangeSearch} data-l10n-id='bookmarkSearch' />
            {
              this.state.search
              ? <BrowserButton
                iconClass={globalStyles.appIcons.remove}
                iconStyle={{ color: globalStyles.color.gray }}
                custom={styles.headerActions__search__input__button_clear}
                onClick={this.onClearSearchText}
              />
              : <span className='fa fa-search searchInputPlaceholder' />
            }
          </div>
        </div>
      </div>

      <div className='siteDetailsPageContent'>
        <div className='folderView'>
          <div className='columnHeader'>
            <span data-l10n-id='folders' />
            <BrowserButton
              isMaskImage
              custom={styles.columnHeader__addBookmarkFolder}
              l10nId='addBookmarkFolder'
              testId='addBookmarkFolder'
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
  },

  headerActions__search__button: {
    backgroundColor: globalStyles.color.buttonColor,
    width: '43px',
    height: '22px',
    marginRight: '.5rem',
    WebkitMaskRepeat: 'no-repeat'
  },

  headerActions__search__button_importBrowserData: {
    WebkitMaskImage: `url(${importBrowserData})`
  },

  headerActions__search__button_exportBookmarks: {
    WebkitMaskImage: `url(${exportBookmarks})`
  },

  headerActions__search__input__button_clear: {
    // See siteDetails.less
    margin: 0,
    padding: 0,
    width: 0,
    position: 'relative',
    left: '-25px',
    fontSize: '16px'
  },

  columnHeader__addBookmarkFolder: {
    backgroundColor: globalStyles.color.buttonColor,
    width: '20px',
    height: '20px',
    WebkitMaskImage: `url(${addBookmarkFolder})`,
    WebkitMaskRepeat: 'no-repeat'
  }
})

module.exports = <Bookmarks />
