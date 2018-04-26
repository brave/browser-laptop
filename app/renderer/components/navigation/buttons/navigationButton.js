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
    const buttonClass = css(styles.navigationButton) + (this.props.class ? ` ${this.props.class}` : '')
    return <div
      data-test-id={this.props.testId}
      className={cx({
        navigationButtonContainer: true,
        nav: this.props.isNav,
        disabled: this.props.disabled
      })}
      style={{
        transform: this.props.disabled ? `scale(1)` : `scale(${this.props.swipePercent})`,
        opacity: `${this.props.swipeOpacity}`
      }}
      ref={this.props.navigationButtonRef}
    >
      {
        this.props.onLongPress
          ? <LongPressButton
            testId={this.props.testId2}
            l10nId={this.props.l10nId}
            className={buttonClass}
            disabled={this.props.disabled}
            onClick={this.props.onClick}
            onLongPress={this.props.onLongPress}
          >
            { this.props.children }
          </LongPressButton>
          : <button
            data-l10n-id={this.props.l10nId}
            data-test-id={this.props.testId2}
            className={buttonClass}
            disabled={this.props.disabled}
            onClick={this.props.onClick}
          >
            {this.props.children}
          </button>
      }
    </div>
  }
}

const styles = StyleSheet.create({
  navigationButton: {
    '--icon-line-color': globalStyles.color.buttonColor,
    display: 'flex',
    justifyContent: 'center',
    outline: 'none',
    margin: `0 ${theme.navigator.icons.spacing} 0 0`,
    border: 'none',
    background: 'none',
    width: '100%',
    height: '100%'
  }
})

module.exports = NavigationButton
