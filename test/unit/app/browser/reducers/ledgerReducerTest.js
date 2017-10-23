/* global describe, it, before, beforeEach, after, afterEach */
const Immutable = require('immutable')
const assert = require('assert')
const mockery = require('mockery')
const sinon = require('sinon')
const appConstants = require('../../../../../js/constants/appConstants')
const settings = require('../../../../../js/constants/settings')
require('../../../braveUnit')

describe('ledgerReducer unit tests', function () {
  let ledgerReducer
  let fakeLedgerApi
  let fakeLedgerState
  let appState
  let paymentsEnabled
  let returnedState

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

    const dummyModifyState = (state) => {
      return state.set('unittest', true)
    }
    fakeLedgerApi = {
      init: dummyModifyState,
      migration: dummyModifyState,
      backupKeys: dummyModifyState,
      recoverKeys: dummyModifyState,
      quit: dummyModifyState,
      pageDataChanged: dummyModifyState,
      addVisit: dummyModifyState,
      deleteSynopsis: () => {},
      boot: () => {},
      onBootStateFile: dummyModifyState,
      onWalletProperties: dummyModifyState,
      paymentPresent: dummyModifyState,
      addFoundClosed: dummyModifyState,
      onWalletRecovery: dummyModifyState,
      onBraveryProperties: dummyModifyState,
      onLedgerFirstSync: dummyModifyState,
      onCallback: dummyModifyState,
      onTimeUntilReconcile: dummyModifyState,
      run: () => {},
      onNetworkConnected: dummyModifyState
    }
    fakeLedgerState = {
      resetSynopsis: dummyModifyState,
      setRecoveryStatus: dummyModifyState,
      setInfoProp: dummyModifyState
    }
    mockery.registerMock('../../browser/api/ledger', fakeLedgerApi)
    mockery.registerMock('../../common/state/ledgerState', fakeLedgerState)
    mockery.registerMock('../../../js/settings', {
      getSetting: (settingKey, settingsCollection, value) => {
        if (settingKey === settings.PAYMENTS_ENABLED) {
          return paymentsEnabled
        }
        return false
      }
    })
    ledgerReducer = require('../../../../../app/browser/reducers/ledgerReducer')

    appState = Immutable.fromJS({
      ledger: {}
    })
  })

  after(function () {
    mockery.disable()
  })

  describe('APP_SET_STATE', function () {
    let migrationSpy
    let initSpy
    before(function () {
      migrationSpy = sinon.spy(fakeLedgerApi, 'migration')
      initSpy = sinon.spy(fakeLedgerApi, 'init')
      returnedState = ledgerReducer(appState, Immutable.fromJS({
        actionType: appConstants.APP_SET_STATE
      }))
    })
    after(function () {
      migrationSpy.restore()
      initSpy.restore()
    })
    it('calls ledgerApi.migration', function () {
      assert(migrationSpy.withArgs(appState).calledOnce)
    })
    it('calls ledgerApi.init', function () {
      assert(initSpy.calledOnce)
    })
    it('returns a modified state', function () {
      assert.notDeepEqual(returnedState, appState)
    })
  })

  describe('APP_BACKUP_KEYS', function () {
    let backupKeysSpy
    before(function () {
      backupKeysSpy = sinon.spy(fakeLedgerApi, 'backupKeys')
      returnedState = ledgerReducer(appState, Immutable.fromJS({
        actionType: appConstants.APP_BACKUP_KEYS,
        backupAction: 'ActionGoesHere'
      }))
    })
    after(function () {
      backupKeysSpy.restore()
    })
    it('calls ledgerApi.backupKeys', function () {
      assert(backupKeysSpy.withArgs(appState, 'ActionGoesHere').calledOnce)
    })
    it('returns an ununmodified state', function () {
      assert.deepEqual(returnedState, appState)
    })
  })

  describe('APP_RECOVER_WALLET', function () {
    let recoverKeysSpy
    before(function () {
      recoverKeysSpy = sinon.spy(fakeLedgerApi, 'recoverKeys')
      returnedState = ledgerReducer(appState, Immutable.fromJS({
        actionType: appConstants.APP_RECOVER_WALLET,
        useRecoveryKeyFile: 'useKeyFile',
        recoveryKey: 'firstKey'
      }))
    })
    after(function () {
      recoverKeysSpy.restore()
    })
    it('calls ledgerApi.recoverKeys', function () {
      assert(recoverKeysSpy.withArgs(appState, 'useKeyFile', 'firstKey').calledOnce)
    })
    it('returns a modified state', function () {
      assert.notDeepEqual(returnedState, appState)
    })
  })

  describe('APP_SHUTTING_DOWN', function () {
    let quitSpy
    before(function () {
      quitSpy = sinon.spy(fakeLedgerApi, 'quit')
      returnedState = ledgerReducer(appState, Immutable.fromJS({
        actionType: appConstants.APP_SHUTTING_DOWN
      }))
    })
    after(function () {
      quitSpy.restore()
    })
    it('calls ledgerApi.quit', function () {
      assert(quitSpy.withArgs(appState).calledOnce)
    })
    it('returns a modified state', function () {
      assert.notDeepEqual(returnedState, appState)
    })
  })

  describe('APP_ON_CLEAR_BROWSING_DATA', function () {
    let resetSynopsisSpy
    let clearAppState
    before(function () {
      resetSynopsisSpy = sinon.spy(fakeLedgerState, 'resetSynopsis')
    })
    after(function () {
      resetSynopsisSpy.restore()
    })
    describe('when clearData.browserHistory is true and payments is disabled', function () {
      before(function () {
        resetSynopsisSpy.reset()
        paymentsEnabled = false
        clearAppState = appState.setIn(['settings', settings.PAYMENTS_ENABLED], paymentsEnabled)
        clearAppState = clearAppState.set('clearBrowsingDataDefaults', Immutable.fromJS({
          browserHistory: true
        }))
        returnedState = ledgerReducer(clearAppState, Immutable.fromJS({
          actionType: appConstants.APP_ON_CLEAR_BROWSING_DATA
        }))
      })
      it('calls ledgerState.resetSynopsis', function () {
        assert(resetSynopsisSpy.withArgs(clearAppState).calledOnce)
      })
      it('returns a modified state', function () {
        assert.notDeepEqual(returnedState, clearAppState)
      })
    })
    describe('else', function () {
      before(function () {
        resetSynopsisSpy.reset()
        paymentsEnabled = true
        clearAppState = appState.setIn(['settings', settings.PAYMENTS_ENABLED], paymentsEnabled)
        clearAppState = clearAppState.set('clearBrowsingDataDefaults', Immutable.fromJS({
          browserHistory: true
        }))
        returnedState = ledgerReducer(clearAppState, Immutable.fromJS({
          actionType: appConstants.APP_ON_CLEAR_BROWSING_DATA
        }))
      })
      it('does not call ledgerState.resetSynopsis', function () {
        assert(resetSynopsisSpy.notCalled)
      })
      it('returns an ununmodified state', function () {
        assert.deepEqual(returnedState, clearAppState)
      })
    })
  })

  describe('APP_IDLE_STATE_CHANGED', function () {
    let pageDataChangedSpy
    beforeEach(function () {
      pageDataChangedSpy = sinon.spy(fakeLedgerApi, 'pageDataChanged')
    })

    afterEach(function () {
      pageDataChangedSpy.restore()
    })
    it('does not calls ledgerApi.pageDataChanged when no idle state is provided', function () {
      returnedState = ledgerReducer(appState, Immutable.fromJS({
        actionType: appConstants.APP_IDLE_STATE_CHANGED
      }))
      assert(pageDataChangedSpy.notCalled)
    })
    it('calls ledgerApi.pageDataChanged when not in idleState', function () {
      returnedState = ledgerReducer(appState, Immutable.fromJS({
        actionType: appConstants.APP_IDLE_STATE_CHANGED,
        idleState: 'notActive'
      }))
      assert(pageDataChangedSpy.withArgs(appState).calledOnce)
    })
    it('does not calls ledgerApi.pageDataChanged when in idleState', function () {
      returnedState = ledgerReducer(appState, Immutable.fromJS({
        actionType: appConstants.APP_IDLE_STATE_CHANGED,
        idleState: 'active'
      }))
      assert(pageDataChangedSpy.notCalled)
    })
    it('returns a modified state', function () {
      returnedState = ledgerReducer(appState, Immutable.fromJS({
        actionType: appConstants.APP_IDLE_STATE_CHANGED,
        idleState: 'notActive'
      }))
      assert.notDeepEqual(returnedState, appState)
    })
  })

  describe('', function () {

  })

  describe('APP_ON_LEDGER_WALLET_CREATE', function () {
    let bootSpy
    before(function () {
      bootSpy = sinon.spy(fakeLedgerApi, 'boot')
      returnedState = ledgerReducer(appState, Immutable.fromJS({
        actionType: appConstants.APP_ON_LEDGER_WALLET_CREATE
      }))
    })
    after(function () {
      bootSpy.restore()
    })
    it('calls ledgerApi.boot', function () {
      assert(bootSpy.calledOnce)
    })
    it('returns a modified state', function () {
      assert.notDeepEqual(returnedState, appState)
    })
  })

  describe('APP_ON_BOOT_STATE_FILE', function () {
    let onBootStateFileSpy
    before(function () {
      onBootStateFileSpy = sinon.spy(fakeLedgerApi, 'onBootStateFile')
      returnedState = ledgerReducer(appState, Immutable.fromJS({
        actionType: appConstants.APP_ON_BOOT_STATE_FILE
      }))
    })
    after(function () {
      onBootStateFileSpy.restore()
    })
    it('calls ledgerApi.onBootStateFile', function () {
      assert(onBootStateFileSpy.withArgs(appState).calledOnce)
    })
    it('returns a modified state', function () {
      assert.notDeepEqual(returnedState, appState)
    })
  })

  describe('APP_ON_WALLET_PROPERTIES', function () {
    let onWalletPropertiesSpy
    before(function () {
      onWalletPropertiesSpy = sinon.spy(fakeLedgerApi, 'onWalletProperties')
      returnedState = ledgerReducer(appState, Immutable.fromJS({
        actionType: appConstants.APP_ON_WALLET_PROPERTIES,
        body: 'text-goes-here'
      }))
    })
    after(function () {
      onWalletPropertiesSpy.restore()
    })
    it('calls ledgerApi.onWalletProperties', function () {
      assert(onWalletPropertiesSpy.withArgs(appState, 'text-goes-here').calledOnce)
    })
    it('returns a modified state', function () {
      assert.notDeepEqual(returnedState, appState)
    })
  })

  describe('APP_LEDGER_PAYMENTS_PRESENT', function () {
    let paymentPresentSpy
    before(function () {
      paymentPresentSpy = sinon.spy(fakeLedgerApi, 'paymentPresent')
      returnedState = ledgerReducer(appState, Immutable.fromJS({
        actionType: appConstants.APP_LEDGER_PAYMENTS_PRESENT,
        tabId: 123,
        present: true
      }))
    })
    after(function () {
      paymentPresentSpy.restore()
    })
    it('calls ledgerApi.paymentPresent', function () {
      assert(paymentPresentSpy.withArgs(appState, 123, true).calledOnce)
    })
    it('returns an ununmodified state', function () {
      assert.deepEqual(returnedState, appState)
    })
  })

  describe('APP_ON_ADD_FUNDS_CLOSED', function () {
    let addFoundClosedSpy
    before(function () {
      addFoundClosedSpy = sinon.spy(fakeLedgerApi, 'addFoundClosed')
      returnedState = ledgerReducer(appState, Immutable.fromJS({
        actionType: appConstants.APP_ON_ADD_FUNDS_CLOSED
      }))
    })
    after(function () {
      addFoundClosedSpy.restore()
    })
    it('calls ledgerApi.addFoundClosed', function () {
      assert(addFoundClosedSpy.withArgs(appState).calledOnce)
    })
    it('returns an ununmodified state', function () {
      assert.deepEqual(returnedState, appState)
    })
  })

  describe('APP_ON_WALLET_RECOVERY', function () {
    let onWalletRecoverySpy
    before(function () {
      onWalletRecoverySpy = sinon.spy(fakeLedgerApi, 'onWalletRecovery')
      returnedState = ledgerReducer(appState, Immutable.fromJS({
        actionType: appConstants.APP_ON_WALLET_RECOVERY,
        error: 'error-goes-here',
        result: 'result-goes-here'
      }))
    })
    after(function () {
      onWalletRecoverySpy.restore()
    })
    it('calls ledgerApi.onWalletRecovery', function () {
      assert(onWalletRecoverySpy.withArgs(appState, 'error-goes-here', 'result-goes-here').calledOnce)
    })
    it('returns a modified state', function () {
      assert.notDeepEqual(returnedState, appState)
    })
  })

  describe('APP_ON_BRAVERY_PROPERTIES', function () {
    let onBraveryPropertiesSpy
    before(function () {
      onBraveryPropertiesSpy = sinon.spy(fakeLedgerApi, 'onBraveryProperties')
      returnedState = ledgerReducer(appState, {
        actionType: appConstants.APP_ON_BRAVERY_PROPERTIES,
        error: 'error-goes-here',
        result: 'result-goes-here'
      })
    })
    after(function () {
      onBraveryPropertiesSpy.restore()
    })
    it('calls ledgerApi.onBraveryProperties', function () {
      assert(onBraveryPropertiesSpy.withArgs(appState, 'error-goes-here', 'result-goes-here').calledOnce)
    })
    it('returns a modified state', function () {
      assert.notDeepEqual(returnedState, appState)
    })
  })

  describe('APP_ON_FIRST_LEDGER_SYNC', function () {
    let onLedgerFirstSyncSpy
    before(function () {
      onLedgerFirstSyncSpy = sinon.spy(fakeLedgerApi, 'onLedgerFirstSync')
      returnedState = ledgerReducer(appState, {
        actionType: appConstants.APP_ON_FIRST_LEDGER_SYNC,
        parsedData: 'parsed-data-goes-here'
      })
    })
    after(function () {
      onLedgerFirstSyncSpy.restore()
    })
    it('calls ledgerApi.onLedgerFirstSync', function () {
      assert(onLedgerFirstSyncSpy.withArgs(appState, 'parsed-data-goes-here').calledOnce)
    })
    it('returns a modified state', function () {
      assert.notDeepEqual(returnedState, appState)
    })
  })

  describe('APP_ON_LEDGER_CALLBACK', function () {
    let onCallbackSpy
    before(function () {
      onCallbackSpy = sinon.spy(fakeLedgerApi, 'onCallback')
      returnedState = ledgerReducer(appState, Immutable.fromJS({
        actionType: appConstants.APP_ON_LEDGER_CALLBACK,
        result: 'result-goes-here',
        delayTime: 39
      }))
    })
    after(function () {
      onCallbackSpy.restore()
    })
    it('calls ledgerApi.onCallback', function () {
      assert(onCallbackSpy.withArgs(appState, 'result-goes-here', 39).calledOnce)
    })
    it('returns a modified state', function () {
      assert.notDeepEqual(returnedState, appState)
    })
  })

  describe('APP_ON_TIME_UNTIL_RECONCILE', function () {
    let onTimeUntilReconcileSpy
    before(function () {
      onTimeUntilReconcileSpy = sinon.spy(fakeLedgerApi, 'onTimeUntilReconcile')
      returnedState = ledgerReducer(appState, Immutable.fromJS({
        actionType: appConstants.APP_ON_TIME_UNTIL_RECONCILE,
        stateResult: 'state-result-goes-here'
      }))
    })
    after(function () {
      onTimeUntilReconcileSpy.restore()
    })
    it('calls ledgerApi.onTimeUntilReconcile', function () {
      assert(onTimeUntilReconcileSpy.withArgs(appState, 'state-result-goes-here').calledOnce)
    })
    it('returns a modified state', function () {
      assert.notDeepEqual(returnedState, appState)
    })
  })

  describe('APP_ON_LEDGER_RUN', function () {
    let runSpy
    before(function () {
      runSpy = sinon.spy(fakeLedgerApi, 'run')
      returnedState = ledgerReducer(appState, Immutable.fromJS({
        actionType: appConstants.APP_ON_LEDGER_RUN,
        delay: 7
      }))
    })
    after(function () {
      runSpy.restore()
    })
    it('calls ledgerApi.run', function () {
      assert(runSpy.withArgs(appState, 7).calledOnce)
    })
    it('returns an ununmodified state', function () {
      assert.deepEqual(returnedState, appState)
    })
  })

  describe('APP_ON_NETWORK_CONNECTED', function () {
    let onNetworkConnectedSpy
    before(function () {
      onNetworkConnectedSpy = sinon.spy(fakeLedgerApi, 'onNetworkConnected')
      returnedState = ledgerReducer(appState, Immutable.fromJS({
        actionType: appConstants.APP_ON_NETWORK_CONNECTED
      }))
    })
    after(function () {
      onNetworkConnectedSpy.restore()
    })
    it('calls ledgerApi.onNetworkConnected', function () {
      assert(onNetworkConnectedSpy.withArgs(appState).calledOnce)
    })
    it('returns a modified state', function () {
      assert.notDeepEqual(returnedState, appState)
    })
  })

  describe('APP_ON_RESET_RECOVERY_STATUS', function () {
    let setRecoveryStatusSpy
    before(function () {
      setRecoveryStatusSpy = sinon.spy(fakeLedgerState, 'setRecoveryStatus')
      returnedState = ledgerReducer(appState, Immutable.fromJS({
        actionType: appConstants.APP_ON_RESET_RECOVERY_STATUS
      }))
    })
    after(function () {
      setRecoveryStatusSpy.restore()
    })
    it('calls ledgerApi.setRecoveryStatus', function () {
      assert(setRecoveryStatusSpy.withArgs(appState, null).calledOnce)
    })
    it('returns a modified state', function () {
      assert.notDeepEqual(returnedState, appState)
    })
  })

  describe('APP_ON_BTC_TO_BAT_NOTIFIED', function () {
    before(function () {
      returnedState = ledgerReducer(appState, Immutable.fromJS({
        actionType: appConstants.APP_ON_BTC_TO_BAT_NOTIFIED
      }))
    })
    it('sets the notification timestamp', function () {
      assert.notDeepEqual(returnedState, appState)
      assert(returnedState.getIn(['migrations', 'btc2BatNotifiedTimestamp']))
    })
  })

  describe('APP_ON_BTC_TO_BAT_TRANSITIONED', function () {
    before(function () {
      returnedState = ledgerReducer(appState, Immutable.fromJS({
        actionType: appConstants.APP_ON_BTC_TO_BAT_TRANSITIONED
      }))
    })
    it('sets the timestamp', function () {
      assert.notDeepEqual(returnedState, appState)
      assert(returnedState.getIn(['migrations', 'btc2BatTimestamp']))
    })
  })

  describe('APP_ON_BTC_TO_BAT_BEGIN_TRANSITION', function () {
    before(function () {
      returnedState = ledgerReducer(appState, Immutable.fromJS({
        actionType: appConstants.APP_ON_BTC_TO_BAT_BEGIN_TRANSITION
      }))
    })
    it('sets the state variable', function () {
      assert.notDeepEqual(returnedState, appState)
      assert.equal(returnedState.getIn(['migrations', 'btc2BatTransitionPending']), true)
    })
  })
})
