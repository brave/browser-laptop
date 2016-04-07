/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const Immutable = require('immutable')
const UrlUtil = require('./urlutil')

/**
 * Determines the path of a relative URL from the hosted app
 */
module.exports.getAppUrl = function (relativeUrl) {
  if (relativeUrl === undefined) {
    relativeUrl = '/'
  }
  return new window.URL(relativeUrl, window.baseHref || window.location).href
}

/**
 * Returns the URL to the application's manifest
 */
module.exports.getManifestUrl = function () {
  return module.exports.getAppUrl('./manifest.webapp')
}

// Map of source about: URLs mapped to target URLs
module.exports.aboutUrls = new Immutable.Map({
  'about:about': module.exports.getAppUrl('./about-about.html'),
  'about:blank': module.exports.getAppUrl('./about-blank.html'),
  'about:history': module.exports.getAppUrl('./about-history.html'),
  'about:bookmarks': module.exports.getAppUrl('./about-bookmarks.html'),
  'about:downloads': module.exports.getAppUrl('./about-downloads.html'),
  'about:newtab': module.exports.getAppUrl('./about-newtab.html'),
  'about:preferences': module.exports.getAppUrl('./about-preferences.html'),
  'about:config': module.exports.getAppUrl('./about-config.html'),
  'about:certerror': module.exports.getAppUrl('./about-certerror.html'),
  'about:safebrowsing': module.exports.getAppUrl('./about-safebrowsing.html'),
  'about:passwords': module.exports.getAppUrl('./about-passwords.html')
})

// Map of target URLs mapped to source about: URLs
const aboutUrlsReverse = new Immutable.Map(module.exports.aboutUrls.reduce((obj, v, k) => {
  obj[v] = k
  return obj
}, {}))

/**
 * Obtains the target URL associated with an about: source URL
 * Example:
 * about:blank -> http://localhost:8000/about-blank/index.html
 */
module.exports.getTargetAboutUrl = function (input) {
  return module.exports.aboutUrls.get(input)
}

/**
 * Obtains the source about: URL associated with a target URL
 * Example:
 * http://localhost:8000/about-blank.html -> about:blank
 */
module.exports.getSourceAboutUrl = function (input) {
  return aboutUrlsReverse.get(input)
}

/**
 * Determines if the passed in string is a source about: URL
 * Example: isSourceAboutUrl('about:blank') -> true
 */
module.exports.isSourceAboutUrl = function (input) {
  return !!module.exports.getTargetAboutUrl(input)
}

/**
 * Determines if the passed in string is the target of a source about: URL
 * Example: isTargetAboutUrl('http://localhost:8000/about-blank/index.html') -> true
 */
module.exports.isTargetAboutUrl = function (input) {
  return !!module.exports.getSourceAboutUrl(input)
}

/**
 * Determines whether a string is a valid URL. Based on node-urlutil.js.
 * @param {string} input
 */
module.exports.isUrl = function (input) {
  input = input.trim()
  return UrlUtil.isURL(input) && !input.includes(' ')
}
