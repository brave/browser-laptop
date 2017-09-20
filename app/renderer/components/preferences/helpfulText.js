/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const ImmutableComponent = require('../immutableComponent')

const cx = require('../../../../js/lib/classSet')

const {StyleSheet, css} = require('aphrodite/no-important')
const globalStyles = require('../styles/global')

class HelpfulText extends ImmutableComponent {
  render () {
    return <div className={css(styles.helpfulText)}>
      <span className={cx({
        [globalStyles.appIcons.moreInfo]: true,
        [css(styles.helpfulText__icon)]: true
      })} />
      <span data-l10n-id={this.props.l10nId} />
      {this.props.children}
    </div>
  }
}

const styles = StyleSheet.create({
  helpfulText: {
    display: 'flex',
    alignItems: 'center'
  },

  helpfulText__icon: {
    color: globalStyles.color.mediumGray,
    fontSize: '1.25rem',
    marginRight: '.5ch'
  }
})

module.exports = HelpfulText
