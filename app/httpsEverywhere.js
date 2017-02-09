/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */
'use strict'

const urlParse = require('./common/urlParse')
const DataFile = require('./dataFile')
const Filtering = require('./filtering')
const LRUCache = require('lru-cache')
const getHostnamePatterns = require('../js/lib/urlutil').getHostnamePatterns

// Map of ruleset ID to ruleset content
var db = null
// Map of hostname pattern to ruleset ID
var targets = null
// Counter for detecting infinite redirect loops
var redirectCounter = {}
// Blacklist of canonicalized hosts (host+pathname) that lead to redirect loops
var redirectBlacklist = []
// Canonicalized hosts that have been recently redirected via a 307
var recent307Counter = {}
// Map of url to applyRuleset response
var cachedRewrites = new LRUCache(100)

module.exports.resourceName = 'httpsEverywhere'

function loadRulesets (data) {
  var parsedData = JSON.parse(data)
  targets = parsedData.targets
  db = parsedData.rulesetStrings
  return true
}

/**
 * Rewrites a URL from HTTP to HTTPS if an HTTPS Everywhere rule is applicable.
 * @param {string} url The URL to rewrite
 * @return {{redirectURL: string|undefined, ruleset: string|undefined}}
 */
function getRewrittenUrl (url) {
  // Rulesets not yet loaded
  if (!db || !targets) {
    return undefined
  }

  var cachedRewrite = cachedRewrites.get(url)
  if (cachedRewrite) {
    return cachedRewrite
  } else {
    // Get the set of ruleset IDs applicable to this host
    let rulesetIds = getHostnamePatterns(url).reduce((prev, hostname) => {
      var target = targets[hostname]
      return target ? prev.concat(target) : prev
    }, [])

    for (var i = 0; i < rulesetIds.length; ++i) {
      // Try applying each ruleset
      let result = applyRuleset(url, db[rulesetIds[i]])
      if (result) {
        cachedRewrites.set(url, result)
        // Redirect to the first rewritten URL
        return result
      }
    }
    return undefined
  }
}

/**
 * Applies a applicable rewrite ruleset to a URL
 * @param {string} url original URL
 * @param {Object} applicableRule applicable ruleset
 * @return {{redirectURL: string|undefined, ruleset: string|undefined}|null}
 */
function applyRuleset (url, applicableRule) {
  var i, ruleset, exclusion, rule, fromPattern, newUrl, exclusionPattern
  ruleset = applicableRule.ruleset
  // If the rule is default_off or has a specified platform, ignore it.
  if (ruleset.$.default_off || ruleset.$.platform) {
    return null
  }
  exclusion = ruleset.exclusion
  rule = ruleset.rule
  // If covered by an exclusion, callback the original URL without trying any
  // more rulesets.
  if (exclusion) {
    for (i = 0; i < exclusion.length; ++i) {
      exclusionPattern = new RegExp(exclusion[i].$.pattern)
      if (exclusionPattern.test(url)) {
        return null
      }
    }
  }
  // Find the first rule that triggers a substitution
  for (i = 0; i < rule.length; ++i) {
    fromPattern = new RegExp(rule[i].$.from)
    newUrl = url.replace(fromPattern, rule[i].$.to)
    if (newUrl !== url) {
      return {
        redirectURL: newUrl,
        ruleset: ruleset.$.f
      }
    }
  }
  return null
}

/**
 * Called when the HTTPS Everywhere data file
 * is downloaded and ready.
 */
function startHttpsEverywhere () {
  Filtering.registerBeforeRequestFilteringCB(onBeforeHTTPRequest)
  Filtering.registerBeforeRedirectFilteringCB(onBeforeRedirect)
}

function onBeforeHTTPRequest (details, isPrivate) {
  let result = { resourceName: module.exports.resourceName }

  const mainFrameUrl = Filtering.getMainFrameUrl(details)
  if (!mainFrameUrl || !Filtering.isResourceEnabled(module.exports.resourceName, mainFrameUrl, isPrivate)) {
    return result
  }
  // Ignore URLs that are not HTTP
  if (urlParse(details.url).protocol !== 'http:') {
    return result
  }

  if (redirectBlacklist.includes(canonicalizeUrl(details.url))) {
    // Don't try to rewrite this request, it'll probably just redirect again.
    return result
  } else {
    let rewritten = getRewrittenUrl(details.url)
    if (rewritten) {
      result.redirectURL = rewritten.redirectURL
      result.ruleset = rewritten.ruleset
    }
  }
  return result
}

function onBeforeRedirect (details, isPrivate) {
  const mainFrameUrl = Filtering.getMainFrameUrl(details)
  if (!mainFrameUrl || !Filtering.isResourceEnabled(module.exports.resourceName, mainFrameUrl, isPrivate)) {
    return
  }
  // Ignore URLs that are not HTTP
  if (!['http:', 'https:'].includes(urlParse(details.url).protocol)) {
    return
  }

  var canonicalUrl = canonicalizeUrl(details.url)

  // If the URL is already blacklisted, we are done
  if (redirectBlacklist.includes(canonicalUrl)) {
    return
  }

  // Heuristic part 1: Count same-page redirects using the request ID
  if (details.id in redirectCounter) {
    redirectCounter[details.id] += 1
    if (redirectCounter[details.id] > 5) {
      // Blacklist this host
      console.log('blacklisting url from HTTPS Everywhere', canonicalUrl)
      redirectBlacklist.push(canonicalUrl)
      return
    }
  } else {
    redirectCounter[details.id] = 1
  }

  // Heuristic part 2: Count internal redirects for server-initiated redirects that
  // increase the request ID on every redirect.
  if (details.statusCode === 307 && ['mainFrame', 'subFrame'].includes(details.resourceType)) {
    if (canonicalUrl in recent307Counter) {
      recent307Counter[canonicalUrl] += 1
      if (recent307Counter[canonicalUrl] > 5) {
        // If this URL has been internally-redirected more than 5 times in 200
        // ms, it's probably an HTTPS-Everywhere redirect loop.
        console.log('blacklisting url from HTTPS Everywhere for too many 307s',
                    canonicalUrl)
        redirectBlacklist.push(canonicalUrl)
        return
      }
    } else {
      recent307Counter[canonicalUrl] = 1
      setTimeout(() => {
        recent307Counter[canonicalUrl] = 0
      }, 200)
    }
  }
}

/**
 * Canonicalizes a URL to host + pathname.
 * @param {string} url
 * @return {string}
 */
function canonicalizeUrl (url) {
  var parsed = urlParse(url)
  return [parsed.host, parsed.pathname].join('')
}

/**
 * Loads HTTPS Everywhere
 */
module.exports.init = () => {
  DataFile.init(module.exports.resourceName, startHttpsEverywhere, loadRulesets)
}
