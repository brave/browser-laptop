/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

/* global describe, it, before, after */

const assert = require('assert')
const Immutable = require('immutable')
const mockery = require('mockery')
const fakeElectron = require('../../../../lib/fakeElectron')
const {intersection} = require('../../../../../../app/renderer/components/styles/global')

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

describe('closeState unit tests', function () {
  let closeState

  before(function () {
    mockery.enable({
      warnOnReplace: false,
      warnOnUnregistered: false,
      useCleanCache: true
    })
    mockery.registerMock('electron', fakeElectron)
    closeState = require('../../../../../../app/common/state/tabContentState/closeState')
  })

  after(function () {
    mockery.deregisterAll()
    mockery.disable()
  })

  describe('hasFixedCloseIcon', function () {
    it('returns false if frame is null/undefined', function * () {
      assert.equal(closeState.hasFixedCloseIcon(), false)
    })

    it('returns true if tab is active and is intersected at 75% size', function * () {
      const state = defaultState
        .setIn(['ui', 'tabs', 'intersectionRatio'], intersection.at75)
      const result = closeState.hasFixedCloseIcon(state, frameKey)
      assert.equal(result, true)
    })

    it('returns false if tab is not active and is intersected at 75% size', function * () {
      const state = defaultState
        .set('activeFrameKey', 1337)
        .setIn(['ui', 'tabs', 'intersectionRatio'], intersection.at75)
      const result = closeState.hasFixedCloseIcon(state, frameKey)
      assert.equal(result, false)
    })

    it('returns false if tab is active and is not intersected', function * () {
      const state = defaultState
        .setIn(['ui', 'tabs', 'intersectionRatio'], intersection.noIntersection)
      const result = closeState.hasFixedCloseIcon(state, frameKey)
      assert.equal(result, false)
    })

    it('returns true if tab is active and intersected below 75% size', function * () {
      const state = defaultState
        .setIn(['ui', 'tabs', 'intersectionRatio'], intersection.at45)
      const result = closeState.hasFixedCloseIcon(state, frameKey)
      assert.equal(result, true)
    })
  })

  describe('hasRelativeCloseIcon', function () {
    it('returns false if frame is null/undefined', function * () {
      assert.equal(closeState.hasRelativeCloseIcon(), false)
    })

    it('returns true if tab index is being hovered', function * () {
      const state = defaultState
        .setIn(['ui', 'tabs', 'hoverTabIndex'], index)
      const result = closeState.hasRelativeCloseIcon(state, frameKey)
      assert.equal(result, true)
    })

    it('returns false if tab is not being hovered', function * () {
      const state = defaultState
        .setIn(['ui', 'tabs', 'hoverTabIndex'], 1337)
      const result = closeState.hasRelativeCloseIcon(state, frameKey)
      assert.equal(result, false)
    })

    it('returns false if tab is being intersected', function * () {
      const state = defaultState
        .mergeIn(['ui', 'tabs'], {
          hoverTabIndex: index,
          intersectionRatio: intersection.at75
        })
      const result = closeState.hasRelativeCloseIcon(state, frameKey)
      assert.equal(result, false)
    })
  })

  describe('showCloseTabIcon', function () {
    it('returns false if frame is null/undefined', function * () {
      assert.equal(closeState.showCloseTabIcon(), false)
    })

    it('returns false if tab is being intersected at 15% size', function * () {
      const state = defaultState
        .mergeIn(['ui', 'tabs'], {
          hoverTabIndex: index,
          intersectionRatio: intersection.at20
        })
      const result = closeState.showCloseTabIcon(state, frameKey)
      assert.equal(result, false)
    })

    it('returns false if tab not intersected and not hovered', function * () {
      const state = defaultState
      .mergeIn(['ui', 'tabs'], {
        hoverTabIndex: 1337,
        intersectionRatio: intersection.noIntersection
      })
      const result = closeState.showCloseTabIcon(state, frameKey)
      assert.equal(result, false)
    })

    it('returns true if tab not intersected and hovered', function * () {
      const state = defaultState
      .mergeIn(['ui', 'tabs'], {
        hoverTabIndex: index,
        intersectionRatio: intersection.noIntersection
      })
      const result = closeState.showCloseTabIcon(state, frameKey)
      assert.equal(result, true)
    })

    it('returns false if tab is intersected and not active', function * () {
      const state = defaultState
        .set('activeFrameKey', 1337)
        .setIn(['ui', 'tabs', 'intersectionRatio', intersection.at45])
      const result = closeState.showCloseTabIcon(state, frameKey)
      assert.equal(result, false)
    })

    it('returns true if tab is intersected and active', function * () {
      const state = defaultState
        .setIn(['ui', 'tabs', 'intersectionRatio'], intersection.at75)
      const result = closeState.showCloseTabIcon(state, frameKey)
      assert.equal(result, true)
    })
  })
})
