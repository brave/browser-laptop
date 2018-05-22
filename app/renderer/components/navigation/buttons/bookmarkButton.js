/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const ipc = require('electron').ipcRenderer
const {StyleSheet, css} = require('aphrodite/no-important')

// Components
const ImmutableComponent = require('../../immutableComponent')
const NavigationButton = require('./navigationButton')
const BookmarkIcon = require('../../../../../icons/bookmark')

// Actions
const windowActions = require('../../../../../js/actions/windowActions')

// Constants
const messages = require('../../../../../js/constants/messages')

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
    if (this.props.bookmarkKey) {
      windowActions.editBookmark(this.props.bookmarkKey, true)
    } else {
      windowActions.onBookmarkAdded(true)
    }
  }

  render () {
    const isBookmarked = !!this.props.bookmarkKey
    return <NavigationButton
      l10nId={this.props.bookmarkKey ? 'removeBookmarkButton' : 'addBookmarkButton'}
      testId={this.props.bookmarkKey ? 'removeBookmarkButton' : 'addBookmarkButton'}
      onClick={this.onToggleBookmark}
      class={css(
        styles.bookmarkButton,
        isBookmarked && styles.bookmarkButton_isBookmarked
      )}
    >
      <BookmarkIcon />
    </NavigationButton>
  }
}

const styles = StyleSheet.create({
  bookmarkButton: {
    '--icon-fill-color': 'transparent',
    '--icon-transit-easing': 'ease-in',
    justifyContent: 'flex-start'
  },

  bookmarkButton_isBookmarked: {
    '--icon-line-color': '#FB542B',
    '--icon-transit-easing': 'ease-out'
  }
})

module.exports = BookmarkButton
