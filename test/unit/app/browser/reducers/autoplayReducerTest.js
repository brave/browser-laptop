/* global describe, it, before, after */
const mockery = require('mockery')
const sinon = require('sinon')
const Immutable = require('immutable')
const assert = require('assert')
const fakeElectron = require('../../../lib/fakeElectron')

const appConstants = require('../../../../../js/constants/appConstants')
const messages = require('../../../../../js/constants/messages')
require('../../../braveUnit')

describe('autoplayReducer unit tests', function () {
  let autoplayReducer
  let fakeWebContents, fakeAppActions, fakeLocale
  let showNotificationSpy, hideNotificationSpy, translationSpy,
    removeListenerSpy, changeSiteSettingSpy, removeSiteSettingSpy
  const tabId = 123
  const url = 'https://www.brave.com/niceplay'
  const origin = 'https://www.brave.com'
  const message = `Allow ${origin} to autoplay media?`
  const showNotificationArg = {
    buttons: [
      {text: 'Yes'},
      {text: 'No'}
    ],
    message,
    frameOrigin: origin,
    options: {
      persist: true
    }
  }

  before(function () {
    mockery.enable({
      warnOnReplace: false,
      warnOnUnregistered: false,
      useCleanCache: true
    })

    fakeWebContents = {
      isDestroyed: () => false,
      reload: () => {},
      on: (e, cb) => { cb(e) },
      removeListener: (e, cb) => {},
      getURL: () => {
        return url
      }
    }

    fakeAppActions = {
      showNotification: (arg) => {},
      hideNotification: (msg) => {},
      changeSiteSetting: (hostPattern, key, value) => {},
      removeSiteSetting: (hostPattern, key) => {}
    }

    fakeLocale = {
      translation: (msg, arg) => {
        let retMsg = ''
        switch (msg) {
          case 'yes':
            retMsg += 'Yes'
            break
          case 'no':
            retMsg += 'No'
            break
          case 'allowAutoplay':
            retMsg += `Allow ${arg.origin} to autoplay media?`
            break
        }
        return retMsg
      }
    }

    fakeElectron.webContents = {
      fromTabID: (tabId) => {
        return fakeWebContents
      }
    }

    showNotificationSpy = sinon.spy(fakeAppActions, 'showNotification')
    hideNotificationSpy = sinon.spy(fakeAppActions, 'hideNotification')
    translationSpy = sinon.spy(fakeLocale, 'translation')
    removeListenerSpy = sinon.spy(fakeElectron.ipcMain, 'removeListener')
    changeSiteSettingSpy = sinon.spy(fakeAppActions, 'changeSiteSetting')
    removeSiteSettingSpy = sinon.spy(fakeAppActions, 'removeSiteSetting')

    mockery.registerMock('electron', fakeElectron)
    mockery.registerMock('../../../js/actions/appActions', fakeAppActions)
    mockery.registerMock('../../locale', fakeLocale)

    autoplayReducer = require('../../../../../app/browser/reducers/autoplayReducer')
  })

  after(function () {
    showNotificationSpy.restore()
    hideNotificationSpy.restore()
    translationSpy.restore()
    removeListenerSpy.restore()
    changeSiteSettingSpy.restore()
    removeSiteSettingSpy.restore()
    mockery.deregisterAll()
    mockery.disable()
  })

  describe('Allow autoplay once', function () {
    before(function () {
      autoplayReducer(Immutable.fromJS({
        siteSettings: {}
      }), Immutable.fromJS({
        actionType: appConstants.APP_AUTOPLAY_BLOCKED,
        tabId: tabId
      }))
      fakeElectron.ipcMain.send(messages.NOTIFICATION_RESPONSE, {}, message, 0, false)
    })

    it('calls local.translation', function () {
      assert(translationSpy.withArgs('allowAutoplay', {origin}).called)
      assert(translationSpy.withArgs('yes').called)
      assert(translationSpy.withArgs('no').called)
    })

    it('calls appActions.showNotification', function () {
      assert(showNotificationSpy.withArgs(showNotificationArg).called)
    })

    it('calls appActions.hideNotification', function () {
      assert(hideNotificationSpy.withArgs(message).called)
    })

    it('calls appActions.changeSiteSetting', function () {
      assert(changeSiteSettingSpy.withArgs(origin, 'autoplay', true).called)
    })

    it('calls appActions.removeSiteSetting', function () {
      assert(removeSiteSettingSpy.withArgs(origin, 'autoplay').called)
    })

    it('calls ipcMain.removeListener', function () {
      assert(removeListenerSpy.called)
    })
  })

  describe('Allow autoplay and remember', function () {
    before(function () {
      autoplayReducer(Immutable.fromJS({
        siteSettings: {}
      }), Immutable.fromJS({
        actionType: appConstants.APP_AUTOPLAY_BLOCKED,
        tabId: tabId
      }))
      fakeElectron.ipcMain.send(messages.NOTIFICATION_RESPONSE, {}, message, 0, true)
    })

    it('calls local.translation', function () {
      assert(translationSpy.withArgs('allowAutoplay', {origin}).called)
      assert(translationSpy.withArgs('yes').called)
      assert(translationSpy.withArgs('no').called)
    })

    it('calls appActions.showNotification', function () {
      assert(showNotificationSpy.withArgs(showNotificationArg).called)
    })

    it('calls appActions.hideNotification', function () {
      assert(hideNotificationSpy.withArgs(message).called)
    })

    it('calls appActions.changeSiteSetting', function () {
      assert(changeSiteSettingSpy.withArgs(origin, 'autoplay', true).called)
    })

    it('calls ipcMain.removeListener', function () {
      assert(removeListenerSpy.called)
    })
  })

  describe('Deny autoplay once', function () {
    before(function () {
      autoplayReducer(Immutable.fromJS({
        siteSettings: {}
      }), Immutable.fromJS({
        actionType: appConstants.APP_AUTOPLAY_BLOCKED,
        tabId: tabId
      }))
      fakeElectron.ipcMain.send(messages.NOTIFICATION_RESPONSE, {}, message, 1, false)
    })

    it('calls local.translation', function () {
      assert(translationSpy.withArgs('allowAutoplay', {origin}).called)
      assert(translationSpy.withArgs('yes').called)
      assert(translationSpy.withArgs('no').called)
    })

    it('calls appActions.showNotification', function () {
      assert(showNotificationSpy.withArgs(showNotificationArg).called)
    })

    it('calls appActions.hideNotification', function () {
      assert(hideNotificationSpy.withArgs(message).called)
    })

    it('calls ipcMain.removeListener', function () {
      assert(removeListenerSpy.called)
    })
  })

  describe('Deny autoplay and remember', function () {
    before(function () {
      autoplayReducer(Immutable.fromJS({
        siteSettings: {}
      }), Immutable.fromJS({
        actionType: appConstants.APP_AUTOPLAY_BLOCKED,
        tabId: tabId
      }))
      fakeElectron.ipcMain.send(messages.NOTIFICATION_RESPONSE, {}, message, 1, true)
    })

    it('calls local.translation', function () {
      assert(translationSpy.withArgs('allowAutoplay', {origin}).called)
      assert(translationSpy.withArgs('yes').called)
      assert(translationSpy.withArgs('no').called)
    })

    it('calls appActions.showNotification', function () {
      assert(showNotificationSpy.withArgs(showNotificationArg).called)
    })

    it('calls appActions.hideNotification', function () {
      assert(hideNotificationSpy.withArgs(message).called)
    })

    it('calls appActions.changeSiteSetting', function () {
      assert(changeSiteSettingSpy.withArgs(origin, 'autoplay', false).called)
    })

    it('calls ipcMain.removeListener', function () {
      assert(removeListenerSpy.called)
    })
  })

  describe('Calling with exsting deny rules', function () {
    before(function () {
      showNotificationSpy.reset()
      autoplayReducer(Immutable.fromJS({
        siteSettings: {
          'https://www.brave.com': {
            autoplay: false
          }
        }
      }), Immutable.fromJS({
        actionType: appConstants.APP_AUTOPLAY_BLOCKED,
        tabId: tabId
      }))
      autoplayReducer(Immutable.Map(), Immutable.fromJS({
        actionType: appConstants.APP_AUTOPLAY_DISMISSED,
        tabId: tabId
      }))

      it('never calls appActions.showNotification', function () {
        assert(showNotificationSpy.neverCalledWith(showNotificationArg))
      })
    })
  })

  describe('APP_AUTOPLAY_DISMISSED', function () {
    before(function () {
      autoplayReducer(Immutable.fromJS({
        siteSettings: {}
      }), Immutable.fromJS({
        actionType: appConstants.APP_AUTOPLAY_BLOCKED,
        tabId: tabId
      }))
      autoplayReducer(Immutable.Map(), Immutable.fromJS({
        actionType: appConstants.APP_AUTOPLAY_DISMISSED,
        tabId: tabId
      }))
    })

    it('calls local.translation', function () {
      assert(translationSpy.withArgs('allowAutoplay', {origin}).called)
    })

    it('calls appActions.hideNotification', function () {
      assert(hideNotificationSpy.withArgs(message).called)
    })

    it('calls ipcMain.removeListener', function () {
      assert(removeListenerSpy.called)
    })
  })
})
