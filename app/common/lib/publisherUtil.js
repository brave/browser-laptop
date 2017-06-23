/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const Immutable = require('immutable')

// Constants
const settings = require('../../../js/constants/settings')
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
    const locationInfo = state.get('locationInfo', Immutable.Map())
    const publisherId = locationInfo.getIn([locationId, 'publisher'])

    const synopsis = state.getIn(['publisherInfo', 'synopsis'], Immutable.Map())
    const hostSettings = siteSettingsState.getSettingsByHost(state, publisherId)

    // All publishers will be enabled by default if AUTO_SUGGEST is ON,
    // excluding publishers defined on ledger's exclusion list
    const excluded = locationInfo.getIn([locationId, 'exclude'])
    const autoSuggestSites = getSetting(settings.AUTO_SUGGEST_SITES)

    // If session is clear then siteSettings is undefined and icon
    // will never be shown, but synopsis may not be empty.
    // In such cases let's check if synopsis matches current publisherId
    const isValidPublisherSynopsis = !!synopsis.map(entry => entry.get('site'))
      .includes(publisherId)

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
