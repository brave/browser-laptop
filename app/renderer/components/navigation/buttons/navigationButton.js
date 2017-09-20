/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')

// Components
const ImmutableComponent = require('../../immutableComponent')
const LongPressButton = require('../../common/longPressButton')

// Utils
const cx = require('../../../../../js/lib/classSet')

class NavigationButton extends ImmutableComponent {
  render () {
    return <div
      data-test-id={this.props.testId}
      className={cx({
        navigationButtonContainer: true,
        nav: true,
        disabled: this.props.disabled
      })}
      style={{
        transform: this.props.disabled ? `scale(1)` : `scale(${this.props.swipePercent})`,
        opacity: `${this.props.swipeOpacity}`
      }}
    >
      <LongPressButton
        testId={this.props.testId2}
        l10nId={this.props.l10nId}
        className={`normalizeButton navigationButton ${this.props.class}`}
        disabled={this.props.disabled}
        onClick={this.props.onClick}
        onLongPress={this.props.onLongPress}
      />
    </div>
  }
}

module.exports = NavigationButton
