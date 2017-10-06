/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

/* global describe, it, after, before, beforeEach, afterEach */
const Immutable = require('immutable')
const assert = require('assert')
const sinon = require('sinon')
const mockery = require('mockery')
const settings = require('../../../../../js/constants/settings')
const appActions = require('../../../../../js/actions/appActions')

const defaultAppState = Immutable.fromJS({
  ledger: {
  }
})

describe('ledger api unit tests', function () {
  let ledgerApi
  let paymentsEnabled
  let paymentsNotifications
  let ledgerClient
  let ledgerTransitionSpy
  let onBitcoinToBatTransitionedSpy

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
    mockery.registerMock('../../../js/actions/appActions', appActions)
    onBitcoinToBatTransitionedSpy = sinon.spy(appActions, 'onBitcoinToBatTransitioned')

    // ledger client stubbing
    ledgerClient = sinon.stub()
    const lc = {
      sync: function (callback) { return false },
      getBraveryProperties: function () {
        return {
          fee: {
            amount: 1,
            currency: 'USD'
          }
        }
      },
      getWalletProperties: function (amount, currency, callback) {
        callback(null, {})
      },
      transition: function (paymentId, callback) {
        callback()
      },
      properties: {
        wallet: {
          paymentId: 12345
        }
      },
      state: {
        transactions: []
      }
    }
    ledgerClient.prototype.boolion = function (value) { return false }
    ledgerClient.prototype.getWalletPassphrase = function (state) {}
    ledgerTransitionSpy = sinon.spy(lc, 'transition')
    ledgerClient.returns(lc)
    mockery.registerMock('bat-client', ledgerClient)

    // once everything is stubbed, load the ledger
    ledgerApi = require('../../../../../app/browser/api/ledger')
  })
  after(function () {
    onBitcoinToBatTransitionedSpy.restore()
    this.clock.restore()
    mockery.deregisterAll()
    mockery.disable()
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

  describe('onInitRead', function () {
    let onLaunchSpy
    beforeEach(function () {
      onLaunchSpy = sinon.spy(ledgerApi.notifications, 'onLaunch')
    })
    afterEach(function () {
      onLaunchSpy.restore()
    })
    it('calls notifications.onLaunch', function () {
      ledgerApi.onInitRead(defaultAppState, {
        paymentInfo: {
        },
        properties: {
          wallet: {
            paymentId: 12345
          }
        }
      })
      assert(onLaunchSpy.calledOnce)
    })
  })

  describe('transitionWalletToBat', function () {
    before(function () {
      const batState = ledgerApi.onBootStateFile(defaultAppState)
      ledgerTransitionSpy.reset()
      onBitcoinToBatTransitionedSpy.reset()
      ledgerClient.reset()
      ledgerApi.transitionWalletToBat(batState)
    })
    it('creates a new instance of ledgerClient', function () {
      assert(ledgerClient.calledOnce)
    })
    it('calls client.transition', function () {
      assert(ledgerTransitionSpy.calledOnce)
    })
    it('calls AppActions.onBitcoinToBatTransitioned', function () {
      assert(onBitcoinToBatTransitionedSpy.calledOnce)
    })
  })

  describe('notifications', function () {
    describe('init', function () {
      let onIntervalSpy
      beforeEach(function () {
        onIntervalSpy = sinon.spy(ledgerApi.notifications, 'onInterval')
      })
      afterEach(function () {
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
    })

    describe('onLaunch', function () {
      let showBraveWalletUpdatedSpy
      let transitionWalletToBatSpy
      beforeEach(function () {
        showBraveWalletUpdatedSpy = sinon.spy(ledgerApi.notifications, 'showBraveWalletUpdated')
        transitionWalletToBatSpy = sinon.spy(ledgerApi, 'transitionWalletToBat')
      })
      afterEach(function () {
        showBraveWalletUpdatedSpy.restore()
        transitionWalletToBatSpy.restore()
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
              btcToBatTimestamp: 12345,
              btcToBatNotifiedTimestamp: 12345
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
                .setIn(['migrations', 'btcToBatTimestamp'], 54321)
                .setIn(['migrations', 'btcToBatNotifiedTimestamp'], 32145)
              ledgerApi.notifications.onLaunch(targetSession)
              assert(showBraveWalletUpdatedSpy.notCalled)
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
                .setIn(['migrations', 'btcToBatTimestamp'], 54321)
                .setIn(['migrations', 'btcToBatNotifiedTimestamp'], 32145)
              ledgerApi.notifications.onLaunch(targetSession)
              assert(showBraveWalletUpdatedSpy.notCalled)
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
                .setIn(['migrations', 'btcToBatTimestamp'], 54321)
                .setIn(['migrations', 'btcToBatNotifiedTimestamp'], 32145)
              ledgerApi.notifications.onLaunch(targetSession)
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

          describe('user has not had the wallet transitioned from BTC to BAT', function () {
            before(function () {
              paymentsEnabled = true
              paymentsNotifications = true
            })
            it('does not notify the user', function () {
              const targetSession = ledgerStateWithBalance
                .setIn(['migrations', 'batMercuryTimestamp'], 32145)
                .setIn(['migrations', 'btcToBatTimestamp'], 32145)
                .setIn(['migrations', 'btcToBatNotifiedTimestamp'], 32145)
              ledgerApi.notifications.onLaunch(targetSession)
              assert(showBraveWalletUpdatedSpy.notCalled)
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
                .setIn(['migrations', 'btcToBatTimestamp'], 54321)
                .setIn(['migrations', 'btcToBatNotifiedTimestamp'], 54321)
              ledgerApi.notifications.onLaunch(targetSession)
              assert(showBraveWalletUpdatedSpy.notCalled)
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
                .setIn(['migrations', 'btcToBatTimestamp'], 54321)
                .setIn(['migrations', 'btcToBatNotifiedTimestamp'], 32145)
              ledgerApi.notifications.onLaunch(targetSession)
              assert(showBraveWalletUpdatedSpy.calledOnce)
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
                .setIn(['migrations', 'btcToBatTimestamp'], 32145)
              ledgerApi.notifications.onLaunch(targetSession)
              assert(transitionWalletToBatSpy.calledOnce)
            })
          })

          describe('when payments are disabled', function () {
            before(function () {
              paymentsEnabled = false
              paymentsNotifications = true
            })
            it('does not call ledger.transitionWalletToBat', function () {
              ledgerApi.notifications.onLaunch(ledgerStateWithBalance)
              assert(transitionWalletToBatSpy.notCalled)
            })
          })

          describe('user does not have funds', function () {
            before(function () {
              paymentsEnabled = true
              paymentsNotifications = true
            })
            it('does not call ledger.transitionWalletToBat', function () {
              const ledgerStateWithoutBalance = ledgerStateWithBalance
                .setIn(['ledger', 'info', 'balance'], 0)
                .setIn(['migrations', 'batMercuryTimestamp'], 32145)
                .setIn(['migrations', 'btcToBatTimestamp'], 32145)
              ledgerApi.notifications.onLaunch(ledgerStateWithoutBalance)
              assert(transitionWalletToBatSpy.notCalled)
            })
          })

          describe('user did not have a session before BAT Mercury', function () {
            before(function () {
              paymentsEnabled = true
              paymentsNotifications = true
            })
            it('does not call ledger.transitionWalletToBat', function () {
              ledgerApi.notifications.onLaunch(ledgerStateWithBalance)
              assert(transitionWalletToBatSpy.notCalled)
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
                .setIn(['migrations', 'btcToBatTimestamp'], 54321)
              ledgerApi.notifications.onLaunch(ledgerStateSeenNotification)
              assert(transitionWalletToBatSpy.notCalled)
            })
          })

          describe('when payment notifications are enabled, payments are enabled, user has funds, user had wallet before BAT Mercury, and user not been shown message yet', function () {
            before(function () {
              paymentsEnabled = true
              paymentsNotifications = true
            })
            it('calls ledger.transitionWalletToBat', function () {
              const targetSession = ledgerStateWithBalance
                .setIn(['migrations', 'batMercuryTimestamp'], 32145)
                .setIn(['migrations', 'btcToBatTimestamp'], 32145)
              ledgerApi.notifications.onLaunch(targetSession)
              assert(transitionWalletToBatSpy.calledOnce)
            })
          })
        })
      })
    })
  })
})
