/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

/* global describe, it */

const siteTags = require('../../../../../js/constants/siteTags')
const bookmarkLocationCache = require('../../../../../app/common/cache/bookmarkLocationCache')
const {STATE_SITES} = require('../../../../../js/constants/stateConstants')
const assert = require('assert')
const Immutable = require('immutable')
const bookmarkUtil = require('../../../../../app/common/lib/bookmarkUtil')

describe('bookmarkLocationCache unit test', function () {
  const testUrl1 = 'https://brave.com/'
  const bookmark = Immutable.fromJS({
    lastAccessedTime: 123,
    objectId: [210, 115, 31, 176, 57, 212, 167, 120, 104, 88, 88, 27, 141, 36, 235, 226],
    type: siteTags.BOOKMARK,
    location: testUrl1,
    title: 'sample',
    parentFolderId: 0,
    partitionNumber: 0
  })
  const bookmarkLocation = bookmark.get('location')
  const bookmarkKey = bookmarkUtil.getKey(bookmark)
  const baseState = Immutable.fromJS({
    bookmarks: {
      [bookmarkKey]: bookmark
    }
  })

  describe('generateCache', function () {
    it('creates cache based on sites with location', function () {
      const expectedCache = {
        [bookmark.get('location')]: [bookmarkKey]
      }
      const state = bookmarkLocationCache.generateCache(baseState)
      assert.deepEqual(state.getIn(['cache', 'bookmarkLocation']).toJS(), expectedCache)
    })
    it('dont generate cache if already exists', function () {
      const newCache = {
        'https://clifton.io': ['https://clifton.io|0|0']
      }
      const newState = baseState.setIn(['cache', 'bookmarkLocation'], Immutable.fromJS(newCache))
      const state = bookmarkLocationCache.generateCache(newState)
      assert.deepEqual(state.getIn(['cache', 'bookmarkLocation']).toJS(), newCache)
    })
  })

  describe('getCacheKey', function () {
    it('returns cached siteKeys', function () {
      const state = bookmarkLocationCache.generateCache(baseState)
      const cachedKeys = bookmarkLocationCache.getCacheKey(state, bookmark.get('location'))
      assert.deepEqual(cachedKeys.toJS(), [bookmarkKey])
    })
    it('returns null when location is not cached', function () {
      const state = bookmarkLocationCache.generateCache(baseState)
      const cachedKeys = bookmarkLocationCache.getCacheKey(state, 'https://archive.org')
      assert.equal(cachedKeys, Immutable.List())
    })
    it('returns null when location is undefined', function () {
      const state = bookmarkLocationCache.generateCache(baseState)
      const cachedKeys = bookmarkLocationCache.getCacheKey(state, undefined)
      assert.equal(cachedKeys, Immutable.List())
    })
  })

  describe('addCacheKey', function () {
    it('when location is already cached, it appends', function () {
      const site = Immutable.fromJS({
        lastAccessedTime: 1477944718877,
        location: bookmarkLocation,
        title: 'different',
        parentFolderId: 1,
        type: siteTags.BOOKMARK
      })
      const siteKey = bookmarkUtil.getKey(site)
      let state = bookmarkLocationCache.generateCache(baseState)
      state = bookmarkLocationCache.addCacheKey(state, bookmarkLocation, siteKey)
      const cachedKeys = bookmarkLocationCache.getCacheKey(state, bookmarkLocation)
      assert.deepEqual(cachedKeys.toJS(), [bookmarkKey, siteKey])
    })
    it('when location is new, it creates a list with the key', function () {
      const location = 'https://archive.org'
      const site = Immutable.fromJS({
        lastAccessedTime: 1477944718877,
        location,
        title: 'different',
        type: siteTags.BOOKMARK
      })
      const siteKey = bookmarkUtil.getKey(site)
      let state = bookmarkLocationCache.generateCache(baseState)
      state = bookmarkLocationCache.addCacheKey(state, location, siteKey)
      const cachedKeys = bookmarkLocationCache.getCacheKey(state, location)
      assert.deepEqual(cachedKeys.toJS(), [siteKey])
    })
    it('when location is undefined, it no-ops', function () {
      const state = bookmarkLocationCache.addCacheKey(baseState, undefined, '1')
      assert.deepEqual(state.toJS(), baseState.toJS())
    })
    it('when siteKey is undefined, it no-ops', function () {
      const state = bookmarkLocationCache.addCacheKey(baseState, testUrl1, undefined)
      assert.deepEqual(state.toJS(), baseState.toJS())
    })
    it('when location is already cached and key already exists', function () {
      let state = bookmarkLocationCache.generateCache(baseState)
      state = bookmarkLocationCache.addCacheKey(state, bookmarkLocation, bookmarkKey)
      const cachedKeys = bookmarkLocationCache.getCacheKey(state, bookmarkLocation)
      assert.deepEqual(cachedKeys.toJS(), [bookmarkKey])
    })
  })

  describe('removeCacheKey', function () {
    it('removes cached siteKeys', function () {
      // Same location, different siteKey
      const site = Immutable.fromJS({
        lastAccessedTime: 1477944718877,
        location: bookmarkLocation,
        title: 'different',
        parentFolderId: 1,
        type: siteTags.BOOKMARK
      })
      const siteKey = bookmarkUtil.getKey(site)
      let state = baseState.setIn([STATE_SITES.BOOKMARKS, siteKey], site)
      state = bookmarkLocationCache.generateCache(state)

      // Sanity
      let cachedKeys = bookmarkLocationCache.getCacheKey(state, bookmarkLocation)
      assert.deepEqual(cachedKeys.toJS(), [bookmarkKey, siteKey])

      state = bookmarkLocationCache.removeCacheKey(state, bookmarkLocation, bookmarkKey)
      cachedKeys = bookmarkLocationCache.getCacheKey(state, bookmarkLocation)
      assert.deepEqual(cachedKeys.toJS(), [siteKey])
    })

    it('when removing the last siteKey, removes location', function () {
      let state = bookmarkLocationCache.generateCache(baseState)
      state = bookmarkLocationCache.removeCacheKey(state, bookmarkLocation, bookmarkKey)
      const cachedKeys = bookmarkLocationCache.getCacheKey(state, bookmarkLocation)
      assert.deepEqual(cachedKeys, Immutable.List())
    })
    it('when location is undefined, it no-ops', function () {
      const state = bookmarkLocationCache.removeCacheKey(baseState, undefined, '1')
      assert.deepEqual(state.toJS(), baseState.toJS())
    })
    it('when siteKey is undefined, it no-ops', function () {
      const state = bookmarkLocationCache.removeCacheKey(baseState, testUrl1, undefined)
      assert.deepEqual(state.toJS(), baseState.toJS())
    })
    it('when siteKey is not in the cache', function () {
      const state = bookmarkLocationCache.removeCacheKey(baseState, testUrl1, '10')
      assert.deepEqual(state.toJS(), baseState.toJS())
    })
  })
})
