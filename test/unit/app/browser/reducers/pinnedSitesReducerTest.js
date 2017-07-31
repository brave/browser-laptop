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
      title: 'Brave'
    }],
    tabsInternal: {
      index: {
        1: 0
      }
    },
    pinnedSites: {
      'https://brave.com/|0': {
        location: 'https://brave.com/',
        order: 0,
        title: 'Brave',
        partitionNumber: 0
      },
      'https://clifton.io/|0': {
        location: 'https://clifton.io/',
        order: 1,
        title: 'Clifton',
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

  describe('APP_ON_PINNED_TAB_REORDER', function () {
    let spy

    afterEach(function () {
      spy.restore()
    })

    it('null case', function () {
      spy = sinon.spy(pinnedSitesState, 'reOrderSite')
      const newState = pinnedSitesReducer(state, {
        actionType: appConstants.APP_ON_PINNED_TAB_REORDER
      })
      assert.equal(spy.notCalled, true)
      assert.deepEqual(newState.toJS(), state.toJS())
    })

    it('check if works', function () {
      spy = sinon.spy(pinnedSitesState, 'reOrderSite')
      const newState = pinnedSitesReducer(stateWithData, {
        actionType: appConstants.APP_ON_PINNED_TAB_REORDER,
        siteKey: 'https://clifton.io/|0',
        destinationKey: 'https://brave.com/|0',
        prepend: true
      })
      const expectedState = state.setIn(['pinnedSites'], Immutable.fromJS({
        'https://clifton.io/|0': {
          location: 'https://clifton.io/',
          order: 0,
          title: 'Clifton',
          partitionNumber: 0
        },
        'https://brave.com/|0': {
          location: 'https://brave.com/',
          order: 1,
          title: 'Brave',
          partitionNumber: 0
        }
      }))
      assert.equal(spy.calledOnce, true)
      assert.deepEqual(newState.toJS(), expectedState.toJS())
    })
  })
})
