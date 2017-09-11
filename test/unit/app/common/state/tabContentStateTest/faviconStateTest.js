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

describe('faviconState unit tests', function () {
  let faviconState

  before(function () {
    mockery.enable({
      warnOnReplace: false,
      warnOnUnregistered: false,
      useCleanCache: true
    })
    mockery.registerMock('electron', fakeElectron)
    faviconState = require('../../../../../../app/common/state/tabContentState/faviconState')
  })

  after(function () {
    mockery.deregisterAll()
    mockery.disable()
  })

  describe('showFavicon', function () {
    it('returns false if frame is null/undefined', function * () {
      assert.equal(faviconState.showFavicon(), false)
    })

    it('returns true if tab is only 35% visible and is not active', function * () {
      const state = defaultState
        .set('activeFrameKey', 1337)
        .setIn(['ui', 'tabs', 'intersectionRatio'], intersection.at40)
      const result = faviconState.showFavicon(state, frameKey)
      assert.equal(result, true)
    })

    it('returns true if tab is not intercected and is not about:newtab', function * () {
      const state = defaultState
        .setIn(['ui', 'tabs', 'intersectionRatio'], intersection.noIntersection)
      const result = faviconState.showFavicon(state, frameKey)
      assert.equal(result, true)
    })

    it('returns false if tab is not intercected and is about:newtab', function * () {
      const state = defaultState
        .setIn(['frames', index, 'location'], 'about:newtab')
        .setIn(['ui', 'tabs', 'intersectionRatio'], intersection.noIntersection)
      const result = faviconState.showFavicon(state, frameKey)
      assert.equal(result, false)
    })
  })

  describe('getFavicon', function () {
    it('returns false if frame is null/undefined', function * () {
      assert.equal(faviconState.getFavicon(), false)
    })

    it('returns false if loading icon is visible', function * () {
      const favicon = 'fred_water.png'
      const state = defaultState.mergeIn(['frames', index], { loading: true, icon: favicon })
      const result = faviconState.getFavicon(state, frameKey)
      assert.equal(result, false)
    })

    it('returns the favicon if loading is not visible', function * () {
      const favicon = 'fred_water_rlz.png'
      const state = defaultState.mergeIn(['frames', index], { loading: false, icon: favicon })
      const result = faviconState.getFavicon(state, frameKey)
      assert.equal(result, favicon)
    })
  })

  describe('showLoadingIcon', function () {
    it('returns false if frame is null/undefined', function * () {
      assert.equal(faviconState.showLoadingIcon(), false)
    })

    it('returns false if source is about page', function * () {
      const state = defaultState
        .setIn(['frames', index, 'location'], 'about:blank')
      const result = faviconState.showLoadingIcon(state, frameKey)
      assert.equal(result, false)
    })

    it('returns true if source is not about page', function * () {
      const state = defaultState.setIn(['frames', index, 'loading'], true)
      const result = faviconState.showLoadingIcon(state, frameKey)
      assert.equal(result, true)
    })

    it('returns false if page is not loading', function * () {
      const state = defaultState.setIn(['frames', index, 'loading'], false)
      const result = faviconState.showLoadingIcon(state, frameKey)
      assert.equal(result, false)
    })

    it('returns false if loading is undefined', function * () {
      const state = defaultState.setIn(['frames', index, 'loading'], undefined)
      const result = faviconState.showLoadingIcon(state, frameKey)
      assert.equal(result, false)
    })

    it('returns true if page is loading', function * () {
      const state = defaultState.setIn(['frames', index, 'loading'], true)
      const result = faviconState.showLoadingIcon(state, frameKey)
      assert.equal(result, true)
    })
  })

  describe('showIconWithLessMargin', function () {
    it('returns false if frame is null/undefined', function * () {
      assert.equal(faviconState.showIconWithLessMargin(), false)
    })

    it('returns true if tab is intersected at 20% size', function * () {
      const state = defaultState
        .setIn(['ui', 'tabs', 'intersectionRatio'], intersection.at30)
      const result = faviconState.showIconWithLessMargin(state, frameKey)
      assert.equal(result, true)
    })

    it('returns true if tab is intersected at smaller size', function * () {
      const state = defaultState
        .setIn(['ui', 'tabs', 'intersectionRatio'], intersection.at20)
      const result = faviconState.showIconWithLessMargin(state, frameKey)
      assert.equal(result, true)
    })

    it('returns false if tab is intersected at a larger size', function * () {
      const state = defaultState
        .setIn(['ui', 'tabs', 'intersectionRatio'], intersection.at40)
      const result = faviconState.showIconWithLessMargin(state, frameKey)
      assert.equal(result, false)
    })
  })

  describe('showFaviconAtReducedSize', function () {
    it('returns false if frame is null/undefined', function * () {
      assert.equal(faviconState.showFaviconAtReducedSize(), false)
    })

    it('returns true if tab is intersected at 15% size', function * () {
      const state = defaultState
        .setIn(['ui', 'tabs', 'intersectionRatio'], intersection.at20)
      const result = faviconState.showFaviconAtReducedSize(state, frameKey)
      assert.equal(result, true)
    })

    it('returns false if tab is intersected at larger size', function * () {
      const state = defaultState
        .setIn(['ui', 'tabs', 'intersectionRatio'], intersection.at30)
      const result = faviconState.showFaviconAtReducedSize(state, frameKey)
      assert.equal(result, false)
    })
  })
})
