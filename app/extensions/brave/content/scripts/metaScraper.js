/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

 // Main repository
 // Version 3.9.2
// https://github.com/microlinkhq/metascraper

// Image
// https://github.com/microlinkhq/metascraper/tree/master/packages/metascraper-image

// Author
// https://github.com/microlinkhq/metascraper/tree/master/packages/metascraper-author

// Title
// https://github.com/microlinkhq/metascraper/tree/master/packages/metascraper-title

// YouTube
// https://github.com/microlinkhq/metascraper/tree/master/packages/metascraper-youtube

const metaScraperRules = {
  // Rules
  getImageRules: () => {
    const wrap = rule => ({htmlDom,url}) => {
      const value = rule(htmlDom)
      return requestHandlerApi.isUrl(value) && requestHandlerApi.getUrl(url, value)
    }

    return [
      // Youtube
      ({htmlDom,url}) => {
        const {id,service} = requestHandlerApi.getVideoId(url)
        return service === 'youtube' && id && requestHandlerApi.getThumbnailUrl(id)
      },
      // Regular
      wrap(html => requestHandlerApi.getContent(html.querySelector('meta[property="og:image:secure_url"]'))),
      wrap(html => requestHandlerApi.getContent(html.querySelector('meta[property="og:image:url"]'))),
      wrap(html => requestHandlerApi.getContent(html.querySelector('meta[property="og:image"]'))),
      wrap(html => requestHandlerApi.getContent(html.querySelector('meta[name="twitter:image:src"]'))),
      wrap(html => requestHandlerApi.getContent(html.querySelector('meta[name="twitter:image"]'))),
      wrap(html => requestHandlerApi.getContent(html.querySelector('meta[name="sailthru.image.thumb"]'))),
      wrap(html => requestHandlerApi.getContent(html.querySelector('meta[name="sailthru.image.full"]'))),
      wrap(html => requestHandlerApi.getContent(html.querySelector('meta[name="sailthru.image"]'))),
      wrap(html => requestHandlerApi.getValue(html.querySelectorAll('article img[src]'), requestHandlerApi.getSrc)),
      wrap(html => requestHandlerApi.getValue(html.querySelectorAll('#content img[src]'), requestHandlerApi.getSrc)),
      wrap(html => requestHandlerApi.getSrc(html.querySelector('img[alt*="author"]'))),
      wrap(html => requestHandlerApi.getSrc(html.querySelector('img[src]')))
    ]
  },

  getTitleRules: () => {
    const wrap = rule => ({htmlDom}) => {
      const value = rule(htmlDom)
      return requestHandlerApi.isString(value) && requestHandlerApi.titleize(value)
    }

    return [
      // Regular
      wrap(html => requestHandlerApi.getContent(html.querySelector('meta[property="og:title"]'))),
      wrap(html => requestHandlerApi.getContent(html.querySelector('meta[name="twitter:title"]'))),
      wrap(html => requestHandlerApi.getContent(html.querySelector('meta[name="sailthru.title"]'))),
      wrap(html => requestHandlerApi.getText(html.querySelector('.post-title'))),
      wrap(html => requestHandlerApi.getText(html.querySelector('.entry-title'))),
      wrap(html => requestHandlerApi.getText(html.querySelector('[itemtype="http://schema.org/BlogPosting"] [itemprop="name"]'))),
      wrap(html => requestHandlerApi.getText(html.querySelector('h1[class*="title"] a'))),
      wrap(html => requestHandlerApi.getText(html.querySelector('h1[class*="title"]'))),
      wrap(html => requestHandlerApi.getText(html.querySelector('title')))
    ]
  },

  getAuthorRules: () => {
    const wrap = rule => ({htmlDom}) => {
      const value = rule(htmlDom)

      return requestHandlerApi.isString(value) &&
        !requestHandlerApi.isUrl(value, {relative: false}) &&
        requestHandlerApi.titleize(value, {removeBy: true})
    }

    return [
      // Youtube
      wrap(html => requestHandlerApi.getText(html.querySelector('#owner-name'))),
      wrap(html => requestHandlerApi.getText(html.querySelector('#channel-title'))),
      wrap(html => requestHandlerApi.getValue(html.querySelectorAll('[class*="user-info"]'))),
      // Regular
      wrap(html => requestHandlerApi.getContent(html.querySelector('meta[property="author"]'))),
      wrap(html => requestHandlerApi.getContent(html.querySelector('meta[property="article:author"]'))),
      wrap(html => requestHandlerApi.getContent(html.querySelector('meta[name="author"]'))),
      wrap(html => requestHandlerApi.getContent(html.querySelector('meta[name="sailthru.author"]'))),
      wrap(html => requestHandlerApi.getValue(html.querySelectorAll('[rel="author"]'))),
      wrap(html => requestHandlerApi.getValue(html.querySelectorAll('[itemprop*="author"] [itemprop="name"]'))),
      wrap(html => requestHandlerApi.getValue(html.querySelectorAll('[itemprop*="author"]'))),
      wrap(html => requestHandlerApi.getContent(html.querySelector('meta[property="book:author"]'))),
      requestHandlerApi.strict(wrap(html => requestHandlerApi.getValue(html.querySelectorAll('a[class*="author"]')))),
      requestHandlerApi.strict(wrap(html => requestHandlerApi.getValue(html.querySelectorAll('[class*="author"] a')))),
      requestHandlerApi.strict(wrap(html => requestHandlerApi.getValue(html.querySelectorAll('a[href*="/author/"]')))),
      wrap(html => requestHandlerApi.getValue(html.querySelectorAll('a[class*="screenname"]'))),
      requestHandlerApi.strict(wrap(html => requestHandlerApi.getValue(html.querySelectorAll('[class*="author"]')))),
      requestHandlerApi.strict(wrap(html => requestHandlerApi.getValue(html.querySelectorAll('[class*="byline"]'))))
    ]
  },

  getUrlRules: () => {
    const wrap = rule => ({htmlDom, url}) => {
      const value = rule(htmlDom)
      return requestHandlerApi.isUrl(value, {relative: false}) && requestHandlerApi.getUrl(url, value)
    }

    return [
      wrap(html => requestHandlerApi.getHref(html.querySelector('link[rel="canonical"]')))
    ]
  }
}
