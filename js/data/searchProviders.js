/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const path = require('path')
const {braveExtensionId} = require('../constants/config')

/**
 * Returns chrome-extension:// URL of a favicon resource
 * @param {string} name - Name of the resource
 * @param {string} ext - Filename extension
 */
const getFaviconUrl = (name, ext = 'ico') => {
  return `chrome-extension://${braveExtensionId}/img/favicons/${name}.${ext}`
}

/**
 * Returns path of a favicon resource
 */
const getPath = (name, ext = 'ico') => {
  return path.join(__dirname, '..', '..', 'img', 'favicons', `${name}.${ext}`)
}

module.exports = { "providers" :
  [
    {
      "name" : "Amazon",
      "base" : "https://www.amazon.com",
      "image" : getPath('amazon'),
      "localImage" : getFaviconUrl('amazon'),
      "search" : "https://www.amazon.com/exec/obidos/external-search/?field-keywords={searchTerms}&mode=blended",
      "autocomplete" : "https://completion.amazon.com/search/complete?method=completion&q={searchTerms}&search-alias=aps&client=amazon-search-ui&mkt=1",
      "shortcut" : ":a"
    },
    {
      "name" : "Bing",
      "base" : "https://www.bing.com",
      "image" : getPath('bing'),
      "localImage" : getFaviconUrl('bing'),
      "search" : "https://www.bing.com/search?q={searchTerms}",
      "autocomplete" : "https://api.bing.com/osjson.aspx?query={searchTerms}&language={language}&form=OSDJAS",
      "shortcut" : ":b"
    },
    {
      "name" : "DuckDuckGo",
      "base" : "https://duckduckgo.com",
      "image" : getPath('duckduckgo'),
      "localImage" : getFaviconUrl('duckduckgo'),
      "search" : "https://duckduckgo.com/?q={searchTerms}&t=brave",
      "autocomplete" : "https://ac.duckduckgo.com/ac/?q={searchTerms}&type=list",
      "shortcut" : ":d"
    },
    {
      "name" : "Fireball",
      "base" : "https://fireball.com",
      "image" : getPath('fireball'),
      "localImage" : getFaviconUrl('fireball'),
      "search" : "https://fireball.com/?q={searchTerms}",
      "autocomplete" : "https://fireball.com/search/?q={searchTerms}",
      "shortcut" : ":f"
    },
    {
      "name" : "GitHub",
      "base" : "https://github.com/search",
      "image" : getPath('github'),
      "localImage" : getFaviconUrl('github'),
      "search" : "https://github.com/search?q={searchTerms}",
      "shortcut" : ":gh"
    },
    {
      "name" : "Google",
      "base" : "https://www.google.com",
      "image" : getPath('google'),
      "localImage" : getFaviconUrl('google'),
      "search" : "https://www.google.com/search?q={searchTerms}",
      "autocomplete" : "https://suggestqueries.google.com/complete/search?client=chrome&q={searchTerms}",
      "shortcut" : ":g"
    },
    {
      "name" : "Stack Overflow",
      "base" : "https://stackoverflow.com/search",
      "image" : getPath('stackoverflow'),
      "localImage" : getFaviconUrl('stackoverflow'),
      "search" : "https://stackoverflow.com/search?q={searchTerms}",
      "shortcut" : ":s"
    },
    {
      "name" : "MDN Web Docs",
      "base": "https://developer.mozilla.org/search",
      "image" : getPath('mdn', 'png'),
      "localImage" : getFaviconUrl('mdn', 'png'),
      "search" : "https://developer.mozilla.org/search?q={searchTerms}",
      "shortcut" : ":m"
    },
    {
      "name" : "Twitter",
      "base" : "https://twitter.com",
      "image" : getPath('twitter'),
      "localImage" : getFaviconUrl('twitter'),
      "search" : "https://twitter.com/search?q={searchTerms}&source=desktop-search",
      "shortcut" : ":t"
    },
    {
      "name" : "Wikipedia",
      "base" : "https://en.wikipedia.org",
      "image" : getPath('wikipedia'),
      "localImage" : getFaviconUrl('wikipedia'),
      "search" : "https://en.wikipedia.org/wiki/Special:Search?search={searchTerms}",
      "shortcut" : ":w"
    },
    {
      "name" : "Yahoo",
      "base" : "https://search.yahoo.com",
      "image" : getPath('yahoo'),
      "localImage" : getFaviconUrl('yahoo'),
      "search" : "https://search.yahoo.com/search?p={searchTerms}&fr=opensearch",
      "autocomplete": "https://search.yahoo.com/sugg/os?command={searchTerms}&output=fxjson&fr=opensearch",
      "shortcut" : ":y"
    },
    {
      "name" : "YouTube",
      "base" : "https://www.youtube.com",
      "image" : getPath('youtube'),
      "localImage" : getFaviconUrl('youtube'),
      "search" : "https://www.youtube.com/results?search_type=search_videos&search_query={searchTerms}&search_sort=relevance&search_category=0&page=",
      "autocomplete": "https://suggestqueries.google.com/complete/search?output=chrome&client=chrome&hl=it&q={searchTerms}&ds=yt",
      "shortcut" : ":yt"
    },
    {
      "name" : "StartPage",
      "base" : "https://www.startpage.com",
      "image" : getPath('startpage', 'png'),
      "localImage" : getFaviconUrl('startpage', 'png'),
      "search" : "https://www.startpage.com/do/dsearch?query={searchTerms}&cat=web&pl=opensearch",
      "autocomplete": "https://www.startpage.com/cgi-bin/csuggest?query={searchTerms}&limit=10&format=json",
      "shortcut" : ":sp"
    },
    {
      "name" : "Infogalactic",
      "base" : "https://infogalactic.com",
      "image" : getPath('infogalactic'),
      "localImage" : getFaviconUrl('infogalactic'),
      "search" : "https://infogalactic.com/w/index.php?title=Special:Search&search={searchTerms}",
      "autocomplete": "https://infogalactic.com/w/api.php?action=opensearch&search={searchTerms}&namespace=0",
      "shortcut" : ":i"
    },
    {
      "name" : "Wolfram Alpha",
      "base" : "https://www.wolframalpha.com",
      "image" : getPath('wolframalpha'),
      "localImage" : getFaviconUrl('wolframalpha'),
      "search" : "https://www.wolframalpha.com/input/?i={searchTerms}",
      "shortcut" : ":wa"
    },
    {
      "name" : "Semantic Scholar",
      "base" : "https://www.semanticscholar.org",
      "image" : getPath('semanticscholar', 'png'),
      "localImage" : getFaviconUrl('semanticscholar', 'png'),
      "search" : "https://www.semanticscholar.org/search?q={searchTerms}",
      "shortcut" : ":ss"
    },
    {
      "name" : "Qwant",
      "base" : "https://www.qwant.com/",
      "image" : getPath('qwant'),
      "localImage" : getFaviconUrl('qwant'),
      "search" : "https://www.qwant.com/?q={searchTerms}&client=brave",
      "autocomplete": "https://api.qwant.com/api/suggest/?q={searchTerms}&client=brave",
      "shortcut" : ":q"
    },
    {
      "name" : "Yandex",
      "base" : "https://yandex.com",
      "image" : getPath('yandex'),
      "localImage" : getFaviconUrl('yandex'),
      "search" : "https://yandex.com/search/?text={searchTerms}&clid=2274777",
      "shortcut" : ":ya"
    },
    {
      "name" : "Ecosia",
      "base" : "https://www.ecosia.org/",
      "image" : getPath('ecosia'),
      "localImage" : getFaviconUrl('ecosia'),
      "search" : "https://www.ecosia.org/search?q={searchTerms}",
      "autocomplete": "https://ac.ecosia.org/autocomplete?q={searchTerms}&type=list",
      "shortcut" : ":e"
    },
    {
      "name" : "searx",
      "base" : "https://searx.me",
      "image" : getPath('searx'),
      "localImage" : getFaviconUrl('searx'),
      "search" : "https://searx.me/?q={searchTerms}&categories=general",
      "shortcut" : ":x"
    },
    {
      "name": "findx",
      "base": "https://www.findx.com",
      "image": getPath('findx'),
      "localImage" : getFaviconUrl('findx'),
      "search": "https://www.findx.com/search?q={searchTerms}&type=web",
      "autocomplete": "https://www.findx.com/api/web-search/suggestions/?q={searchTerms}&type=opensearch",
      "shortcut": ":fx"
    }
  ]
}
