/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

/* global describe, it, before, beforeEach, after */
const Immutable = require('immutable')
const assert = require('assert')
const sinon = require('sinon')
const mockery = require('mockery')

describe('pageDataState unit tests', function () {
  let pageDataState, isPrivate, clock, now

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

  const stateWithData = Immutable.fromJS({
    pageData: {
      view: {
        timestamp: 0,
        url: 'https://brave.com',
        tabId: 1
      },
      load: [
        {
          timestamp: 0,
          url: 'https://brave.com',
          tabId: 1
        }
      ],
      info: {
        'https://brave.com/': {
          timestamp: 0,
          url: 'https://brave.com',
          tabId: 1
        }
      },
      last: {
        info: '',
        tabId: 1
      }
    }
  })

  before(function () {
    clock = sinon.useFakeTimers()
    now = new Date(0)
    mockery.enable({
      warnOnReplace: false,
      warnOnUnregistered: false,
      useCleanCache: true
    })
    mockery.registerMock('../../browser/webContentsCache', {
      getWebContents: (tabId) => {
        if (tabId == null) return null

        return {
          isDestroyed: () => false,
          session: {
            partition: isPrivate ? '' : 'persist:0'
          }
        }
      }
    })
    pageDataState = require('../../../../../app/common/state/pageDataState')
  })

  beforeEach(function () {
    isPrivate = false
  })

  after(function () {
    mockery.disable()
    clock.restore()
  })

  describe('addView', function () {
    it('null case', function () {
      const result = pageDataState.addView(state)
      const expectedResult = state
        .setIn(['pageData', 'last', 'tabId'], null)
        .setIn(['pageData', 'last', 'url'], null)
        .setIn(['pageData', 'view'], Immutable.fromJS({
          timestamp: now.getTime(),
          url: null,
          tabId: null
        }))
      assert.deepEqual(result.toJS(), expectedResult.toJS())
    })

    it('url is the same as last one', function () {
      const newState = state
        .setIn(['pageData', 'view'], Immutable.fromJS({
          timestamp: now.getTime(),
          url: 'https://brave.com',
          tabId: 1
        }))
      const result = pageDataState.addView(newState, 'https://brave.com', 1)
      const expectedResult = newState
        .setIn(['pageData', 'last', 'tabId'], 1)

      assert.deepEqual(result.toJS(), expectedResult.toJS())
    })

    it('url is private', function () {
      isPrivate = true

      const result = pageDataState.addView(state, 'https://brave.com', 1)
      const expectedResult = state
        .setIn(['pageData', 'last', 'tabId'], 1)
        .setIn(['pageData', 'last', 'url'], null)
        .setIn(['pageData', 'view'], Immutable.fromJS({
          timestamp: now.getTime(),
          url: null,
          tabId: 1
        }))

      assert.deepEqual(result.toJS(), expectedResult.toJS())
    })

    it('url is about page', function () {
      const result = pageDataState.addView(state, 'about:history', 1)
      const expectedResult = state
        .setIn(['pageData', 'last', 'tabId'], 1)
        .setIn(['pageData', 'last', 'url'], null)
        .setIn(['pageData', 'view'], Immutable.fromJS({
          timestamp: now.getTime(),
          url: null,
          tabId: 1
        }))

      assert.deepEqual(result.toJS(), expectedResult.toJS())
    })

    it('url is ok', function () {
      const result = pageDataState.addView(state, 'https://brave.com', 1)
      const expectedResult = state
        .setIn(['pageData', 'last', 'tabId'], 1)
        .setIn(['pageData', 'last', 'url'], 'https://brave.com')
        .setIn(['pageData', 'view'], Immutable.fromJS({
          timestamp: now.getTime(),
          url: 'https://brave.com',
          tabId: 1
        }))

      assert.deepEqual(result.toJS(), expectedResult.toJS())
    })
  })

  describe('addInfo', function () {
    it('null case', function () {
      const result = pageDataState.addInfo(state)
      assert.deepEqual(result.toJS(), state.toJS())
    })

    it('data is ok', function () {
      const data = Immutable.fromJS({
        timestamp: now.getTime(),
        url: 'https://brave.com'
      })

      const result = pageDataState.addInfo(state, data)
      const expectedResult = state
        .setIn(['pageData', 'info', 'https://brave.com/'], data.set('key', 'https://brave.com/'))
        .setIn(['pageData', 'last', 'info'], 'https://brave.com/')
      assert.deepEqual(result.toJS(), expectedResult.toJS())
    })
  })

  describe('addLoad', function () {
    it('null case', function () {
      const result = pageDataState.addLoad(state)
      assert.deepEqual(result.toJS(), state.toJS())
    })

    it('data is ok', function () {
      const result = pageDataState.addLoad(state)
      assert.deepEqual(result.toJS(), state.toJS())
    })

    it('we only take last 100 views', function () {
      let newState = state

      for (let i = 0; i < 100; i++) {
        const data = Immutable.fromJS([{
          timestamp: now.getTime(),
          url: `https://page${i}.com`,
          tabId: 1
        }])
        newState = newState.setIn(['pageData', 'load'], newState.getIn(['pageData', 'load']).push(data))
      }

      const newLoad = Immutable.fromJS({
        timestamp: now.getTime(),
        url: 'https://brave.com',
        tabId: 1
      })

      const result = pageDataState.addLoad(newState, newLoad)
      const expectedResult = newState
        .setIn(['pageData', 'load'], newState.getIn(['pageData', 'load']).shift())
        .setIn(['pageData', 'load'], newState.getIn(['pageData', 'load']).push(newLoad))

      assert.deepEqual(result.toJS(), expectedResult.toJS())
    })
  })

  describe('getView', function () {
    it('null case', function () {
      const result = pageDataState.getView(state)
      assert.deepEqual(result, Immutable.Map())
    })

    it('data is ok', function () {
      const result = pageDataState.getView(stateWithData)
      assert.deepEqual(result.toJS(), stateWithData.getIn(['pageData', 'view']).toJS())
    })
  })

  describe('getLastInfo', function () {
    it('null case', function () {
      const result = pageDataState.getLastInfo(state)
      assert.deepEqual(result, Immutable.Map())
    })

    it('key is provided, but data is not there', function () {
      const newState = state
        .setIn(['pageData', 'last', 'info'], 'https://brave.com/')
        .setIn(['pageData', 'info', 'https://test.com/'], Immutable.fromJS({
          timestamp: now.getTime(),
          url: 'https://test.com',
          tabId: 1
        }))

      const result = pageDataState.getLastInfo(newState)
      assert.deepEqual(result, Immutable.Map())
    })

    it('key is provided and data is there', function () {
      const info = Immutable.fromJS({
        timestamp: now.getTime(),
        url: 'https://brave.com',
        tabId: 1
      })

      const newState = state
        .setIn(['pageData', 'last', 'info'], 'https://brave.com/')
        .setIn(['pageData', 'info', 'https://brave.com/'], info)

      const result = pageDataState.getLastInfo(newState)
      assert.deepEqual(result.toJS(), info.toJS())
    })
  })

  describe('getLoad', function () {
    it('null case', function () {
      const result = pageDataState.getLoad(state)
      assert.deepEqual(result, Immutable.List())
    })

    it('data is there', function () {
      const result = pageDataState.getLoad(stateWithData)
      assert.deepEqual(result.toJS(), stateWithData.getIn(['pageData', 'load']).toJS())
    })
  })

  describe('getLastActiveTabId', function () {
    it('null case', function () {
      const result = pageDataState.getLastActiveTabId(state)
      assert.deepEqual(result, null)
    })

    it('data is there', function () {
      const result = pageDataState.getLastActiveTabId(stateWithData)
      assert.deepEqual(result, 1)
    })
  })

  describe('setLastActiveTabId', function () {
    it('id is saved', function () {
      const result = pageDataState.setLastActiveTabId(state, 10)
      const expectedState = state.setIn(['pageData', 'last', 'tabId'], 10)
      assert.deepEqual(result.toJS(), expectedState.toJS())
    })
  })

  describe('setPublisher', function () {
    it('null case', function () {
      const result = pageDataState.setPublisher(state)
      assert.deepEqual(result.toJS(), state.toJS())
    })

    it('data is ok', function () {
      const result = pageDataState.setPublisher(stateWithData, 'https://brave.com/', 'https://brave.com')
      const expectedState = stateWithData.setIn(['pageData', 'info', 'https://brave.com/', 'publisher'], 'https://brave.com')
      assert.deepEqual(result.toJS(), expectedState.toJS())
    })
  })
})
