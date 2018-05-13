/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

/* global describe, it, before, after, afterEach */
const mockery = require('mockery')
const sinon = require('sinon')
const Immutable = require('immutable')
const { assert } = require('chai')
const fakeAdBlock = require('../../../lib/fakeAdBlock')
const FakeElectronDisplay = require('../../../lib/fakeElectronDisplay')

const appConstants = require('../../../../../js/constants/appConstants')
require('../../../braveUnit')

describe('windowsReducer unit test', function () {
  let windowsReducer
  const fakeElectron = Object.assign({}, require('../../../lib/fakeElectron'))

  const fakeWindowState = {
    maybeCreateWindow: (state, action) => state
  }

  const fakeWindowApi = {
    createWindow: () => {},
    getFramesForNewWindow: () => {},
    windowDefaults: (state) => {
      return {
        width: state.getIn(['defaultWindowParams', 'width']) || state.get('defaultWindowWidth'),
        height: state.getIn(['defaultWindowParams', 'height']) || state.get('defaultWindowHeight'),
        x: state.getIn(['defaultWindowParams', 'x']) || undefined,
        y: state.getIn(['defaultWindowParams', 'y']) || undefined,
        minWidth: 480,
        minHeight: 300,
        minModalHeight: 100,
        minModalWidth: 100,
        windowOffset: 20
      }
    }
  }

  const fakePlatformUtil = {
    isDarwin: () => true,
    isWindows: () => false
  }

  const state = Immutable.fromJS({
    windows: [],
    defaultWindowParams: {}
  })
  let fakeTimers
  before(function () {
    mockery.enable({
      warnOnReplace: false,
      warnOnUnregistered: false,
      useCleanCache: true
    })
    fakeTimers = sinon.useFakeTimers()
    mockery.registerMock('electron', fakeElectron)
    mockery.registerMock('ad-block', fakeAdBlock)
    mockery.registerMock('../../common/state/windowState', fakeWindowState)
    mockery.registerMock('../windows', fakeWindowApi)
    mockery.registerMock('../../common/lib/platformUtil', fakePlatformUtil)
    windowsReducer = require('../../../../../app/browser/reducers/windowsReducer')
  })

  after(function () {
    mockery.disable()
    fakeTimers.restore()
  })

  describe('APP_NEW_WINDOW', function () {
    let spy
    before(function () {
      spy = sinon.spy(fakeWindowApi, 'createWindow')
    })
    afterEach(function () {
      spy.reset()
    })
    after(function () {
      spy.restore()
    })

    const sampleFrame1 = {
      location: 'http://mysite.com'
    }
    const sampleFrame2 = {
      location: 'http://mysite2.com'
    }

    it('creates a window, with a single specified frame', function () {
      const action = {
        actionType: appConstants.APP_NEW_WINDOW,
        frameOpts: sampleFrame1
      }
      windowsReducer(state, action)
      // schedules call to createWindow on setImmediate
      fakeTimers.tick(0)
      assert(spy.calledOnce)
      assert(spy.withArgs([ sampleFrame1 ]))
    })

    it('creates a window, with multiple specified frames', function () {
      const action = {
        actionType: appConstants.APP_NEW_WINDOW,
        frameOpts: [ sampleFrame1, sampleFrame2 ]
      }
      windowsReducer(state, action)
      // schedules call to createWindow on setImmediate
      fakeTimers.tick(0)
      // ensure the window api was asked to create the frame
      assert(spy.calledOnce)
      assert(spy.withArgs([ sampleFrame1, sampleFrame2 ]))
    })

    it('creates a window taking up the entire screen workarea by default', function () {
      const fakeDisplay = new FakeElectronDisplay()
      const action = {
        actionType: appConstants.APP_NEW_WINDOW
      }
      windowsReducer(state, action)
      // schedules call to createWindow on setImmediate
      fakeTimers.tick(0)
      // ensure the window api was asked to create the window
      // taking up the entire screen work area
      // NOTE: this may not be the best UX, but it is how it is
      // intentionally coded at the time of writing this test (petemill)
      const { width, height } = spy.args[0][0]
      assert.deepEqual(fakeDisplay.workAreaSize, { width, height })
    })

    describe('when specifying window size', function () {
      const exampleDimensions = { width: 600, height: 700 }

      it('allows a window size to be exactly specified', function () {
        const expectedDimensions = { width: exampleDimensions.width, outerHeight: exampleDimensions.height }
        const action = {
          actionType: appConstants.APP_NEW_WINDOW,
          browserOpts: Object.assign({}, expectedDimensions)
        }
        windowsReducer(state, action)
        fakeTimers.tick(0)
        const windowOptions = spy.args[0][0]
        assert.propertyVal(windowOptions, 'width', expectedDimensions.width)
        assert.propertyVal(windowOptions, 'height', expectedDimensions.outerHeight)
      })

      it('allows a window size to be specified, ignoring navBar height', function () {
        const action = {
          actionType: appConstants.APP_NEW_WINDOW,
          browserOpts: Object.assign({}, exampleDimensions)
        }
        windowsReducer(state, action)
        fakeTimers.tick(0)
        const windowOptions = spy.args[0][0]
        // width should be exact
        assert.propertyVal(windowOptions, 'width', exampleDimensions.width)
        // height should have 'navBar' added on to it
        assert.isAbove(windowOptions.height, exampleDimensions.height)
        // but should not be larger than screen height
        assert.isBelow(windowOptions.height, new FakeElectronDisplay().workAreaSize.height)
      })

      it('allows size to be specified via `restoredState`', function () {
        const action = {
          actionType: appConstants.APP_NEW_WINDOW,
          restoredState: {
            windowInfo: exampleDimensions
          }
        }
        windowsReducer(state, action)
        fakeTimers.tick(0)
        const windowOptions = spy.args[0][0]
        assert.propertyVal(windowOptions, 'width', exampleDimensions.width)
        assert.propertyVal(windowOptions, 'height', exampleDimensions.height)
      })

      it('falls back to the defaults if size is not provided', function () {
        const stateWithDefault = state.mergeIn(['defaultWindowParams'], exampleDimensions)
        const action = {
          actionType: appConstants.APP_NEW_WINDOW
        }
        windowsReducer(stateWithDefault, action)
        fakeTimers.tick(0)
        const windowOptions = spy.args[0][0]
        assert.propertyVal(windowOptions, 'width', exampleDimensions.width)
        assert.propertyVal(windowOptions, 'height', exampleDimensions.height)
      })

      it('falls back to the deprecated defaults if no other size is provided', function () {
        const stateWithDefault = state
          .set('defaultWindowWidth', exampleDimensions.width)
          .set('defaultWindowHeight', exampleDimensions.height)
        const action = {
          actionType: appConstants.APP_NEW_WINDOW
        }
        windowsReducer(stateWithDefault, action)
        fakeTimers.tick(0)
        const windowOptions = spy.args[0][0]
        assert.propertyVal(windowOptions, 'width', exampleDimensions.width)
        assert.propertyVal(windowOptions, 'height', exampleDimensions.height)
      })
    })

    describe('when specifying the window position', function () {
      const expectedPosition = { x: 500, y: 600 }

      it('positions the window by the mouse cursor when asked', function () {
        const expectedPosition = fakeElectron.screen.getCursorScreenPoint()
        const action = {
          actionType: appConstants.APP_NEW_WINDOW,
          browserOpts: { positionByMouseCursor: true }
        }
        windowsReducer(state, action)
        fakeTimers.tick(0)
        const windowOptions = spy.args[0][0]
        assert.propertyVal(windowOptions, 'x', expectedPosition.x)
        assert.propertyVal(windowOptions, 'y', expectedPosition.y)
      })

      it('positions the window to an exact point when asked', function () {
        const action = {
          actionType: appConstants.APP_NEW_WINDOW,
          browserOpts: {
            x: expectedPosition.x,
            y: expectedPosition.y
          }
        }
        windowsReducer(state, action)
        fakeTimers.tick(0)
        const windowOptions = spy.args[0][0]
        assert.propertyVal(windowOptions, 'x', expectedPosition.x)
        assert.propertyVal(windowOptions, 'y', expectedPosition.y)
      })

      it('allows size to be specified via `restoredState`', function () {
        const action = {
          actionType: appConstants.APP_NEW_WINDOW,
          restoredState: {
            windowInfo: {
              left: expectedPosition.x,
              top: expectedPosition.y
            }
          }
        }
        windowsReducer(state, action)
        fakeTimers.tick(0)
        const windowOptions = spy.args[0][0]
        assert.propertyVal(windowOptions, 'x', expectedPosition.x)
        assert.propertyVal(windowOptions, 'y', expectedPosition.y)
      })

      it('falls back to the defaults if size is not provided', function () {
        const stateWithDefault = state.mergeIn(['defaultWindowParams'], expectedPosition)
        const action = {
          actionType: appConstants.APP_NEW_WINDOW
        }
        windowsReducer(stateWithDefault, action)
        fakeTimers.tick(0)
        const windowOptions = spy.args[0][0]
        assert.propertyVal(windowOptions, 'x', expectedPosition.x)
        assert.propertyVal(windowOptions, 'y', expectedPosition.y)
      })
    })

    it('restores a maximized window', function () {
      const action = {
        actionType: appConstants.APP_NEW_WINDOW,
        restoredState: {
          windowInfo: { state: 'maximized' }
        }
      }
      windowsReducer(state, action)
      fakeTimers.tick(0)
      const actualIsMaximized = spy.args[0][2]
      assert.isTrue(actualIsMaximized)
    })

    it('does not maximize a window by default', function () {
      const action = {
        actionType: appConstants.APP_NEW_WINDOW
      }
      windowsReducer(state, action)
      fakeTimers.tick(0)
      const actualIsMaximized = spy.args[0][2]
      assert.isFalse(actualIsMaximized)
    })
  })

  describe('APP_WINDOW_UPDATED', function () {
    let spy
    before(function () {
      spy = sinon.spy(fakeWindowState, 'maybeCreateWindow')
    })
    afterEach(function () {
      spy.reset()
    })
    after(function () {
      spy.restore()
    })

    it('null case', function () {
      const newState = windowsReducer(state, {
        actionType: appConstants.APP_WINDOW_UPDATED
      })
      assert.equal(spy.calledOnce, true)
      assert.deepEqual(state.getIn(['defaultWindowParams']).toJS(), newState.getIn(['defaultWindowParams']).toJS())
    })

    it('updateDefault is false (we shouldnt update it)', function () {
      const newState = windowsReducer(state, {
        actionType: appConstants.APP_WINDOW_UPDATED,
        updateDefault: false
      })
      assert.equal(spy.calledOnce, true)
      assert.deepEqual(state.getIn(['defaultWindowParams']).toJS(), newState.getIn(['defaultWindowParams']).toJS())
    })

    it('updateDefault is true', function () {
      const newState = windowsReducer(state, {
        actionType: appConstants.APP_WINDOW_UPDATED,
        updateDefault: true,
        windowValue: {
          width: 1,
          height: 2,
          x: 3,
          y: 4,
          state: 'maximized'
        }
      })
      assert.equal(spy.calledOnce, true)
      assert.deepEqual({
        width: 1,
        height: 2,
        x: 3,
        y: 4,
        maximized: true
      }, newState.getIn(['defaultWindowParams']).toJS())
    })
  })
})
