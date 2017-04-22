/* global describe, it, before, after, beforeEach, afterEach */
const Immutable = require('immutable')
const assert = require('assert')
const mockery = require('mockery')
const sinon = require('sinon')
const appConstants = require('../../../../../js/constants/appConstants')
const dragTypes = require('../../../../../js/constants/dragTypes')
const fakeElectron = require('../../../lib/fakeElectron')
require('../../../braveUnit')

describe('tabsReducer', function () {
  let tabsReducer
  let appActions
  before(function () {
    mockery.enable({
      warnOnReplace: false,
      warnOnUnregistered: false,
      useCleanCache: true
    })
    this.notPinnedTabIndex = 0
    this.pinnedTabIndex = 1
    this.singleTabWindowIndex = 2
    this.state = Immutable.fromJS({
      tabs: [{
        tabId: 1,
        windowId: 1,
        pinned: false
      }, {
        tabId: 2,
        pinned: true,
        windowId: 1
      }, {
        tabId: 3,
        pinned: false,
        windowId: 2
      }]
    })
    mockery.registerMock('electron', fakeElectron)
    mockery.registerMock('./webContentsCache', {
      getWebContents: (tabId) => ({
        canGoBack: () => true,
        canGoForward: () => true,
        session: {
          partition: 'default'
        },
        tabValue: () =>
          this.state.get('tabs').find((tab) => tab.get('tabId') === tabId),
        isDestroyed: () => false,
        detach: (cb) => cb()
      })
    })
    tabsReducer = require('../../../../../app/browser/reducers/tabsReducer')
    appActions = require('../../../../../js/actions/appActions')
  })

  after(function () {
    mockery.disable()
  })

  beforeEach(function () {
    this.newWindowSpy = sinon.spy(appActions, 'newWindow')
    this.newWebContentsAddedSpy = sinon.spy(appActions, 'newWebContentsAdded')
  })

  afterEach(function () {
    this.newWindowSpy.restore()
    this.newWebContentsAddedSpy.restore()
  })

  describe.skip('APP_SET_STATE', function () {
    it('initializes a tab', function () {
      // TODO
    })
  })

  describe.skip('APP_TAB_CREATED', function () {
    it('creates a tab', function () {
      // TODO
    })
  })
  describe.skip('APP_TAB_MOVED', function () {
    it('moves a tab', function () {
      // TODO
    })
  })

  describe.skip('APP_CREATE_TAB_REQUESTED', function () {
    it('creates a new tab', function () {
      // TODO
    })
  })

  describe.skip('APP_CREATE_TAB_REQUESTED', function () {
    it('creates a tab that does not exist yet', function () {
      // TODO
    })
    it('does not create a tab that already exists', function () {
      // TODO
    })
  })

  // It this one really needed?
  describe.skip('APP_TAB_UPDATED', function () {
    it('updates a tab?', function () {
      // TODO
    })
  })

  describe.skip('APP_TAB_CLOSED', function () {
    it('closes tab?', function () {
      // TODO
    })
  })

  describe.skip('APP_ALLOW_FLASH_ONCE', function () {
    it('allows flash once', function () {
      // TODO
    })
  })

  describe.skip('APP_ALLOW_FLASH_ALWAYS', function () {
    it('allows flash always', function () {
      // TODO
    })
  })

  describe.skip('APP_TAB_CLONED', function () {
    it('clones a tab', function () {
      // TODO
    })
  })

  describe.skip('APP_TAB_PINNED', function () {
    it('pins a tab', function () {
      // TODO
    })
  })

  describe.skip('WINDOW_SET_AUDIO_MUTED', function () {
    it('mutes audio', function () {
      // TODO
    })
  })

  describe.skip('WINDOW_SET_ACTIVE_FRAME', function () {
    it('sets the frame as active', function () {
      // TODO
    })
  })

  describe.skip('APP_TAB_TOGGLE_DEV_TOOLS', function () {
    it('toggles dev tools for the tab', function () {
      // TODO
    })
  })

  describe.skip('APP_LOAD_URL_REQUESTED', function () {
    it('loads the specified URL', function () {
      // TODO
    })
  })

  describe.skip('APP_LOAD_URL_IN_ACTIVE_TAB_REQUESTED', function () {
    it('loads the specified URL in the active tab', function () {
      // TODO
    })
  })

  describe.skip('APP_FRAME_CHANGED', function () {
    it('updates frame data', function () {
      // TODO
    })
  })

  describe('APP_DRAG_ENDED', function () {
    const action = {
      actionType: appConstants.APP_DRAG_ENDED
    }
    it('moves tab to a new window', function () {
      const state = this.state.set('dragData', Immutable.fromJS({
        windowId: 1,
        type: dragTypes.TAB,
        data: this.state.getIn(['tabs', this.notPinnedTabIndex]),
        dropWindowId: -1
      }))
      const newState = tabsReducer(state, action)
      assert.equal(this.newWindowSpy.calledOnce, true)
      assert.equal(this.newWebContentsAddedSpy.notCalled, true)
      assert(Immutable.is(newState, state))
    })
    it('moves tab to an existing window', function () {
      const state = this.state.set('dragData', Immutable.fromJS({
        windowId: 1,
        type: dragTypes.TAB,
        data: this.state.getIn(['tabs', this.notPinnedTabIndex]),
        dropWindowId: 11
      }))
      const newState = tabsReducer(state, action)
      assert.equal(this.newWindowSpy.notCalled, true)
      assert.equal(this.newWebContentsAddedSpy.calledOnce, true)
      assert(Immutable.is(newState, state))
    })
    it('does not move pinned tabs', function () {
      const state = this.state.set('dragData', Immutable.fromJS({
        windowId: 2,
        type: dragTypes.TAB,
        data: this.state.getIn(['tabs', this.pinnedTabIndex]),
        dropWindowId: -1
      }))
      const newState = tabsReducer(state, action)
      assert.equal(this.newWindowSpy.notCalled, true)
      assert.equal(this.newWebContentsAddedSpy.notCalled, true)
      assert(Immutable.is(newState, state))
    })
    it('does not move pinned tabs to alt window', function () {
      const state = this.state.set('dragData', Immutable.fromJS({
        windowId: 2,
        type: dragTypes.TAB,
        data: this.state.getIn(['tabs', this.pinnedTabIndex]),
        dropWindowId: 89
      }))
      const newState = tabsReducer(state, action)
      assert.equal(this.newWindowSpy.notCalled, true)
      assert.equal(this.newWebContentsAddedSpy.notCalled, true)
      assert(Immutable.is(newState, state))
    })
    it('does not move single tab windows into new window', function () {
      const state = this.state.set('dragData', Immutable.fromJS({
        windowId: 1,
        type: dragTypes.TAB,
        data: this.state.getIn(['tabs', this.singleTabWindowIndex]),
        dropWindowId: -1
      }))
      const newState = tabsReducer(state, action)
      assert.equal(this.newWindowSpy.notCalled, true)
      assert.equal(this.newWebContentsAddedSpy.notCalled, true)
      assert(Immutable.is(newState, state))
    })
    it('allows combining single tab into alt window', function () {
      const state = this.state.set('dragData', Immutable.fromJS({
        windowId: 2,
        type: dragTypes.TAB,
        data: this.state.getIn(['tabs', this.singleTabWindowIndex]),
        dropWindowId: 41
      }))
      const newState = tabsReducer(state, action)
      assert.equal(this.newWindowSpy.notCalled, true)
      assert.equal(this.newWebContentsAddedSpy.calledOnce, true)
      assert(Immutable.is(newState, state))
    })
  })
})
