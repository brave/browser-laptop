/* global describe, it */

const siteTags = require('../../../js/constants/siteTags')
const siteUtil = require('../../../js/state/siteUtil')
const assert = require('assert')
const Immutable = require('immutable')

describe('siteUtil', function () {
  const testUrl1 = 'https://brave.com/'
  const testUrl2 = 'http://example.com/'
  const emptyState = Immutable.fromJS({sites: {}})
  const bookmarkAllFields = Immutable.fromJS({
    lastAccessedTime: 123,
    objectId: [210, 115, 31, 176, 57, 212, 167, 120, 104, 88, 88, 27, 141, 36, 235, 226],
    type: siteTags.BOOKMARK,
    location: testUrl1,
    title: 'sample',
    parentFolderId: 0,
    partitionNumber: 0
  })
  const folderMinFields = Immutable.fromJS({
    title: 'folder1',
    parentFolderId: 0,
    type: siteTags.BOOKMARK_FOLDER
  })

  describe('getSiteKey', function () {
    it('returns null if siteDetail is falsey', function () {
      const key = siteUtil.getSiteKey(null)
      assert.equal(key, null)
    })
    describe('matching `BOOKMARK_FOLDER`', function () {
      it('returns key if folderId matches', function () {
        const siteDetail = Immutable.fromJS({
          folderId: 1
        })
        const key = siteUtil.getSiteKey(siteDetail)
        assert.equal(key, 1)
      })
      it('returns null if folderId is missing', function () {
        const siteDetail = new Immutable.Map()
        const key = siteUtil.getSiteKey(siteDetail)
        assert.equal(key, null)
      })
    })
    describe('matching `BOOKMARK`', function () {
      it('returns key if location and partitionNumber match', function () {
        const siteDetail = Immutable.fromJS({
          location: testUrl1,
          partitionNumber: 0
        })
        const key = siteUtil.getSiteKey(siteDetail)
        assert.equal(key, testUrl1 + '|0|0')
      })
      it('returns key if location matches and partitionNumber is NOT present', function () {
        const siteDetail = Immutable.fromJS({
          location: testUrl1
        })
        const key = siteUtil.getSiteKey(siteDetail)
        assert.equal(key, testUrl1 + '|0|0')
      })
      it('returns null if location is missing', function () {
        const siteDetail = new Immutable.Map()
        const key = siteUtil.getSiteKey(siteDetail)
        assert.equal(key, null)
      })
    })
    describe('prevent collision', function () {
      it('partition number', function () {
        const siteA = Immutable.fromJS({
          location: testUrl1 + '1',
          partitionNumber: 0
        })
        const siteB = Immutable.fromJS({
          location: testUrl1,
          partitionNumber: 10
        })
        const keyA = siteUtil.getSiteKey(siteA)
        const keyB = siteUtil.getSiteKey(siteB)
        assert.notEqual(keyA, keyB)
      })
      it('parent folder id', function () {
        const siteA = Immutable.fromJS({
          location: testUrl1 + '1',
          partitionNumber: 0,
          parentFolderId: 0
        })
        const siteB = Immutable.fromJS({
          location: testUrl1,
          partitionNumber: 10,
          parentFolderId: 0
        })
        const keyA = siteUtil.getSiteKey(siteA)
        const keyB = siteUtil.getSiteKey(siteB)
        assert.notEqual(keyA, keyB)
      })
    })
  })

  describe('isSiteBookmarked', function () {
    it('returns true if site is bookmarked', function () {
      const site = {
        location: testUrl1,
        tags: [siteTags.BOOKMARK]
      }
      const siteDetail = Immutable.fromJS(site)
      const key = siteUtil.getSiteKey(siteDetail)
      const sites = {}
      sites[key] = site
      const result = siteUtil.isSiteBookmarked(Immutable.fromJS(sites), siteDetail)
      assert.equal(result, true)
    })
    it('returns false if site is not bookmarked', function () {
      const site = {
        location: testUrl2,
        tags: [siteTags.BOOKMARK]
      }
      const key = siteUtil.getSiteKey(Immutable.fromJS(site))
      const sites = {}
      sites[key] = site
      const result = siteUtil.isSiteBookmarked(Immutable.fromJS({sites}), Immutable.fromJS({
        location: testUrl1,
        tags: [siteTags.BOOKMARK]
      }))
      assert.equal(result, false)
    })
    it('returns false if site is a bookmark folder', function () {
      const site = {
        folderId: 0,
        tags: [siteTags.BOOKMARK_FOLDER]
      }
      const siteDetail = Immutable.fromJS(site)
      const key = siteUtil.getSiteKey(siteDetail)
      const sites = {}
      sites[key] = site
      const result = siteUtil.isSiteBookmarked(Immutable.fromJS({sites}), siteDetail)
      assert.equal(result, false)
    })
  })

  describe('isMoveAllowed', function () {
    // NOTE: usage taken from Bookmark Manager, which calls aboutActions.moveSite
    it('does not allow you to move a bookmark folder into itself', function () {
      // Add a new bookmark folder
      let state = siteUtil.addSite(emptyState, folderMinFields)
      const folderMinFieldsWithId = folderMinFields.set('folderId', 1)
      const processedKey = siteUtil.getSiteKey(folderMinFieldsWithId)
      const folderId = state.getIn(['sites', processedKey, 'folderId'])
      // Add a bookmark into that folder
      state = siteUtil.addSite(state, bookmarkAllFields.set('parentFolderId', folderId))
      const bookmarkFolder = state.getIn(['sites', processedKey])
      // Should NOT be able to move bookmark folder into itself
      assert.equal(false, siteUtil.isMoveAllowed(state.get('sites'), bookmarkFolder, bookmarkFolder))
    })
    it('does not allow you to move an ancestor folder into a descendant folder', function () {
      // Add a new bookmark folder
      let state = siteUtil.addSite(emptyState, folderMinFields)
      const folderMinFieldsWithId1 = folderMinFields.set('folderId', 1)
      const processedKey1 = siteUtil.getSiteKey(folderMinFieldsWithId1)
      const folderId1 = state.getIn(['sites', processedKey1, 'folderId'])
      // Add a child below that folder
      state = siteUtil.addSite(state, folderMinFields.set('parentFolderId', folderId1))
      const folderMinFieldsWithId2 = folderMinFields.set('folderId', 2)
      const processedKey2 = siteUtil.getSiteKey(folderMinFieldsWithId2)
      const folderId2 = state.getIn(['sites', processedKey2, 'folderId'])
      // Add a folder below the previous child
      state = siteUtil.addSite(state, folderMinFields.set('parentFolderId', folderId2))
      const folderMinFieldsWithId3 = folderMinFields.set('folderId', 3)
      const processedKey3 = siteUtil.getSiteKey(folderMinFieldsWithId3)
      const bookmarkFolder1 = state.getIn(['sites', processedKey1])
      const bookmarkFolder3 = state.getIn(['sites', processedKey3])
      // Should NOT be able to move grandparent folder into its grandchild
      assert.equal(false, siteUtil.isMoveAllowed(state.get('sites'), bookmarkFolder1, bookmarkFolder3))
    })
  })

  describe('isFolder', function () {
    it('returns true if the input is a siteDetail and has a `BOOKMARK_FOLDER` tag and a folder ID', function () {
      const siteDetail = Immutable.fromJS({
        tags: [siteTags.BOOKMARK_FOLDER],
        folderId: 1
      })
      assert.equal(siteUtil.isFolder(siteDetail), true)
    })
    it('returns false if the input does not have a folderId', function () {
      const siteDetail = Immutable.fromJS({
        tags: [siteTags.BOOKMARK_FOLDER]
      })
      assert.equal(siteUtil.isFolder(siteDetail), false)
    })
    it('returns false if the input does not have a `BOOKMARK_FOLDER` tag', function () {
      const siteDetail = Immutable.fromJS({
        tags: [siteTags.BOOKMARK]
      })
      assert.equal(siteUtil.isFolder(siteDetail), false)
    })
    it('returns false if there is not a `tags` property', function () {
      const siteDetail = Immutable.fromJS({
        notTags: null
      })
      assert.equal(siteUtil.isFolder(siteDetail), false)
    })
    it('returns false if the input is null', function () {
      assert.equal(siteUtil.isFolder(null), false)
    })
    it('returns false if the input is undefined', function () {
      assert.equal(siteUtil.isFolder(), false)
    })
  })

  describe('isBookmark', function () {
    it('returns true if the input is a siteDetail and has a `BOOKMARK` tag', function () {
      const siteDetail = Immutable.fromJS({
        tags: [siteTags.BOOKMARK]
      })
      assert.equal(siteUtil.isBookmark(siteDetail), true)
    })
    it('returns false if the input does not have a `BOOKMARK` tag', function () {
      const siteDetail = Immutable.fromJS({
        tags: [siteTags.BOOKMARK_FOLDER]
      })
      assert.equal(siteUtil.isBookmark(siteDetail), false)
    })
    it('returns false if there is not a `tags` property', function () {
      const siteDetail = Immutable.fromJS({
        notTags: null
      })
      assert.equal(siteUtil.isBookmark(siteDetail), false)
    })
    it('returns false if the input is falsey', function () {
      assert.equal(siteUtil.isBookmark(null), false)
    })
  })

  describe('isHistoryEntry', function () {
    it('returns true for a typical history entry', function () {
      const siteDetail = Immutable.fromJS({
        location: testUrl1,
        lastAccessedTime: 123
      })
      assert.equal(siteUtil.isHistoryEntry(siteDetail), true)
    })
    it('returns true for a bookmark history entry which has lastAccessedTime', function () {
      const siteDetail = Immutable.fromJS({
        location: testUrl1,
        tags: [siteTags.BOOKMARK],
        lastAccessedTime: 123
      })
      assert.equal(siteUtil.isHistoryEntry(siteDetail), true)
    })
    it('returns false for a default site', function () {
      const siteDetail = Immutable.fromJS({
        location: testUrl1,
        tags: [siteTags.DEFAULT],
        lastAccessedTime: 1
      })
      assert.equal(siteUtil.isHistoryEntry(siteDetail), false)
    })
    it('returns false for a bookmark entry with falsey lastAccessedTime', function () {
      const siteDetail = Immutable.fromJS({
        location: testUrl1,
        tags: [siteTags.BOOKMARK]
      })
      assert.equal(siteUtil.isHistoryEntry(siteDetail), false)
    })
    it('returns true for a history entry with falsey lastAccessedTime', function () {
      const siteDetail = Immutable.fromJS({
        location: testUrl1,
        tags: []
      })
      assert.equal(siteUtil.isHistoryEntry(siteDetail), true)
    })
    it('returns false for a bookmarks folder', function () {
      const siteDetail = Immutable.fromJS({
        location: testUrl1,
        tags: [siteTags.BOOKMARK_FOLDER],
        lastAccessedTime: 123
      })
      assert.equal(siteUtil.isHistoryEntry(siteDetail), false)
    })
    it('returns false for a brave default site', function () {
      const siteDetail = Immutable.fromJS({
        location: testUrl1,
        tags: [siteTags.DEFAULT],
        lastAccessedTime: 1
      })
      assert.equal(siteUtil.isHistoryEntry(siteDetail), false)
    })
    it('returns false if input is falsey', function () {
      assert.equal(siteUtil.isHistoryEntry(null), false)
      assert.equal(siteUtil.isHistoryEntry(undefined), false)
    })
    it('returns false for about: pages', function () {
      const siteDetail = Immutable.fromJS({
        location: 'about:fake-page-here',
        lastAccessedTime: 123
      })
      assert.equal(siteUtil.isHistoryEntry(siteDetail), false)
    })
  })

  describe('getOrigin', function () {
    it('returns file:/// for any file url', function () {
      assert.strictEqual(siteUtil.getOrigin('file://'), 'file:///')
      assert.strictEqual(siteUtil.getOrigin('file:///'), 'file:///')
      assert.strictEqual(siteUtil.getOrigin('file:///some'), 'file:///')
      assert.strictEqual(siteUtil.getOrigin('file:///some/'), 'file:///')
      assert.strictEqual(siteUtil.getOrigin('file:///some/path'), 'file:///')
    })
    it('gets URL origin for simple url', function () {
      assert.strictEqual(siteUtil.getOrigin('https://abc.bing.com'), 'https://abc.bing.com')
    })
    it('gets URL origin for url with port', function () {
      assert.strictEqual(siteUtil.getOrigin('https://bing.com:443/?test=1#abc'), 'https://bing.com:443')
    })
    it('gets URL origin for IP host', function () {
      assert.strictEqual(siteUtil.getOrigin('http://127.0.0.1:443/?test=1#abc'), 'http://127.0.0.1:443')
    })
    it('gets URL origin for slashless protocol URL', function () {
      assert.strictEqual(siteUtil.getOrigin('about:test/foo'), 'about:test')
    })
    it('returns null for invalid URL', function () {
      assert.strictEqual(siteUtil.getOrigin('abc'), null)
    })
    it('returns null for empty URL', function () {
      assert.strictEqual(siteUtil.getOrigin(''), null)
    })
    it('returns null for null URL', function () {
      assert.strictEqual(siteUtil.getOrigin(null), null)
    })
    it('returns correct result for URL with hostname that is a scheme', function () {
      assert.strictEqual(siteUtil.getOrigin('http://http/test'), 'http://http')
    })
  })
})
