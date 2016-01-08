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
const resourceName = 'adblock'

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

const startAdBlocking = (wnd) => {
  Filtering.register(wnd, (details) => {
    const firstPartyUrl = URL.parse(details.firstPartyUrl)
    const shouldBlock = firstPartyUrl.protocol &&
      firstPartyUrl.protocol.startsWith('http') &&
      mapFilterType[details.resourceType] !== undefined &&
      adblock.matches(details.url, mapFilterType[details.resourceType], firstPartyUrl.hostname)
    DataFile.debug(details, shouldBlock)
    return shouldBlock
  })
}

module.exports.init = (wnd) => {
  const first = !adblock
  const wnds = []
  adblock = new ABPFilterParser()
  DataFile.init(wnd, resourceName, startAdBlocking, adblock, first, wnds)
}
