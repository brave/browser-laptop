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
})
