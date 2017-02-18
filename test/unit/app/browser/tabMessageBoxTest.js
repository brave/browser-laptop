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

const fakeWebContents = {
  on: (eventName) => {}
}

const fakeMessageBoxState = {
  removeDetail: (state, action) => {}
}

describe('tabMessageBox unit tests', function () {
  before(function () {
    mockery.enable({
      warnOnReplace: false,
      warnOnUnregistered: false,
      useCleanCache: true
    })

    mockery.registerMock('electron', require('../../lib/fakeElectron'))
    mockery.registerMock('../common/state/tabMessageBoxState', fakeMessageBoxState)
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
    let webContentsSpy

    before(function () {
      webContentsSpy = sinon.spy(fakeWebContents, 'on')
      callCount = tabMessageBoxShownStub.withArgs(exampleTabId, exampleMessageBox).callCount
      tabMessageBox.show(fakeWebContents, exampleTabId, exampleMessageBox, exampleCallback)
    })

    after(function () {
      webContentsSpy.restore()
    })

    it('registers a callback', function () {
      const callbacks = tabMessageBox.getCallbacks()
      assert(callbacks[exampleTabId] && callbacks[exampleTabId] === exampleCallback)
    })

    it('calls sets handler for webContents.destroyed', function () {
      assert.equal(webContentsSpy.withArgs('destroyed').calledOnce, true)
    })

    it('calls sets handler for webContents.crashed', function () {
      assert.equal(webContentsSpy.withArgs('crashed').calledOnce, true)
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
      tabMessageBox.show(fakeWebContents, exampleTabId, {}, callbackSpy)
    })

    afterEach(function () {
      removeSpy.restore()
    })

    it('calls removes the detail record', function () {
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
})
