/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

module.exports = { "providers" :
  [
    {
      "name" : "Amazon",
      "image" : "http://www.amazon.com/favicon.ico",
      "search" : "http://www.amazon.com/exec/obidos/external-search/?field-keywords={searchTerms}&mode=blended",
      "autocomplete" : "http://completion.amazon.com/search/complete?method=completion&amp;q={searchTerms}&amp;search-alias=aps&amp;client=amazon-search-ui&amp;mkt=1",
      "shortcut" : "a"
    },
    {
      "name" : "Bing",
      "image" : "https://www.bing.com/favicon.ico",
      "search" : "https://www.bing.com/search?q={searchTerms}",
      "autocomplete" : "http://api.bing.com/osjson.aspx?query={searchTerms}&amp;language={language}&amp;form=OSDJAS",
      "shortcut" : "b"
    },
    {
      "name" : "DuckDuckGo",
      "image" : "https://duckduckgo.com/favicon.ico",
      "search" : "https://duckduckgo.com/?q={searchTerms}&amp;t=brave",
      "autocomplete" : "https://ac.duckduckgo.com/ac/?q={searchTerms}&amp;type=list",
      "shortcut" : "d"
    },
    {
      "name" : "Google",
      "image" : "https://www.google.com/favicon.ico",
      "search" : "https://www.google.com/search?q={searchTerms}",
      "autocomplete" : "https://suggestqueries.google.com/complete/search?client=chrome&amp;q={searchTerms}",
      "shortcut" : "g"
    },
    {
      "name" : "Twitter",
      "image" : "https://twitter.com/favicon.ico",
      "search" : "https://twitter.com/search?q={searchTerms}&amp;source=desktop-search",
      "autocomplete" : "https://api.twitter.com/1.1/search/tweets.json?q={searchTerms}",
      "shortcut" : "t"
    },
    {
      "name" : "Wikipedia",
      "image" : "https://en.wikipedia.org/favicon.ico",
      "search" : "http://en.wikipedia.org/wiki/Special:Search?search={searchTerms}",
      "autocomplete": "http://en.wikipedia.org/w/api.php?search={searchTerms}",
      "shortcut" : "w"
    },
    {
      "name" : "Yahoo",
      "image" : "https://search.yahoo.com/favicon.ico",
      "search" : "https://search.yahoo.com/search?p={searchTerms}&amp;fr=opensearch",
      "autocomplete": "https://search.yahoo.com/sugg/os?command={searchTerms}&amp;output=fxjson&amp;fr=opensearch",
      "shortcut" : "y"
    },
    {
      "name" : "Youtube",
      "image" : "https://www.youtube.com/favicon.ico",
      "search" : "https://www.youtube.com/results?search_type=search_videos&amp;search_query={searchTerms}&amp;search_sort=relevance&amp;search_category=0&amp;page=",
      "autocomplete": "http://suggestqueries.google.com/complete/search?output=chrome&amp;client=chrome&amp;hl=it&amp;q={searchTerms}&amp;ds=yt",
      "shortcut" : "yt"
    }
  ]
}

