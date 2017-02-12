/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'

// characters, then : with optional //
const rscheme = /^(?:[a-z\u00a1-\uffff0-9-+]+)(?::(\/\/)?)(?!\d)/i
const defaultScheme = 'http://'
const fileScheme = 'file://'
const os = require('os')
const punycode = require('punycode')
const urlParse = require('../../app/common/urlParse')
const urlFormat = require('url').format
const pdfjsExtensionId = require('../constants/config').PDFJSExtensionId

/**
 * A simple class for parsing and dealing with URLs.
 * @class UrlUtil
 */
const UrlUtil = {

  /**
   * Extracts the scheme from a value.
   * @param {String} input The input value.
   * @returns {String} The found scheme.
   */
  getScheme: function (input) {
    // This function returns one of following:
    // - scheme + ':' (ex. http:)
    // - scheme + '://' (ex. http://)
    // - null
    let scheme = (rscheme.exec(input) || [])[0]
    return scheme === 'localhost://' ? null : scheme
  },

  /**
   * Checks if an input has a scheme (e.g., http:// or ftp://).
   * @param {String} input The input value.
   * @returns {Boolean} Whether or not the input has a scheme.
   */
  hasScheme: function (input) {
    return !!UrlUtil.getScheme(input)
  },

  /**
   * Prepends file scheme for file paths, otherwise the default scheme
   * @param {String} input path, with opetional schema
   * @returns {String} path with a scheme
   */
  prependScheme: function (input) {
    if (input === undefined || input === null) {
      return input
    }

    // expand relative path
    if (input.startsWith('~/')) {
      input = input.replace(/^~/, os.homedir())
    }

    // detect absolute file paths
    if (input.startsWith('/')) {
      input = fileScheme + input
    }

    // If there's no scheme, prepend the default scheme
    if (!UrlUtil.hasScheme(input)) {
      input = defaultScheme + input
    }

    return input
  },

  canParseURL: function (input) {
    if (typeof window === 'undefined') {
      return true
    }
    try {
      let url = new window.URL(input)
      return !!url
    } catch (e) {
      return false
    }
  },

  isImageAddress (url) {
    return (url.match(/\.(jpeg|jpg|gif|png|bmp)$/))
  },

  isHttpAddress (url) {
    return (url.match(/^https?:\/\/(.*)/))
  },

  /**
   * Checks if a string is not a URL.
   * @param {String} input The input value.
   * @returns {Boolean} Returns true if this is not a valid URL.
   */
  isNotURL: function (input) {
    if (input === undefined || input === null) {
      return true
    }
    if (typeof input !== 'string') {
      return true
    }
    // for cases where we have scheme and we dont want spaces in domain names
    const caseDomain = /^[\w]{2,5}:\/\/[^\s\/]+\//
    // for cases, quoted strings
    const case1Reg = /^".*"$/
    // for cases:
    // - starts with "?" or "."
    // - contains "? "
    // - ends with "." (and was not preceded by a domain or /)
    const case2Reg = /(^\?)|(\?.+\s)|(^\.)|(^[^.+\..+]*[^\/]*\.$)/
    // for cases, pure string
    const case3Reg = /[\?\.\/\s:]/
    // for cases, data:uri, view-source:uri and about
    const case4Reg = /^(data|view-source|mailto|about|chrome-extension|magnet):.*/

    let str = input.trim()
    const scheme = UrlUtil.getScheme(str)

    if (str.toLowerCase() === 'localhost') {
      return false
    }
    if (case1Reg.test(str)) {
      return true
    }
    if (case2Reg.test(str) || !case3Reg.test(str) ||
        (scheme === undefined && /\s/g.test(str))) {
      return true
    }
    if (case4Reg.test(str)) {
      return !UrlUtil.canParseURL(str)
    }
    if (scheme && (scheme !== 'file://')) {
      return !caseDomain.test(str + '/')
    }
    str = UrlUtil.prependScheme(str)
    return !UrlUtil.canParseURL(str)
  },

  /**
   * Converts an input string into a URL.
   * @param {String} input The input value.
   * @returns {String} The formatted URL.
   */
  getUrlFromInput: function (input) {
    if (input === undefined || input === null) {
      return ''
    }

    input = input.trim()

    input = UrlUtil.prependScheme(input)

    if (UrlUtil.isNotURL(input)) {
      return input
    }

    try {
      return new window.URL(input).href
    } catch (e) {
      return input
    }
  },

  /**
   * Checks if a given input is a valid URL.
   * @param {String} input The input URL.
   * @returns {Boolean} Whether or not this is a valid URL.
   */
  isURL: function (input) {
    return !UrlUtil.isNotURL(input)
  },

  /**
   * Checks if a URL has a given file type.
   * @param {string} url - URL to check
   * @param {string} ext - File extension
   * @return {boolean}
   */
  isFileType: function (url, ext) {
    const pathname = urlParse(url).pathname
    if (!pathname) {
      return false
    }
    return pathname.toLowerCase().endsWith('.' + ext)
  },

  /**
   * Checks if a URL is a view-source URL.
   * @param {String} input The input URL.
   * @returns {Boolean} Whether or not this is a view-source URL.
   */
  isViewSourceUrl: function (url) {
    return url.toLowerCase().startsWith('view-source:')
  },

  /**
   * Checks if a url is a data url.
   * @param {String} input The input url.
   * @returns {Boolean} Whether or not this is a data url.
   */
  isDataUrl: function (url) {
    return url.toLowerCase().startsWith('data:')
  },

  /**
   * Checks if a url is an image data url.
   * @param {String} input The input url.
   * @returns {Boolean} Whether or not this is an image data url.
   */
  isImageDataUrl: function (url) {
    return url.toLowerCase().startsWith('data:image/')
  },

  /**
   * Converts a view-source url into a standard url.
   * @param {String} input The view-source url.
   * @returns {String} A normal url.
   */
  getUrlFromViewSourceUrl: function (input) {
    if (!UrlUtil.isViewSourceUrl(input)) {
      return input
    }
    return UrlUtil.getUrlFromInput(input.substring('view-source:'.length))
  },

  /**
   * Converts a URL into a view-source URL.
   * @param {String} input The input URL.
   * @returns {String} The view-source URL.
   */
  getViewSourceUrlFromUrl: function (input) {
    if (UrlUtil.isImageAddress(input) || !UrlUtil.isHttpAddress(input)) {
      return null
    }
    if (UrlUtil.isViewSourceUrl(input)) {
      return input
    }

    // Normalizes the actual URL before the view-source: scheme like prefix.
    return 'view-source:' + UrlUtil.getUrlFromViewSourceUrl(input)
  },

  /**
   * Extracts the hostname or returns undefined.
   * @param {String} input The input URL.
   * @returns {String} The host name.
   */
  getHostname: function (input, excludePort) {
    try {
      if (excludePort) {
        return new window.URL(input).hostname
      }
      return new window.URL(input).host
    } catch (e) {
      return undefined
    }
  },

  /**
   * Gets applicable hostname patterns for a given URL. Ex: for x.y.google.com,
   * rulesets matching x.y.google.com, *.y.google.com, and *.google.com are
   * applicable.
   * @param {string} url The url to get hostname patterns for
   * @return {Array.<string>}
   */
  getHostnamePatterns: function (url) {
    var host = urlParse(url).hostname
    if (!host) {
      return []
    }
    var hostPatterns = [host]
    var segmented = host.split('.')

    // Since targets can contain a single wildcard, replace each label of the
    // hostname with "*" in turn.
    segmented.forEach((label, index) => {
      // copy the original array
      var tmp = segmented.slice()
      tmp[index] = '*'
      hostPatterns.push(tmp.join('.'))
    })
    // Now eat away from the left with * so that for x.y.z.google.com we also
    // check *.z.google.com and *.google.com.
    for (var i = 2; i <= segmented.length - 2; ++i) {
      hostPatterns.push('*.' + segmented.slice(i, segmented.length).join('.'))
    }
    return hostPatterns
  },

  /**
   * Gets PDF location from a potential PDFJS URL
   * @param {string} url
   * @return {string}
   */
  getLocationIfPDF: function (url) {
    if (url && url.startsWith(`chrome-extension://${pdfjsExtensionId}/`)) {
      return url.replace(/^chrome-extension:\/\/.+\/(\w+:\/\/.+)/, '$1')
    }
    return url
  },

  /**
   * Gets location to display in the urlbar
   * @param {string} url
   * @param {boolean} pdfjsEnabled
   * @return {string}
   */
  getDisplayLocation: function (url, pdfjsEnabled) {
    if (!url || url === 'about:newtab') {
      return ''
    }
    url = pdfjsEnabled ? UrlUtil.getLocationIfPDF(url) : url
    const parsed = urlParse(url)
    if (parsed && parsed.auth) {
      parsed.auth = null
      return urlFormat(parsed)
    } else {
      return url
    }
  },

  /**
   * Gets the default favicon URL for a URL.
   * @param {string} url The URL to find a favicon for
   * @return {string} url The base favicon URL
   */
  getDefaultFaviconUrl: function (url) {
    if (UrlUtil.isURL(url)) {
      const loc = new window.URL(url)
      return loc.protocol + '//' + loc.host + '/favicon.ico'
    }
    return ''
  },

  getPunycodeUrl: function (url) {
    try {
      const parsed = urlParse(url)
      parsed.hostname = punycode.toASCII(parsed.hostname)
      return urlFormat(parsed)
    } catch (e) {
      return url
    }
  }
}

module.exports = UrlUtil
