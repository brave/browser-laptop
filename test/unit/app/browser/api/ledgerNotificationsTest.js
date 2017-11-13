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
  let ledgerApi
  let ledgerNotificationsApi

  let paymentsEnabled
  let paymentsNotifications
  let paymentsMinVisitTime = 5000

  const defaultAppState = Immutable.fromJS({
    ledger: {},
    migrations: {}
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
      getSetting: (settingKey, settingsCollection, value) => {
        switch (settingKey) {
          case settings.PAYMENTS_ENABLED:
            return paymentsEnabled
          case settings.PAYMENTS_NOTIFICATIONS:
            return paymentsNotifications
          case settings.PAYMENTS_MINIMUM_VISIT_TIME:
            return paymentsMinVisitTime
        }
        return false
      }
    })

    fakeClock = sinon.useFakeTimers()
    ledgerApi = require('../../../../../app/browser/api/ledger')
    ledgerNotificationsApi = require('../../../../../app/browser/api/ledgerNotifications')
  })

  after(function () {
    fakeClock.restore()
    mockery.deregisterAll()
    mockery.disable()
  })

  describe('init', function () {
    let onIntervalSpy
    beforeEach(function () {
      onIntervalSpy = sinon.spy(ledgerNotificationsApi, 'onInterval')
    })
    afterEach(function () {
      onIntervalSpy.restore()
    })
    it('does not immediately call notifications.onInterval', function () {
      ledgerNotificationsApi.init(defaultAppState)
      assert(onIntervalSpy.notCalled)
    })
    it('calls notifications.onInterval after interval', function () {
      fakeClock.tick(0)
      ledgerNotificationsApi.init(defaultAppState)
      fakeClock.tick(ledgerNotificationsApi.getPollingInterval())
      assert(onIntervalSpy.calledOnce)
    })
    it('assigns a value to timeout', function () {
      ledgerNotificationsApi.setTimeOut(0)
      ledgerNotificationsApi.init(defaultAppState)
      assert(ledgerNotificationsApi.getTimeOut(0))
    })
  })

  describe('onLaunch', function () {
    let showBraveWalletUpdatedStub
    let transitionWalletToBatStub
    beforeEach(function () {
      showBraveWalletUpdatedStub = sinon.stub(ledgerNotificationsApi, 'showBraveWalletUpdated')
      transitionWalletToBatStub = sinon.stub(ledgerApi, 'transitionWalletToBat')
    })
    afterEach(function () {
      showBraveWalletUpdatedStub.restore()
      transitionWalletToBatStub.restore()
    })

    describe('with BAT Mercury', function () {
      let ledgerStateWithBalance

      before(function () {
        ledgerStateWithBalance = defaultAppState.merge(Immutable.fromJS({
          ledger: {
            info: {
              balance: 200
            }
          },
          firstRunTimestamp: 12345,
          migrations: {
            batMercuryTimestamp: 12345,
            btc2BatTimestamp: 12345,
            btc2BatNotifiedTimestamp: 12345
          }
        }))
      })

      describe('with wallet update message', function () {
        describe('when payment notifications are disabled', function () {
          before(function () {
            paymentsEnabled = true
            paymentsNotifications = false
          })
          it('does not notify the user', function () {
            const targetSession = ledgerStateWithBalance
              .setIn(['migrations', 'batMercuryTimestamp'], 32145)
              .setIn(['migrations', 'btc2BatTimestamp'], 54321)
              .setIn(['migrations', 'btc2BatNotifiedTimestamp'], 32145)
            ledgerNotificationsApi.onLaunch(targetSession)
            assert(showBraveWalletUpdatedStub.notCalled)
          })
        })

        describe('when payments are disabled', function () {
          before(function () {
            paymentsEnabled = false
            paymentsNotifications = true
          })
          it('does not notify the user', function () {
            const targetSession = ledgerStateWithBalance
              .setIn(['migrations', 'batMercuryTimestamp'], 32145)
              .setIn(['migrations', 'btc2BatTimestamp'], 54321)
              .setIn(['migrations', 'btc2BatNotifiedTimestamp'], 32145)
            ledgerNotificationsApi.onLaunch(targetSession)
            assert(showBraveWalletUpdatedStub.notCalled)
          })
        })

        describe('user does not have funds', function () {
          before(function () {
            paymentsEnabled = true
            paymentsNotifications = true
          })
          it('does not notify the user', function () {
            const targetSession = ledgerStateWithBalance
              .setIn(['ledger', 'info', 'balance'], 0)
              .setIn(['migrations', 'batMercuryTimestamp'], 32145)
              .setIn(['migrations', 'btc2BatTimestamp'], 54321)
              .setIn(['migrations', 'btc2BatNotifiedTimestamp'], 32145)
            ledgerNotificationsApi.onLaunch(targetSession)
            assert(showBraveWalletUpdatedStub.notCalled)
          })
        })

        describe('user did not have a session before BAT Mercury', function () {
          before(function () {
            paymentsEnabled = true
            paymentsNotifications = true
          })
          it('does not notify the user', function () {
            ledgerNotificationsApi.onLaunch(ledgerStateWithBalance)
            assert(showBraveWalletUpdatedStub.notCalled)
          })
        })

        describe('user has not had the wallet transitioned from BTC to BAT', function () {
          before(function () {
            paymentsEnabled = true
            paymentsNotifications = true
          })
          it('does not notify the user', function () {
            const targetSession = ledgerStateWithBalance
              .setIn(['migrations', 'batMercuryTimestamp'], 32145)
              .setIn(['migrations', 'btc2BatTimestamp'], 32145)
              .setIn(['migrations', 'btc2BatNotifiedTimestamp'], 32145)
            ledgerNotificationsApi.onLaunch(targetSession)
            assert(showBraveWalletUpdatedStub.notCalled)
          })
        })

        describe('user has already seen the notification', function () {
          before(function () {
            paymentsEnabled = true
            paymentsNotifications = true
          })
          it('does not notify the user', function () {
            const targetSession = ledgerStateWithBalance
              .setIn(['migrations', 'batMercuryTimestamp'], 32145)
              .setIn(['migrations', 'btc2BatTimestamp'], 54321)
              .setIn(['migrations', 'btc2BatNotifiedTimestamp'], 54321)
            ledgerNotificationsApi.onLaunch(targetSession)
            assert(showBraveWalletUpdatedStub.notCalled)
          })
        })

        describe('when payment notifications are enabled, payments are enabled, user has funds, user had wallet before BAT Mercury, wallet has been transitioned, and user not been shown message yet', function () {
          before(function () {
            paymentsEnabled = true
            paymentsNotifications = true
          })
          it('notifies the user', function () {
            const targetSession = ledgerStateWithBalance
              .setIn(['migrations', 'batMercuryTimestamp'], 32145)
              .setIn(['migrations', 'btc2BatTimestamp'], 54321)
              .setIn(['migrations', 'btc2BatNotifiedTimestamp'], 32145)
            ledgerNotificationsApi.onLaunch(targetSession)
            assert(showBraveWalletUpdatedStub.calledOnce)
          })
        })
      })

      describe('with the wallet transition from bitcoin to BAT', function () {
        describe('when payment notifications are disabled', function () {
          before(function () {
            paymentsEnabled = true
            paymentsNotifications = false
          })
          it('calls ledger.transitionWalletToBat', function () {
            const targetSession = ledgerStateWithBalance
              .setIn(['migrations', 'batMercuryTimestamp'], 32145)
              .setIn(['migrations', 'btc2BatTimestamp'], 32145)
            ledgerNotificationsApi.onLaunch(targetSession)
            assert(transitionWalletToBatStub.calledOnce)
          })
        })

        describe('when payments are disabled', function () {
          before(function () {
            paymentsEnabled = false
            paymentsNotifications = true
          })
          it('does not call ledger.transitionWalletToBat', function () {
            ledgerNotificationsApi.onLaunch(ledgerStateWithBalance)
            assert(transitionWalletToBatStub.notCalled)
          })
        })

        describe('user does not have funds', function () {
          before(function () {
            paymentsEnabled = true
            paymentsNotifications = true
          })
          it('calls ledger.transitionWalletToBat', function () {
            const ledgerStateWithoutBalance = ledgerStateWithBalance
              .setIn(['ledger', 'info', 'balance'], 0)
              .setIn(['migrations', 'batMercuryTimestamp'], 32145)
              .setIn(['migrations', 'btc2BatTimestamp'], 32145)
            ledgerNotificationsApi.onLaunch(ledgerStateWithoutBalance)
            assert(transitionWalletToBatStub.calledOnce)
          })
        })

        describe('user did not have a session before BAT Mercury', function () {
          before(function () {
            paymentsEnabled = true
            paymentsNotifications = true
          })
          it('does not call ledger.transitionWalletToBat', function () {
            ledgerNotificationsApi.onLaunch(ledgerStateWithBalance)
            assert(transitionWalletToBatStub.notCalled)
          })
        })

        describe('user has already upgraded', function () {
          before(function () {
            paymentsEnabled = true
            paymentsNotifications = true
          })
          it('does not call ledger.transitionWalletToBat', function () {
            const ledgerStateSeenNotification = ledgerStateWithBalance
              .setIn(['migrations', 'batMercuryTimestamp'], 32145)
              .setIn(['migrations', 'btc2BatTimestamp'], 54321)
            ledgerNotificationsApi.onLaunch(ledgerStateSeenNotification)
            assert(transitionWalletToBatStub.notCalled)
          })
        })

        describe('when payments are enabled and user had wallet before BAT Mercury', function () {
          before(function () {
            paymentsEnabled = true
            paymentsNotifications = true
          })
          it('calls ledger.transitionWalletToBat', function () {
            const targetSession = ledgerStateWithBalance
              .setIn(['migrations', 'batMercuryTimestamp'], 32145)
              .setIn(['migrations', 'btc2BatTimestamp'], 32145)
            ledgerNotificationsApi.onLaunch(targetSession)
            assert(transitionWalletToBatStub.calledOnce)
          })
        })
      })
    })
  })
})
