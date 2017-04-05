/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const Immutable = require('immutable')
const ImmutableComponent = require('./immutableComponent')
const ReduxComponent = require('../../app/renderer/components/reduxComponent')

const cx = require('../lib/classSet')
const Button = require('./button')
const UrlBar = require('../../app/renderer/components/urlBar')
const windowActions = require('../actions/windowActions')
const appActions = require('../actions/appActions')
const siteTags = require('../constants/siteTags')
const messages = require('../constants/messages')
const settings = require('../constants/settings')
const ipc = require('electron').ipcRenderer
const {isSourceAboutUrl, getBaseUrl} = require('../lib/appUrlUtil')
const AddEditBookmarkHanger = require('../../app/renderer/components/addEditBookmarkHanger')
const siteUtil = require('../state/siteUtil')
const eventUtil = require('../lib/eventUtil')
const UrlUtil = require('../lib/urlutil')
const getSetting = require('../settings').getSetting
const contextMenus = require('../contextMenus')
const LongPressButton = require('./longPressButton')
const PublisherToggle = require('../../app/renderer/components/publisherToggle')

// state helpers
const frameState = require('../../app/common/state/frameState')
const navigationBarState = require('../../app/common/state/navigationBarState')
const tabState = require('../../app/common/state/tabState')
const frameStateUtil = require('../state/frameStateUtil')

class NavigationBar extends ImmutableComponent {
  constructor () {
    super()
    this.onToggleBookmark = this.onToggleBookmark.bind(this)
    this.onStop = this.onStop.bind(this)
    this.onReload = this.onReload.bind(this)
    this.onReloadLongPress = this.onReloadLongPress.bind(this)
    this.onNoScript = this.onNoScript.bind(this)
  }

  onToggleBookmark () {
    const editing = this.bookmarked
    // show the AddEditBookmarkHanger control; saving/deleting takes place there
    let siteDetail = siteUtil.getDetailFromFrame(this.props.activeFrame, siteTags.BOOKMARK)
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
      appActions.tabCloned(this.props.activeFrame.get('tabId'), {active: !!e.shiftKey})
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
        ipc.emit(i === 0 && !eventUtil.isForSecondaryAction(e)
          ? messages.SHORTCUT_ACTIVE_FRAME_LOAD_URL
          : messages.SHORTCUT_NEW_FRAME,
        {}, homepage)
      })
  }

  onStop () {
    ipc.emit(messages.SHORTCUT_ACTIVE_FRAME_STOP)
    if (this.props.urlbar.get('focused')) {
      windowActions.setUrlBarActive(false)
      const shouldRenderSuggestions = this.props.urlbar.getIn(['suggestions', 'shouldRender']) === true
      const suggestionList = this.props.urlbarSuggestionList
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

  get locationId () {
    return getBaseUrl(this.props.location)
  }

  get publisherId () {
    return this.props.locationInfo && this.props.locationInfo.getIn([this.locationId, 'publisher'])
  }

  get visiblePublisher () {
    // No publisher is visible if ledger is disabled
    if (!getSetting(settings.PAYMENTS_ENABLED) || !this.publisherId) {
      return false
    }
    const hostPattern = UrlUtil.getHostPattern(this.publisherId)
    const hostSettings = this.props.siteSettings.get(hostPattern)
    const ledgerPaymentsShown = hostSettings && hostSettings.get('ledgerPaymentsShown')
    return typeof ledgerPaymentsShown === 'boolean'
      ? ledgerPaymentsShown
      : true
  }

  componentDidMount () {
    ipc.on(messages.SHORTCUT_ACTIVE_FRAME_BOOKMARK, () => this.onToggleBookmark())
    ipc.on(messages.SHORTCUT_ACTIVE_FRAME_REMOVE_BOOKMARK, () => this.onToggleBookmark())
  }

  mergeProps (state, dispatchProps, ownProps) {
    // TODO(bridiver) - add state helpers
    const currentWindow = state.get('currentWindow')
    const activeFrame = frameStateUtil.getActiveFrame(currentWindow)
    const activeFrameKey = activeFrame.get('key')
    const bookmarkDetail = currentWindow.get('bookmarkDetail')

    const tabId = frameState.getTabIdByFrameKey(state, activeFrameKey)
    const location = tabState.getLocation(state, tabId)

    const props = {
      activeFrame,
      activeFrameKey,
      bookmarkDetail,
      loading: tabState.isLoading(state, tabId),
      location,
      title: tabState.getTitle(state, tabId),
      titleMode: navigationBarState.isTitleMode(state, tabId, bookmarkDetail),
      urlbar: navigationBarState.getUrlBar(state, tabId),
      urlbarSuggestionList: navigationBarState.getSuggestionList(state, tabId)
    }

    return Object.assign({}, ownProps, props)
  }

  get showNoScriptInfo () {
    return this.props.enableNoScript && this.props.scriptsBlocked && this.props.scriptsBlocked.size
  }

  onNoScript () {
    windowActions.setNoScriptVisible(!this.props.noScriptIsVisible)
  }

  componentDidUpdate (prevProps) {
    if (this.props.noScriptIsVisible && !this.showNoScriptInfo) {
      // There are no blocked scripts, so hide the noscript dialog.
      windowActions.setNoScriptVisible(false)
    }
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
        !this.props.titleMode && getSetting(settings.SHOW_HOME_BUTTON)
        ? <span className='navigationButtonContainer'>
          <button data-l10n-id='homeButton'
            className='navigationButton homeButton'
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
                withHomeButton: getSetting(settings.SHOW_HOME_BUTTON)
              })}
              onClick={this.onToggleBookmark} />
          </span>
          : null
        }
      </div>
      <UrlBar
        onStop={this.onStop}
        menubarVisible={this.props.menubarVisible}
        />
      {
        isSourceAboutUrl(this.props.location)
        ? <div className='endButtons'>
          <span className='browserButton' />
        </div>
        : <div className='endButtons'>
          {
            <PublisherToggle
              location={this.props.location}
              locationInfo={this.props.locationInfo}
              siteSettings={this.props.siteSettings}
              synopsis={this.props.synopsis}
            />
          }
          {
            !this.showNoScriptInfo
            ? null
            : <span className='noScriptButtonContainer'>
              <Button iconClass='fa-ban'
                l10nId='noScriptButton'
                className={cx({
                  'noScript': true
                })}
                onClick={this.onNoScript} />
            </span>
          }
        </div>
      }
    </div>
  }
}

module.exports = ReduxComponent.connect(NavigationBar)
