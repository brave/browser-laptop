/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const ipc = require('electron').ipcRenderer

// Components
const ImmutableComponent = require('../../immutableComponent')

// Actions
const windowActions = require('../../../../../js/actions/windowActions')

// Constants
const messages = require('../../../../../js/constants/messages')
const settings = require('../../../../../js/constants/settings')

// Utils
const cx = require('../../../../../js/lib/classSet')
const {getSetting} = require('../../../../../js/settings')

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
    return <div className='startButtons'>
      {
        !this.props.titleMode
          ? <span className='bookmarkButtonContainer'>
            <button data-l10n-id={this.props.bookmarkKey ? 'removeBookmarkButton' : 'addBookmarkButton'}
              className={cx({
                navigationButton: true,
                bookmarkButton: true,
                removeBookmarkButton: !!this.props.bookmarkKey,
                withHomeButton: getSetting(settings.SHOW_HOME_BUTTON),
                normalizeButton: true
              })}
              onClick={this.onToggleBookmark}
            />
          </span>
          : null
      }
    </div>
  }
}

module.exports = BookmarkButton
