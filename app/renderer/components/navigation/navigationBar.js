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
const NavigationBarButtonContainer = require('./buttons/navigationBarButtonContainer')

// Components -> buttons
const StopButton = require('./buttons/stopButton')
const ReloadButton = require('./buttons/reloadButton')
const HomeButton = require('./buttons/homeButton')
const BookmarkButton = require('./buttons/bookmarkButton')
const PublisherToggle = require('./publisherToggle')

// Actions
const windowActions = require('../../../../js/actions/windowActions')

// Constants
const messages = require('../../../../js/constants/messages')
const settings = require('../../../../js/constants/settings')

// State
const tabState = require('../../../common/state/tabState')
const menuBarState = require('../../../common/state/menuBarState')
const publisherState = require('../../../common/lib/publisherUtil')
const frameStateUtil = require('../../../../js/state/frameStateUtil')

// Utils
const cx = require('../../../../js/lib/classSet')
const {getBaseUrl} = require('../../../../js/lib/appUrlUtil')
const siteUtil = require('../../../../js/state/siteUtil')
const {getSetting} = require('../../../../js/settings')
const {isDarwin} = require('../../../common/lib/platformUtil')
const {isFullScreen} = require('../../currentWindow')

const {StyleSheet, css} = require('aphrodite/no-important')
const globalStyles = require('../styles/global')

class NavigationBar extends React.Component {
  constructor (props) {
    super(props)
    this.onStop = this.onStop.bind(this)
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
    const activeTab = tabState.getByTabId(state, activeTabId)

    const activeTabShowingMessageBox = tabState.isShowingMessageBox(state, activeTabId)
    const bookmarkDetail = currentWindow.get('bookmarkDetail', Immutable.Map())
    const mouseInTitlebar = currentWindow.getIn(['ui', 'mouseInTitlebar'])
    const title = activeFrame.get('title', '')
    const loading = activeFrame.get('loading')
    const location = activeFrame.get('location', '')
    const locationId = getBaseUrl(location)
    const publisherId = state.getIn(['locationInfo', locationId, 'publisher'])
    const navbar = activeFrame.get('navbar', Immutable.Map())

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
    props.isBookmarked = activeFrameKey !== undefined &&
      activeTab && activeTab.get('bookmarked')
    props.isWideURLbarEnabled = getSetting(settings.WIDE_URL_BAR)
    props.showBookmarkHanger = bookmarkDetail.get('isBookmarkHanger', false)
    props.isLoading = loading
    props.showPublisherToggle = publisherState.shouldShowAddPublisherButton(state, location, publisherId)
    props.showHomeButton = !props.titleMode && getSetting(settings.SHOW_HOME_BUTTON)

    // used in other functions
    props.isFocused = navbar.getIn(['urlbar', 'focused'], false)
    props.shouldRenderSuggestions = navbar.getIn(['urlbar', 'suggestions', 'shouldRender']) === true
    props.activeTabId = activeTabId
    props.bookmarkKey = siteUtil.getSiteKey(activeFrame)
    props.showHomeButton = !props.titleMode && getSetting(settings.SHOW_HOME_BUTTON)

    props.location = location
    props.isDarwin = isDarwin()
    props.isFullScreen = isFullScreen()
    props.bookmarkDetail = bookmarkDetail
    props.menubarVisible = menuBarState.isMenuBarVisible(currentWindow)
    props.siteSettings = state.get('siteSettings')
    props.synopsis = state.getIn(['publisherInfo', 'synopsis']) || new Immutable.Map()
    props.locationInfo = state.get('locationInfo')

    return props
  }

  render () {
    if (this.props.dontRender) {
      return null
    }

    return <div id='navigationBar'
      data-test-id='navigationBar'
      data-frame-key={this.props.activeFrameKey}
      className={cx({
        titleMode: this.props.titleMode,
        [css(styles.navigationBar, (this.props.isDarwin && this.props.isFullScreen) && styles.navigationBar_isDarwin_isFullScreen, this.props.titleMode && styles.navigationBar_titleMode, this.props.isWideURLbarEnabled && styles.navigationBar_wide)]: true
      })}>
      {
        this.props.showBookmarkHanger
        ? <AddEditBookmarkHanger />
        : null
      }
      {
        !this.props.titleMode
        ? (
          <NavigationBarButtonContainer isStandalone onNavigationBarChrome>
            {
              this.props.isLoading
              ? <StopButton onStop={this.onStop} />
              : <ReloadButton />
            }
          </NavigationBarButtonContainer>
        )
        : null
      }
      {
        !this.props.titleMode && this.props.showHomeButton
        ? (
          <NavigationBarButtonContainer isStandalone onNavigationBarChrome>
            <HomeButton />
          </NavigationBarButtonContainer>
        )
        : null
      }
      {
        !this.props.titleMode
        ? (
          <NavigationBarButtonContainer isSquare isNested
            containerFor={styles.navigationBar__urlBarStart}
          >
            <BookmarkButton />
          </NavigationBarButtonContainer>
          )
        : null
      }
      <UrlBar titleMode={this.props.titleMode} />
      {
        !this.props.titleMode && this.props.showPublisherToggle
        ? (
          <NavigationBarButtonContainer isSquare isNested
            containerFor={styles.navigationBar__urlBarEnd}
          >
            <PublisherToggle />
          </NavigationBarButtonContainer>
          )
        : null
      }
    </div>
  }
}

const styles = StyleSheet.create({
  navigationBar: {
    boxSizing: 'border-box',
    display: 'flex',
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '20px',
    minWidth: '0%', // allow the navigationBar to shrink
    maxWidth: '900px',
    marginRight: `calc(${globalStyles.spacing.navbarLeftMarginDarwin} / 2)`,
    padding: 0,
    position: 'relative',
    userSelect: 'none',
    zIndex: globalStyles.zindex.zindexNavigationBar
  },

  navigationBar_isDarwin_isFullScreen: {
    marginRight: 0
  },

  navigationBar_titleMode: {
    animation: 'fadeIn 1.2s'
  },

  navigationBar_wide: {
    maxWidth: '100%',
    marginRight: '0',
    justifyContent: 'initial'
  },

  // Applies for the first urlBar nested button
  // currently for BookmarkButton
  navigationBar__urlBarStart: {
    borderRight: 'none',
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0
  },

 // Applies for the end urlBar nested button
 // currently for PublisherToggle
 // TODO: remove animation of the toggle when titleMode is enabled
  navigationBar__urlBarEnd: {
    borderLeft: 'none',
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0
  }
})

module.exports = ReduxComponent.connect(NavigationBar)
