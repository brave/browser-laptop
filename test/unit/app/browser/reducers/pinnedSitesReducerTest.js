/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at https://mozilla.org/MPL/2.0/. */

/* global describe, it, before, after, afterEach */
const mockery = require('mockery')
const Immutable = require('immutable')
const assert = require('assert')
const sinon = require('sinon')
const fakeElectron = require('../../../lib/fakeElectron')
const fakeAdBlock = require('../../../lib/fakeAdBlock')
const appConstants = require('../../../../../js/constants/appConstants')

require('../../../braveUnit')

describe('pinnedSitesReducer unit test', function () {
  let pinnedSitesReducer, pinnedSitesState

  const state = Immutable.fromJS({
    windows: [],
    cache: {},
    tabs: [{
      tabId: 1,
      windowId: 1,
      windowUUID: 'uuid',
      url: 'https://brave.com/',
      title: 'Brave'
    }],
    tabsInternal: {
      index: {
        1: 0
      }
    },
    pinnedSites: {}
  })

  const stateWithData = Immutable.fromJS({
    windows: [],
    cache: {},
    tabs: [{
      tabId: 1,
      windowId: 1,
      windowUUID: 'uuid',
      url: 'https://brave.com/',
      title: 'Brave',
      partitionNumber: 0,
      pinned: true,
      index: 0
    }, {
      tabId: 2,
      windowId: 1,
      windowUUID: 'uuid',
      url: 'https://petemill.com/',
      title: 'Brave',
      partitionNumber: 0,
      pinned: true,
      index: 1
    }, {
      tabId: 3,
      windowId: 1,
      windowUUID: 'uuid',
      url: 'https://clifton.io/',
      title: 'Brave',
      partitionNumber: 0,
      pinned: true,
      index: 2
    }],
    tabsInternal: {
      index: {
        3: 2,
        2: 1,
        1: 0
      }
    },
    pinnedSites: {
      'https://brave.com/|0': {
        location: 'https://brave.com/',
        order: 2, // changed to 0
        title: 'Brave',
        partitionNumber: 0
      },
      'https://clifton.io/|0': {
        location: 'https://clifton.io/',
        order: 0, // changed to 1
        title: 'Clifton',
        partitionNumber: 0
      },
      'https://petemill.com/|0': {
        location: 'https://petemill.com/',
        order: 1, // changed to 2
        title: 'Pete',
        partitionNumber: 0
      }
    }
  })

  before(function () {
    mockery.enable({
      warnOnReplace: false,
      warnOnUnregistered: false,
      useCleanCache: true
    })
    mockery.registerMock('electron', fakeElectron)
    mockery.registerMock('ad-block', fakeAdBlock)
    pinnedSitesReducer = require('../../../../../app/browser/reducers/pinnedSitesReducer')
    pinnedSitesState = require('../../../../../app/common/state/pinnedSitesState')
  })

  after(function () {
    mockery.disable()
  })

  describe('APP_TAB_UPDATED', function () {
    let spyAdd, spyRemove

    afterEach(function () {
      spyAdd.restore()
      spyRemove.restore()
    })

    it('null case', function () {
      spyAdd = sinon.spy(pinnedSitesState, 'addPinnedSite')
      spyRemove = sinon.spy(pinnedSitesState, 'removePinnedSite')
      const newState = pinnedSitesReducer(state, {
        actionType: appConstants.APP_TAB_UPDATED
      })
      assert.equal(spyAdd.notCalled, true)
      assert.equal(spyRemove.notCalled, true)
      assert.deepEqual(newState.toJS(), state.toJS())
    })

    it('tab doesnt exist', function () {
      spyAdd = sinon.spy(pinnedSitesState, 'addPinnedSite')
      spyRemove = sinon.spy(pinnedSitesState, 'removePinnedSite')
      const newState = pinnedSitesReducer(state, {
        actionType: appConstants.APP_TAB_UPDATED,
        changeInfo: {
          pinned: {
            test: 0
          }
        }
      })
      assert.equal(spyAdd.notCalled, true)
      assert.equal(spyRemove.notCalled, true)
      assert.deepEqual(newState.toJS(), state.toJS())
    })

    it('add pinned site', function () {
      spyAdd = sinon.spy(pinnedSitesState, 'addPinnedSite')
      spyRemove = sinon.spy(pinnedSitesState, 'removePinnedSite')
      const newState = pinnedSitesReducer(state, {
        actionType: appConstants.APP_TAB_UPDATED,
        changeInfo: {
          pinned: true
        },
        tabValue: {
          tabId: 1
        }
      })
      const expectedState = state.setIn(['pinnedSites', 'https://brave.com/|0'], Immutable.fromJS({
        location: 'https://brave.com/',
        order: 0,
        title: 'Brave',
        partitionNumber: 0
      }))
      assert.equal(spyAdd.calledOnce, true)
      assert.equal(spyRemove.notCalled, true)
      assert.deepEqual(newState.toJS(), expectedState.toJS())
    })

    it('remove pinned site', function () {
      spyAdd = sinon.spy(pinnedSitesState, 'addPinnedSite')
      spyRemove = sinon.spy(pinnedSitesState, 'removePinnedSite')
      const newState = pinnedSitesReducer(state, {
        actionType: appConstants.APP_TAB_UPDATED,
        changeInfo: {
          pinned: false
        },
        tabValue: {
          tabId: 1
        }
      })
      assert.equal(spyAdd.notCalled, true)
      assert.equal(spyRemove.calledOnce, true)
      assert.deepEqual(newState.toJS(), state.toJS())
    })

    it('reorder pinned site', function () {
      // for this test there are three tabs, in completely different
      // order than the 'pinned sites' state, but we only learn
      // about each tab index change one at a time
      // i.e. tabs are at b:0 p:1 c:2 but pinned state has c:0 p:1 b:2
      //      and we learn about b moving to 0 first, then c moving to 2
      // first tab
      const actualFirst = pinnedSitesReducer(stateWithData, {
        actionType: appConstants.APP_TAB_UPDATED,
        changeInfo: {
          index: 1 // irrelevant
        },
        tabValue: {
          tabId: 1 // b
        }
      })
      let expectedFirstState = stateWithData
        .setIn(['pinnedSites', 'https://clifton.io/|0', 'order'], 1)
        .setIn(['pinnedSites', 'https://brave.com/|0', 'order'], 0)
        .setIn(['pinnedSites', 'https://petemill.com/|0', 'order'], 2)
      assert.deepEqual(actualFirst.toJS(), expectedFirstState.toJS())
      // second tab (it was swapped with)
      const actualSecond = pinnedSitesReducer(actualFirst, {
        actionType: appConstants.APP_TAB_UPDATED,
        changeInfo: {
          index: 1 // irrelevant
        },
        tabValue: {
          tabId: 3 // c
        }
      })
      let expectedSecondState = stateWithData
        .setIn(['pinnedSites', 'https://clifton.io/|0', 'order'], 2)
        .setIn(['pinnedSites', 'https://brave.com/|0', 'order'], 0)
        .setIn(['pinnedSites', 'https://petemill.com/|0', 'order'], 1)
      assert.deepEqual(actualSecond.toJS(), expectedSecondState.toJS())
    })
  })

  describe('APP_CREATE_TAB_REQUESTED', function () {
    let spy

    afterEach(function () {
      spy.restore()
    })

    it('null case', function () {
      spy = sinon.spy(pinnedSitesState, 'addPinnedSite')
      const newState = pinnedSitesReducer(state, {
        actionType: appConstants.APP_CREATE_TAB_REQUESTED
      })
      assert.equal(spy.notCalled, true)
      assert.deepEqual(newState.toJS(), state.toJS())
    })

    it('add pinned site', function () {
      spy = sinon.spy(pinnedSitesState, 'addPinnedSite')
      const newState = pinnedSitesReducer(state, {
        actionType: appConstants.APP_CREATE_TAB_REQUESTED,
        createProperties: {
          pinned: true,
          url: 'https://brave.com/'
        }
      })
      const expectedState = state.setIn(['pinnedSites', 'https://brave.com/|0'], Immutable.fromJS({
        location: 'https://brave.com/',
        order: 0
      }))
      assert.equal(spy.calledOnce, true)
      assert.deepEqual(newState.toJS(), expectedState.toJS())
    })
  })
})
