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
const siteTags = require('../../../../js/constants/siteTags')
const messages = require('../../../../js/constants/messages')
const settings = require('../../../../js/constants/settings')

// State
const tabState = require('../../../common/state/tabState')
const publisherState = require('../../../common/lib/publisherUtil')
const frameStateUtil = require('../../../../js/state/frameStateUtil')

// Store
const windowStore = require('../../../../js/stores/windowStore')

// Utils
const cx = require('../../../../js/lib/classSet')
const {getBaseUrl} = require('../../../../js/lib/appUrlUtil')
const siteUtil = require('../../../../js/state/siteUtil')
const eventUtil = require('../../../../js/lib/eventUtil')
const UrlUtil = require('../../../../js/lib/urlutil')
const {getSetting} = require('../../../../js/settings')
const contextMenus = require('../../../../js/contextMenus')
const {isDarwin} = require('../../../common/lib/platformUtil')
const {isFullScreen} = require('../../currentWindow')

const {StyleSheet, css} = require('aphrodite/no-important')
const globalStyles = require('../styles/global')
const commonStyles = require('../styles/commonStyles')

const stopLoadingButton = require('../../../../img/toolbar/stoploading_btn.svg')
const reloadButton = require('../../../../img/toolbar/reload_btn.svg')
const bookmarkButton = require('../../../../img/toolbar/bookmark_btn.svg')
const bookmarkedButton = require('../../../../img/toolbar/bookmark_marked.svg')

class NavigationBar extends React.Component {
  constructor (props) {
    super(props)
    this.onToggleBookmark = this.onToggleBookmark.bind(this)
    this.onStop = this.onStop.bind(this)
    this.onReload = this.onReload.bind(this)
    this.onReloadLongPress = this.onReloadLongPress.bind(this)
  }

  get activeFrame () {
    return windowStore.getFrame(this.props.activeFrameKey)
  }

  onToggleBookmark () {
    const editing = this.props.isBookmarked
    // show the AddEditBookmarkHanger control; saving/deleting takes place there
    let siteDetail = siteUtil.getDetailFromFrame(this.activeFrame, siteTags.BOOKMARK)
    const key = siteUtil.getSiteKey(siteDetail)

    if (key !== null) {
      siteDetail = siteDetail.set('parentFolderId', this.props.sites.getIn([key, 'parentFolderId']))
      siteDetail = siteDetail.set('customTitle', this.props.sites.getIn([key, 'customTitle']))
    }
    siteDetail = siteDetail.set('location', UrlUtil.getLocationIfPDF(siteDetail.get('location')))
    windowActions.setBookmarkDetail(siteDetail, siteDetail, null, editing, true)
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

  get bookmarked () {
    return this.props.activeFrameKey !== undefined &&
      this.props.bookmarked
  }

  // BEM Level: navigator__navigationButtonContainer
  get stopButton () {
    return <button className={cx({
      normalizeButton: true,
      [css(styles.navigationButton, styles.navigationButton_stopButton)]: true
    })}
      data-l10n-id='stopButton'
      onClick={this.onStop}
    />
  }

  // BEM Level: navigator__navigationButtonContainer
  get reloadButton () {
    return <LongPressButton className={cx({
      normalizeButton: true,
      [css(styles.navigationButton, styles.navigationButton_reloadButton)]: true
    })}
      l10nId='reloadButton'
      testId='reloadButton'
      onClick={this.onReload}
      onLongPress={this.onReloadLongPress}
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

    return <div
      id='navigator'
      data-frame-key={this.props.activeFrameKey}
      className={cx({
        titleMode: this.props.titleMode,
        [css(styles.navigator, (this.props.isDarwin && this.props.isFullScreen) && styles.navigator_isDarwin_isFullScreen, this.props.titleMode && styles.navigator_titleMode, this.props.isWideUrlBarEnabled && styles.navigator_wide)]: true
      })}>
      {
        this.props.showBookmarkHanger
        ? <AddEditBookmarkHanger />
        : null
      }
      {
        this.props.titleMode
        ? null
        : <span className={css(
            commonStyles.navigationButtonContainer,
            styles.navigator__navigationButtonContainer,
          )}>
          {
            this.props.isLoading
            ? this.stopButton
            : this.reloadButton
          }
        </span>
      }
      {
        this.props.showHomeButton
        ? <span className={css(
            commonStyles.navigationButtonContainer,
            styles.navigator__navigationButtonContainer,
          )}>
          <HomeButton activeTabId={this.props.activeTabId} />
        </span>
        : null
      }
      {
        !this.props.titleMode
        ? <span className={cx({
          bookmarkButtonContainer: true,
          [css(commonStyles.navigator__buttonContainer, commonStyles.navigator__buttonContainer_outsideOfURLbar, styles.navigator__buttonContainer_bookmarkButtonContainer)]: true
        })}>
          <button className={cx({
            normalizeButton: true,
            withHomeButton: getSetting(settings.SHOW_HOME_BUTTON),
            [css(styles.navigator__buttonContainer_bookmarkButtonContainer__bookmarkButton, this.bookmarked && styles.navigator__buttonContainer_bookmarkButtonContainer__bookmarkButton_removeBookmarkButton)]: true
          })}
            data-l10n-id={this.bookmarked ? 'removeBookmarkButton' : 'addBookmarkButton'}
            data-test-id={this.bookmarked ? 'bookmarked' : 'notBookmarked'}
            onClick={this.onToggleBookmark}
          />
        </span>
        : null
      }
      <UrlBar
        titleMode={this.props.titleMode}
        onStop={this.onStop}
        />
      {
        this.props.showPublisherToggle
        ? <div className={css(
          this.props.titleMode && styles.navigator__endButtons_titleMode,
          !this.props.titleMode && styles.navigator__endButtons_notTitleMode
        )}>
          <PublisherToggle />
        </div>
        : null
      }
    </div>
  }
}

const rightMargin = `calc(${globalStyles.spacing.navbarLeftMarginDarwin} / 2)`

const styles = StyleSheet.create({

  navigator: {
    boxSizing: 'border-box',
    display: 'flex',
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '20px',
    minWidth: '0%', // allow the navigator to shrink
    maxWidth: '900px',
    marginRight: rightMargin,
    padding: 0,
    position: 'relative',
    userSelect: 'none',
    zIndex: globalStyles.zindex.zindexNavigationBar
  },

  navigator_isDarwin_isFullScreen: {
    marginRight: 0
  },

  navigator_titleMode: {
    animation: 'fadeIn 1.2s'
  },

  navigator_wide: {
    maxWidth: '100%',
    marginRight: '0',
    justifyContent: 'initial'
  },

  // cf: topLevelStartButtonContainer on navigator.js
  navigator__navigationButtonContainer: {
    // globalStyles.navigationBar.urlbarForm.height + 2px
    width: '27px'
  },

  navigationButton: {
    // cf: https://github.com/brave/browser-laptop/blob/b161b37cf5e9f59be64855ebbc5d04816bfc537b/less/navigationBar.less#L550-L553
    backgroundColor: globalStyles.color.buttonColor,
    display: 'inline-block',
    width: '100%',
    height: '100%',

    // cf: https://github.com/brave/browser-laptop/blob/b161b37cf5e9f59be64855ebbc5d04816bfc537b/less/navigationBar.less#L584-L585
    margin: 0,
    padding: 0
  },

  navigationButton_stopButton: {
    background: `url(${stopLoadingButton}) center no-repeat`,
    backgroundSize: '11px 11px'
  },

  navigationButton_reloadButton: {
    background: `url(${reloadButton}) center no-repeat`,
    backgroundSize: '13px 13px'
  },

  // cf: navigator__buttonContainer_addPublisherButtonContainer on publisherToggle.js
  navigator__buttonContainer_bookmarkButtonContainer: {
    borderRight: 'none',
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0
  },

  navigator__buttonContainer_bookmarkButtonContainer__bookmarkButton: {
    background: `url(${bookmarkButton}) center no-repeat`,
    backgroundSize: '14px 14px',
    width: globalStyles.navigationBar.urlbarForm.height, // #6704
    height: globalStyles.navigationBar.urlbarForm.height // #6704
  },

  navigator__buttonContainer_bookmarkButtonContainer__bookmarkButton_removeBookmarkButton: {
    background: `url(${bookmarkedButton}) center no-repeat`
  },

  navigator__endButtons_titleMode: {
    display: 'none'
  },

  navigator__endButtons_notTitleMode: {
    display: 'flex'
  }
})

module.exports = ReduxComponent.connect(NavigationBar)
