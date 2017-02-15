/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

module.exports = { "providers" :
  [
    {
      "name" : "Amazon",
      "base" : "https://www.amazon.com",
      "image" : "https://www.amazon.com/favicon.ico",
      "search" : "https://www.amazon.com/exec/obidos/external-search/?field-keywords={searchTerms}&mode=blended",
      "autocomplete" : "https://completion.amazon.com/search/complete?method=completion&q={searchTerms}&search-alias=aps&client=amazon-search-ui&mkt=1",
      "shortcut" : ":a"
    },
    {
      "name" : "Bing",
      "base" : "https://www.bing.com",
      "image" : "https://www.bing.com/favicon.ico",
      "search" : "https://www.bing.com/search?q={searchTerms}",
      "autocomplete" : "https://api.bing.com/osjson.aspx?query={searchTerms}&language={language}&form=OSDJAS",
      "shortcut" : ":b"
    },
    {
      "name" : "DuckDuckGo",
      "base" : "https://duckduckgo.com",
      "image" : "https://duckduckgo.com/favicon.ico",
      "search" : "https://duckduckgo.com/?q={searchTerms}&t=brave",
      "autocomplete" : "https://ac.duckduckgo.com/ac/?q={searchTerms}&type=list",
      "shortcut" : ":d"
    },
    {
      "name" : "GitHub",
      "base" : "https://github.com/search",
      "image" : "https://assets-cdn.github.com/favicon.ico",
      "search" : "https://github.com/search?q={searchTerms}",
      "shortcut" : ":gh"
    },
    {
      "name" : "Google",
      "base" : "https://www.google.com",
      "image" : "https://www.google.com/favicon.ico",
      "search" : "https://www.google.com/search?q={searchTerms}",
      "autocomplete" : "https://suggestqueries.google.com/complete/search?client=chrome&q={searchTerms}",
      "shortcut" : ":g"
    },
    {
      "name" : "Stack Overflow",
      "base" : "https://stackoverflow.com/search",
      "image" : "https://cdn.sstatic.net/sites/stackoverflow/img/favicon.ico",
      "search" : "https://stackoverflow.com/search?q={searchTerms}",
      "shortcut" : ":s"
    },
    {
      "name" : "Mozilla Developer Network (MDN)",
      "base": "https://developer.mozilla.org/search",
      "image" : "https://developer.cdn.mozilla.net/static/img/favicon32.png",
      "search" : "https://developer.mozilla.org/search?q={searchTerms}",
      "shortcut" : ":m"
    },
    {
      "name" : "Twitter",
      "base" : "https://twitter.com",
      "image" : "https://twitter.com/favicon.ico",
      "search" : "https://twitter.com/search?q={searchTerms}&source=desktop-search",
      "shortcut" : ":t"
    },
    {
      "name" : "Wikipedia",
      "base" : "https://en.wikipedia.org",
      "image" : "https://en.wikipedia.org/favicon.ico",
      "search" : "https://en.wikipedia.org/wiki/Special:Search?search={searchTerms}",
      "shortcut" : ":w"
    },
    {
      "name" : "Yahoo",
      "base" : "https://search.yahoo.com",
      "image" : "https://search.yahoo.com/favicon.ico",
      "search" : "https://search.yahoo.com/search?p={searchTerms}&fr=opensearch",
      "autocomplete": "https://search.yahoo.com/sugg/os?command={searchTerms}&output=fxjson&fr=opensearch",
      "shortcut" : ":y"
    },
    {
      "name" : "YouTube",
      "base" : "https://www.youtube.com",
      "image" : "https://www.youtube.com/favicon.ico",
      "search" : "https://www.youtube.com/results?search_type=search_videos&search_query={searchTerms}&search_sort=relevance&search_category=0&page=",
      "autocomplete": "https://suggestqueries.google.com/complete/search?output=chrome&client=chrome&hl=it&q={searchTerms}&ds=yt",
      "shortcut" : ":yt"
    },
    {
      "name" : "StartPage",
      "base" : "https://www.startpage.com",
      "image" : "https://www.startpage.com/graphics/favicon/sp-favicon-16x16.png",
      "search" : "https://www.startpage.com/do/dsearch?query={searchTerms}&cat=web&pl=opensearch",
      "autocomplete": "https://www.startpage.com/cgi-bin/csuggest?query={searchTerms}&limit=10&format=json",
      "shortcut" : ":sp"
    },
    {
      "name" : "Infogalactic",
      "base" : "https://infogalactic.com",
      "image" : "https://infogalactic.com/favicon.ico",
      "search" : "https://infogalactic.com/w/index.php?title=Special:Search&search={searchTerms}",
      "autocomplete": "https://infogalactic.com/w/api.php?action=opensearch&search={searchTerms}&namespace=0",
      "shortcut" : ":i"
    },
    {
      "name" : "Wolfram Alpha",
      "base" : "https://www.wolframalpha.com",
      "image" : "https://www.wolframalpha.com/favicon.ico?v=2",
      "search" : "https://www.wolframalpha.com/input/?i={searchTerms}",
      "shortcut" : ":wa"
    },
    {
      "name" : "Semantic Scholar",
      "base" : "https://www.semanticscholar.org",
      "image" : "https://www.semanticscholar.org/img/favicon.png",
      "search" : "https://www.semanticscholar.org/search?q={searchTerms}",
      "shortcut" : ":ss"
    },
    {
      "name" : "Qwant",
      "base" : "https://www.qwant.com/",
      "image" : "https://www.qwant.com/favicon.ico",
      "search" : "https://www.qwant.com/?q={searchTerms}&client=brave",
      "autocomplete": "https://api.qwant.com/api/suggest/?q={searchTerms}&client=brave",
      "shortcut" : ":q"
    },
    {
      "name" : "Yandex",
      "base" : "https://yandex.com",
      "image" : "https://www.yandex.com/favicon.ico",
      "search" : "https://yandex.com/search/?text={searchTerms}&clid={platformClientId}",
      "shortcut" : ":ya",
      "platformClientId": {
        "win32": 2274777,
        "darwin": 2274776,
        "linux": 2274778
      }
    },
    {
      "name" : "Ecosia",
      "base" : "https://www.ecosia.org/",
      "image" : "https://www.ecosia.org/favicon.ico",
      "search" : "https://www.ecosia.org/search?q={searchTerms}",
      "autocomplete": "https://ac.ecosia.org/autocomplete?q={searchTerms}&type=list",
      "shortcut" : ":e"
    }
  ]
}
