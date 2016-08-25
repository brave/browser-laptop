/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const ImmutableComponent = require('./immutableComponent')

/**
 * Represents a modal overlay
 */

class ModalOverlay extends ImmutableComponent {
  get dialogContent () {
    var close = null
    var button = null
    var title = null
    if (!this.props.emptyDialog) {
      close = <button type='button' className='close pull-right' onClick={this.props.onHide}><span>&times;</span></button>
      title = <div className='sectionTitle' data-l10n-id={this.props.title} />
    }
    return <div className='dialog'>
      {close}
      {title}
      {this.props.content}
    </div>
  }

  render () {
    return <div className='modal fade' role='alert'>
      {this.dialogContent}
    </div>
  }
}

module.exports = ModalOverlay
