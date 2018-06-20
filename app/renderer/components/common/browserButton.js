/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const {StyleSheet, css} = require('aphrodite/no-important')
const ImmutableComponent = require('../immutableComponent')
const globalStyles = require('../styles/global')

class BrowserButton extends ImmutableComponent {
  get classNames () {
    return [
      styles.browserButton,
      this.props.primaryColor && [styles.browserButton_default, styles.browserButton_primaryColor],
      this.props.secondaryColor && [styles.browserButton_default, styles.browserButton_secondaryColor],
      this.props.alertColor && [styles.browserButton_default, styles.browserButton_alertColor],
      this.props.subtleItem && [styles.browserButton_default, styles.browserButton_subtleItem],
      // actionItem is just subtleItem with a blue background
      this.props.actionItem &&
        [styles.browserButton_default, styles.browserButton_subtleItem, styles.browserButton_actionItem],
      this.props.groupedItem && styles.browserButton_groupedItem,
      this.props.notificationItem && styles.browserButton_notificationItem,
      this.props.panelItem && styles.browserButton_panelItem,
      this.props.iconOnly && styles.browserButton_iconOnly,
      this.props.fitContent && styles.browserButton_fitContent,
      // TODO: These are other button styles app-wise
      // that needs to be refactored and included in this file
      // .............................................
      // this.props.navItem && styles.browserButton_navItem,

      // note: this should be the last item so it can override other styles
      this.props.disabled && styles.browserButton_disabled
    ]
  }

  get buttonStyle () {
    if (this.props.iconOnly && !this.props.inlineStyles) {
      return {
        height: this.props.size || '18px',
        width: this.props.size || '18px'
      }
    }
    return this.props.inlineStyles
  }

  get iconStyle () {
    if (this.props.iconOnly) {
      return {
        display: 'inherit',
        justifyContent: 'center',
        flexDirection: 'column',
        height: this.props.size || '18px',
        width: this.props.size || '18px',
        fontSize: this.props.size || 'inherit',
        color: this.props.color || 'inherit'
      }
    }
    return this.props.iconStyle
  }
  render () {
    return <button
      disabled={this.props.disabled}
      data-l10n-id={this.props.l10nId}
      data-test-id={this.props.testId}
      data-test2-id={this.props.test2Id}
      data-l10n-args={JSON.stringify(this.props.l10nArgs || {})}
      style={this.buttonStyle}
      onClick={this.props.onClick}
      className={css(this.classNames, this.props.custom)}>
      {
        this.props.iconClass || this.props.label
        ? <span
          className={this.props.iconClass}
          style={this.iconStyle}>{this.props.label}</span>
        : null
      }
    </button>
  }
}

const buttonSize = '25px'

const styles = StyleSheet.create({
  browserButton: {
    height: buttonSize,
    width: buttonSize,
    whiteSpace: 'nowrap',
    outline: 'none',
    cursor: 'default',
    display: 'inline-block',
    borderRadius: '2px',
    textAlign: 'center',
    transition: '.12s opacity ease, .12s background ease, .12s color ease',
    userSelect: 'none',
    backgroundSize: '16px',
    backgroundPosition: 'center center',
    backgroundRepeat: 'no-repeat',
    backgroundImage: 'none',
    backgroundColor: globalStyles.button.default.backgroundColor,
    border: 'none',

    // TODO: #9223
    fontSize: '13px',
    lineHeight: buttonSize,

    // The buttons as such do not require margin.
    // They are expected to have margin only if they are grouped.
    //
    // Avoid using shorthand properties to override the values
    // with browserButton_groupedItem below, without declaring !important.
    // See: https://github.com/Khan/aphrodite#object-key-ordering
    marginTop: 0,
    marginRight: 0,
    marginBottom: 0,
    marginLeft: 0,

    // cf: https://github.com/brave/browser-laptop/blob/548e11b1c889332fadb379237555625ad2a3c845/less/button.less#L49
    color: globalStyles.button.color,

    // See #11111
    WebkitAppRegion: 'no-drag',

    ':hover': {
      color: globalStyles.button.default.hoverColor
    }
  },

  // applies for primary and white buttons
  browserButton_default: {
    position: 'relative',
    boxShadow: globalStyles.button.default.boxShadow,
    cursor: 'pointer',

    // TODO: #9223
    height: '32px', // 32px == 1rem * 2
    fontSize: globalStyles.spacing.defaultFontSize,
    lineHeight: 1.25,

    // cf: https://github.com/brave/browser-laptop/blob/548e11b1c889332fadb379237555625ad2a3c845/less/button.less#L92
    color: globalStyles.button.default.color,

    // cf: https://github.com/brave/browser-laptop/blob/548e11b1c889332fadb379237555625ad2a3c845/less/button.less#L94-L95
    paddingTop: '5px',
    paddingBottom: '5px',

    // cf: https://github.com/brave/browser-laptop/blob/548e11b1c889332fadb379237555625ad2a3c845/less/button.less#L105-L106
    paddingRight: '16px',
    paddingLeft: '16px',

    width: 'auto',
    minWidth: `calc(${globalStyles.spacing.defaultFontSize} * 6)`, // issue #6384

    ':active': {
      // push the button down when active
      bottom: '-1px'
    }
  },

  browserButton_fitContent: {
    // See: 11021
    // Ensure that the button label does not overflow.
    width: `calc(${globalStyles.spacing.defaultFontSize} * 6)`, // issue #6384
    minWidth: 'fit-content'
  },

  browserButton_primaryColor: {
    background: globalStyles.button.primary.background,
    borderLeft: `2px solid ${globalStyles.button.primary.gradientColor1}`,
    borderRight: `2px solid ${globalStyles.button.primary.gradientColor2}`,
    borderTop: `2px solid ${globalStyles.button.primary.gradientColor1}`,
    borderBottom: `2px solid ${globalStyles.button.primary.gradientColor2}`,
    cursor: 'pointer',

    // https://github.com/brave/browser-laptop/blob/548e11b1c889332fadb379237555625ad2a3c845/less/button.less#L115
    fontWeight: 500,

    ':hover': {
      border: `2px solid ${globalStyles.button.primary.borderHoverColor}`,
      color: globalStyles.button.primary.hoverColor
    }
  },

  browserButton_secondaryColor: {
    background: globalStyles.button.secondary.background,
    border: '1px solid white',
    color: globalStyles.button.secondary.color,
    cursor: 'pointer',
    fontWeight: 500,

    ':hover': {
      border: `1px solid ${globalStyles.button.secondary.borderHoverColor}`,
      color: globalStyles.button.secondary.hoverColor
    }
  },

  browserButton_alertColor: {
    background: globalStyles.button.alert.background,
    borderLeft: `2px solid ${globalStyles.button.alert.gradientColor1}`,
    borderRight: `2px solid ${globalStyles.button.alert.gradientColor2}`,
    borderTop: `2px solid ${globalStyles.button.alert.gradientColor1}`,
    borderBottom: `2px solid ${globalStyles.button.alert.gradientColor2}`,
    cursor: 'pointer',
    fontWeight: 500,

    ':hover': {
      border: `2px solid ${globalStyles.button.alert.borderHoverColor}`,
      color: globalStyles.button.alert.hoverColor
    }
  },

  browserButton_groupedItem: {
    // Issue #9252
    // Because the grouped buttons are *by design* aligned to the right
    // with flex/grid, margin-right of each one should be set to zero.
    // If you set margin-right to those buttons, it is expected to lead to style inconsistency.
    //
    // Before making a change, please consult with Brad on your proposal.
    marginRight: 0,

    // 7.5px = 1/12 inch
    marginLeft: '7.5px',

    // Issue #11288
    // Cancel the margin-left of the first element.
    // The buttons have to have a parent. Beginning with Selectors Level 4, that is no longer required.
    ':first-child': {
      marginLeft: '0'
    }
  },

  browserButton_notificationItem: {
    textTransform: 'capitalize',
    height: '28px'
  },

  browserButton_subtleItem: {
    background: globalStyles.button.subtle.backgroundColor,

    // cf: https://github.com/brave/browser-laptop/blob/548e11b1c889332fadb379237555625ad2a3c845/less/button.less#L152
    fontSize: '14px',

    // Adding box-shadow:none to cancel the box-shadow specified on browserButton_default.
    // On button.less, box-shadow is only speficied to .primaryButton and .whiteButton
    // cf:
    //  https://github.com/brave/browser-laptop/blob/548e11b1c889332fadb379237555625ad2a3c845/less/button.less#L114
    //  https://github.com/brave/browser-laptop/blob/548e11b1c889332fadb379237555625ad2a3c845/less/button.less#L137
    boxShadow: 'none',

    // Cancel pushing down the button to make the button subtle.
    ':active': {
      bottom: 0
    }
  },

  browserButton_actionItem: {
    background: globalStyles.button.action.backgroundColor
  },

  browserButton_panelItem: {
    minWidth: globalStyles.button.panel.width
  },

  browserButton_iconOnly: {
    display: 'flex',
    justifyContent: 'center',
    lineHeight: '18px',
    width: '18px',
    height: '18px',
    fontSize: '24px'
  },

  browserButton_disabled: {
    pointerEvents: 'none',
    animation: 'none',
    opacity: 0.25
  }
})

module.exports = BrowserButton
