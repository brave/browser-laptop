/* global describe, it, before, after, afterEach */
const mockery = require('mockery')
const Immutable = require('immutable')
const assert = require('assert')
const sinon = require('sinon')
const fakeElectron = require('../../../lib/fakeElectron')

const windowConstants = require('../../../../../js/constants/windowConstants')
const appConstants = require('../../../../../js/constants/appConstants')
const frameStateUtil = require('../../../../../js/state/frameStateUtil')

require('../../../braveUnit')

const windowState = Immutable.fromJS({
  activeFrameKey: 2,
  searchDetail: {},
  frames: [{
    key: 1,
    tabId: 3,
    title: 'test',
    adblock: {blocked: []},
    audioPlaybackActive: true,
    computedThemeColor: '#ff0000',
    httpsEverywhere: {a: '1'},
    icon: 'https://www.brave.com/favicon.ico',
    location: 'https://www.brave.com/2',
    noScript: {blocked: []},
    themeColor: '#ffffff',
    trackingProtection: {blocked: []},
    fingerprintingProtection: {blocked: []}
  }, {
    key: 2,
    tabId: 5,
    title: 'test',
    adblock: {blocked: []},
    audioPlaybackActive: true,
    computedThemeColor: '#ff0000',
    httpsEverywhere: {a: '1'},
    icon: 'https://www.brave.com/favicon.ico',
    location: 'https://www.brave.com/2',
    noScript: {blocked: []},
    themeColor: '#ffffff',
    trackingProtection: {blocked: []},
    fingerprintingProtection: {blocked: []}
  }, {
    key: 3,
    tabId: 13,
    title: 'test',
    adblock: {blocked: []},
    audioPlaybackActive: true,
    computedThemeColor: '#ff0000',
    httpsEverywhere: {a: '1'},
    icon: 'https://www.mastercezarameridote.com/favicon.ico',
    location: 'https://www.mastercezarmeridote.com',
    noScript: {blocked: []},
    themeColor: '#ffffff',
    trackingProtection: {blocked: []},
    fingerprintingProtection: {blocked: []}
  }],
  framesInternal: {
    index: {
      1: 0,
      2: 1,
      3: 2
    },
    tabIndex: {
      3: 0,
      5: 1,
      13: 2
    }
  }
})

const fakeCurrentWindow = {
  isMaximized: () => false,
  isFullScreen: () => false,
  isFocused: () => false,
  getCurrentWindowId: () => 1
}

describe('frameReducer', function () {
  let frameReducer
  before(function () {
    mockery.enable({
      warnOnReplace: false,
      warnOnUnregistered: false,
      useCleanCache: true
    })
    this.appActions = require('../../../../../js/actions/appActions')
    mockery.registerMock('electron', fakeElectron)
    mockery.registerMock('../currentWindow', fakeCurrentWindow)
    frameReducer = require('../../../../../app/renderer/reducers/frameReducer')
  })
  after(function () {
    mockery.disable()
  })

  describe('WINDOW_SET_NAVIGATED', function () {
    describe('In page navigation', function () {
      before(function () {
        this.location = 'https://www.brave.com/'
        this.newState = frameReducer(windowState, {
          actionType: windowConstants.WINDOW_SET_NAVIGATED,
          location: this.location,
          isNavigatedInPage: true,
          key: 2
        })
      })
      it('sets the location for the specified `key`', function () {
        assert.equal(this.newState.getIn(['frames', 1, 'location']), this.location)
      })
      it('does not reset values', function () {
        assert.equal(this.newState.getIn(['frames', 1, 'title']), 'test')
        assert.deepEqual(this.newState.getIn(['frames', 1, 'adblock']).toJS(), {blocked: []})
        assert.equal(this.newState.getIn(['frames', 1, 'audioPlaybackActive']), true)
        assert.equal(this.newState.getIn(['frames', 1, 'computedThemeColor']), '#ff0000')
        assert.deepEqual(this.newState.getIn(['frames', 1, 'httpsEverywhere']).toJS(), {a: '1'})
        assert.equal(this.newState.getIn(['frames', 1, 'icon']), 'https://www.brave.com/favicon.ico')
        assert.deepEqual(this.newState.getIn(['frames', 1, 'noScript']).toJS(), {blocked: []})
        assert.equal(this.newState.getIn(['frames', 1, 'themeColor']), '#ffffff')
        assert.deepEqual(this.newState.getIn(['frames', 1, 'trackingProtection']).toJS(), {blocked: []})
        assert.deepEqual(this.newState.getIn(['frames', 1, 'fingerprintingProtection']).toJS(), {blocked: []})
        assert.equal(this.newState.getIn(['frames', 0, 'title']), 'test')
        assert.deepEqual(this.newState.getIn(['frames', 0, 'adblock']).toJS(), {blocked: []})
        assert.equal(this.newState.getIn(['frames', 0, 'audioPlaybackActive']), true)
        assert.equal(this.newState.getIn(['frames', 0, 'computedThemeColor']), '#ff0000')
        assert.deepEqual(this.newState.getIn(['frames', 0, 'httpsEverywhere']).toJS(), {a: '1'})
        assert.equal(this.newState.getIn(['frames', 0, 'icon']), 'https://www.brave.com/favicon.ico')
        assert.equal(this.newState.getIn(['frames', 0, 'location']), 'https://www.brave.com/2')
        assert.deepEqual(this.newState.getIn(['frames', 0, 'noScript']).toJS(), {blocked: []})
        assert.equal(this.newState.getIn(['frames', 0, 'themeColor']), '#ffffff')
        assert.deepEqual(this.newState.getIn(['frames', 0, 'trackingProtection']).toJS(), {blocked: []})
        assert.deepEqual(this.newState.getIn(['frames', 0, 'fingerprintingProtection']).toJS(), {blocked: []})
      })
    })
    describe('Navigation', function () {
      before(function () {
        this.location = 'https://www.brave.com/'
        this.newState = frameReducer(windowState, {
          actionType: windowConstants.WINDOW_SET_NAVIGATED,
          location: this.location,
          key: 2
        })
      })
      it('sets the location for the specified `key`', function () {
        assert.equal(this.newState.getIn(['frames', 1, 'location']), this.location)
      })
      it('resets values for the active frame key', function () {
        assert.equal(this.newState.getIn(['frames', 1, 'title']), '')
        assert.deepEqual(this.newState.getIn(['frames', 1, 'adblock']).toJS(), {})
        assert.equal(this.newState.getIn(['frames', 1, 'audioPlaybackActive']), false)
        assert.equal(this.newState.getIn(['frames', 1, 'computedThemeColor']), undefined)
        assert.deepEqual(this.newState.getIn(['frames', 1, 'httpsEverywhere']).toJS(), {})
        assert.equal(this.newState.getIn(['frames', 1, 'icon']), undefined)
        assert.equal(this.newState.getIn(['frames', 1, 'location']), this.location)
        assert.deepEqual(this.newState.getIn(['frames', 1, 'noScript']).toJS(), {})
        assert.equal(this.newState.getIn(['frames', 1, 'themeColor']), undefined)
        assert.deepEqual(this.newState.getIn(['frames', 1, 'trackingProtection']).toJS(), {})
        assert.deepEqual(this.newState.getIn(['frames', 1, 'fingerprintingProtection']).toJS(), {})
      })
      it('does not reset values for other frames', function () {
        assert.equal(this.newState.getIn(['frames', 0, 'title']), 'test')
        assert.deepEqual(this.newState.getIn(['frames', 0, 'adblock']).toJS(), {blocked: []})
        assert.equal(this.newState.getIn(['frames', 0, 'audioPlaybackActive']), true)
        assert.equal(this.newState.getIn(['frames', 0, 'computedThemeColor']), '#ff0000')
        assert.deepEqual(this.newState.getIn(['frames', 0, 'httpsEverywhere']).toJS(), {a: '1'})
        assert.equal(this.newState.getIn(['frames', 0, 'icon']), 'https://www.brave.com/favicon.ico')
        assert.equal(this.newState.getIn(['frames', 0, 'location']), 'https://www.brave.com/2')
        assert.deepEqual(this.newState.getIn(['frames', 0, 'noScript']).toJS(), {blocked: []})
        assert.equal(this.newState.getIn(['frames', 0, 'themeColor']), '#ffffff')
        assert.deepEqual(this.newState.getIn(['frames', 0, 'trackingProtection']).toJS(), {blocked: []})
        assert.deepEqual(this.newState.getIn(['frames', 0, 'fingerprintingProtection']).toJS(), {blocked: []})
      })
    })
  })

  describe('WINDOW_TAB_MOVE', function () {
    before(function () {
      this.tabIndexChangeRequestedStub = sinon.stub(this.appActions, 'tabIndexChangeRequested')
    })
    afterEach(function () {
      this.tabIndexChangeRequestedStub.reset()
    })
    after(function () {
      this.tabIndexChangeRequestedStub.restore()
    })
    describe('Can move last tab to first position', function () {
      before(function () {
        this.newState = frameReducer(windowState, {
          actionType: windowConstants.WINDOW_TAB_MOVE,
          sourceFrameKey: 3,
          destinationFrameKey: 1,
          prepend: true
        })
      })
      it('calls appActions.tabIndexChangeRequested with the correct args', function () {
        assert.equal(this.tabIndexChangeRequestedStub.withArgs(13, 0).calledOnce, true)
      })
      it('does not change window state', function () {
        assert.deepEqual(this.newState.toJS(), windowState.toJS())
      })
    })
    describe('Can move last tab to the middle', function () {
      before(function () {
        this.newState = frameReducer(windowState, {
          actionType: windowConstants.WINDOW_TAB_MOVE,
          sourceFrameKey: 3,
          destinationFrameKey: 1,
          prepend: false
        })
      })
      it('calls appActions.tabIndexChangeRequested with the correct args', function () {
        assert.equal(this.tabIndexChangeRequestedStub.withArgs(13, 1).calledOnce, true)
      })
      it('does not change window state', function () {
        assert.deepEqual(this.newState.toJS(), windowState.toJS())
      })
    })
    describe('Can move tabs to the end', function () {
      before(function () {
        this.newState = frameReducer(windowState, {
          actionType: windowConstants.WINDOW_TAB_MOVE,
          sourceFrameKey: 1,
          destinationFrameKey: 3,
          prepend: false
        })
      })
      it('calls appActions.tabIndexChangeRequested with the correct args', function () {
        assert.equal(this.tabIndexChangeRequestedStub.withArgs(3, 2).calledOnce, true)
      })
      it('does not change window state', function () {
        assert.deepEqual(this.newState.toJS(), windowState.toJS())
      })
    })
    describe('Can move tabs to the middle from the left', function () {
      before(function () {
        this.newState = frameReducer(windowState, {
          actionType: windowConstants.WINDOW_TAB_MOVE,
          sourceFrameKey: 1,
          destinationFrameKey: 2,
          prepend: false
        })
      })
      it('calls appActions.tabIndexChangeRequested with the correct args', function () {
        assert.equal(this.tabIndexChangeRequestedStub.withArgs(3, 1).calledOnce, true)
      })
      it('does not change window state', function () {
        assert.deepEqual(this.newState.toJS(), windowState.toJS())
      })
    })
    describe('Can move middle tab left', function () {
      before(function () {
        this.newState = frameReducer(windowState, {
          actionType: windowConstants.WINDOW_TAB_MOVE,
          sourceFrameKey: 2,
          destinationFrameKey: 1,
          prepend: true
        })
      })
      it('calls appActions.tabIndexChangeRequested with the correct args', function () {
        assert.equal(this.tabIndexChangeRequestedStub.withArgs(5, 0).calledOnce, true)
      })
      it('does not change window state', function () {
        assert.deepEqual(this.newState.toJS(), windowState.toJS())
      })
    })
    describe('Can move middle tab right', function () {
      before(function () {
        this.newState = frameReducer(windowState, {
          actionType: windowConstants.WINDOW_TAB_MOVE,
          sourceFrameKey: 2,
          destinationFrameKey: 3,
          prepend: false
        })
      })
      it('calls appActions.tabIndexChangeRequested with the correct args', function () {
        assert.equal(this.tabIndexChangeRequestedStub.withArgs(5, 2).calledOnce, true)
      })
      it('does not change window state', function () {
        assert.deepEqual(this.newState.toJS(), windowState.toJS())
      })
    })
  })
  describe('APP_TAB_UPDATED', function () {
    describe('when index changes', function () {
      it('re-orders frame index when index changes', function () {
        const action = {
          actionType: appConstants.APP_TAB_UPDATED,
          tabValue: {
            tabId: 3,
            index: 2
          }
        }

        this.newState = frameReducer(windowState, action, Immutable.fromJS(action))
        assert.equal(this.newState.toJS().frames.length, windowState.toJS().frames.length)
        // First tab moves to third position
        assert.equal(this.newState.toJS().frames[2].tabId, windowState.toJS().frames[0].tabId)
        // Old index 1 moves 1 to the left
        assert.equal(this.newState.toJS().frames[0].tabId, windowState.toJS().frames[1].tabId)
        // Old index 2 moves 1 to the left
        assert.equal(this.newState.toJS().frames[1].tabId, windowState.toJS().frames[2].tabId)
      })
      it('new frame has not showed up in frames', function () {
        const action = {
          actionType: appConstants.APP_TAB_UPDATED,
          tabValue: {
            tabId: 13,
            index: 3,
            title: 'Bondy Power!'
          }
        }
        this.newState = frameReducer(windowState, action, Immutable.fromJS(action))
        assert.equal(this.newState.toJS().frames.length, windowState.toJS().frames.length)
      })
    })
    describe('when pinned status changes', function () {
      // TODO(bbondy): Noticed this is missing while in the context of fixing an unrelated thing.
      it.skip('(todo)')
    })
    describe('when URL changes', function () {
      // TODO(bbondy): Noticed this is missing while in the context of fixing an unrelated thing.
      it.skip('(todo)')
    })
    describe('when title changes', function () {
      // TODO(bbondy): Noticed this is missing while in the context of fixing an unrelated thing.
      it.skip('(todo)')
    })
    describe('when active state changes', function () {
      // TODO(bbondy): Noticed this is missing while in the context of fixing an unrelated thing.
      it.skip('(todo)')
    })
  })
  describe('APP_TAB_INSERTED_TO_TAB_STRIP', function () {
    const tabId = 13
    const index = 1
    const action = {
      actionType: appConstants.APP_TAB_INSERTED_TO_TAB_STRIP,
      index,
      tabId
    }
    const immutableAction = Immutable.fromJS(action)
    let initialIndex

    before(function () {
      initialIndex = frameStateUtil.getIndexByTabId(windowState, tabId)
      assert.equal(initialIndex, 2, 'frame is at the initial expected index')
      const frame = frameStateUtil.getFrameByIndex(windowState, initialIndex)
      assert.equal(frame.has('tabStripWindowId'), false, 'frame is not initially marked as in a window tab strip')
    })

    it('marks the frame as inserted to a window tab strip', function () {
      const newState = frameReducer(windowState, action, immutableAction)
      const newIndex = frameStateUtil.getIndexByTabId(newState, tabId)
      assert.equal(newIndex, 1, 'frame is moved to the new index in the window tab strip')
      const frame = frameStateUtil.getFrameByIndex(newState, newIndex)
      assert.equal(frame.get('tabStripWindowId'), 1, 'frame is marked as in the window tab strip')
    })
  })
})
