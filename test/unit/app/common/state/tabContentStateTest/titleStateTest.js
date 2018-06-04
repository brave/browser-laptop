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

describe('titleState unit tests', function () {
  let titleState

  before(function () {
    mockery.enable({
      warnOnReplace: false,
      warnOnUnregistered: false,
      useCleanCache: true
    })
    mockery.registerMock('electron', fakeElectron)
    mockery.registerMock('../../../../js/l10n', {
      translation: () => 'wow such title very translated'
    })
    titleState = require('../../../../../../app/common/state/tabContentState/titleState')
  })

  after(function () {
    mockery.deregisterAll()
    mockery.disable()
  })

  describe('showTabTitle', function () {
    it('returns false if tab is intersected at 45% size and is active', function * () {
      const state = defaultState
        .setIn(['ui', 'tabs', 'intersectionRatio'], intersection.at45)
      const result = titleState.showTabTitle(state, frameKey)
      assert.equal(result, false)
    })

    it('returns false if tab is intersected at 45% size and is partitioned', function * () {
      const state = defaultState
        .set('activeFrameKey', 1337)
        .setIn(['frames', index, 'partitionNumber'], 1)
        .setIn(['ui', 'tabs', 'intersectionRatio'], intersection.at45)
      const result = titleState.showTabTitle(state, frameKey)
      assert.equal(result, false)
    })

    it('returns false if tab is intersected at 45% size and is private', function * () {
      const state = defaultState
        .set('activeFrameKey', 1337)
        .setIn(['frames', index, 'isPrivate'], true)
        .setIn(['ui', 'tabs', 'intersectionRatio'], intersection.at45)
      const result = titleState.showTabTitle(state, frameKey)
      assert.equal(result, false)
    })

    it('returns true if tab is intersected at 45% size and is about:newtab', function * () {
      const state = defaultState
        .setIn(['frames', index, 'location'], 'about:newtab')
        .setIn(['ui', 'tabs', 'intersectionRatio'], intersection.at45)
      const result = titleState.showTabTitle(state, frameKey)
      assert.equal(result, true)
    })

    it('returns true if tab is intersected at 45% and frame does not exist', function () {
      const state = defaultState
        .setIn(['ui', 'tabs', 'intersectionRatio'], intersection.at45)
      const result = titleState.showTabTitle(state, frameKey + 1)
      assert.equal(result, true)
    })

    it('returns true if tab is intersected at 45% size and has no secondary icon', function * () {
      const state = defaultState
        .set('activeFrameKey', 1337)
        .setIn(['frames', index, 'isPrivate'], false)
        .setIn(['frames', index, 'partitionNumber'], null)
        .setIn(['ui', 'tabs', 'intersectionRatio'], intersection.at45)
      const result = titleState.showTabTitle(state, frameKey)
      assert.equal(result, true)
    })

    it('returns false if tab is intersected at 35% size', function * () {
      const state = defaultState
        .setIn(['ui', 'tabs', 'intersectionRatio'], intersection.at40)
      const result = titleState.showTabTitle(state, frameKey)
      assert.equal(result, false)
    })

    it('returns true if tab is intersected above 35% size', function * () {
      const state = defaultState
        .setIn(['ui', 'tabs', 'intersectionRatio'], intersection.at60)
      const result = titleState.showTabTitle(state, frameKey)
      assert.equal(result, true)
    })
  })

  describe('getDisplayTitle', function () {
    it('returns an empty string if frame is null/undefined', function () {
      assert.equal(titleState.getDisplayTitle(), false)
    })

    it('translates about:blank', function () {
      const state = defaultState.setIn(['frames', index, 'location'], 'about:blank')
      const result = titleState.getDisplayTitle(state, frameKey)
      assert.equal(result, 'wow such title very translated')
    })

    it('translates about:newtab', function () {
      const state = defaultState.setIn(['frames', index, 'location'], 'about:newtab')
      const result = titleState.getDisplayTitle(state, frameKey)
      assert.equal(result, 'wow such title very translated')
    })

    it('returns the title', function () {
      const state = defaultState.setIn(['frames', index, 'title'], 'george clooney')
      const result = titleState.getDisplayTitle(state, frameKey)
      assert.equal(result, 'george clooney')
    })

    it('returns the location if title is not defined', function () {
      const state = defaultState.mergeIn(['frames', index], {
        title: '',
        location: 'https://i-wouldnt-change-a-thing.com'
      })
      const result = titleState.getDisplayTitle(state, frameKey)
      assert.equal(result, 'https://i-wouldnt-change-a-thing.com')
    })

    it('retuns an empty string if both title and location are not defined', function () {
      const state = defaultState.mergeIn(['frames', index], {
        title: '',
        location: ''
      })
      const result = titleState.getDisplayTitle(state, frameKey)
      assert.equal(result, '')
    })
  })
})
