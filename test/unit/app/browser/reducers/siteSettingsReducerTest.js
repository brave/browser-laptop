/* global describe, it, before, beforeEach, after */
const mockery = require('mockery')
const sinon = require('sinon')
const Immutable = require('immutable')
const assert = require('assert')
const fakeElectron = require('../../../lib/fakeElectron')

const appConstants = require('../../../../../js/constants/appConstants')
require('../../../braveUnit')

describe('siteSettingsReducer unit tests', function () {
  let siteSettingsReducer
  let siteSettings
  let clock
  let fakeAppState
  let mergeSiteSettingSpy
  let removeSiteSettingSpy

  before(function () {
    mockery.enable({
      warnOnReplace: false,
      warnOnUnregistered: false,
      useCleanCache: true
    })

    clock = sinon.useFakeTimers()
    fakeAppState = Immutable.fromJS({
      siteSettings: {
        'https://example.com': {
          regularTabSetting: ''
        }
      },
      temporarySiteSettings: {
        'https://example.com': {
          privateTabSetting: ''
        }
      }
    })

    mockery.registerMock('electron', fakeElectron)
    siteSettings = require('../../../../../js/state/siteSettings')
    mockery.registerMock('../../../js/state/siteSettings', siteSettings)

    mergeSiteSettingSpy = sinon.spy(siteSettings, 'mergeSiteSetting')
    removeSiteSettingSpy = sinon.spy(siteSettings, 'removeSiteSetting')

    siteSettingsReducer = require('../../../../../app/browser/reducers/siteSettingsReducer')
  })

  after(function () {
    clock.restore()
    mergeSiteSettingSpy.restore()
    mockery.disable()
  })

  describe('APP_ALLOW_FLASH_ONCE', function () {
    beforeEach(function () {
      mergeSiteSettingSpy.reset()
    })
    it('merges setting into siteSettings if regular tab', function () {
      siteSettingsReducer(fakeAppState, Immutable.fromJS({
        actionType: appConstants.APP_ALLOW_FLASH_ONCE,
        isPrivate: false,
        url: 'https://example.com/test/page.html'
      }))
      assert(mergeSiteSettingSpy.withArgs(
        fakeAppState.get('siteSettings'),
        'https://example.com',
        'flash',
        1).calledOnce)
    })
    it('merges setting into temporarySiteSettings if private tab', function () {
      siteSettingsReducer(fakeAppState, Immutable.fromJS({
        actionType: appConstants.APP_ALLOW_FLASH_ONCE,
        isPrivate: true,
        url: 'https://example.com/test/page.html'
      }))
      assert(mergeSiteSettingSpy.withArgs(
        fakeAppState.get('temporarySiteSettings'),
        'https://example.com',
        'flash',
        1).calledOnce)
    })
  })

  describe('APP_ALLOW_FLASH_ALWAYS', function () {
    beforeEach(function () {
      mergeSiteSettingSpy.reset()
    })
    it('merges setting into siteSettings if regular tab', function () {
      siteSettingsReducer(fakeAppState, Immutable.fromJS({
        actionType: appConstants.APP_ALLOW_FLASH_ALWAYS,
        isPrivate: false,
        url: 'https://example.com/test/page.html'
      }))
      assert(mergeSiteSettingSpy.withArgs(
        fakeAppState.get('siteSettings'),
        'https://example.com',
        'flash',
        604800000).calledOnce)
    })
    it('merges setting into temporarySiteSettings if private tab', function () {
      siteSettingsReducer(fakeAppState, Immutable.fromJS({
        actionType: appConstants.APP_ALLOW_FLASH_ALWAYS,
        isPrivate: true,
        url: 'https://example.com/test/page.html'
      }))
      assert(mergeSiteSettingSpy.withArgs(
        fakeAppState.get('temporarySiteSettings'),
        'https://example.com',
        'flash',
        604800000).calledOnce)
    })
  })

  describe('APP_CHANGE_SITE_SETTING', function () {
    beforeEach(function () {
      mergeSiteSettingSpy.reset()
    })
    it('merges setting into siteSettings', function () {
      siteSettingsReducer(fakeAppState, Immutable.fromJS({
        actionType: appConstants.APP_CHANGE_SITE_SETTING,
        temporary: false,
        hostPattern: 'https://example.com',
        key: 'keyNameHere',
        value: 'keyValueHere'
      }))
      assert(mergeSiteSettingSpy.withArgs(
        fakeAppState.get('siteSettings'),
        'https://example.com',
        'keyNameHere',
        'keyValueHere').calledOnce)
    })
    it('merges setting into temporarySiteSettings if temporary', function () {
      siteSettingsReducer(fakeAppState, Immutable.fromJS({
        actionType: appConstants.APP_CHANGE_SITE_SETTING,
        temporary: true,
        hostPattern: 'https://example.com',
        key: 'keyNameHere',
        value: 'keyValueHere'
      }))
      assert(mergeSiteSettingSpy.withArgs(
        fakeAppState.get('temporarySiteSettings'),
        'https://example.com',
        'keyNameHere',
        'keyValueHere').calledOnce)
    })

    describe('with skipSync', function () {
      it('sets skipSync when action includes it', function () {
        const newState = siteSettingsReducer(fakeAppState, Immutable.fromJS({
          actionType: appConstants.APP_CHANGE_SITE_SETTING,
          temporary: false,
          hostPattern: 'https://example.com',
          key: 'keyNameHere',
          value: 'keyValueHere',
          skipSync: true
        }))
        assert.equal(newState.getIn(['siteSettings', 'https://example.com', 'skipSync']), true)
      })
      it('does not set skipSync when action does not include it', function () {
        const newState = siteSettingsReducer(fakeAppState, Immutable.fromJS({
          actionType: appConstants.APP_CHANGE_SITE_SETTING,
          temporary: false,
          hostPattern: 'https://example.com',
          key: 'keyNameHere',
          value: 'keyValueHere'
        }))
        assert.equal(newState.getIn(['siteSettings', 'https://example.com', 'skipSync']), undefined)
      })
    })
  })

  describe('APP_REMOVE_SITE_SETTING', function () {
    beforeEach(function () {
      removeSiteSettingSpy.reset()
    })
    it('merges setting into siteSettings', function () {
      siteSettingsReducer(fakeAppState, Immutable.fromJS({
        actionType: appConstants.APP_REMOVE_SITE_SETTING,
        temporary: false,
        hostPattern: 'https://example.com',
        key: 'keyNameHere'
      }))
      assert(removeSiteSettingSpy.withArgs(
        fakeAppState.get('siteSettings'),
        'https://example.com',
        'keyNameHere').calledOnce)
    })
    it('merges setting into temporarySiteSettings if temporary', function () {
      siteSettingsReducer(fakeAppState, Immutable.fromJS({
        actionType: appConstants.APP_REMOVE_SITE_SETTING,
        temporary: true,
        hostPattern: 'https://example.com',
        key: 'keyNameHere'
      }))
      assert(removeSiteSettingSpy.withArgs(
        fakeAppState.get('temporarySiteSettings'),
        'https://example.com',
        'keyNameHere').calledOnce)
    })
    describe('with skipSync', function () {
      it('sets skipSync when action includes it', function () {
        const newState = siteSettingsReducer(fakeAppState, Immutable.fromJS({
          actionType: appConstants.APP_REMOVE_SITE_SETTING,
          temporary: false,
          hostPattern: 'https://example.com',
          key: 'keyNameHere',
          skipSync: true
        }))
        assert.equal(newState.getIn(['siteSettings', 'https://example.com', 'skipSync']), true)
      })
      it('does not set skipSync when action does not include it', function () {
        const newState = siteSettingsReducer(fakeAppState, Immutable.fromJS({
          actionType: appConstants.APP_REMOVE_SITE_SETTING,
          temporary: false,
          hostPattern: 'https://example.com',
          key: 'keyNameHere'
        }))
        assert.equal(newState.getIn(['siteSettings', 'https://example.com', 'skipSync']), undefined)
      })
    })
  })

  describe('APP_CLEAR_SITE_SETTINGS', function () {
    it('removes the site from siteSettings', function () {
      const newState = siteSettingsReducer(fakeAppState, Immutable.fromJS({
        actionType: appConstants.APP_CLEAR_SITE_SETTINGS,
        temporary: false,
        hostPattern: 'https://example.com',
        key: 'keyNameHere',
        skipSync: true
      }))
      assert.equal(newState.getIn(['siteSettings', 'https://example.com', 'skipSync']), true)
    })
    it('removes the site from temporarySiteSettings if temporary', function () {
      const beforeState = fakeAppState.setIn(['temporarySiteSettings'], Immutable.fromJS({
        'https://example.com': {
          keyNameHere: 'keyValueHere'
        }
      }))
      const afterState = siteSettingsReducer(beforeState, Immutable.fromJS({
        actionType: appConstants.APP_CLEAR_SITE_SETTINGS,
        temporary: true,
        hostPattern: 'https://example.com',
        key: 'keyNameHere'
      }))
      assert.equal(afterState.getIn(['siteSettings', 'https://example.com', 'keyNameHere']), undefined)
    })

    describe('with skipSync', function () {
      it('sets skipSync when action includes it', function () {
        const newState = siteSettingsReducer(fakeAppState, Immutable.fromJS({
          actionType: appConstants.APP_CLEAR_SITE_SETTINGS,
          temporary: false,
          hostPattern: 'https://example.com',
          key: 'keyNameHere',
          skipSync: true
        }))
        assert.equal(newState.getIn(['siteSettings', 'https://example.com', 'skipSync']), true)
      })
      it('does not set skipSync when action does not include it', function () {
        const newState = siteSettingsReducer(fakeAppState, Immutable.fromJS({
          actionType: appConstants.APP_CLEAR_SITE_SETTINGS,
          temporary: false,
          hostPattern: 'https://example.com',
          key: 'keyNameHere'
        }))
        assert.equal(newState.getIn(['siteSettings', 'https://example.com', 'skipSync']), undefined)
      })
    })

    it('ledger delete flag is cleared', function () {
      const beforeState = fakeAppState.setIn(['siteSettings'], Immutable.fromJS({
        'https://example.com': {
          ledgerPaymentsShown: false,
          ledgerPayments: true
        },
        'https://example1.com': {
          keyNameHere: 'keyValueHere'
        },
        'https://example2.com': {
          ledgerPayments: true
        }
      }))
      const afterState = siteSettingsReducer(beforeState, Immutable.fromJS({
        actionType: appConstants.APP_CLEAR_SITE_SETTINGS,
        key: 'ledgerPaymentsShown'
      }))

      const expectedState = afterState
        .setIn(['siteSettings', 'https://example.com'], Immutable.Map())

      assert.deepEqual(afterState.toJS(), expectedState.toJS())
    })
  })

  describe('APP_ADD_NOSCRIPT_EXCEPTIONS', function () {
    it('adds the `noScriptExceptions` entry to siteSettings', function () {
      const afterState = siteSettingsReducer(fakeAppState, Immutable.fromJS({
        actionType: appConstants.APP_ADD_NOSCRIPT_EXCEPTIONS,
        temporary: false,
        hostPattern: 'https://example.com',
        origins: [{'https://example.com': {}}],
        key: 'keyNameHere'
      }))
      assert(afterState.getIn(['siteSettings', 'https://example.com', 'noScriptExceptions']))
    })
    it('adds the `noScriptExceptions` entry to temporarySiteSettings if temporary', function () {
      const afterState = siteSettingsReducer(fakeAppState, Immutable.fromJS({
        actionType: appConstants.APP_ADD_NOSCRIPT_EXCEPTIONS,
        temporary: true,
        hostPattern: 'https://example.com',
        origins: null,
        key: 'keyNameHere'
      }))
      assert(afterState.getIn(['temporarySiteSettings', 'https://example.com', 'noScriptExceptions']))
    })
  })
})
