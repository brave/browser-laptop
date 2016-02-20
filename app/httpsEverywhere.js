/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */
'use strict'

const urlParse = require('url').parse
const DataFile = require('./dataFile')
const Filtering = require('./filtering')
const electron = require('electron')
const session = electron.session

let httpsEverywhereInitialized = false
// Map of ruleset ID to ruleset content
var db = null
// Map of hostname pattern to ruleset ID
var targets = null
// Counter for detecting infinite redirect loops
var redirectCounter = {}
// Blacklist of canonicalized hosts (host+pathname) that lead to redirect loops
var redirectBlacklist = []

module.exports.resourceName = 'httpsEverywhere'

function loadRulesets (data) {
  var parsedData = JSON.parse(data)
  targets = parsedData.targets
  db = parsedData.rulesetStrings
}

/**
 * Rewrites a URL from HTTP to HTTPS if an HTTPS Everywhere rule is applicable.
 * @param {string} url The URL to rewrite
 * @param {function(string=)} cb the onBeforeRequest listener callback to call
 *   with the rewritten URL (undefined if no rewrite occurred)
 */
function getRewrittenUrl (url, cb) {
  // Get the set of ruleset IDs applicable to this host
  var rulesetIds = getHostnamePatterns(url).reduce((prev, hostname) => {
    var target = targets[hostname]
    return target ? prev.concat(target) : prev
  }, [])

  for (var i = 0; i < rulesetIds.length; ++i) {
    // Try applying each ruleset
    let result = applyRuleset(url, db[rulesetIds[i]])
    if (result) {
      // Redirect to the first rewritten URL
      cb(result)
      return
    }
  }
  cb()
}

/**
 * Gets applicable hostname patterns for a given URL. Ex: for x.y.google.com,
 * rulesets matching x.y.google.com, *.y.google.com, and *.google.com are
 * applicable.
 * @param {string} url The url to get hostname patterns for
 * @return {Array.<string>}
 */
function getHostnamePatterns (url) {
  var host = urlParse(url).hostname
  var segmented = host.split('.')
  var hostPatterns = [host]

  // Since targets can contain a single wildcard, replace each label of the
  // hostname with "*" in turn.
  segmented.forEach((label, index) => {
    // copy the original array
    var tmp = segmented.slice()
    if (label.length === 0) {
      console.log('got host with 0-length label', url)
    } else {
      tmp[index] = '*'
      hostPatterns.push(tmp.join('*'))
    }
  })
  // Now eat away from the left with * so that for x.y.z.google.com we also
  // check *.z.google.com and *.google.com.
  for (var i = 2; i <= segmented.length - 2; ++i) {
    hostPatterns.push('*.' + segmented.slice(i, segmented.length).join('.'))
  }
  return hostPatterns
}

/**
 * Applies a applicable rewrite ruleset to a URL
 * @param {string} url original URL
 * @param {Object} applicableRule applicable ruleset
 * @return {string?} the rewritten URL, or null if no rewrite applied
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
        return url
      }
    }
  }
  // Find the first rule that triggers a substitution
  for (i = 0; i < rule.length; ++i) {
    fromPattern = new RegExp(rule[i].$.from)
    newUrl = url.replace(fromPattern, rule[i].$.to)
    if (newUrl !== url) {
      return newUrl
    }
  }
  return null
}

/**
 * Called when the HTTPS EVerywhere data file
 * is downloaded and ready.
 */
function startHttpsEverywhere () {
  httpsEverywhereInitialized = true
}

function onBeforeHTTPRequest (details, cb) {
  if (!httpsEverywhereInitialized ||
      !Filtering.isResourceEnabled(module.exports.resourceName)) {
    cb({})
    return
  }

  if (redirectBlacklist.includes(canonicalizeUrl(details.url))) {
    // Don't try to rewrite this request, it'll probably just redirect again.
    console.log('https everywhere ignoring blacklisted url', details.url)
    cb({})
  } else {
    getRewrittenUrl(details.url, (url) => {
      if (url) {
        cb({ redirectURL: url })
      } else {
        cb({})
      }
    })
  }
}

function onBeforeRedirect (details) {
  if (!httpsEverywhereInitialized ||
      !Filtering.isResourceEnabled(module.exports.resourceName)) {
    return
  }

  var canonicalUrl = canonicalizeUrl(details.url)
  if (details.id in redirectCounter) {
    canonicalUrl = canonicalizeUrl(details.url)
    redirectCounter[details.id] += 1
    if (redirectCounter[details.id] > 5 && !redirectBlacklist.includes(canonicalUrl)) {
      // Blacklist this host
      console.log('blacklisting url', canonicalUrl)
      redirectBlacklist.push(canonicalUrl)
    }
  } else {
    redirectCounter[details.id] = 1
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
 * Register for notifications for webRequest notifications for
 * a particular session.
 * @param {object} The session to add webRequest filtering on
 */
function registerForSession (session) {
  if (!session) {
    console.log('could not get window session')
    return null
  }
  var wr = session.webRequest
  if (!wr) {
    console.log('could not get session webRequest')
    return null
  }
  // Handle HTTPS upgrades
  wr.onBeforeRequest({
    urls: ['http://*/*']
  }, onBeforeHTTPRequest)
  // Try to catch infinite redirect loops on URLs we've redirected to HTTPS
  wr.onBeforeRedirect({
    urls: ['https://*/*']
  }, onBeforeRedirect)
}

/**
 * Loads HTTPS Everywhere
 */
module.exports.init = () => {
  DataFile.init(module.exports.resourceName, startHttpsEverywhere, loadRulesets)
  registerForSession(session.fromPartition(''))
  registerForSession(session.fromPartition('private-1'))
  registerForSession(session.fromPartition('main-1'))
}

