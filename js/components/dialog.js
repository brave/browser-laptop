/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const PropTypes = require('prop-types')
const ImmutableComponent = require('./immutableComponent')
const KeyCodes = require('../../app/common/constants/keyCodes')

/**
 * Represents a popup dialog
 */
class Dialog extends ImmutableComponent {
  componentDidMount () {
    window.addEventListener('keydown', this.onKeyDown.bind(this))
    this.dialog.focus()
  }

  onClick () {
    if (this.props.onHide && this.props.isClickDismiss) {
      this.props.onHide()
    }
  }

  onKeyDown (e) {
    if (e.keyCode === KeyCodes.ESC) {
      if (this.props.onHide) {
        this.props.onHide()
      }
    }
  }

  render () {
    return <div className={'dialog ' + (this.props.className || '')}
      tabIndex='-1'
      ref={(node) => { this.dialog = node }}
      onKeyDown={this.onKeyDown.bind(this)}
      onClick={this.onClick.bind(this)}>
      {this.props.children}
    </div>
  }
}

Dialog.propTypes = {
  children: PropTypes.oneOfType([
    PropTypes.element,
    PropTypes.array
  ]),
  className: PropTypes.string,
  isClickDismiss: PropTypes.bool,
  onHide: PropTypes.func
}

module.exports = Dialog
