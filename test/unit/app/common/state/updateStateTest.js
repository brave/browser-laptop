/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

/* global describe, it */
const assert = require('assert')
const Immutable = require('immutable')

const updateUtil = require('../../../../../app/common/state/updateState')
const updateStatus = require('../../../../../js/constants/updateStatus')
require('../../../braveUnit')

describe('updateUtil test', function () {
  describe('getUpdateStatus', function () {
    it('update is not available', function () {
      const result = updateUtil.getUpdateStatus(Immutable.Map())
      assert.equal(result, null)
    })

    it('update status is UPDATE_AVAILABLE_DEFERRED', function () {
      const result = updateUtil.getUpdateStatus(Immutable.fromJS({
        updates: {
          status: updateStatus.UPDATE_AVAILABLE_DEFERRED
        }
      }))
      assert.equal(result, updateStatus.UPDATE_AVAILABLE)
    })

    it('update status is returned normally', function () {
      const result = updateUtil.getUpdateStatus(Immutable.fromJS({
        updates: {
          status: updateStatus.UPDATE_CHECKING
        }
      }))
      assert.equal(result, updateStatus.UPDATE_CHECKING)
    })
  })

  describe('isUpdateVisible', function () {
    it('update is not available', function () {
      const result = updateUtil.isUpdateVisible(Immutable.Map())
      assert.equal(result, false)
    })

    it('status is not available', function () {
      const result = updateUtil.isUpdateVisible(Immutable.fromJS({
        updates: {}
      }))
      assert.equal(result, false)
    })

    it('update is not verbose and status is different then UPDATE_AVAILABLE', function () {
      const result = updateUtil.isUpdateVisible(Immutable.fromJS({
        updates: {
          verbose: false,
          status: updateStatus.UPDATE_CHECKING
        }
      }))
      assert.equal(result, false)
    })

    it('update is verbose and status is UPDATE_AVAILABLE', function () {
      const result = updateUtil.isUpdateVisible(Immutable.fromJS({
        updates: {
          verbose: true,
          status: updateStatus.UPDATE_AVAILABLE
        }
      }))
      assert.equal(result, true)
    })

    it('update status is UPDATE_AVAILABLE', function () {
      const result = updateUtil.isUpdateVisible(Immutable.fromJS({
        updates: {
          status: updateStatus.UPDATE_AVAILABLE
        }
      }))
      assert.equal(result, true)
    })

    it('update status is UPDATE_NONE', function () {
      const result = updateUtil.isUpdateVisible(Immutable.fromJS({
        updates: {
          status: updateStatus.UPDATE_NONE
        }
      }))
      assert.equal(result, false)
    })

    it('update status is UPDATE_APPLYING_RESTART', function () {
      const result = updateUtil.isUpdateVisible(Immutable.fromJS({
        updates: {
          status: updateStatus.UPDATE_APPLYING_RESTART
        }
      }))
      assert.equal(result, false)
    })

    it('update status is UPDATE_APPLYING_NO_RESTART', function () {
      const result = updateUtil.isUpdateVisible(Immutable.fromJS({
        updates: {
          status: updateStatus.UPDATE_APPLYING_NO_RESTART
        }
      }))
      assert.equal(result, false)
    })
  })
})
