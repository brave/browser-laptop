/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'

// characters, then : with optional //
const rscheme = /^(?:[a-z\u00a1-\uffff0-9-+]{2,})(?::(\/\/)?)(?!\d)/i
const httpScheme = 'http://'
const httpsScheme = 'https://'
const fileScheme = 'file://'
const windowsFileScheme = /[a-z]:\\/i
const defaultScheme = httpScheme
const os = require('os')
const punycode = require('punycode/')
const urlParse = require('../../app/common/urlParse')
const urlFormat = require('url').format
const pdfjsExtensionId = require('../constants/config').PDFJSExtensionId
const ip = require('ip')
const pdfjsBaseUrl = `chrome-extension://${pdfjsExtensionId}/`

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

    if (windowsFileScheme.test(input)) {
      input = input.replace(/\\/g, '/')
      input = `${fileScheme}/${input}`
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
    const caseDomain = /^[\w]{2,5}:\/\/[^\s/]+\//
    // for cases, quoted strings
    const case1Reg = /^".*"$/
    // for cases:
    // - starts with "?" or "."
    // - contains "? "
    // - ends with "." (and was not preceded by a domain or /)
    const case2Reg = /(^\?)|(\?\s+)|(^\.)|(^[^.+]*[^/]*\.$)/
    // for cases, pure string
    const case3Reg = /[?./\s:]/
    // for cases, data:uri, view-source:uri and about
    const case4Reg = /^(data|view-source|mailto|about|chrome-extension|chrome-devtools|magnet|chrome):.*/
    // for Windows and unix file paths
    const case5Reg = /(?:^\/)|(?:^[a-zA-Z]:\\)/
    let str = input.trim()
    const scheme = UrlUtil.getScheme(str)

    if (str.toLowerCase() === 'localhost') {
      return false
    }
    if (case1Reg.test(str)) {
      return true
    }
    if (case2Reg.test(str) || !case3Reg.test(str) ||
    (scheme === undefined && /\s/g.test(str) && !case5Reg.test(str))) {
      return true
    }
    if (case4Reg.test(str)) {
      return !UrlUtil.canParseURL(str)
    }
    if (scheme && (scheme !== fileScheme)) {
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
      return (typeof window === 'undefined') ? input : new window.URL(input).href
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
    input = input.trim()
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
    return typeof url === 'string' && url.toLowerCase().startsWith('data:')
  },

  /**
   * Parses a favicon data URL
   * @param {String} url The data URL
   * @returns {{data: String, ext: String}?}
   */
  parseFaviconDataUrl: function (url) {
    if (!UrlUtil.isDataUrl(url)) {
      return null
    }
    const parsed = {}
    url = url.slice(5) // slice off 'data:' prefix
    const header = url.split(',')[0]
    if (!header || !header.includes(';base64')) {
      return null
    }
    const mimeType = header.split(';')[0]
    if (!mimeType.startsWith('image/')) {
      return null
    }
    parsed.ext = mimeType.split('/')[1]
    parsed.data = url.split(',')[1]
    if (parsed.data && parsed.ext) {
      return parsed
    }
    return null
  },

  /**
   * Checks if a url is a phishable url.
   * @param {String} input The input url.
   * @returns {Boolean}
   */
  isPotentialPhishingUrl: function (url) {
    if (typeof url !== 'string') { return false }
    const protocol = urlParse(url.trim().toLowerCase()).protocol
    return ['data:', 'blob:'].includes(protocol)
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
    if ((!UrlUtil.isHttpOrHttps(input) && !UrlUtil.isFileScheme(input)) || UrlUtil.isImageAddress(input)) {
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
    if (!UrlUtil.isUrlPDF(url)) {
      return url
    }

    if (url.indexOf('content/web/viewer.html?file=') !== -1) {
      const querystring = require('querystring')
      const parsedUrl = urlParse(url)
      const query = querystring.parse(parsedUrl.query)
      if (query && query.file) {
        return query.file
      }
    }
    return UrlUtil.getUrlFromPDFUrl(url)
  },

  isUrlPDF: function (url) {
    return (url && url.startsWith(pdfjsBaseUrl)) || false
  },

  getUrlFromPDFUrl: function (url) {
    if (!UrlUtil.isUrlPDF(url)) {
      return url
    }

    return url.replace(pdfjsBaseUrl, '')
  },

  getPDFViewerUrl: function (url) {
    const viewerBaseUrl = `${pdfjsBaseUrl}content/web/viewer.html`
    return `${viewerBaseUrl}?file=${encodeURIComponent(url)}`
  },

  /**
   * Converts a potential PDF URL to the PDFJS URL.
   * XXX: This only looks at the URL file extension, not MIME types.
   * @param {string} url
   * @return {string}
   */
  toPDFJSLocation: function (url) {
    if (url && UrlUtil.isHttpOrHttps(url) && UrlUtil.isFileType(url, 'pdf')) {
      return UrlUtil.getPDFViewerUrl(url)
    }
    return url
  },

  /**
   * Gets the default favicon URL for a URL.
   * @param {string} url The URL to find a favicon for
   * @return {string} url The base favicon URL
   */
  getDefaultFaviconUrl: function (url) {
    if (UrlUtil.isURL(url)) {
      const loc = urlParse(url)
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
      var splitUrl = url.split('@')
      splitUrl = splitUrl.map(str => punycode.toASCII(str))
      return splitUrl.join('@')
    }
  },

  /**
   * Gets the hostPattern from an URL.
   * @param {string} url The URL to get the hostPattern from
   * @return {string} url The URL formmatted as an hostPattern
   */
  getHostPattern: function (url) {
    return `https?://${url}`
  },

  /**
   * Checks if URL is based on http protocol.
   * @param {string} url - URL to check
   * @return {boolean}
   */
  isHttpOrHttps: function (url) {
    return url.startsWith(httpScheme) || url.startsWith(httpsScheme)
  },

  /**
   * Checks if URL is based on file protocol.
   * @param {string} url - URL to check
   * @return {boolean}
   */
  isFileScheme: function (url) {
    return this.getScheme(url) === fileScheme
  },

  /**
   * Gets the origin of a given URL
   * @param {string} url The URL to get the origin from
   * @return {string} url The origin of the given URL
   */
  getUrlOrigin: function (url) {
    return new window.URL(url).origin
  },

  isLocalFile: function (origin) {
    if (!origin) {
      return false
    }

    const localFileOrigins = ['file:', 'blob:', 'data:', 'chrome-extension:', 'chrome:']
    return localFileOrigins.some((localFileOrigin) => origin.startsWith(localFileOrigin))
  },

  getDisplayHost: (url) => {
    const parsedUrl = urlParse(url)
    if (parsedUrl.protocol === 'https:' || parsedUrl.protocol === 'http:') {
      return parsedUrl.host
    }

    return url
  },

  /**
   * Gets a site origin (scheme + hostname + port) from a URL or null if not available.
   * Warning: For unit tests, this currently runs as node without the parsed.origin
   * branch of code, but in muon this runs through the parsed.origin branch of code.
   * @param {string} location
   * @return {string|null}
   */
  getOrigin: (location) => {
    // Returns scheme + hostname + port
    if (typeof location !== 'string') {
      return null
    }

    if (location.startsWith('file://')) {
      return 'file:///'
    }

    let parsed = urlParse(location)
    // parsed.origin is specific to muon.url.parse
    if (parsed.origin !== undefined) {
      if (parsed.protocol === 'about:') {
        return [parsed.protocol, parsed.path.replace(/\/.*/, '')].join('')
      }
      return parsed.origin.replace(/\/+$/, '')
    }
    if (parsed.host && parsed.protocol) {
      // parsed.slashes is specific to node's url.parse
      return parsed.slashes ? [parsed.protocol, parsed.host].join('//') : [parsed.protocol, parsed.host].join('')
    }
    return null
  },

  stripLocation: (url) => {
    if (!url) {
      return ''
    }

    return url
      .replace(/((#?\/?)|(\/#?))$/, '') // remove trailing # and /
      .trim() // remove whitespaces
  },

  /**
   * Whether a URL is an internal address
   * @param {string} url
   * @returns {boolean}
   */
  isInternalUrl: (url) => {
    if (!url) {
      return false
    }
    // TODO: make these user-configurable
    const whitelistSuffixes = ['local', 'localhost']
    let hostname = urlParse(url).hostname
    if (hostname && hostname.startsWith('[') && hostname.endsWith(']')) {
      // Strip brackets from ipv6 address for ip.isPrivate
      hostname = hostname.slice(1, hostname.length - 1)
    }
    return ip.isPrivate(hostname) || hostname === 'localhost' || whitelistSuffixes.some((suffix) => {
      return hostname && hostname.endsWith(`.${suffix}`)
    })
  },

  /**
   * Whether a site is a Tor Hidden Service .onion URL
   * @param {string} url
   * @return {boolean}
   */
  isOnionUrl: (url) => {
    if (typeof url !== 'string') { return false }
    const hostname = urlParse(url).hostname
    if (!hostname) {
      return false
    }
    return hostname.endsWith('.onion')
  }
}

module.exports = UrlUtil
