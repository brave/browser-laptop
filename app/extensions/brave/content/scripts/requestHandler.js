/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const ipc = chrome.ipcRenderer

ipc.send('got-background-page-webcontents')
const domParser = new DOMParser()

/**
 * Takes a string and sanitizes it for HTML.
 * This doesn't defend against other forms of code injection (for instance
 * interpreting the input as js), so the input should still be considered
 * untrusted.
 * @param {string} input
 * @returns {string}
 */
const sanitizeHtml = (input) => {
  if (typeof input !== 'string') {
    return ''
  }
  return input.replace(/([\s\n]*<[^>]*>[\s\n]*)+/g, ' ')
}

ipc.on('fetch-publisher-info', (e, url, options) => {
  let finalUrl = url
  window.fetch(url, options).then((response) => {
    finalUrl = response.url
    return response.text()
  }).then((text) => {
    const html = domParser.parseFromString(text, 'text/html')
    requestHandlerApi.getMetaData(html, url, finalUrl)
  }).catch((err) => {
    requestHandlerApi.onError(err, url, finalUrl)
  })
})

const requestHandlerApi = {
  onError: (err, url, finalUrl) => {
    console.error('fetch error', err)
    ipc.send(`got-publisher-info-${url}`, {
      error: err.message,
      body: {
        url: finalUrl
      }
    })
  },

  getMetaData: async (htmlDom, url, finalUrl) => {
    try {
      const result = {
        image: await requestHandlerApi.getData({ htmlDom, finalUrl, conditions: metaScraperRules.getImageRules() }),
        title: await requestHandlerApi.getData({ htmlDom, finalUrl, conditions: metaScraperRules.getTitleRules() }),
        author: await requestHandlerApi.getData({ htmlDom, finalUrl, conditions: metaScraperRules.getAuthorRules() }),
        url: await requestHandlerApi.getData({ htmlDom, finalUrl, conditions: metaScraperRules.getUrlRules() })
      }

      ipc.send(`got-publisher-info-${url}`, {
        error: null,
        body: {
          finalUrl: finalUrl,
          url: sanitizeHtml(result.url) || finalUrl,
          title: sanitizeHtml(result.title) || '',
          image: sanitizeHtml(result.image) || '',
          author: sanitizeHtml(result.author) || ''
        }
      })
    } catch (err) {
      requestHandlerApi.onError(err, url, finalUrl)
    }
  },

  // Basic logic
  getData: async ({htmlDom,url,conditions}) => {
    const size = conditions.length
    let index = -1
    let value

    while (!value && index++ < size - 1) {
      value = await conditions[index]({htmlDom,url})
    }

    return value
  },

  // Helpers
  getText: (node) => {
    if (!node) {
      return ''
    }

    const html = (node.outerHTML || new XMLSerializer().serializeToString(node)) || ''
    return sanitizeHtml(html)
  },

  urlCheck: (url) => {
    try {
      new URL(url)
      return true
    } catch (e) {
      return false
    }
  },

  getContent: (selector) => {
    if (!selector) {
      return null
    }

    return selector.content
  },

  getSrc: (selector) => {
    if (!selector) {
      return null
    }

    return selector.src
  },

  getHref: (selector) => {
    if (!selector) {
      return null
    }

    return selector.href
  },

  urlTest: (url, opts) => {
    let relative
    if (opts == null) {
      relative = true
    } else {
      relative = opts.relative == null ? true : opts.relative
    }

    return relative
      ? requestHandlerApi.isAbsoluteUrl(url) === false || requestHandlerApi.urlCheck(url)
      : requestHandlerApi.urlCheck(url)
  },

  isEmpty: (value) => {
    return value == null || value.length === 0
  },

  isUrl: (url, opts = {}) => {
    return !requestHandlerApi.isEmpty(url) && requestHandlerApi.urlTest(url, opts)
  },

  getUrl: (baseUrl, relativePath = '') => {
    return requestHandlerApi.isAbsoluteUrl(relativePath) === false
      ? requestHandlerApi.resolveUrl(baseUrl, relativePath)
      : relativePath
  },

  strict: rule => htmlDom => {
    const value = rule(htmlDom)
    return requestHandlerApi.isStrictString(value)
  },

  isStrictString: value => {
    return /^\S+\s+\S+/.test(value) && value
  },

  titleize: (src, {removeBy = false} = {}) => {
    if (!src) {
      return ''
    }

    let title = requestHandlerApi.createTitle(src)
    if (removeBy) title = requestHandlerApi.removeByPrefix(title).trim()
    return title
  },

  defaultFn: (el) => {
    if (!el) {
      return ''
    }

    const text = requestHandlerApi.getText(el) || ''
    return text.trim()
  },

  getValue: (collection, fn = requestHandlerApi.defaultFn) => {
    if (!collection || !fn) {
      return null
    }

    if (!NodeList.prototype.isPrototypeOf(collection)) {
      return fn(collection)
    }

    for (const ele of collection) {
      const value = fn(ele)
      if (value) {
        return value
      }
    }

    return null
  },

  getThumbnailUrl: (id) => {
    if (id == null) {
      return null
    }

    return `https://img.youtube.com/vi/${id}/sddefault.jpg`
  },

  getVideoId: (str) => {
    let metadata = {}

    if (typeof str !== 'string') {
      return metadata
    }

    // remove surrounding white spaces or line feeds
    str = str.trim()

    // remove the '-nocookie' flag from youtube urls
    str = str.replace('-nocookie', '')

    // remove any leading `www.`
    str = str.replace('/www.', '/')

    if (/youtube|youtu\.be|i.ytimg\./.test(str)) {
      metadata = {
        id: requestHandlerApi.getYouTubeId(str),
        service: 'youtube'
      }
    }

    return metadata
  },

  // https://github.com/radiovisual/get-video-id
  getYouTubeId: (str) => {
    if (str == null) {
      return ''
    }

    // short code
    const shortCode = /youtube:\/\/|https?:\/\/youtu\.be\//g
    if (shortCode.test(str)) {
      const shortCodeId = str.split(shortCode)[1]
      return requestHandlerApi.stripParameters(shortCodeId)
    }

    // /v/ or /vi/
    const inlineV = /\/v\/|\/vi\//g
    if (inlineV.test(str)) {
      const inlineId = str.split(inlineV)[1]
      return requestHandlerApi.stripParameters(inlineId)
    }

    // v= or vi=
    const parameterV = /v=|vi=/g
    if (parameterV.test(str)) {
      const arr = str.split(parameterV)
      return arr[1].split('&')[0]
    }

    // v= or vi=
    const parameterWebP = /\/an_webp\//g
    if (parameterWebP.test(str)) {
      const webP = str.split(parameterWebP)[1]
      return requestHandlerApi.stripParameters(webP)
    }

    // embed
    const embedReg = /\/embed\//g
    if (embedReg.test(str)) {
      const embedId = str.split(embedReg)[1]
      return requestHandlerApi.stripParameters(embedId)
    }

    // user
    const userReg = /\/user\//g
    if (userReg.test(str)) {
      const elements = str.split('/')
      return requestHandlerApi.stripParameters(elements.pop())
    }

    // attribution_link
    const attrReg = /\/attribution_link\?.*v%3D([^%&]*)(%26|&|$)/
    if (attrReg.test(str)) {
      return str.match(attrReg)[1]
    }
  },

  stripParameters: (str) => {
    if (str == null) {
      return ''
    }

    // Split parameters
    if (str.includes('?')) {
      return str.split('?')[0]
    }

    // Split folder separator
    if (str.includes('/')) {
      return str.split('/')[0]
    }

    return str
  },

  // https://github.com/kellym/smartquotesjs
  getReplacements: () => {
    return [
      // triple prime
      [/'''/g, retainLength => '\u2034' + (retainLength ? '\u2063\u2063' : '')],
      // beginning "
      [/(\W|^)"(\w)/g, '$1\u201c$2'],
      // ending "
      [/(\u201c[^"]*)"([^"]*$|[^\u201c"]*\u201c)/g, '$1\u201d$2'],
      // remaining " at end of word
      [/([^0-9])"/g, '$1\u201d'],
      // double prime as two single quotes
      [/''/g, retainLength => '\u2033' + (retainLength ? '\u2063' : '')],
      // beginning '
      [/(\W|^)'(\S)/g, '$1\u2018$2'],
      // conjunction's possession
      [/([a-z])'([a-z])/ig, '$1\u2019$2'],
      // abbrev. years like '93
      [/(\u2018)([0-9]{2}[^\u2019]*)(\u2018([^0-9]|$)|$|\u2019[a-z])/ig, '\u2019$2$3'],
      // ending '
      [/((\u2018[^']*)|[a-z])'([^0-9]|$)/ig, '$1\u2019$3'],
      // backwards apostrophe
      [/(\B|^)\u2018(?=([^\u2018\u2019]*\u2019\b)*([^\u2018\u2019]*\B\W[\u2018\u2019]\b|[^\u2018\u2019]*$))/ig, '$1\u2019'],
      // double prime
      [/"/g, '\u2033'],
      // prime
      [/'/g, '\u2032']
    ]
  },

  smartQuotes: (str) => {
    const replacements = requestHandlerApi.getReplacements()
    if (!replacements || !str) {
      return ''
    }

    replacements.forEach(replace => {
      const replacement = typeof replace[1] === 'function' ? replace[1]({}) : replace[1]
      str = str.replace(replace[0], replacement)
    })

    return str
  },

  removeByPrefix: (str = '') => {
    if (str == null) {
      return ''
    }

    return str.replace(/^[\s\n]*by|@[\s\n]*/i, '').trim()
  },

  createTitle: (str = '') => {
    if (str == null) {
      return ''
    }

    str = str.trim().replace(/\s{2,}/g, ' ')
    return requestHandlerApi.smartQuotes(str)
  },

  // https://github.com/sindresorhus/is-absolute-url
  isAbsoluteUrl: (url) => {
    if (!requestHandlerApi.isString(url)) {
      return
    }

    return /^[a-z][a-z0-9+.-]*:/.test(url)
  },

  resolveUrl: (baseUrl, relativePath) => {
    let url = baseUrl

    if (!relativePath) {
      return url
    }

    try {
      url = new URL(relativePath, [baseUrl])
    } catch (e) {}

    return url
  },

  isString: (str) => {
    return typeof str === 'string'
  }
}

if (module) module.exports = requestHandlerApi
