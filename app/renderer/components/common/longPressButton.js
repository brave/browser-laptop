/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const ImmutableComponent = require('../immutableComponent')
const cx = require('../../../../js/lib/classSet')
const {StyleSheet, css} = require('aphrodite/no-important')

class LongPressButton extends ImmutableComponent {
  constructor () {
    super()
    this.isLocked = false
    this.onClick = this.onClick.bind(this)
    this.onMouseDown = this.onMouseDown.bind(this)
    this.onMouseUp = this.onMouseUp.bind(this)
    this.onMouseLeave = this.onMouseLeave.bind(this)
  }

  componentDidMount (e) {
    this.buttonNode.addEventListener('auxclick', this.onAuxClick.bind(this))
  }

  onMouseDown (e) {
    if (e.target.attributes.getNamedItem('disabled')) {
      return
    }
    if (e && e.preventDefault) {
      e.preventDefault()
    }
    if (e && e.stopPropagation) {
      e.stopPropagation()
    }

    const self = this
    const target = e.target
    const LONG_PRESS_MILLISECONDS = 300

    // Right click should immediately trigger the action
    if (e.button === 2) {
      self.props.onLongPress(target)
      return
    }

    // Otherwise, it should wait before triggering
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
    if (this.props.onClick) {
      this.props.onClick(e)
    }
  }

  onAuxClick (e) {
    if (e.button === 1) {
      this.onClick(e)
    }
  }

  render () {
    return <button
      // Add 'navigationButton' for the buttons on navigationBarWrapper
      // eg. reloadButton, backButton and forwardButton
      // TODO (Suguru): Refactor newFrameButton on tabs.js
      className={cx({
        [this.props.className]: this.props.className,
        [css(styles.normalizedButton, this.props.navigationButton && styles.normalizedButton_navigationButton, this.props.custom)]: true
      })}
      data-l10n-id={this.props.l10nId}
      data-test-id={this.props.testId}
      disabled={this.props.disabled}
      onClick={this.onClick}
      ref={(node) => { this.buttonNode = node }}
      onMouseDown={this.onMouseDown}
      onMouseUp={this.onMouseUp}
      onMouseLeave={this.onMouseLeave}
    />
  }
}

const styles = StyleSheet.create({
  // See browserButton.js for the same properties
  normalizedButton: {
    background: 'none',
    outline: 'none',
    border: 'none',
    margin: 0,
    whiteSpace: 'nowrap'
  },

  normalizedButton_navigationButton: {
    display: 'inline-block',
    width: '100%',
    height: '100%',
    padding: 0
  }
})

module.exports = LongPressButton
