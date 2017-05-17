/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

/*
 * Educates users that this is DRM, why it is not great, and that
 * we don't own the code being executed if it is turned on.  Provides
 * more info URL link to learn about DRM and Google's license URL link.
 */

const React = require('react')
const ImmutableComponent = require('./immutableComponent')
const appConfig = require('../../../js/constants/appConfig')
const cx = require('../../../js/lib/classSet')

const {StyleSheet, css} = require('aphrodite/no-important')
const globalStyles = require('./styles/global')

class WidevineInfo extends ImmutableComponent {
  constructor () {
    super()
    this.onMoreInfo = this.onMoreInfo.bind(this)
    this.onViewLicense = this.onViewLicense.bind(this)
  }
  onMoreInfo () {
    this.props.createTabRequestedAction({
      url: appConfig.widevine.moreInfoUrl
    })
  }
  onViewLicense () {
    this.props.createTabRequestedAction({
      url: appConfig.widevine.licenseUrl
    })
  }
  render () {
    return <section data-test-id='widevineInfo'>
      <div className={css(styles.widevineInfo__div)}>
        <span data-l10n-id='enableWidevineSubtext' />
        <span className={cx({
          fa: true,
          'fa-info-circle': true,
          [css(styles.cursor)]: true
        })}
          data-test-id='onMoreInfo'
          onClick={this.onMoreInfo}
          title={appConfig.widevine.moreInfoUrl}
        />
      </div>
      <div className={css(styles.widevineInfo__div)}>
        <span data-l10n-id='enableWidevineSubtext2' />
        <span className={cx({
          fa: true,
          'fa-info-circle': true,
          [css(styles.cursor)]: true
        })}
          data-test-id='onViewLicense'
          onClick={this.onViewLicense}
          title={appConfig.widevine.licenseUrl}
        />
      </div>
    </section>
  }
}

const styles = StyleSheet.create({
  widevineInfo__div: {
    marginBottom: globalStyles.spacing.dialogInsideMargin
  },
  cursor: {
    cursor: 'pointer'
  }
})

module.exports = WidevineInfo
