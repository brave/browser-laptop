/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

// Constants
const settings = require('../../../js/constants/settings')

// Utils
const ledgerUtil = require('./ledgerUtil')
const {getSetting} = require('../../../js/settings')
const {isHttpOrHttps, getUrlFromPDFUrl} = require('../../../js/lib/urlutil')
const {isSourceAboutUrl} = require('../../../js/lib/appUrlUtil')

const publisherUtil = {
  shouldShowAddPublisherButton: () => {
    return getSetting(settings.PAYMENTS_ENABLED)
  },

  shouldEnableAddPublisherButton: (state, location, publisherKey) => {
    return location &&
    !isSourceAboutUrl(location) &&
    getSetting(settings.PAYMENTS_ENABLED) &&
    isHttpOrHttps(getUrlFromPDFUrl(location)) &&
    !ledgerUtil.blockedP(state, publisherKey)
  }
}

module.exports = publisherUtil
