/* global describe, before, it, beforeEach, after */
const Immutable = require('immutable')
const mockery = require('mockery')
const assert = require('assert')
const fakeElectron = require('../lib/fakeElectron')

require('../braveUnit')

const defaultWindowStore = Immutable.fromJS({
  activeFrameKey: null,
  frames: [],
  closedFrames: []
})

describe('frameStateUtil', function () {
  let frameStateUtil

  before(function () {
    mockery.enable({
      warnOnReplace: false,
      warnOnUnregistered: false,
      useCleanCache: true
    })
    mockery.registerMock('electron', fakeElectron)
    frameStateUtil = require('../../../js/state/frameStateUtil')
    this.windowState = Immutable.fromJS(Object.assign({}, defaultWindowStore.toJS()))
  })

  after(function () {
    mockery.disable()
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
    let state, frameProps, activeFrameKey, framePropsIndex

    beforeEach(function () {
      frameProps = Immutable.fromJS({ key: 2 })
      activeFrameKey = 2
      framePropsIndex = 0

      state = Immutable.fromJS({
        activeFrameKey: activeFrameKey,
        frames: [
          { key: 2 },
          { key: 3, parentFrameKey: 2 },
          { key: 4, pinnedLocation: 'https://www.facebook.com/' },
          { key: 5, pinnedLocation: 'https://twitter.com/' }
        ],
        closedFrames: [
          { key: 1 }
        ],
        framesInternal: {
          index: {
            2: 0,
            3: 1,
            4: 2,
            5: 3
          }
        }
      })
    })

    it('removed frame is added to `closedFrames`', function () {
      const result = frameStateUtil.removeFrame(state, frameProps, framePropsIndex)
      const inClosedFrames = result.closedFrames.find((frame) => frame.get('key') === frameProps.get('key'))
      assert.equal(false, inClosedFrames === undefined)
    })

    it('sets isFullScreen=false for the removed frame', function () {
      frameProps = Immutable.fromJS({ key: 2, isFullScreen: true })
      const result = frameStateUtil.removeFrame(state, frameProps, framePropsIndex)
      const inClosedFrames = result.closedFrames.find((frame) => frame.get('key') === frameProps.get('key'))
      assert.equal(false, inClosedFrames.get('isFullScreen'))
    })

    it('removed frame is NOT added to `closedFrames` if private', function () {
      let data = Immutable.fromJS({
        frames: [
          { key: 2 }
        ],
        framesInternal: {
          index: {2: 0}
        }
      })

      const newState = state.merge(data)
      frameProps = Immutable.fromJS({ isPrivate: true, key: 2 })
      const result = frameStateUtil.removeFrame(newState, frameProps, activeFrameKey, framePropsIndex)
      const inClosedFrames = result.closedFrames.find((frame) => frame.get('key') === frameProps.get('key'))
      assert.equal(true, inClosedFrames === undefined)
    })

    it('removes the frame from `frames`', function () {
      const result = frameStateUtil.removeFrame(state, frameProps, framePropsIndex)
      const inFrames = result.frames.find((frame) => frame.get('key') === frameProps.get('key'))
      assert.equal(true, inFrames === undefined)
    })
  })

  describe('getTotalBlocks', function () {
    it('returns false if there are no units blocked', function () {
      const frames = Immutable.fromJS({
        adblock: { blocked: [] },
        trackingProtection: { blocked: [] },
        noScript: { blocked: [] },
        fingerprintingProtection: { blocked: [] }
      })
      const result = frameStateUtil.getTotalBlocks(frames)
      assert.equal(result, false)
    })

    it('returns total of items (ads / trackers / scripts / fingerprints) blocked', function () {
      const frames = Immutable.fromJS({
        adblock: { blocked: [1] },
        trackingProtection: { blocked: [1, 2] },
        noScript: { blocked: [1, 2, 3, 4] },
        fingerprintingProtection: { blocked: [1, 2, 3, 4, 5, 6, 7, 8] }
      })
      const result = frameStateUtil.getTotalBlocks(frames)
      assert.equal(result, 15)
    })

    it('defaults values to 0 if element is not a list or is not present', function () {
      const frames = Immutable.fromJS({
        adblock: { blocked: 'not a list' },
        trackingProtection: {},
        noScript: { blocked: [1] },
        fingerprintingProtection: { blocked: {} }
      })
      const result = frameStateUtil.getTotalBlocks(frames)
      assert.equal(result, 1)
    })

    it('returns false if the input is falsey', function () {
      assert.equal(frameStateUtil.getTotalBlocks(), false)
      assert.equal(frameStateUtil.getTotalBlocks(undefined), false)
      assert.equal(frameStateUtil.getTotalBlocks(null), false)
      assert.equal(frameStateUtil.getTotalBlocks(false), false)
    })

    it('converts the input to an immutable object', function () {
      const mutableFrames = {
        adblock: { blocked: [1] },
        trackingProtection: { blocked: [1, 2] },
        noScript: { blocked: [1, 2, 3, 4] },
        fingerprintingProtection: { blocked: [1, 2, 3, 4, 5, 6, 7, 8] }
      }
      const result = frameStateUtil.getTotalBlocks(mutableFrames)
      assert.equal(result, 15)
    })

    it('returns "99+" if tracker count is > 99', function () {
      const mutableFrames = {
        adblock: { blocked: [] }
      }

      for (let i = 1; i < 101; i++) {
        mutableFrames.adblock.blocked.push(i)
      }

      const result = frameStateUtil.getTotalBlocks(mutableFrames)
      assert.equal(result, '99+')
    })
  })
})
