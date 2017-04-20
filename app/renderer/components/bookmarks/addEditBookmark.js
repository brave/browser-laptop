/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')

// Components
const ImmutableComponent = require('../immutableComponent')
const AddEditBookmarkHanger = require('./addEditBookmarkHanger')

// Actions
const windowActions = require('../../../../js/actions/windowActions')

class AddEditBookmark extends ImmutableComponent {
  constructor () {
    super()
    this.onClose = this.onClose.bind(this)
  }
  onClose () {
    windowActions.setBookmarkDetail()
  }
  componentDidMount () {
    this.refs.bookmarkHanger.setDefaultFocus()
  }
  render () {
    return <AddEditBookmarkHanger
      ref='bookmarkHanger'
      isModal
      sites={this.props.sites}
      currentDetail={this.props.currentDetail}
      originalDetail={this.props.originalDetail}
      destinationDetail={this.props.destinationDetail}
      shouldShowLocation={this.props.shouldShowLocation}
    />
  }
}

module.exports = AddEditBookmark
