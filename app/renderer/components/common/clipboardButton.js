/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const {StyleSheet, css} = require('aphrodite')

/**
 * Represents a 'Copy to clipboard' button
 */
class ClipboardButton extends React.Component {
  constructor (props) {
    super(props)
    this.copyAction = props.copyAction
    this.onClick = this.onClick.bind(this)
    this.onAnimationEnd = this.onAnimationEnd.bind(this)
    this.state = {
      visibleLabel: false
    }
  }

  onClick () {
    this.setState({
      visibleLabel: true
    })
    this.copyAction()
  }

  onAnimationEnd () {
    this.setState({
      visibleLabel: false
    })
  }

  render () {
    return <span className={css(styles.clipboardButton)}>
      <span className={css(
        styles.doneLabel,
        this.state.visibleLabel && styles.visible
      )} onAnimationEnd={this.onAnimationEnd} data-l10n-id='copied' />
      <span
        className={this.props.className}
        data-l10n-id={this.props.dataL10nId}
        onClick={this.onClick}>
        {
          this.props.textContext
          ? this.props.textContext
          : ''
        }
      </span>
    </span>
  }
}

const animation = {
  '0%': {
    opacity: 0
  },

  '30%': {
    opacity: 1
  },

  '100%': {
    opacity: 0
  }
}

const styles = StyleSheet.create({
  clipboardButton: {
    cursor: 'pointer'
  },
  doneLabel: {
    marginRight: '15px',
    opacity: 0,
    display: 'none'
  },
  visible: {
    display: 'inline',
    animationName: animation,
    animationDuration: '2s',
    animationTimingFunction: 'cubic-bezier(0.23, 1, 0.32, 1)'
  }
})

module.exports = ClipboardButton
