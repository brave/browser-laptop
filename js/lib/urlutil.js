/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'

// characters, then : with optional //
const rscheme = /^(?:[a-z\u00a1-\uffff0-9-+]+)(?::(\/\/)?)(?!\d)/i
const defaultScheme = 'http://'
const fileScheme = 'file://'
const os = require('os')
const urlParse = require('url').parse

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
    return !!this.getScheme(input)
  },

  /**
   * Prepends file scheme for file paths, otherwise the default scheme
   * @param {String} input path, with opetional schema
   * @returns {String} path with a scheme
   */
  prependScheme: function (input) {
    // expand relative path
    if (input.startsWith('~/')) {
      input = input.replace(/^~/, os.homedir())
    }

    // detect absolute file paths
    if (input.startsWith('/')) {
      input = fileScheme + input
    }

    // If there's no scheme, prepend the default scheme
    if (!this.hasScheme(input)) {
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

  /**
   * Checks if a string is not a URL.
   * @param {String} input The input value.
   * @returns {Boolean} Returns true if this is not a valid URL.
   */
  isNotURL: function (input) {
    // for cases, quoted strings
    const case1Reg = /^".*"$/
    // for cases, ?abc and "a? b" which should searching query
    const case2Reg = /^(\?)|(\?.+\s)/
    // for cases, pure string
    const case3Reg = /[\?\.\/\s:]/
    // for cases, data:uri and view-source:uri
    const case4Reg = /^\w+:.*/

    let str = input.trim()
    if (str.toLowerCase() === 'localhost') {
      return false
    }
    if (case1Reg.test(str)) {
      return true
    }
    if (case2Reg.test(str) || !case3Reg.test(str) ||
        this.getScheme(str) === str) {
      return true
    }
    if (case4Reg.test(str)) {
      return !this.canParseURL(str)
    }

    str = this.prependScheme(str)
    return !this.canParseURL(str)
  },

  /**
   * Converts an input string into a URL.
   * @param {String} input The input value.
   * @returns {String} The formatted URL.
   */
  getUrlFromInput: function (input) {
    input = input.trim()

    input = this.prependScheme(input)

    if (this.isNotURL(input)) {
      return input
    }

    return new window.URL(input).href
  },

  /**
   * Checks if a given input is a valid URL.
   * @param {String} input The input URL.
   * @returns {Boolean} Whether or not this is a valid URL.
   */
  isURL: function (input) {
    return !this.isNotURL(input)
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
    if (!this.isViewSourceUrl(input)) {
      return input
    }
    return this.getUrlFromInput(input.substring('view-source:'.length))
  },

  /**
   * Converts a URL into a view-source URL.
   * @param {String} input The input URL.
   * @returns {String} The view-source URL.
   */
  getViewSourceUrlFromUrl: function (input) {
    if (this.isViewSourceUrl(input)) {
      return input
    }

    // Normalizes the actual URL before the view-source: scheme like prefix.
    return 'view-source:' + this.getUrlFromViewSourceUrl(input)
  },

  /**
   * Extracts the hostname or returns undefined.
   * @param {String} input The input URL.
   * @returns {String} The host name.
   */
  getHostname: function (input) {
    try {
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
  }
}

module.exports = UrlUtil
