
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const ipc = require('electron').ipcRenderer

// Components
const ImmutableComponent = require('../../immutableComponent')
const NavigationButton = require('./navigationButton')

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
    return <NavigationButton
      l10nId='stopButton'
      onClick={this.onStop}
    >
      <svg xmlns='http://www.w3.org/2000/svg' width='14' height='13' viewBox='0 0 14 13'>
        <path fill='none' stroke='#6D7276' strokeLinecap='round' strokeLinejoin='round'
          strokeWidth='1.291' d='M13.0056494 1L1 12.2328009m12.01-.0023371L1 1' />
      </svg>
    </NavigationButton>
  }
}

module.exports = StopButton
