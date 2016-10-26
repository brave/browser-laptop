/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const ImmutableComponent = require('./immutableComponent')
const Dialog = require('./dialog')
const windowActions = require('../actions/windowActions')
const AddEditBookmarkHanger = require('../../app/renderer/components/addEditBookmarkHanger')

class AddEditBookmark extends ImmutableComponent {
  constructor () {
    super()
    this.onClose = this.onClose.bind(this)
  }
  onClose () {
    windowActions.setBookmarkDetail()
  }
  render () {
    return <Dialog onHide={this.onClose} isClickDismiss>
      <AddEditBookmarkHanger
        isModal
        sites={this.props.sites}
        currentDetail={this.props.currentDetail}
        originalDetail={this.props.originalDetail}
        destinationDetail={this.props.destinationDetail}
        shouldShowLocation={this.props.shouldShowLocation}
      />
    </Dialog>
  }
}

module.exports = AddEditBookmark
