/* global describe, it */

const siteTags = require('../../../js/constants/siteTags')
const siteCache = require('../../../js/state/siteCache')
const siteUtil = require('../../../js/state/siteUtil')
const assert = require('assert')
const Immutable = require('immutable')
// const mockery = require('mockery')
// const settings = require('../../../js/constants/settings')

describe('siteCache', function () {
  const testUrl1 = 'https://brave.com/'
  const testUrl2 = 'http://example.com/'
  const bookmark = Immutable.fromJS({
    lastAccessedTime: 123,
    objectId: [210, 115, 31, 176, 57, 212, 167, 120, 104, 88, 88, 27, 141, 36, 235, 226],
    tags: [siteTags.BOOKMARK],
    location: testUrl1,
    title: 'sample',
    parentFolderId: 0,
    partitionNumber: 0
  })
  const bookmarkLocation = bookmark.get('location')
  const bookmarkKey = siteUtil.getSiteKey(bookmark)
  const folder = Immutable.fromJS({
    customTitle: 'folder1',
    folderId: 1,
    parentFolderId: 0,
    tags: [siteTags.BOOKMARK_FOLDER]
  })
  const folderKey = siteUtil.getSiteKey(folder)
  const historySite = Immutable.fromJS({
    lastAccessedTime: 1477944718876,
    location: testUrl2,
    title: 'sample 1',
    tags: []
  })
  const historySiteKey = siteUtil.getSiteKey(historySite)
  const baseState = Immutable.fromJS({
    sites: {
      [bookmarkKey]: bookmark,
      [historySiteKey]: historySite,
      [folderKey]: folder
    }
  })

  describe('loadLocationSiteKeysCache', function () {
    it('creates cache based on sites with location', function () {
      const expectedCache = {
        [bookmark.get('location')]: [bookmarkKey],
        [historySite.get('location')]: [historySiteKey]
      }
      const state = siteCache.loadLocationSiteKeysCache(baseState)
      assert.deepEqual(state.get('locationSiteKeysCache').toJS(), expectedCache)
    })
  })

  describe('getLocationSiteKeys', function () {
    it('returns cached siteKeys', function () {
      const state = siteCache.loadLocationSiteKeysCache(baseState)
      const cachedKeys = siteCache.getLocationSiteKeys(state, bookmark.get('location'))
      assert.deepEqual(cachedKeys.toJS(), [bookmarkKey])
    })
    it('returns null when location is not cached', function () {
      const state = siteCache.loadLocationSiteKeysCache(baseState)
      const cachedKeys = siteCache.getLocationSiteKeys(state, 'https://archive.org')
      assert.equal(cachedKeys, null)
    })
    it('returns null when location is undefined', function () {
      const state = siteCache.loadLocationSiteKeysCache(baseState)
      const cachedKeys = siteCache.getLocationSiteKeys(state, undefined)
      assert.equal(cachedKeys, null)
    })
  })

  describe('addLocationSiteKey', function () {
    it('when location is already cached, it appends', function () {
      const site = Immutable.fromJS({
        lastAccessedTime: 1477944718877,
        location: bookmarkLocation,
        title: 'different',
        parentFolderId: folder.get('folderId'),
        tags: [siteTags.BOOKMARK]
      })
      const siteKey = siteUtil.getSiteKey(site)
      let state = siteCache.loadLocationSiteKeysCache(baseState)
      state = siteCache.addLocationSiteKey(state, bookmarkLocation, siteKey)
      const cachedKeys = siteCache.getLocationSiteKeys(state, bookmarkLocation)
      assert.deepEqual(cachedKeys.toJS(), [bookmarkKey, siteKey])
    })
    it('when location is new, it creates a list with the key', function () {
      const location = 'https://archive.org'
      const site = Immutable.fromJS({
        lastAccessedTime: 1477944718877,
        location,
        title: 'different',
        tags: [siteTags.BOOKMARK]
      })
      const siteKey = siteUtil.getSiteKey(site)
      let state = siteCache.loadLocationSiteKeysCache(baseState)
      state = siteCache.addLocationSiteKey(state, location, siteKey)
      const cachedKeys = siteCache.getLocationSiteKeys(state, location)
      assert.deepEqual(cachedKeys.toJS(), [siteKey])
    })
    it('when location is undefined, it no-ops', function () {
      const state = siteCache.addLocationSiteKey(baseState, undefined, '1')
      assert.deepEqual(state.toJS(), baseState.toJS())
    })
    it('when siteKey is undefined, it no-ops', function () {
      const state = siteCache.addLocationSiteKey(baseState, testUrl1, undefined)
      assert.deepEqual(state.toJS(), baseState.toJS())
    })
  })

  describe('removeLocationSiteKey', function () {
    it('removes cached siteKeys', function () {
      // Same location, different siteKey
      const site = Immutable.fromJS({
        lastAccessedTime: 1477944718877,
        location: bookmarkLocation,
        title: 'different',
        parentFolderId: folder.get('folderId'),
        tags: [siteTags.BOOKMARK]
      })
      const siteKey = siteUtil.getSiteKey(site)
      let state = baseState.setIn(['sites', siteKey], site)
      state = siteCache.loadLocationSiteKeysCache(state)

      // Sanity
      let cachedKeys = siteCache.getLocationSiteKeys(state, bookmarkLocation)
      assert.deepEqual(cachedKeys.toJS(), [bookmarkKey, siteKey])

      state = siteCache.removeLocationSiteKey(state, bookmarkLocation, bookmarkKey)
      cachedKeys = siteCache.getLocationSiteKeys(state, bookmarkLocation)
      assert.deepEqual(cachedKeys.toJS(), [siteKey])
    })

    it('when removing the last siteKey, removes location', function () {
      let state = siteCache.loadLocationSiteKeysCache(baseState)
      state = siteCache.removeLocationSiteKey(state, bookmarkLocation, bookmarkKey)
      const cachedKeys = siteCache.getLocationSiteKeys(state, bookmarkLocation)
      assert.deepEqual(cachedKeys, undefined)
    })
  })
})
