/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const {StyleSheet, css} = require('aphrodite/no-important')

// Components
const ImmutableComponent = require('../../immutableComponent')

// Actions
const appActions = require('../../../../../js/actions/appActions')

// Style
const globalStyles = require('../../styles/global')

class PinnedInput extends ImmutableComponent {
  componentDidUpdate () {
    this.textInput.value = this.props.defaultValue
  }

  keyPress (event) {
    if (event.key === 'Enter') {
      this.textInput.blur()
    }
  }

  pinPercentage (publisherKey, event) {
    let value = parseInt(event.target.value)

    if (value < 1 || !value) {
      value = 1
      this.textInput.value = 1
    }

    appActions.onLedgerPinPublisher(publisherKey, value)
    this.forceUpdate()
  }
  render () {
    return <input type='text'
      data-test-id='pinnedInput'
      ref={(input) => { this.textInput = input }}
      defaultValue={this.props.defaultValue}
      onBlur={this.pinPercentage.bind(this, this.props.publisherKey)}
      onKeyPress={this.keyPress.bind(this)}
      className={css(styles.pinnedInput)}
    />
  }
}

const styles = StyleSheet.create({
  // Ref: tableTd_percentage on ledgerTable.js
  pinnedInput: {
    border: `1px solid #c4c5c5`,
    borderRadius: globalStyles.radius.borderRadius,
    textAlign: 'right',
    background: 'transparent',
    outline: 'none',
    padding: '0 1ch',
    fontSize: '1rem',

    // include border width
    width: 'calc(5ch + 2px)',

    ':focus': {
      background: '#fff',
      borderColor: globalStyles.color.highlightBlue
    }
  }
})

module.exports = PinnedInput
