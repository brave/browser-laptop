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

  describe('cloneFrame', function () {
    before(function () {
      this.frameOpts = {
        key: 1,
        tabId: 2,
        parentFrameKey: 3,
        audioMuted: true,
        canGoBack: true,
        canGoForward: true,
        icon: 'icon',
        title: 'title',
        isPrivate: true,
        partitionNumber: 4,
        themeColor: 'ffffff',
        computedThemeColor: 'aaaaaa',
        history: ['http://brave.com'],
        location: 'http://brave.com/about'
      }
      this.aboutFrameOpts = {}
      Object.assign(this.aboutFrameOpts, this.frameOpts)
      this.aboutFrameOpts['aboutDetails'] =
      {
        errorCode: -1,
        frameKey: 1
      }
      this.clonedFrame = frameStateUtil.cloneFrame(this.frameOpts, 4)
      this.key = 6
      this.aboutClonedFrame = frameStateUtil.cloneFrame(this.aboutFrameOpts, 5, this.key)
    })

    it('does not copy the key', function () {
      assert.equal(this.frameOpts.key, 1)
      assert.equal(this.clonedFrame.key, undefined)
    })

    it('does not copy the tabId', function () {
      assert.equal(this.frameOpts.tabId, 2)
      assert.equal(this.clonedFrame.tabId, undefined)
    })

    it('sets the parentFrameKey to frameOpts.key', function () {
      assert.equal(this.frameOpts.parentFrameKey, 3)
      assert.equal(this.clonedFrame.parentFrameKey, 1)
    })

    it('sets the delayedLoadUrl to frameOpts.location', function () {
      assert.equal(this.clonedFrame.delayedLoadUrl, 'http://brave.com/about')
    })

    it('sets the location to about:blank', function () {
      assert.equal(this.clonedFrame.location, 'about:blank')
    })

    it('sets the src to about:blank', function () {
      assert.equal(this.clonedFrame.src, 'about:blank')
    })

    it('sets the guestInstanceId', function () {
      assert.equal(this.clonedFrame.guestInstanceId, 4)
    })

    it('copies audioMuted, canGoBack, canGoForward, icon, title, isPrivate, partitionNumber, themeColor, computere and history', function () {
      // attributes that should be copied
      assert.equal(this.clonedFrame.audioMuted, true)
      assert.equal(this.clonedFrame.canGoBack, true)
      assert.equal(this.clonedFrame.canGoForward, true)
      assert.equal(this.clonedFrame.icon, 'icon')
      assert.equal(this.clonedFrame.title, 'title')
      assert.equal(this.clonedFrame.isPrivate, true)
      assert.equal(this.clonedFrame.partitionNumber, 4)
      assert.equal(this.clonedFrame.themeColor, 'ffffff')
      assert.equal(this.clonedFrame.computedThemeColor, 'aaaaaa')
      assert.deepEqual(this.clonedFrame.history, ['http://brave.com'])
      assert(this.clonedFrame.history !== this.frameOpts.history)
    })

    it('clone without aboutDetails', function () {
      assert.equal(this.clonedFrame.aboutDetails, undefined)
    })

    it('copies aboutDetails with key', function () {
      assert.equal(this.aboutClonedFrame.aboutDetails.errorCode, this.aboutFrameOpts.aboutDetails.errorCode)
      assert.equal(this.aboutClonedFrame.aboutDetails.frameKey, this.key)
    })
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
