/* global describe, before, after, beforeEach, afterEach, it */
const mockery = require('mockery')
const sinon = require('sinon')
const assert = require('assert')
const Immutable = require('immutable')
let tabMessageBox, appActions, tabMessageBoxShownStub
require('../../braveUnit')

const exampleCallback = (result, text, suppress) => {}
const exampleTabId = 1

const defaultAppState = Immutable.fromJS({
  windows: [{
    windowId: 1,
    windowUUID: 'uuid'
  }],
  tabs: []
})

const exampleMessageBox = Immutable.fromJS({
  message: 'example message',
  title: 'example title',
  buttons: ['OK'],
  suppress: false,
  showSuppress: false
})

const fakeMessageBoxState = {
  getDetail: (state, tabId) => {},
  removeDetail: (state, action) => {}
}

describe('tabMessageBox unit tests', function () {
  before(function () {
    mockery.enable({
      warnOnReplace: false,
      warnOnUnregistered: false,
      useCleanCache: true
    })

    const fakeLocale = {
      translation: (token) => { return token }
    }

    mockery.registerMock('electron', require('../../lib/fakeElectron'))
    mockery.registerMock('../common/state/tabMessageBoxState', fakeMessageBoxState)
    mockery.registerMock('../../../js/l10n', fakeLocale)
    tabMessageBox = require('../../../../app/browser/tabMessageBox')
    appActions = require('../../../../js/actions/appActions')

    tabMessageBoxShownStub = sinon.stub(appActions, 'tabMessageBoxShown')
  })

  after(function () {
    mockery.disable()
    tabMessageBoxShownStub.restore()
  })

  describe('show', function () {
    let callCount

    before(function () {
      callCount = tabMessageBoxShownStub.withArgs(exampleTabId, exampleMessageBox).callCount
      tabMessageBox.show(exampleTabId, exampleMessageBox, exampleCallback)
    })

    it('registers a callback', function () {
      const callbacks = tabMessageBox.getCallbacks()
      assert(callbacks[exampleTabId] && callbacks[exampleTabId] === exampleCallback)
    })

    it('calls appActions.tabMessageBoxShown', function () {
      assert.equal(tabMessageBoxShownStub.withArgs(exampleTabId, exampleMessageBox).callCount, callCount + 1)
    })
  })

  describe('close', function () {
    let removeSpy
    let callbackSpy
    let newAppState
    let action

    beforeEach(function () {
      newAppState = defaultAppState.setIn(['messageBoxDetail', exampleTabId], exampleMessageBox)
      action = Immutable.fromJS({
        tabId: exampleTabId,
        detail: exampleMessageBox
      })
      removeSpy = sinon.spy(fakeMessageBoxState, 'removeDetail')
      callbackSpy = sinon.spy()
      tabMessageBox.show(exampleTabId, {}, callbackSpy)
    })

    afterEach(function () {
      removeSpy.restore()
    })

    it('calls `tabMessageBoxState.removeDetail` to remove the detail record', function () {
      tabMessageBox.close(newAppState, action)
      assert.equal(removeSpy.withArgs(newAppState, action).calledOnce, true)
    })

    describe('when calling the callback', function () {
      it('defaults `result` to true and `suppress` to false', function () {
        tabMessageBox.close(newAppState, action)
        assert.equal(callbackSpy.withArgs(true, '', false).calledOnce, true)
      })

      it('reads `result` from detail object', function () {
        action = action.setIn(['detail', 'result'], false)
        action = action.setIn(['detail', 'suppress'], false)
        tabMessageBox.close(newAppState, action)
        assert.equal(callbackSpy.withArgs(false, '', false).calledOnce, true)
      })

      it('reads `suppress` from detail object', function () {
        action = action.setIn(['detail', 'suppress'], true)
        action = action.setIn(['detail', 'result'], true)
        tabMessageBox.close(newAppState, action)
        assert.equal(callbackSpy.withArgs(true, '', true).calledOnce, true)
      })

      describe('when detail is falsey', function () {
        it('defaults `result` to false and `suppress` to false', function () {
          action = Immutable.fromJS({tabId: exampleTabId})
          tabMessageBox.close(newAppState, action)
          assert.equal(callbackSpy.withArgs(false, '', false).calledOnce, true)
        })
      })
    })

    it('unregisters the callback', function () {
      tabMessageBox.close(newAppState, action)
      const callbacks = tabMessageBox.getCallbacks()
      assert.equal(callbacks[exampleTabId], undefined)
    })
  })

  describe('onTabUpdated', function () {
    let removeSpy
    let getDetailStub
    let callbackSpy
    let newAppState
    let action

    beforeEach(function () {
      const exampleMessageBox2 = exampleMessageBox.set('opener', 'https://twitter.com/brave')
      newAppState = defaultAppState.setIn(['messageBoxDetail', exampleTabId], exampleMessageBox2)
      action = Immutable.fromJS({
        actionType: 'app-tab-updated',
        tabValue: {
          audible: false,
          active: true,
          autoDiscardable: false,
          windowId: 2,
          incognito: false,
          canGoForward: false,
          url: 'https://twitter.com/brave',
          tabId: exampleTabId,
          index: 0,
          status: 'complete',
          highlighted: true,
          title: 'Brave Software (@brave) | Twitter',
          pinned: false,
          id: exampleTabId,
          selected: true,
          discarded: false,
          canGoBack: true
        }
      })
      getDetailStub = sinon.stub(fakeMessageBoxState, 'getDetail').returns(exampleMessageBox2)
      removeSpy = sinon.spy(fakeMessageBoxState, 'removeDetail')
      callbackSpy = sinon.spy()
      tabMessageBox.show(exampleTabId, {}, callbackSpy)
    })

    afterEach(function () {
      getDetailStub.restore()
      removeSpy.restore()
    })

    it('calls `tabMessageBoxState.getDetail` to get the detail record', function () {
      tabMessageBox.onTabUpdated(newAppState, action)
      assert.equal(getDetailStub.withArgs(newAppState, exampleTabId).calledOnce, true)
    })

    describe('when tab url matches `opener` in detail object', function () {
      it('does NOT call `tabMessageBoxState.removeDetail`', function () {
        tabMessageBox.onTabUpdated(newAppState, action)
        assert.equal(removeSpy.called, false)
      })

      it('does NOT call the callback', function () {
        tabMessageBox.onTabUpdated(newAppState, action)
        assert.equal(callbackSpy.called, false)
      })

      it('does NOT unregister the callback', function () {
        tabMessageBox.onTabUpdated(newAppState, action)
        const callbacks = tabMessageBox.getCallbacks()
        assert.equal(callbacks[exampleTabId], callbackSpy)
      })
    })

    describe('when tab url does not match `opener` in detail object', function () {
      beforeEach(function () {
        const exampleMessageBox2 = exampleMessageBox.set('opener', 'https://brave.com')
        newAppState = defaultAppState.setIn(['messageBoxDetail', exampleTabId], exampleMessageBox2)
        // redo stub to return new opener
        getDetailStub.restore()
        getDetailStub = sinon.stub(fakeMessageBoxState, 'getDetail').returns(exampleMessageBox2)
      })

      it('calls `tabMessageBoxState.removeDetail` to remove the detail record', function () {
        const removeAction = Immutable.fromJS({tabId: exampleTabId})
        tabMessageBox.onTabUpdated(newAppState, action)
        assert.equal(removeSpy.withArgs(newAppState, removeAction).calledOnce, true)
      })

      it('calls the callback with default params (false, \'\', false)', function () {
        tabMessageBox.onTabUpdated(newAppState, action)
        assert.equal(callbackSpy.withArgs(false, '', false).calledOnce, true)
      })

      it('unregisters the callback', function () {
        tabMessageBox.onTabUpdated(newAppState, action)
        const callbacks = tabMessageBox.getCallbacks()
        assert.equal(callbacks[exampleTabId], undefined)
      })
    })
  })

  describe('onWindowPrompt', () => {
    const tabId = '123'
    const webContents = {
      getId: () => tabId
    }
    const extraData = undefined
    const title = 'some title'
    const message = 'some message'
    const defaultPromptText = 'some prompt text'
    const shouldDisplaySuppressCheckbox = true
    const isBeforeUnloadDialog = undefined
    const isReload = undefined
    const muonCb = 'muonCb'

    it('calls tabMessageBox.show', () => {
      const mockShow = sinon.stub()
      const expectecDetail = {
        message,
        title,
        buttons: ['MESSAGEBOXOK', 'MESSAGEBOXCANCEL'],
        cancelId: 1,
        suppress: false,
        allowInput: true,
        defaultPromptText,
        showSuppress: shouldDisplaySuppressCheckbox
      }

      tabMessageBox.onWindowPrompt(mockShow)(
        webContents,
        extraData,
        title,
        message,
        defaultPromptText,
        shouldDisplaySuppressCheckbox,
        isBeforeUnloadDialog,
        isReload,
        muonCb
      )

      assert.equal(mockShow.withArgs(tabId, expectecDetail, muonCb).calledOnce, true)
    })
  })
})
