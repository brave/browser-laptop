/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at https://mozilla.org/MPL/2.0/. */

/* global describe, it, before, beforeEach, after */
const mockery = require('mockery')
const Immutable = require('immutable')
const assert = require('assert')
const sinon = require('sinon')
const appActions = require('../../../../../js/actions/appActions')
const appConstants = require('../../../../../js/constants/appConstants')
const messages = require('../../../../../js/constants/messages')
const fakeElectron = require('../../../lib/fakeElectron')

describe('passwordManagerReducer unit tests', function () {
  let passwordManagerReducer
  let fakeWebContents, fakeWebContentsCache
  let showNotificationSpy, hideNotificationSpy
  let neverSavePasswordSpy, savePasswordSpy
  let spyList = []
  let savePasswordParams

  let state = Immutable.fromJS({
  })

  before(function () {
    mockery.enable({
      warnOnReplace: false,
      warnOnUnregistered: false,
      useCleanCache: true
    })
    mockery.registerMock('electron', fakeElectron)
    mockery.registerMock('../../../js/actions/appActions', appActions)
    mockery.registerMock('../../locale', {
      translation: (msg, arg) => {
        return msg
      }
    })
    fakeWebContents = {
      destroyed: false,
      isDestroyed: () => fakeWebContents.destroyed,
      neverSavePassword: () => { if (fakeWebContents.isDestroyed()) throw new Error('OOPS - neverSavePassword') },
      savePassword: () => { if (fakeWebContents.isDestroyed()) throw new Error('OOPS - savePassword') },
      updatePassword: () => { if (fakeWebContents.isDestroyed()) throw new Error('OOPS - updatePassword') },
      noUpdatePassword: () => { if (fakeWebContents.isDestroyed()) throw new Error('OOPS - noUpdatePassword') }
    }
    fakeWebContentsCache = {
      getWebContents: (tabId) => {
        if (tabId === 1) {
          return fakeWebContents
        }
      }
    }
    spyList.push(neverSavePasswordSpy = sinon.spy(fakeWebContents, 'neverSavePassword'))
    spyList.push(savePasswordSpy = sinon.spy(fakeWebContents, 'savePassword'))
    mockery.registerMock('../webContentsCache', fakeWebContentsCache)
    spyList.push(showNotificationSpy = sinon.spy(appActions, 'showNotification'))
    spyList.push(hideNotificationSpy = sinon.spy(appActions, 'hideNotification'))
    passwordManagerReducer = require('../../../../../app/browser/reducers/passwordManagerReducer')
    state = passwordManagerReducer(state, {
      actionType: appConstants.APP_SET_STATE
    })

    savePasswordParams = {
      actionType: appConstants.APP_SAVE_PASSWORD,
      username: 'username',
      origin: 'brave.com',
      tabId: 1
    }
  })

  beforeEach(function () {
    fakeWebContents.destroyed = false
    spyList.forEach((spy) => spy.reset())
  })

  after(function () {
    spyList.forEach((spy) => spy.restore())
    spyList = []
    mockery.deregisterAll()
    mockery.disable()
  })

  describe('savePassword', function () {
    it('does not call showNotification if origin is falsey', function () {
      passwordManagerReducer(state, {
        actionType: appConstants.APP_SAVE_PASSWORD,
        username: 'username',
        origin: undefined,
        tabId: 1
      })
      assert.equal(showNotificationSpy.notCalled, true)
    })

    it('shows the notification', function () {
      passwordManagerReducer(state, savePasswordParams)
      assert.equal(showNotificationSpy.calledOnce, true)
    })

    describe('password callbacks', function () {
      const assertCalled = (spy, buttonIndex, shouldBeCalledOnce) => {
        passwordManagerReducer(state, savePasswordParams)
        fakeElectron.ipcMain.send(messages.NOTIFICATION_RESPONSE, {}, 'notificationPasswordWithUserName', buttonIndex, true)
        assert.equal((shouldBeCalledOnce ? spy.calledOnce : spy.notCalled), true)
      }
      const assertSaveCalled = (buttonIndex, shouldBeCalledOnce) => assertCalled(savePasswordSpy, buttonIndex, shouldBeCalledOnce)
      const assertNeverSaveCalled = (buttonIndex, shouldBeCalledOnce) => assertCalled(neverSavePasswordSpy, buttonIndex, shouldBeCalledOnce)

      it('hides the notification', function () {
        passwordManagerReducer(state, savePasswordParams)
        fakeElectron.ipcMain.send(messages.NOTIFICATION_RESPONSE, {}, 'notificationPasswordWithUserName', 0, true)
        assert.equal(hideNotificationSpy.withArgs('notificationPasswordWithUserName').calledOnce, true)
      })
      it('removes the entry from passwordCallbacks', function () {
        passwordManagerReducer(state, savePasswordParams)
        fakeElectron.ipcMain.send(messages.NOTIFICATION_RESPONSE, {}, 'notificationPasswordWithUserName', 0, true)
        fakeElectron.ipcMain.send(messages.NOTIFICATION_RESPONSE, {}, 'notificationPasswordWithUserName', 0, true)
        assert.equal(hideNotificationSpy.withArgs('notificationPasswordWithUserName').calledOnce, true)
      })
      it('does not throw an exception when webContents is null/undefined', function () {
        passwordManagerReducer(state, {
          actionType: appConstants.APP_SAVE_PASSWORD,
          username: 'username',
          origin: 'brave.com',
          tabId: 2
        })
        fakeElectron.ipcMain.send(messages.NOTIFICATION_RESPONSE, {}, 'notificationPasswordWithUserName', 0, true)
      })
      it('does not throw an exception when webContents is destroyed', function () {
        fakeWebContents.destroyed = true
        passwordManagerReducer(state, savePasswordParams)
        fakeElectron.ipcMain.send(messages.NOTIFICATION_RESPONSE, {}, 'notificationPasswordWithUserName', 0, true)
      })

      describe('when buttonIndex is 0', function () {
        it('calls webContents.savePassword', function () {
          assertSaveCalled(0, true)
        })
        it('does not call webContents.neverSavePassword', function () {
          assertNeverSaveCalled(0, false)
        })
      })

      describe('when buttonIndex is 1', function () {
        it('does not call webContents.neverSavePassword', function () {
          assertNeverSaveCalled(1, false)
        })
        it('does not call webContents.savePassword', function () {
          assertSaveCalled(1, false)
        })
      })

      describe('when buttonIndex is 2', function () {
        it('calls webContents.neverSavePassword', function () {
          assertNeverSaveCalled(2, true)
        })
        it('does not call webContents.savePassword', function () {
          assertSaveCalled(2, false)
        })
      })
    })
  })
})
