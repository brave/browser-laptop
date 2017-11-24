/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const ImmutableComponent = require('../immutableComponent')
const {StyleSheet, css} = require('aphrodite/no-important')

class BraveLink extends ImmutableComponent {
  render () {
    return <a className={css(
      this.props['data-isBatTOS'] && styles.braveLink_batTOS,
      this.props.customStyle
    )}
      data-l10n-id={this.props.l10nId}
      data-test-id={this.props.testId}
      href={this.props.href}
      target={this.props.customTarget ? this.props.customTarget : '_blank'}
      rel={this.props.isReferrer ? 'noopener' : 'noreferrer noopener'}
    >
      {this.props.children}
    </a>
  }
}

const styles = StyleSheet.create({
  braveLink_batTOS: {
    fontSize: '13px',
    color: '#666'
  }
})

module.exports = BraveLink
