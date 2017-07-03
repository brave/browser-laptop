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
const {NormalizedButton} = require('../common/browserButton')
const NavigationBarButtonContainer = require('./buttons/navigationBarButtonContainer')

// Components -> buttons
const LongPressButton = require('../common/longPressButton')
const StopButton = require('./buttons/stopButton')
const HomeButton = require('./buttons/homeButton')
const BookmarkButton = require('./buttons/bookmarkButton')
const PublisherToggle = require('./publisherToggle')

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
const {isSourceAboutUrl} = require('../../../../js/lib/appUrlUtil')
const eventUtil = require('../../../../js/lib/eventUtil')
const {getSetting} = require('../../../../js/settings')
const contextMenus = require('../../../../js/contextMenus')
const {isDarwin} = require('../../../common/lib/platformUtil')
const {isFullScreen} = require('../../currentWindow')

const {StyleSheet, css} = require('aphrodite/no-important')
const globalStyles = require('../styles/global')
const reloadButton = require('../../../../img/toolbar/reload_btn.svg')

class NavigationBar extends React.Component {
  constructor (props) {
    super(props)
    this.onStop = this.onStop.bind(this)
    this.onReload = this.onReload.bind(this)
    this.onReloadLongPress = this.onReloadLongPress.bind(this)
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
    ipc.emit(messages.SHORTCUT_ACTIVE_FRAME_STOP)
    if (this.props.navbar.getIn(['urlbar', 'focused'])) {
      windowActions.setUrlBarActive(false)
      const shouldRenderSuggestions = this.props.navbar.getIn(['urlbar', 'suggestions', 'shouldRender']) === true
      const suggestionList = this.props.navbar.getIn(['urlbar', 'suggestions', 'suggestionList'])
      if (!shouldRenderSuggestions ||
          // TODO: Once we take out suggestion generation from within URLBarSuggestions we can remove this check
          // and put it in shouldRenderUrlBarSuggestions where it belongs.  See https://github.com/brave/browser-laptop/issues/3151
          !suggestionList || suggestionList.size === 0) {
        windowActions.setUrlBarSelected(true)
      }
    }
  }

  // BEM Level: navigationBar__buttonContainer
  get reloadButton () {
    return <LongPressButton className={cx({
      normalizeButton: true,
      [css(styles.navigationButton, styles.navigationButton_reload)]: true
    })}
      l10nId='reloadButton'
      testId='reloadButton'
      onClick={this.onReload}
      onLongPress={this.onReloadLongPress}
    />
  }

  // BEM Level: navigationBar__buttonContainer
  get stopButton () {
    return <NormalizedButton custom={[
      styles.navigationButton,
      styles.navigationButton_stop
    ]}
      l10nid='stopButton'
      onClick={this.onStop}
    />
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
    const bookmarkDetail = currentWindow.get('bookmarkDetail')
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
        !bookmarkDetail &&
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
    props.isBookmarked = props.activeFrameKey !== undefined &&
      activeTab && activeTab.get('bookmarked')
    props.isWideUrlBarEnabled = getSetting(settings.WIDE_URL_BAR)
    props.showBookmarkHanger = bookmarkDetail && bookmarkDetail.get('isBookmarkHanger')
    props.isLoading = loading
    props.showPublisherToggle = publisherState.shouldShowAddPublisherButton(state, location, publisherId)
    props.showHomeButton = !props.titleMode && getSetting(settings.SHOW_HOME_BUTTON)

    // used in other functions
    props.navbar = navbar // TODO(nejc) remove, primitives only
    props.sites = state.get('sites') // TODO(nejc) remove, primitives only
    props.activeTabId = activeTabId
    props.showHomeButton = !props.titleMode && getSetting(settings.SHOW_HOME_BUTTON)

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
        [css(styles.navigationBar, (this.props.isDarwin && this.props.isFullScreen) && styles.navigationBar_isDarwin_isFullScreen, this.props.titleMode && styles.navigationBar_titleMode, this.props.isWideUrlBarEnabled && styles.navigationBar_wide)]: true
      })}>
      {
        this.props.showBookmarkHanger
        ? <AddEditBookmarkHanger />
        : null
      }
      {
        !this.props.titleMode
        ? (
          <NavigationBarButtonContainer
            isStandalone
            onNavigationBarChrome
          >
            {
              this.props.isLoading
              ? <StopButton onStop={this.onStop} />
              : this.reloadButton
            }
          </NavigationBarButtonContainer>
        )
        : null
      }
      {
        this.props.showHomeButton
        ? (
          <NavigationBarButtonContainer
            isStandalone
            onNavigationBarChrome
          >
            <HomeButton />
          </NavigationBarButtonContainer>
        )
        : null
      }
      {
        !this.props.titleMode
        ? (
          <NavigationBarButtonContainer
            isSquare
            isNested
            containerFor={styles.navigationBar__urlBarStart}
          >
            <BookmarkButton />
          </NavigationBarButtonContainer>
          )
        : null
      }
      <UrlBar
        titleMode={this.props.titleMode}
        onStop={this.onStop}
        />
      {
        this.props.showPublisherToggle
        ? <PublisherToggle />
        : null
      }
    </div>
  }
}

const rightMargin = `calc(${globalStyles.spacing.navbarLeftMarginDarwin} / 2)`

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
    marginRight: rightMargin,
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

  navigationBar__buttonContainer: {
    width: globalStyles.navigationBar.navigationButtonContainer.width
  },

  navigationButton: {
    display: 'inline-block',
    width: '100%',
    height: '100%',

    // cf: https://github.com/brave/browser-laptop/blob/b161b37cf5e9f59be64855ebbc5d04816bfc537b/less/navigationBar.less#L584-L585
    margin: 0,
    padding: 0
  },

  navigationButton_reload: {
    background: `url(${reloadButton}) center no-repeat`,
    backgroundSize: '13px 13px'
  },

  // Applies for the first urlBar nested button
  navigationBar__urlBarStart: {
    borderRight: 'none',
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0
  }
})

module.exports = ReduxComponent.connect(NavigationBar)
