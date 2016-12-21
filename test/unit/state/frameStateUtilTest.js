/* global describe, before, it, beforeEach */
const frameStateUtil = require('../../../js/state/frameStateUtil')
const Immutable = require('immutable')
const assert = require('assert')

require('../braveUnit')

const defaultWindowStore = Immutable.fromJS({
  activeFrameKey: null,
  frames: [],
  tabs: [],
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

  describe('removeFrame', function () {
    let frames, tabs, closedFrames, frameProps, activeFrameKey

    beforeEach(function () {
      frames = Immutable.fromJS([
        { key: 2 },
        { key: 3, parentFrameKey: 2 },
        { key: 4 },
        { key: 4, pinnedLocation: 'https://www.facebook.com/' },
        { key: 5, pinnedLocation: 'https://twitter.com/' }
      ])
      tabs = Immutable.fromJS([
        { key: 2 },
        { key: 3 },
        { key: 4 },
        { key: 4, pinnedLocation: 'https://www.facebook.com/' },
        { key: 5, pinnedLocation: 'https://twitter.com/' }
      ])
      closedFrames = Immutable.fromJS([{ key: 1 }])
      frameProps = Immutable.fromJS({ key: 2 })
      activeFrameKey = 2
    })

    it('removed frame is added to `closedFrames`', function () {
      const result = frameStateUtil.removeFrame(frames, tabs, closedFrames, frameProps, activeFrameKey)
      const inClosedFrames = result.closedFrames.find((frame) => frame.get('key') === frameProps.get('key'))
      assert.equal(false, inClosedFrames === undefined)
    })

    it('sets isFullScreen=false for the removed frame', function () {
      frameProps = Immutable.fromJS({ key: 2, isFullScreen: true })
      const result = frameStateUtil.removeFrame(frames, tabs, closedFrames, frameProps, activeFrameKey)
      const inClosedFrames = result.closedFrames.find((frame) => frame.get('key') === frameProps.get('key'))
      assert.equal(false, inClosedFrames.get('isFullScreen'))
    })

    it('removed frame is NOT added to `closedFrames` if private', function () {
      frames = Immutable.fromJS([{ key: 2 }])
      frameProps = Immutable.fromJS({ isPrivate: true, key: 2 })
      const result = frameStateUtil.removeFrame(frames, tabs, closedFrames, frameProps, activeFrameKey)
      const inClosedFrames = result.closedFrames.find((frame) => frame.get('key') === frameProps.get('key'))
      assert.equal(true, inClosedFrames === undefined)
    })

    it('removes the frame from `frames`', function () {
      const result = frameStateUtil.removeFrame(frames, tabs, closedFrames, frameProps, activeFrameKey)
      const inFrames = result.frames.find((frame) => frame.get('key') === frameProps.get('key'))
      assert.equal(true, inFrames === undefined)
    })

    describe('does not change `activeFrameKey`', function () {
      it('if frame removed is not active and has parentFrameKey set', function () {
        frameProps = Immutable.fromJS({ key: 3 })
        const result = frameStateUtil.removeFrame(frames, tabs, closedFrames, frameProps, activeFrameKey)
        assert.equal(activeFrameKey, result.activeFrameKey)
      })

      it('if frame removed is not active and does NOT have parentFrameKey set', function () {
        frameProps = Immutable.fromJS({ key: 4 })
        const result = frameStateUtil.removeFrame(frames, tabs, closedFrames, frameProps, activeFrameKey)
        assert.equal(activeFrameKey, result.activeFrameKey)
      })

      it('if there are no frames left', function () {
        frames = Immutable.fromJS([{ key: 2 }])
        tabs = Immutable.fromJS([{ key: 2 }])
        const result = frameStateUtil.removeFrame(frames, tabs, closedFrames, frameProps, activeFrameKey)
        assert.equal(activeFrameKey, result.activeFrameKey)
      })
    })

    describe('when active frame is removed', function () {
      it('returns the next *non-pinned* active frame key', function () {
        const result = frameStateUtil.removeFrame(frames, tabs, closedFrames, frameProps, activeFrameKey)
        assert.equal(3, result.activeFrameKey)
      })

      it('returns the previous *non-pinned* frame key (if none found for next and no parent association)', function () {
        frames = Immutable.fromJS([
          { key: 2 },
          { key: 3 },
          { key: 4, pinnedLocation: 'https://www.facebook.com/' },
          { key: 5, pinnedLocation: 'https://twitter.com/' }
        ])
        frameProps = Immutable.fromJS({
          isFullScreen: false,
          isPrivate: false,
          key: 3
        })
        activeFrameKey = 3
        const result = frameStateUtil.removeFrame(frames, tabs, closedFrames, frameProps, activeFrameKey)
        assert.equal(2, result.activeFrameKey)
      })

      describe('when only pinned tabs remaining', function () {
        it('defaults to next index if there are tabs to right', function () {
          frames = Immutable.fromJS([
            { key: 2 },
            { pinnedLocation: 'https://www.facebook.com/', key: 4 }
          ])
          const result = frameStateUtil.removeFrame(frames, tabs, closedFrames, frameProps, activeFrameKey)
          assert.equal(4, result.activeFrameKey)
        })

        it('defaults to previous if no tabs to right', function () {
          frames = Immutable.fromJS([
            { pinnedLocation: 'https://www.facebook.com/', key: 6 },
            { key: 2 }
          ])
          const result = frameStateUtil.removeFrame(frames, tabs, closedFrames, frameProps, activeFrameKey)
          assert.equal(6, result.activeFrameKey)
        })
      })
    })
  })
})
