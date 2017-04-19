/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const ImmutableComponent = require('../../app/renderer/components/immutableComponent')
const cx = require('../lib/classSet')

/**
 * Represents a modal overlay
 */

var globalInstanceCounter = 0
var mountedInstances = []

class ModalOverlay extends ImmutableComponent {
  componentWillMount () {
    this.instanceId = globalInstanceCounter++

    this.setState({last: true})

    if (mountedInstances.length) {
      let lastModal = mountedInstances[mountedInstances.length - 1]
      lastModal.setState({last: false})
      lastModal.forceUpdate()
    }

    mountedInstances.push(this)
  }

  componentWillUnmount () {
    let instId = this.instanceId

    mountedInstances = mountedInstances.filter(function (inst) {
      return inst.instanceId !== instId
    })

    if (mountedInstances.length) {
      let lastModal = mountedInstances[mountedInstances.length - 1]
      lastModal.setState({last: true})
      lastModal.forceUpdate()
    }
  }

  get dialogContent () {
    var close = null
    var button = null
    var title = null

    let customTitleClassesStr = (this.props.customTitleClasses ? this.props.customTitleClasses : '')
    let customDialogClassesStr = (this.props.customDialogClasses ? this.props.customDialogClasses : '')

    if (!this.props.emptyDialog) {
      close = (this.props.onHide ? <button type='button' className='close' onClick={this.props.onHide} /> : null)
      title = (this.props.title ? <div className={cx({
        sectionTitle: true,
        [customTitleClassesStr]: true
      })} data-l10n-id={this.props.title} /> : null)
    }

    return <div className={cx({
      dialog: true,
      [customDialogClassesStr]: true
    })}>
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
    return <div className={cx({
      modal: true,
      fade: true,
      last: this.state.last,
      transparentBackground: this.props.transparentBackground
    })} role='alert'>
      {this.dialogContent}
    </div>
  }
}

module.exports = ModalOverlay
