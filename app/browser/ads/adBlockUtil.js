/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const {siteHacks} = require('../../../js/data/siteHacks')
const {FilterOptions} = require('ad-block')
const isThirdPartyHost = require('../isThirdPartyHost')

const whitelistHosts = ['disqus.com', 'a.disquscdn.com']

/**
 * Maps filtering request resourceTypes to ones that our adBlock library understands
 */
const mapFilterType = {
  mainFrame: FilterOptions.document,
  subFrame: FilterOptions.subdocument,
  stylesheet: FilterOptions.stylesheet,
  script: FilterOptions.script,
  image: FilterOptions.image,
  object: FilterOptions.object,
  xhr: FilterOptions.xmlHttpRequest,
  other: FilterOptions.other
}

/**
 * @param resourceType {string} The resource type from the web request API
 * @param firstPartyUrl {Url} The parsed URL of the main frame URL loading the url
 * @param url {Url} The parsed URL of the resource for consideration
 * @param shouldCheckMainFrame {boolean} Whether check main frame
 */
const shouldDoAdBlockCheck = (resourceType, firstPartyUrl, url, shouldCheckMainFrame) =>
  firstPartyUrl.protocol &&
  // By default first party hosts are allowed, but enable the check if a flag is specified in siteHacks
  (
    shouldCheckMainFrame ||
    (
      (
        resourceType !== 'mainFrame' &&
        isThirdPartyHost(firstPartyUrl.hostname || '', url.hostname)
      ) ||
      (
        siteHacks[firstPartyUrl.hostname] &&
        siteHacks[firstPartyUrl.hostname].allowFirstPartyAdblockChecks
      )
    )
  ) &&
  // Only check http and https for now
  firstPartyUrl.protocol.startsWith('http') &&
  // Only do adblock if the host isn't in the whitelist
  !whitelistHosts.find((whitelistHost) => whitelistHost === url.hostname || url.hostname.endsWith('.' + whitelistHost)) &&
  // Make sure there's a valid resource type before trying to use adblock
  mapFilterType[resourceType] !== undefined

module.exports = {
  mapFilterType,
  shouldDoAdBlockCheck
}
