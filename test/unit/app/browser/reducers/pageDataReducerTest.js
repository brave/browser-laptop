/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at https://mozilla.org/MPL/2.0/. */

/* global describe, it, before, beforeEach, after, afterEach */
const mockery = require('mockery')
const Immutable = require('immutable')
const assert = require('assert')
const sinon = require('sinon')

const appConstants = require('../../../../../js/constants/appConstants')
const windowConstants = require('../../../../../js/constants/windowConstants')

describe('pageDataReducer unit tests', function () {
  let pageDataReducer, pageDataState, isFocused

  const state = Immutable.fromJS({
    pageData: {
      view: {},
      load: [],
      info: {},
      last: {
        info: '',
        tabId: null
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
    mockery.registerMock('electron', {
      BrowserWindow: {
        getAllWindows: function () {
          return [{
            id: 1,
            isFocused: () => isFocused
          }]
        }
      }
    })
    mockery.registerMock('../../browser/webContentsCache', {
      getWebContents: (tabId) => {
        if (tabId == null) return null

        return {
          isDestroyed: () => false,
          session: {
            partition: 'persist:0'
          }
        }
      }
    })
    pageDataState = require('../../../../../app/common/state/pageDataState')
    pageDataReducer = require('../../../../../app/browser/reducers/pageDataReducer')
  })

  beforeEach(function () {
    isFocused = false
  })

  after(function () {
    mockery.disable()
    this.clock.restore()
  })

  describe('WINDOW_SET_FOCUSED_FRAME', function () {
    let spy

    afterEach(function () {
      spy.restore()
    })

    it('null case', function () {
      spy = sinon.spy(pageDataState, 'addView')
      const result = pageDataReducer(state, {
        actionType: windowConstants.WINDOW_SET_FOCUSED_FRAME
      })

      assert.equal(spy.notCalled, true)
      assert.deepEqual(result.toJS(), state.toJS())
    })

    it('data is ok', function () {
      spy = sinon.spy(pageDataState, 'addView')
      const result = pageDataReducer(state, {
        actionType: windowConstants.WINDOW_SET_FOCUSED_FRAME,
        location: 'https://brave.com',
        tabId: 1
      })

      const expectedState = state
        .setIn(['pageData', 'last', 'tabId'], 1)
        .setIn(['pageData', 'view'], Immutable.fromJS({
          timestamp: 0,
          url: 'https://brave.com',
          tabId: 1
        }))

      assert.equal(spy.calledOnce, true)
      assert.deepEqual(result.toJS(), expectedState.toJS())
    })
  })

  describe('APP_WINDOW_BLURRED', function () {
    let spy

    afterEach(function () {
      spy.restore()
    })

    it('there is one focused window', function () {
      isFocused = true
      spy = sinon.spy(pageDataState, 'addView')
      const result = pageDataReducer(state, {
        actionType: appConstants.APP_WINDOW_BLURRED
      })

      assert.equal(spy.notCalled, true)
      assert.deepEqual(result.toJS(), state.toJS())
    })

    it('there is no focused windows', function () {
      spy = sinon.spy(pageDataState, 'addView')
      const result = pageDataReducer(state, {
        actionType: appConstants.APP_WINDOW_BLURRED
      })

      const expectedState = state
        .setIn(['pageData', 'last', 'tabId'], null)
        .setIn(['pageData', 'view'], Immutable.fromJS({
          timestamp: 0,
          url: null,
          tabId: null
        }))

      assert.equal(spy.calledOnce, true)
      assert.deepEqual(result.toJS(), expectedState.toJS())
    })
  })

  describe('APP_IDLE_STATE_CHANGED', function () {
    let spy

    afterEach(function () {
      spy.restore()
    })

    it('null case', function () {
      spy = sinon.spy(pageDataState, 'addView')
      const result = pageDataReducer(state, {
        actionType: appConstants.APP_IDLE_STATE_CHANGED
      })

      assert.equal(spy.notCalled, true)
      assert.deepEqual(result.toJS(), state.toJS())
    })

    it('idleState is active', function () {
      spy = sinon.spy(pageDataState, 'addView')
      const result = pageDataReducer(state, {
        actionType: appConstants.APP_IDLE_STATE_CHANGED,
        idleState: 'active'
      })

      assert.equal(spy.notCalled, true)
      assert.deepEqual(result.toJS(), state.toJS())
    })

    it('idleState is not active', function () {
      spy = sinon.spy(pageDataState, 'addView')
      const result = pageDataReducer(state, {
        actionType: appConstants.APP_IDLE_STATE_CHANGED,
        idleState: 'nonactive'
      })

      const expectedState = state
        .setIn(['pageData', 'last', 'tabId'], null)
        .setIn(['pageData', 'view'], Immutable.fromJS({
          timestamp: 0,
          url: null,
          tabId: null
        }))

      assert.equal(spy.calledOnce, true)
      assert.deepEqual(result.toJS(), expectedState.toJS())
    })
  })

  describe('APP_WINDOW_CLOSED', function () {
    let spy

    afterEach(function () {
      spy.restore()
    })

    it('data is ok', function () {
      spy = sinon.spy(pageDataState, 'addView')
      const result = pageDataReducer(state, {
        actionType: appConstants.APP_WINDOW_CLOSED
      })

      const expectedState = state
        .setIn(['pageData', 'last', 'tabId'], null)
        .setIn(['pageData', 'view'], Immutable.fromJS({
          timestamp: 0,
          url: null,
          tabId: null
        }))

      assert.equal(spy.calledOnce, true)
      assert.deepEqual(result.toJS(), expectedState.toJS())
    })
  })

  describe('event-set-page-info', function () {
    let spy

    afterEach(function () {
      spy.restore()
    })

    it('data is ok', function () {
      spy = sinon.spy(pageDataState, 'addInfo')
      const result = pageDataReducer(state, {
        actionType: 'event-set-page-info',
        pageInfo: {
          timestamp: 0,
          url: 'https://brave.com'
        }
      })

      const expectedState = state
        .setIn(['pageData', 'last', 'info'], 'https://brave.com/')
        .setIn(['pageData', 'info', 'https://brave.com/'], Immutable.fromJS({
          key: 'https://brave.com/',
          timestamp: 0,
          url: 'https://brave.com'
        }))

      assert.equal(spy.calledOnce, true)
      assert.deepEqual(result.toJS(), expectedState.toJS())
    })
  })

  describe('WINDOW_GOT_RESPONSE_DETAILS', function () {
    let spyView, spyActiveTab, spyLoad

    afterEach(function () {
      spyView.restore()
      spyActiveTab.restore()
      spyLoad.restore()
    })

    it('null case', function () {
      spyView = sinon.spy(pageDataState, 'addView')
      spyActiveTab = sinon.spy(pageDataState, 'getLastActiveTabId')
      spyLoad = sinon.spy(pageDataState, 'addLoad')
      const result = pageDataReducer(state, {
        actionType: windowConstants.WINDOW_GOT_RESPONSE_DETAILS
      })

      assert.equal(spyView.notCalled, true)
      assert.equal(spyActiveTab.notCalled, true)
      assert.equal(spyLoad.notCalled, true)
      assert.deepEqual(result.toJS(), state.toJS())
    })

    it('add view if we dont have last active tab', function () {
      spyView = sinon.spy(pageDataState, 'addView')
      spyActiveTab = sinon.spy(pageDataState, 'getLastActiveTabId')
      spyLoad = sinon.spy(pageDataState, 'addLoad')
      const result = pageDataReducer(state, {
        actionType: windowConstants.WINDOW_GOT_RESPONSE_DETAILS,
        details: {
          resourceType: 'mainFrame',
          newURL: 'https://brave.com'
        },
        tabId: 1
      })

      const expectedState = state
        .setIn(['pageData', 'last', 'tabId'], 1)
        .setIn(['pageData', 'view'], Immutable.fromJS({
          timestamp: 0,
          url: 'https://brave.com',
          tabId: 1
        }))

      assert.equal(spyView.calledOnce, true)
      assert.equal(spyActiveTab.calledOnce, true)
      assert.equal(spyLoad.notCalled, true)
      assert.deepEqual(result.toJS(), expectedState.toJS())
    })

    it('add view if tabId is the same as last active tab', function () {
      spyView = sinon.spy(pageDataState, 'addView')
      spyActiveTab = sinon.spy(pageDataState, 'getLastActiveTabId')
      spyLoad = sinon.spy(pageDataState, 'addLoad')

      const newState = state
        .setIn(['pageData', 'last', 'tabId'], 1)

      const result = pageDataReducer(newState, {
        actionType: windowConstants.WINDOW_GOT_RESPONSE_DETAILS,
        details: {
          resourceType: 'mainFrame',
          newURL: 'https://brave.com'
        },
        tabId: 1
      })

      const expectedState = newState
        .setIn(['pageData', 'last', 'tabId'], 1)
        .setIn(['pageData', 'view'], Immutable.fromJS({
          timestamp: 0,
          url: 'https://brave.com',
          tabId: 1
        }))

      assert.equal(spyView.calledOnce, true)
      assert.equal(spyActiveTab.calledOnce, true)
      assert.equal(spyLoad.notCalled, true)
      assert.deepEqual(result.toJS(), expectedState.toJS())
    })

    it('dont add view if tabId is different as last active tab', function () {
      spyView = sinon.spy(pageDataState, 'addView')
      spyActiveTab = sinon.spy(pageDataState, 'getLastActiveTabId')
      spyLoad = sinon.spy(pageDataState, 'addLoad')

      const newState = state
        .setIn(['pageData', 'last', 'tabId'], 2)

      const result = pageDataReducer(newState, {
        actionType: windowConstants.WINDOW_GOT_RESPONSE_DETAILS,
        details: {
          resourceType: 'mainFrame',
          newURL: 'https://brave.com'
        },
        tabId: 1
      })

      assert.equal(spyView.notCalled, true)
      assert.equal(spyActiveTab.calledOnce, true)
      assert.equal(spyLoad.notCalled, true)
      assert.deepEqual(result.toJS(), newState.toJS())
    })

    it('dont add load if response is not successful', function () {
      spyView = sinon.spy(pageDataState, 'addView')
      spyActiveTab = sinon.spy(pageDataState, 'getLastActiveTabId')
      spyLoad = sinon.spy(pageDataState, 'addLoad')

      const newState = state
        .setIn(['pageData', 'last', 'tabId'], 2)

      const result = pageDataReducer(newState, {
        actionType: windowConstants.WINDOW_GOT_RESPONSE_DETAILS,
        details: {
          resourceType: 'mainFrame',
          newURL: 'https://brave.com',
          httpResponseCode: 500
        },
        tabId: 1
      })

      assert.equal(spyView.notCalled, true)
      assert.equal(spyActiveTab.calledOnce, true)
      assert.equal(spyLoad.notCalled, true)
      assert.deepEqual(result.toJS(), newState.toJS())
    })

    it('dont add load if URL is about page', function () {
      spyView = sinon.spy(pageDataState, 'addView')
      spyActiveTab = sinon.spy(pageDataState, 'getLastActiveTabId')
      spyLoad = sinon.spy(pageDataState, 'addLoad')

      const newState = state
        .setIn(['pageData', 'last', 'tabId'], 2)

      const result = pageDataReducer(newState, {
        actionType: windowConstants.WINDOW_GOT_RESPONSE_DETAILS,
        details: {
          resourceType: 'mainFrame',
          newURL: 'about:history',
          httpResponseCode: 200
        },
        tabId: 1
      })

      assert.equal(spyView.notCalled, true)
      assert.equal(spyActiveTab.calledOnce, true)
      assert.equal(spyLoad.notCalled, true)
      assert.deepEqual(result.toJS(), newState.toJS())
    })

    it('add load', function () {
      spyView = sinon.spy(pageDataState, 'addView')
      spyActiveTab = sinon.spy(pageDataState, 'getLastActiveTabId')
      spyLoad = sinon.spy(pageDataState, 'addLoad')

      const details = {
        resourceType: 'mainFrame',
        newURL: 'https://brave.com',
        httpResponseCode: 200
      }
      const newState = state
        .setIn(['pageData', 'last', 'tabId'], 2)

      const result = pageDataReducer(newState, {
        actionType: windowConstants.WINDOW_GOT_RESPONSE_DETAILS,
        details: details,
        tabId: 1
      })

      const expectedState = newState
        .setIn(['pageData', 'load'], Immutable.fromJS([{
          timestamp: 0,
          url: 'https://brave.com',
          tabId: 1,
          details: details
        }]))

      assert.equal(spyView.notCalled, true)
      assert.equal(spyActiveTab.calledOnce, true)
      assert.equal(spyLoad.calledOnce, true)
      assert.deepEqual(result.toJS(), expectedState.toJS())
    })
  })
})
