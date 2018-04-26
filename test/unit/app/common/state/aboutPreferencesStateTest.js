/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this file,
* You can obtain one at http://mozilla.org/MPL/2.0/. */

/* global describe, it */
const assert = require('assert')
const Immutable = require('immutable')
const aboutPreferencesState = require('../../../../../app/common/state/aboutPreferencesState')

describe('ledgerState unit test', function () {
  // State
  const defaultState = Immutable.fromJS({
    about: {
      preferences: {}
    },
    ledger: {}
  })
  describe('setBackupStatus', function () {
    it('null case', function () {
      const result = aboutPreferencesState.setBackupStatus(defaultState)
      assert.deepEqual(result.toJS(), defaultState.toJS())
    })
    it('set backup succeeded', function () {
      const result = aboutPreferencesState.setBackupStatus(defaultState, true)
      const expectedDate = result.getIn(['about', 'preferences', 'updatedStamp']) // ignore date
      const expectedState = defaultState
      .setIn(['about', 'preferences', 'backupSucceeded'], true)
      .setIn(['about', 'preferences', 'updatedStamp'], expectedDate)
      assert.deepEqual(result.toJS(), expectedState.toJS())
    })
    it('set backup failed', function () {
      const result = aboutPreferencesState.setBackupStatus(defaultState, false)
      const expectedDate = result.getIn(['about', 'preferences', 'updatedStamp']) // ignore date
      const expectedState = defaultState
      .setIn(['about', 'preferences', 'backupSucceeded'], false)
      .setIn(['about', 'preferences', 'updatedStamp'], expectedDate)
      assert.deepEqual(result.toJS(), expectedState.toJS())
    })
  })

  describe('hasBeenBackedUp', function () {
    it('no backup or recovery bit', function () {
      const result = aboutPreferencesState.hasBeenBackedUp(defaultState)
      assert.equal(result, false)
    })
    it('has backup and recovery bit', function () {
      const state = defaultState
        .setIn(['about', 'preferences', 'backupSucceeded'], true)
        .setIn(['about', 'preferences', 'recoverySucceeded'], true)
      const result = aboutPreferencesState.hasBeenBackedUp(state)
      assert.equal(result, true)
    })
    it('has backup bit but not recovery', function () {
      const state = defaultState.setIn(['about', 'preferences', 'backupSucceeded'], true)
      const result = aboutPreferencesState.hasBeenBackedUp(state)
      assert.equal(result, true)
    })
    it('has recovery bit but not backup', function () {
      const state = defaultState.setIn(['about', 'preferences', 'recoverySucceeded'], new Date().getTime())
      const result = aboutPreferencesState.hasBeenBackedUp(state)
      assert.notEqual(result, null)
    })
  })
})
