/* global describe, it, before, beforeEach, after, afterEach */
const Immutable = require('immutable')
const assert = require('assert')
const mockery = require('mockery')
const sinon = require('sinon')
const appConstants = require('../../../../../js/constants/appConstants')
const tabActions = require('../../../../../app/common/actions/tabActions')
const dragTypes = require('../../../../../js/constants/dragTypes')
const fakeElectron = require('../../../lib/fakeElectron')
const fakeAdBlock = require('../../../lib/fakeAdBlock')
require('../../../braveUnit')

describe('tabsReducer unit tests', function () {
  let tabsReducer

  before(function () {
    mockery.enable({
      warnOnReplace: false,
      warnOnUnregistered: false,
      useCleanCache: true
    })
    this.state = Immutable.fromJS({
      settings: [],
      tabs: [{
        tabId: 1,
        index: 0,
        windowId: 1,
        pinned: false,
        active: true
      }, {
        tabId: 2,
        index: 1,
        pinned: true,
        windowId: 1
      }, {
        tabId: 3,
        index: 2,
        pinned: false,
        windowId: 2,
        active: false
      }, {
        tabId: 4,
        index: 3,
        pinned: false,
        windowId: 2,
        active: false
      }, {
        tabId: 5,
        index: 4,
        pinned: false,
        windowId: 2,
        active: true,
        openerTabId: 4
      }],
      tabsInternal: {
        index: {
          1: 0,
          2: 1,
          3: 2,
          4: 3,
          5: 4
        },
        lastActive: {
          1: [0, 1],
          2: [4, 3, 2]
        }
      },
      windows: [{
        windowId: 1,
        windowUUID: 'uuid'
      }, {
        windowId: 2,
        windowUUID: 'uuid2'
      }]
    })
    mockery.registerMock('electron', fakeElectron)
    mockery.registerMock('ad-block', fakeAdBlock)

    this.tabsAPI = {
      isDevToolsFocused: (tabId) => {
        return tabId === 1
      },
      setWebRTCIPHandlingPolicy: sinon.mock(),
      toggleDevTools: sinon.mock(),
      closeTab: sinon.mock(),
      moveTo: sinon.mock(),
      reload: sinon.mock(),
      updateTabsStateForWindow: sinon.mock(),
      create: sinon.mock(),
      forgetTab: sinon.spy()
    }

    this.windowsAPI = require('../../../../../app/browser/windows')
    this.tabStateAPI = require('../../../../../app/common/state/tabState')

    mockery.registerMock('tabs', this.tabsAPI)
    mockery.registerMock('../tabs', this.tabsAPI)
    mockery.registerMock('../windows', this.windowsAPI)
    mockery.registerMock('../../common/state/tabState', this.tabStateAPI)
    tabsReducer = require('../../../../../app/browser/reducers/tabsReducer')
    this.realTabsAPI = require('../../../../../app/browser/tabs')
    this.tabsAPI.getNextActiveTab = this.realTabsAPI.getNextActiveTab
  })

  after(function () {
    mockery.disable()
  })

  describe('tabActions.reload', function () {
    before(function () {
      this.tabId = 1

      this.action = {
        actionType: tabActions.reload.name,
        tabId: this.tabId
      }
      this.reload = sinon.spy()
      this.tabsAPI.reload = this.reload
      this.newState = tabsReducer(this.state, this.action)
    })

    after(function () {
      this.tabsAPI.reload.reset()
    })

    it('calls `tabs.reload` for `action.tabId`', function () {
      assert(this.tabsAPI.reload.withArgs(1).calledOnce)
    })
  })

  describe('tabActions.didFinishNavigation', function () {
    before(function () {
      this.tabId = 1
      this.navigationState = {
        visibleEntry: {
          virtualURL: 'about:newtab',
          url: 'chrome-extension://blah/about-newtab.html'
        }
      }

      const action = {
        actionType: tabActions.didFinishNavigation.name,
        tabId: this.tabId,
        navigationState: this.navigationState
      }

      this.setNavigationStateSpy = sinon.stub(this.tabStateAPI, 'setNavigationState', (state) => state)
      this.newState = tabsReducer(this.state, action)
    })

    after(function () {
      this.setNavigationStateSpy.restore()
      this.tabsAPI.setWebRTCIPHandlingPolicy.reset()
    })

    it('sets the navigation state to the value of `action.navigationState`', function () {
      assert(this.setNavigationStateSpy.withArgs(this.state, 1, Immutable.fromJS(this.navigationState)).calledOnce)
    })

    it('updates the setWebRTCIPHandlingPolicy', function () {
      assert(this.tabsAPI.setWebRTCIPHandlingPolicy.calledOnce)
    })
  })

  describe('tabActions.didStartNavigation', function () {
    before(function () {
      this.tabId = 1
      this.navigationState = {
        visibleEntry: {
          virtualURL: 'about:newtab',
          url: 'chrome-extension://blah/about-newtab.html'
        }
      }

      const action = {
        actionType: tabActions.didStartNavigation.name,
        tabId: this.tabId,
        navigationState: this.navigationState
      }

      this.setNavigationStateSpy = sinon.stub(this.tabStateAPI, 'setNavigationState', (state) => state)
      this.newState = tabsReducer(this.state, action)
    })

    after(function () {
      this.setNavigationStateSpy.restore()
      this.tabsAPI.setWebRTCIPHandlingPolicy.reset()
    })

    it('sets the navigation state to the value of `action.navigationState`', function () {
      assert(this.setNavigationStateSpy.withArgs(this.state, 1, Immutable.fromJS(this.navigationState)).calledOnce)
    })
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

  describe.skip('APP_TAB_DETACH_MENU_ITEM_CLICKED', function () {
    it('Someone clicked the detach menu item', function () {
      // TODO
    })
  })

  describe.skip('APP_TAB_MOVED', function () {
    it('A tab has moved', function () {
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

  describe('APP_TAB_CLOSED', function () {
    const action = {
      actionType: appConstants.APP_TAB_CLOSED,
      tabId: 5
    }

    before(function () {
      this.clock = sinon.useFakeTimers()
    })

    after(function () {
      this.clock.restore()
    })

    beforeEach(function () {
      this.removeTabByTabIdSpy = sinon.stub(this.tabStateAPI, 'removeTabByTabId', (state) => state)
      this.tabsAPI.forgetTab.reset()
    })

    afterEach(function () {
      this.removeTabByTabIdSpy.restore()
      this.tabsAPI.updateTabsStateForWindow.reset()
    })

    it('calls tabState.removeTabByTabId', function () {
      tabsReducer(this.state, action)
      assert.equal(this.tabStateAPI.removeTabByTabId.getCall(0).args[1], action.tabId)
      assert.equal(this.tabsAPI.updateTabsStateForWindow.getCall(0).args[1], 2)
      assert(this.tabsAPI.forgetTab.withArgs(5).calledOnce)
    })

    it('does nothing if tabId is TAB_ID_NONE', function () {
      const invalidAction = {
        actionType: action.actionType,
        tabId: this.tabStateAPI.TAB_ID_NONE
      }
      tabsReducer(this.state, invalidAction)
      this.clock.tick(1510)
      assert(this.tabStateAPI.removeTabByTabId.notCalled)
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
      tabId: 1
    }

    before(function () {
      this.clock = sinon.useFakeTimers()
    })

    after(function () {
      this.clock.restore()
    })

    beforeEach(function () {
      this.closeWindowSpy = sinon.spy(this.windowsAPI, 'closeWindow')
    })

    afterEach(function () {
      this.tabsAPI.toggleDevTools.reset()
      this.tabsAPI.closeTab.reset()
      this.tabsAPI.moveTo.reset()
      this.closeWindowSpy.restore()
    })

    describe('when tabId == TAB_ID_ACTIVE', function () {
      beforeEach(function () {
        this.getActiveTabIdSpy = sinon.spy(this.tabStateAPI, 'getActiveTabId')
      })
      afterEach(function () {
        this.getActiveTabIdSpy.restore()
      })
      it('calls getActiveTabId to get the actual tabId', function () {
        const actionActiveTab = {
          actionType: action.actionType,
          tabId: this.tabStateAPI.TAB_ID_ACTIVE
        }
        tabsReducer(this.state, actionActiveTab)
        this.clock.tick(1510)
        assert(this.tabStateAPI.getActiveTabId.withArgs(this.state, 1).calledOnce)
      })
    })

    describe('when tabId == TAB_ID_NONE', function () {
      it('exits without taking action', function () {
        const actionNoTab = {
          actionType: action.actionType,
          tabId: this.tabStateAPI.TAB_ID_NONE
        }
        tabsReducer(this.state, actionNoTab)
        this.clock.tick(1510)
        assert(this.tabsAPI.toggleDevTools.notCalled)
        assert(this.tabsAPI.closeTab.notCalled)
        assert(this.windowsAPI.closeWindow.notCalled)
      })
    })

    describe('with isDevToolsFocused', function () {
      afterEach(function () {
        this.tabsAPI.isDevToolsFocused.restore()
      })

      describe('when true', function () {
        beforeEach(function () {
          this.isDevToolsFocused = sinon.stub(this.tabsAPI, 'isDevToolsFocused', () => true)
          this.tabStateAPI.resolveTabId = sinon.stub(this.tabStateAPI, 'resolveTabId', () => {
            return action.tabId
          })
        })
        afterEach(function () {
          this.tabStateAPI.resolveTabId.restore()
        })

        it('closes devtools when opened and focused', function () {
          tabsReducer(this.state, action)
          this.clock.tick(1510)
          assert(this.tabsAPI.toggleDevTools.withArgs(this.state, 1).calledOnce)
          assert(this.tabsAPI.closeTab.notCalled)
        })
      })

      describe('when false', function () {
        beforeEach(function () {
          this.isDevToolsFocused = sinon.stub(this.tabsAPI, 'isDevToolsFocused', () => false)
        })
        afterEach(function () {
          this.tabStateAPI.getNonPinnedTabsByWindowId.restore()
          this.tabStateAPI.getPinnedTabsByWindowId.restore()
        })

        describe('when more than 1 tab exists', function () {
          beforeEach(function () {
            this.nonPinnedTabs = sinon.stub(this.tabStateAPI, 'getNonPinnedTabsByWindowId', (state, windowId) => {
              return Immutable.fromJS([{
                tabId: 1,
                windowId: 1,
                pinned: false,
                active: true
              }, {
                tabId: 2,
                pinned: false,
                windowId: 1
              }])
            })
            this.pinnedTabs = sinon.stub(this.tabStateAPI, 'getPinnedTabsByWindowId', (state, windowId) => Immutable.fromJS([]))
          })

          it('closes tab', function () {
            tabsReducer(this.state, action)
            this.clock.tick(1510)
            assert(this.tabsAPI.toggleDevTools.notCalled)
            assert(this.tabsAPI.closeTab.withArgs(action.tabId, undefined).calledOnce)
          })
        })

        describe('when there are no tabs left', function () {
          beforeEach(function () {
            this.nonPinnedTabs = sinon.stub(this.tabStateAPI, 'getNonPinnedTabsByWindowId', (state, windowId) => {
              return Immutable.fromJS([{
                tabId: 1,
                windowId: 1,
                pinned: false,
                active: true
              }])
            })
          })

          describe('when pinnedTabs.size > 0', function () {
            beforeEach(function () {
              this.pinnedTabs = sinon.stub(this.tabStateAPI, 'getPinnedTabsByWindowId', (state, windowId) => Immutable.fromJS([{
                tabId: 2,
                windowId: 1,
                pinned: true
              }]))
            })

            it('closes tab', function () {
              tabsReducer(this.state, action)
              this.clock.tick(1510)
              assert(this.tabsAPI.toggleDevTools.notCalled)
              assert(this.tabsAPI.closeTab.withArgs(action.tabId, undefined).calledOnce)
            })
          })

          describe('when pinnedTabs.size == 0', function () {
            beforeEach(function () {
              this.pinnedTabs = sinon.stub(this.tabStateAPI, 'getPinnedTabsByWindowId', (state, windowId) => Immutable.fromJS([]))
            })
          })
        })
      })
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

  describe('APP_WINDOW_READY', function () {
    before(function () {
      this.clock = sinon.useFakeTimers()
      this.action = Immutable.fromJS({
        actionType: appConstants.APP_WINDOW_READY,
        senderWindowId: 1337,
        createProperties: {
          windowId: null
        }
      })
      this.create = sinon.spy()
      this.tabsAPI.create = this.create
      tabsReducer = require('../../../../../app/browser/reducers/tabsReducer')
    })

    beforeEach(function () {
      this.tabsAPI.create.reset()
    })

    after(function () {
      this.clock.restore()
    })

    describe('when showOnLoad is true', function () {
      before(function () {
        this.newState = this.state.set('about', Immutable.fromJS({
          welcome: {
            showOnLoad: true
          }
        }))
      })

      it('calls tabs.create', function () {
        tabsReducer(this.newState, this.action)
        this.clock.tick(1510)
        assert(this.tabsAPI.create.calledOnce)
      })

      it('sets tabs.create url argument to welcome screen', function () {
        tabsReducer(this.newState, this.action)
        this.clock.tick(1510)
        assert.equal(
          this.tabsAPI.create.args[0][0].url,
          'about:welcome'
        )
      })

      it('sets senderWindowId as the windowId when none is found', function () {
        tabsReducer(this.newState, this.action)
        this.clock.tick(1510)
        assert.equal(
          this.tabsAPI.create.args[0][0].windowId,
          this.action.get('senderWindowId')
        )
      })
    })

    describe('when showOnLoad is false', function () {
      before(function () {
        this.newState = this.state.set('about', Immutable.fromJS({
          welcome: {
            showOnLoad: false
          }
        }))
      })

      it('does not call tabs.create', function () {
        tabsReducer(this.newState, this.action)
        this.clock.tick(1510)
        assert.equal(this.tabsAPI.create.notCalled, true)
      })
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
      assert.deepEqual(args[2].toJS(), { tabId: 1,
        windowId: 1,
        pinned: false,
        active: true
      })
      // Passes browser options for position by mouse cursor
      assert.deepEqual(args[3], {
        checkMaximized: true,
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
