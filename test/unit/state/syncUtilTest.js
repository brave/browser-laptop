/* global describe, it */

const syncUtil = require('../../../js/state/syncUtil')
const assert = require('assert')
const Immutable = require('immutable')

describe('syncUtil', () => {
  describe('createSiteData()', () => {
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

  describe('ipcSafeObject()', () => {
    it('does nothing with objects already safe', () => {
      const object = {chill: true, time: 42, nest: {egg: 'tree'}}
      assert.deepEqual(syncUtil.ipcSafeObject(object), object)
    })

    it('does nothing with Arrays', () => {
      const object = {arr: [1, 2, 3]}
      assert.deepEqual(syncUtil.ipcSafeObject(object), object)
      const deepObject = {deep: {arr: [1, 2, 3]}}
      assert.deepEqual(syncUtil.ipcSafeObject(deepObject), deepObject)
    })

    it('converts Uint8Array to Array', () => {
      const object = {chill: true, arr: new Uint8Array([1, 2, 3])}
      const expected = {chill: true, arr: [1, 2, 3]}
      assert.deepEqual(syncUtil.ipcSafeObject(object), expected)
      const deepObject = {chill: true, deep: {arr: new Uint8Array([1, 2, 3])}}
      const deepExpected = {chill: true, deep: {arr: [1, 2, 3]}}
      assert.deepEqual(syncUtil.ipcSafeObject(deepObject), deepExpected)
    })
  })

  describe('getSiteDataFromRecord()', () => {
    it('update bookmark parent folder to null -> overrides existing parent folder', () => {
      const objectId = [96, 46, 213, 0, 13, 111, 180, 184, 65, 66, 173, 27, 207, 29, 32, 108]
      const records = [{
        action: 1,
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
})
