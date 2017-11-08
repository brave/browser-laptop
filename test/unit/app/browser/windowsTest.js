/* global describe, it, before, beforeEach, after, afterEach */
const mockery = require('mockery')
const sinon = require('sinon')
const Immutable = require('immutable')
const assert = require('assert')
const fakeElectron = require('../../lib/fakeElectron')
const fakeAdBlock = require('../../lib/fakeAdBlock')

require('../../braveUnit')

describe('window API unit tests', function () {
  let windows, appActions
  let appStore
  let defaultState, createTabState, tabCloseState

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

    windows = require('../../../../app/browser/windows')
    appActions = require('../../../../js/actions/appActions')
  })

  after(function () {
    mockery.disable()
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
        updatePinnedTabs(win)
        assert.equal(createTabRequestedSpy.calledOnce, false)
        assert.equal(tabCloseRequestedSpy.calledOnce, false)
      })

      it('calls `appActions.createTabRequested` for pinnedSites not in tab state', function () {
        appStore.getState = () => Immutable.fromJS(createTabState)
        updatePinnedTabs(win)
        assert.equal(createTabRequestedSpy.calledOnce, true)
      })

      it('calls `appActions.tabCloseRequested` for items in tab state but not in pinnedSites', function () {
        appStore.getState = () => Immutable.fromJS(tabCloseState)
        updatePinnedTabs(win)
        assert.equal(tabCloseRequestedSpy.calledOnce, true)
      })
    })
  })
})
