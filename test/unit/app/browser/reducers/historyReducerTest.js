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
const settings = require('../../../../../js/constants/settings')
const {getSetting} = require('../../../../../js/settings')
const fakeElectron = require('../../../lib/fakeElectron')

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
          },
          {
            count: 2,
            favicon: undefined,
            key: 'https://brave.com/|1',
            lastAccessedTime: 0,
            location: 'https://brave.com/',
            objectId: null,
            partitionNumber: 0,
            themeColor: undefined,
            title: 'Brave | Another Page'
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
    mockery.registerMock('../../../js/settings', {
      getSetting: (settingKey) => {
        switch (settingKey) {
          case settings.AUTOCOMPLETE_HISTORY_SIZE:
            return 500
        }
        return false
      }
    })
    mockery.registerMock('electron', fakeElectron)
    historyState = require('../../../../../app/common/state/historyState')
    aboutHistoryState = require('../../../../../app/common/state/aboutHistoryState')
    historyReducer = require('../../../../../app/browser/reducers/historyReducer')
  })

  after(function () {
    mockery.disable()
    this.clock.restore()
  })

  describe('APP_ON_CLEAR_BROWSING_DATA', function () {
    let spy

    before(function () {
      spy = sinon.spy(historyState, 'clearSites')
    })

    afterEach(function () {
      spy.reset()
    })

    after(function () {
      spy.restore()
    })

    it('null case', function () {
      const newState = historyReducer(state, {
        actionType: appConstants.APP_ON_CLEAR_BROWSING_DATA
      })
      assert.equal(spy.notCalled, true)
      assert.deepEqual(newState.toJS(), state.toJS())
    })

    it('clearBrowsingDataDefaults is provided', function () {
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

    before(function () {
      this.clock = sinon.useFakeTimers()
      this.clock.tick(0)
      spy = sinon.spy(historyState, 'addSite')
      spyAbout = sinon.spy(aboutHistoryState, 'setHistory')
    })

    afterEach(function () {
      spy.reset()
      spyAbout.reset()
    })

    after(function () {
      spy.restore()
      spyAbout.restore()
    })

    it('null case', function () {
      const newState = historyReducer(state, {
        actionType: appConstants.APP_ADD_HISTORY_SITE
      })
      assert.equal(spy.notCalled, true)
      assert.equal(spyAbout.notCalled, true)
      assert.deepEqual(newState.toJS(), state.toJS())
    })

    it('siteDetail is a list', function () {
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

  describe('APP_REMOVE_HISTORY_DOMAIN', function () {
    let spy, spyAbout

    before(function () {
      spy = sinon.spy(historyState, 'removeSite')
      spyAbout = sinon.spy(aboutHistoryState, 'setHistory')
    })

    afterEach(function () {
      spy.reset()
      spyAbout.reset()
    })

    after(function () {
      spy.restore()
      spyAbout.restore()
    })

    it('null case', function () {
      const newState = historyReducer(state, {
        actionType: appConstants.APP_REMOVE_HISTORY_DOMAIN
      })
      assert.equal(spy.notCalled, true)
      assert.equal(spyAbout.notCalled, true)
      assert.deepEqual(newState.toJS(), state.toJS())
    })

    it('domain is a string', function () {
      const newState = historyReducer(stateWithData, {
        actionType: appConstants.APP_REMOVE_HISTORY_DOMAIN,
        domain: 'https://brave.com'
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

      it('calls remove for each matching domain', () => {
        assert.equal(spy.calledTwice, true)
      })

      it('sets the history with the update site list', () => {
        assert.equal(spyAbout.calledOnce, true)
      })

      it('returns the updated state', () => {
        assert.deepEqual(newState.toJS(), expectedState.toJS())
      })
    })
  })

  describe('APP_REMOVE_HISTORY_SITE', function () {
    let spy, spyAbout

    before(function () {
      spy = sinon.spy(historyState, 'removeSite')
      spyAbout = sinon.spy(aboutHistoryState, 'setHistory')
    })

    afterEach(function () {
      spy.reset()
      spyAbout.reset()
    })

    after(function () {
      spy.restore()
      spyAbout.restore()
    })

    it('null case', function () {
      const newState = historyReducer(state, {
        actionType: appConstants.APP_REMOVE_HISTORY_SITE
      })
      assert.equal(spy.notCalled, true)
      assert.equal(spyAbout.notCalled, true)
      assert.deepEqual(newState.toJS(), state.toJS())
    })

    it('historyKey is a list', function () {
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

    before(function () {
      spy = sinon.spy(aboutHistoryState, 'setHistory')
    })

    afterEach(function () {
      spy.reset()
    })

    after(function () {
      spy.restore()
    })

    it('is working', function () {
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

  describe('APP_ON_HISTORY_LIMIT', function () {
    let spyAbout

    before(function () {
      spyAbout = sinon.spy(aboutHistoryState, 'setHistory')
    })

    afterEach(function () {
      spyAbout.reset()
    })

    after(function () {
      spyAbout.restore()
    })

    it('we do not change anything if we are bellow the limit', function () {
      let newState = state
      const limit = 20

      for (let i = 0; i < limit; i++) {
        newState = newState.setIn(['historySites', `h${i}|0`], Immutable.fromJS({
          [`https://h${i}.io/|0`]: {
            count: i,
            key: `https://h${i}.io/|0`,
            location: `https://h${i}.io/`,
            partitionNumber: 0
          }
        }))
      }

      const result = historyReducer(newState, {
        actionType: appConstants.APP_ON_HISTORY_LIMIT
      })

      assert(spyAbout.notCalled)
      assert.deepEqual(result.get('historySites').size, limit)
    })

    it('we limit history size to the max history limit', function () {
      let newState = state
      const maxSize = getSetting(settings.AUTOCOMPLETE_HISTORY_SIZE)

      for (let i = 0; i <= (maxSize + 1); i++) {
        newState = newState.setIn(['historySites', `h${i}|0`], Immutable.fromJS({
          [`https://h${i}.io/|0`]: {
            count: i,
            key: `https://h${i}.io/|0`,
            location: `https://h${i}.io/`,
            partitionNumber: 0
          }
        }))
      }

      const result = historyReducer(newState, {
        actionType: appConstants.APP_ON_HISTORY_LIMIT
      })

      assert(spyAbout.calledOnce)
      assert.deepEqual(result.get('historySites').size, maxSize)
    })
  })
})
