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
  let frameStateUtil, getSettingsValue

  before(function () {
    getSettingsValue = 20
    mockery.enable({
      warnOnReplace: false,
      warnOnUnregistered: false,
      useCleanCache: true
    })
    mockery.registerMock('electron', fakeElectron)
    mockery.registerMock('../settings', {
      getSetting: () => getSettingsValue
    })
    frameStateUtil = require('../../../js/state/frameStateUtil')
    this.windowState = Immutable.fromJS(Object.assign({}, defaultWindowStore.toJS()))
  })

  after(function () {
    mockery.disable()
  })

  describe('getFrameIndex', function () {
    before(function () {
      this.frames = Immutable.fromJS([
        {
          key: 1
        },
        {
          key: 2
        }
      ])
      this.framesInternal = Immutable.fromJS({
        index: {
          1: 0,
          2: 1
        }
      })
      this.windowState = this.windowState.set('frames', this.frames)
      this.windowState = this.windowState.set('framesInternal', this.framesInternal)
    })

    it('returns the index by frame key', function () {
      assert.equal(0, frameStateUtil.getFrameIndex(this.windowState, 1))
      assert.equal(1, frameStateUtil.getFrameIndex(this.windowState, 2))
      assert.equal(-1, frameStateUtil.getFrameIndex(this.windowState, 3))
    })
  })

  describe('frameStatePath', function () {
    before(function () {
      this.frames = Immutable.fromJS([
        {
          key: 1
        },
        {
          key: 2
        }
      ])
      this.framesInternal = Immutable.fromJS({
        index: {
          1: 0,
          2: 1
        }
      })
      this.windowState = this.windowState.set('frames', this.frames)
      this.windowState = this.windowState.set('framesInternal', this.framesInternal)
    })

    it('returns the index by frame key', function () {
      assert.deepEqual(['frames', 0], frameStateUtil.frameStatePath(this.windowState, 1))
      assert.deepEqual(['frames', 1], frameStateUtil.frameStatePath(this.windowState, 2))
      assert.equal(null, frameStateUtil.frameStatePath(this.windowState, 3))
    })
  })

  describe('getIndexByTabId', function () {
    before(function () {
      this.frames = Immutable.fromJS([
        {
          tabId: 2
        },
        {
          tabId: 3
        }
      ])
      this.framesInternal = Immutable.fromJS({
        tabIndex: {
          2: 0,
          3: 1
        }
      })
      this.windowState = this.windowState.set('frames', this.frames)
      this.windowState = this.windowState.set('framesInternal', this.framesInternal)
    })

    it('returns the index by frame key', function () {
      assert.equal(0, frameStateUtil.getIndexByTabId(this.windowState, 2))
      assert.equal(1, frameStateUtil.getIndexByTabId(this.windowState, 3))
      assert.equal(-1, frameStateUtil.getIndexByTabId(this.windowState, 4))
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

  describe('getTabPageCount', function () {
    before(function () {
      getSettingsValue = 6
    })

    it('returns two pages when we have more tabs then the tab page limit', function () {
      let state = Immutable.fromJS({
        activeFrameKey: 1,
        frames: [
          { key: 1 },
          { key: 2 },
          { key: 3 },
          { key: 4 },
          { key: 5 },
          { key: 6 },
          { key: 7 },
          { key: 8 }
        ],
        framesInternal: {
          index: {
            1: 0,
            2: 1,
            3: 2,
            4: 3,
            5: 4,
            6: 5,
            7: 6,
            8: 7
          }
        }
      })
      const result = frameStateUtil.getTabPageCount(state)
      assert.equal(result, 2)
    })

    it('returns one pages when we have exactly the same tabs as the tab page limit', function () {
      let state = Immutable.fromJS({
        activeFrameKey: 1,
        frames: [
          { key: 1 },
          { key: 2 },
          { key: 3 },
          { key: 4 },
          { key: 5 },
          { key: 6 }
        ],
        framesInternal: {
          index: {
            1: 0,
            2: 1,
            3: 2,
            4: 3,
            5: 4,
            6: 5
          }
        }
      })
      const result = frameStateUtil.getTabPageCount(state)
      assert.equal(result, 1)
    })

    it('returns one pages when we have less tabs then the tab page limit', function () {
      let state = Immutable.fromJS({
        activeFrameKey: 1,
        frames: [
          { key: 1 },
          { key: 2 },
          { key: 3 },
          { key: 4 },
          { key: 5 },
          { key: 6 }
        ],
        framesInternal: {
          index: {
            1: 0,
            2: 1,
            3: 2,
            4: 3,
            5: 4,
            6: 5
          }
        }
      })
      const result = frameStateUtil.getTabPageCount(state)
      assert.equal(result, 1)
    })
  })

  describe('frameLocationMatch', function () {
    before(function () {
      this.frameKey = 1
      this.location = 'nespresso.com'
      this.state = defaultWindowStore.mergeIn(['frames', 0], {
        location: this.location,
        frameKey: this.frameKey
      })
      this.frame = this.state.getIn(['frames', 0])
    })

    it('returns false if frame is empty', function () {
      const result = frameStateUtil.frameLocationMatch(null, this.location)
      assert.equal(result, false)
    })
    it('returns false if frame is not an Immutable map', function () {
      const result = frameStateUtil.frameLocationMatch(this.frame.toJS(), this.location)
      assert.equal(result, false)
    })
    it('returns false if location is empty', function () {
      const result = frameStateUtil.frameLocationMatch(this.frame, '')
      assert.equal(result, false)
    })
    it('returns false if location is a partial match', function () {
      const result = frameStateUtil.frameLocationMatch(this.frame, 'nespresso.co.uk')
      assert.equal(result, false)
    })
    it('returns true if location match', function () {
      const result = frameStateUtil.frameLocationMatch(this.frame, this.location)
      assert.equal(result, true)
    })
  })

  describe('isFirstFrameKeyInTabPage', function () {
    beforeEach(function () {
      this.frameKey1 = 1
      this.frameKey2 = 7
      this.state = defaultWindowStore.mergeIn(['frames'],
        [{key: this.frameKey1}, {}, {}, {}, {}, {}, {key: this.frameKey2}]
      )
    })
    it('returns false if frame list is empty', function () {
      getSettingsValue = 10
      this.state = this.state.set('frames', Immutable.fromJS([{}]))
      const result = frameStateUtil.isFirstFrameKeyInTabPage(this.state, this.frameKey1)
      assert.equal(result, false)
    })
    it('returns false if the frame is not the first frame', function () {
      getSettingsValue = 10
      this.state = this.state.setIn(['ui', 'tabs', 'tabPageIndex'], 0)
      const result = frameStateUtil.isFirstFrameKeyInTabPage(this.state, this.frameKey7)
      assert.equal(result, false)
    })
    it('returns false if the frame key is not defined', function () {
      getSettingsValue = 10
      this.state = this.state.setIn(['ui', 'tabs', 'tabPageIndex'], 0)
      const result = frameStateUtil.isFirstFrameKeyInTabPage(this.state, null)
      assert.equal(result, false)
    })
    it('returns true if the frame is the first in the first tab set', function () {
      getSettingsValue = 10
      this.state = this.state.setIn(['ui', 'tabs', 'tabPageIndex'], 0)
      const result = frameStateUtil.isFirstFrameKeyInTabPage(this.state, this.frameKey1)
      assert.equal(result, true)
    })
    it('ignores pinned frames even if frame is the first in the tab set', function () {
      getSettingsValue = 10
      this.state = this.state
        .setIn(['ui', 'tabs', 'tabPageIndex'], 0)
        .mergeIn(['frames', 0], {pinnedLocation: true})
      const result = frameStateUtil.isFirstFrameKeyInTabPage(this.state, this.frameKey1)
      assert.equal(result, false)
    })
    it('returns true if the frame is the first in the second tab set', function () {
      this.state = this.state.setIn(['ui', 'tabs', 'tabPageIndex'], 1)
      getSettingsValue = 6
      const result = frameStateUtil.isFirstFrameKeyInTabPage(this.state, this.frameKey2)
      assert.equal(result, true)
    })
  })

  describe('isTor', function () {
    const frame1 = Immutable.Map({partition: 'persist:tor'})
    const frame2 = Immutable.Map({partition: ''})
    const frame3 = Immutable.Map({foobar: false})
    it('null frame case', function () {
      assert.equal(frameStateUtil.isTor(null), false)
    })
    it('other frame case', function () {
      assert.equal(frameStateUtil.isTor(frame3), false)
    })
    it('regular frame case', function () {
      assert.equal(frameStateUtil.isTor(frame2), false)
    })
    it('tor frame case', function () {
      assert.equal(frameStateUtil.isTor(frame1), true)
    })
  })
})
