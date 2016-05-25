/* global describe, before, it */
const frameStateUtil = require('../../js/state/frameStateUtil')
const Immutable = require('immutable')
const assert = require('assert')

const defaultWindowStore = Immutable.fromJS({
  activeFrameKey: null,
  frames: [],
  closedFrames: []
})

describe('frameStateUtil', function () {
  before(function () {
    this.windowState = Immutable.fromJS(Object.assign({}, defaultWindowStore.toJS()))
  })

  describe('query', function () {
    before(function () {
      this.frames = Immutable.fromJS([
        {
          key: 1,
          tabId: 2,
          audioMuted: false,
          isPrivate: true
        },
        {
          key: 2,
          tabId: 3,
          audioMuted: false,
          isPrivate: false
        }
      ])
      this.windowState = this.windowState.set('frames', this.frames)
    })

    it('returns frames that match the queryInfo properties', function () {
      let result = frameStateUtil.query(this.windowState, {tabId: 2})
      assert.equal(1, result.size)
      assert.deepEqual(result.get(0), this.frames.get(0))

      result = frameStateUtil.query(this.windowState, {key: 2})
      assert.equal(1, result.size)
      assert.deepEqual(result.get(0), this.frames.get(1))

      result = frameStateUtil.query(this.windowState, {audioMuted: false})
      assert.equal(2, result.size)
      assert.deepEqual(result.get(0), this.frames.get(0))
      assert.deepEqual(result.get(1), this.frames.get(1))

      result = frameStateUtil.query(this.windowState, {audioMuted: false, isPrivate: false})
      assert.equal(1, result.size)
      assert.deepEqual(result.get(0), this.frames.get(1))

      result = frameStateUtil.query(this.windowState, {audioMuted: true})
      assert.equal(0, result.size)
    })
  })

  describe('find', function () {
    before(function () {
      this.frames = Immutable.fromJS([
        {
          key: 1,
          tabId: 2,
          audioMuted: false,
          isPrivate: true
        },
        {
          key: 2,
          tabId: 3,
          audioMuted: false,
          isPrivate: false
        }
      ])
      this.windowState = this.windowState.set('frames', this.frames)
    })

    it('returns the first frame that matches the queryInfo properties', function () {
      let result = frameStateUtil.find(this.windowState, {tabId: 2})
      assert.deepEqual(result, this.frames.get(0))

      result = frameStateUtil.find(this.windowState, {audioMuted: false})
      assert.deepEqual(result, this.frames.get(0))

      result = frameStateUtil.find(this.windowState, {audioMuted: false, isPrivate: false})
      assert.deepEqual(result, this.frames.get(1))

      result = frameStateUtil.find(this.windowState, {audioMuted: true})
      assert.equal(null, result)
    })
  })
})
