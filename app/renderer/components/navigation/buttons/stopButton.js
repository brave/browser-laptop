
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const ipc = require('electron').ipcRenderer

// Components
const ImmutableComponent = require('../../immutableComponent')

// Constants
const messages = require('../../../../../js/constants/messages')

// Actions
const windowActions = require('../../../../../js/actions/windowActions')

class StopButton extends ImmutableComponent {
  constructor (props) {
    super(props)
    this.onStop = this.onStop.bind(this)
  }

  onStop () {
    // TODO (bridiver) - remove shortcut
    ipc.emit(messages.SHORTCUT_ACTIVE_FRAME_STOP)
    windowActions.onStop(this.props.isFocused, this.props.shouldRenderSuggestions)
  }

  render () {
    return <span className='navigationButtonContainer'>
      <button data-l10n-id='stopButton'
        className='normalizeButton navigationButton stopButton'
        onClick={this.onStop}
      />
    </span>
  }
}

module.exports = StopButton
