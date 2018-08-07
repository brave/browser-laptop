/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const {braveExtensionId} = require('../constants/config')

/**
 * Returns chrome-extension:// URL of a favicon resource
 * @param {string} name - Name of the resource
 * @param {string} ext - Filename extension
 */
const getFaviconUrl = (name, ext = 'ico') => {
  return `chrome-extension://${braveExtensionId}/img/favicons/${name}.${ext}`
}

module.exports = { "providers" :
  [
    {
      "name" : "Amazon",
      "base" : "https://www.amazon.com",
      "image" : "https://www.amazon.com/favicon.ico",
      "localImage" : getFaviconUrl('amazon'),
      "search" : "https://www.amazon.com/exec/obidos/external-search/?field-keywords={searchTerms}&mode=blended",
      "autocomplete" : "https://completion.amazon.com/search/complete?method=completion&q={searchTerms}&search-alias=aps&client=amazon-search-ui&mkt=1",
      "anyVisitToBaseDomainIsSearch" : false,
      "shortcut" : ":a"
    },
    {
      "name" : "Bing",
      "base" : "https://www.bing.com",
      "image" : "https://www.bing.com/favicon.ico",
      "localImage" : getFaviconUrl('bing'),
      "search" : "https://www.bing.com/search?q={searchTerms}",
      "autocomplete" : "https://api.bing.com/osjson.aspx?query={searchTerms}&language={language}&form=OSDJAS",
      "anyVisitToBaseDomainIsSearch" : true,
      "shortcut" : ":b"
    },
    {
      "name" : "DuckDuckGo",
      "base" : "https://duckduckgo.com",
      "image" : "https://duckduckgo.com/favicon.ico",
      "localImage" : getFaviconUrl('duckduckgo'),
      "search" : "https://duckduckgo.com/?q={searchTerms}&t=brave",
      "autocomplete" : "https://ac.duckduckgo.com/ac/?q={searchTerms}&type=list",
      "anyVisitToBaseDomainIsSearch" : true,
      "shortcut" : ":d"
    },
    {
      "name" : "Fireball",
      "base" : "https://fireball.com",
      "image" : "https://fireball.com/favicon.ico",
      "localImage" : getFaviconUrl('fireball'),
      "search" : "https://fireball.com/?q={searchTerms}",
      "autocomplete" : "https://fireball.com/search/?q={searchTerms}",
      "anyVisitToBaseDomainIsSearch" : true,
      "shortcut" : ":f"
    },
    {
      "name" : "GitHub",
      "base" : "https://github.com/search",
      "image" : "https://assets-cdn.github.com/favicon.ico",
      "localImage" : getFaviconUrl('github'),
      "search" : "https://github.com/search?q={searchTerms}",
      "anyVisitToBaseDomainIsSearch" : false,
      "shortcut" : ":gh"
    },
    {
      "name" : "Google",
      "base" : "https://www.google.com",
      "image" : "https://www.google.com/favicon.ico",
      "localImage" : getFaviconUrl('google'),
      "search" : "https://www.google.com/search?q={searchTerms}",
      "autocomplete" : "https://suggestqueries.google.com/complete/search?client=chrome&q={searchTerms}",
      "anyVisitToBaseDomainIsSearch" : true,
      "shortcut" : ":g"
    },
    {
      "name" : "Stack Overflow",
      "base" : "https://stackoverflow.com/search",
      "image" : "https://cdn.sstatic.net/sites/stackoverflow/img/favicon.ico",
      "localImage" : getFaviconUrl('stackoverflow'),
      "search" : "https://stackoverflow.com/search?q={searchTerms}",
      "anyVisitToBaseDomainIsSearch" : false,
      "shortcut" : ":s"
    },
    {
      "name" : "MDN Web Docs",
      "base": "https://developer.mozilla.org/search",
      "image" : "https://developer.cdn.mozilla.net/static/img/favicon32.png",
      "localImage" : getFaviconUrl('mdn', 'png'),
      "search" : "https://developer.mozilla.org/search?q={searchTerms}",
      "anyVisitToBaseDomainIsSearch" : false,
      "shortcut" : ":m"
    },
    {
      "name" : "Twitter",
      "base" : "https://twitter.com",
      "image" : "https://twitter.com/favicon.ico",
      "localImage" : getFaviconUrl('twitter'),
      "search" : "https://twitter.com/search?q={searchTerms}&source=desktop-search",
      "anyVisitToBaseDomainIsSearch" : false,
      "shortcut" : ":t"
    },
    {
      "name" : "Wikipedia",
      "base" : "https://en.wikipedia.org",
      "image" : "https://en.wikipedia.org/favicon.ico",
      "localImage" : getFaviconUrl('wikipedia'),
      "search" : "https://en.wikipedia.org/wiki/Special:Search?search={searchTerms}",
      "anyVisitToBaseDomainIsSearch" : false,
      "shortcut" : ":w"
    },
    {
      "name" : "Yahoo",
      "base" : "https://search.yahoo.com",
      "image" : "https://search.yahoo.com/favicon.ico",
      "localImage" : getFaviconUrl('yahoo'),
      "search" : "https://search.yahoo.com/search?p={searchTerms}&fr=opensearch",
      "autocomplete": "https://search.yahoo.com/sugg/os?command={searchTerms}&output=fxjson&fr=opensearch",
      "anyVisitToBaseDomainIsSearch" : true,
      "shortcut" : ":y"
    },
    {
      "name" : "YouTube",
      "base" : "https://www.youtube.com",
      "image" : "https://www.youtube.com/favicon.ico",
      "localImage" : getFaviconUrl('youtube'),
      "search" : "https://www.youtube.com/results?search_type=search_videos&search_query={searchTerms}&search_sort=relevance&search_category=0&page=",
      "autocomplete": "https://suggestqueries.google.com/complete/search?output=chrome&client=chrome&hl=it&q={searchTerms}&ds=yt",
      "anyVisitToBaseDomainIsSearch" : false,
      "shortcut" : ":yt"
    },
    {
      "name" : "StartPage",
      "base" : "https://www.startpage.com",
      "image" : "https://www.startpage.com/graphics/favicon/sp-favicon-16x16.png",
      "localImage" : getFaviconUrl('startpage', 'png'),
      "search" : "https://www.startpage.com/do/dsearch?query={searchTerms}&cat=web&pl=opensearch",
      "autocomplete": "https://www.startpage.com/cgi-bin/csuggest?query={searchTerms}&limit=10&format=json",
      "anyVisitToBaseDomainIsSearch" : true,
      "shortcut" : ":sp"
    },
    {
      "name" : "Infogalactic",
      "base" : "https://infogalactic.com",
      "image" : "https://infogalactic.com/favicon.ico",
      "localImage" : getFaviconUrl('infogalactic'),
      "search" : "https://infogalactic.com/w/index.php?title=Special:Search&search={searchTerms}",
      "autocomplete": "https://infogalactic.com/w/api.php?action=opensearch&search={searchTerms}&namespace=0",
      "anyVisitToBaseDomainIsSearch" : false,
      "shortcut" : ":i"
    },
    {
      "name" : "Wolfram Alpha",
      "base" : "https://www.wolframalpha.com",
      "image" : "https://www.wolframalpha.com/favicon.ico?v=2",
      "localImage" : getFaviconUrl('wolframalpha'),
      "search" : "https://www.wolframalpha.com/input/?i={searchTerms}",
      "anyVisitToBaseDomainIsSearch" : false,
      "shortcut" : ":wa"
    },
    {
      "name" : "Semantic Scholar",
      "base" : "https://www.semanticscholar.org",
      "image" : "https://www.semanticscholar.org/img/favicon.png",
      "localImage" : getFaviconUrl('semanticscholar', 'png'),
      "search" : "https://www.semanticscholar.org/search?q={searchTerms}",
      "anyVisitToBaseDomainIsSearch" : true,
      "shortcut" : ":ss"
    },
    {
      "name" : "Qwant",
      "base" : "https://www.qwant.com/",
      "image" : "https://www.qwant.com/favicon.ico",
      "localImage" : getFaviconUrl('qwant'),
      "search" : "https://www.qwant.com/?q={searchTerms}&client=brave",
      "autocomplete": "https://api.qwant.com/api/suggest/?q={searchTerms}&client=brave",
      "anyVisitToBaseDomainIsSearch" : true,
      "shortcut" : ":q"
    },
    {
      "name" : "Yandex",
      "base" : "https://yandex.com",
      "image" : "https://www.yandex.com/favicon.ico",
      "localImage" : getFaviconUrl('yandex'),
      "search" : "https://yandex.com/search/?text={searchTerms}&clid=2274777",
      "anyVisitToBaseDomainIsSearch" : true,
      "shortcut" : ":ya"
    },
    {
      "name" : "Ecosia",
      "base" : "https://www.ecosia.org/",
      "image" : "https://cdn.ecosia.org/assets/images/ico/favicon.ico",
      "localImage" : getFaviconUrl('ecosia'),
      "search" : "https://www.ecosia.org/search?q={searchTerms}",
      "autocomplete": "https://ac.ecosia.org/autocomplete?q={searchTerms}&type=list",
      "anyVisitToBaseDomainIsSearch" : true,
      "shortcut" : ":e"
    },
    {
      "name" : "searx",
      "base" : "https://searx.me",
      "image" : "https://searx.me/favicon.ico",
      "localImage" : getFaviconUrl('searx'),
      "search" : "https://searx.me/?q={searchTerms}&categories=general",
      "anyVisitToBaseDomainIsSearch" : true,
      "shortcut" : ":x"
    },
    {
      "name": "findx",
      "base": "https://www.findx.com",
      "image": "https://www.findx.com/favicon.ico",
      "localImage" : getFaviconUrl('findx'),
      "search": "https://www.findx.com/search?q={searchTerms}&type=web",
      "autocomplete": "https://www.findx.com/api/web-search/suggestions/?q={searchTerms}&type=opensearch",
      "anyVisitToBaseDomainIsSearch" : true,
      "shortcut": ":fx"
    }
  ]
}
