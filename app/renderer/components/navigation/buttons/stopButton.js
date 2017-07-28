/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const ipc = require('electron').ipcRenderer
const {StyleSheet} = require('aphrodite/no-important')

// Components
const ImmutableComponent = require('../../immutableComponent')
const {NormalizedButton} = require('../../common/browserButton')

// Constants
const messages = require('../../../../../js/constants/messages')

// Actions
const windowActions = require('../../../../../js/actions/windowActions')

// Styles
const stopLoadingButtonIcon = require('../../../../../img/toolbar/stoploading_btn.svg')

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

  // BEM Level: navigationBar__buttonContainer
  render () {
    return <NormalizedButton
      navigationButton
      custom={styles.stopButton}
      l10nid='stopButton'
      onClick={this.onStop}
    />
  }
}

const styles = StyleSheet.create({
  stopButton: {
    background: `url(${stopLoadingButtonIcon}) center no-repeat`,
    backgroundSize: '11px 11px'
  }
})

module.exports = StopButton
