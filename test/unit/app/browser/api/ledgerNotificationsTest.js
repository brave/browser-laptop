/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

/* global describe, it, after, before, beforeEach, afterEach */
const Immutable = require('immutable')
const assert = require('assert')
const sinon = require('sinon')
const mockery = require('mockery')
const settings = require('../../../../../js/constants/settings')
const ledgerUtil = require('../../../../../app/common/lib/ledgerUtil')
const aboutPreferencesState = require('../../../../../app/common/state/aboutPreferencesState')
const ledgerStatuses = require('../../../../../app/common/constants/ledgerStatuses')

describe('ledgerNotifications unit test', function () {
  let fakeClock
  let ledgerNotificationsApi
  let appAction

  let paymentsEnabled
  let paymentsNotifications = true
  let paymentsMinVisitTime = 5000
  let paymentsContributionAmount = 25
  let paymentsAllowPromotions = true

  const defaultAppState = Immutable.fromJS({
    about: {
      preferences: {}
    },
    ledger: {}
  })

  before(function () {
    mockery.enable({
      warnOnReplace: false,
      warnOnUnregistered: false,
      useCleanCache: true
    })

    const fakeElectron = require('../../../lib/fakeElectron')
    const fakeAdBlock = require('../../../lib/fakeAdBlock')
    const fakeLevel = require('../../../lib/fakeLevel')
    mockery.registerMock('electron', fakeElectron)
    mockery.registerMock('ad-block', fakeAdBlock)
    mockery.registerMock('level', fakeLevel)
    mockery.registerMock('../../../js/settings', {
      getSetting: (settingKey) => {
        switch (settingKey) {
          case settings.PAYMENTS_ENABLED:
            return paymentsEnabled
          case settings.PAYMENTS_NOTIFICATIONS:
            return paymentsNotifications
          case settings.PAYMENTS_MINIMUM_VISIT_TIME:
            return paymentsMinVisitTime
          case settings.PAYMENTS_CONTRIBUTION_AMOUNT:
            return paymentsContributionAmount
          case settings.PAYMENTS_ALLOW_PROMOTIONS:
            return paymentsAllowPromotions
        }
        return false
      }
    })

    fakeClock = sinon.useFakeTimers()
    ledgerNotificationsApi = require('../../../../../app/browser/api/ledgerNotifications')
    appAction = require('../../../../../js/actions/appActions')
  })

  after(function () {
    fakeClock.restore()
    mockery.deregisterAll()
    mockery.disable()
  })

  describe('init', function () {
    let notificationAction
    beforeEach(function () {
      notificationAction = sinon.spy(appAction, 'onLedgerNotificationInterval')
    })
    afterEach(function () {
      notificationAction.restore()
    })
    it('does not immediately call notifications.onInterval', function () {
      ledgerNotificationsApi.init()
      assert(notificationAction.notCalled)
    })
    it('calls notifications.onInterval after interval', function () {
      fakeClock.tick(0)
      ledgerNotificationsApi.init()
      fakeClock.tick(ledgerNotificationsApi.getPollingInterval())
      assert(notificationAction.calledOnce)
    })
    it('assigns a value to timeout', function () {
      ledgerNotificationsApi.setTimeOut(0)
      ledgerNotificationsApi.init()
      assert(ledgerNotificationsApi.getTimeOut(0))
    })
  })

  describe('onInterval', function () {
    let showEnabledNotificationsSpy, showDisabledNotificationsSpy, onIntervalDynamicSpy

    before(function () {
      showEnabledNotificationsSpy = sinon.spy(ledgerNotificationsApi, 'showEnabledNotifications')
      showDisabledNotificationsSpy = sinon.spy(ledgerNotificationsApi, 'showDisabledNotifications')
      onIntervalDynamicSpy = sinon.spy(ledgerNotificationsApi, 'onIntervalDynamic')
    })

    afterEach(function () {
      showDisabledNotificationsSpy.reset()
      showEnabledNotificationsSpy.reset()
      onIntervalDynamicSpy.reset()
    })

    after(function () {
      showDisabledNotificationsSpy.restore()
      showEnabledNotificationsSpy.restore()
      onIntervalDynamicSpy.restore()
    })

    it('payments disabled', function () {
      paymentsEnabled = false
      ledgerNotificationsApi.onInterval(defaultAppState)
      assert(showEnabledNotificationsSpy.notCalled)
      assert(showDisabledNotificationsSpy.calledOnce)
      assert(onIntervalDynamicSpy.calledOnce)
      paymentsEnabled = true
    })

    it('payments enabled, but notifications disabled', function () {
      paymentsNotifications = false
      paymentsEnabled = true
      ledgerNotificationsApi.onInterval(defaultAppState)
      assert(showEnabledNotificationsSpy.notCalled)
      assert(showDisabledNotificationsSpy.notCalled)
      assert(onIntervalDynamicSpy.notCalled)
      paymentsNotifications = true
    })

    it('payments enabled and notifications enabled', function () {
      paymentsNotifications = true
      ledgerNotificationsApi.onInterval(defaultAppState.setIn(['ledger', 'info', 'userHasFunded'], false))
      assert(showDisabledNotificationsSpy.notCalled)
      assert(showEnabledNotificationsSpy.calledOnce)
      assert(onIntervalDynamicSpy.calledOnce)
    })
  })

  describe('showBackupKeys', function () {
    paymentsEnabled = true
    paymentsNotifications = true
    let fakeClock, showBackupKeysSpy
    let state = defaultAppState
      .setIn(['ledger', 'info', 'reconcileStamp'], ledgerUtil.milliseconds.year) // set to skip over reconciliation
      .setIn(['ledger', 'info', 'userHasFunded'], true)

    before(function () {
      fakeClock = sinon.useFakeTimers()
      showBackupKeysSpy = sinon.spy(ledgerNotificationsApi, 'showBackupKeys')
    })

    afterEach(function () {
      showBackupKeysSpy.reset()
    })

    after(function () {
      fakeClock.restore()
      showBackupKeysSpy.restore()
    })

    it('not time to yet show backup keys notification for first time (not yet 7 days from funds being added)', function () {
      fakeClock.tick(1)
      state = ledgerNotificationsApi.showEnabledNotifications(state)
      assert(showBackupKeysSpy.notCalled)
    })

    it('first notification (7 days from funds being added)', function () {
      fakeClock.tick(ledgerUtil.milliseconds.day * 7 + 1)
      state = ledgerNotificationsApi.showEnabledNotifications(state)
      assert(showBackupKeysSpy.calledOnce, 'showBackupKeys should be called once')
    })

    it('second notification (14 days days later [21 days from funds being added])', function () {
      fakeClock.tick(ledgerUtil.milliseconds.day * 14)
      state = ledgerNotificationsApi.showEnabledNotifications(state)
      assert(showBackupKeysSpy.calledOnce, 'showBackupKeys should be called once')
    })

    it('third and subsequent notification occur monthly until backup or opt out. (one day before the month, no notification)', function () {
      fakeClock.tick(ledgerUtil.milliseconds.month - ledgerUtil.milliseconds.day)
      state = ledgerNotificationsApi.showEnabledNotifications(state)
      assert(showBackupKeysSpy.notCalled, 'showBackupKeys should not be called')
    })

    it('third notification after one more day of completing the month', function () {
      fakeClock.tick(ledgerUtil.milliseconds.day)
      state = ledgerNotificationsApi.showEnabledNotifications(state)
      assert(showBackupKeysSpy.calledOnce, 'showBackupKeys should be called once')
    })

    it('second monthly notification (fourth notification)', function () {
      fakeClock.tick(ledgerUtil.milliseconds.month)
      state = ledgerNotificationsApi.showEnabledNotifications(state)
      assert(showBackupKeysSpy.calledOnce, 'showBackupKeys should be called once')
    })

    it('day before the third monthly notification (should not notify)', function () {
      fakeClock.tick(ledgerUtil.milliseconds.month - ledgerUtil.milliseconds.day)
      state = ledgerNotificationsApi.showEnabledNotifications(state)
      assert(showBackupKeysSpy.notCalled, 'showBackupKeys should not be called')
    })
    it('day of the third monthly notification (fifth notification)', function () {
      fakeClock.tick(ledgerUtil.milliseconds.day)
      state = ledgerNotificationsApi.showEnabledNotifications(state)
      assert(showBackupKeysSpy.calledOnce, 'showBackupKeys should be called once')
    })
    it('day before the fourth monthly notification (sixth notification)', function () {
      fakeClock.tick(ledgerUtil.milliseconds.month - ledgerUtil.milliseconds.day)
      state = ledgerNotificationsApi.showEnabledNotifications(state)
      assert(showBackupKeysSpy.notCalled, 'showBackupKeys should not be called')
    })
    it('day of the fourth monthly notification (sixth notification)', function () {
      fakeClock.tick(ledgerUtil.milliseconds.day)
      state = ledgerNotificationsApi.showEnabledNotifications(state)
      assert(showBackupKeysSpy.calledOnce, 'showBackupKeys should be called once')
    })
  })

  describe('onIntervalDynamic', function () {
    let fakeClock, showPromotionNotificationSpy

    before(function () {
      fakeClock = sinon.useFakeTimers()
      showPromotionNotificationSpy = sinon.spy(ledgerNotificationsApi, 'showPromotionNotification')
    })

    afterEach(function () {
      showPromotionNotificationSpy.reset()
    })

    after(function () {
      fakeClock.restore()
      showPromotionNotificationSpy.restore()
    })

    it('empty promotions', function () {
      const result = ledgerNotificationsApi.onIntervalDynamic(defaultAppState)
      assert.deepEqual(result.toJS(), defaultAppState.toJS())
      assert(showPromotionNotificationSpy.notCalled)
    })

    it('promotion was not shown yet', function () {
      const state = defaultAppState
        .setIn(['ledger', 'promotion'], Immutable.fromJS({
          promotionId: '1'
        }))
      const result = ledgerNotificationsApi.onIntervalDynamic(state)
      assert.deepEqual(result.toJS(), state.toJS())
      assert(showPromotionNotificationSpy.notCalled)
    })

    it('promotion was shown, but it is not time yet', function () {
      const state = defaultAppState
        .setIn(['ledger', 'promotion'], Immutable.fromJS({
          promotionId: '1',
          remindTimestamp: 100
        }))
      const result = ledgerNotificationsApi.onIntervalDynamic(state)
      assert.deepEqual(result.toJS(), state.toJS())
      assert(showPromotionNotificationSpy.notCalled)
    })

    it('promotion was shown, but it is not time to re-show it yet', function () {
      fakeClock.tick(0)
      const state = defaultAppState
        .setIn(['ledger', 'promotion'], Immutable.fromJS({
          promotionId: '1',
          remindTimestamp: 100
        }))
      const result = ledgerNotificationsApi.onIntervalDynamic(state)
      assert.deepEqual(result.toJS(), state.toJS())
      assert(showPromotionNotificationSpy.notCalled)
    })

    it('promotion was re-shown', function () {
      fakeClock.tick(800)
      const state = defaultAppState
        .setIn(['ledger', 'promotion'], Immutable.fromJS({
          promotionId: '1',
          remindTimestamp: 700
        }))
      const result = ledgerNotificationsApi.onIntervalDynamic(state)
      const expectedState = state
        .setIn(['ledger', 'promotion', 'remindTimestamp'], -1)
      assert.deepEqual(result.toJS(), expectedState.toJS())
      assert(showPromotionNotificationSpy.calledOnce)
    })
  })

  describe('onDynamicResponse', function () {
    let hideNotificationSpy
    before(function () {
      hideNotificationSpy = sinon.spy(appAction, 'hideNotification')
    })

    afterEach(function () {
      hideNotificationSpy.reset()
    })

    after(function () {
      hideNotificationSpy.restore()
    })

    it('null case', function () {
      ledgerNotificationsApi.onDynamicResponse()
      assert(hideNotificationSpy.notCalled)
    })

    describe('optInPromotion', function () {
      let createTabRequestedSpy

      before(function () {
        createTabRequestedSpy = sinon.spy(appAction, 'createTabRequested')
      })

      afterEach(function () {
        createTabRequestedSpy.reset()
      })

      it('activeWindow is missing', function () {
        ledgerNotificationsApi.onDynamicResponse('msg', 'optInPromotion')
        assert(hideNotificationSpy.calledOnce)
        assert(createTabRequestedSpy.notCalled)
      })

      it('called', function () {
        ledgerNotificationsApi.onDynamicResponse('msg', 'optInPromotion', {id: 1})
        assert(hideNotificationSpy.calledOnce)
        assert(createTabRequestedSpy.calledOnce)
      })
    })

    describe('remindLater', function () {
      let onPromotionRemindSpy

      before(function () {
        onPromotionRemindSpy = sinon.spy(appAction, 'onPromotionRemind')
      })

      afterEach(function () {
        onPromotionRemindSpy.reset()
      })

      after(function () {
        onPromotionRemindSpy.restore()
      })

      it('called', function () {
        ledgerNotificationsApi.onDynamicResponse('msg', 'remindLater')
        assert(hideNotificationSpy.calledOnce)
        assert(onPromotionRemindSpy.calledOnce)
      })
    })
  })

  describe('onPromotionReceived', function () {
    let showPromotionNotificationSpy, fakeClock

    before(function () {
      showPromotionNotificationSpy = sinon.spy(ledgerNotificationsApi, 'showPromotionNotification')
      fakeClock = sinon.useFakeTimers()
    })

    afterEach(function () {
      showPromotionNotificationSpy.reset()
    })

    after(function () {
      showPromotionNotificationSpy.restore()
      fakeClock.restore()
    })

    it('there is no promotion', function () {
      ledgerNotificationsApi.onPromotionReceived(defaultAppState)
      assert(showPromotionNotificationSpy.notCalled)
    })

    it('promotion was already shown', function () {
      const state = defaultAppState
        .setIn(['ledger', 'promotion', 'activeState'], 'disabledWallet')
        .setIn(['ledger', 'promotion', 'stateWallet'], Immutable.fromJS({
          disabledWallet: {
            firstShowTimestamp: 1
          }
        }))
      ledgerNotificationsApi.onPromotionReceived(state)
      assert(showPromotionNotificationSpy.notCalled)
    })

    it('show promotion', function () {
      fakeClock.tick(6000)
      const state = defaultAppState
        .setIn(['ledger', 'promotion', 'activeState'], 'disabledWallet')
        .setIn(['ledger', 'promotion', 'stateWallet'], Immutable.fromJS({
          disabledWallet: {
            notification: {
              message: 'Hello'
            }
          }
        }))
      const result = ledgerNotificationsApi.onPromotionReceived(state)
      const expectedState = state
        .setIn(['ledger', 'promotion', 'stateWallet', 'disabledWallet', 'notification', 'firstShowTimestamp'], 6000)
      assert.deepEqual(result.toJS(), expectedState.toJS())
      assert(showPromotionNotificationSpy.notCalled)
    })
  })

  describe('showPromotionNotification', function () {
    let showNotificationSpy

    const state = defaultAppState
      .setIn(['ledger', 'promotion', 'activeState'], 'disabledWallet')
      .setIn(['ledger', 'promotion', 'stateWallet'], Immutable.fromJS({
        disabledWallet: {
          notification: {
            message: 'Hello'
          }
        }
      }))

    before(function () {
      showNotificationSpy = sinon.spy(appAction, 'showNotification')
    })

    afterEach(function () {
      showNotificationSpy.reset()
    })

    after(function () {
      showNotificationSpy.restore()
    })

    it('no promotion', function () {
      ledgerNotificationsApi.showPromotionNotification(defaultAppState)
      assert(showNotificationSpy.notCalled)
    })

    it('notifications disabled while payments are enabled', function () {
      paymentsEnabled = true
      paymentsNotifications = false
      ledgerNotificationsApi.showPromotionNotification(state)
      assert(showNotificationSpy.notCalled)
      paymentsNotifications = true
    })

    it('payments disabled, notification is shown', function () {
      ledgerNotificationsApi.showPromotionNotification(state)
      assert(showNotificationSpy.calledOnce)
    })

    it('promotions are disabled, notification is not shown', function () {
      paymentsAllowPromotions = false
      ledgerNotificationsApi.showPromotionNotification(state)
      assert(showNotificationSpy.notCalled)
      paymentsAllowPromotions = true
    })

    it('notification is shown', function () {
      ledgerNotificationsApi.showPromotionNotification(state)
      assert(showNotificationSpy.calledOnce)
    })

    it('we set global notification', function () {
      const notification = state
        .getIn(['ledger', 'promotion', 'stateWallet', 'disabledWallet', 'notification'])
        .set('position', 'global')
      ledgerNotificationsApi.showPromotionNotification(state)
      assert(showNotificationSpy.withArgs(notification.toJS()).calledOnce)
    })
  })

  describe('removePromotionNotification', function () {
    let hideNotificationSpy

    const state = defaultAppState
      .setIn(['ledger', 'promotion', 'activeState'], 'disabledWallet')
      .setIn(['ledger', 'promotion', 'stateWallet'], Immutable.fromJS({
        disabledWallet: {
          notification: {
            message: 'Hello'
          }
        }
      }))

    before(function () {
      hideNotificationSpy = sinon.spy(appAction, 'hideNotification')
    })

    afterEach(function () {
      hideNotificationSpy.reset()
    })

    after(function () {
      hideNotificationSpy.restore()
    })

    it('no promotion', function () {
      ledgerNotificationsApi.removePromotionNotification(defaultAppState)
      assert(hideNotificationSpy.notCalled)
    })

    it('notification is shown', function () {
      ledgerNotificationsApi.removePromotionNotification(state)
      assert(hideNotificationSpy.calledOnce)
    })
  })

  describe('sufficientBalanceToReconcile', function () {
    it('null case', function () {
      const result = ledgerNotificationsApi.sufficientBalanceToReconcile(defaultAppState)
      assert.equal(result, false)
    })

    it('balance is bellow budget', function () {
      const state = defaultAppState.setIn(['ledger', 'info', 'balance'], 10)
      const result = ledgerNotificationsApi.sufficientBalanceToReconcile(state)
      assert.equal(result, false)
    })

    it('balance is the same as budget', function () {
      const state = defaultAppState.setIn(['ledger', 'info', 'balance'], 25)
      const result = ledgerNotificationsApi.sufficientBalanceToReconcile(state)
      assert.equal(result, true)
    })

    it('balance is above budget', function () {
      const state = defaultAppState.setIn(['ledger', 'info', 'balance'], 30)
      const result = ledgerNotificationsApi.sufficientBalanceToReconcile(state)
      assert.equal(result, true)
    })

    it('default budget', function () {
      paymentsContributionAmount = null
      const state = defaultAppState.setIn(['ledger', 'info', 'balance'], 30)
      const result = ledgerNotificationsApi.sufficientBalanceToReconcile(state)
      assert.equal(result, true)
      paymentsContributionAmount = 25
    })
  })

  describe('hasFunded', function () {
    it('null case', function () {
      paymentsEnabled = true
      const result = ledgerNotificationsApi.hasFunded(defaultAppState)
      assert.equal(result, false)
    })
    it('has never funded', function () {
      paymentsEnabled = true
      const state = defaultAppState.setIn(['ledger', 'info', 'userHasFunded'], false)
      const result = ledgerNotificationsApi.hasFunded(state)
      assert.equal(result, false)
    })
    it('user has funded', function () {
      paymentsEnabled = true
      const state = defaultAppState.setIn(['ledger', 'info', 'userHasFunded'], true)
      const result = ledgerNotificationsApi.hasFunded(state)
      assert.equal(result, true)
    })
  })

  describe('shouldShowAddFundsModal', function () {
    it('false when seed is corrupted', function () {
      const state = defaultAppState.setIn(['ledger', 'about', 'status'], ledgerStatuses.CORRUPTED_SEED)
      const result = ledgerNotificationsApi.shouldShowAddFundsModal(state)
      assert.equal(result, false)
    })
    it('false when payments server is unresponsive', function () {
      const state = defaultAppState.setIn(['ledger', 'about', 'status'], ledgerStatuses.SERVER_PROBLEM)
      const result = ledgerNotificationsApi.shouldShowAddFundsModal(state)
      assert.equal(result, false)
    })
    it('true when status is blank', function () {
      const state = defaultAppState.setIn(['ledger', 'about', 'status'], '')
      const result = ledgerNotificationsApi.shouldShowAddFundsModal(state)
      assert(result)
    })
    it('true when status is a non-error case', function () {
      const state = defaultAppState.setIn(['ledger', 'about', 'status'], ledgerStatuses.IN_PROGRESS)
      const result = ledgerNotificationsApi.shouldShowAddFundsModal(state)
      assert(result)
    })
  })

  // result will always be the amount of time until the -next- notification
  describe('getNextBackupNotification', function () {
    it('user hasn\'t received any notification yet', function () {
      const result = ledgerNotificationsApi.getNextBackupNotification(defaultAppState, aboutPreferencesState
        .getPreferencesProp(defaultAppState, 'backupNotifyCount') || 0, [1 * ledgerUtil.milliseconds.day, 2 * ledgerUtil.milliseconds.day])
      assert.equal(result, ledgerUtil.milliseconds.day)
    })
    it('user is going to receive third notification with 2 intervals specified', function () {
      const state = aboutPreferencesState.setPreferencesProp(defaultAppState, 'backupNotifyCount', 2)
      const result = ledgerNotificationsApi.getNextBackupNotification(state, aboutPreferencesState
        .getPreferencesProp(state, 'backupNotifyCount') || 0, [2 * ledgerUtil.milliseconds.day, 4 * ledgerUtil.milliseconds.day])
      assert.equal(result, (ledgerUtil.milliseconds.month))
    })
    it('user is going to receive third notification with 3 intervals specified', function () {
      const state = aboutPreferencesState.setPreferencesProp(defaultAppState, 'backupNotifyCount', 2)
      const result = ledgerNotificationsApi.getNextBackupNotification(state, aboutPreferencesState
        .getPreferencesProp(state, 'backupNotifyCount') || 0, [2 * ledgerUtil.milliseconds.day, 4 * ledgerUtil.milliseconds.day, 10 * ledgerUtil.milliseconds.day])
      assert.equal(result, (ledgerUtil.milliseconds.day * 10))
    })
    it('user is going to receive third notification with 6 intervals specified', function () {
      const state = aboutPreferencesState.setPreferencesProp(defaultAppState, 'backupNotifyCount', 2)
      const result = ledgerNotificationsApi.getNextBackupNotification(state, aboutPreferencesState
        .getPreferencesProp(state, 'backupNotifyCount') || 0, [2 * ledgerUtil.milliseconds.day, 4 * ledgerUtil.milliseconds.day, 7 * ledgerUtil.milliseconds.day, 10 * ledgerUtil.milliseconds.day, 11 * ledgerUtil.milliseconds.day, 20 * ledgerUtil.milliseconds.day])
      assert.equal(result, (ledgerUtil.milliseconds.day * 7))
    })
    it('user is going to receive fifth notification with 3 intervals specified', function () {
      const state = aboutPreferencesState.setPreferencesProp(defaultAppState, 'backupNotifyCount', 4)
      const result = ledgerNotificationsApi.getNextBackupNotification(state, aboutPreferencesState
        .getPreferencesProp(state, 'backupNotifyCount') || 0, [100 * ledgerUtil.milliseconds.day, 20 * ledgerUtil.milliseconds.day, 10 * ledgerUtil.milliseconds.day])
      assert.equal(result, (ledgerUtil.milliseconds.month))
    })
    it('user is going to receive fifth notification with 10 intervals specified', function () {
      const state = aboutPreferencesState.setPreferencesProp(defaultAppState, 'backupNotifyCount', 4)
      const result = ledgerNotificationsApi.getNextBackupNotification(state, aboutPreferencesState
        .getPreferencesProp(state, 'backupNotifyCount') || 0, [100 * ledgerUtil.milliseconds.day, 20 * ledgerUtil.milliseconds.day, 10 * ledgerUtil.milliseconds.day, 7 * ledgerUtil.milliseconds.day, 23 * ledgerUtil.milliseconds.day, 2 * ledgerUtil.milliseconds.day, 8 * ledgerUtil.milliseconds.day, 9 * ledgerUtil.milliseconds.day, 11 * ledgerUtil.milliseconds.day, 70 * ledgerUtil.milliseconds.day])
      assert.equal(result, (ledgerUtil.milliseconds.day * 23))
    })
  })
})
