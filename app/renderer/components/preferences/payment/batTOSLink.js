/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const ImmutableComponent = require('../../immutableComponent')
const {StyleSheet, css} = require('aphrodite/no-important')

class BatTOSLink extends ImmutableComponent {
  render () {
    return <a className={css(styles.a)}
      data-l10n-id='termsOfService'
      href='https://basicattentiontoken.org/contributor-terms-of-service/'
      target='_blank'
      rel='noreferrer noopener'
    />
  }
}

const styles = StyleSheet.create({
  a: {
    fontSize: '13px',
    color: '#666'
  }
})

module.exports = BatTOSLink
