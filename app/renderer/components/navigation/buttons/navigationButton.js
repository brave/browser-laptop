/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const {StyleSheet, css} = require('aphrodite/no-important')

// Components
const ImmutableComponent = require('../../immutableComponent')
const LongPressButton = require('../../common/longPressButton')

// Styles
const globalStyles = require('../../styles/global')

class NavigationButton extends ImmutableComponent {
  render () {
    const buttonClass = css(
      styles.navigationButton,
      this.props.disabled && styles.navigationButton_disabled,
      (!this.props.disabled) && styles.navigationButton_enabled,
      this.props.isNav && styles.navigationButton_nav,
      this.props.active && styles.navigationButton_active,
      this.props.styles
    ) + (this.props.class ? ` ${this.props.class}` : '')
    const instanceStyle = {
      transform: this.props.disabled ? `scale(1)` : `scale(${this.props.swipePercent})`,
      opacity: `${this.props.swipeOpacity}`
    }
    return this.props.onLongPress
      ? <LongPressButton
        testId={this.props.testId}
        l10nId={this.props.l10nId}
        l10nArgs={this.props.l10nArgs}
        className={buttonClass}
        disabled={this.props.disabled}
        onClick={this.props.onClick}
        onLongPress={this.props.onLongPress}
        ref={this.props.navigationButtonRef}
        style={instanceStyle}
        dataAttributes={this.props.dataAttributes}
      >
        { this.props.children }
      </LongPressButton>
      : <button
        data-l10n-id={this.props.l10nId}
        data-test-id={this.props.testId}
        data-l10n-args={this.props.l10nArgs && JSON.stringify(this.props.l10nArgs)}
        className={buttonClass}
        disabled={this.props.disabled}
        onClick={this.props.onClick}
        ref={this.props.navigationButtonRef}
        style={instanceStyle}
        {...this.props.dataAttributes}
      >
        {this.props.children}
      </button>
  }
}

const activeStyles = {
  background: 'rgba(153, 153, 158, 1)',
  transitionDuration: '0s'
}

const hoverStyles = {
  background: 'rgb(225, 225, 229)',
  borderColor: '#eeeaea'
  // boxShadow: '0 0px 3px 0 rgb(214,218,221)'
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
    padding: '1px',
    borderRadius: '3px',
    background: 'none',
    width: '28px',
    height: '28px',
    boxShadow: '0 0 0 transparent',
    transition: 'background .24s ease-out, box-shadow .24s ease-out',
    // TODO: if we want focus styles that aren't like hover styles (i.e. a focus ring),
    // but we only want to show up in keyboard-focused not mouse-focus (i.e. click), then
    // either wait for the :focus-ring selector (which is only when keyboard is used to tab focus),
    // or use the trick from https://stackoverflow.com/questions/31402576/enable-focus-only-on-keyboard-use-or-tab-press
    ':focus': hoverStyles
  },

  navigationButton_active: hoverStyles,

  navigationButton_enabled: {
    ':hover': hoverStyles,
    ':active': activeStyles
  },

  navigationButton_disabled: {
    '--icon-line-color': globalStyles.color.buttonColorDisabled
  }
})

module.exports = NavigationButton
