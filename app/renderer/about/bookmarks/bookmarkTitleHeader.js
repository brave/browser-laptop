/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const Immutable = require('immutable')

// Components
const ImmutableComponent = require('../../components/immutableComponent')

// Actions
const windowActions = require('../../../../js/actions/windowActions')

class BookmarkTitleHeader extends ImmutableComponent {
  constructor () {
    super()
    this.addBookmark = this.addBookmark.bind(this)
  }
  addBookmark () {
    const newBookmark = Immutable.fromJS({
      parentFolderId: this.props.selectedFolderId
    })
    windowActions.addBookmark(newBookmark)
  }
  render () {
    return <div className='th-inner'>
      <span data-l10n-id={this.props.heading} />
      <span data-l10n-id='addBookmark' className='addBookmark' onClick={this.addBookmark} />
    </div>
  }
}

module.exports = BookmarkTitleHeader
