/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

module.exports = { "providers" :
  [
    {
      "name" : "Amazon",
      "image" : "data:image/x-icon;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABGdBTUEAAK/INwWK6QAAABl0RVh0U29mdHdhcmUAQWRvYmUgSW1hZ2VSZWFkeXHJZTwAAAHgSURBVHjalFM9TNtQEP4cB7PwM1RITUXIgsRaYEEVEyKZwhiyZAQyd0BhpFOlIjoBqhjSqVQMoVMLLAjEwECCQJkSkBqJYDOAFOMKFSf28d7DTUxiUDnp/Pzeu/vuu7t3ICKF6SLTMv2/lB0fRWKfjwDm4JJisYh0Oo3fpZLYT0SjSCQS8JAFMADNDZ3NZsnf1taiqVTKi4nGASruk5lkkmTmMB6JUKFQqO+DfX1eABWeQoVR6f7HSdM0obqu48Yw8G1tDT82NsRd1TSbU9BbGPCog8PDj+jLzurFoAVgMh4XxoNDQ6SqKi0tL9eBvAB8zZwymYxYY7EYAoEA8vm82BNTg6XUIs0MeGTZoR1mhXSnwNl4pmAbjU7mcjkKhkL1ynMnntZ4OEw3VyrV8utk7s5TdW++0QXz+1i3P7IK36t+PCfVn1OQOoOA0gXr5DPak+cPXbBK+/T3S69AtY3LJ98vZ1or/iLr+pTuvr59/A6s003UdqZFJF/PCKQ3o5CUznoBST2AfbEF/9iqYEDaIfwj73VJPEfgNTe0tWNYR0uwy9uOW0OkrgHI7z5ADo2C7v48nLV3XHKAT+x/1m1sX58xsBxg8rZJrDYD8DHHp4aJj/MK09sXjPOt46PcCzAACXY8/u34wN0AAAAASUVORK5CYII=",
      "search" : "http://www.amazon.com/exec/obidos/external-search/?field-keywords={searchTerms}&mode=blended",
      "autocomplete" : "http://completion.amazon.com/search/complete?method=completion&amp;q={searchTerms}&amp;search-alias=aps&amp;client=amazon-search-ui&amp;mkt=1",
      "shortcut" : "a"
    },
    {
      "name" : "Bing",
      "image" : "data:image/x-icon;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAADBSURBVDhPY+BpaflPCUYxQGPSpP+mM2eiKCCEUQyo37fv/6MPH/7POXv2v3RPD4pCXBjDABAAGQJyDbIcLkxbA4gxBKcBoMBcdeUKODwiVq3CaRheF8D4IHDhxYv/fceOYRhE0AuHHzwAi8EASA2yHoKBCPIKsiFEGwDSmLFpE9jpyAAkhqwHqwGffv7EcDqIDwpMZPUgjNUAZAByDUgcPfBgGMUAkCKQYpAmEMYW6ugYxQAYBvmf2EyF1QDicct/AAVLf1Rr99ZRAAAAAElFTkSuQmCC",
      "search" : "https://www.bing.com/search?q={searchTerms}",
      "autocomplete" : "http://api.bing.com/osjson.aspx?query={searchTerms}&amp;language={language}&amp;form=OSDJAS",
      "shortcut" : "b"
    },
    {
      "name" : "DuckDuckGo",
      "image" : "data:image/x-icon;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAMAAAAoLQ9TAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAB8lBMVEUAAADkRQzjPwPjQQXkRQ3iPwTiQQXgPQPeQgrcOwPVNgDVNQDWOgbTMwDRMgDQMwDSMwDRNwTQLgDRJgDSJwDSLgDSNwTjOgDiOADjOQDkPADhQAXzs5v+/fv////0vKbiRQvgPQHpdUr85NzuknPdKgDcIwDnZzj2w7HqeU/gPQLsimb/+PftjWn97Obpb0LdJQDeLQDtjmvsi2jgSBDnbULgOQD/39HgLQDeMgDpeFLgSBH0v670uqbaJQD2qImWvP/G1Ob5+/3u//+fvvXyp47dMwDaLwD0u6v0v6/aNQDiXi/aKQD3qozU7/8gSY2vvtg0ZK/OqLDaKQHYKgLgWTfaNADZMgDZMADZLADzqpD7//+xwdz//9H/5Bn/7Bn//ADofADYMADYMQDZOgPXLgDiZDj//97/0AD3tQDvlgHZOgbXLATXMADWMgDfXjLVLQD///z+0AD/3Rn/yRnwnQDcVjbVMQDyv67wuKTSJwDRHQD+8O/tg3/iQQDwhAHnawHWMADvtKfyva7XQxHga0bQGQD2vbH/u8LXIQCmPQzja07XQxLliGn99fPkcVHvhnGZ5VguvUU5wktBwCcAgxzydVv/8/XmiGngdlL+ysi3+I8LtCE80V6P3YmX4sDleljSNQLzr6D7sKPXNQTSIwAEAbMrAAAAF3RSTlMARqSkRvPz80PTpKRG3fPe3hio9/eoGP50jNsAAAABYktHRB5yCiArAAAAyElEQVQYGQXBvUqCYRiA4fu2V9Tn+UQddI3aCpxaOoU6iU4gcqqpoYbALXBuCuoYmttamqJDiEoh4YP+MOi6BNCh+uYKEGiOVNCXXxA2XDVV/UyfKbRCXTLQWAxbP2vt8Ue/uYDvfim91615sb2um6rqtrr/NFb1cUf1Ybd06areU6lSlYpK79jzK1SyJOkfhOl8JGEcqV5zoKrTRqO6yUzIzNu46ijdM1VV9bhuUJ/nZURExLRzUiPQm3kKXHi4BAEGOmOi78A/L1QoU/VHoTsAAAAldEVYdGRhdGU6Y3JlYXRlADIwMTQtMDEtMTlUMjA6MDE6MTEtMDU6MDAuET6cAAAAJXRFWHRkYXRlOm1vZGlmeQAyMDE0LTAxLTE5VDIwOjAxOjExLTA1OjAwX0yGIAAAAABJRU5ErkJggg==",
      "search" : "https://duckduckgo.com/?q={searchTerms}&amp;t=brave",
      "autocomplete" : "https://ac.duckduckgo.com/ac/?q={searchTerms}&amp;type=list",
      "shortcut" : "d"
    },
    {
      "name" : "Google",
      "image" : "data:image/x-icon;base64,AAABAAIAEBAAAAAAAAB9AQAAJgAAACAgAAAAAAAA8gIAAKMBAACJUE5HDQoaCgAAAA1JSERSAAAAEAAAABAIBgAAAB/z/2EAAAFESURBVDjLpZNJSwNBEIXnt4lE4kHxovgT9BDwJHqPy0HEEOJBiAuCRg+KUdC4QS4KrpC4gCBGE3NQ48JsnZ6eZ3UOM6gjaePhQU93v6+qq2q0pqgeJj2S8EdJT1hr0OxBtKCD5iEd8QxDYpvhvOBAuMDKURX9C9aPu4GA1GEVkzvMg10UBfYveWAWgYAP00V01fa+R9M2bA51wJvhIn3qR+ybt3D3JNQBE5sMjCIOLFpoHzOwdsLRO22qA6R6kiZiWwxUvy/PUQZIhYZ1vFM9cvcOOsYNdcBgysISdSJBnZjJMlR0Fw8vAp0xoz5gao/h+NZBy4i/10XGwrPA+hmvDyhVRG2Avu/LwcrkFADZa16L1h330w1RNgc3DiJzCpPYRm1bpveXX11clQR28xwblHpk1vq1iP/5mcoS0CoXDZiL0vsJ+dzfl+3T/VYAAAAASUVORK5CYIKJUE5HDQoaCgAAAA1JSERSAAAAIAAAACAIBgAAAHN6evQAAAK5SURBVFjDxVfrSxRRFJ9/Jta/oyWjF5XQm6D6EkHRgygIIgjUTcueVgqVWSRRkppEUQYWWB8ye1iGWilWlo/Ude489s7M6Zw7D9dlt53dmd29cFiWvXvO77x+51xpaaUsoSxBaUWZQ4ECy5xji2xKZDyCMlMEw6lCNiOSgwZKJK1SkcKeSealfP64t0mBjl4Ow39MkDUL0p2RSROOtqhZdeUEYM1pBl39XCg/fEeFtWcY7G9W4csvUxjlBkCsQ4Nt9QyWVfvT6RsAKXw3aoDGATZeYIt+W1kjw7cJG0RctWDTRebbKd8A6h5pwsDb70ba3w/eUr3wt/cmwgfw6Yft4TNMQaY7o1P2ncm4FT4ANQH/jQBJ2xv7kqIXEADDql8eS3+n8bku7oxNm+EDIM/dU92upb3T/NJGeaNbDx/AsbsLRUY5Xn92caWXY5d8RV6gWllxSg4fAEnTC90DQW13BLlgXR2D3dcUeDVkwOthA1bXspxILWcm3HdThcfvufB26LcJpkOEAz9NKI/lzqpSEC7feol5EWnpSeSlIxCALUkApmULdjUqxQVAQnl3D/X/yQda4QBEq2TYc12By091MQ17Bg3R88nHKlQbVmHvj89awNBLYrwT9zXY2aBAxTkGFdiSxP/Jp6FLDw+AS7GfsdJTJ2EqSO5khD43nGfBARy/ZxOQgZHe7GPM1jzUvChUtmnBAXQPcKGMJp3fdFGq6NByEhiAO4b/YptFfQJwNyQ/bZkVQGcf90Ja25ndIyrKBOa/f8wIpwi3X1G8UcxNu7ozUS7tiH0jBswwS3RIaF1w6LYKU/ML2+8sGnjygQswtKrVIy/Qd9qQP6LnO64q4fPAKpxyZIymHo1jWk6p1ag2BsdNwQMHcC+M5kHFJX+YlPxpVlbCx2mZ5DzPI04k4kUwHHdskU3pH76iftG8yWlkAAAAAElFTkSuQmCC",
      "search" : "https://www.google.com/search?q={searchTerms}",
      "autocomplete" : "https://suggestqueries.google.com/complete/search?client=chrome&amp;q={searchTerms}",
      "shortcut" : "g"
    },
    {
      "name" : "Twitter",
      "image" : "data:;base64,AAABAAEAEBAAAAEAIABoBAAAFgAAACgAAAAQAAAAIAAAAAEAIAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wz///8f////H////x////8Y////B////wD///8A////AP///wD///8A////AP///wD///8A////A////yj7789g9tV+ofbVfqH21X6h+N+eifz03lf///8o////A////wD///8A////AP///wD///8A////APr37g/PsGCftogQ7r2JAP/bnwD/7qwA/+6sAP/urAD/9Mtftv357z////8D////AP///wD///8A////AP///wD///8A////AP///w/57c5a88VQwu6sAP/urAD/7qwA/+6sAP/xvDDb/fnvP////wD///8A////AP///wD///8A////AP///wDz5L5X7bgv2+6sAP/urAD/7qwA/+6sAP/urAD/7qwA//G8MNv///8Y////AP///wD///8A////AP///wD///8M9NN+n+6wD/PurAD/7qwA/+6sAP/urAD/7qwA/+6sAP/urAD/9Nyegf///wD///8A////AP///wD///8A+O3PVu6wD/PurAD/7qwA/+6sAP/urAD/7qwA/+6sAP/urAD/7qwA//G8MNv///8A////AP///wD///8A////ANasQMXurAD/7qwA/+qpAP/YnAD/1JkA/+6sAP/urAD/7qwA/+6sAP/urAD/////FP///wD///8A////AP///wDz255+7qwA/9icAP+6ixDuz7Bgn9m8b5TurAD/7qwA/+6sAP/urAD/7qwA//jkr3j///8M////AP///wD///8A47Y/ysmRAP/PsGCf+vfuD////wDw584w46QA/+6sAP/urAD/7qwA/9+hAP/orA/z9OrPQv///wD///8A////AMypT7Hhz55g////AP///wD///8A////AMOaL9DMlAD/0JYA/8mRAP/FoEC/vpIf4OPQnmL///8A////AP///wD69+4P////AP///wD///8A////AP///wD69+4P3ceOcNi/foHhz55g////APr37g/69+4P////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A//8AAP//AAD//wAA8P8AAMA/AAD4HwAA8A8AAOAHAADgBwAAwAcAAOAHAADHAwAA3wMAAP/fAAD//wAA//8AAA==",
      "search" : "https://twitter.com/search?q={searchTerms}&amp;source=desktop-search",
      "autocomplete" : "https://api.twitter.com/1.1/search/tweets.json?q={searchTerms}",
      "shortcut" : "t"
    },
    {
      "name" : "Wikipedia",
      "image" : "data:image/x-icon;base64,AAABAAEAEBAQAAEABAAoAQAAFgAAACgAAAAQAAAAIAAAAAEABAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAEAgQAhIOEAMjHyABIR0gA6ejpAGlqaQCpqKkAKCgoAPz9%2FAAZGBkAmJiYANjZ2ABXWFcAent6ALm6uQA8OjwAiIiIiIiIiIiIiI4oiL6IiIiIgzuIV4iIiIhndo53KIiIiB%2FWvXoYiIiIfEZfWBSIiIEGi%2FfoqoiIgzuL84i9iIjpGIoMiEHoiMkos3FojmiLlUipYliEWIF%2BiDe0GoRa7D6GPbjcu1yIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
      "search" : "http://en.wikipedia.org/wiki/Special:Search?search={searchTerms}",
      "autocomplete": "http://en.wikipedia.org/w/api.php?search={searchTerms}",
      "shortcut" : "w"
    },
    {
      "name" : "Yahoo",
      "image" : "data:image/x-icon;base64,AAABAAIAEBAAAAEAIABoBAAAJgAAAAgIAAABACAASAEAAI4EAAAoAAAAEAAAACAAAAABACAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAewE4824BNLJvADJ1cAQ3UW8IOCgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABwCDknbQQ1UW8AM3VuATSyegE383sAN/91ADT/dQA1/3QANf90ATX/dAI2/3QDNv90Azb/dAM2/3QDNv9zAjb/cwI1/3MBNP93ADb/dAA0/3oAN/99ADj/ewA3/3sBN/99Ajn/gAM7/4IEPf+BBT3/egAy/3kAMv9/BTz/gAU8/30EO/+AAjv/fQE5/3gANv98ADj/fgA4/4IAO/+EAjz/hgM9/4kEQP+LBkH/hwA6//Tl7P/05u3/hgA6/4oGQf+JBUD/iQQ//4cCPf+BATr/fgA4/4EAOf+LAT//jANA/44EQv+SBkT/kgdF/5IAQf/s0t7/7dTf/5IAQf+VCEf/kwdG/5IFRP+PBEH/iQI+/34BOf+AADr/lAFC/5YDRf+ZBUb/mwdJ/50IS/+bA0b/6srZ/+vM2v+bA0b/mwpK/5sISf+bBkj/mQVG/4wDQP+AADr/hgA8/5oCRf+gBEj/owZL/6UITf+nCk//pgVM/+nB0//pwtT/pgVN/6kKUf+lCU7/owdM/54FSP+WA0X/gQE6/4YAPP+fAkj/qgRO/6wHT/+uCFH/rgtS/60BTv/z2eT/8tnl/60CTv+wC1X/rQlS/6wIUP+pBk7/lgRF/4YBPP+HAD3/pwNL/7MFUf+0BlP/tAhU/7cLVv/HQ33////////////KRYD/tgtW/7cJVv+0CFP/rAVP/5sER/+GAT3/iAE9/60CTv++BFb/vwZY/8AIWf+9AFH/9tzn//TX5P/01uT/993p/7wAUv/ACFr/vwdY/7QEUv+hA0n/gwE7/4oAPf+0AlD/xQNZ/8QFWf/EB1v/2ViR///////RQID/0T+A///////ZW5L/xwhd/8YGW/+9BFb/pQJK/4EAOv+NAD//twFS/8gCWv/JBFv/xgBT//34+v/wvdP/xABX/8UBV//wu9P//vn7/8cAVP/KBF3/wANX/6kCTP+BADr/iwA+/7cAUv/HAVr/xQFY/+OIsP//////xBxn/74GWP+/B1n/xBpm///////jirH/xgFZ/8ICV/+vAE//igA9/4gAPP+qAEz/tABR/68AS//SfqT/xlmK/6oBTP+qBU7/qQRN/6gCTP/GV4j/0nui/7EATP+vAU7/mgBF/4MAO/+CADr/jAA+/5wARf+IAD3/jgFA/4ABO/99Ajr/gwI9/4cCPv9/Ajv/jAFA/4oBPv+UAEL/mQBE/4cAPf9/ADn/fAE483oBOLR1ADZ2cwQ3UnAHOCgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABqCDUndQQ4UoAAOnZ7ATi0fAE48z/8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/8AAAoAAAACAAAABAAAAABACAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAbwAz/3IANMpzAjWIagApiGoAKYhzAjWIcgA0ym8AM/93ADX/ggI6/4IDPP/Tkq3/05Gs/4IDPP+DAjr/dwA1/38BOPyVBET/lwZH/8uDo//Lg6P/mAZH/5UERP9/ATj8iAE976YFS/+nBU7/4KC4/96ctf+oBU7/pQVM/4gBPe+MAT/vtgVT/7sWW//8+fj/+evw/7sWXP+1BVL/jAE/75UBQ/zFAFX/68LV/9ZYj//WV43/5a3F/8YAVv+UAUL8kwBA/8tUhP/12OX/tQBN/7YATf/22+j/ylGB/5IAQP93ADb/hAA4yoIAMomCAjuHggI6iIIAMoiDADfKdgA2/wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
      "search" : "https://search.yahoo.com/search?p={searchTerms}&amp;fr=opensearch",
      "autocomplete": "https://search.yahoo.com/sugg/os?command={searchTerms}&amp;output=fxjson&amp;fr=opensearch",
      "shortcut" : "y"
    },
    {
      "name" : "Youtube",
      "image" : "data:image/x-icon;base64,AAABAAEAEBAAAAEAIABoBAAAFgAAACgAAAAQAAAAIAAAAAEAIAAAAAAAQAQAABMLAAATCwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgNkQkIDZGiCA2RzAgNkcwIDZH/CA2R/wgNkf8IDZH/CA2R/wgNkf8IDZH/CA2R2AgNkcwIDZHMCA2RhAgNkQYIDpWHCA6V/wgOlf8IDpX/CA6V/wgOlf8IDpX/CA6V/wgOlf8IDpX/CA6V/wgOlf8IDpX/CA6V/wgOlf8IDpWHCQ6ZzAkOmf8JDpn/CQ6Z/wkOmf8JDpb/BQhc/wgMgf8JDpn/CQ6Z/wkOmf8JDpn/CQ6Z/wkOmf8JDpn/CQ6ZzAkOnuoJDp7/CQ6e/wkOnv8JDp7/Exed/8jIy/9RU4j/Bwp0/wkOm/8JDp7/CQ6e/wkOnv8JDp7/CQ6e/wkOnuoJD6T8CQ+k/wkPpP8JD6T/CQ+k/xUbo//V1dX/1dXV/4yNrP8QFG//CA6Y/wkPpP8JD6T/CQ+k/wkPpP8JD6T8CQ+q/wkPqv8JD6r/CQ+q/wkPqv8WG6n/3d3d/93d3f/d3d3/v7/M/y0wjv8JD6r/CQ+q/wkPqv8JD6r/CQ+q/woQr/8KEK//ChCv/woQr/8KEK//Fx2v/+fn5//n5+f/5+fn/+jo6P+YmtP/ChCv/woQr/8KEK//ChCv/woQr/8KELX8ChC1/woQtf8KELX/ChC1/xgdtf/x8fH/8fHx//Ly8v+bndv/Ehi3/woQtf8KELX/ChC1/woQtf8KELX8ChG76goRu/8KEbv/ChG7/woRu/8YH77/+fn5/+/v9/9fY9H/ChG7/woRu/8KEbv/ChG7/woRu/8KEbv/ChG76goRwMwKEcD/ChHA/woRwP8KEcD/EBfB/6Ol5/8tM8n/ChHA/woRwP8KEcD/ChHA/woRwP8KEcD/ChHA/woRwMwLEcSHCxHE/wsRxP8LEcT/CxHE/wsRxP8LEcT/CxHE/wsRxP8LEcT/CxHE/wsRxP8LEcT/CxHE/wsRxP8LEcSHCxLICQsSyKULEsjMCxLI+QsSyP8LEsj/CxLI/wsSyP8LEsj/CxLI/wsSyP8LEsj/CxLI0gsSyMwLEsiiAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//8AAP//AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAD//wAA//8AAA==",
      "search" : "https://www.youtube.com/results?search_type=search_videos&amp;search_query={searchTerms}&amp;search_sort=relevance&amp;search_category=0&amp;page=",
      "autocomplete": "http://suggestqueries.google.com/complete/search?output=chrome&amp;client=chrome&amp;hl=it&amp;q={searchTerms}&amp;ds=yt",
      "shortcut" : "yt"
    }
  ]
}

