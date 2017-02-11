/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const tldjs = require('tldjs')
const ImmutableComponent = require('../../../js/components/immutableComponent')
const appActions = require('../../../js/actions/appActions')
const settings = require('../../../js/constants/settings')
const getSetting = require('../../../js/settings').getSetting
const {StyleSheet, css} = require('aphrodite')
const globalStyles = require('./styles/global')
const commonStyles = require('./styles/commonStyles')

const noFundVerifiedPublisherImage = require('../../extensions/brave/img/urlbar/browser_URL_fund_no_verified.svg')
const fundVerifiedPublisherImage = require('../../extensions/brave/img/urlbar/browser_URL_fund_yes_verified.svg')
const noFundUnverifiedPublisherImage = require('../../extensions/brave/img/urlbar/browser_URL_fund_no.svg')
const fundUnverifiedPublisherImage = require('../../extensions/brave/img/urlbar/browser_URL_fund_yes.svg')

class PublisherToggle extends ImmutableComponent {
  constructor () {
    super()
    this.onAuthorizePublisher = this.onAuthorizePublisher.bind(this)
  }

  get domain () {
    return tldjs.getDomain(this.props.url)
  }

  get hostPattern () {
    return `https?://${this.domain}`
  }

  get hostSettings () {
    // hostPattern defines it's own identifier for authorized publishers
    // sites that do not match criteria would populate siteSettings
    // with their default protocol, not hostPattern
    return this.props.hostSettings.get(this.hostPattern)
  }

  get validPublisherSynopsis () {
    // If session is clear then siteSettings is undefined and icon will never be shown,
    // but synopsis may not be empty. In such cases let's check if synopsis matches current domain
    return this.props.synopsis.map(entry => entry.get('site')).includes(this.domain)
  }

  get authorizedPublisher () {
    // If we can't get ledgerPayments, then it's likely that we are
    // on a clean session. Let's then check for publisher's synopsis
    return this.hostSettings
      ? this.hostSettings.get('ledgerPayments') !== false
      : this.validPublisherSynopsis
  }

  get verifiedPublisher () {
    let verifiedPublisher
    this.props.synopsis.map(publisher => {
      if (publisher.get('site') === this.domain && publisher.get('verified') === true) {
        verifiedPublisher = !!publisher
        return false
      }
      return true
    })
    return verifiedPublisher
  }

  get visiblePublisher () {
    // ledgerPaymentsShown is undefined by default until user decide to permanently hide the publisher
    // so for icon to be shown it can be everything but false
    const ledgerPaymentsShown = this.hostSettings && this.hostSettings.get('ledgerPaymentsShown')
    return ledgerPaymentsShown !== false
  }

  get shouldShowAddPublisherButton () {
    if ((!!this.hostSettings || !!this.validPublisherSynopsis) && this.visiblePublisher) {
      // Only show publisher icon if ledger is enabled
      return getSetting(settings.PAYMENTS_ENABLED)
    }
    return false
  }

  get l10nString () {
    if (this.verifiedPublisher && !this.authorizedPublisher) {
      return 'verifiedPublisher'
    } else if (this.authorizedPublisher) {
      return 'enabledPublisher'
    }
    return 'disabledPublisher'
  }

  onAuthorizePublisher () {
    this.authorizedPublisher
      ? appActions.changeSiteSetting(this.hostPattern, 'ledgerPayments', false)
      : appActions.changeSiteSetting(this.hostPattern, 'ledgerPayments', true)
  }

  render () {
    return this.shouldShowAddPublisherButton
      ? <span
        data-test-id='publisherButton'
        data-test-authorized={this.authorizedPublisher}
        data-test-verified={this.verifiedPublisher}
        className={css(styles.addPublisherButtonContainer)}>
        <button
          className={
          css(
            commonStyles.browserButton,
            !this.authorizedPublisher && this.verifiedPublisher && styles.noFundVerified,
            this.authorizedPublisher && this.verifiedPublisher && styles.fundVerified,
            !this.authorizedPublisher && !this.verifiedPublisher && styles.noFundUnverified,
            this.authorizedPublisher && !this.verifiedPublisher && styles.fundUnverified
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
    borderColor: '#CBCBCB',
    borderRadius: '0 4px 4px 0',
    borderTopLeftRadius: '0',
    borderBottomLeftRadius: '0',
    borderBottomColor: 'rgba(0, 0, 0, 0.1)'
  },

  noFundVerified: {
    backgroundImage: `url(${noFundVerifiedPublisherImage})`,
    backgroundSize: '18px',
    marginLeft: '2px'
  },

  fundVerified: {
    backgroundImage: `url(${fundVerifiedPublisherImage})`,
    backgroundSize: '18px',
    marginLeft: '2px'
  },

  noFundUnverified: {
    backgroundImage: `url(${noFundUnverifiedPublisherImage})`,
    backgroundSize: '18px'
  },

  fundUnverified: {
    backgroundImage: `url(${fundUnverifiedPublisherImage})`,
    backgroundSize: '18px'
  }
})

module.exports = PublisherToggle
