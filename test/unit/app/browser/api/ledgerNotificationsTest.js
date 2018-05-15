/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

/* global describe, it, after, before, beforeEach, afterEach */
const Immutable = require('immutable')
const assert = require('assert')
const sinon = require('sinon')
const mockery = require('mockery')
const settings = require('../../../../../js/constants/settings')

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
      ledgerNotificationsApi.onInterval(defaultAppState)
      assert(showDisabledNotificationsSpy.notCalled)
      assert(showEnabledNotificationsSpy.calledOnce)
      assert(onIntervalDynamicSpy.calledOnce)
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
})
