/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const Immutable = require('immutable')
const ipc = require('electron').ipcRenderer

// Components
const ReduxComponent = require('../reduxComponent')
const UrlBar = require('./urlBar')
const AddEditBookmarkHanger = require('../bookmarks/addEditBookmarkHanger')
const PublisherToggle = require('./publisherToggle')
const LongPressButton = require('../common/longPressButton')
const HomeButton = require('./homeButton')

// Actions
const windowActions = require('../../../../js/actions/windowActions')
const appActions = require('../../../../js/actions/appActions')

// Constants
const messages = require('../../../../js/constants/messages')
const settings = require('../../../../js/constants/settings')

// State
const tabState = require('../../../common/state/tabState')
const publisherState = require('../../../common/lib/publisherUtil')
const frameStateUtil = require('../../../../js/state/frameStateUtil')

// Utils
const cx = require('../../../../js/lib/classSet')
const {getBaseUrl} = require('../../../../js/lib/appUrlUtil')
const eventUtil = require('../../../../js/lib/eventUtil')
const {getSetting} = require('../../../../js/settings')
const contextMenus = require('../../../../js/contextMenus')
const bookmarkLocationCache = require('../../../common/cache/bookmarkLocationCache')

const {StyleSheet, css} = require('aphrodite/no-important')

class NavigationBar extends React.Component {
  constructor (props) {
    super(props)
    this.onToggleBookmark = this.onToggleBookmark.bind(this)
    this.onStop = this.onStop.bind(this)
    this.onReload = this.onReload.bind(this)
    this.onReloadLongPress = this.onReloadLongPress.bind(this)
  }

  onToggleBookmark () {
    if (this.props.isBookmarked) {
      windowActions.editBookmark(this.props.bookmarkKey, true)
    } else {
      windowActions.onBookmarkAdded(true)
    }
  }

  onReload (e) {
    if (eventUtil.isForSecondaryAction(e)) {
      appActions.tabCloned(this.props.activeTabId, {active: !!e.shiftKey})
    } else {
      ipc.emit(messages.SHORTCUT_ACTIVE_FRAME_RELOAD)
    }
  }

  onReloadLongPress (target) {
    contextMenus.onReloadContextMenu(target)
  }

  onStop () {
    // TODO (bridiver) - remove shortcut
    ipc.emit(messages.SHORTCUT_ACTIVE_FRAME_STOP)
    windowActions.onStop(this.props.isFocused, this.props.shouldRenderSuggestions)
  }

  componentDidMount () {
    ipc.on(messages.SHORTCUT_ACTIVE_FRAME_BOOKMARK, () => this.onToggleBookmark())
    ipc.on(messages.SHORTCUT_ACTIVE_FRAME_REMOVE_BOOKMARK, () => this.onToggleBookmark())
  }

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
    const publisherId = state.getIn(['locationInfo', locationId, 'publisher'])
    const navbar = activeFrame.get('navbar', Immutable.Map())
    const locationCache = bookmarkLocationCache.getCacheKey(state, location)
    const bookmarkKey = locationCache.get(0, false)

    const hasTitle = title && location && title !== location.replace(/^https?:\/\//, '')
    const titleMode = activeTabShowingMessageBox ||
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
    props.titleMode = titleMode
    props.isBookmarked = !!bookmarkKey
    props.isWideUrlBarEnabled = getSetting(settings.WIDE_URL_BAR)
    props.showBookmarkHanger = bookmarkDetail.get('isBookmarkHanger', false)
    props.isLoading = loading
    props.showPublisherToggle = publisherState.shouldShowAddPublisherButton(state, location, publisherId)
    props.showHomeButton = !props.titleMode && getSetting(settings.SHOW_HOME_BUTTON)

    // used in other functions
    props.isFocused = navbar.getIn(['urlbar', 'focused'], false)
    props.shouldRenderSuggestions = navbar.getIn(['urlbar', 'suggestions', 'shouldRender']) === true
    props.activeTabId = activeTabId
    props.bookmarkKey = bookmarkKey
    props.showHomeButton = !props.titleMode && getSetting(settings.SHOW_HOME_BUTTON)

    return props
  }

  render () {
    if (this.props.dontRender) {
      return null
    }

    return <div
      id='navigator'
      data-frame-key={this.props.activeFrameKey}
      className={cx({
        titleMode: this.props.titleMode,
        [css(styles.navigator_wide)]: this.props.isWideUrlBarEnabled
      })}>
      {
        this.props.showBookmarkHanger
        ? <AddEditBookmarkHanger />
        : null
      }
      {
        this.props.titleMode
        ? null
        : this.props.isLoading
          ? <span className='navigationButtonContainer'>
            <button data-l10n-id='stopButton'
              className='normalizeButton navigationButton stopButton'
              onClick={this.onStop} />
          </span>
          : <span className='navigationButtonContainer'>
            <LongPressButton
              l10nId='reloadButton'
              className='normalizeButton navigationButton reloadButton'
              onClick={this.onReload}
              onLongPress={this.onReloadLongPress} />
          </span>
      }
      {
        this.props.showHomeButton
        ? <HomeButton activeTabId={this.props.activeTabId} />
        : null
      }
      <div className='startButtons'>
        {
          !this.props.titleMode
          ? <span className='bookmarkButtonContainer'>
            <button data-l10n-id={this.props.isBookmarked ? 'removeBookmarkButton' : 'addBookmarkButton'}
              className={cx({
                navigationButton: true,
                bookmarkButton: true,
                removeBookmarkButton: this.props.isBookmarked,
                withHomeButton: getSetting(settings.SHOW_HOME_BUTTON),
                normalizeButton: true
              })}
              onClick={this.onToggleBookmark} />
          </span>
          : null
        }
      </div>
      <UrlBar titleMode={this.props.titleMode} />
      {
        this.props.showPublisherToggle
        ? <div className='endButtons'>
          <PublisherToggle />
        </div>
        : null
      }
    </div>
  }
}

const styles = StyleSheet.create({
  navigator_wide: {

    // TODO: Refactor navigationBar.js to remove !important
    maxWidth: '100% !important',
    marginRight: '0 !important',
    justifyContent: 'initial !important'
  }
})

module.exports = ReduxComponent.connect(NavigationBar)
