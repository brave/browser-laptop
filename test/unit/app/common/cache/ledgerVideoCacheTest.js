/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */
/* global describe, it */

const Immutable = require('immutable')
const assert = require('assert')
const ledgerVideoCache = require('../../../../../app/common/cache/ledgerVideoCache')

const baseState = Immutable.fromJS({
  cache: {
    ledgerVideos: {}
  }
})
const stateWithData = Immutable.fromJS({
  cache: {
    ledgerVideos: {
      'youtube_kLiLOkzLetE': {
        publisher: 'youtube#channel:UCFNTTISby1c_H-rm5Ww5rZg'
      },
      'twitch_test': {
        publisher: 'twitch#author:test',
        time: 1234
      }
    }
  }
})

describe('ledgerVideoCache unit test', function () {
  describe('getDataByVideoId', function () {
    it('key is not provided', function () {
      const result = ledgerVideoCache.getDataByVideoId(baseState)
      assert.deepEqual(result.toJS(), {})
    })

    it('key does not exist in the cache', function () {
      const result = ledgerVideoCache.getDataByVideoId(baseState, 'key')
      assert.deepEqual(result.toJS(), {})
    })

    it('data is ok', function () {
      const result = ledgerVideoCache.getDataByVideoId(stateWithData, 'youtube_kLiLOkzLetE')
      assert.deepEqual(result.toJS(), {
        publisher: 'youtube#channel:UCFNTTISby1c_H-rm5Ww5rZg'
      })
    })
  })

  describe('setCacheByVideoId', function () {
    it('key is not provided', function () {
      const state = ledgerVideoCache.setCacheByVideoId(baseState)
      assert.deepEqual(state.toJS(), baseState.toJS())
    })

    it('data is ok', function () {
      const state = ledgerVideoCache.setCacheByVideoId(baseState, 'youtube_kLiLOkzLetE', Immutable.fromJS({
        publisher: 'youtube#channel:UCFNTTISby1c_H-rm5Ww5rZg'
      }))
      const expectedState = state
        .setIn(['cache', 'ledgerVideos', 'youtube_kLiLOkzLetE'], Immutable.fromJS({
          publisher: 'youtube#channel:UCFNTTISby1c_H-rm5Ww5rZg'
        }))
      assert.deepEqual(state.toJS(), expectedState.toJS())
    })
  })

  describe('mergeCacheByVideoId', function () {
    it('null case', function () {
      const state = ledgerVideoCache.mergeCacheByVideoId(baseState)
      assert.deepEqual(state.toJS(), baseState.toJS())
    })

    it('old data is missing', function () {
      const state = ledgerVideoCache.mergeCacheByVideoId(baseState, 'twitch_test', {someData: 'test'})
      const expectedState = baseState
        .setIn(['cache', 'ledgerVideos', 'twitch_test'], Immutable.fromJS({someData: 'test'}))
      assert.deepEqual(state.toJS(), expectedState.toJS())
    })

    it('new data is null', function () {
      const state = ledgerVideoCache.mergeCacheByVideoId(stateWithData, 'twitch_test')
      assert.deepEqual(state.toJS(), stateWithData.toJS())
    })

    it('old and new data are present', function () {
      const state = ledgerVideoCache.mergeCacheByVideoId(stateWithData, 'twitch_test', {someData: 'test'})
      const expectedState = stateWithData
        .setIn(['cache', 'ledgerVideos', 'twitch_test'], Immutable.fromJS({
          publisher: 'twitch#author:test',
          time: 1234,
          someData: 'test'
        }))
      assert.deepEqual(state.toJS(), expectedState.toJS())
    })
  })
})
