/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const tldjs = require('tldjs')
const ImmutableComponent = require('../../../js/components/immutableComponent')
const appActions = require('../../../js/actions/appActions')
const settings = require('../../../js/constants/settings')
const getSetting = require('../../../js/settings').getSetting
const cx = require('../../../js/lib/classSet')
const Button = require('../../../js/components/button')

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

  get enabledPublisher () {
    // If we can't get ledgerPayments, then it's likely that we are
    // on a clean session. Let's then check for publisher's synopsis
    return this.hostSettings
      ? this.hostSettings.get('ledgerPayments') !== false
      : this.validPublisherSynopsis
  }

  get visiblePublisher () {
    // ledgerPaymentsShown is undefined by default until user decide to permanently hide the publisher
    // so for icon to be shown it can be everything but false
    const ledgerPaymentsShown = this.hostSettings && this.hostSettings.get('ledgerPaymentsShown')
    return ledgerPaymentsShown === 'undefined' || ledgerPaymentsShown !== false
  }

  get shouldShowAddPublisherButton () {
    if ((!!this.hostSettings || !!this.validPublisherSynopsis) && this.visiblePublisher) {
      // Only show publisher icon if autoSuggest option is OFF
      return !getSetting(settings.AUTO_SUGGEST_SITES)
    }
    return false
  }

  onAuthorizePublisher () {
    // if payments disabled, enable it
    if (!getSetting(settings.AUTO_SUGGEST_SITES)) {
      appActions.changeSetting(settings.PAYMENTS_ENABLED, true)
    }

    this.enabledPublisher
      ? appActions.changeSiteSetting(this.hostPattern, 'ledgerPayments', false)
      : appActions.changeSiteSetting(this.hostPattern, 'ledgerPayments', true)
  }

  render () {
    return this.shouldShowAddPublisherButton
      ? <span className={cx({
        addPublisherButtonContainer: true,
        authorizedPublisher: this.enabledPublisher
      })}>
        <Button iconClass='fa-btc publisherToggleBtn'
          l10nId='enablePublisher'
          onClick={this.onAuthorizePublisher}
        />
      </span>
      : null
  }
}

PublisherToggle.propTypes = {
  url: React.PropTypes.string,
  hostSettings: React.PropTypes.string,
  synopsis: React.PropTypes.string
}

module.exports = PublisherToggle
