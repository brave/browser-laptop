/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const {StyleSheet, css} = require('aphrodite/no-important')

// Components
const ImmutableComponent = require('../../immutableComponent')
const LongPressButton = require('../../common/longPressButton')

// Utils
const cx = require('../../../../../js/lib/classSet')

// Styles
const globalStyles = require('../../styles/global')
const {theme} = require('../../styles/theme')

class NavigationButton extends ImmutableComponent {
  render () {
    const buttonClass = css(
      styles.navigationButton,
      this.props.disabled && styles.navigationButton_disabled,
      this.props.isNav && styles.navigationButton_nav
    ) + (this.props.class ? ` ${this.props.class}` : '')
    const instanceStyle = {
      transform: this.props.disabled ? `scale(1)` : `scale(${this.props.swipePercent})`,
      opacity: `${this.props.swipeOpacity}`
    }
    return this.props.onLongPress
      ? <LongPressButton
        testId={this.props.testId}
        l10nId={this.props.l10nId}
        className={buttonClass}
        disabled={this.props.disabled}
        onClick={this.props.onClick}
        onLongPress={this.props.onLongPress}
        ref={this.props.navigationButtonRef}
        style={instanceStyle}
      >
        { this.props.children }
      </LongPressButton>
      : <button
        data-l10n-id={this.props.l10nId}
        data-test-id={this.props.testId}
        className={buttonClass}
        disabled={this.props.disabled}
        onClick={this.props.onClick}
        ref={this.props.navigationButtonRef}
        style={instanceStyle}
      >
        {this.props.children}
      </button>
  }
}

const styles = StyleSheet.create({

  navigationButton: {
    '--icon-line-color': globalStyles.color.buttonColor,
    display: 'flex',
    justifyContent: 'center',
    outline: 'none',
    margin: `0 6px 0 0`,
    boxSizing: 'border-box',
    border: 'solid 1px transparent',
    borderRadius: '3px',
    background: 'none',
    width: '28px',
    height: '28px',
    boxShadow: '0 0 0 transparent',
    transition: 'background .24s ease-out, box-shadow .24s ease-out',
    ':hover': {
      background: 'rgb(255, 255, 255)',
      borderColor: '#eeeaea'
     // boxShadow: '0 0px 3px 0 rgb(214,218,221)'
    },
    ':active': {
      background: 'rgba(255, 255, 255, .8)',
      boxShadow: '0 0px 3px 0 rgba(74, 144, 226,.7)'
    },
    ':focus': {
      boxShadow: '0 0px 3px 0 rgba(74, 144, 226,.7)'
    }
  },

  navigationButton_disabled: {
    ':hover': {
      background: 'none'
    }
  }
})

module.exports = NavigationButton
