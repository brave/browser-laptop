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

// Actions
const windowActions = require('../../../../js/actions/windowActions')
const appActions = require('../../../../js/actions/appActions')

// Constants
const siteTags = require('../../../../js/constants/siteTags')
const messages = require('../../../../js/constants/messages')
const settings = require('../../../../js/constants/settings')

// State
const tabState = require('../../../common/state/tabState')
const frameStateUtil = require('../../../../js/state/frameStateUtil')
const menuBarState = require('../../../common/state/menuBarState')

// Store
const windowStore = require('../../../../js/stores/windowStore')

// Utils
const cx = require('../../../../js/lib/classSet')
const {isSourceAboutUrl} = require('../../../../js/lib/appUrlUtil')
const siteUtil = require('../../../../js/state/siteUtil')
const eventUtil = require('../../../../js/lib/eventUtil')
const UrlUtil = require('../../../../js/lib/urlutil')
const {getSetting} = require('../../../../js/settings')
const contextMenus = require('../../../../js/contextMenus')

class NavigationBar extends React.Component {
  constructor (props) {
    super(props)
    this.onToggleBookmark = this.onToggleBookmark.bind(this)
    this.onStop = this.onStop.bind(this)
    this.onReload = this.onReload.bind(this)
    this.onHome = this.onHome.bind(this)
    this.onReloadLongPress = this.onReloadLongPress.bind(this)
  }

  get activeFrame () {
    return windowStore.getFrame(this.props.activeFrameKey)
  }

  onToggleBookmark () {
    const editing = this.bookmarked
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

  onHome (e) {
    getSetting(settings.HOMEPAGE).split('|')
      .forEach((homepage, i) => {
        if (i === 0 && !eventUtil.isForSecondaryAction(e)) {
          appActions.loadURLRequested(this.props.activeTabId, homepage)
        } else {
          appActions.createTabRequested({
            url: homepage,
            active: false
          })
        }
      })
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

  componentDidMount () {
    ipc.on(messages.SHORTCUT_ACTIVE_FRAME_BOOKMARK, () => this.onToggleBookmark())
    ipc.on(messages.SHORTCUT_ACTIVE_FRAME_REMOVE_BOOKMARK, () => this.onToggleBookmark())
  }

  mergeProps (state, dispatchProps, ownProps) {
    const currentWindow = state.get('currentWindow')
    const activeFrame = frameStateUtil.getActiveFrame(currentWindow) || Immutable.Map()
    const activeFrameKey = activeFrame.get('key')
    const activeTabId = activeFrame.get('tabId') || tabState.TAB_ID_NONE
    const activeTab = tabState.getByTabId(state, activeTabId)

    const activeTabShowingMessageBox = tabState.isShowingMessageBox(state, activeTabId)
    const bookmarkDetail = currentWindow.get('bookmarkDetail')
    const mouseInTitlebar = currentWindow.getIn(['ui', 'mouseInTitlebar'])
    const title = activeFrame.get('title') || ''
    const loading = activeFrame.get('loading')
    const location = activeFrame.get('location') || ''
    const navbar = activeFrame.get('navbar') || Immutable.Map()

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

    props.navbar = navbar
    props.sites = state.get('sites')
    props.activeFrameKey = activeFrameKey
    props.location = location
    props.title = title
    props.bookmarked = activeTab && activeTab.get('bookmarked')
    props.partitionNumber = activeFrame.get('partitionNumber') || 0
    props.isSecure = activeFrame.getIn(['security', 'isSecure'])
    props.loading = loading
    props.bookmarkDetail = bookmarkDetail
    props.mouseInTitlebar = mouseInTitlebar
    props.settings = state.get('settings')
    props.menubarVisible = menuBarState.isMenuBarVisible(currentWindow)
    props.siteSettings = state.get('siteSettings')
    props.synopsis = state.getIn(['publisherInfo', 'synopsis']) || new Immutable.Map()
    props.activeTabShowingMessageBox = activeTabShowingMessageBox
    props.locationInfo = state.get('locationInfo')
    props.titleMode = titleMode
    props.activeTabId = activeTabId

    return props
  }

  render () {
    if (this.props.activeFrameKey === undefined ||
        this.props.siteSettings === undefined) {
      return null
    }

    return <div id='navigator'
      ref='navigator'
      data-frame-key={this.props.activeFrameKey}
      className={cx({
        titleMode: this.props.titleMode
      })}>
      {
        this.props.bookmarkDetail && this.props.bookmarkDetail.get('isBookmarkHanger')
        ? <AddEditBookmarkHanger sites={this.props.sites}
          currentDetail={this.props.bookmarkDetail.get('currentDetail')}
          originalDetail={this.props.bookmarkDetail.get('originalDetail')}
          destinationDetail={this.props.bookmarkDetail.get('destinationDetail')}
          shouldShowLocation={this.props.bookmarkDetail.get('shouldShowLocation')}
          withHomeButton={getSetting(settings.SHOW_HOME_BUTTON)}
          />
        : null
      }
      {
        this.props.titleMode
        ? null
        : this.props.loading
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
        !this.props.titleMode && getSetting(settings.SHOW_HOME_BUTTON)
        ? <span className='navigationButtonContainer'>
          <button
            data-test-id='homeButton'
            data-l10n-id='homeButton'
            className='normalizeButton navigationButton homeButton'
            onClick={this.onHome} />
        </span>
        : null
      }
      <div className='startButtons'>
        {
          !this.props.titleMode
          ? <span className='bookmarkButtonContainer'>
            <button data-l10n-id={this.bookmarked ? 'removeBookmarkButton' : 'addBookmarkButton'}
              className={cx({
                navigationButton: true,
                bookmarkButton: true,
                removeBookmarkButton: this.bookmarked,
                withHomeButton: getSetting(settings.SHOW_HOME_BUTTON),
                normalizeButton: true
              })}
              onClick={this.onToggleBookmark} />
          </span>
          : null
        }
      </div>
      <UrlBar
        titleMode={this.props.titleMode}
        onStop={this.onStop}
        menubarVisible={this.props.menubarVisible}
        />
      {
        isSourceAboutUrl(this.props.location)
        ? null
        : <div className='endButtons'>
          {
            <PublisherToggle
              location={this.props.location}
              locationInfo={this.props.locationInfo}
              siteSettings={this.props.siteSettings}
              synopsis={this.props.synopsis}
            />
          }
        </div>
      }
    </div>
  }
}

module.exports = ReduxComponent.connect(NavigationBar)
