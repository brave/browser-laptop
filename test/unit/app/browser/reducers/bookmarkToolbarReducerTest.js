/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

/* global describe, it, before, after, afterEach */
const mockery = require('mockery')
const Immutable = require('immutable')
const assert = require('assert')
const sinon = require('sinon')
const fakeElectron = require('../../../lib/fakeElectron')
const fakeAdBlock = require('../../../lib/fakeAdBlock')

const appConstants = require('../../../../../js/constants/appConstants')
const siteTags = require('../../../../../js/constants/siteTags')
const {STATE_SITES} = require('../../../../../js/constants/stateConstants')
require('../../../braveUnit')

describe('bookmarkToolbarReducer unit test', function () {
  let bookmarkToolbarReducer

  const fakeTextCalc = {
    calcTextList: () => true
  }

  const stateWithData = Immutable.fromJS({
    windows: [],
    bookmarks: {
      'https://brave.com/|0|0': {
        favicon: undefined,
        title: 'Brave',
        location: 'https://brave.com/',
        key: 'https://brave.com/|0|0',
        parentFolderId: 0,
        partitionNumber: 0,
        objectId: null,
        themeColor: undefined,
        type: siteTags.BOOKMARK
      },
      'https://brianbondy.com/|0|1': {
        favicon: undefined,
        title: 'Clifton',
        location: 'https://clifton.io/',
        key: 'https://clifton.io/|0|1',
        parentFolderId: 1,
        partitionNumber: 0,
        objectId: null,
        themeColor: undefined,
        type: siteTags.BOOKMARK
      }
    },
    bookmarkFolders: {
      '1': {
        title: 'folder1',
        folderId: 1,
        key: '1',
        parentFolderId: 0,
        partitionNumber: 0,
        objectId: null,
        type: siteTags.BOOKMARK_FOLDER
      }
    },
    cache: {
      bookmarkOrder: {
        '0': [
          {
            key: 'https://brave.com/|0|0',
            order: 0,
            type: siteTags.BOOKMARK
          },
          {
            key: '1',
            order: 1,
            type: siteTags.BOOKMARK_FOLDER
          }
        ],
        '1': [
          {
            key: 'https://brianbondy.com/|0|1',
            order: 0,
            type: siteTags.BOOKMARK
          }
        ]
      },
      bookmarkLocation: {
        'https://brave.com/': [
          'https://brave.com/|0|0'
        ],
        'https://brianbondy.com/': [
          'https://brianbondy.com/|0|1'
        ]
      }
    },
    historySites: {},
    tabs: []
  })

  before(function () {
    mockery.enable({
      warnOnReplace: false,
      warnOnUnregistered: false,
      useCleanCache: true
    })
    mockery.registerMock('electron', fakeElectron)
    mockery.registerMock('ad-block', fakeAdBlock)
    mockery.registerMock('../../browser/api/textCalc', fakeTextCalc)
    bookmarkToolbarReducer = require('../../../../../app/browser/reducers/bookmarkToolbarReducer')
  })

  after(function () {
    mockery.disable()
  })

  describe('APP_SET_STATE', function () {
    let spyCalc

    afterEach(function () {
      spyCalc.restore()
    })

    it('we are upgrading from version 0.20 to 0.21', function () {
      spyCalc = sinon.spy(fakeTextCalc, 'calcTextList')
      bookmarkToolbarReducer(stateWithData, {
        actionType: appConstants.APP_SET_STATE
      })
      assert.equal(spyCalc.callCount, 1)
    })

    it('we are on version 0.21', function () {
      spyCalc = sinon.spy(fakeTextCalc, 'calcTextList')
      const newState = stateWithData
        .setIn([STATE_SITES.BOOKMARKS, 'https://brave.com/|0|0', 'width'], 10)
        .setIn([STATE_SITES.BOOKMARKS, 'https://brianbondy.com/|0|1', 'width'], 10)
        .setIn([STATE_SITES.BOOKMARK_FOLDERS, '1', 'width'], 10)
      bookmarkToolbarReducer(newState, {
        actionType: appConstants.APP_SET_STATE
      })
      assert.equal(spyCalc.notCalled, true)
    })
  })
})
