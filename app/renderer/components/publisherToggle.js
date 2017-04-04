/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const ImmutableComponent = require('../../../js/components/immutableComponent')
const appActions = require('../../../js/actions/appActions')
const settings = require('../../../js/constants/settings')
const getSetting = require('../../../js/settings').getSetting
const {StyleSheet, css} = require('aphrodite')
const globalStyles = require('./styles/global')
const commonStyles = require('./styles/commonStyles')
const {getHostPattern, isHttpOrHttps} = require('../../../js/lib/urlutil')
const {getBaseUrl} = require('../../../js/lib/appUrlUtil')

const noFundVerifiedPublisherImage = require('../../extensions/brave/img/urlbar/browser_URL_fund_no_verified.svg')
const fundVerifiedPublisherImage = require('../../extensions/brave/img/urlbar/browser_URL_fund_yes_verified.svg')
const noFundUnverifiedPublisherImage = require('../../extensions/brave/img/urlbar/browser_URL_fund_no.svg')
const fundUnverifiedPublisherImage = require('../../extensions/brave/img/urlbar/browser_URL_fund_yes.svg')

class PublisherToggle extends ImmutableComponent {
  constructor () {
    super()
    this.onAuthorizePublisher = this.onAuthorizePublisher.bind(this)
  }

  get locationId () {
    return getBaseUrl(this.props.location)
  }

  get publisherId () {
    return this.props.locationInfo && this.props.locationInfo.getIn([this.locationId, 'publisher'])
  }

  get hostSettings () {
    const hostPattern = getHostPattern(this.publisherId)
    return this.props.siteSettings.get(hostPattern)
  }

  get validPublisherSynopsis () {
    // If session is clear then siteSettings is undefined and icon
    // will never be shown, but synopsis may not be empty.
    // In such cases let's check if synopsis matches current publisherId
    return !!this.props.synopsis.map(entry => entry.get('site')).includes(this.publisherId)
  }

  get enabledForPaymentsPublisher () {
    // All publishers will be enabled by default if AUTO_SUGGEST is ON,
    // excluding publishers defined on ledger's exclusion list
    const excluded = this.props.locationInfo && this.props.locationInfo.getIn([this.locationId, 'exclude'])
    const autoSuggestSites = getSetting(settings.AUTO_SUGGEST_SITES)

      // hostSettings is undefined until user hit addFunds button.
      // For such cases check autoSuggestSites for eligibility.
    return this.hostSettings
      ? this.hostSettings.get('ledgerPayments') !== false
      : this.validPublisherSynopsis || (autoSuggestSites && !excluded)
  }

  get verifiedPublisher () {
    return this.props.locationInfo && this.props.locationInfo.getIn([this.locationId, 'verified'])
  }

  get visiblePublisher () {
    // ledgerPaymentsShown is undefined by default until
    // user decide to permanently hide the publisher,
    // so for icon to be shown it can be everything but false
    const ledgerPaymentsShown = this.hostSettings && this.hostSettings.get('ledgerPaymentsShown')
    return typeof ledgerPaymentsShown === 'boolean'
      ? ledgerPaymentsShown
      : true
  }

  get shouldShowAddPublisherButton () {
    return getSetting(settings.PAYMENTS_ENABLED) &&
      isHttpOrHttps(this.props.location) &&
      this.visiblePublisher
  }

  get l10nString () {
    let l10nData = 'disabledPublisher'
    if (this.verifiedPublisher && !this.enabledForPaymentsPublisher) {
      l10nData = 'verifiedPublisher'
    } else if (this.enabledForPaymentsPublisher) {
      l10nData = 'enabledPublisher'
    }
    return l10nData
  }

  onAuthorizePublisher () {
    const hostPattern = getHostPattern(this.publisherId)
    appActions.changeSiteSetting(hostPattern, 'ledgerPayments', !this.enabledForPaymentsPublisher)
  }

  render () {
    if (!this.props.locationInfo) {
      return null
    }
    return this.shouldShowAddPublisherButton
      ? <span
        data-test-id='publisherButton'
        data-test-authorized={this.enabledForPaymentsPublisher}
        data-test-verified={this.verifiedPublisher}
        className={css(styles.addPublisherButtonContainer)}>
        <button
          className={
          css(
            commonStyles.browserButton,
            !this.enabledForPaymentsPublisher && this.verifiedPublisher && styles.noFundVerified,
            this.enabledForPaymentsPublisher && this.verifiedPublisher && styles.fundVerified,
            !this.enabledForPaymentsPublisher && !this.verifiedPublisher && styles.noFundUnverified,
            this.enabledForPaymentsPublisher && !this.verifiedPublisher && styles.fundUnverified
            )
          }
          data-l10n-id={this.l10nString}
          onClick={this.onAuthorizePublisher}
        />
      </span>
      : null
  }
}

const styles = StyleSheet.create({
  addPublisherButtonContainer: {
    boxSizing: 'border-box',
    display: 'flex',
    alignItems: 'center',
    height: globalStyles.spacing.buttonHeight,
    width: globalStyles.spacing.buttonWidth,
    minHeight: globalStyles.spacing.buttonHeight,
    minWidth: globalStyles.spacing.buttonWidth,
    WebkitAppRegion: 'no-drag',
    borderWidth: '1px 1px 1px 0px',
    borderStyle: 'solid',
    borderColor: globalStyles.color.urlBarOutline,
    borderRadius: '0 4px 4px 0',
    borderTopLeftRadius: '0',
    borderBottomLeftRadius: '0'
  },

  noFundVerified: {
    border: 'none',
    backgroundImage: `url(${noFundVerifiedPublisherImage})`,
    backgroundSize: '18px',
    marginLeft: '2px'
  },

  fundVerified: {
    border: 'none',
    backgroundImage: `url(${fundVerifiedPublisherImage})`,
    backgroundSize: '18px',
    marginLeft: '2px'
  },

  noFundUnverified: {
    border: 'none',
    backgroundImage: `url(${noFundUnverifiedPublisherImage})`,
    backgroundSize: '18px'
  },

  fundUnverified: {
    border: 'none',
    backgroundImage: `url(${fundUnverifiedPublisherImage})`,
    backgroundSize: '18px'
  }
})

module.exports = PublisherToggle
