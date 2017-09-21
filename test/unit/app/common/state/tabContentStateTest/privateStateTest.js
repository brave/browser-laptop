/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

/* global describe, it, before, after */

const assert = require('assert')
const Immutable = require('immutable')
const mockery = require('mockery')
const fakeElectron = require('../../../../lib/fakeElectron')

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

describe('privateState unit tests', function () {
  let privateState

  before(function () {
    mockery.enable({
      warnOnReplace: false,
      warnOnUnregistered: false,
      useCleanCache: true
    })
    mockery.registerMock('electron', fakeElectron)
    privateState = require('../../../../../../app/common/state/tabContentState/privateState')
  })

  after(function () {
    mockery.deregisterAll()
    mockery.disable()
  })

  describe('isPrivateTab', function () {
    it('returns an empty string if frame is null/undefined', function () {
      assert.equal(privateState.isPrivateTab(), false)
    })

    it('returns true if tab is private', function * () {
      const state = defaultState.setIn(['frames', index, 'isPrivate'], true)
      const result = privateState.isPrivateTab(state, frameKey)
      assert.equal(result, true)
    })

    it('returns false if tab is not private', function * () {
      const state = defaultState.setIn(['frames', index, 'isPrivate'], false)
      const result = privateState.isPrivateTab(state, frameKey)
      assert.equal(result, false)
    })
  })
})
