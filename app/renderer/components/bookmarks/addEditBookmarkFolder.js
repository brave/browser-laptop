/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const Immutable = require('immutable')
const {StyleSheet, css} = require('aphrodite/no-important')

// Components
const ReduxComponent = require('../reduxComponent')
const Dialog = require('../common/dialog')
const AddEditBookmarkFolderForm = require('./addEditBookmarkFolderForm')
const {CommonFormBookmarkHanger} = require('../common/commonForm')

// State
const bookmarkFoldersState = require('../../../common/state/bookmarkFoldersState')
const bookmarksState = require('../../../common/state/bookmarksState')

// Actions
const windowActions = require('../../../../js/actions/windowActions')

// Utils
const cx = require('../../../../js/lib/classSet')
const bookmarkFoldersUtil = require('../../../common/lib/bookmarkFoldersUtil')

// Styles
const globalStyles = require('../styles/global')

class AddEditBookmarkFolder extends React.Component {
  constructor (props) {
    super(props)
    this.onClose = this.onClose.bind(this)
    this.onClick = this.onClick.bind(this)
  }

  onClose () {
    windowActions.onBookmarkFolderClose()
  }

  onClick (e) {
    e.stopPropagation()
  }

  mergeProps (state, ownProps) {
    const currentWindow = state.get('currentWindow')
    const bookmarkDetail = currentWindow.get('bookmarkFolderDetail', Immutable.Map())
    const folderDetails = bookmarkDetail.get('folderDetails') || Immutable.Map()
    const editMode = bookmarkDetail.has('editKey')

    const props = {}
    // used in renderer
    props.heading = editMode
      ? 'bookmarkFolderEditing'
      : 'bookmarkFolderAdding'
    props.parentFolderId = folderDetails.get('parentFolderId')
    props.partitionNumber = folderDetails.get('partitionNumber')
    props.folderName = folderDetails.get('title')
    props.isFolderNameValid = bookmarkFoldersUtil.isFolderNameValid(folderDetails.get('title'))
    props.folders = bookmarkFoldersState.getFoldersWithoutKey(state, folderDetails.get('folderId')) // TODO (nejc) improve, primitives only
    props.editKey = bookmarkDetail.get('editKey', null)
    props.closestKey = bookmarkDetail.get('closestKey', null)
    props.hasBookmarks = bookmarksState.getBookmarks(state).size > 0 || bookmarkFoldersState.getFolders(state).size > 0

    return props
  }

  render () {
    return <Dialog className={cx({
      bookmarkDialog: true
    })} onHide={this.onClose} isClickDismiss>
      <CommonFormBookmarkHanger onClick={this.onClick}>
        <div className={cx({
          [css(styles.commonFormSection)]: true,
          [css(styles.commonFormTitle)]: true
        })} data-l10n-id={this.props.heading} />
        <AddEditBookmarkFolderForm
          folderName={this.props.folderName}
          editKey={this.props.editKey}
          closestKey={this.props.closestKey}
          parentFolderId={this.props.parentFolderId}
          partitionNumber={this.props.partitionNumber}
          folders={this.props.folders}
          isDisabled={!this.props.isFolderNameValid}
          hasBookmarks={this.props.hasBookmarks}
        />
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
  }
})

module.exports = ReduxComponent.connect(AddEditBookmarkFolder)
