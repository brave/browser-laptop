/* global describe, it, before, beforeEach, after, afterEach */
const mockery = require('mockery')
const sinon = require('sinon')
const Immutable = require('immutable')
const assert = require('assert')
const dragTypes = require('../../../../js/constants/dragTypes')
const fakeElectron = require('../../lib/fakeElectron')
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

    mockery.registerMock('electron', fakeElectron)
    mockery.registerMock('ad-block', fakeAdBlock)
    mockery.registerMock('../../js/stores/appStore', this.appStore)
    mockery.registerMock('../filtering', {
      isResourceEnabled: (resourceName, url, isPrivate) => false
    })

    mockery.registerMock('./webContentsCache', {
      getWebContents: (tabId) => {
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
    })
    tabs = require('../../../../app/browser/tabs')
    appActions = require('../../../../js/actions/appActions')
  })

  after(function () {
    mockery.disable()
  })

  describe('toggleDevTools', function () {
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
