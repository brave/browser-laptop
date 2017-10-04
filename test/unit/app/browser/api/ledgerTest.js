/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

/* global describe, it, after, before, beforeEach, afterEach */
const Immutable = require('immutable')
const assert = require('assert')
const sinon = require('sinon')
const mockery = require('mockery')
const settings = require('../../../../../js/constants/settings')

const defaultAppState = Immutable.fromJS({
  ledger: {
  }
})

describe('ledger api unit tests', function () {
  let ledgerApi
  let paymentsEnabled
  let paymentsNotifications

  before(function () {
    this.clock = sinon.useFakeTimers()
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
    mockery.registerMock('../../../js/settings', {
      getSetting: (settingKey, settingsCollection, value) => {
        if (settingKey === settings.PAYMENTS_ENABLED) {
          return paymentsEnabled
        }
        if (settingKey === settings.PAYMENTS_NOTIFICATIONS) {
          return paymentsNotifications
        }
        return false
      }
    })
    ledgerApi = require('../../../../../app/browser/api/ledger')
  })
  after(function () {
    mockery.disable()
    this.clock.restore()
  })

  describe('initialize', function () {
    let notificationsInitSpy
    beforeEach(function () {
      notificationsInitSpy = sinon.spy(ledgerApi.notifications, 'init')
    })
    afterEach(function () {
      notificationsInitSpy.restore()
    })
    it('calls notifications.init', function () {
      ledgerApi.initialize(defaultAppState, true)
      assert(notificationsInitSpy.calledOnce)
    })
  })

  describe('notifications', function () {
    describe('init', function () {
      let onLaunchSpy
      let onIntervalSpy
      beforeEach(function () {
        onLaunchSpy = sinon.spy(ledgerApi.notifications, 'onLaunch')
        onIntervalSpy = sinon.spy(ledgerApi.notifications, 'onInterval')
      })
      afterEach(function () {
        onLaunchSpy.restore()
        onIntervalSpy.restore()
      })
      it('does not immediately call notifications.onInterval', function () {
        ledgerApi.notifications.init(defaultAppState)
        assert(onIntervalSpy.notCalled)
      })
      it('calls notifications.onInterval after interval', function () {
        this.clock.tick(0)
        ledgerApi.notifications.init(defaultAppState)
        this.clock.tick(ledgerApi.notifications.pollingInterval)
        assert(onIntervalSpy.calledOnce)
      })
      it('assigns a value to notifications.timeout', function () {
        ledgerApi.notifications.timeout = 0
        ledgerApi.notifications.init(defaultAppState)
        assert(ledgerApi.notifications.timeout)
      })
      it('calls notifications.onLaunch', function () {
        ledgerApi.notifications.init(defaultAppState)
        assert(onLaunchSpy.withArgs(defaultAppState).calledOnce)
      })
    })

    describe('onLaunch', function () {
      let showBraveWalletUpdatedSpy
      beforeEach(function () {
        showBraveWalletUpdatedSpy = sinon.spy(ledgerApi.notifications, 'showBraveWalletUpdated')
      })
      afterEach(function () {
        showBraveWalletUpdatedSpy.restore()
      })

      describe('with the BAT Mercury wallet update message', function () {
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
              btcToBatTimestamp: 12345,
              btcToBatNotifiedTimestamp: 12345
            }
          }))
        })

        describe('when payment notifications are disabled', function () {
          before(function () {
            paymentsEnabled = true
            paymentsNotifications = false
          })
          it('does not notify the user', function () {
            ledgerApi.notifications.onLaunch(ledgerStateWithBalance)
            assert(showBraveWalletUpdatedSpy.notCalled)
          })
        })

        describe('when payments are disabled', function () {
          before(function () {
            paymentsEnabled = false
            paymentsNotifications = true
          })
          it('does not notify the user', function () {
            ledgerApi.notifications.onLaunch(ledgerStateWithBalance)
            assert(showBraveWalletUpdatedSpy.notCalled)
          })
        })

        describe('user does not have funds', function () {
          before(function () {
            paymentsEnabled = true
            paymentsNotifications = true
          })
          it('does not notify the user', function () {
            const ledgerStateWithoutBalance = ledgerStateWithBalance.setIn(['ledger', 'info', 'balance'], 0)
            ledgerApi.notifications.onLaunch(ledgerStateWithoutBalance)
            assert(showBraveWalletUpdatedSpy.notCalled)
          })
        })

        describe('user did not have a session before BAT Mercury', function () {
          before(function () {
            paymentsEnabled = true
            paymentsNotifications = true
          })
          it('does not notify the user', function () {
            ledgerApi.notifications.onLaunch(ledgerStateWithBalance)
            assert(showBraveWalletUpdatedSpy.notCalled)
          })
        })

        describe('user has already seen the notification', function () {
          before(function () {
            paymentsEnabled = true
            paymentsNotifications = true
          })
          it('does not notify the user', function () {
            const ledgerStateSeenNotification = ledgerStateWithBalance
              .setIn(['migrations', 'btcToBatTimestamp'], 32145)
              .setIn(['migrations', 'btcToBatNotifiedTimestamp'], 54321)
            ledgerApi.notifications.onLaunch(ledgerStateSeenNotification)
            assert(showBraveWalletUpdatedSpy.notCalled)
          })
        })

        describe('when payment notifications are enabled, payments are enabled, user has funds, user had wallet before BAT Mercury, and user not been shown message yet', function () {
          before(function () {
            paymentsEnabled = true
            paymentsNotifications = true
          })
          it('notifies the user', function () {
            const targetSession = ledgerStateWithBalance
              .setIn(['migrations', 'btcToBatTimestamp'], 32145)
              .setIn(['migrations', 'btcToBatNotifiedTimestamp'], 32145)
            ledgerApi.notifications.onLaunch(targetSession)
            assert(showBraveWalletUpdatedSpy.calledOnce)
          })
        })
      })
    })
  })
})
