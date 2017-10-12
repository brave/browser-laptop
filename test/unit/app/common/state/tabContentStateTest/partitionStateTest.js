/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

/* global describe, it, before, after */

const assert = require('assert')
const Immutable = require('immutable')
const mockery = require('mockery')
const fakeElectron = require('../../../../lib/fakeElectron')
const {tabs} = require('../../../../../../js/constants/config')

const frameKey = 1
const index = 0
let defaultState = Immutable.fromJS({
  activeFrameKey: frameKey,
  frames: [{
    key: frameKey,
    tabId: 1,
    location: 'http://brave.com'
  }],
  tabs: [{
    key: frameKey,
    index: index
  }],
  framesInternal: {
    index: { 1: 0 },
    tabIndex: { 1: 0 }
  }
})

describe('partitionState unit tests', function () {
  let partitionState

  before(function () {
    mockery.enable({
      warnOnReplace: false,
      warnOnUnregistered: false,
      useCleanCache: true
    })
    mockery.registerMock('electron', fakeElectron)
    partitionState = require('../../../../../../app/common/state/tabContentState/partitionState')
  })

  after(function () {
    mockery.deregisterAll()
    mockery.disable()
  })

  describe('isPartitionTab', function () {
    it('returns false if frame is null/undefined', function () {
      assert.equal(partitionState.isPartitionTab(), false)
    })

    it('returns true if partition number is defined', function * () {
      const partitionNumber = 1337
      const state = defaultState
        .setIn(['frames', index, 'partitionNumber'], partitionNumber)
      const result = partitionState.isPartitionTab(state, frameKey)
      assert.equal(result, true)
    })

    it('returns false if partition number is undefined', function * () {
      const state = defaultState
      const result = partitionState.isPartitionTab(state, frameKey)
      assert.equal(result, false)
    })
  })

  describe('getPartitionNumber', function () {
    it('returns zero if frame is null/undefined', function * () {
      assert.equal(partitionState.getPartitionNumber(), 0)
    })

    it('returns zero if frame is null/undefined', function * () {
      assert.equal(partitionState.getPartitionNumber(), 0)
    })

    it('can remove _partition_ string and keep the partition number', function * () {
      const partitionString = 'partition-9'
      const partitionNumber = 9
      const state = defaultState
        .setIn(['frames', index, 'partitionNumber'], partitionString)
      const result = partitionState.getPartitionNumber(state, frameKey)
      assert.equal(result, partitionNumber)
    })

    it('returns the partition number', function * () {
      const partitionNumber = 9
      const state = defaultState
        .setIn(['frames', index, 'partitionNumber'], partitionNumber)
      const result = partitionState.getPartitionNumber(state, frameKey)
      assert.equal(result, partitionNumber)
    })
  })

  describe('getMaxAllowedPartitionNumber', function () {
    it('returns false if frame is null/undefined', function () {
      assert.equal(partitionState.getMaxAllowedPartitionNumber(), false)
    })

    it('returns partition number', function * () {
      const partitionNumber = 9
      const state = defaultState
        .setIn(['frames', index, 'partitionNumber'], partitionNumber)
      const result = partitionState.getMaxAllowedPartitionNumber(state, frameKey)
      assert.equal(result, partitionNumber)
    })

    it('returns the max allowed partition number if current number is bigger', function * () {
      const partitionNumber = 99999
      const state = defaultState
        .setIn(['frames', index, 'partitionNumber'], partitionNumber)
      const result = partitionState.getMaxAllowedPartitionNumber(state, frameKey)
      assert.equal(result, tabs.maxAllowedNewSessions)
    })
  })
})
