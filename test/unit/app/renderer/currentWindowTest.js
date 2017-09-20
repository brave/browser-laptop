/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

/* global describe, it, before */
const Immutable = require('immutable')
const assert = require('assert')
const currentWindow = require('../../../../app/renderer/currentWindow')

describe('currentWindow unit test', function () {
  const windowId = 1
  const state = Immutable.fromJS({
    windows: [
      {
        windowId: windowId
      }
    ]
  })

  before(function () {
    currentWindow.setWindowId(windowId)
  })

  describe('isMaximized', function () {
    it('null case', function () {
      const result = currentWindow.isMaximized(state, 2)
      assert.equal(result, false)
    })

    it('false case', function () {
      const newState = state.setIn(['windows', 0, 'state'], 'test')
      const result = currentWindow.isMaximized(newState, windowId)
      assert.equal(result, false)
    })

    it('true case', function () {
      const newState = state.setIn(['windows', 0, 'state'], 'maximized')
      const result = currentWindow.isMaximized(newState, windowId)
      assert.equal(result, true)
    })
  })

  describe('isFullScreen', function () {
    it('null case', function () {
      const result = currentWindow.isFullScreen(state, 2)
      assert.equal(result, false)
    })

    it('false case', function () {
      const newState = state.setIn(['windows', 0, 'state'], 'test')
      const result = currentWindow.isFullScreen(newState, windowId)
      assert.equal(result, false)
    })

    it('true case', function () {
      const newState = state.setIn(['windows', 0, 'state'], 'fullscreen')
      const result = currentWindow.isFullScreen(newState, windowId)
      assert.equal(result, true)
    })
  })

  describe('isFocused', function () {
    it('null case', function () {
      const result = currentWindow.isFocused(state, 2)
      assert.equal(result, false)
    })

    it('not provided', function () {
      const result = currentWindow.isFocused(state, windowId)
      assert.equal(result, false)
    })

    it('false case', function () {
      const newState = state.setIn(['windows', 0, 'focused'], false)
      const result = currentWindow.isFocused(newState, windowId)
      assert.equal(result, false)
    })

    it('true case', function () {
      const newState = state.setIn(['windows', 0, 'focused'], true)
      const result = currentWindow.isFocused(newState, windowId)
      assert.equal(result, true)
    })
  })
})
