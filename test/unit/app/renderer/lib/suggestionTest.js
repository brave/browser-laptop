/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */
/* global describe, before, after, it */

const mockery = require('mockery')
const assert = require('assert')
const sinon = require('sinon')
const Immutable = require('immutable')
const {makeImmutable} = require('../../../../../app/common/state/immutableUtil')
let suggestion
require('../../../braveUnit')

const fakeImmutableUtil = {
  makeImmutable: (obj) => {
    return makeImmutable(obj)
  }
}

describe('suggestion unit tests', function () {
  let makeImmutableSpy

  before(function () {
    mockery.enable({
      warnOnReplace: false,
      warnOnUnregistered: false,
      useCleanCache: true
    })

    makeImmutableSpy = sinon.spy(fakeImmutableUtil, 'makeImmutable')
    mockery.registerMock('../../common/state/immutableUtil', fakeImmutableUtil)
    suggestion = require('../../../../../app/renderer/lib/suggestion')
  })

  after(function () {
    makeImmutableSpy.restore()
    mockery.disable()
  })

  describe('createVirtualHistoryItems', function () {
    it('handles input being null/undefined', function () {
      const emptyResult = Immutable.Map().toArray()
      assert.deepEqual(suggestion.createVirtualHistoryItems(), emptyResult)
      assert.deepEqual(suggestion.createVirtualHistoryItems(undefined), emptyResult)
      assert.deepEqual(suggestion.createVirtualHistoryItems(null), emptyResult)
    })

    it('calls immutableUtil.makeImmutable', function () {
      const callCount = makeImmutableSpy.callCount
      suggestion.createVirtualHistoryItems()
      assert.equal(makeImmutableSpy.withArgs({}).callCount, callCount + 1)
    })
  })
})
