/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const fs = require('fs')
const sqlite3 = require('sqlite3')
const path = require('path')
const urlParse = require('url').parse

const sqlFile = path.join(__dirname, '../data', 'rulesets.sqlite')
const targetsFile = path.join(__dirname, '../data', 'httpse-targets.json')
var dbLoaded = false

// Load the rulesets database
var db = new sqlite3.Database(sqlFile, sqlite3.OPEN_READONLY, function (dbErr) {
  if (dbErr) {
    console.log('error loading httpse rulesets.sqlite')
  } else {
    console.log('loaded httpse ruleset db')
    dbLoaded = true
  }
})
// Load the preloaded mapping of hostname to ruleset IDs
var targets = JSON.parse(fs.readFileSync(targetsFile, 'utf8'))

/**
 * Rewrites a URL from HTTP to HTTPS if an HTTPS Everywhere rule is applicable.
 * @param {string} url The URL to rewrite
 * @return {string} the rewritten URL
 */
function rewriteUrl (url) {
  var host = urlParse(url).hostname
  if (!targets[host]) {
    return url
  }
  targets[host].forEach((rulesetId) => {
    loadRulesetById(rulesetId)
  })
  return url
}

/**
 * Loads a ruleset from the database by ID
 * @param {number} rulesetId the ruleset ID
 */
function loadRulesetById (rulesetId) {
  var queryForRuleset = 'select contents from rulesets where id = $id'
  db.each(queryForRuleset, {$id: rulesetId}, function (err, row) {
    if (!err) {
      console.log('found rule', row.contents)
    }
  })
}

function onBeforeHTTPRequest (details, cb) {
  rewriteUrl(details.url)
  cb({
    cancel: false
  })
}

function onBeforeRedirect (details) {
  return null
}

/**
 * Loads HTTPS Everywhere into a new BrowserWindow
 * @param {BrowserWindow} win The browser window
 */
module.exports.loadHttpsEverywhere = (win) => {
  if (!dbLoaded) {
    console.log('httpse db not loaded yet; aborting')
  }
  console.log('loading https everywhere in a new window')
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
  // Try to catch redirect loops on URLs we've redirected to HTTPS
  wr.onBeforeRedirect({
    urls: ['https://*/*']
  }, onBeforeRedirect)
}
