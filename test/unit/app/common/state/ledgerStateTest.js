/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

/* global describe, it */
const assert = require('assert')
const Immutable = require('immutable')

require('../../../braveUnit')
const ledgerState = require('../../../../../app/common/state/ledgerState')

const blankState = Immutable.fromJS({
  ledger: {}
})

const stateWithData = Immutable.fromJS({
  ledger: {
    publisherTime: 1
  }
})

describe('ledgerState unit test', function () {
  describe('setLedgerValue', function () {
    it('null case', function () {
      const result = ledgerState.setLedgerValue(blankState)
      assert.deepEqual(result.toJS(), blankState.toJS())
    })

    it('key is provided', function () {
      const result = ledgerState.setLedgerValue(blankState, 'publisherTime', 1)
      assert.deepEqual(result.toJS(), stateWithData.toJS())
    })
  })

  describe('getLedgerValue', function () {
    it('null case', function () {
      const result = ledgerState.getLedgerValue(blankState)
      assert.deepEqual(result, null)
    })

    it('key is provided', function () {
      const result = ledgerState.getLedgerValue(stateWithData, 'publisherTime')
      assert.deepEqual(result, 1)
    })
  })
})
