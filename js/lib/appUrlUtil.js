/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const Immutable = require('immutable')
const UrlUtil = require('./../../node_modules/urlutil.js/dist/node-urlutil.js')

/**
 * Determines the path of a relative URL from the hosted app
 */
export function getAppUrl (relativeUrl = './') {
  return new window.URL(relativeUrl, window.location).href
}

/**
 * Returns the URL to the application's manifest
 */
export function getManifestUrl () {
  return getAppUrl('./manifest.webapp')
}

// Map of source about: URLs mapped to target URLs
export const aboutUrls = new Immutable.Map({
  'about:about': getAppUrl('./about-about.html'),
  'about:blank': getAppUrl('./about-blank.html'),
  'about:history': getAppUrl('./about-history.html'),
  'about:newtab': getAppUrl('./about-newtab.html'),
  'about:preferences': getAppUrl('./about-preferences.html'),
  'about:settings': getAppUrl('./about-settings.html')
})

// Map of target URLs mapped to source about: URLs
const aboutUrlsReverse = new Immutable.Map(aboutUrls.reduce((obj, v, k) => {
  obj[v] = k
  return obj
}, {}))

/**
 * Obtains the target URL associated with an about: source URL
 * Example:
 * about:blank -> http://localhost:8000/about-blank/index.html
 */
export function getTargetAboutUrl (input) {
  return aboutUrls.get(input)
}

/**
 * Obtains the source about: URL associated with a target URL
 * Example:
 * http://localhost:8000/about-blank.html -> about:blank
 */
export function getSourceAboutUrl (input) {
  return aboutUrlsReverse.get(input)
}

/**
 * Determines if the passed in string is a source about: URL
 * Example: isSourceAboutUrl('about:blank') -> true
 */
export function isSourceAboutUrl (input) {
  return !!getTargetAboutUrl(input)
}

/**
 * Determines if the passed in string is the target of a source about: URL
 * Example: isTargetAboutUrl('http://localhost:8000/about-blank/index.html') -> true
 */
export function isTargetAboutUrl (input) {
  return !!getSourceAboutUrl(input)
}

/**
 * Determines whether the passed in string is pointing to a URL that
 * should be privileged (mozapp attribute on the iframe)
 * For now this is the same as an about URL.
 */
export function isPrivilegedUrl (input) {
  return isSourceAboutUrl(input)
}

/**
 * Determines whether a string is a valid URL. Based on node-urlutil.js.
 * @param {string} input
 */
export function isUrl (input) {
  input = input.trim()
  return (UrlUtil.isURL(input) && !input.includes(' '))
}
