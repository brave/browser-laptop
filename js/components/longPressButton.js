/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const ImmutableComponent = require('./immutableComponent')

class LongPressButton extends ImmutableComponent {
  constructor () {
    super()
    this.isLocked = false
    this.onClick = this.onClick.bind(this)
    this.onMouseDown = this.onMouseDown.bind(this)
    this.onMouseUp = this.onMouseUp.bind(this)
    this.onMouseLeave = this.onMouseLeave.bind(this)
  }

  onMouseDown (e) {
    if (e.target.attributes.getNamedItem('disabled')) {
      return
    }

    const self = this
    const target = e.target
    const LONG_PRESS_MILLISECONDS = 300

    this.longPressTimer = setTimeout(function () {
      self.isLocked = true
      self.props.onLongPress(target)
    }, LONG_PRESS_MILLISECONDS)
  }

  onMouseUp (e) {
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer)
      this.longPressTimer = null
    }
  }

  onMouseLeave (e) {
    this.onMouseUp(e)
    if (this.isLocked) {
      this.isLocked = false
    }
  }

  onClick (e) {
    if (this.isLocked) {
      this.isLocked = false
      return
    }
    this.props.onClick(e)
  }

  render () {
    return <span data-l10n-id={this.props.l10nId}
      className={this.props.className}
      disabled={this.props.disabled}
      onClick={this.onClick}
      onMouseDown={this.onMouseDown}
      onMouseUp={this.onMouseUp}
      onMouseLeave={this.onMouseLeave} />
  }
}

module.exports = LongPressButton
