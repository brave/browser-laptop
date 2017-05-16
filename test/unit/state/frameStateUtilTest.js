/* global describe, before, it, beforeEach */
const frameStateUtil = require('../../../js/state/frameStateUtil')
const {tabCloseAction} = require('../../../app/common/constants/settingsEnums')
const Immutable = require('immutable')
const assert = require('assert')

require('../braveUnit')

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
      const result = frameStateUtil.removeFrame(state, frameProps, activeFrameKey, framePropsIndex)
      const inClosedFrames = result.closedFrames.find((frame) => frame.get('key') === frameProps.get('key'))
      assert.equal(false, inClosedFrames === undefined)
    })

    it('sets isFullScreen=false for the removed frame', function () {
      frameProps = Immutable.fromJS({ key: 2, isFullScreen: true })
      const result = frameStateUtil.removeFrame(state, frameProps, activeFrameKey, framePropsIndex)
      const inClosedFrames = result.closedFrames.find((frame) => frame.get('key') === frameProps.get('key'))
      assert.equal(false, inClosedFrames.get('isFullScreen'))
    })

    it('removed frame is NOT added to `closedFrames` if private', function () {
      let data = Immutable.fromJS({
        frames: [
          { key: 2 }
        ],
        framesInternal: {
          index: {
            2: 0
          }
        }
      })
      const newState = state.merge(data)
      frameProps = Immutable.fromJS({ isPrivate: true, key: 2 })
      const result = frameStateUtil.removeFrame(newState, frameProps, activeFrameKey, framePropsIndex)
      const inClosedFrames = result.closedFrames.find((frame) => frame.get('key') === frameProps.get('key'))
      assert.equal(true, inClosedFrames === undefined)
    })

    it('removes the frame from `frames`', function () {
      const result = frameStateUtil.removeFrame(state, frameProps, activeFrameKey, framePropsIndex)
      const inFrames = result.frames.find((frame) => frame.get('key') === frameProps.get('key'))
      assert.equal(true, inFrames === undefined)
    })

    describe('does not change `activeFrameKey`', function () {
      it('if frame removed is not active and has parentFrameKey set', function () {
        frameProps = Immutable.fromJS({ key: 3 })
        const result = frameStateUtil.removeFrame(state, frameProps, activeFrameKey, framePropsIndex)
        assert.equal(activeFrameKey, result.activeFrameKey)
      })

      it('if frame removed is not active and does NOT have parentFrameKey set', function () {
        frameProps = Immutable.fromJS({ key: 4 })
        const result = frameStateUtil.removeFrame(state, frameProps, activeFrameKey, framePropsIndex)
        assert.equal(activeFrameKey, result.activeFrameKey)
      })

      it('if there are no frames left', function () {
        let data = Immutable.fromJS({
          frames: [
            { key: 2 }
          ],
          framesInternal: {
            index: {
              2: 0
            }
          }
        })
        const newState = state.merge(data)
        const result = frameStateUtil.removeFrame(newState, frameProps, activeFrameKey, framePropsIndex)
        assert.equal(activeFrameKey, result.activeFrameKey)
      })
    })

    describe('when active frame is removed', function () {
      describe('returns the next *non-pinned* active frame key', function () {
        beforeEach(function () {
          activeFrameKey = 4
          frameProps = Immutable.fromJS({key: 4})
          framePropsIndex = 2

          state = Immutable.fromJS({
            activeFrameKey: activeFrameKey,
            frames: [
              {key: 2, lastAccessedTime: 1484075990},
              {key: 3, pinnedLocation: 'https://www.facebook.com/', lastAccessedTime: 1484075999},
              {key: 4, parentFrameKey: 3, lastAccessedTime: 148407595},
              {key: 5, lastAccessedTime: 1484075960},
              {key: 6, lastAccessedTime: 1484075950}
            ],
            closedFrames: [],
            framesInternal: {
              index: {
                2: 0,
                3: 1,
                4: 2,
                5: 3,
                6: 4
              }
            }
          })
        })

        it('parent tab action', function () {
          const result = frameStateUtil.removeFrame(state,
            frameProps,
            activeFrameKey,
            framePropsIndex
          )
          assert.equal(result.activeFrameKey, 5)
        })

        it('next tab action', function () {
          const result = frameStateUtil.removeFrame(state,
            frameProps,
            activeFrameKey,
            framePropsIndex,
            tabCloseAction.NEXT
          )
          assert.equal(result.activeFrameKey, 5)
        })

        it('last active tab action', function () {
          const result = frameStateUtil.removeFrame(state,
            frameProps,
            activeFrameKey,
            framePropsIndex,
            tabCloseAction.LAST_ACTIVE
          )
          assert.equal(result.activeFrameKey, 2)
        })
      })

      it('returns the previous *non-pinned* frame key (if none found for next and no parent association)', function () {
        frameProps = Immutable.fromJS({
          isFullScreen: false,
          isPrivate: false,
          key: 3
        })
        activeFrameKey = 3
        framePropsIndex = 1

        state = Immutable.fromJS({
          activeFrameKey: activeFrameKey,
          frames: [
            { key: 2 },
            { key: 3 },
            { key: 4, pinnedLocation: 'https://www.facebook.com/' },
            { key: 5, pinnedLocation: 'https://twitter.com/' }
          ],
          closedFrames: [],
          framesInternal: {
            index: {
              2: 0,
              3: 1,
              4: 2,
              5: 3
            }
          }
        })

        const result = frameStateUtil.removeFrame(state, frameProps, activeFrameKey, framePropsIndex)
        assert.equal(2, result.activeFrameKey)
      })

      describe('when only pinned tabs remaining', function () {
        it('defaults to next index if there are tabs to right', function () {
          framePropsIndex = 0
          state = Immutable.fromJS({
            activeFrameKey: activeFrameKey,
            frames: [
              { key: 2 },
              { key: 4, pinnedLocation: 'https://www.facebook.com/' }
            ],
            closedFrames: [],
            framesInternal: {
              index: {
                2: 0,
                4: 1
              }
            }
          })

          const result = frameStateUtil.removeFrame(state, frameProps, activeFrameKey, framePropsIndex)
          assert.equal(4, result.activeFrameKey)
        })

        it('defaults to previous if no tabs to right', function () {
          framePropsIndex = 1
          state = Immutable.fromJS({
            activeFrameKey: activeFrameKey,
            frames: [
              { key: 6, pinnedLocation: 'https://www.facebook.com/' },
              { key: 2 }
            ],
            closedFrames: [],
            framesInternal: {
              index: {
                6: 0,
                2: 1
              }
            }
          })

          const result = frameStateUtil.removeFrame(state, frameProps, activeFrameKey, framePropsIndex)
          assert.equal(6, result.activeFrameKey)
        })
      })

      describe('getNonPinnedFrameCount', function () {
        it('returns 0 with no frames', function () {
          this.windowState = Immutable.fromJS(Object.assign({}, defaultWindowStore.toJS()))
          assert.equal(frameStateUtil.getNonPinnedFrameCount(Immutable.fromJS({frames: []})), 0)
        })
        it('returns 0 with only pinned frames', function () {
          this.windowState = Immutable.fromJS(Object.assign({}, defaultWindowStore.toJS()))
          assert.equal(frameStateUtil.getNonPinnedFrameCount(Immutable.fromJS({frames: [{title: '153,409th prime', pinnedLocation: 'http://www.brave.com/2064737'}]})), 0)
        })
        it('returns 1 with a frame and a pinned frames', function () {
          this.windowState = Immutable.fromJS(Object.assign({}, defaultWindowStore.toJS()))
          assert.equal(frameStateUtil.getNonPinnedFrameCount(Immutable.fromJS({frames: [{title: '153,409th prime', pinnedLocation: 'http://www.brave.com/2064737'}, {title: '153,409th prime', location: 'http://www.brave.com/2064737'}]})), 1)
        })
      })
    })
  })

  describe('getFrameByLastAccessedTime', function () {
    let stateWithLastAccessedTime, stateWithoutLastAccessedTime, stateWithNullifiedLastAccessedTime

    beforeEach(function () {
      stateWithLastAccessedTime = Immutable.fromJS({
        frames: [
          { key: 2, lastAccessedTime: null },
          { key: 3, lastAccessedTime: 1488184050731 },
          { key: 4, lastAccessedTime: 1488184050711 },
          { key: 5 }
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
      stateWithoutLastAccessedTime = Immutable.fromJS({
        frames: [
          { key: 2 },
          { key: 3 },
          { key: 4 }
        ],
        framesInternal: {
          index: {
            2: 0,
            3: 1,
            4: 2
          }
        }
      })
      stateWithNullifiedLastAccessedTime = Immutable.fromJS({
        frames: [
          { key: 2, lastAccessedTime: null },
          { key: 3, lastAccessedTime: null },
          { key: 4, lastAccessedTime: null }
        ],
        framesInternal: {
          index: {
            2: 0,
            3: 1,
            4: 2
          }
        }
      })
    })

    it('gets correct frame by last accessed time', function () {
      const result = frameStateUtil.getFrameByLastAccessedTime(stateWithLastAccessedTime)
      assert.equal(1, result)
    })

    it('returns -1 for frames without last accessed time', function () {
      const result = frameStateUtil.getFrameByLastAccessedTime(stateWithoutLastAccessedTime)
      assert.equal(-1, result)
    })

    it('returns -1 for frames with nullified last accessed time', function () {
      const result = frameStateUtil.getFrameByLastAccessedTime(stateWithNullifiedLastAccessedTime)
      assert.equal(-1, result)
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
