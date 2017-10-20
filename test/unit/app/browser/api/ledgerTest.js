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
  ledger: {},
  migrations: {}
})

describe('ledger api unit tests', function () {
  let ledgerApi
  let paymentsEnabled
  let paymentsNotifications
  let isBusy = false
  let ledgerClient

  // spies
  let ledgerTransitionSpy
  let ledgerTransitionedSpy
  let onBitcoinToBatTransitionedSpy
  let onLedgerCallbackSpy
  let onBitcoinToBatBeginTransitionSpy

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
    onLedgerCallbackSpy = sinon.spy(appActions, 'onLedgerCallback')
    onBitcoinToBatBeginTransitionSpy = sinon.spy(appActions, 'onBitcoinToBatBeginTransition')

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
      getPaymentId: function () {
        return 'payementIdGoesHere'
      },
      properties: {
        wallet: {
          paymentId: 12345
        }
      },
      transitioned: function () {
        return {}
      },
      state: {
        transactions: []
      },
      busyP: function () {
        return isBusy
      }
    }
    ledgerClient.prototype.boolion = function (value) { return false }
    ledgerClient.prototype.getWalletPassphrase = function (state) {}
    ledgerTransitionSpy = sinon.spy(lc, 'transition')
    ledgerTransitionedSpy = sinon.spy(lc, 'transitioned')
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
    describe('when client is not busy', function () {
      before(function () {
        const batState = ledgerApi.onBootStateFile(defaultAppState)
        ledgerTransitionSpy.reset()
        onBitcoinToBatTransitionedSpy.reset()
        onLedgerCallbackSpy.reset()
        ledgerTransitionedSpy.reset()
        onBitcoinToBatBeginTransitionSpy.reset()
        ledgerClient.reset()
        isBusy = false
        ledgerApi.transitionWalletToBat(batState)
      })
      it('creates a new instance of ledgerClient', function () {
        assert(ledgerClient.calledOnce)
      })
      it('calls AppActions.onBitcoinToBatBeginTransition', function () {
        assert(onBitcoinToBatBeginTransitionSpy.calledOnce)
      })
      it('calls client.transition', function () {
        assert(ledgerTransitionSpy.calledOnce)
      })
      describe('when transition completes', function () {
        it('calls client.transitioned', function () {
          assert(ledgerTransitionedSpy.calledOnce)
        })
        it('calls AppActions.onLedgerCallback', function () {
          assert(onLedgerCallbackSpy.calledOnce)
        })
        it('calls AppActions.onBitcoinToBatTransitioned', function () {
          assert(onBitcoinToBatTransitionedSpy.calledOnce)
        })
      })
    })
    describe('when client is busy', function () {
      before(function () {
        const batState = ledgerApi.onBootStateFile(defaultAppState)
        ledgerTransitionSpy.reset()
        onBitcoinToBatTransitionedSpy.reset()
        onLedgerCallbackSpy.reset()
        ledgerTransitionedSpy.reset()
        onBitcoinToBatBeginTransitionSpy.reset()
        ledgerClient.reset()
        isBusy = true
        ledgerApi.transitionWalletToBat(batState)
      })
      it('does not call AppActions.onBitcoinToBatBeginTransition', function () {
        assert(onBitcoinToBatBeginTransitionSpy.notCalled)
      })
      it('does not call client.transition', function () {
        assert(ledgerTransitionSpy.notCalled)
      })
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
                .setIn(['migrations', 'btc2BatTimestamp'], 54321)
                .setIn(['migrations', 'btc2BatNotifiedTimestamp'], 32145)
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
                .setIn(['migrations', 'btc2BatTimestamp'], 54321)
                .setIn(['migrations', 'btc2BatNotifiedTimestamp'], 32145)
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
                .setIn(['migrations', 'btc2BatTimestamp'], 32145)
                .setIn(['migrations', 'btc2BatNotifiedTimestamp'], 32145)
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
                .setIn(['migrations', 'btc2BatTimestamp'], 54321)
                .setIn(['migrations', 'btc2BatNotifiedTimestamp'], 54321)
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
                .setIn(['migrations', 'btc2BatTimestamp'], 54321)
                .setIn(['migrations', 'btc2BatNotifiedTimestamp'], 32145)
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
                .setIn(['migrations', 'btc2BatTimestamp'], 32145)
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
            it('calls ledger.transitionWalletToBat', function () {
              const ledgerStateWithoutBalance = ledgerStateWithBalance
                .setIn(['ledger', 'info', 'balance'], 0)
                .setIn(['migrations', 'batMercuryTimestamp'], 32145)
                .setIn(['migrations', 'btc2BatTimestamp'], 32145)
              ledgerApi.notifications.onLaunch(ledgerStateWithoutBalance)
              assert(transitionWalletToBatSpy.calledOnce)
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
                .setIn(['migrations', 'btc2BatTimestamp'], 54321)
              ledgerApi.notifications.onLaunch(ledgerStateSeenNotification)
              assert(transitionWalletToBatSpy.notCalled)
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
              ledgerApi.notifications.onLaunch(targetSession)
              assert(transitionWalletToBatSpy.calledOnce)
            })
          })
        })
      })
    })
  })
})
