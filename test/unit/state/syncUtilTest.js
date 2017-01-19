/* global describe, it */

const syncUtil = require('../../../js/state/syncUtil')
const assert = require('assert')

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
          folderId: 0,
          parentFolderId: 0
        }
      }
      assert.deepEqual(syncUtil.createSiteData(bookmark), expectedBookmark)
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
})
