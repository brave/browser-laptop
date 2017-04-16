/* global describe, it, before */
const frameState = require('../../../../../app/common/state/frameState')
const Immutable = require('immutable')
const assert = require('chai').assert
const AssertionError = require('assert').AssertionError

const defaultWindowState = Immutable.fromJS({
  frames: []
})

const shouldValidateId = function (name, cb) {
  it('throws an AssertionError if ' + name + ' is not a number', function () {
    assert.throws(
      () => {
        cb(null)
      },
      AssertionError
    )
    assert.throws(
      () => {
        cb('b')
      },
      AssertionError
    )
    assert.doesNotThrow(
      () => {
        cb('1')
      },
      AssertionError
    )
  })

  it('throws an AssertionError if ' + name + ' < 1 and !== -1', function () {
    assert.throws(
      () => {
        cb(0)
      },
      AssertionError
    )
    assert.doesNotThrow(
      () => {
        cb(-1)
      },
      AssertionError
    )
    assert.throws(
      () => {
        cb(-2)
      },
      AssertionError
    )
  })
}

// TODO(bridiver) - add tests for currentWindow
describe('frameState', function () {
  describe('getTabIdByFrameKey', function () {
    before(function () {
      this.windowState = defaultWindowState.set('frames', Immutable.fromJS([
        { key: 2, tabId: 1 },
        { key: 1, tabId: 2 },
        { key: 6 }
      ]))
    })

    it('returns the tabId for the frameKey', function () {
      assert.equal(frameState.getTabIdByFrameKey(this.windowState, 1), 2)
      assert.equal(frameState.getTabIdByFrameKey(this.windowState, 2), 1)
    })

    it('returns -1 if the tabId is missing', function () {
      assert.equal(frameState.getTabIdByFrameKey(this.windowState, 6), -1)
    })

    shouldValidateId('key', (frameKey) => {
      frameState.getTabIdByFrameKey(defaultWindowState, frameKey)
    })
  })

  describe('getPathByTabId', function () {
    before(function () {
      this.windowState = defaultWindowState.set('frames', Immutable.fromJS([
        { key: 2, tabId: 1 },
        { key: 1, tabId: 2 }
      ]))
    })

    it('returns the path to the frame for `tabId` if it exists', function () {
      const path = frameState.getPathByTabId(this.windowState, 2)
      assert.deepEqual(path.toJS(), ['frames', 1])
    })

    it('returns null if the frame for `tabId` does not exist', function () {
      const path = frameState.getPathByTabId(this.windowState, 3)
      assert.deepEqual(path.toJS(), ['nosuchframe'])
    })

    shouldValidateId('tabId', (tabId) => {
      frameState.getPathByTabId(defaultWindowState, tabId)
    })
  })
})
