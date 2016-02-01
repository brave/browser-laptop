/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const ImmutableComponent = require('./immutableComponent')
const Dialog = require('./dialog')

class ReleaseNotes extends ImmutableComponent {
  onClick (e) {
    e.stopPropagation()
  }
  render () {
    return <Dialog onHide={this.props.onHide} isClickDismiss>
      <div className='releaseNotes' onClick={this.onClick.bind(this)}>
        <h1>{this.props.metadata.get('name')}</h1>
        <div>{this.props.metadata.get('notes')}</div>
      </div>
    </Dialog>
  }
}

module.exports = ReleaseNotes
