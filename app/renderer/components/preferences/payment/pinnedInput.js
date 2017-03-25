/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const {StyleSheet, css} = require('aphrodite')

// components
const ImmutableComponent = require('../../../../../js/components/immutableComponent')

// style
const globalStyles = require('../../styles/global')

// other
const aboutActions = require('../../../../../js/about/aboutActions')

class PinnedInput extends ImmutableComponent {
  componentDidUpdate () {
    this.textInput.value = this.props.defaultValue
  }

  keyPress (event) {
    if (event.key === 'Enter') {
      this.textInput.blur()
    }
  }

  pinPercentage (hostPattern, event) {
    let value = parseInt(event.target.value)

    if (value < 1) {
      value = 1
      this.textInput.value = 1
    }

    aboutActions.changeSiteSetting(hostPattern, 'ledgerPinPercentage', value)
    this.forceUpdate()
  }
  render () {
    return <input type='text'
      data-test-id='pinnedInput'
      ref={(input) => { this.textInput = input }}
      defaultValue={this.props.defaultValue}
      onBlur={this.pinPercentage.bind(this, this.props.patern)}
      onKeyPress={this.keyPress.bind(this)}
      className={css(styles.percInput)}
    />
  }
}

const styles = StyleSheet.create({
  percInput: {
    height: '22px',
    width: '50px',
    borderRadius: globalStyles.radius.borderRadius,
    textAlign: 'right',
    backgroundColor: 'transparent',
    outline: 'none',
    border: `1px solid #c4c5c5`,
    padding: '0 9px',
    fontSize: '16px',
    marginRight: '-10px',

    ':focus': {
      backgroundColor: '#fff',
      borderColor: globalStyles.color.highlightBlue
    }
  }
})

module.exports = PinnedInput
