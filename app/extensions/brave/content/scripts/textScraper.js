/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

if(chrome.contentSettings.BATads == "allow") {
  debugger
  const headers = Array.prototype.map.call(document.querySelectorAll('h1, h2, h3, h4'), function(element) {return element.textContent;})
  const body = Array.prototype.map.call(document.querySelectorAll('p'), function(element) {return element.textContent;})
  const scrapeResults = {
    headers: headers,
    body: body,
    url: window.location.href
  }

  chrome.ipcRenderer.send('dispatch-action', JSON.stringify([{
    actionType: 'app-text-scraper-data-available',
    location: window.location.href,
    scrapedData: scrapeResults
  }]))
}


// TODO clean  possibly stem, tokenize here
