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
      this.props.extensionItem && styles.browserButton_extensionItem,
      this.props.groupedItem && styles.browserButton_groupedItem,
      this.props.notificationItem && styles.browserButton_notificationItem
      // TODO: These are other button styles app-wise
      // that needs to be refactored and included in this file
      // .............................................
      // this.props.smallItem && styles.browserButton_actionItem,
      // this.props.actionItem && styles.browserButton_actionItem,
      // this.props.navItem && styles.browserButton_navItem,
      // this.props.panelItem && styles.browserButton_panelItem,
      // this.props.subtleItem && styles.browserButton_subtleItem
    ]
  }
  render () {
    return <button
      disabled={this.props.disabled}
      data-l10n-id={this.props.l10nId}
      data-test-id={this.props.testId}
      data-test2-id={this.props.test2Id}
      data-l10n-args={JSON.stringify(this.props.l10nArgs || {})}
      style={this.props.inlineStyles}
      data-button-value={this.props.dataButtonValue}
      onClick={this.props.onClick}
      className={css(this.classNames, this.props.custom)}>
      {
        this.props.iconClass || this.props.label
        ? <span className={this.props.iconClass}>{this.props.label}</span>
        : null
      }
    </button>
  }
}

const styles = StyleSheet.create({
  browserButton: {
    margin: '0 3px',
    whiteSpace: 'nowrap',
    outline: 'none',
    cursor: 'default',
    display: 'inline-block',
    lineHeight: '25px',
    height: '25px',
    width: '25px',
    fontSize: '13px',
    color: globalStyles.button.default.color,
    borderRadius: '2px',
    textAlign: 'center',
    transition: '.1s opacity, .1s background',
    userSelect: 'none',
    backgroundSize: '16px',
    backgroundPosition: 'center center',
    backgroundRepeat: 'no-repeat',
    backgroundImage: 'none',
    backgroundColor: globalStyles.button.default.backgroundColor,
    border: 'none',
    ':hover': {
      color: globalStyles.button.default.hoverColor
    }
  },
  // applies for primary and white buttons
  browserButton_default: {
    position: 'relative',
    boxShadow: globalStyles.button.default.boxShadow,
    cursor: 'pointer',
    lineHeight: 1.25,
    width: 'auto',
    height: 'auto',
    minWidth: '78px',
    fontSize: '13px',
    padding: '7px 20px',
    ':active': {
      // push the button down when active
      bottom: '-1px'
    }
  },
  browserButton_primaryColor: {
    background: globalStyles.button.primary.background,
    borderLeft: '2px solid transparent',
    borderRight: '2px solid transparent',
    borderTop: `2px solid ${globalStyles.button.primary.gradientColor1}`,
    borderBottom: `2px solid ${globalStyles.button.primary.gradientColor2}`,
    color: globalStyles.button.primary.color,
    cursor: 'pointer',
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
    ':hover': {
      border: `1px solid ${globalStyles.button.secondary.borderHoverColor}`,
      color: globalStyles.button.secondary.hoverColor
    }
  },
  browserButton_extensionItem: {
    WebkitAppRegion: 'no-drag',
    backgroundSize: 'contain',
    height: '17px',
    margin: '4px 0 0 0',
    opacity: '0.85',
    backgroundRepeat: 'no-repeat'
  },
  browserButton_groupedItem: {
    // Legacy LESS inside ledger is too nested
    // and this style won't have effect without using !important
    // TODO: remove !important and check advancedSettings.js
    // once preferences is fully refactored
    marginRight: '4px !important',
    marginLeft: '4px !important'
  },
  browserButton_notificationItem: {
    fontSize: '13px',
    marginRight: '10px',
    padding: '2px 15px',
    textTransform: 'capitalize',
    width: 'auto'
  }
})

module.exports = BrowserButton
