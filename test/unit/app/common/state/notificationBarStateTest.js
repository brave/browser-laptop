/* global describe, it, beforeEach */
const notificationBarState = require('../../../../../app/common/state/notificationBarState')
const {isList} = require('../../../../../app/common/state/immutableUtil')
const Immutable = require('immutable')
const assert = require('chai').assert

const frameKey = 1
const index = 0
const site1 = 'https://nespressolovers.com'
let state
const defaultState = Immutable.fromJS({
  notifications: [],
  currentWindow: {
    framesInternal: {
      index: { 1: 0 },
      tabIndex: { 1: 0 }
    },
    frames: [{
      index,
      key: frameKey,
      tabId: 1,
      location: site1
    }],
    activeFrameKey: frameKey,
    tabs: [{
      key: frameKey,
      index: index
    }]
  }
})

describe('notificationBarState test', function () {
  beforeEach(function () {
    state = defaultState
  })
  describe('getNotifications', function () {
    it('returns an immutable list of notifications', function () {
      const notificationsList = Immutable.fromJS([
        { greeting: 'House Brave', message: 'The BAT is coming' },
        { frameOrigin: site1, message: 'nespresso site' }
      ])
      state = state.mergeIn(['notifications'], notificationsList)
      const result = notificationBarState.getNotifications(state)
      assert.equal(isList(result), true)
      assert.equal(result.size, 2)
    })

    it('Fallback to an empty Immutable List if not defined', function () {
      const result = notificationBarState.getNotifications(state)
      assert.equal(result.isEmpty(), true)
      assert.equal(isList(result), true)
    })
  })

  describe('getLedgerNotifications', function () {
    it('returns a list of ledger-related notifications', function () {
      const notificationsList = Immutable.fromJS([
        { from: 'ledger', message: 'HELLO LEDGER' },
        { from: 'ledger', message: 'HELLO YOU' }
      ])
      state = state.mergeIn(['notifications'], notificationsList)
      const result = notificationBarState.getLedgerNotifications(state)
      assert.equal(result.size, 2)
    })

    it('does not show notifications that are not ledger-related', function () {
      const notificationsList = Immutable.fromJS([
        { from: 'ledger', message: 'HELLO LEDGER' },
        { from: 'other place', message: 'HELLO YOU FROM OUTWHERE' }
      ])
      state = state.mergeIn(['notifications'], notificationsList)
      const result = notificationBarState.getLedgerNotifications(state)
      assert.equal(result.size, 1)
    })

    it('returns an empty Immutable list if no ledger-related notification is found', function () {
      state = state.mergeIn(['notifications'], [
        { from: 'Brazil', message: 'Hello from Brazil!' }
      ])
      const result = notificationBarState.getLedgerNotifications(state)
      assert.equal(result.isEmpty(), true)
      assert.equal(isList(result), true)
    })
  })
})
