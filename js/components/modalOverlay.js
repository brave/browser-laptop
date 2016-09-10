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
      close = (this.props.onHide ? <button type='button' className='close pull-right' onClick={this.props.onHide}><span>&times;</span></button> : null)
      title = (this.props.title ? <div className='sectionTitle' data-l10n-id={this.props.title} /> : null)
    }
    let customTitleClassesStr = (this.props.customTitleClasses ? this.props.customTitleClasses : '')

    return <div className={'dialog ' + customTitleClassesStr}>
      <div className='dialog-header'>
        {close}
        {title}
      </div>
      <div className='dialog-body'>
        {this.props.content}
      </div>
      <div className='dialog-footer'>
        {this.props.footer}
      </div>
    </div>
  }

  render () {
    return <div className='modal fade' role='alert'>
      {this.dialogContent}
    </div>
  }
}

module.exports = ModalOverlay
