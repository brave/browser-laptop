/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const urlParse = require('url').parse
const base64Encode = require('../lib/base64').encode

// Polyfill similar to this: https://github.com/gorhill/uBlock/blob/de1ed89f62bf041416d2a721ec00741667bf3fa8/assets/ublock/resources.txt#L385
const googleTagManagerRedirect = 'data:application/javascript;base64,' + base64Encode(`(function() { var noopfn = function() { ; }; window.ga = window.ga || noopfn; })();`)
// Polyfill similar to this: https://github.com/gorhill/uBlock/blob/de1ed89f62bf041416d2a721ec00741667bf3fa8/assets/ublock/resources.txt#L257
const googleTagServicesRedirect = 'data:application/javascript;base64,' + base64Encode(`(function() { var p; var noopfn = function() { }; var noopthisfn = function() { return this; }; var noopnullfn = function() { return null; }; var nooparrayfn = function() { return []; }; var noopstrfn = function() { return ''; }; var companionAdsService = { addEventListener: noopthisfn, enableSyncLoading: noopfn, setRefreshUnfilledSlots: noopfn }; var contentService = { addEventListener: noopthisfn, setContent: noopfn }; var PassbackSlot = function() { }; p = PassbackSlot.prototype; p.display = noopfn; p.get = noopnullfn; p.set = noopthisfn; p.setClickUrl = noopthisfn; p.setTagForChildDirectedTreatment = noopthisfn; p.setTargeting = noopthisfn; p.updateTargetingFromMap = noopthisfn; var pubAdsService = { addEventListener: noopthisfn, clear: noopfn, clearCategoryExclusions: noopthisfn, clearTagForChildDirectedTreatment: noopthisfn, clearTargeting: noopthisfn, collapseEmptyDivs: noopfn, defineOutOfPagePassback: function() { return new PassbackSlot(); }, definePassback: function() { return new PassbackSlot(); }, disableInitialLoad: noopfn, display: noopfn, enableAsyncRendering: noopfn, enableSingleRequest: noopfn, enableSyncRendering: noopfn, enableVideoAds: noopfn, get: noopnullfn, getAttributeKeys: nooparrayfn, refresh: noopfn, set: noopthisfn, setCategoryExclusion: noopthisfn, setCentering: noopfn, setCookieOptions: noopthisfn, setLocation: noopthisfn, setPublisherProvidedId: noopthisfn, setTagForChildDirectedTreatment: noopthisfn, setTargeting: noopthisfn, setVideoContent: noopthisfn, updateCorrelator: noopfn }; var SizeMappingBuilder = function() { }; p = SizeMappingBuilder.prototype; p.addSize = noopthisfn; p.build = noopnullfn; var Slot = function() { }; p = Slot.prototype; p.addService = noopthisfn; p.clearCategoryExclusions = noopthisfn; p.clearTargeting = noopthisfn; p.defineSizeMapping = noopthisfn; p.get = noopnullfn; p.getAdUnitPath = nooparrayfn; p.getAttributeKeys = nooparrayfn; p.getCategoryExclusions = nooparrayfn; p.getDomId = noopstrfn; p.getSlotElementId = noopstrfn; p.getSlotId = noopthisfn; p.getTargeting = nooparrayfn; p.getTargetingKeys = nooparrayfn; p.set = noopthisfn; p.setCategoryExclusion = noopthisfn; p.setClickUrl = noopthisfn; p.setCollapseEmptyDiv = noopthisfn; p.setTargeting = noopthisfn; var gpt = window.googletag || {}; window.googletag.destroySlots = function () { }; var cmd = gpt.cmd || []; gpt.apiReady = true; gpt.cmd = []; gpt.cmd.push = function(a) { try { a(); } catch (ex) { } return 1; }; gpt.companionAds = function() { return companionAdsService; }; gpt.content = function() { return contentService; }; gpt.defineOutOfPageSlot = function() { return new Slot(); }; gpt.defineSlot = function() { return new Slot(); }; gpt.disablePublisherConsole = noopfn; gpt.display = noopfn; gpt.enableServices = noopfn; gpt.getVersion = noopstrfn; gpt.pubads = function() { return pubAdsService; }; gpt.pubadsReady = true; gpt.sizeMapping = function() { return new SizeMappingBuilder(); }; window.googletag = gpt; while ( cmd.length !== 0 ) { gpt.cmd.push(cmd.shift()); } })();`)

const emptyDataURI = {
  enableForAdblock: true,
  enableForTrackingProtection: true,
  onBeforeRequest: function(details) {
    return {
      redirectURL: 'data:application/javascript;base64,MA=='
    }
  }
}

/**
 * Holds an array of [Primary URL, subresource URL] to allow 3rd party cookies.
 * Subresource URL can be '*' or undefined to indicate all.
 */
module.exports.cookieExceptions = [
  ['https://inbox.google.com', 'https://hangouts.google.com'],
  ['https://mail.google.com', 'https://hangouts.google.com']
]

/**
 * Holds an array of [Primary URL, subresource URL] to allow 3rd party localstorage.
 * Subresource URL can be '*' or undefined to indicate all.
 */
module.exports.localStorageExceptions = [
  ['https://inbox.google.com', 'https://hangouts.google.com'],
  ['https://mail.google.com', 'https://hangouts.google.com']
]

module.exports.siteHacks = {
  'sp1.nypost.com': emptyDataURI,
  'sp.nasdaq.com': emptyDataURI,
  'forbes.com': {
    onBeforeSendHeaders: function(details) {
      return {
        customCookie: details.requestHeaders.Cookie + `; forbes_ab=true; welcomeAd=true; adblock_session=Off; dailyWelcomeCookie=true`
      }
    },
  },
  'adobe.com': {
    onBeforeSendHeaders: function(details) {
      let userAgent = details.requestHeaders['User-Agent']
      userAgent = [userAgent.split('Chrome')[0], 'Brave Chrome', userAgent.split('Chrome')[1]].join('')
      details.requestHeaders['User-Agent'] = userAgent
      return {
        requestHeaders: details.requestHeaders
      }
    }
  },
  'cityam.com': {
    onBeforeSendHeaders: function(details) {
      details.requestHeaders['User-Agent'] = 'Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2228.0 Safari/537.36 Googlebot'
      return {
        requestHeaders: details.requestHeaders
      }
    }
  },
  // For links like: https://player.twitch.tv/?channel=iwilldominate
  'player.twitch.tv': {
    enableForAll: true
  },
  'imasdk.googleapis.com': {
    enableForAdblock: true,
    onBeforeRequest: function (details) {
      const hostname = urlParse(details.firstPartyUrl).hostname
      if (hostname && hostname.endsWith('.y8.com') &&
          urlParse(details.url).pathname === '/js/sdkloader/outstream.js') {
        return {
          cancel: false
        }
      }
    }
  },
  'www.googletagmanager.com': {
    enableForAdblock: true,
    enableForTrackingProtection: true,
    onBeforeRequest: function(details) {
      if (urlParse(details.url).pathname !== '/gtm.js') {
        return
      }
      return {
        redirectURL: googleTagManagerRedirect
      }
    }
  },
  'www.googletagservices.com': {
    enableForAdblock: true,
    enableForTrackingProtection: true,
    onBeforeRequest: function(details) {
      if (urlParse(details.url).pathname !== '/tag/js/gpt.js') {
        return
      }
      return {
        redirectURL: googleTagServicesRedirect
       }
    }
  },
  'twitter.com': {
    onBeforeSendHeaders: function(details) {
      if (details.requestHeaders.Referer &&
        details.requestHeaders.Referer.startsWith('https://twitter.com/') &&
        details.url.startsWith('https://mobile.twitter.com/')) {
        return {
          cancel: true
        }
      }
    }
  },
  'play.spotify.com': {
    enableFlashCTP: true
  },
  'www.espn.com': {
    enableFlashCTP: true
  },
  'player.siriusxm.com': {
    enableFlashCTP: true,
    redirectURL: 'https://player.siriusxm.com'
  }
}
