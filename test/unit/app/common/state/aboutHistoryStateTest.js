/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

/* global describe, it, before, after */
const aboutHistoryState = require('../../../../../app/common/state/aboutHistoryState')
const Immutable = require('immutable')
const assert = require('assert')
const sinon = require('sinon')

const defaultAppState = Immutable.fromJS({
  about: {
    history: {
      entries: {},
      updatedStamp: 0
    }
  }
})

const arbitraryTimeInThePast = 1450000000000

const historyItems = Immutable.fromJS({
  'https://brave.com/|0': {
    location: 'https://brave.com'
  }
})

const assertTimeUpdated = (state) => {
  const updatedStamp = state.getIn(['about', 'history', 'updatedStamp'])
  assert.equal(typeof updatedStamp === 'number' && updatedStamp > arbitraryTimeInThePast, true)
}

describe('aboutHistoryState unit test', function () {
  describe('getHistory', function () {
    it('reads the history from the state', function () {
      const state = defaultAppState.setIn(['about', 'history', 'entries'], historyItems)
      const history = aboutHistoryState.getHistory(state)
      assert.deepEqual(state.getIn(['about', 'history']).toJS(), history.toJS())
    })
  })

  describe('setHistory', function () {
    it('updates the `updatedStamp` value on success', function () {
      const state = aboutHistoryState.setHistory(defaultAppState)
      assertTimeUpdated(state)
    })
  })

  describe('clearHistory', function () {
    before(function () {
      this.clock = sinon.useFakeTimers()
      this.clock.tick(0)
    })

    after(function () {
      this.clock.restore()
    })

    it('history is cleared', function () {
      const state = defaultAppState.setIn(['about', 'history', 'entries'], historyItems)
      const history = aboutHistoryState.clearHistory(state)
      assert.deepEqual(history.toJS(), defaultAppState.toJS())
    })
  })
})
