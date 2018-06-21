/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const Immutable = require('immutable')
const {StyleSheet, css} = require('aphrodite/no-important')

// Components
const ReduxComponent = require('../reduxComponent')
const Dialog = require('../common/dialog')
const AddEditBookmarkForm = require('./addEditBookmarkForm')
const {
  CommonFormBookmarkHanger,
  CommonFormBottomWrapper
} = require('../common/commonForm')

// States
const bookmarksState = require('../../../common/state/bookmarksState')
const bookmarkFoldersState = require('../../../common/state/bookmarkFoldersState')

// Actions
const appActions = require('../../../../js/actions/appActions')
const windowActions = require('../../../../js/actions/windowActions')

// Constants
const settings = require('../../../../js/constants/settings')

// Utils
const cx = require('../../../../js/lib/classSet')
const {getSetting} = require('../../../../js/settings')
const {bookmarkHangerHeading, isBookmarkNameValid} = require('../../../common/lib/bookmarkUtil')

// Styles
const globalStyles = require('../styles/global')

class AddEditBookmarkHanger extends React.Component {
  constructor (props) {
    super(props)
    this.onClose = this.onClose.bind(this)
    this.onClick = this.onClick.bind(this)
    this.onViewBookmarks = this.onViewBookmarks.bind(this)
  }

  componentDidMount () {
    this.addBookmark()
  }

  onClose () {
    windowActions.onBookmarkClose()
  }

  onClick (e) {
    e.stopPropagation()
  }

  addBookmark () {
    if (!this.props.isAdded) {
      return false
    }

    if (!this.props.hasBookmarks && !getSetting(settings.SHOW_BOOKMARKS_TOOLBAR)) {
      appActions.changeSetting(settings.SHOW_BOOKMARKS_TOOLBAR, true)
    }

    appActions.addBookmark(Immutable.fromJS({
      title: this.props.title,
      location: this.props.location,
      folderId: this.props.parentId
    }))
  }

  onViewBookmarks () {
    this.onClose()
    appActions.createTabRequested({url: 'about:bookmarks'})
  }

  mergeProps (state, ownProps) {
    const currentWindow = state.get('currentWindow')
    const bookmarkDetail = currentWindow.get('bookmarkDetail', Immutable.Map())
    const siteDetail = bookmarkDetail.get('siteDetail') || Immutable.Map()
    const editMode = bookmarkDetail.has('editKey')
    const isAdded = bookmarkDetail.get('isAdded', false)

    const props = {}
    // used in renderer
    props.isModal = ownProps.isModal
    props.heading = bookmarkHangerHeading(editMode, isAdded)
    props.location = siteDetail.get('location')
    props.parentFolderId = siteDetail.get('parentFolderId')
    props.partitionNumber = siteDetail.get('partitionNumber')
    props.title = siteDetail.get('title')
    props.isBookmarkNameValid = isBookmarkNameValid(siteDetail.get('location'))
    props.folders = bookmarkFoldersState.getFoldersWithoutKey(state, siteDetail.get('folderId')) // TODO (nejc) improve, primitives only
    props.editKey = bookmarkDetail.get('editKey', null)
    props.closestKey = bookmarkDetail.get('closestKey', null)

    // used in functions
    props.isAdded = isAdded
    props.hasBookmarks = bookmarksState.getBookmarks(state).size > 0 || bookmarkFoldersState.getFolders(state).size > 0

    return props
  }

  render () {
    return <Dialog bookmarkHanger className={cx({
      bookmarkDialog: this.props.isModal,
      bookmarkHanger: !this.props.isModal,
      [css(styles.bookmarkHanger)]: !this.props.isModal
    })} onHide={this.onClose} isClickDismiss>
      <CommonFormBookmarkHanger onClick={this.onClick}>
        {
          !this.props.isModal
          ? <div className={cx({
            [css(styles.bookmarkHanger__arrowUp)]: true
          })} />
          : null
        }
        <div className={cx({
          [css(styles.commonFormSection)]: true,
          [css(styles.commonFormTitle)]: true
        })} data-l10n-id={this.props.heading} />
        <AddEditBookmarkForm
          title={this.props.title}
          editKey={this.props.editKey}
          closestKey={this.props.closestKey}
          location={this.props.location}
          parentFolderId={this.props.parentFolderId}
          partitionNumber={this.props.partitionNumber}
          folders={this.props.folders}
          isAdded={this.props.isAdded}
          isDisabled={!this.props.isBookmarkNameValid}
          hasBookmarks={this.props.hasBookmarks}
        />
        {
          !this.props.isModal
            ? <CommonFormBottomWrapper>
              <div className={css(styles.bookmark__bottomWrapper, styles.bottomWrapper__cursor)}
                data-test-id='viewBookmarks'
                data-l10n-id='viewBookmarks'
                onClick={this.onViewBookmarks} />
            </CommonFormBottomWrapper>
            : null
        }
      </CommonFormBookmarkHanger>
    </Dialog>
  }
}

const styles = StyleSheet.create({
  // Copied from commonForm.js
  commonFormSection: {
    // PR #7985
    margin: `${globalStyles.spacing.dialogInsideMargin} 30px`
  },
  commonFormTitle: {
    color: globalStyles.color.braveOrange,
    fontSize: '1.2em'
  },

  bookmarkHanger: {
    // See: #9040
    justifyContent: 'flex-start !important',
    background: 'none !important',

    // TODO: refactor navigationBar.less to remove !important
    animation: 'none !important',
    zIndex: `${globalStyles.zindex.zindexDialogs} !important`,

    ':focus': {
      outline: 'none'
    }
  },
  bookmarkHanger__arrowUp: {
    position: 'relative',
    left: '59px',

    '::after': {
      content: '""',
      position: 'absolute',
      width: 0,
      height: 0,
      border: `8px solid ${globalStyles.color.modalVeryLightGray}`,
      boxShadow: globalStyles.shadow.bookmarkHangerArrowUpShadow,
      transformOrigin: '0 0',
      transform: 'rotate(135deg)'
    }
  },
  bookmark__bottomWrapper: {
    display: 'flex',
    justifyContent: 'center'
  },
  bottomWrapper__cursor: {
    cursor: 'pointer'
  }
})

module.exports = ReduxComponent.connect(AddEditBookmarkHanger)
