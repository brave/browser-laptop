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

describe('audioState unit tests', function () {
  let audioState

  before(function () {
    mockery.enable({
      warnOnReplace: false,
      warnOnUnregistered: false,
      useCleanCache: true
    })
    mockery.registerMock('electron', fakeElectron)
    audioState = require('../../../../../../app/common/state/tabContentState/audioState')
  })

  after(function () {
    mockery.deregisterAll()
    mockery.disable()
  })

  describe('canPlayAudio', function () {
    it('returns false if frame is null/undefined', function * () {
      assert.equal(audioState.canPlayAudio(), false)
    })

    it('returns true if audioPlaybackActive is true', function * () {
      const state = defaultState.setIn(['frames', index, 'audioPlaybackActive'], true)
      const result = audioState.canPlayAudio(state, frameKey)
      assert.equal(result, true)
    })

    it('returns true if audioMuted is true', function * () {
      const state = defaultState.setIn(['frames', index, 'audioMuted'], true)
      const result = audioState.canPlayAudio(state, frameKey)
      assert.equal(result, true)
    })

    it('returns true if both provided', function * () {
      const state = defaultState
        .setIn(['frames', index, 'audioMuted'], true)
        .setIn(['frames', index, 'audioPlaybackActive'], true)
      const result = audioState.canPlayAudio(state, frameKey)
      assert.equal(result, true)
    })
  })

  describe('isAudioMuted', function () {
    it('returns false if frame is null/undefined', function * () {
      assert.equal(audioState.isAudioMuted(), false)
    })

    it('returns true if audioMuted is true', function * () {
      const state = defaultState.setIn(['frames', index, 'audioMuted'], true)
      const result = audioState.isAudioMuted(state, frameKey)
      assert.equal(result, true)
    })

    it('returns false if audioMuted is false', function * () {
      const state = defaultState.setIn(['frames', index, 'audioMuted'], false)
      const result = audioState.isAudioMuted(state, frameKey)
      assert.equal(result, false)
    })
  })

  describe('showAudioIcon', function () {
    it('returns false if frame is null/undefined', function * () {
      assert.equal(audioState.showAudioIcon(), false)
    })

    it('returns true if tab can play audio and tab is not intercected', function * () {
      const state = defaultState
        .setIn(['frames', index, 'audioPlaybackActive'], true)
        .setIn(['ui', 'tabs', 'intersectionRatio'], intersection.noIntersection)
      const result = audioState.showAudioIcon(state, frameKey)
      assert.equal(result, true)
    })

    it('returns false if tab can play audio and tab is intercected', function * () {
      const state = defaultState
        .setIn(['frames', index, 'audioPlaybackActive'], true)
        .setIn(['ui', 'tabs', 'intersectionRatio'], intersection.at40)
      const result = audioState.showAudioIcon(state, frameKey)
      assert.equal(result, false)
    })

    it('returns false if tab can not play audio and tab is not intercected', function * () {
      const state = defaultState
        .setIn(['frames', index, 'audioPlaybackActive'], false)
        .setIn(['ui', 'tabs', 'intersectionRatio'], intersection.at40)
      const result = audioState.showAudioIcon(state, frameKey)
      assert.equal(result, false)
    })
  })

  describe('showAudioTopBorder', function () {
    it('returns false if frame is null/undefined', function * () {
      assert.equal(audioState.showAudioTopBorder(), false)
    })

    it('returns true if tab can play audio and tab is not pinned but is intercected', function * () {
      const state = defaultState
        .setIn(['frames', index, 'audioPlaybackActive'], true)
        .setIn(['frames', index, 'audioMuted'], false)
        .setIn(['ui', 'tabs', 'intersectionRatio'], intersection.at40)
      const result = audioState.showAudioTopBorder(state, frameKey, false)
      assert.equal(result, true)
    })

    it('returns true if tab can play audio and is pinned', function * () {
      const state = defaultState
      .setIn(['frames', index, 'audioPlaybackActive'], true)
      .setIn(['frames', index, 'audioMuted'], false)
      const result = audioState.showAudioTopBorder(state, frameKey, true)
      assert.equal(result, true)
    })

    it('returns false if tab can play audio and tab is not pinned and is not intercected', function * () {
      const state = defaultState
        .setIn(['frames', index, 'audioPlaybackActive'], true)
        .setIn(['frames', index, 'audioMuted'], false)
        .setIn(['ui', 'tabs', 'intersectionRatio'], intersection.noIntersection)
      const result = audioState.showAudioTopBorder(state, frameKey, false)
      assert.equal(result, false)
    })

    it('returns false if tab can not play audio, not pinned and tab is intercected', function * () {
      const state = defaultState
        .setIn(['frames', index, 'audioPlaybackActive'], false)
        .setIn(['frames', index, 'audioMuted'], false)
        .setIn(['ui', 'tabs', 'intersectionRatio'], intersection.at45)
      const result = audioState.showAudioTopBorder(state, frameKey, false)
      assert.equal(result, false)
    })
  })
})
