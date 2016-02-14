/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const Config = require('../constants/config.js')
import Immutable from 'immutable'

/**
 * Loads the specified open search path and resolves the returned promise.
 */
export function loadOpenSearch (path) {
  return new Promise(resolve => {
    const xhr = new window.XMLHttpRequest()
    xhr.open('GET', path || Config.defaultOpenSearchPath, true)
    xhr.send()
    xhr.onload = () => {
      const parser = new window.DOMParser()
      const doc = parser.parseFromString(xhr.responseText, 'text/xml')
      window.doc = doc
      let searchURL
      let autocompleteURL

      try {
        searchURL = doc.querySelector('Url[type="text/html"]')
          .attributes.template.value
      } catch (e) {
        console.warn('Search provider does not specify a search url.')
      }

      try {
        autocompleteURL = doc.querySelector('Url[type="application/x-suggestions+json"]')
          .attributes.template.value
      } catch (e) {
        console.warn('Search provider does not specify an autocomplete url.')
      }

      resolve(Immutable.fromJS({
        searchURL,
        autocompleteURL
      }))
    }
  })
}
