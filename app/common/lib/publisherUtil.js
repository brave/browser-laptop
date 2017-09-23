/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

// Constants
const settings = require('../../../js/constants/settings')

// State
const ledgerState = require('../state/ledgerState')
const siteSettingsState = require('../state/siteSettingsState')

// Utils
const {getSetting} = require('../../../js/settings')
const {isHttpOrHttps} = require('../../../js/lib/urlutil')
const {isSourceAboutUrl} = require('../../../js/lib/appUrlUtil')

const visiblePublisher = (state, publisherId) => {
  if (publisherId == null) {
    return true
  }

  // ledgerPaymentsShown is undefined by default until
  // user decide to permanently hide the publisher,
  // so for icon to be shown it can be everything but false
  const hostSettings = siteSettingsState.getSettingsByHost(state, publisherId)
  const ledgerPaymentsShown = hostSettings && hostSettings.get('ledgerPaymentsShown')

  return typeof ledgerPaymentsShown === 'boolean'
    ? ledgerPaymentsShown
    : true
}

const publisherState = {
  enabledForPaymentsPublisher: (state, locationId) => {
    const publisherId = ledgerState.getLocationProp(state, locationId, 'publisher')

    const hostSettings = siteSettingsState.getSettingsByHost(state, publisherId)

    // All publishers will be enabled by default if AUTO_SUGGEST is ON,
    // excluding publishers defined on ledger's exclusion list
    const excluded = ledgerState.getLocationProp(state, locationId, 'exclude')
    const autoSuggestSites = getSetting(settings.PAYMENTS_SITES_AUTO_SUGGEST)

    // If session is clear then siteSettings is undefined and icon
    // will never be shown, but synopsis may not be empty.
    // In such cases let's check if synopsis matches current publisherId
    const isValidPublisherSynopsis = ledgerState.hasPublisher(state, publisherId)

    // hostSettings is undefined until user hit addFunds button.
    // For such cases check autoSuggestSites for eligibility.
    return hostSettings
      ? hostSettings.get('ledgerPayments') !== false
      : isValidPublisherSynopsis || (autoSuggestSites && !excluded)
  },

  shouldShowAddPublisherButton: (state, location, publisherId) => {
    return location &&
      !isSourceAboutUrl(location) &&
      getSetting(settings.PAYMENTS_ENABLED) &&
      isHttpOrHttps(location) &&
      visiblePublisher(state, publisherId)
  }
}

module.exports = publisherState
