/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const Immutable = require('immutable')

// Components
const ReduxComponent = require('../reduxComponent')
const Dialog = require('../common/dialog')
const AddEditBookmarkForm = require('./addEditBookmarkForm')

// Actions
const appActions = require('../../../../js/actions/appActions')
const windowActions = require('../../../../js/actions/windowActions')

// Constants
const siteTags = require('../../../../js/constants/siteTags')
const settings = require('../../../../js/constants/settings')

// Utils
const cx = require('../../../../js/lib/classSet')
const siteUtil = require('../../../../js/state/siteUtil')
const {getSetting} = require('../../../../js/settings')
const {bookmarkHangerHeading, displayBookmarkName, isBookmarkNameValid} = require('../../../common/lib/bookmarkUtil')

const {StyleSheet, css} = require('aphrodite/no-important')
const globalStyles = require('../styles/global')

const {
  CommonFormBookmarkHanger,
  CommonFormBottomWrapper
} = require('../common/commonForm')

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
    if (!this.props.isAdded || this.props.isFolder) {
      return false
    }

    if (!this.props.hasBookmarks && !getSetting(settings.SHOW_BOOKMARKS_TOOLBAR)) {
      appActions.changeSetting(settings.SHOW_BOOKMARKS_TOOLBAR, true)
    }

    appActions.addBookmark(Immutable.fromJS({
      title: this.props.bookmarkName,
      location: this.props.location,
      folderId: this.props.parentId
    }), siteTags.BOOKMARK)
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
    props.withHomeButton = getSetting(settings.SHOW_HOME_BUTTON)
    // Fake a folderId property so that the bookmark is considered a bookmark folder.
    // This is ImmutableJS so it doesn't actually set a value, it just returns a new one.
    props.isFolder = siteUtil.isFolder(siteDetail.set('folderId', 0))
    props.heading = bookmarkHangerHeading(editMode, props.isFolder, isAdded)
    props.location = siteDetail.get('location')
    props.parentFolderId = siteDetail.get('parentFolderId')
    props.partitionNumber = siteDetail.get('partitionNumber')
    props.bookmarkName = displayBookmarkName(siteDetail)
    props.currentTitle = siteDetail.get('title')
    props.isBookmarkNameValid = isBookmarkNameValid(
      siteDetail.get('title'),
      siteDetail.get('location'),
      props.isFolder,
      siteDetail.get('customTitle')
    )
    props.folders = siteUtil.getFolders(state.get('sites'), siteDetail.get('folderId')) // TODO (nejc) improve, primitives only
    props.editKey = bookmarkDetail.get('editKey', null)
    props.closestKey = bookmarkDetail.get('closestKey', null)

    // used in functions
    props.isAdded = isAdded
    props.hasBookmarks = state.get('sites').some(
      (site) => siteUtil.isBookmark(site) || siteUtil.isFolder(site)
    )

    return props
  }

  render () {
    return <Dialog className={cx({
      bookmarkDialog: this.props.isModal,
      bookmarkHanger: !this.props.isModal,
      [css(styles.bookmarkHanger)]: !this.props.isModal
    })} onHide={this.onClose} isClickDismiss>
      <CommonFormBookmarkHanger onClick={this.onClick}>
        {
          !this.props.isModal
          ? <div className={cx({
            [css(styles.bookmarkHanger__arrowUp)]: true,
            [css(styles.bookmarkHanger__withHomeButton)]: this.props.withHomeButton
          })} />
          : null
        }
        <div className={cx({
          [css(styles.commonFormSection)]: true,
          [css(styles.commonFormTitle)]: true
        })} data-l10n-id={this.props.heading} />
        <AddEditBookmarkForm
          bookmarkName={this.props.bookmarkName}
          currentTitle={this.props.currentTitle}
          editKey={this.props.editKey}
          closestKey={this.props.closestKey}
          location={this.props.location}
          parentFolderId={this.props.parentFolderId}
          partitionNumber={this.props.partitionNumber}
          isFolder={this.props.isFolder}
          folders={this.props.folders}
          isAdded={this.props.isAdded}
          isDisabled={!this.props.isBookmarkNameValid}
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

const navigationButtonContainerWidth = globalStyles.navigationBar.navigationButtonContainer.width
const navigationButtonContainerMarginRight = globalStyles.navigationBar.navigationButtonContainer.marginRight
const bookmarkButtonContainerWidth = globalStyles.navigationBar.urlbarForm.height

// Add navigationButtonContainerMarginRight (6px)
const navigationButtonWidth = `calc(${navigationButtonContainerWidth} + ${navigationButtonContainerMarginRight})`

// Count the reload and stop button, adding the half width of the bookmark button container
// 12px == arrowUp width
const bookmarkHangerPosition = `calc(12px + ${navigationButtonWidth} + (${bookmarkButtonContainerWidth} / 2))`

// Add another container width
const bookmarkHangerPositionWithHomeButton = `calc(${bookmarkHangerPosition} + ${navigationButtonWidth})`

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
    left: bookmarkHangerPosition,

    '::after': {
      content: '""',
      position: 'absolute',
      width: 0,
      height: 0,
      border: `8px solid ${globalStyles.color.commonFormBackgroundColor}`,
      boxShadow: globalStyles.shadow.bookmarkHangerArrowUpShadow,
      transformOrigin: '0 0',
      transform: 'rotate(135deg)'
    }
  },
  bookmarkHanger__withHomeButton: {
    left: bookmarkHangerPositionWithHomeButton
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
