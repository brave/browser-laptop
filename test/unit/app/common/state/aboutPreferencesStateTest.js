/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this file,
* You can obtain one at http://mozilla.org/MPL/2.0/. */

/* global describe, it */
const assert = require('assert')
const Immutable = require('immutable')
const aboutPreferencesState = require('../../../../../app/common/state/aboutPreferencesState')

describe('aboutPreferencesState unit test', function () {
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

  describe('setRecoveryBalanceRecalculated', function () {
    it('null case', function () {
      const state = aboutPreferencesState.setRecoveryBalanceRecalculated(defaultState, null)
      assert.equal(aboutPreferencesState.getPreferencesProp(state, 'recoveryBalanceRecalculated'), null)
    })

    it('sets true', function () {
      const state = aboutPreferencesState.setRecoveryBalanceRecalculated(defaultState, true)
      assert.equal(aboutPreferencesState.getPreferencesProp(state, 'recoveryBalanceRecalculated'), true)
    })

    it('sets false', function () {
      const state = aboutPreferencesState.setRecoveryBalanceRecalculated(defaultState, false)
      assert.equal(aboutPreferencesState.getPreferencesProp(state, 'recoveryBalanceRecalculated'), false)
    })
  })

  describe('getRecoveryBalanceRecalculated', function () {
    it('null case returns false', function () {
      const state = aboutPreferencesState.setRecoveryBalanceRecalculated(defaultState, null)
      const result = aboutPreferencesState.getRecoveryBalanceRecalulated(state)
      assert.equal(result, false)
    })

    it('returns false', function () {
      const state = aboutPreferencesState.setRecoveryBalanceRecalculated(defaultState, false)
      const result = aboutPreferencesState.getRecoveryBalanceRecalulated(state)
      assert.equal(result, false)
    })

    it('returns true', function () {
      const state = aboutPreferencesState.setRecoveryBalanceRecalculated(defaultState, true)
      const result = aboutPreferencesState.getRecoveryBalanceRecalulated(state)
      assert.equal(result, true)
    })
  })

  describe('setRecoveryStatus', function () {
    it('updates recoverySucceeded', function () {
      const result = aboutPreferencesState.setRecoveryStatus(defaultState, true)
      assert.equal(aboutPreferencesState.getPreferencesProp(result, 'recoverySucceeded'), true)
    })
    it('recoveryInProgress is false when recovery is successful', function () {
      const result = aboutPreferencesState.setRecoveryStatus(defaultState, true)
      assert.equal(aboutPreferencesState.getPreferencesProp(result, 'recoveryInProgress'), false)
    })
    it('recoveryInProgress is false when recovery is not successful', function () {
      const result = aboutPreferencesState.setRecoveryStatus(defaultState, false)
      assert.equal(aboutPreferencesState.getPreferencesProp(result, 'recoveryInProgress'), false)
    })
  })

  describe('setRecoveryInProgress', function () {
    it('updates recoveryInProgress', function () {
      const result = aboutPreferencesState.setRecoveryInProgress(defaultState, true)
      assert.equal(aboutPreferencesState.getPreferencesProp(result, 'recoveryInProgress'), true)

      const nextResult = aboutPreferencesState.setRecoveryInProgress(defaultState, false)
      assert.equal(aboutPreferencesState.getPreferencesProp(nextResult, 'recoveryInProgress'), false)
    })
  })
})
