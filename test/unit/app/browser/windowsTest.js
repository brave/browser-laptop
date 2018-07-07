/* global describe, it, before, beforeEach, after, afterEach */
const mockery = require('mockery')
const sinon = require('sinon')
const Immutable = require('immutable')
const { assert } = require('chai')
const fakeElectron = require('../../lib/fakeElectron')
const FakeWindow = require('../../lib/fakeWindow')
const fakeAdBlock = require('../../lib/fakeAdBlock')

const fakePlatformUtil = {
  isDarwin: () => true,
  isWindows: () => false
}

const fakeAppDispatcher = {
  registerWindow: () => {
  }
}

require('../../braveUnit')

describe('window API unit tests', function () {
  let windows, appActions
  let appStore
  let defaultState, createTabState, tabCloseState
  const windowCreateTimeout = 5000
  let browserWindowSpy
  let browserShowSpy
  let fakeTimers
  let setFullscreenSpy
  let maximizeSpy

  before(function () {
    mockery.enable({
      warnOnReplace: false,
      warnOnUnregistered: false,
      useCleanCache: true
    })

    const tab1 = {
      id: 1,
      url: 'https://pinned-tab.com',
      partitionNumber: 0,
      windowId: 1,
      pinned: true
    }
    const pinned1 = {
      'https://pinned-tab.com|0|0': {
        location: 'https://pinned-tab.com',
        partitionNumber: 0,
        title: 'Brave Software - Example Pinned Tab',
        order: 1
      }
    }
    const pinned2 = {
      'https://another-pinned-tab.com|0|0': {
        location: 'https://another-pinned-tab.com',
        partitionNumber: pinned1.partitionNumber,
        title: pinned1.title,
        order: pinned1.order
      }
    }

    defaultState = Immutable.fromJS({
      pinnedSites: pinned1,
      tabs: [tab1]
    })

    createTabState = Immutable.fromJS({
      pinnedSites: pinned2,
      tabs: [tab1]
    })

    tabCloseState = Immutable.fromJS({
      pinnedSites: {},
      tabs: [tab1]
    })

    appStore = {
      getState: () => Immutable.fromJS(defaultState)
    }

    mockery.registerMock('electron', fakeElectron)
    mockery.registerMock('ad-block', fakeAdBlock)
    mockery.registerMock('../../js/stores/appStore', appStore)
    mockery.registerMock('../common/lib/platformUtil', fakePlatformUtil)
    mockery.registerMock('../../js/dispatcher/appDispatcher', fakeAppDispatcher)
    windows = require('../../../../app/browser/windows')
    appActions = require('../../../../js/actions/appActions')
  })

  after(function () {
    mockery.disable()
  })

  // BrowserWindow related hooks
  before(function () {
    browserShowSpy = sinon.spy(FakeWindow.prototype, 'show')
    browserWindowSpy = sinon.spy(fakeElectron, 'BrowserWindow')
    setFullscreenSpy = sinon.spy(FakeWindow.prototype, 'setFullScreen')
    maximizeSpy = sinon.spy(FakeWindow.prototype, 'maximize')
  })

  beforeEach(function () {
    fakeTimers = sinon.useFakeTimers()
  })

  after(function () {
    browserWindowSpy.restore()
    browserShowSpy.restore()
    setFullscreenSpy.restore()
    maximizeSpy.restore()
  })

  afterEach(function () {
    fakeTimers.restore()
    browserWindowSpy.reset()
    browserShowSpy.reset()
    setFullscreenSpy.reset()
    maximizeSpy.reset()
  })

  describe('privateMethods', function () {
    let updatePinnedTabs
    let createTabRequestedSpy, tabCloseRequestedSpy

    const win = {
      id: 1,
      webContents: {
        browserWindowOptions: {
          disposition: ''
        }
      },
      isDestroyed: () => false
    }

    before(function () {
      const methods = windows.privateMethods()
      updatePinnedTabs = methods.updatePinnedTabs
    })
    beforeEach(function () {
      createTabRequestedSpy = sinon.spy(appActions, 'createTabRequested')
      tabCloseRequestedSpy = sinon.spy(appActions, 'tabCloseRequested')
    })
    afterEach(function () {
      createTabRequestedSpy.restore()
      tabCloseRequestedSpy.restore()
      appStore.getState = () => Immutable.fromJS(defaultState)
    })

    describe('updatePinnedTabs', function () {
      it('takes no action if pinnedSites list matches tab state', function () {
        updatePinnedTabs(win, defaultState)
        assert.equal(createTabRequestedSpy.calledOnce, false)
        assert.equal(tabCloseRequestedSpy.calledOnce, false)
      })

      it('calls `appActions.createTabRequested` for pinnedSites not in tab state', function () {
        updatePinnedTabs(win, createTabState)
        assert.equal(createTabRequestedSpy.calledOnce, true)
      })

      it('calls `appActions.tabCloseRequested` for items in tab state but not in pinnedSites', function () {
        updatePinnedTabs(win, tabCloseState)
        assert.equal(tabCloseRequestedSpy.calledOnce, true)
      })

      it('does not create duplicate pinnedSites whilst waiting for tabs to be created', function () {
        // use a unique state for this test since updatePinnedTabs memoizes itself based on its input
        const createTabStateClone = Immutable.fromJS(createTabState.toJS())
        // should ask for a new tab
        updatePinnedTabs(win, createTabStateClone)
        assert.equal(createTabRequestedSpy.callCount, 1)
        // should not ask for a new tab
        updatePinnedTabs(win, createTabStateClone)
        assert.equal(createTabRequestedSpy.callCount, 1)
      })
    })

    describe('createWindow', function () {
      describe('show window immediately', function () {
        it('creates a window immediately visible, when asked not to hide until render', function () {
          windows.createWindow({ }, null, false, null, Immutable.Map(), false)
          const windowOptions = browserWindowSpy.args[0][0]
          assert.equal(browserWindowSpy.callCount, 1)
          // BrowserWindow ctor options.show is true by default
          // so make sure we're not passing in false
          assert.isNotFalse(windowOptions.show)
        })
        it('maximizes the window, when specified', function () {
          windows.createWindow({ }, null, true, null, Immutable.Map(), false)
          // check if window is made fullscreen
          assert.propertyVal(maximizeSpy, 'callCount', 1)
        })
      })

      describe('hide window until render', function () {
        it('creates a window hidden at first', function () {
          windows.createWindow({ }, null, false, null, Immutable.Map(), true)
          fakeTimers.tick(windowCreateTimeout)
          assert.equal(browserWindowSpy.callCount, 1)
          const windowOptions = browserWindowSpy.args[0][0]
          assert.isFalse(windowOptions.show)
        })

        it('shows the window after a timeout', function () {
          windows.createWindow({ }, null, false, null, Immutable.Map(), true)
          assert.equal(browserWindowSpy.callCount, 1)
          assert.equal(browserShowSpy.callCount, 0)
          fakeTimers.tick(windowCreateTimeout)
          assert.equal(browserShowSpy.callCount, 1)
        })

        it('replicates macOS functionality by creating a fullscreen window from a parent fullscreen window', function () {
          const parentWindow = new FakeWindow()
          parentWindow.isFullScreen = () => true
          windows.createWindow({ }, parentWindow, false, null, Immutable.Map(), true)
          // allow the window to be created after timeout
          const windowOptions = browserWindowSpy.args[0][0]
          // should not ask OS to go fullscreen when window isn't shown yet
          assert.isNotTrue(windowOptions.fullscreen)
          assert.equal(browserWindowSpy.callCount, 1)
          // should store that the window should go fullscreen when rendered
          assert.isObject(browserWindowSpy.returnValues[0])
          assert.propertyVal(browserWindowSpy.returnValues[0], '__shouldFullscreen', true)
        })
      })
    })

    describe('windowRendered', function () {
      it('shows the window if it is not visible', function () {
        // create a window that is set to show on render
        const win = windows.createWindow({ }, null, false, null, Immutable.Map(), true)
        assert.equal(browserWindowSpy.callCount, 1)
        // make sure window has not been shown
        const windowOptions = browserWindowSpy.args[0][0]
        assert.isFalse(windowOptions.show)
        assert.equal(browserShowSpy.callCount, 0)
        // a little time elapsed, but not enough to timeout window showing
        fakeTimers.tick(Math.floor(windowCreateTimeout / 2))
        // make sure window has not yet been shown
        assert.equal(browserShowSpy.callCount, 0)
        // notify rendered
        windows.windowRendered(win)
        // windowRendered schedules on setImmediate
        fakeTimers.tick(0)
        // check if window is shown
        assert.propertyVal(browserShowSpy, 'callCount', 1)
      })

      it('makes the window fullscreen if specified', function () {
        const parentWindow = new FakeWindow()
        parentWindow.isFullScreen = () => true
        // create a window that is set to show on render
        const win = windows.createWindow({ }, parentWindow, false, null, Immutable.Map(), true)
        assert.equal(browserWindowSpy.callCount, 1)
        // make sure window has not been shown
        const windowOptions = browserWindowSpy.args[0][0]
        assert.isFalse(windowOptions.show)
        assert.equal(browserShowSpy.callCount, 0)
        // a little time elapsed, but not enough to timeout window showing
        fakeTimers.tick(Math.floor(windowCreateTimeout / 2))
        assert.propertyVal(setFullscreenSpy, 'callCount', 0)
        // notify rendered
        windows.windowRendered(win)
        // windowRendered schedules on setImmediate
        // setfullscreen performs action after 100ms timeout
        fakeTimers.tick(100)
        // check if window is made fullscreen
        assert.propertyVal(setFullscreenSpy, 'callCount', 1)
      })

      it('makes the window maximized if specified', function () {
        // create a window that is set to show on render
        const win = windows.createWindow({ }, null, true, null, Immutable.Map(), true)
        assert.equal(browserWindowSpy.callCount, 1)
        // make sure window has not been shown
        const windowOptions = browserWindowSpy.args[0][0]
        assert.isFalse(windowOptions.show)
        assert.equal(browserShowSpy.callCount, 0)
        // a little time elapsed, but not enough to timeout window showing
        fakeTimers.tick(Math.floor(windowCreateTimeout / 2))
        assert.propertyVal(maximizeSpy, 'callCount', 0)
        // notify rendered
        windows.windowRendered(win)
        // windowRendered schedules on setImmediate
        fakeTimers.tick(0)
        // check if window is made fullscreen
        assert.propertyVal(maximizeSpy, 'callCount', 1)
      })
    })

    describe('getWindowForFileAction', function () {
      it('returns a window object', function () {
        const newWindow = windows.getWindowForFileAction(defaultState)
        assert.equal(browserWindowSpy.callCount, 1)
        assert.equal('object', typeof newWindow)
      })

      it('sets fullscreen to false', function () {
        windows.getWindowForFileAction(defaultState)
        const windowOptions = browserWindowSpy.args[0][0]
        assert.isFalse(windowOptions.fullscreen)
      })

      it('does not show window by default', function () {
        windows.getWindowForFileAction(defaultState)
        const windowOptions = browserWindowSpy.args[0][0]
        assert.isFalse(windowOptions.show)
      })
    })
  })
})
