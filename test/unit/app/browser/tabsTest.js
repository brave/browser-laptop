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
  let tabs, appActions
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
        }
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
    tabs = require('../../../../app/browser/tabs')
    appActions = require('../../../../js/actions/appActions')
  })

  after(function () {
    mockery.disable()
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
      this.newWebContentsAddedSpy = sinon.spy(appActions, 'newWebContentsAdded')
    })

    afterEach(function () {
      this.newWindowSpy.restore()
      this.newWebContentsAddedSpy.restore()
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
      assert.equal(this.newWebContentsAddedSpy.notCalled, true)
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
      assert.equal(this.newWebContentsAddedSpy.calledOnce, true)
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
      assert.equal(this.newWebContentsAddedSpy.notCalled, true)
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
      assert.equal(this.newWebContentsAddedSpy.notCalled, true)
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
      assert.equal(this.newWebContentsAddedSpy.notCalled, true)
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
      assert.equal(this.newWebContentsAddedSpy.calledOnce, true)
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

  describe.skip('init', function () {
    it('todo', function () {
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
