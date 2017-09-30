/* global describe, it, before, after */
const Immutable = require('immutable')
const assert = require('assert')
const mockery = require('mockery')
const sinon = require('sinon')
const appConstants = require('../../../../../js/constants/appConstants')
require('../../../braveUnit')

describe('ledgerReducer unit tests', function () {
  let ledgerReducer
  let fakeLedgerApi
  let appState

  before(function () {
    mockery.enable({
      warnOnReplace: false,
      warnOnUnregistered: false,
      useCleanCache: true
    })
    const fakeLevel = () => {}
    const fakeElectron = require('../../../lib/fakeElectron')
    const fakeAdBlock = require('../../../lib/fakeAdBlock')
    mockery.registerMock('electron', fakeElectron)
    mockery.registerMock('level', fakeLevel)
    mockery.registerMock('ad-block', fakeAdBlock)

    fakeLedgerApi = {
      init: (state) => {
        return state.set('unittest', true)
      },
      migration: (state) => {
        return state.set('unittest', true)
      },
      backupKeys: (state, backupAction) => {
        return state.set('unittest', true)
      },
      recoverKeys: (state, useRecoveryKeyFile, firstRecoveryKey, secondRecoveryKey) => {
        return state.set('unittest', true)
      },
      quit: (state) => {
        return state.set('unittest', true)
      }
    }
    mockery.registerMock('../../browser/api/ledger', fakeLedgerApi)
    ledgerReducer = require('../../../../../app/browser/reducers/ledgerReducer')

    appState = Immutable.fromJS({
      ledger: {}
    })
  })

  after(function () {
    mockery.disable()
  })

  describe('APP_SET_STATE', function () {
    let ledgerApiMigrationSpy
    let ledgerApiInitSpy
    let returnedState
    before(function () {
      ledgerApiMigrationSpy = sinon.spy(fakeLedgerApi, 'migration')
      ledgerApiInitSpy = sinon.spy(fakeLedgerApi, 'init')
      returnedState = ledgerReducer(appState, Immutable.fromJS({
        actionType: appConstants.APP_SET_STATE
      }))
    })
    after(function () {
      ledgerApiMigrationSpy.restore()
      ledgerApiInitSpy.restore()
    })
    it('calls ledgerApi.migration', function () {
      assert(ledgerApiMigrationSpy.withArgs(appState).calledOnce)
    })
    it('calls ledgerApi.init', function () {
      assert(ledgerApiInitSpy.calledOnce)
    })
    it('returns a modified state', function () {
      assert.notDeepEqual(returnedState, appState)
    })
  })

  describe('APP_BACKUP_KEYS', function () {
    let ledgerApiBackupKeysSpy
    let returnedState
    before(function () {
      ledgerApiBackupKeysSpy = sinon.spy(fakeLedgerApi, 'backupKeys')
      returnedState = ledgerReducer(appState, Immutable.fromJS({
        actionType: appConstants.APP_BACKUP_KEYS,
        backupAction: 'ActionGoesHere'
      }))
    })
    after(function () {
      ledgerApiBackupKeysSpy.restore()
    })
    it('calls ledgerApi.backupKeys', function () {
      assert(ledgerApiBackupKeysSpy.withArgs(appState, 'ActionGoesHere').calledOnce)
    })
    it('returns an ununmodified state', function () {
      assert.deepEqual(returnedState, appState)
    })
  })

  describe('APP_RECOVER_WALLET', function () {
    let ledgerApiRecoverKeysSpy
    let returnedState
    before(function () {
      ledgerApiRecoverKeysSpy = sinon.spy(fakeLedgerApi, 'recoverKeys')
      returnedState = ledgerReducer(appState, Immutable.fromJS({
        actionType: appConstants.APP_RECOVER_WALLET,
        useRecoveryKeyFile: 'useKeyFile',
        firstRecoveryKey: 'firstKey',
        secondRecoveryKey: 'secondKey'
      }))
    })
    after(function () {
      ledgerApiRecoverKeysSpy.restore()
    })
    it('calls ledgerApi.recoverKeys', function () {
      assert(ledgerApiRecoverKeysSpy.withArgs(appState, 'useKeyFile', 'firstKey', 'secondKey').calledOnce)
    })
    it('returns a modified state', function () {
      assert.notDeepEqual(returnedState, appState)
    })
  })

  describe('APP_SHUTTING_DOWN', function () {
    let ledgerApiQuitSpy
    let returnedState
    before(function () {
      ledgerApiQuitSpy = sinon.spy(fakeLedgerApi, 'quit')
      returnedState = ledgerReducer(appState, Immutable.fromJS({
        actionType: appConstants.APP_SHUTTING_DOWN
      }))
    })
    after(function () {
      ledgerApiQuitSpy.restore()
    })
    it('calls ledgerApi.quit', function () {
      assert(ledgerApiQuitSpy.withArgs(appState).calledOnce)
    })
    it('returns a modified state', function () {
      assert.notDeepEqual(returnedState, appState)
    })
  })
})
