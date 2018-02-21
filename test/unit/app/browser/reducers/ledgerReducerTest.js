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
  let fakeLedgerNotifications
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
      onNetworkConnected: dummyModifyState,
      getNewClient: () => {},
      claimPromotion: () => {},
      onPromotionResponse: dummyModifyState,
      getPromotion: () => {},
      checkReferralActivity: dummyModifyState,
      referralCheck: () => {}
    }
    fakeLedgerState = {
      resetSynopsis: dummyModifyState,
      setRecoveryStatus: dummyModifyState,
      setInfoProp: dummyModifyState,
      saveSynopsis: dummyModifyState,
      savePromotion: dummyModifyState,
      remindMeLater: dummyModifyState,
      removePromotion: dummyModifyState
    }
    fakeLedgerNotifications = {
      onPromotionReceived: dummyModifyState,
      onInterval: dummyModifyState,
      removePromotionNotification: () => {}
    }
    mockery.registerMock('../../browser/api/ledger', fakeLedgerApi)
    mockery.registerMock('../../common/state/ledgerState', fakeLedgerState)
    mockery.registerMock('../../browser/api/ledgerNotifications', fakeLedgerNotifications)
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

  describe('APP_ON_PRUNE_SYNOPSIS', function () {
    let ledgerStateSpy

    beforeEach(function () {
      ledgerStateSpy = sinon.spy(fakeLedgerState, 'saveSynopsis')
    })

    afterEach(function () {
      ledgerStateSpy.restore()
    })

    it('null case', function () {
      const result = ledgerReducer(appState, Immutable.fromJS({
        actionType: appConstants.APP_ON_PRUNE_SYNOPSIS
      }))
      assert.deepEqual(result, appState)
      assert(ledgerStateSpy.notCalled)
    })

    it('publishers provided', function () {
      const result = ledgerReducer(appState, Immutable.fromJS({
        actionType: appConstants.APP_ON_PRUNE_SYNOPSIS,
        publishers: {
          'clifton.io': {
            duration: 10000,
            visits: 1
          }
        }
      }))
      assert.notDeepEqual(result, appState)
      assert(ledgerStateSpy.calledOnce)
    })
  })

  describe('APP_SAVE_LEDGER_PROMOTION', function () {
    let savePromotionSpy, onPromotionReceivedSpy

    before(function () {
      savePromotionSpy = sinon.spy(fakeLedgerState, 'savePromotion')
      onPromotionReceivedSpy = sinon.spy(fakeLedgerNotifications, 'onPromotionReceived')
    })

    after(function () {
      savePromotionSpy.restore()
    })

    it('execute', function () {
      const result = ledgerReducer(appState, Immutable.fromJS({
        actionType: appConstants.APP_SAVE_LEDGER_PROMOTION,
        promotion: {
          promotionId: '1'
        }
      }))
      assert.notDeepEqual(result, appState)
      assert(savePromotionSpy.calledOnce)
      assert(onPromotionReceivedSpy.calledOnce)
    })
  })

  describe('APP_ON_PROMOTION_CLAIM', function () {
    let claimPromotionSpy

    before(function () {
      claimPromotionSpy = sinon.spy(fakeLedgerApi, 'claimPromotion')
    })

    after(function () {
      claimPromotionSpy.restore()
    })

    it('execute', function () {
      ledgerReducer(appState, Immutable.fromJS({
        actionType: appConstants.APP_ON_PROMOTION_CLAIM
      }))
      assert(claimPromotionSpy.calledOnce)
    })
  })

  describe('APP_ON_PROMOTION_REMIND', function () {
    let remindMeLaterSpy

    before(function () {
      remindMeLaterSpy = sinon.spy(fakeLedgerState, 'remindMeLater')
    })

    after(function () {
      remindMeLaterSpy.restore()
    })

    it('execute', function () {
      ledgerReducer(appState, Immutable.fromJS({
        actionType: appConstants.APP_ON_PROMOTION_REMIND
      }))
      assert(remindMeLaterSpy.calledOnce)
    })
  })

  describe('APP_ON_PROMOTION_RESPONSE', function () {
    let onPromotionResponseSpy

    before(function () {
      onPromotionResponseSpy = sinon.spy(fakeLedgerApi, 'onPromotionResponse')
    })

    after(function () {
      onPromotionResponseSpy.restore()
    })

    it('execute', function () {
      ledgerReducer(appState, Immutable.fromJS({
        actionType: appConstants.APP_ON_PROMOTION_RESPONSE
      }))
      assert(onPromotionResponseSpy.calledOnce)
    })
  })

  describe('APP_ON_PROMOTION_REMOVAL', function () {
    let removePromotionSpy

    before(function () {
      removePromotionSpy = sinon.spy(fakeLedgerState, 'removePromotion')
    })

    after(function () {
      removePromotionSpy.restore()
    })

    it('execute', function () {
      ledgerReducer(appState, Immutable.fromJS({
        actionType: appConstants.APP_ON_PROMOTION_REMOVAL
      }))
      assert(removePromotionSpy.calledOnce)
    })
  })

  describe('APP_ON_LEDGER_NOTIFICATION_INTERVAL', function () {
    let onIntervalSpy

    before(function () {
      onIntervalSpy = sinon.spy(fakeLedgerNotifications, 'onInterval')
    })

    after(function () {
      onIntervalSpy.restore()
    })

    it('execute', function () {
      ledgerReducer(appState, Immutable.fromJS({
        actionType: appConstants.APP_ON_LEDGER_NOTIFICATION_INTERVAL
      }))
      assert(onIntervalSpy.calledOnce)
    })
  })

  describe('APP_ON_PROMOTION_GET', function () {
    let getPromotionSpy

    before(function () {
      getPromotionSpy = sinon.spy(fakeLedgerApi, 'getPromotion')
    })

    after(function () {
      getPromotionSpy.restore()
    })

    it('execute', function () {
      ledgerReducer(appState, Immutable.fromJS({
        actionType: appConstants.APP_ON_PROMOTION_GET
      }))
      assert(getPromotionSpy.calledOnce)
    })
  })

  describe('APP_CHECK_REFERRAL_ACTIVITY', function () {
    let checkReferralActivitySpy

    before(function () {
      checkReferralActivitySpy = sinon.spy(fakeLedgerApi, 'checkReferralActivity')
    })

    after(function () {
      checkReferralActivitySpy.restore()
    })

    it('execute', function () {
      const returnedState = ledgerReducer(appState, Immutable.fromJS({
        actionType: appConstants.APP_CHECK_REFERRAL_ACTIVITY
      }))
      assert(checkReferralActivitySpy.calledOnce)
      assert.notDeepEqual(returnedState, appState)
    })
  })
})
