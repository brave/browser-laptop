/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const fs = require('fs')
const sqlite3 = require('sqlite3')
const path = require('path')
const urlParse = require('url').parse

const sqlFile = path.join(__dirname, '../js/data', 'rulesets.sqlite')
const targetsFile = path.join(__dirname, '../js/data', 'httpse-targets.json')
var dbLoaded = false

// Load the rulesets database
var db = new sqlite3.Database(sqlFile, sqlite3.OPEN_READONLY, function (dbErr) {
  if (dbErr) {
    console.log('error loading httpse rulesets.sqlite')
  } else {
    dbLoaded = true
  }
})

// Load the preloaded mapping of hostname to ruleset IDs
var targets = JSON.parse(fs.readFileSync(targetsFile, 'utf8'))

// Counter for detecting infinite redirect loops
var redirectCounter = {}
// Blacklist of canonicalized hosts (host+pathname) that lead to redirect loops
var redirectBlacklist = []

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

  if (rulesetIds.length === 0) {
    // No applicable rulesets.
    cb()
  } else {
    // Load the applicable rulesets from the database.
    loadRulesetsById(rulesetIds, (rulesets) => {
      try {
        // Apply the loaded rulesets
        applyRulesets(url, cb, rulesets)
      } catch (err) {
        console.log('error applying rulesets', err, url)
        cb()
      }
    }, (err) => {
      console.log('error loading rulesets', err, url)
      cb()
    })
  }
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
      console.log('got host with 0-length label', host)
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
 * Loads rulesets from the library by ID
 * @param {Array.<number>} rulesetId the ruleset IDs
 * @param {function(Array.<object>)} cb callback to call with ruleset content
 * @param {function(Error)} errback error callback
 */
function loadRulesetsById (rulesetIds, cb, errback) {
  var ids = JSON.stringify(rulesetIds).replace('[', '(').replace(']', ')')
  var queryForRuleset = 'select contents from rulesets where id in ' + ids
  db.all(queryForRuleset, function (err, rows) {
    var applicableRules
    try {
      applicableRules = rows.map(item => { return JSON.parse(item.contents) })
    } catch (e) {
      err = e
    }
    if (!err) {
      cb(applicableRules)
    } else {
      errback(err)
    }
  })
}

/**
 * Applies potentially-applicable rewrite rulesets to a URL
 * @param {string} url original URL
 * @param {function(string=)} cb the onBeforeRequest listener callback to call
 *   with the rewritten URL (undefined if no rewrite occurred)
 * @param {Array.<object>} applicableRules applicable rulesets
 * @return {string}
 */
function applyRulesets (url, cb, applicableRules) {
  // TODO: Ignore rules for the wrong platform and default_off rules
  var i, j, ruleset, exclusion, rule, fromPattern, newUrl, exclusionPattern
  for (j = 0; j < applicableRules.length; ++j) {
    ruleset = applicableRules[j].ruleset
    exclusion = ruleset.exclusion
    rule = ruleset.rule
    // If covered by an exclusion, abort.
    if (exclusion) {
      for (i = 0; i < exclusion.length; ++i) {
        exclusionPattern = new RegExp(exclusion[i].$.pattern)
        if (exclusionPattern.test(url)) {
          cb()
          return
        }
      }
    }
    // Find the first rule that triggers a substitution
    for (i = 0; i < rule.length; ++i) {
      fromPattern = new RegExp(rule[i].$.from)
      newUrl = url.replace(fromPattern, rule[i].$.to)
      if (newUrl !== url) {
        cb(newUrl)
        return
      }
    }
  }
  // No matching rules :(
  cb()
}

function onBeforeHTTPRequest (details, cb) {
  if (canonicalizeUrl(details.url) in redirectBlacklist) {
    // Don't try to rewrite this request, it'll probably just redirect again.
    cb({cancel: false})
  } else {
    getRewrittenUrl(details.url, (url) => {
      if (url) {
        cb({ cancel: false, redirectURL: url })
      } else {
        cb({ cancel: false })
      }
    })
  }
}

function onBeforeRedirect (details) {
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
  return [parsed.host, parsed.pathname].join('/')
}

/**
 * Loads HTTPS Everywhere into a new BrowserWindow
 * @param {BrowserWindow} win The browser window
 */
module.exports.init = (win) => {
  if (!dbLoaded) {
    console.log('httpse db not loaded yet; aborting')
    return null
  }
  var session = win.webContents ? win.webContents.session : null
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
