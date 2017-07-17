/* global describe, before, after, it */

const mockery = require('mockery')
const assert = require('assert')
const sinon = require('sinon')
const Immutable = require('immutable')
const writeActions = require('../../../js/constants/sync/proto').actions

describe('syncUtil', () => {
  let syncUtil
  let appAction
  let crypto
  before(function () {
    mockery.enable({
      warnOnReplace: false,
      warnOnUnregistered: false,
      useCleanCache: true
    })
    appAction = require('../../../js/actions/appActions')
    crypto = require('crypto')
    mockery.registerMock('../actions/appActions', appAction)
    mockery.registerMock('crypto', crypto)
    syncUtil = require('../../../js/state/syncUtil')
  })
  after(function () {
    mockery.disable()
  })

  describe('getSiteDataFromRecord', function () {
    const objectId = [96, 46, 213, 0, 13, 111, 180, 184, 65, 66, 173, 27, 207, 29, 32, 108]
    const records = [{
      action: writeActions.UPDATE,
      bookmark: {
        isFolder: true,
        parentFolderObjectId: null,
        site: {
          creationTime: 0,
          customTitle: '',
          favicon: '',
          lastAccessedTime: 0,
          location: '',
          title: 'Folder1'
        }
      },
      deviceId: [1],
      objectData: 'bookmark',
      objectId,
      syncTimestamp: 1499736988267
    }]
    const existingObject = {
      lastAccessedTime: 0,
      tags: ['bookmark-folder'],
      objectId,
      order: 9,
      folderId: 2,
      customTitle: 'Folder1', // XXX: Android uses title whereas laptop uses customTitle
      parentFolderId: 1
    }
    const appState = {
      sites: {
        '2': existingObject
      },
      sync: {
        objectsById: {
          [objectId.join('|')]: ['sites', '2']
        }
      }
    }

    describe('with action', function () {
      describe('when NOT writeActions.CREATE', function () {
        it('looks up / returns existing object', function () {
          const result = syncUtil.getSiteDataFromRecord(records[0],
            Immutable.fromJS(appState), Immutable.fromJS(records))
          assert.deepEqual(result.existingObjectData.toJS(), existingObject)
        })
      })

      describe('when writeActions.CREATE', function () {
        it('does not set existingObjectData', function () {
          const recordsCopy = Object.assign({}, records[0])
          recordsCopy.action = writeActions.CREATE
          const result = syncUtil.getSiteDataFromRecord(recordsCopy,
            Immutable.fromJS(appState), Immutable.fromJS([recordsCopy]))
          assert.equal(result.existingObjectData, undefined)
        })
      })
    })

    describe('with customTitle', function () {
      it('keeps field if assigned value', function () {
        // deep copy and assign a different custom title
        const recordsCopy = Object.assign({}, records[0])
        recordsCopy.bookmark = Object.assign({}, records[0].bookmark)
        recordsCopy.bookmark.site = Object.assign({}, records[0].bookmark.site)
        recordsCopy.bookmark.site.customTitle = 'demo value'
        const result = syncUtil.getSiteDataFromRecord(recordsCopy,
          Immutable.fromJS(appState), Immutable.fromJS([recordsCopy]))
        assert.equal(result.siteDetail.has('customTitle'), true)
        assert.equal(result.siteDetail.get('customTitle'), 'demo value')
      })

      it('deletes field if empty', function () {
        const result = syncUtil.getSiteDataFromRecord(records[0],
          Immutable.fromJS(appState), Immutable.fromJS(records))
        assert.equal(result.siteDetail.has('customTitle'), false)
      })
    })

    describe('with objectData', function () {
      describe('when "bookmark"', function () {
        it('update bookmark parent folder to null -> overrides existing parent folder', () => {
          const result = syncUtil.getSiteDataFromRecord(records[0],
            Immutable.fromJS(appState), Immutable.fromJS(records))
          assert.equal(result.tag, 'bookmark-folder')
          assert.deepEqual(result.siteDetail.toJS(),
            {
              objectId,
              title: 'Folder1',
              favicon: '',
              location: '',
              parentFolderId: 0,
              folderId: 2,
              tags: ['bookmark-folder'],
              lastAccessedTime: 0,
              creationTime: 0
            }
          )
          assert.deepEqual(result.existingObjectData.toJS(), existingObject)
        })
      })

      describe('when not "bookmark"', function () {

      })
    })
  })

  describe('applySyncRecords', function () {
  })

  describe('getExistingObject', function () {
  })

  describe('createSiteCache', function () {
  })

  describe('updateSiteCache', function () {
  })

  describe('now', function () {
    let clock
    before(function () {
      clock = sinon.useFakeTimers()
      clock.tick(8800)
    })
    after(function () {
      clock.restore()
    })
    it('returns seconds (truncating milliseconds)', function () {
      assert.equal(syncUtil.now(), 8)
    })
  })

  describe('isSyncable', function () {
  })

  describe('newObjectId', function () {
    let randomBytesSpy
    let setObjectIdStub
    let result
    before(function () {
      setObjectIdStub = sinon.stub(appAction, 'setObjectId')
      randomBytesSpy = sinon.spy(crypto, 'randomBytes')
      result = syncUtil.newObjectId(['path'])
    })
    after(function () {
      setObjectIdStub.restore()
      randomBytesSpy.restore()
    })
    it('generates a 16 byte id', function () {
      assert.equal(randomBytesSpy.withArgs(16).calledOnce, true)
    })
    it('calls appActions.setObjectId', function () {
      assert.equal(setObjectIdStub.calledOnce, true)
    })
    it('returns the 16 byte id', function () {
      assert(Array.isArray(result))
      assert.equal(result.length, 16)
    })
  })

  describe('createSiteData', function () {
    const objectId = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]
    const site = {
      favicon: 'https://calendar.google.com/googlecalendar/images/favicon_v2014_18.ico',
      lastAccessedTime: 1484792353816,
      location: 'https://calendar.google.com/calendar/render#main_7',
      objectId,
      partitionNumber: 0,
      tags: [],
      themeColor: 'rgb(255, 255, 255)',
      title: 'Google Calendar'
    }
    const expectedSite = {
      name: 'historySite',
      objectId,
      value: {
        favicon: 'https://calendar.google.com/googlecalendar/images/favicon_v2014_18.ico',
        location: 'https://calendar.google.com/calendar/render#main_7',
        title: 'Google Calendar',
        customTitle: '',
        lastAccessedTime: 1484792353816,
        creationTime: 0
      }
    }

    it('history sites', () => {
      assert.deepEqual(syncUtil.createSiteData(site), expectedSite)
    })

    // TODO: Not explicitly supported; falls back to history item
    it('pinned sites', () => {
      const pinnedSite = Object.assign({}, site, {tags: ['pinned']})
      assert.deepEqual(syncUtil.createSiteData(pinnedSite), expectedSite)
    })

    it('bookmarks', () => {
      const bookmark = Object.assign({}, site, {tags: ['bookmark']})
      const expectedBookmark = {
        name: 'bookmark',
        objectId,
        value: {
          site: expectedSite.value,
          isFolder: false,
          hideInToolbar: false,
          parentFolderObjectId: undefined
        }
      }
      assert.deepEqual(syncUtil.createSiteData(bookmark), expectedBookmark)
    })

    it('bookmark with undefined custom title', () => {
      const bookmark = Object.assign({}, site, {tags: ['bookmark'], customTitle: undefined})
      const newValue = Object.assign({}, expectedSite.value, {customTitle: undefined})
      const expectedBookmark = {
        name: 'bookmark',
        objectId,
        value: {
          site: newValue,
          isFolder: false,
          hideInToolbar: false,
          parentFolderObjectId: undefined
        }
      }
      assert.deepEqual(syncUtil.createSiteData(bookmark), expectedBookmark)
    })

    it('bookmark containing data url', () => {
      const bookmark = Object.assign({}, site, {tags: ['bookmark'], favicon: 'data:foo'})
      const newValue = Object.assign({}, expectedSite.value, {favicon: ''})
      const expectedBookmark = {
        name: 'bookmark',
        objectId,
        value: {
          site: newValue,
          isFolder: false,
          hideInToolbar: false,
          parentFolderObjectId: undefined
        }
      }
      assert.deepEqual(syncUtil.createSiteData(bookmark), expectedBookmark)
    })

    it('bookmark in Other Bookmarks folder', () => {
      const bookmark = Object.assign({}, site, {tags: ['bookmark'], parentFolderId: -1})
      const expectedBookmark = {
        name: 'bookmark',
        objectId,
        value: {
          site: expectedSite.value,
          isFolder: false,
          hideInToolbar: true,
          parentFolderObjectId: undefined
        }
      }
      assert.deepEqual(syncUtil.createSiteData(bookmark), expectedBookmark)
    })

    it('site without lastAccessedTime', () => {
      const site = {
        order: 1207,
        count: 15,
        partitionNumber: 0,
        location: 'https://parsecpizzadelivery.com/',
        title: "Parsec Pizza Delivery trailer - A pixelated deliver 'em up",
        tags: [],
        objectId: [0, 63, 197, 156, 48, 17, 112, 109, 247, 175, 79, 57, 151, 123, 29, 198],
        themeColor: 'rgb(5, 5, 5)'
      }
      const expectedSite = {
        name: 'historySite',
        objectId: [0, 63, 197, 156, 48, 17, 112, 109, 247, 175, 79, 57, 151, 123, 29, 198],
        value: {
          creationTime: 0,
          customTitle: '',
          favicon: '',
          lastAccessedTime: 0,
          location: 'https://parsecpizzadelivery.com/',
          title: "Parsec Pizza Delivery trailer - A pixelated deliver 'em up"
        }
      }
      assert.deepEqual(syncUtil.createSiteData(site), expectedSite)
    })
  })

  describe('createSiteSettingsData', function () {
  })

  describe('deepArrayify', function () {
    it('does nothing with objects already safe', () => {
      const object = {chill: true, time: 42, nest: {egg: 'tree'}}
      assert.deepEqual(syncUtil.deepArrayify(object), object)
    })

    it('does nothing with Arrays', () => {
      const object = {arr: [1, 2, 3]}
      assert.deepEqual(syncUtil.deepArrayify(object), object)
      const deepObject = {deep: {arr: [1, 2, 3]}}
      assert.deepEqual(syncUtil.deepArrayify(deepObject), deepObject)
    })

    it('converts Uint8Array to Array', () => {
      const object = {chill: true, arr: new Uint8Array([1, 2, 3])}
      const expected = {chill: true, arr: [1, 2, 3]}
      assert.deepEqual(syncUtil.deepArrayify(object), expected)
      const deepObject = {chill: true, deep: {arr: new Uint8Array([1, 2, 3])}}
      const deepExpected = {chill: true, deep: {arr: [1, 2, 3]}}
      assert.deepEqual(syncUtil.deepArrayify(deepObject), deepExpected)
    })
  })

  describe('ipcSafeObject', function () {
    let deepArrayifySpy
    before(function () {
      deepArrayifySpy = sinon.spy(syncUtil, 'deepArrayify')
    })
    after(function () {
      deepArrayifySpy.restore()
    })
    it('calls deepArrayify', function () {
      syncUtil.deepArrayify({chill: true, time: 42, nest: {egg: 'tree'}})
      assert.equal(deepArrayifySpy.calledOnce, true)
    })
  })
})
