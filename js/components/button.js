/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const ImmutableComponent = require('./immutableComponent')
const cx = require('../lib/classSet.js')

class Button extends ImmutableComponent {
  render () {
    if (this.props.iconClass) {
      return <span disabled={this.props.disabled}
        data-l10n-id={this.props.l10nId}
        style={this.props.inlineStyles}
        data-button-value={this.props.dataButtonValue}
        className={cx({
          browserButton: true,
          fa: true,
          [this.props.iconClass]: !!this.props.iconClass,
          [this.props.className]: !!this.props.className
        })}
        onClick={this.props.onClick} />
    }
    return <span disabled={this.props.disabled}
      data-l10n-id={this.props.l10nId}
      data-l10n-args={JSON.stringify(this.props.l10nArgs || {})}
      style={this.props.inlineStyles}
      className={cx({
        browserButton: true,
        [this.props.className]: !!this.props.className
      })} onClick={this.props.onClick}>
      {this.props.label}
    </span>
  }
}

module.exports = Button
