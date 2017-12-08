/* global describe, it */

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const Immutable = require('immutable')
const { assert } = require('chai')
const urlBarState = require('../../../../../app/common/state/urlBarState')

describe('urlBarState', function () {
  describe('getSearchData', function () {
    const searchUrlDefault = 'url1'
    const searchUrlDefaultPrivate = 'url2'
    const searchUrlFrameOverride = 'url3'
    const searchUrlFrameOverridePrivate = 'url4'

    const activeFrameNoSearchOverride = Immutable.fromJS({
    })

    const privateActiveFrameNoSearchOverride = Immutable.fromJS({
      isPrivate: true
    })

    const privateActiveFrameWithSearchOverride = Immutable.fromJS({
      isPrivate: true,
      navbar: {
        urlbar: {
          searchDetail: {
            activateSearchEngine: true,
            search: searchUrlFrameOverride
          }
        }
      }
    })

    const privateActiveFrameWithSearchOverrideAndPrivateUrl = Immutable.fromJS({
      isPrivate: true,
      navbar: {
        urlbar: {
          searchDetail: {
            activateSearchEngine: true,
            search: searchUrlFrameOverride,
            privateSearch: searchUrlFrameOverridePrivate
          }
        }
      }
    })

    const activeFrameWithSearchOverrideAndPrivateUrl =
      privateActiveFrameWithSearchOverrideAndPrivateUrl.set('isPrivate', false)

    const appStateWithDefaultSearch = Immutable.fromJS({
      searchDetail: {
        searchURL: searchUrlDefault
      }
    })

    const appStateWithDefaultSearchAndPrivateUrl =
      appStateWithDefaultSearch.setIn(['searchDetail', 'privateSearchURL'], searchUrlDefaultPrivate)

    it('gets default search url', function () {
      const actual = urlBarState.getSearchData(
        appStateWithDefaultSearch,
        activeFrameNoSearchOverride
      )
      const expectedSearchUrl = searchUrlDefault
      assert.equal(actual.searchURL, expectedSearchUrl)
    })

    it('gets default search url with private tab', function () {
      const actual = urlBarState.getSearchData(
        appStateWithDefaultSearch,
        privateActiveFrameNoSearchOverride
      )
      const expectedSearchUrl = searchUrlDefault
      assert.equal(actual.searchURL, expectedSearchUrl)
    })

    it('gets the default search private url in private tab', function () {
      const actual = urlBarState.getSearchData(
        appStateWithDefaultSearchAndPrivateUrl,
        privateActiveFrameNoSearchOverride
      )
      const expectedSearchUrl = searchUrlDefaultPrivate
      assert.equal(actual.searchURL, expectedSearchUrl)
    })

    it('gets the overriden non-private search url in non-private tab', function () {
      const actual = urlBarState.getSearchData(
        appStateWithDefaultSearchAndPrivateUrl,
        activeFrameWithSearchOverrideAndPrivateUrl
      )
      const expectedSearchUrl = searchUrlFrameOverride
      assert.equal(actual.searchURL, expectedSearchUrl)
    })

    it('gets the overriden non-private search url in a private tab, where there is no private search url', function () {
      const actual = urlBarState.getSearchData(
        appStateWithDefaultSearchAndPrivateUrl,
        privateActiveFrameWithSearchOverride
      )
      const expectedSearchUrl = searchUrlFrameOverride
      assert.equal(actual.searchURL, expectedSearchUrl)
    })

    it('gets the overriden private search url in a private tab', function () {
      const actual = urlBarState.getSearchData(
        appStateWithDefaultSearchAndPrivateUrl,
        privateActiveFrameWithSearchOverrideAndPrivateUrl
      )
      const expectedSearchUrl = searchUrlFrameOverridePrivate
      assert.equal(actual.searchURL, expectedSearchUrl)
    })
  })
})
