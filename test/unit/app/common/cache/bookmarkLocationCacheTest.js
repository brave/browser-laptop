/* global describe, it */

const siteTags = require('../../../../../js/constants/siteTags')
const siteCache = require('../../../../../app/common/cache/bookmarkLocationCache')
const {STATE_SITES} = require('../../../../../js/constants/stateConstants')
const siteUtil = require('../../../../../js/state/siteUtil')
const assert = require('assert')
const Immutable = require('immutable')

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
  const bookmarkKey = siteUtil.getSiteKey(bookmark)
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
      const state = siteCache.generateCache(baseState)
      assert.deepEqual(state.getIn(['cache', 'bookmarkLocation']).toJS(), expectedCache)
    })
  })

  describe('getCacheKey', function () {
    it('returns cached siteKeys', function () {
      const state = siteCache.generateCache(baseState)
      const cachedKeys = siteCache.getCacheKey(state, bookmark.get('location'))
      assert.deepEqual(cachedKeys.toJS(), [bookmarkKey])
    })
    it('returns null when location is not cached', function () {
      const state = siteCache.generateCache(baseState)
      const cachedKeys = siteCache.getCacheKey(state, 'https://archive.org')
      assert.equal(cachedKeys, Immutable.List())
    })
    it('returns null when location is undefined', function () {
      const state = siteCache.generateCache(baseState)
      const cachedKeys = siteCache.getCacheKey(state, undefined)
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
      const siteKey = siteUtil.getSiteKey(site)
      let state = siteCache.generateCache(baseState)
      state = siteCache.addCacheKey(state, bookmarkLocation, siteKey)
      const cachedKeys = siteCache.getCacheKey(state, bookmarkLocation)
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
      const siteKey = siteUtil.getSiteKey(site)
      let state = siteCache.generateCache(baseState)
      state = siteCache.addCacheKey(state, location, siteKey)
      const cachedKeys = siteCache.getCacheKey(state, location)
      assert.deepEqual(cachedKeys.toJS(), [siteKey])
    })
    it('when location is undefined, it no-ops', function () {
      const state = siteCache.addCacheKey(baseState, undefined, '1')
      assert.deepEqual(state.toJS(), baseState.toJS())
    })
    it('when siteKey is undefined, it no-ops', function () {
      const state = siteCache.addCacheKey(baseState, testUrl1, undefined)
      assert.deepEqual(state.toJS(), baseState.toJS())
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
      const siteKey = siteUtil.getSiteKey(site)
      let state = baseState.setIn([STATE_SITES.BOOKMARKS, siteKey], site)
      state = siteCache.generateCache(state)

      // Sanity
      let cachedKeys = siteCache.getCacheKey(state, bookmarkLocation)
      assert.deepEqual(cachedKeys.toJS(), [bookmarkKey, siteKey])

      state = siteCache.removeCacheKey(state, bookmarkLocation, bookmarkKey)
      cachedKeys = siteCache.getCacheKey(state, bookmarkLocation)
      assert.deepEqual(cachedKeys.toJS(), [siteKey])
    })

    it('when removing the last siteKey, removes location', function () {
      let state = siteCache.generateCache(baseState)
      state = siteCache.removeCacheKey(state, bookmarkLocation, bookmarkKey)
      const cachedKeys = siteCache.getCacheKey(state, bookmarkLocation)
      assert.deepEqual(cachedKeys, Immutable.List())
    })
  })
})
