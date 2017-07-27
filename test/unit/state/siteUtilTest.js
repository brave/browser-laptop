/* global describe, it */

const siteTags = require('../../../js/constants/siteTags')
const siteUtil = require('../../../js/state/siteUtil')
const {STATE_SITES} = require('../../../js/constants/stateConstants')
const assert = require('assert')
const Immutable = require('immutable')
const bookmarkFoldersState = require('../../../app/common/state/bookmarkFoldersState')
const bookmarksStaate = require('../../../app/common/state/bookmarksState')

describe('siteUtil', function () {
  const testUrl1 = 'https://brave.com/'
  const emptyState = Immutable.fromJS({
    bookmarks: {},
    bookmarkFolders: {},
    historySites: {
      'https://brave.com/|0|1': {
        lastAccessedTime: 123,
        location: testUrl1,
        title: 'sample',
        parentFolderId: 0,
        partitionNumber: 0
      }
    }
  })
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

  describe('isMoveAllowed', function () {
    // NOTE: usage taken from Bookmark Manager, which calls aboutActions.moveSite
    it('does not allow you to move a bookmark folder into itself', function () {
      // Add a new bookmark folder
      let state = bookmarkFoldersState.addFolder(emptyState, folderMinFields)
      const folderMinFieldsWithId = folderMinFields.set('folderId', 1)
      const processedKey = siteUtil.getSiteKey(folderMinFieldsWithId)
      const folderId = state.getIn([STATE_SITES.BOOKMARK_FOLDERS, processedKey, 'folderId'])
      // Add a bookmark into that folder
      state = bookmarksStaate.addBookmark(state, bookmarkAllFields.set('parentFolderId', folderId))
      const bookmarkFolder = state.getIn([STATE_SITES.BOOKMARK_FOLDERS, processedKey])
      // Should NOT be able to move bookmark folder into itself
      assert.equal(false, siteUtil.isMoveAllowed(state.get(STATE_SITES.BOOKMARK_FOLDERS), bookmarkFolder, bookmarkFolder))
    })
    it('does not allow you to move an ancestor folder into a descendant folder', function () {
      // Add a new bookmark folder
      let state = bookmarkFoldersState.addFolder(emptyState, folderMinFields)
      const folderMinFieldsWithId1 = folderMinFields.set('folderId', 1)
      const processedKey1 = siteUtil.getSiteKey(folderMinFieldsWithId1)
      const folderId1 = state.getIn([STATE_SITES.BOOKMARK_FOLDERS, processedKey1, 'folderId'])
      // Add a child below that folder
      state = bookmarkFoldersState.addFolder(state, folderMinFields.set('parentFolderId', folderId1))
      const folderMinFieldsWithId2 = folderMinFields.set('folderId', 2)
      const processedKey2 = siteUtil.getSiteKey(folderMinFieldsWithId2)
      const folderId2 = state.getIn([STATE_SITES.BOOKMARK_FOLDERS, processedKey2, 'folderId'])
      // Add a folder below the previous child
      state = bookmarkFoldersState.addFolder(state, folderMinFields.set('parentFolderId', folderId2))
      const folderMinFieldsWithId3 = folderMinFields.set('folderId', 3)
      const processedKey3 = siteUtil.getSiteKey(folderMinFieldsWithId3)
      const bookmarkFolder1 = state.getIn([STATE_SITES.BOOKMARK_FOLDERS, processedKey1])
      const bookmarkFolder3 = state.getIn([STATE_SITES.BOOKMARK_FOLDERS, processedKey3])
      // Should NOT be able to move grandparent folder into its grandchild
      assert.equal(false, siteUtil.isMoveAllowed(state.get(STATE_SITES.BOOKMARK_FOLDERS), bookmarkFolder1, bookmarkFolder3))
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
