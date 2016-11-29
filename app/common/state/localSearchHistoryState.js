/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const Immutable = require('immutable')

const localSearchHistoryState = {
  // update the timestamp for an existing local search history item
  update: (localSearchTerms, localSearchDetails) => {
    let entryIndex = localSearchTerms.findIndex((history) => {
      return history.get('searchTerm') === localSearchDetails.get('searchTerm')
    })
    if (entryIndex !== -1) {
      let entry = localSearchTerms.get(entryIndex)
      entry = entry.set('ts', (new Date()).getTime())
      localSearchTerms.set(entryIndex, entry)
    } else {
      localSearchTerms = localSearchTerms.push(localSearchDetails)
    }
    return localSearchTerms
  },

  // build a new entry
  buildEntry: (searchTerm) => {
    return {
      ts: (new Date()).getTime(),
      searchTerm: searchTerm
    }
  },

  // clear search terms
  clear: () => {
    return Immutable.fromJS([])
  }
}

module.exports = localSearchHistoryState
