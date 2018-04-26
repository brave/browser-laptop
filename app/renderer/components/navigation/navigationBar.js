/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const Immutable = require('immutable')

// Components
const ReduxComponent = require('../reduxComponent')
const UrlBar = require('./urlBar')
const AddEditBookmarkHanger = require('../bookmarks/addEditBookmarkHanger')
const PublisherToggle = require('./publisherToggle')
const BookmarkButton = require('./buttons/bookmarkButton')
const ReloadButton = require('./buttons/reloadButton')
const StopButton = require('./buttons/stopButton')

const settings = require('../../../../js/constants/settings')

// State
const tabState = require('../../../common/state/tabState')
const publisherState = require('../../../common/lib/publisherUtil')
const frameStateUtil = require('../../../../js/state/frameStateUtil')
const ledgerState = require('../../../common/state/ledgerState')

// Utils
const cx = require('../../../../js/lib/classSet')
const {getBaseUrl} = require('../../../../js/lib/appUrlUtil')
const {getSetting} = require('../../../../js/settings')
const bookmarkLocationCache = require('../../../common/cache/bookmarkLocationCache')

const {StyleSheet, css} = require('aphrodite/no-important')

class NavigationBar extends React.Component {
  mergeProps (state, ownProps) {
    const currentWindow = state.get('currentWindow')
    const activeFrame = frameStateUtil.getActiveFrame(currentWindow) || Immutable.Map()
    const activeFrameKey = activeFrame.get('key')
    const activeTabId = activeFrame.get('tabId', tabState.TAB_ID_NONE)

    const activeTabShowingMessageBox = tabState.isShowingMessageBox(state, activeTabId)
    const bookmarkDetail = currentWindow.get('bookmarkDetail', Immutable.Map())
    const mouseInTitlebar = currentWindow.getIn(['ui', 'mouseInTitlebar'])
    const title = activeFrame.get('title', '')
    const loading = activeFrame.get('loading')
    const location = activeFrame.get('location', '')
    const locationId = getBaseUrl(location)
    const publisherKey = ledgerState.getLocationProp(state, locationId, 'publisher')
    const navbar = activeFrame.get('navbar', Immutable.Map())
    const locationCache = bookmarkLocationCache.getCacheKey(state, location)

    const hasTitle = title && location && title !== location.replace(/^https?:\/\//, '')
    const titleMode =
      (
        mouseInTitlebar === false &&
        bookmarkDetail.isEmpty() &&
        hasTitle &&
        !['about:blank', 'about:newtab'].includes(location) &&
        !loading &&
        !navbar.getIn(['urlbar', 'focused']) &&
        !navbar.getIn(['urlbar', 'active']) &&
        getSetting(settings.DISABLE_TITLE_MODE) === false
      )

    const props = {}
    // used in renderer
    props.activeFrameKey = activeFrameKey
    props.activeTabShowingMessageBox = activeTabShowingMessageBox
    props.titleMode = titleMode
    props.isWideUrlBarEnabled = getSetting(settings.WIDE_URL_BAR)
    props.showBookmarkHanger = bookmarkDetail.get('isBookmarkHanger', false)
    props.isLoading = loading
    props.isFocused = navbar.getIn(['urlbar', 'focused'], false)
    props.shouldRenderSuggestions = navbar.getIn(['urlbar', 'suggestions', 'shouldRender']) === true

    props.showPublisherToggle = publisherState.shouldShowAddPublisherButton(state, location, publisherKey)
    props.activeTabId = activeTabId
    props.bookmarkKey = locationCache.get(0, false)

    return props
  }

  render () {
    return <div
      id='navigator'
      data-frame-key={this.props.activeFrameKey}
      data-test-id='navigator'
      className={cx({
        titleMode: this.props.titleMode,
        [css(this.props.activeTabShowingMessageBox && styles.navigator_isActiveTabShowingMessageBox, this.props.isWideUrlBarEnabled && styles.navigator_wide)]: true
      })}>
      {
        this.props.showBookmarkHanger
        ? <AddEditBookmarkHanger />
        : null
      }

      {
        this.props.isLoading
          ? <StopButton isFocused={this.props.isFocused} shouldRenderSuggestions={this.props.shouldRenderSuggestions} />
          : <ReloadButton activeTabId={this.props.activeTabId} />
      }

      <BookmarkButton bookmarkKey={this.props.bookmarkKey} />
      <UrlBar titleMode={this.props.titleMode} />
      {
        this.props.showPublisherToggle
        ? <PublisherToggle />
        : null
      }
    </div>
  }
}

const styles = StyleSheet.create({
  navigator_isActiveTabShowingMessageBox: {
    // See browserButton_disabled and braveMenu_disabled
    opacity: 0.25,
    pointerEvents: 'none'
  },

  navigator_wide: {
    // TODO: Refactor navigationBar.js to remove !important
    maxWidth: '100% !important',
    marginRight: '0 !important',
    justifyContent: 'initial !important'
  }
})

module.exports = ReduxComponent.connect(NavigationBar)
