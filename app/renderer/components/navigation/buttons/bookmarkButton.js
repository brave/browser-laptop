/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const Immutable = require('immutable')
const ipc = require('electron').ipcRenderer

// Components
const ReduxComponent = require('../../reduxComponent')

// Actions
const windowActions = require('../../../../../js/actions/windowActions')

// Constants
const siteTags = require('../../../../../js/constants/siteTags')
const messages = require('../../../../../js/constants/messages')
const settings = require('../../../../../js/constants/settings')

// State
const tabState = require('../../../../common/state/tabState')
const frameStateUtil = require('../../../../../js/state/frameStateUtil')

// Store
const windowStore = require('../../../../../js/stores/windowStore')

// Utils
const cx = require('../../../../../js/lib/classSet')
const siteUtil = require('../../../../../js/state/siteUtil')
const UrlUtil = require('../../../../../js/lib/urlutil')
const {getSetting} = require('../../../../../js/settings')

const {StyleSheet, css} = require('aphrodite/no-important')

const bookmarkButtonIcon = require('../../../../../img/toolbar/bookmark_btn.svg')
const bookmarkedButtonIcon = require('../../../../../img/toolbar/bookmark_marked.svg')

class BookmarkButton extends React.Component {
  constructor (props) {
    super(props)
    this.onToggleBookmark = this.onToggleBookmark.bind(this)
  }

  get bookmarked () {
    return this.props.activeFrameKey !== undefined && this.props.bookmarked
  }

  get activeFrame () {
    return windowStore.getFrame(this.props.activeFrameKey)
  }

  onToggleBookmark () {
    const editing = this.bookmarked
    // show the AddEditBookmarkHanger control; saving/deleting takes place there
    let siteDetail = siteUtil.getDetailFromFrame(
      this.activeFrame,
      siteTags.BOOKMARK
    )
    const key = siteUtil.getSiteKey(siteDetail)

    if (key !== null) {
      siteDetail = siteDetail.set(
        'parentFolderId',
        this.props.sites.getIn([key, 'parentFolderId'])
      )
      siteDetail = siteDetail.set(
        'customTitle',
        this.props.sites.getIn([key, 'customTitle'])
      )
    }
    siteDetail = siteDetail.set(
      'location',
      UrlUtil.getLocationIfPDF(siteDetail.get('location'))
    )
    windowActions.setBookmarkDetail(siteDetail, siteDetail, null, editing, true)
  }

  mergeProps (state, dispatchProps, ownProps) {
    const currentWindow = state.get('currentWindow')
    const activeFrame = frameStateUtil.getActiveFrame(currentWindow) || Immutable.Map()
    const activeFrameKey = activeFrame.get('key')
    const activeTabId = activeFrame.get('tabId', tabState.TAB_ID_NONE)
    const activeTab = tabState.getByTabId(state, activeTabId)

    const props = {}
    props.activeFrameKey = activeFrameKey
    props.bookmarked = activeTab && activeTab.get('bookmarked')
    props.sites = state.get('sites')

    return props
  }

  componentDidMount () {
    ipc.on(messages.SHORTCUT_ACTIVE_FRAME_BOOKMARK, () => this.onToggleBookmark())
    ipc.on(messages.SHORTCUT_ACTIVE_FRAME_REMOVE_BOOKMARK, () => this.onToggleBookmark())
  }

  render () {
    return (
      <button
        className={cx({
          // TODO: check if iconOnly solves this and if not
          // find a way to remove cx cos cx is evooool :P
          normalizeButton: true,
          withHomeButton: getSetting(settings.SHOW_HOME_BUTTON),
          [css(styles.bookmark__button, this.bookmarked && styles.bookmark__button_remove)]: true
        })}
        data-l10n-id={
          this.bookmarked ? 'removeBookmarkButton' : 'addBookmarkButton'
        }
        data-test-id={this.bookmarked ? 'bookmarked' : 'notBookmarked'}
        onClick={this.onToggleBookmark}
      />
    )
  }
}

const styles = StyleSheet.create({
  bookmark__button: {
    background: `url(${bookmarkButtonIcon}) center no-repeat`,
    backgroundSize: '14px 14px',
    width: '100%',
    height: '100%'
  },

  bookmark__button_remove: {
    background: `url(${bookmarkedButtonIcon}) center no-repeat`
  }
})

module.exports = ReduxComponent.connect(BookmarkButton)
