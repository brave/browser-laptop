/* global describe, it, before, beforeEach, after, afterEach */
const mockery = require('mockery')
const sinon = require('sinon')
const Immutable = require('immutable')
const { assert } = require('chai')
const dragTypes = require('../../../../js/constants/dragTypes')
const settings = require('../../../../js/constants/settings')
const { tabCloseAction } = require('../../../../app/common/constants/settingsEnums')
const fakeElectron = require('../../lib/fakeElectron')
const FakeTab = require('../../lib/fakeTab')
const fakeAdBlock = require('../../lib/fakeAdBlock')

require('../../braveUnit')

describe('tabs API unit tests', function () {
  let tabs, appActions, windows
  before(function () {
    mockery.enable({
      warnOnReplace: false,
      warnOnUnregistered: false,
      useCleanCache: true
    })

    this.tabWithDevToolsClosed = {
      isDestroyed: () => false,
      isDevToolsOpened: () => false,
      openDevTools: sinon.mock(),
      closeDevTools: sinon.mock()
    }

    this.tabWithDevToolsOpened = {
      isDestroyed: () => false,
      isDevToolsOpened: () => true,
      isDevToolsFocused: () => false,
      openDevTools: sinon.mock(),
      closeDevTools: sinon.mock()
    }

    this.tabWithDevToolsOpenedAndFocused = {
      isDestroyed: () => false,
      isDevToolsOpened: () => true,
      isDevToolsFocused: () => true,
      openDevTools: sinon.mock(),
      closeDevTools: sinon.mock()
    }

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

    this.appStore = {
      getState: () => Immutable.fromJS(this.appState),
      addChangeListener: () => {}
    }

    this.fakeGetWebContents = (tabId) => {
      const webContents = {
        canGoBack: () => true,
        canGoForward: () => true,
        session: {
          partition: 'default'
        },
        tabValue: () =>
          this.state.get('tabs').find((tab) => tab.get('tabId') === tabId),
        isDestroyed: () => false,
        detach: (cb) => cb(),
        once: (event, cb) => {
          setImmediate(cb)
        },
        getZoomPercent: () => 100,
        isPlaceholder: () => false
      }
      if (tabId === 1) {
        Object.assign(webContents, this.tabWithDevToolsClosed)
      } else if (tabId === 2) {
        Object.assign(webContents, this.tabWithDevToolsOpened)
      } else if (tabId === 3) {
        Object.assign(webContents, this.tabWithDevToolsOpenedAndFocused)
      }
      return webContents
    }
    this.fakeGetOpenerTabId = () => null

    mockery.registerMock('electron', fakeElectron)
    mockery.registerMock('ad-block', fakeAdBlock)
    mockery.registerMock('../../js/stores/appStore', this.appStore)
    mockery.registerMock('../filtering', {
      isResourceEnabled: (resourceName, url, isPrivate) => false
    })
    this.actualActiveTabHistory = require('../../../../app/browser/activeTabHistory')
    this.actualWebContentsCache = require('../../../../app/browser/webContentsCache')
    this.settings = require('../../../../js/settings')

    appActions = require('../../../../js/actions/appActions')
    windows = require('../../../../app/browser/windows')
    this.notifyWindowWebContentsAddedSpy = sinon.spy(windows, 'notifyWindowWebContentsAdded')
    mockery.registerMock('./windows', windows)
    tabs = require('../../../../app/browser/tabs')
  })

  after(function () {
    mockery.disable()
    this.notifyWindowWebContentsAddedSpy.restore()
  })

  describe('toggleDevTools', function () {
    before(function () {
      this.getWebContentsStub = sinon.stub(this.actualWebContentsCache, 'getWebContents', this.fakeGetWebContents)
      this.getOpenerTabIdStub = sinon.stub(this.actualWebContentsCache, 'getOpenerTabId', this.fakeGetOpenerTabId)
    })

    after(function () {
      this.getWebContentsStub.restore()
      this.getOpenerTabIdStub.restore()
    })

    afterEach(function () {
      this.tabWithDevToolsClosed.openDevTools.reset()
      this.tabWithDevToolsClosed.closeDevTools.reset()
      this.tabWithDevToolsOpened.openDevTools.reset()
      this.tabWithDevToolsOpened.closeDevTools.reset()
    })
    it('opens dev tools if closed', function () {
      tabs.toggleDevTools(1)
      assert(this.tabWithDevToolsClosed.openDevTools.calledOnce)
      assert(this.tabWithDevToolsClosed.closeDevTools.notCalled)
      // Also check it leaves other tabs alone
      assert(this.tabWithDevToolsOpened.openDevTools.notCalled)
      assert(this.tabWithDevToolsOpened.closeDevTools.notCalled)
      assert(this.tabWithDevToolsOpenedAndFocused.openDevTools.notCalled)
      assert(this.tabWithDevToolsOpenedAndFocused.closeDevTools.notCalled)
    })
    it('closes dev tools if opened', function () {
      tabs.toggleDevTools(2)
      assert(this.tabWithDevToolsOpened.openDevTools.notCalled)
      assert(this.tabWithDevToolsOpened.closeDevTools.calledOnce)
      // Also check it leaves other tabs alone
      assert(this.tabWithDevToolsClosed.openDevTools.notCalled)
      assert(this.tabWithDevToolsClosed.closeDevTools.notCalled)
      assert(this.tabWithDevToolsOpenedAndFocused.openDevTools.notCalled)
      assert(this.tabWithDevToolsOpenedAndFocused.closeDevTools.notCalled)
    })
  })

  describe('isDevToolsFocused', function () {
    before(function () {
      this.getWebContentsStub = sinon.stub(this.actualWebContentsCache, 'getWebContents', this.fakeGetWebContents)
      this.getOpenerTabIdStub = sinon.stub(this.actualWebContentsCache, 'getOpenerTabId', this.fakeGetOpenerTabId)
    })

    after(function () {
      this.getWebContentsStub.restore()
      this.getOpenerTabIdStub.restore()
    })

    it('returns false if devtools are opened but not focused', function () {
      assert.equal(tabs.isDevToolsFocused(1), false)
    })
    it('returns false if devtools are not opened', function () {
      assert.equal(tabs.isDevToolsFocused(2), false)
    })
    it('returns true if devtools are opened and focused', function () {
      assert.equal(tabs.isDevToolsFocused(3), true)
    })
  })

  describe('moveTo', function () {
    before(function () {
      this.browserOpts = {
        positionByMouseCursor: true
      }
      this.getWebContentsStub = sinon.stub(this.actualWebContentsCache, 'getWebContents', this.fakeGetWebContents)
      this.getOpenerTabIdStub = sinon.stub(this.actualWebContentsCache, 'getOpenerTabId', this.fakeGetOpenerTabId)
    })

    after(function () {
      this.getWebContentsStub.restore()
      this.getOpenerTabIdStub.restore()
    })

    beforeEach(function () {
      this.newWindowSpy = sinon.spy(appActions, 'newWindow')
      // this.notifyWindowWebContentsAddedSpy = sinon.spy(windows, 'notifyWindowWebContentsAdded')
    })

    afterEach(function () {
      this.newWindowSpy.restore()
      // this.notifyWindowWebContentsAddedSpy.restore()
    })

    it('moves tab to a new window', function () {
      const state = this.state.set('dragData', Immutable.fromJS({
        windowId: 1,
        type: dragTypes.TAB,
        data: this.state.getIn(['tabs', 0]),
        dropWindowId: -1
      }))
      const frameOpts = {
        tabId: 1,
        windowId: 1,
        pinned: false,
        active: true,
        indexByFrameKey: undefined,
        prependIndexByFrameKey: undefined
      }
      tabs.moveTo(state, frameOpts.tabId, frameOpts, this.browserOpts, state.getIn(['dragData', 'dropWindowId']))
      assert.equal(this.newWindowSpy.calledOnce, true)
      // assert.equal(this.notifyWindowWebContentsAddedSpy.notCalled, true)
    })
    it('moves tab to an existing window', function () {
      const state = this.state.set('dragData', Immutable.fromJS({
        windowId: 1,
        type: dragTypes.TAB,
        data: this.state.getIn(['tabs', 0]),
        dropWindowId: 11
      }))
      const frameOpts = {
        tabId: 1,
        windowId: 1,
        pinned: false,
        active: true,
        indexByFrameKey: undefined,
        prependIndexByFrameKey: undefined
      }
      tabs.moveTo(state, frameOpts.tabId, frameOpts, this.browserOpts, state.getIn(['dragData', 'dropWindowId']))
      assert.equal(this.newWindowSpy.notCalled, true)
      // assert.equal(this.notifyWindowWebContentsAddedSpy.calledOnce, true)
    })
    it('does not move pinned tabs', function () {
      const state = this.state.set('dragData', Immutable.fromJS({
        windowId: 2,
        type: dragTypes.TAB,
        data: this.state.getIn(['tabs', 1]),
        dropWindowId: -1
      }))
      const frameOpts = {
        tabId: 2,
        windowId: 1,
        pinned: true,
        active: true,
        indexByFrameKey: undefined,
        prependIndexByFrameKey: undefined
      }
      tabs.moveTo(state, frameOpts.tabId, frameOpts, this.browserOpts, state.getIn(['dragData', 'dropWindowId']))
      assert.equal(this.newWindowSpy.notCalled, true)
    })
    it('does not move pinned tabs to alt window', function () {
      const state = this.state.set('dragData', Immutable.fromJS({
        windowId: 2,
        type: dragTypes.TAB,
        data: this.state.getIn(['tabs', 1]),
        dropWindowId: 89
      }))
      const frameOpts = {
        tabId: 2,
        windowId: 1,
        pinned: true,
        active: true,
        indexByFrameKey: undefined,
        prependIndexByFrameKey: undefined
      }
      tabs.moveTo(state, frameOpts.tabId, frameOpts, this.browserOpts, state.getIn(['dragData', 'dropWindowId']))
      assert.equal(this.newWindowSpy.notCalled, true)
    })
    it('does not move single tab windows into new window', function () {
      const state = this.state.set('dragData', Immutable.fromJS({
        windowId: 1,
        type: dragTypes.TAB,
        data: this.state.getIn(['tabs', this.singleTabWindowIndex]),
        dropWindowId: -1
      }))
      const frameOpts = {
        tabId: 3,
        windowId: 1,
        pinned: true,
        active: true,
        indexByFrameKey: undefined,
        prependIndexByFrameKey: undefined
      }
      tabs.moveTo(state, frameOpts.tabId, frameOpts, this.browserOpts, state.getIn(['dragData', 'dropWindowId']))
      assert.equal(this.newWindowSpy.notCalled, true)
    })
    it('allows combining single tab into alt window', function () {
      const state = this.state.set('dragData', Immutable.fromJS({
        windowId: 2,
        type: dragTypes.TAB,
        data: this.state.getIn(['tabs', 2]),
        dropWindowId: 41
      }))
      const frameOpts = {
        tabId: 3,
        windowId: 1,
        pinned: true,
        active: true,
        indexByFrameKey: undefined,
        prependIndexByFrameKey: undefined
      }
      tabs.moveTo(state, frameOpts.tabId, frameOpts, this.browserOpts, state.getIn(['dragData', 'dropWindowId']))
      assert.equal(this.newWindowSpy.notCalled, true)
    })
  })

  describe('getNextActiveTabId', function () {
    // because we aren't currently mocking
    // the tab events, namely tab.on('set-active'),
    // we manually call activeTabHistory and webContentsCache functions here,
    // which is ok as they are specifically for this function's purpose
    // but it tightly couples implementation with
    // description of expected results. change these usages if use of those
    // singleton-style reference dependencies in the actual code changes

    let tabCloseSettingValue
    const windowId = 1
    const tabIdParent = 1

    before(function () {
      // we want to use actual instance of webContentsCache for these tests
      mockery.deregisterMock('./webContentsCache')
      // override TAB_CLOSE_ACTION setting
      this.stubGetSettings = sinon.stub(this.settings, 'getSetting',
        (settingKey, settingsCollection, value) => {
          if (settingKey === settings.TAB_CLOSE_ACTION) {
            return tabCloseSettingValue
          }
          return false
        }
      )
    })

    after(function () {
      this.stubGetSettings.restore()
    })

    beforeEach(function () {
      // add manual entries to webContentsCache and activeTabHistory
      // open a tab
      this.actualWebContentsCache.updateWebContents(tabIdParent, new FakeTab(tabIdParent, windowId))
      this.actualActiveTabHistory.setActiveTabForWindow(windowId, tabIdParent)
      // open some child tabs
      for (const tabId of [2, 3, 4]) {
        this.actualWebContentsCache.updateWebContents(tabId, new FakeTab(tabId, windowId), tabIdParent)
        this.actualActiveTabHistory.setActiveTabForWindow(windowId, tabId)
      }
    })

    afterEach(function () {
      // clean up our manual entries in webContentsCache
      const webContentsCache = this.actualWebContentsCache.currentWebContents
      for (const tabId of Object.keys(webContentsCache)) {
        delete webContentsCache[tabId]
      }
      // clean up our manual entries in activeTabHistory
      this.actualActiveTabHistory.clearTabbedWindow(1)
      this.actualActiveTabHistory.clearTabbedWindow(2)
    })

    it('switches to parent', function () {
      // set preference to activate parent tab of closed tab
      tabCloseSettingValue = tabCloseAction.PARENT
      // set the middle tab as active
      this.actualActiveTabHistory.setActiveTabForWindow(windowId, 3)
      // close the tab
      this.actualActiveTabHistory.clearTabFromWindow(windowId, 3)
      // perform test
      const actual = tabs.getNextActiveTabId(windowId, 3)
      const expected = tabIdParent
      assert.equal(actual, expected, 'next active tab id is parent tab id of closed tab')
    })

    it('does not switch to parent if parent is detached', function () {
      // set preference to activate parent tab of closed tab
      tabCloseSettingValue = tabCloseAction.PARENT
      // set the middle tab as active
      this.actualActiveTabHistory.setActiveTabForWindow(windowId, 3)
      // detach the parent
      this.actualActiveTabHistory.clearTabFromWindow(windowId, tabIdParent)
      const newParentWindowId = windowId + 1
      this.actualWebContentsCache.getWebContents(tabIdParent).windowId = newParentWindowId
      this.actualActiveTabHistory.setActiveTabForWindow(newParentWindowId, tabIdParent)
      // close the tab
      this.actualActiveTabHistory.clearTabFromWindow(windowId, 3)
      // perform test
      const actual = tabs.getNextActiveTabId(windowId, 3)
      assert.isNull(actual)
    })

    it('does not switch to parent if child is detached', function () {
      // set preference to activate parent tab of closed tab
      tabCloseSettingValue = tabCloseAction.PARENT
      // set the middle tab as active
      this.actualActiveTabHistory.setActiveTabForWindow(windowId, 3)
      // detach a child tab
      this.actualActiveTabHistory.clearTabFromWindow(windowId, 2)
      const newChildWindowId = windowId + 1
      this.actualActiveTabHistory.setActiveTabForWindow(newChildWindowId, 2)
      const childTab = this.actualWebContentsCache.getWebContents(2)
      childTab.windowId = newChildWindowId
      // close the tab
      this.actualActiveTabHistory.clearTabFromWindow(newChildWindowId, 2)
      // perform test
      const actual = tabs.getNextActiveTabId(newChildWindowId, 2)
      assert.isNull(actual)
    })

    it('switches to last active', function () {
      // set preference to active last activated tab
      tabCloseSettingValue = tabCloseAction.LAST_ACTIVE
      const activeOrder = [3, 1, 4, 2]
      for (const tabId of activeOrder) {
        this.actualActiveTabHistory.setActiveTabForWindow(windowId, tabId)
      }
      // close all but the first active tab, and check that the previously-active gets
      // chosen for becoming active
      for (let i = activeOrder.length - 1; i > 0; i--) {
        const closeTabId = activeOrder[i]
        // close tab
        this.actualActiveTabHistory.clearTabFromWindow(windowId, closeTabId)
        // check
        const expectedNextActiveTabId = activeOrder[i - 1]
        const actualNextActiveTabId = tabs.getNextActiveTabId(windowId, closeTabId)
        assert.equal(actualNextActiveTabId, expectedNextActiveTabId, 'next active tab is the previously active tab')
      }
    })

    it('switches to next index, by not overriding', function () {
      // set preference to next index
      tabCloseSettingValue = tabCloseAction.NEXT
      // close active tab
      this.actualActiveTabHistory.clearTabFromWindow(windowId, 4)
      // shouldn't do anything as muon will handle
      const actual = tabs.getNextActiveTabId(windowId, 4)
      assert.isNull(actual, 'next active tab is not set')
    })
  })

  describe('init', function () {
    it('should return state', function () {
      const state = {
        'stateKey': 'stateValue'
      }
      const actual = tabs.init(state, {})
      assert.equal(actual, state)
    })
    describe('on event \'open-url-from-tab\'', function () {
      it('should create tab with url, openerTabId and exptected active properties', function () {
        const expectedId = 12
        const expectedUrl = 'some-url'
        const expectedArguments = {
          url: expectedUrl,
          openerTabId: expectedId,
          active: true
        }
        const source = {
          getId: () => expectedId
        }
        const tempCreate = tabs.create
        tabs.create = sinon.stub()
        tabs.init({}, {})
        process.emit('open-url-from-tab', {}, source, expectedUrl)
        assert.equal(tabs.create.called, true)
        assert.equal(tabs.create.calledWithExactly(expectedArguments), true)
        tabs.create = tempCreate
      })
    })
    describe('on event \'add-new-contents\'', function () {
      it('should prevent default, if not user gesture', function () {
        const event = {
          preventDefault: sinon.stub()
        }
        tabs.init({}, {})
        process.emit('add-new-contents', event, {}, {}, {}, {}, false)
        assert.equal(event.preventDefault.called, true)
      })
      it('should focus on devtools contents, if is background page and devtools open', function () {
        const navTab = {
          isBackgroundPage: () => true,
          isDevToolsOpened: () => true,
          devToolsWebContents: {
            focus: sinon.stub()
          }
        }
        tabs.init({}, {})
        process.emit('add-new-contents', {}, {}, navTab, {}, {}, true)
        assert.equal(navTab.devToolsWebContents.focus.called, true)
      })
      it('should open devtools, if is background page but devtools is not open', function () {
        const navTab = {
          isBackgroundPage: () => true,
          isDevToolsOpened: () => false,
          openDevTools: sinon.stub()
        }
        tabs.init({}, {})
        process.emit('add-new-contents', {}, {}, navTab, {}, {}, true)
        assert.equal(navTab.openDevTools.called, true)
      })
      it('should return empty, if is a background page but not a tab', function () {
        const navTab = {
          isBackgroundPage: () => false,
          isTab: () => false,
          openDevTools: sinon.stub()
        }
        tabs.init({}, {})
        process.emit('add-new-contents', {}, {}, navTab, {}, {}, true)
        assert.equal(navTab.openDevTools.called, false)
      })

      describe('if is not a background page and is a tab', () => {
        const expectedTabId = 10
        const expectedWindowId = 12
        const expectedOwnerWindowId = 13
        const navTab = {
          isBackgroundPage: () => false,
          isTab: () => true,
          getURL: () => '',
          getId: () => '',
          isDestroyed: () => '',
          tabValue: () => ({
            set: () => '',
            windowId: expectedWindowId
          }),
          canGoBack: () => '',
          canGoForward: () => '',
          session: {
            partition: ''
          },
          isPlaceholder: () => '',
          getZoomPercent: () => ''
        }
        const source = {
          isDestroyed: () => '',
          getId: () => expectedTabId,
          isGuest: () => '',
          hostWebContents: ({
            getOwnerBrowserWindow: () => ({id: expectedOwnerWindowId})
          })
        }
        it('should updateWebContents with opener tab id', function () {
          this.actualWebContentsCache.updateWebContents = sinon.stub()
          this.actualWebContentsCache.getWebContents = sinon.stub().returns(navTab)
          tabs.init({}, {})
          process.emit('add-new-contents', {}, source, navTab, {}, {}, true)
          assert.equal(this.actualWebContentsCache.updateWebContents.calledWithExactly('', navTab, expectedTabId), true)
        })

        it('should notifyWindowWebContentsAdded with new tabs windowId, if new tab has got a window ID', function () {
          tabs.init({}, {})
          process.emit('add-new-contents', {}, source, navTab, {}, {}, true)
          assert.equal(this.notifyWindowWebContentsAddedSpy.getCall(0).args[0], expectedWindowId)
        })

        it('should notifyWindowWebContentsAdded with hostWebContents owner browser window ID, if new tab has not got a window ID', function () {
          const clonedTab = Object.assign({}, navTab)
          clonedTab.tabValue = () => ({set: () => ''})
          this.actualWebContentsCache.getWebContents = sinon.stub().returns(clonedTab)
          tabs.init({}, {})
          process.emit('add-new-contents', {}, source, clonedTab, {}, {}, true)
          const lastCall = this.notifyWindowWebContentsAddedSpy.callCount - 1
          assert.equal(this.notifyWindowWebContentsAddedSpy.getCall(lastCall).args[0], expectedOwnerWindowId)
        })
      })
    })
  })

  describe.skip('sendToAll', function () {
    it('todo', function () {
    })
  })

  describe.skip('toggleDevTools', function () {
    it('todo', function () {
    })
  })

  describe.skip('setActive', function () {
    it('todo', function () {
    })
  })

  describe.skip('loadURL', function () {
    it('todo', function () {
    })
  })

  describe.skip('loadURLInActiveTab', function () {
    it('todo', function () {
    })
  })

  describe.skip('setAudioMuted', function () {
    it('todo', function () {
    })
  })

  describe.skip('clone', function () {
    it('todo', function () {
    })
  })

  describe.skip('pin', function () {
    it('todo', function () {
    })
  })

  describe.skip('isDevToolsFocused', function () {
    it('todo', function () {
    })
  })

  describe.skip('closeTab', function () {
    it('todo', function () {
    })
  })

  describe('create', function () {
    before(function () {
      this.clock = sinon.useFakeTimers()
      this.createTabRequestedSpy = sinon.spy(appActions, 'createTabRequested')
      this.extensionsCreateTabSpy = sinon.spy(fakeElectron.extensions, 'createTab')
    })

    after(function () {
      this.clock.restore()
      this.createTabRequestedSpy.restore()
      this.extensionsCreateTabSpy.restore()
    })

    const createProperties = Immutable.fromJS({})
    const cb = null
    const isRestore = false

    it('calls electron.extensions.createTab', function () {
      this.extensionsCreateTabSpy.reset()
      tabs.create(createProperties, cb, isRestore)
      this.clock.tick(1510)
      assert.equal(this.extensionsCreateTabSpy.calledOnce, true)
    })
  })

  describe.skip('executeScriptInBackground', function () {
    it('todo', function () {
    })
  })

  describe.skip('createTab', function () {
    it('todo', function () {
    })
  })

  describe.skip('maybeCreateTab', function () {
    it('todo', function () {
    })
  })

  describe.skip('goBack', function () {
    it('todo', function () {
    })
  })

  describe.skip('goForward', function () {
    it('todo', function () {
    })
  })

  describe.skip('goToIndex', function () {
    it('todo', function () {
    })
  })

  describe.skip('getHistoryEntries', function () {
    it('todo', function () {
    })
  })
})
