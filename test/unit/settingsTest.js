/* global describe, it, beforeEach */
const settings = require('../../js/settings')
const settingsConst = require('../../js/constants/settings')
const {passwordManagers, extensionIds, displayNames} = require('../../js/constants/passwordManagers')
const appConfig = require('../../js/constants/appConfig')
const Immutable = require('immutable')
const assert = require('assert')

require('./braveUnit')

describe('settings unit test', function () {
  let settingsCollection = null

  beforeEach(function () {
    settingsCollection = {}
  })

  describe('getSetting', function () {
    it('returns value from collection if one is provided', function () {
      settingsCollection['testName'] = 'testValue'
      const response = settings.getSetting('testName', settingsCollection)
      assert.equal(response, 'testValue')
    })

    it('returns default value from appConfig if not found', function () {
      const response = settings.getSetting(settingsConst.TABS_PER_PAGE, settingsCollection)
      assert.equal(response, appConfig.defaultSettings[settingsConst.TABS_PER_PAGE])
    })

    describe('key is ACTIVE_PASSWORD_MANAGER and value is falsey', function () {
      it('returns `1Password` if ONE_PASSWORD_ENABLED was true', function () {
        settingsCollection[settingsConst.ONE_PASSWORD_ENABLED] = true
        const response = settings.getSetting(settingsConst.ACTIVE_PASSWORD_MANAGER, settingsCollection)
        assert.equal(response, passwordManagers.ONE_PASSWORD)
      })

      it('returns `Dashlane` if DASHLANE_ENABLED was true', function () {
        settingsCollection[settingsConst.DASHLANE_ENABLED] = true
        const response = settings.getSetting(settingsConst.ACTIVE_PASSWORD_MANAGER, settingsCollection)
        assert.equal(response, passwordManagers.DASHLANE)
      })

      it('returns `LastPass` if LAST_PASS_ENABLED was true', function () {
        settingsCollection[settingsConst.LAST_PASS_ENABLED] = true
        const response = settings.getSetting(settingsConst.ACTIVE_PASSWORD_MANAGER, settingsCollection)
        assert.equal(response, passwordManagers.LAST_PASS)
      })

      it('returns `BuiltIn` if PASSWORD_MANAGER_ENABLED was true', function () {
        settingsCollection[settingsConst.PASSWORD_MANAGER_ENABLED] = true
        const response = settings.getSetting(settingsConst.ACTIVE_PASSWORD_MANAGER, settingsCollection)
        assert.equal(response, passwordManagers.BUILT_IN)
      })

      it('returns `1Password`/`Dashlane`/`LastPass`, even if PASSWORD_MANAGER_ENABLED was true', function () {
        // 1Password
        settingsCollection[settingsConst.ONE_PASSWORD_ENABLED] = true
        settingsCollection[settingsConst.PASSWORD_MANAGER_ENABLED] = true
        let response = settings.getSetting(settingsConst.ACTIVE_PASSWORD_MANAGER, settingsCollection)
        assert.equal(response, passwordManagers.ONE_PASSWORD)
        // Dashlane
        settingsCollection = {}
        settingsCollection[settingsConst.DASHLANE_ENABLED] = true
        settingsCollection[settingsConst.PASSWORD_MANAGER_ENABLED] = true
        response = settings.getSetting(settingsConst.ACTIVE_PASSWORD_MANAGER, settingsCollection)
        assert.equal(response, passwordManagers.DASHLANE)
        // LastPass
        settingsCollection = {}
        settingsCollection[settingsConst.LAST_PASS_ENABLED] = true
        settingsCollection[settingsConst.PASSWORD_MANAGER_ENABLED] = true
        response = settings.getSetting(settingsConst.ACTIVE_PASSWORD_MANAGER, settingsCollection)
        assert.equal(response, passwordManagers.LAST_PASS)
      })

      it('defaults to `BuiltIn` if nothing is set', function () {
        settingsCollection[settingsConst.PASSWORD_MANAGER_ENABLED] = false
        const response = settings.getSetting(settingsConst.ACTIVE_PASSWORD_MANAGER, settingsCollection)
        assert.equal(response, passwordManagers.BUILT_IN)
      })
    })
  })

  describe('getActivePasswordManager', function () {
    it('returns the active password manager details', function () {
      settingsCollection[settingsConst.ACTIVE_PASSWORD_MANAGER] = passwordManagers.ONE_PASSWORD

      const expectedResult = Immutable.fromJS({
        name: passwordManagers.ONE_PASSWORD,
        extensionId: extensionIds[passwordManagers.ONE_PASSWORD],
        displayName: displayNames[passwordManagers.ONE_PASSWORD]
      })
      const actualResult = settings.getActivePasswordManager(settingsCollection)
      assert.deepEqual(actualResult, expectedResult)
    })

    it('returns popup dimensions for LastPass', function () {
      settingsCollection[settingsConst.ACTIVE_PASSWORD_MANAGER] = passwordManagers.LAST_PASS

      const expectedResult = Immutable.fromJS({
        name: passwordManagers.LAST_PASS,
        extensionId: extensionIds[passwordManagers.LAST_PASS],
        displayName: displayNames[passwordManagers.LAST_PASS],
        popupWidth: 350,
        popupHeight: 448
      })
      const actualResult = settings.getActivePasswordManager(settingsCollection)
      assert.deepEqual(actualResult, expectedResult)
    })
  })
})
