/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const PropTypes = require('prop-types')
const ReactDOM = require('react-dom')
const ImmutableComponent = require('./immutableComponent')

/**
 * Represents a button in a Dialog
 */
class DialogButton extends ImmutableComponent {
  get clickHandler () {
    let clickHandler = this.props.onClick.bind(this, this.props.returnValue)
    if (this.props.returnValue === undefined &&
      typeof this.props.returnValueCallback === 'function') {
      clickHandler = () => this.props.onClick(
          this.props.returnValueCallback(ReactDOM.findDOMNode(this).parentNode))
    }
    return clickHandler
  }

  render () {
    return <span className='dialogButton'
      onClick={this.clickHandler}
      data-l10n-id={this.props['data-l10n-id']}>
      {this.props.text}
    </span>
  }
}

DialogButton.propTypes = {
  'data-l10n-id': PropTypes.string,
  onClick: PropTypes.func,
  returnValue: PropTypes.bool,
  returnValueCallback: PropTypes.func,
  text: PropTypes.string
}

module.exports = DialogButton
