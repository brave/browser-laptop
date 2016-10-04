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
const appConfig = require('../js/constants/appConfig')
const debounce = require('../js/lib/debounce.js')
// Maintains a map between a resource uuid and an adblock instance
const adblockInstances = new Map()
const defaultAdblock = new ABPFilterParser()
const defaultSafeBrowsing = new ABPFilterParser()
const regions = require('abp-filter-parser-cpp/lib/regions')
const getSetting = require('../js/settings').getSetting
const {ADBLOCK_CUSTOM_RULES} = require('../js/constants/settings')
const customFilterRulesUUID = 'CE61F035-9F0A-4999-9A5A-D4E46AF676F7'
const appActions = require('../js/actions/appActions')

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
    const mainFrameUrl = Filtering.getMainFrameUrl(details)
    // this can happen if the tab is closed and the webContents is no longer available
    if (!mainFrameUrl) {
      return {
        resourceName: module.exports.resourceName
      }
    }
    const firstPartyUrl = URL.parse(mainFrameUrl)
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

module.exports.initInstance = (parser, resourceName, shouldCheckMainFrame) => {
  DataFile.init(resourceName, startAdBlocking.bind(null, parser, resourceName, shouldCheckMainFrame),
                (data) => parser.deserialize(data))
  return module.exports
}

module.exports.init = () => {
  module.exports
    .initInstance(defaultAdblock, module.exports.adBlockResourceName, false)
    .initInstance(defaultSafeBrowsing, module.exports.safeBrowsingResourceName, true)
  // Initialize the regional adblock files that are enabled
  regions
    .filter((region) => getSetting(`adblock.${region.uuid}.enabled`))
    .forEach((region) => module.exports.updateAdblockDataFiles(region.uuid, true))
  const customRules = getSetting(ADBLOCK_CUSTOM_RULES)
  if (customRules) {
    module.exports.updateAdblockCustomRules(customRules)
  }
}

const registerAppConfigForResource = (uuid, enabled, version) => {
  appConfig[uuid] = {
    resourceType: module.exports.adBlockResourceName,
    enabled,
    msBetweenRechecks: 1000 * 60 * 60 * 24,
    url: appConfig.adblock.alternateDataFiles.replace('{uuid}', uuid),
    version
  }
}

/**
 * Adds an additional adblock resource to download and initialize
 * @param uuid - The uuid of the adblock datafile resource
 * @param forAdblock - true if main frame URLs should be blocked
 */
module.exports.updateAdblockDataFiles = (uuid, enabled, version = 1, shouldCheckMainFrame = false) => {
  registerAppConfigForResource(uuid, enabled, version)
  if (!adblockInstances.has(uuid)) {
    const parser = new ABPFilterParser()
    adblockInstances.set(uuid, parser)
    module.exports.initInstance(parser, uuid, shouldCheckMainFrame)
  }
}

module.exports.updateAdblockCustomRules = debounce((rules) => {
  let parser
  registerAppConfigForResource(customFilterRulesUUID, true, 1)
  if (!adblockInstances.has(customFilterRulesUUID)) {
    parser = new ABPFilterParser()
  } else {
    parser = adblockInstances.get(customFilterRulesUUID)
  }
  parser.clear()
  parser.parse(rules)

  if (!adblockInstances.has(customFilterRulesUUID)) {
    adblockInstances.set(customFilterRulesUUID, parser)
    // This is just to stay consistent with other adblock resources
    // which use data files.  Tests will check for this to make sure
    // the resource loaded correctly.
    appActions.setResourceETag(customFilterRulesUUID, '.')
    startAdBlocking(parser, customFilterRulesUUID, false)
  }
}, 1500)
