/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const Immutable = require('immutable')

// Components
const ImmutableComponent = require('../../components/immutableComponent')
const BookmarkFolderItem = require('./bookmarkFolderItem')

class BookmarkFolderList extends ImmutableComponent {
  render () {
    return <list className='bookmarkFolderList'>
      {
        this.props.isRoot && this.props.search
          ? <div role='listitem' className='listItem selected'>
            <span className='bookmarkFolderIcon fa fa-search' />
            <span data-l10n-id='allFolders' />
          </div>
          : null
      }
      {
        this.props.isRoot
          ? <BookmarkFolderItem
            onClearSelection={this.props.onClearSelection}
            search={this.props.search}
            selected={!this.props.search && this.props.selectedFolderId === 0}
            dataL10nId='bookmarksToolbar'
            draggable={false}
            onChangeSelectedFolder={this.props.onChangeSelectedFolder}
            allBookmarkFolders={this.props.allBookmarkFolders}
            selectedFolderId={this.props.selectedFolderId}
            bookmarkFolder={Immutable.fromJS({
              folderId: 0,
              key: '0'
            })}
            bookmarkOrder={this.props.bookmarkOrder}
          />
          : null
      }
      {
        this.props.bookmarkFolders.map((bookmarkFolder) =>
          this.props.isRoot && bookmarkFolder.get('parentFolderId') === -1
            ? null
            : <BookmarkFolderItem
              onClearSelection={this.props.onClearSelection}
              bookmarkFolder={bookmarkFolder}
              allBookmarkFolders={this.props.allBookmarkFolders}
              search={this.props.search}
              selected={!this.props.search && this.props.selectedFolderId === bookmarkFolder.get('folderId')}
              selectedFolderId={this.props.selectedFolderId}
              onChangeSelectedFolder={this.props.onChangeSelectedFolder}
              bookmarkOrder={this.props.bookmarkOrder}
            />
        )
      }
      {
        this.props.isRoot
          ? <BookmarkFolderItem
            onClearSelection={this.props.onClearSelection}
            search={this.props.search}
            selected={!this.props.search && this.props.selectedFolderId === -1}
            dataL10nId='otherBookmarks'
            draggable={false}
            onChangeSelectedFolder={this.props.onChangeSelectedFolder}
            allBookmarkFolders={this.props.allBookmarkFolders}
            selectedFolderId={this.props.selectedFolderId}
            bookmarkFolder={Immutable.fromJS({
              folderId: -1,
              key: '-1'
            })}
            bookmarkOrder={this.props.bookmarkOrder}
          />
          : null
      }
    </list>
  }
}

module.exports = BookmarkFolderList
