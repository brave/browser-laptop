/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

module.exports = { "providers" :
  [
    {
      "name" : "Amazon",
      "base" : "https://www.amazon.com",
      "image" : `${this.base}/favicon.ico`,
      "search" : `${this.base}/exec/obidos/external-search/?field-keywords={searchTerms}&mode=blended`,
      "autocomplete" : "https://completion.amazon.com/search/complete?method=completion&q={searchTerms}&search-alias=aps&client=amazon-search-ui&mkt=1",
      "shortcut" : "a"
    },
    {
      "name" : "Bing",
      "base" : "https://www.bing.com",
      "image" : `${this.base}/favicon.ico`,
      "search" : `${this.base}/search?q={searchTerms}`,
      "autocomplete" : "https://api.bing.com/osjson.aspx?query={searchTerms}&language={language}&form=OSDJAS",
      "shortcut" : "b"
    },
    {
      "name" : "DuckDuckGo",
      "base" : "https://duckduckgo.com",
      "image" : `${this.base}/favicon.ico`,
      "search" : `${this.base}/?q={searchTerms}&t=brave`,
      "autocomplete" : "https://ac.duckduckgo.com/ac/?q={searchTerms}&type=list",
      "shortcut" : "d"
    },
    {
      "name" : "Google",
      "base" : "https://www.google.com",
      "image" : `${this.base}/favicon.ico`,
      "search" : `${this.base}/search?q={searchTerms}`,
      "autocomplete" : "https://suggestqueries.google.com/complete/search?client=chrome&q={searchTerms}",
      "shortcut" : "g"
    },
    {
      "name" : "Twitter",
      "base" : "https://twitter.com",
      "image" : `${this.base}/favicon.ico`,
      "search" : `${this.base}/search?q={searchTerms}&source=desktop-search`,
      "shortcut" : "t"
    },
    {
      "name" : "Wikipedia",
      "base" : "https://en.wikipedia.org",
      "image" : `${this.base}/favicon.ico`,
      "search" : "https://en.wikipedia.org/wiki/Special:Search?search={searchTerms}",
      "shortcut" : "w"
    },
    {
      "name" : "Yahoo",
      "base" : "https://search.yahoo.com",
      "image" : `${this.base}/favicon.ico`,
      "search" : "https://search.yahoo.com/search?p={searchTerms}&fr=opensearch",
      "autocomplete": "https://search.yahoo.com/sugg/os?command={searchTerms}&output=fxjson&fr=opensearch",
      "shortcut" : "y"
    },
    {
      "name" : "Youtube",
      "base" : "https://www.youtube.com",
      "image" : `${this.base}/favicon.ico`,
      "search" : `${this.base}/results?search_type=search_videos&search_query={searchTerms}&search_sort=relevance&search_category=0&page=`,
      "autocomplete": "https://suggestqueries.google.com/complete/search?output=chrome&client=chrome&hl=it&q={searchTerms}&ds=yt",
      "shortcut" : "yt"
    }
  ]
}
