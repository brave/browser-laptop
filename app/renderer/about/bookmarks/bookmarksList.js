/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const Immutable = require('immutable')

// Components
const ImmutableComponent = require('../../components/immutableComponent')
const SortableTable = require('../../components/common/sortableTable')
const BookmarkTitleCell = require('./bookmarkTitleCell')
const BookmarkTitleHeader = require('./bookmarkTitleHeader')

// Constants
const dragTypes = require('../../../../js/constants/dragTypes')

// Actions
const aboutActions = require('../../../../js/about/aboutActions')
const appActions = require('../../../../js/actions/appActions')

// Utils
const dndData = require('../../../../js/dndData')
const locale = require('../../../../js/l10n')

class BookmarksList extends ImmutableComponent {
  onDoubleClick (entry, e) {
    if (e && e.preventDefault) {
      e.preventDefault()
    }
    aboutActions.createTabRequested({
      url: entry.location,
      partitionNumber: entry.partitionNumber
    })
  }
  /**
   * Called when a bookmark (or bookmarks) begin dragging.
   * If multiple items are selected, please note this method is
   * called by the onDragStart handler in sortableTable instead
   * of being directly bound to the table row being dragged.
   */
  onDragStart (siteDetail, e) {
    const isList = Immutable.List.isList(siteDetail)
    e.dataTransfer.effectAllowed = 'all'
    dndData.setupDataTransferBraveData(e.dataTransfer, dragTypes.BOOKMARK, siteDetail)
    // TODO: Pass the location here when content scripts are fixed
    const count = siteDetail.size
    dndData.setupDataTransferURL(e.dataTransfer, '', isList
      ? locale.translation('multiSelectionBookmarks', {count})
      : siteDetail.get('title'))
  }
  /**
   * Bookmark entry is being dragged.
   */
  onDragOver (siteDetail, e) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }
  /**
   * Move a folder, a bookmark, or multiple bookmarks IF move is allowed.
   * ex: won't allow child folder to become parent of an ancestor, etc.
   */

  moveBookmark (e, bookmark, siteDetail) {
    let destinationIsParent = false

    appActions.moveBookmark(
      bookmark.get('key'),
      siteDetail.get('key'),
      dndData.shouldPrependVerticalItem(e.target, e.clientY),
      destinationIsParent
    )
  }
  /**
   * Bookmark (one or multiple) or BookmarkFolderItem object was dropped
   * onto `siteDetail` (which is a bookmark inside of sortableTable).
   */
  onDrop (siteDetail, e) {
    const bookmarkData = dndData.getDragData(e.dataTransfer, dragTypes.BOOKMARK)
    if (bookmarkData) {
      if (Immutable.List.isList(bookmarkData)) {
        bookmarkData.forEach((bookmark) => {
          this.moveBookmark(e, bookmark, siteDetail)
        })
        this.clearSelection()
        return
      }

      this.moveBookmark(e, bookmarkData, siteDetail)
      this.clearSelection()
    }
  }
  clearSelection () {
    this.refs.bookmarkTable.clearSelection()
  }
  render () {
    const props = !this.props.draggable ? {
      onDragStart: this.onDragStart,
      sortingDisabled: !this.props.sortable
    } : {
      onDoubleClick: this.onDoubleClick,
      onDragStart: this.onDragStart,
      onDragOver: this.onDragOver,
      onDrop: this.onDrop,
      sortingDisabled: !this.props.sortable
    }
    return <div>
      <SortableTable
        fillAvailable
        ref='bookmarkTable'
        headings={[
          <BookmarkTitleHeader heading='title' selectedFolderId={this.props.selectedFolderId} />
        ]}
        defaultHeading='Title'
        rows={this.props.bookmarks.map((entry) => [
          {
            cell: <BookmarkTitleCell siteDetail={entry} />,
            value: entry.get('title') || entry.get('location')
          }
        ])}
        rowObjects={this.props.bookmarks}
        columnClassNames={['title']}
        addHoverClass
        multiSelect
        onDoubleClick={this.onDoubleClick}
        {...props}
        contextMenuName='bookmark'
        thisArg={this}
        onContextMenu={aboutActions.contextMenu}
      />
    </div>
  }
}

module.exports = BookmarksList
