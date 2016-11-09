/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const Immutable = require('immutable')
const path = require('path')
const UrlUtil = require('./urlutil')
const config = require('../constants/config')

module.exports.fileUrl = (str) => {
  var pathName = path.resolve(str).replace(/\\/g, '/')

  // Windows drive letter must be prefixed with a slash
  if (pathName[0] !== '/') {
    pathName = '/' + pathName
  }

  return encodeURI('file://' + pathName)
}

/**
 * Gets the URL of a page hosted by the braveExtension or torrentExtension
 * Returns 'chrome-extension://<...>'
 */
module.exports.getBraveExtUrl = function (relativeUrl) {
  if (relativeUrl === undefined) {
    relativeUrl = ''
  }

  return 'chrome-extension://' + config.braveExtensionId + '/' + relativeUrl
}

/**
 * Gets the URL of a page hosted by the torrentExtension
 * Returns 'chrome-extension://<...>'
 */
const getTorrentExtUrl = function (relativeUrl) {
  if (relativeUrl === undefined) {
    relativeUrl = ''
  }

  return 'chrome-extension://' + config.torrentExtensionId + '/' + relativeUrl
}

module.exports.getExtensionsPath = function (extensionDir) {
  return (process.env.NODE_ENV !== 'development' && process.env.NODE_ENV !== 'test')
    // the path is different for release builds because extensions are not in the asar file
    ? path.join(__dirname, '..', '..', '..', 'extensions', extensionDir)
    : path.join(__dirname, '..', '..', 'app', 'extensions', extensionDir)
}

module.exports.getBraveExtIndexHTML = function () {
  var prefix = path.resolve(__dirname, '..', '..') + '/app/extensions/brave'
  return process.env.NODE_ENV === 'development'
    ? module.exports.fileUrl(prefix + '/index-dev.html')
    : module.exports.fileUrl(prefix + '/index.html')
}

/**
 * Returns the URL to the application's manifest
 */
module.exports.getManifestUrl = function () {
  return module.exports.getBraveExtUrl('manifest.webapp')
}

// Map of source about: URLs mapped to target URLs
module.exports.aboutUrls = new Immutable.Map({
  'about:about': module.exports.getBraveExtUrl('about-about.html'),
  'about:adblock': module.exports.getBraveExtUrl('about-adblock.html'),
  'about:autofill': module.exports.getBraveExtUrl('about-autofill.html'),
  'about:blank': module.exports.getBraveExtUrl('about-blank.html'),
  'about:bookmarks': module.exports.getBraveExtUrl('about-bookmarks.html'),
  'about:brave': module.exports.getBraveExtUrl('about-brave.html'),
  'about:certerror': module.exports.getBraveExtUrl('about-certerror.html'),
  'about:config': module.exports.getBraveExtUrl('about-config.html'),
  'about:downloads': module.exports.getBraveExtUrl('about-downloads.html'),
  'about:error': module.exports.getBraveExtUrl('about-error.html'),
  'about:extensions': module.exports.getBraveExtUrl('about-extensions.html'),
  'about:flash': module.exports.getBraveExtUrl('about-flash.html'),
  'about:history': module.exports.getBraveExtUrl('about-history.html'),
  'about:newtab': module.exports.getBraveExtUrl('about-newtab.html'),
  'about:passwords': module.exports.getBraveExtUrl('about-passwords.html'),
  'about:preferences': module.exports.getBraveExtUrl('about-preferences.html'),
  'about:safebrowsing': module.exports.getBraveExtUrl('about-safebrowsing.html'),
  'about:styles': module.exports.getBraveExtUrl('about-styles.html')
})

module.exports.isIntermediateAboutPage = (location) =>
  ['about:safebrowsing', 'about:error', 'about:certerror'].includes(getBaseUrl(location))

module.exports.isNotImplementedAboutPage = (location) =>
  ['about:config'].includes(getBaseUrl(location))

module.exports.isNavigatableAboutPage = (location) =>
  !module.exports.isIntermediateAboutPage(location) && !module.exports.isNotImplementedAboutPage(location) && !['about:newtab', 'about:blank', 'about:flash'].includes(getBaseUrl(location))

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
  const hash = getHash(input)
  const url = module.exports.aboutUrls.get(getBaseUrl(input))
  return hash && url ? [url, hash].join('#') : url
}

/**
 * Obtains the source about: URL associated with a target URL
 * Example:
 * http://localhost:8000/about-blank.html -> about:blank
 */
module.exports.getSourceAboutUrl = function (input) {
  const hash = getHash(input)
  const url = aboutUrlsReverse.get(getBaseUrl(input))
  return hash && url ? [url, hash].join('#') : url
}

/**
 * Determines if the passed in string is a source about: URL
 * Example: isSourceAboutUrl('about:blank') -> true
 */
module.exports.isSourceAboutUrl = function (input) {
  return !!module.exports.getTargetAboutUrl(getBaseUrl(input))
}

/**
 * Determines if the passed in string is the target of a source about: URL
 * Example: isTargetAboutUrl('http://localhost:8000/about-blank/index.html') -> true
 */
module.exports.isTargetAboutUrl = function (input) {
  return !!module.exports.getSourceAboutUrl(getBaseUrl(input))
}

/**
 * Obtains the target URL associated with a magnet: source URL
 * Returns null if the input is not a magnet URL
 * Example: getTargetMagnetUrl('magnet:...') -> 'chrome-extension://<...>.html#magnet:...'
 */
module.exports.getTargetMagnetUrl = function (input) {
  if (!input.startsWith('magnet:')) return null
  const url = getTorrentExtUrl('webtorrent.html')
  return [url, input].join('#')
}

/**
 * Obtains the source magnet: URL associated with a target URL
 * Returns null if the input is not the local URL for a magnet link.
 * Example: getSourceMagnetUrl('chrome-extension://<...>.html#magnet:...') -> 'magnet:...'
 */
module.exports.getSourceMagnetUrl = function (input) {
  if (getBaseUrl(input) !== getTorrentExtUrl('webtorrent.html')) return null
  const url = getHash(input)
  return url
}

/**
 * Checks if the input looks like a magnet: URL
 * Example: getSourceMagnetUrl('magnet:?x=y') -> true
 */
module.exports.isSourceMagnetUrl = function (input) {
  return !!module.exports.getTargetMagnetUrl(input)
}

/*
 * Checks if the input looks like the local URL for a magnet link.
 * Example: getSourceMagnetUrl('chrome-extension://<...>.html#magnet:?x=y') -> true
 */
module.exports.isTargetMagnetUrl = function (input) {
  return !!module.exports.getSourceMagnetUrl(input)
}

/**
 * Determines whether a string is a valid URL. Based on node-urlutil.js.
 * @param {string} input
 */
module.exports.isUrl = function (input) {
  input = input.trim()
  return UrlUtil.isURL(input)
}

/**
 * Gets base url from an about: url or its target mapping.
 */
function getBaseUrl (input) {
  return (typeof input === 'string') ? input.split(/#|\?/)[0] : ''
}
module.exports.getBaseUrl = getBaseUrl

/**
 * Gets hash part of a url
 */
function getHash (input) {
  return (typeof input === 'string') ? input.split('#')[1] : ''
}

module.exports.navigatableTypes = ['http:', 'https:', 'about:', 'chrome:', 'chrome-extension:', 'file:', 'view-source:', 'ftp:', 'magnet:']

/**
 * Determine the URL to use when creating a new tab
 */
module.exports.newFrameUrl = function () {
  const {getSetting} = require('../settings')
  const settings = require('../constants/settings')
  const settingValue = getSetting(settings.NEWTAB_MODE)
  const {newTabMode} = require('../../app/common/constants/settingsEnums')

  switch (settingValue) {
    case newTabMode.HOMEPAGE:
      return getSetting(settings.HOMEPAGE) || 'about:newtab'

    case newTabMode.DEFAULT_SEARCH_ENGINE:
      const searchProviders = require('../data/searchProviders').providers
      const defaultSearchEngine = getSetting(settings.DEFAULT_SEARCH_ENGINE)
      const defaultSearchEngineSettings = searchProviders.filter(engine => {
        return engine.name === defaultSearchEngine
      })
      return defaultSearchEngineSettings[0].base

    case newTabMode.NEW_TAB_PAGE:
    default:
      return 'about:newtab'
  }
}
