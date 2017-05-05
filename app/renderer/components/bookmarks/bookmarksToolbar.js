/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const ReactDOM = require('react-dom')
const {StyleSheet, css} = require('aphrodite/no-important')

// Components
const ImmutableComponent = require('../immutableComponent')
const BrowserButton = require('../common/browserButton')
const BookmarkToolbarButton = require('./bookmarkToolbarButton')

// Actions
const windowActions = require('../../../../js/actions/windowActions')
const bookmarkActions = require('../../../../js/actions/bookmarkActions')
const appActions = require('../../../../js/actions/appActions')

// Store
const windowStore = require('../../../../js/stores/windowStore')

// Constants
const siteTags = require('../../../../js/constants/siteTags')
const dragTypes = require('../../../../js/constants/dragTypes')

// Utils
const siteUtil = require('../../../../js/state/siteUtil')
const contextMenus = require('../../../../js/contextMenus')
const cx = require('../../../../js/lib/classSet')
const dnd = require('../../../../js/dnd')
const dndData = require('../../../../js/dndData')
const calculateTextWidth = require('../../../../js/lib/textCalculator').calculateTextWidth
const iconSize = require('../../../common/lib/faviconUtil').iconSize

// Styles
const globalStyles = require('../styles/global')

class BookmarksToolbar extends ImmutableComponent {
  constructor () {
    super()
    this.onDrop = this.onDrop.bind(this)
    this.onDragEnter = this.onDragEnter.bind(this)
    this.onDragOver = this.onDragOver.bind(this)
    this.onContextMenu = this.onContextMenu.bind(this)
    this.onMoreBookmarksMenu = this.onMoreBookmarksMenu.bind(this)
    this.openContextMenu = this.openContextMenu.bind(this)
    this.clickBookmarkItem = this.clickBookmarkItem.bind(this)
    this.showBookmarkFolderMenu = this.showBookmarkFolderMenu.bind(this)
  }
  get activeFrame () {
    return windowStore.getFrame(this.props.activeFrameKey)
  }
  onDrop (e) {
    e.preventDefault()
    const bookmark = dnd.prepareBookmarkDataFromCompatible(e.dataTransfer)
    if (bookmark) {
      // Figure out the droppedOn element filtering out the source drag item
      let droppedOn = dnd.closestFromXOffset(this.bookmarkRefs.filter((bookmarkRef) => {
        if (!bookmarkRef) {
          return false
        }
        return !siteUtil.isEquivalent(bookmarkRef.props.bookmark, bookmark)
      }), e.clientX)
      if (droppedOn.selectedRef) {
        const isLeftSide = dnd.isLeftSide(ReactDOM.findDOMNode(droppedOn.selectedRef), e.clientX)
        const droppedOnSiteDetail = droppedOn.selectedRef.props.bookmark || droppedOn.selectedRef.props.bookmarkFolder
        appActions.moveSite(bookmark, droppedOnSiteDetail, isLeftSide, droppedOnSiteDetail.get('tags').includes(siteTags.BOOKMARK_FOLDER) && droppedOn && droppedOn.isDroppedOn)
      }
      return
    }
    const droppedHTML = e.dataTransfer.getData('text/html')
    if (droppedHTML) {
      var parser = new window.DOMParser()
      var doc = parser.parseFromString(droppedHTML, 'text/html')
      var a = doc.querySelector('a')
      if (a && a.href) {
        appActions.addSite({
          title: a.innerText,
          location: e.dataTransfer.getData('text/plain')
        }, siteTags.BOOKMARK)
        return
      }
    }
    if (e.dataTransfer.files.length > 0) {
      Array.from(e.dataTransfer.files).forEach((file) =>
        appActions.addSite({ location: file.path, title: file.name }, siteTags.BOOKMARK))
      return
    }

    e.dataTransfer.getData('text/uri-list')
      .split('\n')
      .map((x) => x.trim())
      .filter((x) => !x.startsWith('#') && x.length > 0)
      .forEach((url) =>
        appActions.addSite({ location: url }, siteTags.BOOKMARK))
  }
  openContextMenu (bookmark, e) {
    contextMenus.onSiteDetailContextMenu(bookmark, this.activeFrame, e)
  }
  clickBookmarkItem (bookmark, e) {
    return bookmarkActions.clickBookmarkItem(this.bookmarks, bookmark, this.activeFrame, e)
  }
  showBookmarkFolderMenu (bookmark, e) {
    windowActions.setBookmarksToolbarSelectedFolderId(bookmark.get('folderId'))
    contextMenus.onShowBookmarkFolderMenu(this.bookmarks, bookmark, this.activeFrame, e)
  }
  updateBookmarkData (props) {
    this.bookmarks = siteUtil.getBookmarks(props.sites).toList().sort(siteUtil.siteSort)

    const noParentItems = this.bookmarks
      .filter((bookmark) => !bookmark.get('parentFolderId'))
    let widthAccountedFor = 0
    const overflowButtonWidth = 25

    // Dynamically calculate how many bookmark items should appear on the toolbar
    // before it is actually rendered.
    if (!this.root) {
      this.root = window.getComputedStyle(document.querySelector(':root'))
      this.maxWidth = Number.parseInt(this.root.getPropertyValue('--bookmark-item-max-width'), 10)
      this.padding = Number.parseInt(this.root.getPropertyValue('--bookmark-item-padding'), 10) * 2
      // Toolbar padding is only on the left
      this.toolbarPadding = Number.parseInt(this.root.getPropertyValue('--bookmarks-toolbar-padding'), 10)
      this.bookmarkItemMargin = Number.parseInt(this.root.getPropertyValue('--bookmark-item-margin'), 10) * 2
      // No margin for show only favicons
      this.chevronMargin = Number.parseInt(this.root.getPropertyValue('--bookmark-item-chevron-margin'), 10)
      this.fontSize = this.root.getPropertyValue('--bookmark-item-font-size')
      this.fontFamily = this.root.getPropertyValue('--default-font-family')
      this.chevronWidth = this.chevronMargin + Number.parseInt(this.fontSize)
    }
    const margin = props.showFavicon && props.showOnlyFavicon ? 0 : this.bookmarkItemMargin
    widthAccountedFor += this.toolbarPadding

    // Loop through until we fill up the entire bookmark toolbar width
    let i
    for (i = 0; i < noParentItems.size; i++) {
      let iconWidth = props.showFavicon ? iconSize : 0
      // font-awesome file icons are 3px smaller
      if (props.showFavicon && !noParentItems.getIn([i, 'folderId']) && !noParentItems.getIn([i, 'favicon'])) {
        iconWidth -= 3
      }
      const chevronWidth = props.showFavicon && noParentItems.getIn([i, 'folderId']) ? this.chevronWidth : 0
      if (props.showFavicon && props.showOnlyFavicon) {
        widthAccountedFor += this.padding + iconWidth + chevronWidth
      } else {
        const text = noParentItems.getIn([i, 'customTitle']) || noParentItems.getIn([i, 'title']) || noParentItems.getIn([i, 'location'])
        widthAccountedFor += Math.min(calculateTextWidth(text, `${this.fontSize} ${this.fontFamily}`) + this.padding + iconWidth + chevronWidth, this.maxWidth)
      }
      widthAccountedFor += margin
      if (widthAccountedFor >= props.windowWidth - overflowButtonWidth) {
        break
      }
    }
    this.bookmarksForToolbar = noParentItems.take(i).sort(siteUtil.siteSort)
    // Show at most 100 items in the overflow menu
    this.overflowBookmarkItems = noParentItems.skip(i).take(100).sort(siteUtil.siteSort)
  }
  componentWillMount () {
    this.updateBookmarkData(this.props)
  }
  componentWillUpdate (nextProps) {
    if (nextProps.sites !== this.props.sites ||
        nextProps.windowWidth !== this.props.windowWidth ||
        nextProps.showFavicon !== this.props.showFavicon ||
        nextProps.showOnlyFavicon !== this.props.showOnlyFavicon) {
      this.updateBookmarkData(nextProps)
    }
  }
  onDragEnter (e) {
    if (dndData.hasDragData(e.dataTransfer, dragTypes.BOOKMARK)) {
      if (Array.from(e.target.classList).includes('overflowIndicator')) {
        this.onMoreBookmarksMenu(e)
      }
    }
  }
  onDragOver (e) {
    const sourceDragData = dndData.getDragData(e.dataTransfer, dragTypes.BOOKMARK)
    if (sourceDragData) {
      e.dataTransfer.dropEffect = 'move'
      e.preventDefault()
      return
    }
    // console.log(e.dataTransfer.types, e.dataTransfer.getData('text/plain'), e.dataTransfer.getData('text/uri-list'), e.dataTransfer.getData('text/html'))
    let intersection = e.dataTransfer.types.filter((x) =>
      ['text/plain', 'text/uri-list', 'text/html', 'Files'].includes(x))
    if (intersection.length > 0) {
      e.dataTransfer.dropEffect = 'copy'
      e.preventDefault()
    }
  }
  onMoreBookmarksMenu (e) {
    contextMenus.onMoreBookmarksMenu(this.activeFrame, this.bookmarks, this.overflowBookmarkItems, e)
  }
  onContextMenu (e) {
    const closest = dnd.closestFromXOffset(this.bookmarkRefs.filter((x) => !!x), e.clientX).selectedRef
    contextMenus.onTabsToolbarContextMenu(this.activeFrame, (closest && closest.props.bookmark) || undefined, closest && closest.isDroppedOn, e)
  }
  render () {
    let showFavicon = this.props.showFavicon
    let showOnlyFavicon = this.props.showOnlyFavicon

    this.bookmarkRefs = []
    return <div
      className={cx({
        bookmarksToolbar: true,
        showFavicon,
        showOnlyFavicon,
        [css(styles.bookmarksToolbar)]: true,
        [css(this.props.shouldAllowWindowDrag && styles.bookmarksToolbar__allowDragging)]: true,
        [css(styles.bookmarksToolbar__showOnlyFavicon)]: true
      })}
      data-test-id='bookmarksToolbar'
      onDrop={this.onDrop}
      onDragEnter={this.onDragEnter}
      onDragOver={this.onDragOver}
      onContextMenu={this.onContextMenu}>
      {
          this.bookmarksForToolbar.map((bookmark, i) =>
            <BookmarkToolbarButton
              ref={(node) => this.bookmarkRefs.push(node)}
              key={i}
              contextMenuDetail={this.props.contextMenuDetail}
              activeFrameKey={this.props.activeFrameKey}
              draggingOverData={this.props.draggingOverData}
              openContextMenu={this.openContextMenu}
              clickBookmarkItem={this.clickBookmarkItem}
              showBookmarkFolderMenu={this.showBookmarkFolderMenu}
              bookmark={bookmark}
              showFavicon={this.props.showFavicon}
              showOnlyFavicon={this.props.showOnlyFavicon}
              selectedFolderId={this.props.selectedFolderId} />)
      }
      {
        this.overflowBookmarkItems.size !== 0
        ? <BrowserButton
          iconClass={globalStyles.appIcons.angleDoubleRight}
          onClick={this.onMoreBookmarksMenu}
          custom={[
            styles.bookmarksToolbar__bookmarkButton,
            styles.bookmarksToolbar__overflowIndicator
          ]} />
        : null
      }
    </div>
  }
}

const styles = StyleSheet.create({
  bookmarksToolbar: {
    boxSizing: 'border-box',
    display: 'flex',
    flex: 1,
    padding: `${globalStyles.spacing.navbarMenubarMargin} 10px`
  },
  bookmarksToolbar__allowDragging: {
    WebkitAppRegion: 'drag'
  },
  bookmarksToolbar__showOnlyFavicon: {
    padding: `${globalStyles.spacing.navbarMenubarMargin} 0 ${globalStyles.spacing.tabPagesHeight} 10px`
  },
  bookmarksToolbar__bookmarkButton: {
    boxSizing: 'border-box',
    fontSize: '14px',
    height: 'auto',
    lineHeight: '12px',
    marginLeft: 'auto',
    marginRight: '5px',
    width: 'auto',
    userSelect: 'none'
  },
  bookmarksToolbar__overflowIndicator: {
    paddingLeft: '6px',
    paddingRight: '11px',
    margin: 'auto 0 auto auto',
    WebkitAppRegion: 'no-drag'
  }
})

module.exports = BookmarksToolbar
