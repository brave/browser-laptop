/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at https://mozilla.org/MPL/2.0/. */

/* global describe, it, before, beforeEach, after, afterEach */
const mockery = require('mockery')
const Immutable = require('immutable')
const assert = require('assert')
const sinon = require('sinon')

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
})
