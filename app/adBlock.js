/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'

const URL = require('url')
const ABPFilterParserLib = require('abp-filter-parser-cpp')
const ABPFilterParser = ABPFilterParserLib.ABPFilterParser
const FilterOptions = ABPFilterParserLib.FilterOptions
const DataFile = require('./dataFile')
const Filtering = require('./filtering')
module.exports.adBlockResourceName = 'adblock'
module.exports.safeBrowsingResourceName = 'safeBrowsing'

let mapFilterType = {
  mainFrame: FilterOptions.document,
  subFrame: FilterOptions.subdocument,
  stylesheet: FilterOptions.stylesheet,
  script: FilterOptions.script,
  image: FilterOptions.image,
  object: FilterOptions.object,
  xhr: FilterOptions.xmlHttpRequest,
  other: FilterOptions.other
}

const whitelistHosts = ['disqus.com', 'a.disquscdn.com']

const startAdBlocking = (adblock, resourceName, shouldCheckMainFrame) => {
  Filtering.registerBeforeRequestFilteringCB((details) => {
    const firstPartyUrl = URL.parse(Filtering.getMainFrameUrl(details))
    let firstPartyUrlHost = firstPartyUrl.hostname || ''
    const urlHost = URL.parse(details.url).hostname
    const cancel = firstPartyUrl.protocol &&
      (shouldCheckMainFrame || (details.resourceType !== 'mainFrame' &&
                                Filtering.isThirdPartyHost(firstPartyUrlHost, urlHost))) &&
      firstPartyUrl.protocol.startsWith('http') &&
      mapFilterType[details.resourceType] !== undefined &&
      !whitelistHosts.includes(urlHost) &&
      !urlHost.endsWith('.disqus.com') &&
      adblock.matches(details.url, mapFilterType[details.resourceType], firstPartyUrl.host)

    return {
      cancel,
      resourceName
    }
  })
}

module.exports.initInstance = (resourceName, shouldCheckMainFrame) => {
  let adblock = new ABPFilterParser()
  DataFile.init(resourceName, startAdBlocking.bind(null, adblock, resourceName, shouldCheckMainFrame),
                (data) => adblock.deserialize(data))
  return module.exports
}

module.exports.init = () => module.exports
    .initInstance(module.exports.adBlockResourceName, false)
    .initInstance(module.exports.safeBrowsingResourceName, true)
