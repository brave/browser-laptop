/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const Immutable = require('immutable')
const ReduxComponent = require('../reduxComponent')

const cx = require('../../../../js/lib/classSet')
const UrlBar = require('./urlBar')
const windowActions = require('../../../../js/actions/windowActions')
const appActions = require('../../../../js/actions/appActions')
const siteTags = require('../../../../js/constants/siteTags')
const messages = require('../../../../js/constants/messages')
const settings = require('../../../../js/constants/settings')
const ipc = require('electron').ipcRenderer
const {isSourceAboutUrl} = require('../../../../js/lib/appUrlUtil')
const AddEditBookmarkHanger = require('../bookmarks/addEditBookmarkHanger')
const siteUtil = require('../../../../js/state/siteUtil')
const eventUtil = require('../../../../js/lib/eventUtil')
const UrlUtil = require('../../../../js/lib/urlutil')
const getSetting = require('../../../../js/settings').getSetting
const windowStore = require('../../../../js/stores/windowStore')
const contextMenus = require('../../../../js/contextMenus')
const LongPressButton = require('./../../../../js/components/longPressButton')
const PublisherToggle = require('../publisherToggle')
const {getCurrentWindowId} = require('../../currentWindow')

// State
const tabState = require('../../../common/state/tabState')
const frameStateUtil = require('../../../../js/state/frameStateUtil')

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

  get loading () {
    return this.props.activeFrameKey !== undefined && this.props.loading
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
      siteUtil.isSiteBookmarked(this.props.sites, Immutable.fromJS({
        location: this.props.location,
        partitionNumber: this.props.partitionNumber
      }))
  }

  get titleMode () {
    const hasTitle = this.props.title && this.props.location && this.props.title !== this.props.location.replace(/^https?:\/\//, '')
    return this.props.activeTabShowingMessageBox ||
      (
        this.props.mouseInTitlebar === false &&
        !this.props.bookmarkDetail &&
        hasTitle &&
        !['about:blank', 'about:newtab'].includes(this.props.location) &&
        !this.loading &&
        !this.props.navbar.getIn(['urlbar', 'focused']) &&
        !this.props.navbar.getIn(['urlbar', 'active']) &&
        getSetting(settings.DISABLE_TITLE_MODE) === false
      )
  }

  componentDidMount () {
    ipc.on(messages.SHORTCUT_ACTIVE_FRAME_BOOKMARK, () => this.onToggleBookmark())
    ipc.on(messages.SHORTCUT_ACTIVE_FRAME_REMOVE_BOOKMARK, () => this.onToggleBookmark())
  }

  mergeProps (state, dispatchProps, ownProps) {
    const windowState = state.get('currentWindow')
    const activeFrame = frameStateUtil.getActiveFrame(windowState) || Immutable.Map()
    const activeTabId = tabState.getActiveTabId(state, getCurrentWindowId())
    const props = {}

    props.navbar = activeFrame.get('navbar')
    props.sites = state.get('sites')
    props.activeFrameKey = activeFrame.get('key')
    props.location = activeFrame.get('location') || ''
    props.title = activeFrame.get('title') || ''
    props.partitionNumber = activeFrame.get('partitionNumber') || 0
    props.isSecure = activeFrame.getIn(['security', 'isSecure'])
    props.loading = activeFrame.get('loading')
    props.bookmarkDetail = windowState.get('bookmarkDetail')
    props.mouseInTitlebar = windowState.getIn(['ui', 'mouseInTitlebar'])
    props.enableNoScript = ownProps.enableNoScript
    props.settings = state.get('settings')
    props.menubarVisible = ownProps.menubarVisible
    props.siteSettings = state.get('siteSettings')
    props.synopsis = state.getIn(['publisherInfo', 'synopsis']) || new Immutable.Map()
    props.activeTabShowingMessageBox = tabState.isShowingMessageBox(state, activeTabId)
    props.locationInfo = state.get('locationInfo')

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
        titleMode: this.titleMode
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
        this.titleMode
        ? null
        : this.loading
          ? <span className='navigationButtonContainer'>
            <button data-l10n-id='stopButton'
              className='navigationButton stopButton'
              onClick={this.onStop} />
          </span>
          : <span className='navigationButtonContainer'>
            <LongPressButton
              l10nId='reloadButton'
              className='navigationButton reloadButton'
              onClick={this.onReload}
              onLongPress={this.onReloadLongPress} />
          </span>
      }
      {
        !this.titleMode && getSetting(settings.SHOW_HOME_BUTTON)
        ? <span className='navigationButtonContainer'>
          <button data-l10n-id='homeButton'
            className='navigationButton homeButton'
            onClick={this.onHome} />
        </span>
        : null
      }
      <div className='startButtons'>
        {
          !this.titleMode
          ? <span className='bookmarkButtonContainer'>
            <button data-l10n-id={this.bookmarked ? 'removeBookmarkButton' : 'addBookmarkButton'}
              className={cx({
                navigationButton: true,
                bookmarkButton: true,
                removeBookmarkButton: this.bookmarked,
                withHomeButton: getSetting(settings.SHOW_HOME_BUTTON)
              })}
              onClick={this.onToggleBookmark} />
          </span>
          : null
        }
      </div>
      <UrlBar
        titleMode={this.titleMode}
        onStop={this.onStop}
        menubarVisible={this.props.menubarVisible}
        enableNoScript={this.props.enableNoScript}
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
