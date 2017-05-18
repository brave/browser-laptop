/* global describe, it, before, after, afterEach */
const Immutable = require('immutable')
const assert = require('assert')
const mockery = require('mockery')
const sinon = require('sinon')
const appConstants = require('../../../../../js/constants/appConstants')
const dragTypes = require('../../../../../js/constants/dragTypes')
const fakeElectron = require('../../../lib/fakeElectron')
const fakeAdBlock = require('../../../lib/fakeAdBlock')
require('../../../braveUnit')

describe('tabsReducer', function () {
  let tabsReducer
  before(function () {
    mockery.enable({
      warnOnReplace: false,
      warnOnUnregistered: false,
      useCleanCache: true
    })
    this.state = Immutable.fromJS({
      tabs: [{
        tabId: 1,
        windowId: 1,
        pinned: false,
        active: true
      }, {
        tabId: 2,
        pinned: true,
        windowId: 1
      }, {
        tabId: 3,
        pinned: false,
        windowId: 2,
        active: true
      }]
    })
    mockery.registerMock('electron', fakeElectron)
    mockery.registerMock('ad-block', fakeAdBlock)
    mockery.registerMock('leveldown', {})

    this.tabsAPI = {
      isDevToolsFocused: (tabId) => {
        return tabId === 1
      },
      toggleDevTools: sinon.mock(),
      closeTab: sinon.mock(),
      moveTo: sinon.mock()
    }

    mockery.registerMock('tabs', this.tabsAPI)
    mockery.registerMock('../tabs', this.tabsAPI)
    tabsReducer = require('../../../../../app/browser/reducers/tabsReducer')
  })

  after(function () {
    mockery.disable()
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

  describe.skip('APP_TAB_ACTIVATED', function () {
    it('sets the frame as active', function () {
      // TODO
    })
  })

  describe.skip('APP_TAB_TOGGLE_DEV_TOOLS', function () {
    it('toggles dev tools for the tab', function () {
      // TODO
    })
  })

  describe('APP_TAB_CLOSE_REQUESTED', function () {
    const action = {
      actionType: appConstants.APP_TAB_CLOSE_REQUESTED,
      tabId: 3
    }
    before(function () {
      this.clock = sinon.useFakeTimers()
    })
    after(function () {
      this.clock.restore()
    })
    afterEach(function () {
      this.tabsAPI.toggleDevTools.reset()
      this.tabsAPI.closeTab.reset()
      this.tabsAPI.moveTo.reset()
      this.tabsAPI.isDevToolsFocused.restore()
    })
    it('closes devtools when opened and focused', function () {
      this.isDevToolsFocused = sinon.stub(this.tabsAPI, 'isDevToolsFocused', () => true)
      tabsReducer(this.state, action)
      this.clock.tick(1510)
      assert(this.tabsAPI.toggleDevTools.withArgs(this.state, 1).calledOnce)
      assert(this.tabsAPI.closeTab.notCalled)
    })
    it('closes tab when tab is focused with no devtools', function () {
      this.isDevToolsFocused = sinon.stub(this.tabsAPI, 'isDevToolsFocused', () => false)
      tabsReducer(this.state, action)
      this.clock.tick(1510)
      assert(this.tabsAPI.toggleDevTools.notCalled)
      assert(this.tabsAPI.closeTab.withArgs(this.state, 1).calledOnce)
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
    before(function () {
      tabsReducer = require('../../../../../app/browser/reducers/tabsReducer')
    })
    afterEach(function () {
      this.tabsAPI.moveTo.reset()
    })

    it('calls into tabs.moveTo for tabs', function () {
      const state = this.state.set('dragData', Immutable.fromJS({
        windowId: 1,
        type: dragTypes.TAB,
        data: this.state.getIn(['tabs', 0]),
        dropWindowId: -1
      }))
      tabsReducer(state, action)
      const args = this.tabsAPI.moveTo.args[0]
      assert.equal(args.length, 5)  // Function signature has 5 args
      assert.equal(args[0], state)  // State is passed in as first arg
      assert.equal(args[1], 1)  // tabId is 1 for first tab
      // frameOpts being dragged is for the first tab
      assert.deepEqual(args[2], { tabId: 1,
        windowId: 1,
        pinned: false,
        active: true,
        indexByFrameKey: undefined,
        prependIndexByFrameKey: undefined
      })
      // Passes browser options for position by mouse cursor
      assert.deepEqual(args[3], {
        positionByMouseCursor: true
      })
      // Dropping on window ID is -1
      assert.equal(args[4], -1)
    })
    it('does not call into tabs.moveTo for other drop types', function () {
      const state = this.state.set('dragData', Immutable.fromJS({
        windowId: 1,
        type: dragTypes.BOOKMARK,
        data: this.state.getIn(['tabs', 0]),
        dropWindowId: -1
      }))
      tabsReducer(state, action)
      assert(this.tabsAPI.moveTo.notCalled)
    })
  })
})
