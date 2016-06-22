/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const urlParse = require('url').parse
const base64Encode = require('../lib/base64').encode

// Polyfill similar to this: https://github.com/gorhill/uBlock/blob/de1ed89f62bf041416d2a721ec00741667bf3fa8/assets/ublock/resources.txt#L385
const googleTagManagerRedirect = 'data:application/javascript;base64,' + base64Encode(`(function() { var noopfn = function() { ; }; window.ga = window.ga || noopfn; })();`)
// Polyfill similar to this: https://github.com/gorhill/uBlock/blob/de1ed89f62bf041416d2a721ec00741667bf3fa8/assets/ublock/resources.txt#L257
const googleTagServicesRedirect = 'data:application/javascript;base64,' + base64Encode(`(function() { var p; var noopfn = function() { }; var noopthisfn = function() { return this; }; var noopnullfn = function() { return null; }; var nooparrayfn = function() { return []; }; var noopstrfn = function() { return ''; }; var companionAdsService = { addEventListener: noopthisfn, enableSyncLoading: noopfn, setRefreshUnfilledSlots: noopfn }; var contentService = { addEventListener: noopthisfn, setContent: noopfn }; var PassbackSlot = function() { }; p = PassbackSlot.prototype; p.display = noopfn; p.get = noopnullfn; p.set = noopthisfn; p.setClickUrl = noopthisfn; p.setTagForChildDirectedTreatment = noopthisfn; p.setTargeting = noopthisfn; p.updateTargetingFromMap = noopthisfn; var pubAdsService = { addEventListener: noopthisfn, clear: noopfn, clearCategoryExclusions: noopthisfn, clearTagForChildDirectedTreatment: noopthisfn, clearTargeting: noopthisfn, collapseEmptyDivs: noopfn, defineOutOfPagePassback: function() { return new PassbackSlot(); }, definePassback: function() { return new PassbackSlot(); }, disableInitialLoad: noopfn, display: noopfn, enableAsyncRendering: noopfn, enableSingleRequest: noopfn, enableSyncRendering: noopfn, enableVideoAds: noopfn, get: noopnullfn, getAttributeKeys: nooparrayfn, refresh: noopfn, set: noopthisfn, setCategoryExclusion: noopthisfn, setCentering: noopfn, setCookieOptions: noopthisfn, setLocation: noopthisfn, setPublisherProvidedId: noopthisfn, setTagForChildDirectedTreatment: noopthisfn, setTargeting: noopthisfn, setVideoContent: noopthisfn, updateCorrelator: noopfn }; var SizeMappingBuilder = function() { }; p = SizeMappingBuilder.prototype; p.addSize = noopthisfn; p.build = noopnullfn; var Slot = function() { }; p = Slot.prototype; p.addService = noopthisfn; p.clearCategoryExclusions = noopthisfn; p.clearTargeting = noopthisfn; p.defineSizeMapping = noopthisfn; p.get = noopnullfn; p.getAdUnitPath = nooparrayfn; p.getAttributeKeys = nooparrayfn; p.getCategoryExclusions = nooparrayfn; p.getDomId = noopstrfn; p.getSlotElementId = noopstrfn; p.getSlotId = noopthisfn; p.getTargeting = nooparrayfn; p.getTargetingKeys = nooparrayfn; p.set = noopthisfn; p.setCategoryExclusion = noopthisfn; p.setClickUrl = noopthisfn; p.setCollapseEmptyDiv = noopthisfn; p.setTargeting = noopthisfn; var gpt = window.googletag || {}; window.googleTag.destroySlots = function () { }; var cmd = gpt.cmd || []; gpt.apiReady = true; gpt.cmd = []; gpt.cmd.push = function(a) { try { a(); } catch (ex) { } return 1; }; gpt.companionAds = function() { return companionAdsService; }; gpt.content = function() { return contentService; }; gpt.defineOutOfPageSlot = function() { return new Slot(); }; gpt.defineSlot = function() { return new Slot(); }; gpt.disablePublisherConsole = noopfn; gpt.display = noopfn; gpt.enableServices = noopfn; gpt.getVersion = noopstrfn; gpt.pubads = function() { return pubAdsService; }; gpt.pubadsReady = true; gpt.sizeMapping = function() { return new SizeMappingBuilder(); }; window.googletag = gpt; while ( cmd.length !== 0 ) { gpt.cmd.push(cmd.shift()); } })();`)

module.exports = {
  'forbes.com': {
    onBeforeSendHeaders: function(details) {
      return {
        customCookie: details.requestHeaders.Cookie + `; forbes_ab=true; welcomeAd=true; adblock_session=Off; dailyWelcomeCookie=true`
      }
    },
  },
  'www.cityam.com': {
    userAgent: 'Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2228.0 Safari/537.36 Googlebot'
  },
  // For links like: https://player.twitch.tv/?channel=iwilldominate
  'player.twitch.tv': {
    allowRunningInsecureContent: true,
    enableForAll: true
  },
  'www.wired.com': {
    // Site hack from
    // https://github.com/gorhill/uBlock/blob/ce2d235e4fd2ade2be101fa7030870044b30fd3c/assets/ublock/resources.txt#L699
    pageLoadEndScript: `(function() {
      var sto = window.setTimeout,
        re = /^function n\(\)/;
      window.setTimeout = function(a, b) {
          if ( b !== 50 || !re.test(a.toString()) ) {
                sto(a, b);
              }
        };
    })();`
  },
  'www.extremetech.com': {
    pageLoadStartScript: `(function() {
      var sto = window.setTimeout;
      window.setTimeout = function(a, b) {
          if ( b !== 250 ) {
                sto(a, b);
              }
        };
    })();`
  },
  'www.twitch.tv': {
    allowRunningInsecureContent: true
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
  }
}
