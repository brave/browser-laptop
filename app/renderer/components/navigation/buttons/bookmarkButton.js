/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const ipc = require('electron').ipcRenderer
const {StyleSheet} = require('aphrodite/no-important')

// Components
const ImmutableComponent = require('../../immutableComponent')
const {NormalizedButton} = require('../../common/browserButton')

// Actions
const windowActions = require('../../../../../js/actions/windowActions')

// Constants
const messages = require('../../../../../js/constants/messages')

// Style
const bookmarkButtonIcon = require('../../../../../img/toolbar/bookmark_btn.svg')
const bookmarkedButtonIcon = require('../../../../../img/toolbar/bookmark_marked.svg')

class BookmarkButton extends ImmutableComponent {
  constructor (props) {
    super(props)
    this.onToggleBookmark = this.onToggleBookmark.bind(this)
  }

  componentDidMount () {
    ipc.on(messages.SHORTCUT_ACTIVE_FRAME_BOOKMARK, () => this.onToggleBookmark())
    ipc.on(messages.SHORTCUT_ACTIVE_FRAME_REMOVE_BOOKMARK, () => this.onToggleBookmark())
  }

  onToggleBookmark () {
    if (this.props.isBookmarked) {
      windowActions.editBookmark(true, this.props.bookmarkKey)
    } else {
      windowActions.onBookmarkAdded(true, this.props.bookmarkKey)
    }
  }

  render () {
    return (
      <NormalizedButton navigationButton
        custom={[
          styles.bookmarkButton,
          this.props.isBookmarked && styles.bookmarkButton_bookmarked
        ]}
        l10nId={this.props.isBookmarked ? 'removeBookmarkButton' : 'addBookmarkButton'}
        testId={this.props.isBookmarked ? 'bookmarked' : 'notBookmarked'}
        onClick={this.onToggleBookmark}
      />
    )
  }
}

const styles = StyleSheet.create({
  bookmarkButton: {
    background: `url(${bookmarkButtonIcon}) center no-repeat`,
    backgroundSize: '14px 14px'
  },

  bookmarkButton_bookmarked: {
    background: `url(${bookmarkedButtonIcon}) center no-repeat`
  }
})

module.exports = BookmarkButton
