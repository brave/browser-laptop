/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

let cache = {}

chrome.ipcRenderer.on('add-word', (e, word) => {
  cache[word] = true
})

let lang = navigator.language.split('-')[0].split('_')[0]
chrome.webFrame.setSpellCheckProvider(lang || '', true, {
  spellCheck: (word) => {
    if (typeof cache[word] !== 'boolean') {
      const result = !chrome.ipcRenderer.sendSync('is-misspelled', word)
      cache[word] = result
      return result
    } else {
      return cache[word]
    }
  }
})
