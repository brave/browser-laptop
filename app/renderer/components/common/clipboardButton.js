/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const {StyleSheet, css} = require('aphrodite/no-important')
const globalStyles = require('../styles/global')

const BrowserButton = require('./browserButton')

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
        styles.clipboardButton__label,
        this.state.visibleLabel && styles.clipboardButton__label_visible,
        (this.props.bottomTooltip || this.props.topTooltip) && styles.clipboardButton__label_vertical,
        (this.props.bottomTooltip && !this.props.topTooltip) && styles.clipboardButton__label_bottom,

        // Applied on add funds panel
        (!this.props.bottomTooltip && this.props.topTooltip) && styles.clipboardButton__label_top
      )}
        onAnimationEnd={this.onAnimationEnd}
        data-l10n-id='copied'
      />
      <BrowserButton
        disabled={this.props.disabled}
        iconClass={globalStyles.appIcons.clipboard}
        custom={styles.clipboardButton__browserButton}
        l10nId={this.props.dataL10nId ? this.props.dataL10nId : 'copyToClipboard'}
        testId={this.props.testId}
        onClick={this.onClick}
      />
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
    position: 'relative',
    cursor: 'pointer'
  },

  clipboardButton__browserButton: {
    fontSize: '1rem'
  },

  clipboardButton__label: {
    width: '-webkit-fill-available',
    marginRight: '1ch',
    display: 'none',
    willChange: 'opacity',
    opacity: 0
  },

  clipboardButton__label_visible: {
    display: 'inline',
    animationName: animation,
    animationDuration: '2s',
    animationTimingFunction: 'cubic-bezier(0.23, 1, 0.32, 1)'
  },

  clipboardButton__label_vertical: {
    position: 'absolute',
    right: '30px'
  },

  clipboardButton__label_bottom: {
    top: '35px'
  },

  clipboardButton__label_top: {
    bottom: '35px'
  }
})

module.exports = ClipboardButton
