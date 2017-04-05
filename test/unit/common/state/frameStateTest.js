/* global describe, it, before */
const frameState = require('../../../../app/common/state/frameState')
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

const shouldValidateWindowState = function (cb) {
  it('throws an AssertionError if state does not contain a `frames` array', function () {
    assert.doesNotThrow(
      () => {
        cb(Immutable.fromJS({ frames: [] }))
      },
      AssertionError
    )
    assert.throws(
      () => {
        cb(Immutable.Map({}))
      },
      AssertionError
    )
    assert.throws(
      () => {
        cb(Immutable.Map({ tab: [] }))
      },
      AssertionError
    )
  })

  it('throws an AssertionError if state is not convertable to an Immutable.Map', function () {
    assert.doesNotThrow(
      () => {
        cb({ frames: [] })
      },
      AssertionError
    )
    assert.throws(
      () => {
        cb([])
      },
      AssertionError
    )
    assert.throws(
      () => {
        cb('test')
      },
      AssertionError
    )
    assert.throws(
      () => {
        cb(null)
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

    shouldValidateWindowState((state) => {
      frameState.getTabIdByFrameKey(state, 1)
    })
  })

  describe('getFrameByTabId', function () {
    before(function () {
      this.windowState = defaultWindowState.set('frames', Immutable.fromJS([
        { key: 2, tabId: 1 },
        { key: 1, tabId: 2 }
      ]))
    })

    it('returns the frame for `tabId` if it exists', function () {
      let frame = frameState.getFrameByTabId(this.windowState, 2)
      assert(frame)
      assert.equal(frame.get('key'), 1)
    })

    it('returns null if the frame for `tabId` does not exist', function () {
      let frame = frameState.getFrameByTabId(this.windowState, 3)
      assert.equal(frame, null)
    })

    shouldValidateId('tabId', (tabId) => {
      frameState.getFrameByTabId(defaultWindowState, tabId)
    })

    shouldValidateWindowState((state) => {
      frameState.getFrameByTabId(state, 1)
    })
  })
})
