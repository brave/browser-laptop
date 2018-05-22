/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const ImmutableComponent = require('../immutableComponent')
const cx = require('../../../../js/lib/classSet')

/**
 * ************************************************************
 * THIS FILE WILL BE DEPRECATED IN FAVOR OF
 * /app/renderer/components/common/browserButton
 * PLEASE USE THE FORMER FOR NEWLY INTRODUCED CODE
 * ************************************************************
 * THIS FILE WILL BE REMOVED ONCE ALL BUTTONS WERE REFACTORED
 * ************************************************************
 */
class Button extends ImmutableComponent {
  render () {
    if (this.props.iconClass) {
      return <button disabled={this.props.disabled}
        data-l10n-id={this.props.l10nId}
        data-test-id={this.props.testId}
        data-test2-id={this.props.test2Id}
        data-l10n-args={JSON.stringify(this.props.l10nArgs || {})}
        style={this.props.inlineStyles}
        className={cx({
          browserButton: true,
          fa: true,
          [this.props.iconClass]: !!this.props.iconClass,
          [this.props.className]: !!this.props.className
        })}
        onClick={this.props.onClick} />
    }
    return <button disabled={this.props.disabled}
      data-l10n-id={this.props.l10nId}
      data-test-id={this.props.testId}
      data-test2-id={this.props.test2Id}
      data-l10n-args={JSON.stringify(this.props.l10nArgs || {})}
      style={this.props.inlineStyles}
      className={cx({
        browserButton: true,
        [this.props.className]: !!this.props.className
      })} onClick={this.props.onClick}>
      {this.props.label}
    </button>
  }
}

module.exports = Button
