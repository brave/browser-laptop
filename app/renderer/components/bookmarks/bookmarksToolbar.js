/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const ReactDOM = require('react-dom')
const {StyleSheet, css} = require('aphrodite/no-important')
const Immutable = require('immutable')

// Components
const ReduxComponent = require('../reduxComponent')
const BookmarkToolbarButton = require('./bookmarkToolbarButton')
const BookmarksToolbarOverflowIcon = require('./bookmarksToolbarOverflowIcon')

// Actions
const appActions = require('../../../../js/actions/appActions')
const windowActions = require('../../../../js/actions/windowActions')

// State
const windowState = require('../../../common/state/windowState')
const bookmarksState = require('../../../common/state/bookmarksState')

// Constants
const dragTypes = require('../../../../js/constants/dragTypes')
const siteTags = require('../../../../js/constants/siteTags')
const {bookmarksToolbarMode} = require('../../../common/constants/settingsEnums')

// Utils
const {isFocused} = require('../../currentWindow')
const contextMenus = require('../../../../js/contextMenus')
const dnd = require('../../../../js/dnd')
const dndData = require('../../../../js/dndData')
const isWindows = require('../../../common/lib/platformUtil').isWindows()
const bookmarkUtil = require('../../../common/lib/bookmarkUtil')
const frameStateUtil = require('../../../../js/state/frameStateUtil')
const {elementHasDataset} = require('../../../../js/lib/eventUtil')

// Styles
const globalStyles = require('../styles/global')

function getHiddenKeys (elements, immutableAllKeys) {
  if (!elements || !elements.length) {
    return
  }
  let firstOtherKey
  // check again which ones are missing as now the indicator is there, we may have additional
  for (let i = 1; i < elements.length; i++) {
    // skip first item (0)
    const thisElement = elements[i]
    if (thisElement.offsetTop > 10) {
      // the [i]th item is the first that does not fit
      firstOtherKey = thisElement.dataset.bookmarkKey
      break
    }
  }
  if (firstOtherKey) {
    const firstOtherIndex = immutableAllKeys.indexOf(firstOtherKey)
    if (firstOtherIndex !== -1) {
      const hiddenKeys = immutableAllKeys.slice(firstOtherIndex)
      return hiddenKeys
    }
  }
}

class BookmarksToolbar extends React.Component {
  constructor (props) {
    super(props)
    this.onDrop = this.onDrop.bind(this)
    this.onDragEnter = this.onDragEnter.bind(this)
    this.onDragOver = this.onDragOver.bind(this)
    this.onContextMenu = this.onContextMenu.bind(this)
    this.onMoreBookmarksMenu = this.onMoreBookmarksMenu.bind(this)
    this.setBookmarksToolbarRef = this.setBookmarksToolbarRef.bind(this)
  }

  onDrop (e) {
    e.preventDefault()
    const getClosestFromPos = (clientX, sourceKey) =>
      dnd.closestFromXOffset(this.bookmarkRefs.filter((bookmarkRef) => {
        if (!bookmarkRef) {
          return false
        }
        return bookmarkRef.props.bookmarkKey !== sourceKey
      }), e.clientX)
    let bookmark = dnd.prepareBookmarkDataFromCompatible(e.dataTransfer)
    if (bookmark) {
      // Figure out the droppedOn element filtering out the source drag item
      let bookmarkKey = bookmark.get('key')
      let tabDrop = false

      // When we have key null is only when we are getting data from TAB transfer type
      if (bookmarkKey == null) {
        tabDrop = true
      }

      const droppedOn = getClosestFromPos(e.clientX, bookmarkKey)
      if (droppedOn.selectedRef) {
        const isRightSide = !dnd.isLeftSide(ReactDOM.findDOMNode(droppedOn.selectedRef), e.clientX)
        const droppedOnKey = droppedOn.selectedRef.props.bookmarkKey
        const isDestinationParent = droppedOn.selectedRef.state.isFolder && droppedOn && droppedOn.isDroppedOn
        if (tabDrop) {
          const parentKey = isDestinationParent ? droppedOnKey : null
          bookmark = bookmark.set('parentFolderId', parentKey)
          appActions.addBookmark(bookmark)
        } else {
          if (bookmark.get('type') === siteTags.BOOKMARK_FOLDER) {
            appActions.moveBookmarkFolder(bookmarkKey, droppedOnKey, isRightSide, isDestinationParent)
          } else {
            appActions.moveBookmark(bookmarkKey, droppedOnKey, isRightSide, isDestinationParent)
          }
        }
        dnd.onDragEnd()
      }
      return
    }

    const droppedOn = getClosestFromPos(e.clientX, undefined)
    let isLeftSide = false
    let closestKey
    if (droppedOn.selectedRef) {
      closestKey = droppedOn.selectedRef.props.bookmarkKey
      isLeftSide = dnd.isLeftSide(ReactDOM.findDOMNode(droppedOn.selectedRef), e.clientX)
    }

    const droppedHTML = e.dataTransfer.getData('text/html')
    if (droppedHTML) {
      const parser = new window.DOMParser()
      const doc = parser.parseFromString(droppedHTML, 'text/html')
      const a = doc.querySelector('a')
      if (a && a.href) {
        appActions.addBookmark(Immutable.fromJS({
          title: a.innerText,
          location: e.dataTransfer.getData('text/plain')
        }), closestKey, isLeftSide)
        return
      }
    }

    if (e.dataTransfer.files.length > 0) {
      Array.from(e.dataTransfer.items).forEach((item) => {
        item.getAsString((name) => appActions.addBookmark(Immutable.fromJS({
          location: item.type,
          title: name
        }), closestKey, isLeftSide))
      })
      return
    }

    e.dataTransfer.getData('text/uri-list')
      .split('\n')
      .map((x) => x.trim())
      .filter((x) => !x.startsWith('#') && x.length > 0)
      .forEach((url) =>
        appActions.addBookmark(Immutable.fromJS({ location: url }), closestKey, isLeftSide))
  }

  onDragEnter (e) {
    if (dndData.hasDragData(e.dataTransfer, dragTypes.BOOKMARK)) {
      if (elementHasDataset(e.target, 'overflowIndicator')) {
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

    let intersection = e.dataTransfer.types.filter((x) =>
      ['text/plain', 'text/uri-list', 'text/html', 'Files'].includes(x))
    if (intersection.length > 0) {
      e.dataTransfer.dropEffect = 'copy'
      e.preventDefault()
    }
  }

  onMoreBookmarksMenu (e) {
    const rect = e.target.getBoundingClientRect()
    windowActions.onMoreBookmarksMenu(this.hiddenBookmarkKeys, rect.bottom)
  }

  onContextMenu (e) {
    const closest = dnd.closestFromXOffset(this.bookmarkRefs.filter((x) => !!x), e.clientX).selectedRef
    contextMenus.onTabsToolbarContextMenu(
      this.props.title,
      this.props.location,
      (closest && closest.props.bookmark) || undefined,
      closest && closest.isDroppedOn,
      e
    )
  }

  mergeProps (state, ownProps) {
    const currentWindow = state.get('currentWindow')
    const activeFrame = frameStateUtil.getActiveFrame(currentWindow) || Immutable.Map()
    const toolbarMode = bookmarkUtil.getBookmarksToolbarMode(state)

    const props = {}
    // used in renderer
    props.shouldAllowWindowDrag = !isWindows && windowState.shouldAllowWindowDrag(state, currentWindow, activeFrame, isFocused(state))
    props.toolbarBookmarks = bookmarksState.getBookmarksWithFolders(state, 0).take(110).map(item => item.get('key'))
    props.textOnly = (toolbarMode === bookmarksToolbarMode.TEXT_ONLY)
    props.bookmarkDisplayMode = toolbarMode // also forces re-compute toolbar space after change mode
    // used in other functions
    props.title = activeFrame.get('title')
    props.location = activeFrame.get('location')

    return props
  }

  calculateNonFirstRowItems () {
    if (!this.bookmarksToolbarRef) {
      return
    }
    const bookmarkRefs = this.bookmarksToolbarRef.children
    const classNameShowOverflow = css(styles.bookmarksToolbar_hasOverflow)
    this.hiddenBookmarkKeys = null
    this.hasHiddenKeys = false
    // first check which items overflow with indicator visible
    this.bookmarksToolbarRef.classList.add(classNameShowOverflow)
    // and save which keys were hidden for the overflow menu to open
    this.hiddenBookmarkKeys = getHiddenKeys(bookmarkRefs, this.props.toolbarBookmarks)
    // we don't need indicator if there were no hidden items with / without it
    this.bookmarksToolbarRef.classList.remove(classNameShowOverflow)
    // if there were hidden items with the indicator
    if (this.hiddenBookmarkKeys && this.hiddenBookmarkKeys.size) {
      // check again to see if we really need the indicator
      const hiddenKeysWithNoIndicator = getHiddenKeys(bookmarkRefs, this.props.toolbarBookmarks)
      if (hiddenKeysWithNoIndicator && hiddenKeysWithNoIndicator.size) {
        // add overflow indicator as needed
        this.hasHiddenKeys = true
        this.bookmarksToolbarRef.classList.add(classNameShowOverflow)
      }
    }
  }

  setBookmarksToolbarRef (ref) {
    const oldRef = this.bookmarksToolbarRef
    this.bookmarksToolbarRef = ref
    // handle there was a previous element
    if (oldRef) {
      // do not monitor size change for old element
      // but we can keep ResizeObserver around
      // note: this shouldn't happen because we're always returning
      // the same root element from this.render(), but it's best practice.
      if (this.resizeObserver) {
        this.resizeObserver.unobserve(oldRef)
      }
    }
    // handle null element this time
    if (!ref) {
      return
    }
    // recalculate which items are not on a single line on resize
    let debounceAnimationFrame
    this.resizeObserver = this.resizeObserver || new window.ResizeObserver(() => {
      // (only once before the next paint frame)
      debounceAnimationFrame = debounceAnimationFrame || window.requestAnimationFrame(() => {
        debounceAnimationFrame = null
        this.calculateNonFirstRowItems()
      })
    })
    // observe this ref
    this.resizeObserver.observe(this.bookmarksToolbarRef)
  }

  componentDidUpdate (prevProps) {
    // Only recalc which bookmark items are overflowed if the bookmarks changed
    // or the display mode changed.
    if (prevProps.bookmarkDisplayMode !== this.props.bookmarkDisplayMode || !prevProps.toolbarBookmarks.equals(this.props.toolbarBookmarks)) {
      // No need to wait for the new DOM render result to paint
      // before measuring since reading offsetTop of the elements
      // will force layout to be computed.
      this.calculateNonFirstRowItems()
    }
  }

  render () {
    this.bookmarkRefs = []
    return <div
      className={
        css(
          styles.bookmarksToolbar,
          this.props.textOnly && styles.bookmarksToolbar_textOnly,
          this.props.shouldAllowWindowDrag && styles.bookmarksToolbar_allowDragging,
          !this.props.shouldAllowWindowDrag && styles.bookmarksToolbar_disallowDragging
        ) +
        // Ensure we do not remove overflow indicator on props change
        // Aphrodite does not support data-attribute selectors :-(
        // which would be nice to control this functionality.
        // Instead, we must use a custom class, added by `calculateNonFirstRowItems`
        // which gets overriden by this `className` attribute here.
        (this.hasHiddenKeys
          ? ' ' + css(styles.bookmarksToolbar_hasOverflow)
          : '')
      }
      data-test-id='bookmarksToolbar'
      onDrop={this.onDrop}
      onDragEnter={this.onDragEnter}
      onDragOver={this.onDragOver}
      onContextMenu={this.onContextMenu}
      ref={this.setBookmarksToolbarRef}
    >
      {
        this.props.toolbarBookmarks.map((bookmarkKey, i) =>
          <BookmarkToolbarButton
            ref={(node) => this.bookmarkRefs.push(node)}
            key={`toolbar-button-${i}`}
            bookmarkKey={bookmarkKey}
            bookmarkDisplayMode={this.props.bookmarkDisplayMode}
          />)
      }
      <button
        className={css(
          styles.bookmarksToolbar__overflowIndicator
        )}
        data-bookmarks-overflow-indicator
        onClick={this.onMoreBookmarksMenu}
      >
        <BookmarksToolbarOverflowIcon
          className={css(styles.bookmarksToolbar__overflowIndicator__icon)}
        />
      </button>
    </div>
  }
}

const styles = StyleSheet.create({
  bookmarksToolbar: {
    '--bookmarks-toolbar-overflow-indicator-width': '0px',
    '--bookmarks-toolbar-height': globalStyles.spacing.bookmarksToolbarHeight,
    flex: 1,
    boxSizing: 'border-box',
    height: 'var(--bookmarks-toolbar-height)',
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    overflow: 'hidden',
    // leave space on the right for the overflow button when appropriate
    // aphrodite cannot have a calc in a shorthand padding declaration :-(
    paddingRight: `calc(${globalStyles.spacing.bookmarksToolbarPadding} + var(--bookmarks-toolbar-overflow-indicator-width))`,
    paddingTop: 0,
    paddingBottom: 0,
    paddingLeft: globalStyles.spacing.bookmarksToolbarPadding,
    margin: `${globalStyles.spacing.navbarMenubarMargin} 0`,
    position: 'relative'
  },

  bookmarksToolbar_textOnly: {
    '--bookmarks-toolbar-height': globalStyles.spacing.bookmarksToolbarTextOnlyHeight
  },

  bookmarksToolbar_hasOverflow: {
    '--bookmarks-toolbar-overflow-indicator-visibility': 'visible',
    '--bookmarks-toolbar-overflow-indicator-width': `${globalStyles.spacing.bookmarksToolbarOverflowButtonWidth} !important`
  },

  bookmarksToolbar_allowDragging: {
    WebkitAppRegion: 'drag'
  },

  bookmarksToolbar_disallowDragging: {
    WebkitAppRegion: 'no-drag'
  },

  bookmarksToolbar__overflowIndicator: {
    WebkitAppRegion: 'no-drag',
    position: 'absolute',
    top: 0,
    right: 0,
    height: 'var(--bookmarks-toolbar-height)',
    margin: `0 calc(${globalStyles.spacing.bookmarksToolbarPadding} + 5px) 0 auto`,
    visibility: 'var(--bookmarks-toolbar-overflow-indicator-visibility, hidden)',
    border: 'none',
    background: 'transparent',
    padding: 0,
    width: 'auto',
    outline: 'none',
    display: 'flex',
    alignItems: 'center',
    color: globalStyles.button.color,
    ':hover': {
      color: globalStyles.button.default.hoverColor
    }
  },

  bookmarksToolbar__overflowIndicator__icon: {
    width: globalStyles.spacing.bookmarksToolbarOverflowButtonWidth,
    height: 'auto'
  }
})

module.exports = ReduxComponent.connect(BookmarksToolbar)
