/* global describe, it */
const aboutHistoryState = require('../../../../app/common/state/aboutHistoryState')
const Immutable = require('immutable')
const assert = require('assert')

const defaultAppState = Immutable.fromJS({
  about: {
    history: {
      entries: [],
      updatedStamp: undefined
    }
  }
})

const arbitraryTimeInThePast = 1450000000000

const assertTimeUpdated = (state) => {
  const updatedStamp = state.getIn(['about', 'history', 'updatedStamp'])
  assert.equal(typeof updatedStamp === 'number' && updatedStamp > arbitraryTimeInThePast, true)
}

describe('aboutHistoryState', function () {
  describe('getHistory', function () {
    it('reads the history from the state', function () {
      const fakeHistoryEntries = [1, 2, 3]
      const state = defaultAppState.setIn(['about', 'history', 'entries'], fakeHistoryEntries)
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
})
