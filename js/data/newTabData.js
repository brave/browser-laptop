/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const {getBraveExtUrl} = require('../lib/appUrlUtil')
const iconPath = getBraveExtUrl('img/newtab/defaultTopSitesIcon')

module.exports.pinnedTopSites = [
  {
    'key': 'https://twitter.com/brave/|0|0',
    'count': 0,
    'favicon': `${iconPath}/twitter.png`,
    'location': 'https://twitter.com/brave/',
    'themeColor': 'rgb(255, 255, 255)',
    'title': 'Brave Software (@brave) | Twitter'
  }
]

module.exports.topSites = [
  {
    'key': 'https://twitter.com/brave/|0|0',
    'count': 0,
    'favicon': `${iconPath}/twitter.png`,
    'location': 'https://twitter.com/brave',
    'themeColor': 'rgb(255, 255, 255)',
    'title': 'Brave Software (@brave) | Twitter'
  },
  {
    'key': 'https://www.facebook.com/BraveSoftware/|0|0',
    'count': 0,
    'favicon': `${iconPath}/facebook.png`,
    'location': 'https://www.facebook.com/BraveSoftware/',
    'themeColor': 'rgb(59, 89, 152)',
    'title': 'Brave Software | Facebook'
  },
  {
    'key': 'https://www.youtube.com/bravesoftware/|0|0',
    'count': 0,
    'favicon': `${iconPath}/youtube.png`,
    'location': 'https://www.youtube.com/bravesoftware/',
    'themeColor': '#E62117',
    'title': 'Brave Browser - YouTube'
  },
  {
    'key': 'https://brave.com/|0|0',
    'count': 0,
    'favicon': `${iconPath}/brave.ico`,
    'location': 'https://brave.com/',
    'themeColor': 'rgb(255, 255, 255)',
    'title': 'Brave Software | Building a Better Web'
  },
  {
    'key': 'https://itunes.apple.com/app/brave-web-browser/id1052879175?mt=8|0|0',
    'count': 0,
    'favicon': `${iconPath}/appstore.png`,
    'location': 'https://itunes.apple.com/app/brave-web-browser/id1052879175?mt=8',
    'themeColor': 'rgba(255, 255, 255, 1)',
    'title': 'Brave Web Browser: Fast with built-in adblock on the App Store'
  },
  {
    'key': 'https://play.google.com/store/apps/details?id=com.brave.browser|0|0',
    'count': 0,
    'favicon': `${iconPath}/playstore.png`,
    'location': 'https://play.google.com/store/apps/details?id=com.brave.browser',
    'themeColor': 'rgb(241, 241, 241)',
    'title': 'Brave Browser: Fast AdBlock – Apps para Android no Google Play'
  }
]
