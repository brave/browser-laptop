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
module.exports.resourceName = 'adblock'

let adblock
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

const startAdBlocking = () => {
  Filtering.registerFilteringCB(details => {
    const firstPartyUrl = URL.parse(details.firstPartyUrl)
    const urlHost = URL.parse(details.url).host
    const shouldBlock = firstPartyUrl.protocol &&
      firstPartyUrl.protocol.startsWith('http') &&
      mapFilterType[details.resourceType] !== undefined &&
      Filtering.isThirdPartyHost(firstPartyUrl.host, urlHost) &&
      adblock.matches(details.url, mapFilterType[details.resourceType], firstPartyUrl.host)
    DataFile.debug(details, shouldBlock)
    return {
      shouldBlock,
      resourceName: module.exports.resourceName
    }
  })
}

module.exports.init = () => {
  adblock = new ABPFilterParser()
  DataFile.init(module.exports.resourceName, startAdBlocking,
                data => adblock.deserialize(data))
}
