/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const ImmutableComponent = require('../immutableComponent')
const {StyleSheet, css} = require('aphrodite/no-important')
const globalStyles = require('../styles/global')

class BraveLink extends ImmutableComponent {
  render () {
    return <a className={css(
      styles.braveLink,
      this.props.mediumGray && styles.braveLink_color_mediumGray,
      this.props.braveOrange && styles.braveLink_color_braveOrange,
      this.props.smaller && styles.braveLink_text_smaller,
      this.props.customStyle
    )}
      data-l10n-id={this.props.l10nId}
      data-test-id={this.props.testId}
      href={this.props.href}
      target={this.props.self ? '_self' : '_blank'}
      rel={this.props.isReferrer ? 'noopener' : 'noreferrer noopener'}
    >
      {this.props.children}
    </a>
  }
}

const styles = StyleSheet.create({
  braveLink: {
    color: globalStyles.color.commonTextColor
  },

  braveLink_color_mediumGray: {
    color: globalStyles.color.mediumGray
  },

  braveLink_color_braveOrange: {
    color: globalStyles.color.braveOrange,

    ':hover': {
      color: globalStyles.color.commonTextColor
    }
  },

  braveLink_text_smaller: {
    fontSize: 'smaller'
  }
})

module.exports = BraveLink
