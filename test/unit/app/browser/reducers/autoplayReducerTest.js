/* global describe, it, before, after */
const mockery = require('mockery')
const sinon = require('sinon')
const Immutable = require('immutable')
const assert = require('assert')
const fakeElectron = require('../../../lib/fakeElectron')

const appConstants = require('../../../../../js/constants/appConstants')
const messages = require('../../../../../js/constants/messages')
const settings = require('../../../../../js/constants/settings')
const {autoplayOption} = require('../../../../../app/common/constants/settingsEnums')
require('../../../braveUnit')

describe('autoplayReducer unit tests', function () {
  let autoplayReducer
  let fakeWebContents, fakeAppActions, fakeLocale, fakeSettings
  let showNotificationSpy, hideNotificationSpy, translationSpy,
    removeListenerSpy, changeSiteSettingSpy, removeSiteSettingSpy, getSettingSpy
  let autoplayMedia = autoplayOption.ALWAYS_ASK
  const tabId = 123
  const url = 'https://www.brave.com/niceplay'
  const origin = 'https://www.brave.com'
  const message = `Allow ${origin} to autoplay media?`
  const showNotificationArg = {
    buttons: [
      {text: 'Deny'},
      {text: 'Allow'}
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
          case 'allow':
            retMsg += 'Allow'
            break
          case 'deny':
            retMsg += 'Deny'
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

    fakeSettings = {
      getSetting: (settingKey, settingsCollection) => {
        switch (settingKey) {
          case settings.AUTOPLAY_MEDIA:
            return autoplayMedia
        }
      }
    }

    showNotificationSpy = sinon.spy(fakeAppActions, 'showNotification')
    hideNotificationSpy = sinon.spy(fakeAppActions, 'hideNotification')
    translationSpy = sinon.spy(fakeLocale, 'translation')
    removeListenerSpy = sinon.spy(fakeElectron.ipcMain, 'removeListener')
    changeSiteSettingSpy = sinon.spy(fakeAppActions, 'changeSiteSetting')
    removeSiteSettingSpy = sinon.spy(fakeAppActions, 'removeSiteSetting')
    getSettingSpy = sinon.spy(fakeSettings, 'getSetting')

    mockery.registerMock('electron', fakeElectron)
    mockery.registerMock('../../../js/actions/appActions', fakeAppActions)
    mockery.registerMock('../../locale', fakeLocale)
    mockery.registerMock('../../../js/settings', fakeSettings)

    autoplayReducer = require('../../../../../app/browser/reducers/autoplayReducer')
  })

  after(function () {
    showNotificationSpy.restore()
    hideNotificationSpy.restore()
    translationSpy.restore()
    removeListenerSpy.restore()
    changeSiteSettingSpy.restore()
    removeSiteSettingSpy.restore()
    getSettingSpy.restore()
    mockery.deregisterAll()
    mockery.disable()
  })

  describe('Allow autoplay once', function () {
    before(function () {
      autoplayMedia = autoplayOption.ALWAYS_ASK
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
      assert(translationSpy.withArgs('allow').called)
      assert(translationSpy.withArgs('deny').called)
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

  describe('Allow autoplay and remember', function () {
    before(function () {
      autoplayMedia = autoplayOption.ALWAYS_ASK
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
      assert(translationSpy.withArgs('allow').called)
      assert(translationSpy.withArgs('deny').called)
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
      autoplayMedia = autoplayOption.ALWAYS_ASK
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
      assert(translationSpy.withArgs('allow').called)
      assert(translationSpy.withArgs('deny').called)
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
      autoplayMedia = autoplayOption.ALWAYS_ASK
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
      assert(translationSpy.withArgs('allow').called)
      assert(translationSpy.withArgs('deny').called)
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

  describe('Always deny', function () {
    before(function () {
      translationSpy.reset()
      showNotificationSpy.reset()
      autoplayMedia = autoplayOption.ALWAYS_DENY
      autoplayReducer(Immutable.fromJS({
        siteSettings: {}
      }), Immutable.fromJS({
        actionType: appConstants.APP_AUTOPLAY_BLOCKED,
        tabId: tabId
      }))
    })

    it('no calls local.translation', function () {
      assert(translationSpy.notCalled)
    })

    it('no calls appActions.showNotification', function () {
      assert(showNotificationSpy.withArgs(showNotificationArg).notCalled)
    })
  })

  describe('Calling with exsting deny rules', function () {
    before(function () {
      autoplayMedia = autoplayOption.ALWAYS_ASK
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

  describe('APP_MEDIA_STARTED_PLAYING', function () {
    describe('without NOTIFICATION_RESPONSE', function () {
      before(function () {
        autoplayMedia = autoplayOption.ALWAYS_ASK
        autoplayReducer(Immutable.fromJS({
          siteSettings: {}
        }), Immutable.fromJS({
          actionType: appConstants.APP_AUTOPLAY_BLOCKED,
          tabId: tabId
        }))
        autoplayReducer(Immutable.Map(), Immutable.fromJS({
          actionType: appConstants.APP_MEDIA_STARTED_PLAYING,
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

      it('calls appActions.changeSiteSetting', function () {
        assert(changeSiteSettingSpy.withArgs(origin, 'autoplay', true).called)
      })
    })

    describe('with NOTIFICATION_RESPONSE', function () {
      before(function () {
        autoplayMedia = autoplayOption.ALWAYS_ASK
        autoplayReducer(Immutable.fromJS({
          siteSettings: {}
        }), Immutable.fromJS({
          actionType: appConstants.APP_AUTOPLAY_BLOCKED,
          tabId: tabId
        }))
        fakeElectron.ipcMain.send(messages.NOTIFICATION_RESPONSE, {}, message, 1, true)
        removeListenerSpy.reset()
        changeSiteSettingSpy.reset()
        autoplayReducer(Immutable.Map(), Immutable.fromJS({
          actionType: appConstants.APP_MEDIA_STARTED_PLAYING,
          tabId: tabId
        }))
      })

      it('calls local.translation', function () {
        assert(translationSpy.withArgs('allowAutoplay', {origin}).called)
      })

      it('calls appActions.hideNotification', function () {
        assert(hideNotificationSpy.withArgs(message).called)
      })

      it('no calls ipcMain.removeListener', function () {
        assert(removeListenerSpy.notCalled)
      })

      it('no calls appActions.changeSiteSetting', function () {
        assert(changeSiteSettingSpy.notCalled)
      })
    })
  })

  describe('APP_TAB_CLOSED', function () {
    before(function () {
      autoplayMedia = autoplayOption.ALWAYS_ASK
      autoplayReducer(Immutable.fromJS({
        siteSettings: {}
      }), Immutable.fromJS({
        actionType: appConstants.APP_AUTOPLAY_BLOCKED,
        tabId: tabId
      }))
      fakeElectron.ipcMain.send(messages.NOTIFICATION_RESPONSE, {}, message, 1, false)
      autoplayReducer(Immutable.Map(), Immutable.fromJS({
        actionType: appConstants.APP_TAB_CLOSED,
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

    it('calls appActions.removeSiteSetting', function () {
      assert(removeSiteSettingSpy.withArgs(origin, 'autoplay').called)
    })
  })

  describe('APP_SHUTTING_DOWN', function () {
    before(function () {
      autoplayMedia = autoplayOption.ALWAYS_ASK
      autoplayReducer(Immutable.fromJS({
        siteSettings: {}
      }), Immutable.fromJS({
        actionType: appConstants.APP_AUTOPLAY_BLOCKED,
        tabId: tabId
      }))
      fakeElectron.ipcMain.send(messages.NOTIFICATION_RESPONSE, {}, message, 1, false)
      autoplayReducer(Immutable.Map(), Immutable.fromJS({
        actionType: appConstants.APP_SHUTTING_DOWN
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

    it('calls appActions.removeSiteSetting', function () {
      assert(removeSiteSettingSpy.withArgs(origin, 'autoplay').called)
    })
  })
})
