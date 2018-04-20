/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

// Util
const frameStateUtil = require('../../../js/state/frameStateUtil')
const urlParse = require('../urlParse')
const siteSettings = require('../../../js/state/siteSettings')

// State
const siteSettingsState = require('./siteSettingsState')

// Constants
const appConfig = require('../../../js/constants/appConfig')

function braveShieldsEnabled (frame) {
  const lastCommittedURL = frameStateUtil.getLastCommittedURL(frame)
  if (!lastCommittedURL) {
    return false
  }

  const parsedUrl = urlParse(lastCommittedURL)
  return !(parsedUrl.protocol !== 'https:' && parsedUrl.protocol !== 'http:')
}

function areBraveShieldsUp (state, frame) {
  const lastCommittedURL = frameStateUtil.getLastCommittedURL(frame)
  const allSiteSettings = siteSettingsState.getAllSiteSettings(state, frame.get('isPrivate'))
  const activeSiteSettings = siteSettings.getSiteSettingsForURL(allSiteSettings, lastCommittedURL)
  const braverySettings = siteSettings.activeSettings(activeSiteSettings, state, appConfig)
  return braverySettings.shieldsUp
}

module.exports = {
  braveShieldsEnabled,
  areBraveShieldsUp
}
