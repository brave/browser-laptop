/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const {getBraveExtUrl} = require('../lib/appUrlUtil')
const iconPath = getBraveExtUrl('img/newtab/defaultTopSitesIcon')

/**
 * Let lastAccessedTime be the first-time user see the new tab page
 */
const now = Date.now()

module.exports.pinnedTopSites = [
    {
      "count": 1,
      "favicon": `${iconPath}/twitter.png`,
      "lastAccessedTime": now,
      "location": "https://twitter.com/brave",
      "partitionNumber": 0,
      "tags": [],
      "themeColor": "rgb(255, 255, 255)",
      "title": "Brave Software (@brave) | Twitter"
  }
]

module.exports.topSites = [
  {
      "count": 1,
      "favicon": `${iconPath}/twitter.png`,
      "lastAccessedTime": now,
      "location": "https://twitter.com/brave",
      "partitionNumber": 0,
      "tags": [],
      "themeColor": "rgb(255, 255, 255)",
      "title": "Brave Software (@brave) | Twitter"
  }, {
      "count": 1,
      "favicon": `${iconPath}/facebook.png`,
      "lastAccessedTime": now,
      "location": "https://www.facebook.com/BraveSoftware/",
      "partitionNumber": 0,
      "tags": [],
      "themeColor": "rgb(59, 89, 152)",
      "title": "Brave Software | Facebook"
  }, {
      "count": 1,
      "favicon": `${iconPath}/youtube.png`,
      "lastAccessedTime": now,
      "location": "https://www.youtube.com/bravesoftware",
      "partitionNumber": 0,
      "tags": [],
      "themeColor": "#E62117",
      "title": "Brave Browser - YouTube"
  }, {
      "count": 1,
      "favicon": `${iconPath}/brave.ico`,
      "lastAccessedTime": now,
      "location": "https://brave.com/",
      "partitionNumber": 0,
      "tags": [],
      "themeColor": "rgb(255, 255, 255)",
      "title": "Brave Software | Building a Better Web"
  }, {
      "count": 1,
      "favicon": `${iconPath}/appstore.png`,
      "lastAccessedTime": now,
      "location": "https://itunes.apple.com/app/brave-web-browser/id1052879175?mt=8",
      "partitionNumber": 0,
      "tags": [],
      "themeColor": "rgba(255, 255, 255, 1)",
      "title": "Brave Web Browser: Fast with built-in adblock on the App Store"
  }, {
      "count": 1,
      "favicon": `${iconPath}/playstore.png`,
      "lastAccessedTime": now,
      "location": "https://play.google.com/store/apps/details?id=com.brave.browser",
      "partitionNumber": 0,
      "tags": [],
      "themeColor": "rgb(241, 241, 241)",
      "title": "Brave Browser: Fast AdBlock – Apps para Android no Google Play"
  }
]

module.exports.topSiteLocations = module.exports.topSites.map((site) => site.location)
