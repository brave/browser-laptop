/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at https://mozilla.org/MPL/2.0/. */

/* global describe, it, before, after, afterEach */
const mockery = require('mockery')
const Immutable = require('immutable')
const assert = require('assert')
const sinon = require('sinon')

const appConstants = require('../../../../../js/constants/appConstants')
require('../../../braveUnit')

describe('historyReducer unit test', function () {
  let historyReducer, historyState, aboutHistoryState

  const state = Immutable.fromJS({
    windows: [],
    bookmarks: {},
    bookmarkFolders: {},
    cache: {},
    historySites: {},
    tabs: [],
    about: {
      history: {
        entries: [],
        updatedStamp: 0
      }
    }
  })

  const stateWithData = Immutable.fromJS({
    windows: [],
    bookmarks: {},
    bookmarkFolders: {},
    cache: {},
    historySites: {
      'https://clifton.io/|0': {
        count: 1,
        favicon: undefined,
        key: 'https://clifton.io/|0',
        lastAccessedTime: 0,
        location: 'https://clifton.io/',
        objectId: null,
        partitionNumber: 0,
        themeColor: undefined,
        title: 'Clifton'
      },
      'https://brave.com/|0': {
        count: 1,
        favicon: undefined,
        key: 'https://brave.com/|0',
        lastAccessedTime: 0,
        location: 'https://brave.com/',
        objectId: null,
        partitionNumber: 0,
        themeColor: undefined,
        title: 'Brave'
      }
    },
    tabs: [],
    about: {
      history: {
        entries: [
          {
            count: 1,
            favicon: undefined,
            key: 'https://clifton.io/|0',
            lastAccessedTime: 0,
            location: 'https://clifton.io/',
            objectId: null,
            partitionNumber: 0,
            themeColor: undefined,
            title: 'Clifton'
          },
          {
            count: 1,
            favicon: undefined,
            key: 'https://brave.com/|0',
            lastAccessedTime: 0,
            location: 'https://brave.com/',
            objectId: null,
            partitionNumber: 0,
            themeColor: undefined,
            title: 'Brave'
          }
        ]
      }
    }
  })

  before(function () {
    this.clock = sinon.useFakeTimers()
    this.clock.tick(0)
    mockery.enable({
      warnOnReplace: false,
      warnOnUnregistered: false,
      useCleanCache: true
    })
    mockery.registerMock('../../filtering', {
      clearHistory: () => {
      }
    })
    historyReducer = require('../../../../../app/browser/reducers/historyReducer')
    historyState = require('../../../../../app/common/state/historyState')
    aboutHistoryState = require('../../../../../app/common/state/aboutHistoryState')
  })

  after(function () {
    mockery.disable()
    this.clock.restore()
  })

  describe('APP_ON_CLEAR_BROWSING_DATA', function () {
    let spy

    afterEach(function () {
      spy.restore()
    })

    it('null case', function () {
      spy = sinon.spy(historyState, 'clearSites')
      const newState = historyReducer(state, {
        actionType: appConstants.APP_ON_CLEAR_BROWSING_DATA
      })
      assert.equal(spy.notCalled, true)
      assert.deepEqual(newState.toJS(), state.toJS())
    })

    it('clearBrowsingDataDefaults is provided', function () {
      spy = sinon.spy(historyState, 'clearSites')
      const initState = stateWithData.set('clearBrowsingDataDefaults', Immutable.fromJS({
        browserHistory: true
      }))
      const newState = historyReducer(initState, {
        actionType: appConstants.APP_ON_CLEAR_BROWSING_DATA
      })
      const expectedState = state.set('clearBrowsingDataDefaults', Immutable.fromJS({
        browserHistory: true
      }))
      assert.equal(spy.calledOnce, true)
      assert.deepEqual(newState.toJS(), expectedState.toJS())
    })

    it('tempClearBrowsingData is provided', function () {
      spy = sinon.spy(historyState, 'clearSites')
      const initState = stateWithData.set('tempClearBrowsingData', Immutable.fromJS({
        browserHistory: true
      }))
      const newState = historyReducer(initState, {
        actionType: appConstants.APP_ON_CLEAR_BROWSING_DATA
      })
      const expectedState = state.set('tempClearBrowsingData', Immutable.fromJS({
        browserHistory: true
      }))
      assert.equal(spy.calledOnce, true)
      assert.deepEqual(newState.toJS(), expectedState.toJS())
    })

    it('both are provided', function () {
      spy = sinon.spy(historyState, 'clearSites')
      const initState = stateWithData
        .set('tempClearBrowsingData', Immutable.fromJS({
          browserHistory: true
        }))
        .set('clearBrowsingDataDefaults', Immutable.fromJS({
          browserHistory: false
        }))
      const newState = historyReducer(initState, {
        actionType: appConstants.APP_ON_CLEAR_BROWSING_DATA
      })
      const expectedState = state
        .set('tempClearBrowsingData', Immutable.fromJS({
          browserHistory: true
        }))
        .set('clearBrowsingDataDefaults', Immutable.fromJS({
          browserHistory: false
        }))
      assert.equal(spy.calledOnce, true)
      assert.deepEqual(newState.toJS(), expectedState.toJS())
    })
  })

  describe('APP_ADD_HISTORY_SITE', function () {
    let spy, spyAbout

    afterEach(function () {
      spy.restore()
      spyAbout.restore()
    })

    it('null case', function () {
      spy = sinon.spy(historyState, 'addSite')
      spyAbout = sinon.spy(aboutHistoryState, 'setHistory')
      const newState = historyReducer(state, {
        actionType: appConstants.APP_ADD_HISTORY_SITE
      })
      assert.equal(spy.notCalled, true)
      assert.equal(spyAbout.notCalled, true)
      assert.deepEqual(newState.toJS(), state.toJS())
    })

    it('siteDetail is a list', function () {
      spy = sinon.spy(historyState, 'addSite')
      spyAbout = sinon.spy(aboutHistoryState, 'setHistory')
      const newState = historyReducer(state, {
        actionType: appConstants.APP_ADD_HISTORY_SITE,
        siteDetail: [
          {
            location: 'https://clifton.io/',
            title: 'Clifton'
          },
          {
            location: 'https://brave.com/',
            title: 'Brave'
          }
        ]
      })
      const expectedState = state
        .set('historySites', Immutable.fromJS({
          'https://clifton.io/|0': {
            count: 1,
            favicon: undefined,
            key: 'https://clifton.io/|0',
            lastAccessedTime: 0,
            location: 'https://clifton.io/',
            objectId: null,
            partitionNumber: 0,
            skipSync: null,
            themeColor: undefined,
            title: 'Clifton'
          },
          'https://brave.com/|0': {
            count: 1,
            favicon: undefined,
            key: 'https://brave.com/|0',
            lastAccessedTime: 0,
            location: 'https://brave.com/',
            objectId: null,
            partitionNumber: 0,
            skipSync: null,
            themeColor: undefined,
            title: 'Brave'
          }
        }))
        .setIn(['about', 'history'], Immutable.fromJS({
          entries: [
            {
              count: 1,
              favicon: undefined,
              key: 'https://clifton.io/|0',
              lastAccessedTime: 0,
              location: 'https://clifton.io/',
              objectId: null,
              partitionNumber: 0,
              skipSync: null,
              themeColor: undefined,
              title: 'Clifton'
            },
            {
              count: 1,
              favicon: undefined,
              key: 'https://brave.com/|0',
              lastAccessedTime: 0,
              location: 'https://brave.com/',
              objectId: null,
              partitionNumber: 0,
              skipSync: null,
              themeColor: undefined,
              title: 'Brave'
            }
          ],
          updatedStamp: 0
        }))
      assert.equal(spy.callCount, 2)
      assert.equal(spyAbout.calledOnce, true)
      assert.deepEqual(newState.toJS(), expectedState.toJS())
    })

    it('siteDetail is a map', function () {
      spy = sinon.spy(historyState, 'addSite')
      spyAbout = sinon.spy(aboutHistoryState, 'setHistory')
      const newState = historyReducer(state, {
        actionType: appConstants.APP_ADD_HISTORY_SITE,
        siteDetail: {
          location: 'https://clifton.io/',
          title: 'Clifton'
        }
      })
      const expectedState = state
        .set('historySites', Immutable.fromJS({
          'https://clifton.io/|0': {
            count: 1,
            favicon: undefined,
            key: 'https://clifton.io/|0',
            lastAccessedTime: 0,
            location: 'https://clifton.io/',
            objectId: null,
            skipSync: null,
            partitionNumber: 0,
            themeColor: undefined,
            title: 'Clifton'
          }
        }))
        .setIn(['about', 'history'], Immutable.fromJS({
          entries: [
            {
              count: 1,
              favicon: undefined,
              key: 'https://clifton.io/|0',
              lastAccessedTime: 0,
              location: 'https://clifton.io/',
              objectId: null,
              partitionNumber: 0,
              skipSync: null,
              themeColor: undefined,
              title: 'Clifton'
            }
          ],
          updatedStamp: 0
        }))
      assert.equal(spy.calledOnce, true)
      assert.equal(spyAbout.calledOnce, true)
      assert.deepEqual(newState.toJS(), expectedState.toJS())
    })
  })

  describe('APP_REMOVE_HISTORY_SITE', function () {
    let spy, spyAbout

    afterEach(function () {
      spy.restore()
      spyAbout.restore()
    })

    it('null case', function () {
      spy = sinon.spy(historyState, 'removeSite')
      spyAbout = sinon.spy(aboutHistoryState, 'setHistory')
      const newState = historyReducer(state, {
        actionType: appConstants.APP_REMOVE_HISTORY_SITE
      })
      assert.equal(spy.notCalled, true)
      assert.equal(spyAbout.notCalled, true)
      assert.deepEqual(newState.toJS(), state.toJS())
    })

    it('historyKey is a list', function () {
      spy = sinon.spy(historyState, 'removeSite')
      spyAbout = sinon.spy(aboutHistoryState, 'setHistory')
      const newState = historyReducer(stateWithData, {
        actionType: appConstants.APP_REMOVE_HISTORY_SITE,
        historyKey: [
          'https://clifton.io/|0',
          'https://brave.com/|0'
        ]
      })
      assert.equal(spy.callCount, 2)
      assert.equal(spyAbout.calledOnce, true)
      assert.deepEqual(newState.toJS(), state.toJS())
    })

    it('historyKey is a map', function () {
      spy = sinon.spy(historyState, 'removeSite')
      spyAbout = sinon.spy(aboutHistoryState, 'setHistory')
      const newState = historyReducer(stateWithData, {
        actionType: appConstants.APP_REMOVE_HISTORY_SITE,
        historyKey: 'https://brave.com/|0'
      })
      const expectedState = state
        .set('historySites', Immutable.fromJS({
          'https://clifton.io/|0': {
            count: 1,
            favicon: undefined,
            key: 'https://clifton.io/|0',
            lastAccessedTime: 0,
            location: 'https://clifton.io/',
            objectId: null,
            partitionNumber: 0,
            themeColor: undefined,
            title: 'Clifton'
          }
        }))
        .setIn(['about', 'history'], Immutable.fromJS({
          entries: [
            {
              count: 1,
              favicon: undefined,
              key: 'https://clifton.io/|0',
              lastAccessedTime: 0,
              location: 'https://clifton.io/',
              objectId: null,
              partitionNumber: 0,
              themeColor: undefined,
              title: 'Clifton'
            }
          ],
          updatedStamp: 0
        }))
      assert.equal(spy.calledOnce, true)
      assert.equal(spyAbout.calledOnce, true)
      assert.deepEqual(newState.toJS(), expectedState.toJS())
    })
  })

  describe('APP_POPULATE_HISTORY', function () {
    let spy

    afterEach(function () {
      spy.restore()
    })

    it('is working', function () {
      spy = sinon.spy(aboutHistoryState, 'setHistory')
      const customState = stateWithData.delete('about')
      let newState = historyReducer(customState, {
        actionType: appConstants.APP_POPULATE_HISTORY
      })
      const expectedState = stateWithData
        .setIn(['about', 'history', 'entries'], Immutable.fromJS([
          {
            lastAccessedTime: 0,
            objectId: null,
            count: 1,
            favicon: undefined,
            key: 'https://clifton.io/|0',
            location: 'https://clifton.io/',
            partitionNumber: 0,
            themeColor: undefined,
            title: 'Clifton'
          },
          {
            lastAccessedTime: 0,
            objectId: null,
            count: 1,
            favicon: undefined,
            key: 'https://brave.com/|0',
            location: 'https://brave.com/',
            partitionNumber: 0,
            themeColor: undefined,
            title: 'Brave'
          }
        ]))
        .setIn(['about', 'history', 'updatedStamp'], 0)

      newState = newState.setIn(['about', 'history', 'updatedStamp'], 0)
      assert.equal(spy.calledOnce, true)
      assert.deepEqual(newState.toJS(), expectedState.toJS())
    })
  })
})
