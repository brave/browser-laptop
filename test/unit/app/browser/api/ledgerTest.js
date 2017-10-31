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
  let contributionAmount = 25

  // spies
  let ledgerTransitionSpy
  let ledgerTransitionedSpy
  let onBitcoinToBatTransitionedSpy
  let onLedgerCallbackSpy
  let onBitcoinToBatBeginTransitionSpy
  let onChangeSettingSpy

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
        switch (settingKey) {
          case settings.PAYMENTS_ENABLED:
            return paymentsEnabled
          case settings.PAYMENTS_NOTIFICATIONS:
            return paymentsNotifications
          case settings.PAYMENTS_CONTRIBUTION_AMOUNT:
            return contributionAmount
        }
        return false
      }
    })
    mockery.registerMock('../../../js/actions/appActions', appActions)
    onBitcoinToBatTransitionedSpy = sinon.spy(appActions, 'onBitcoinToBatTransitioned')
    onLedgerCallbackSpy = sinon.spy(appActions, 'onLedgerCallback')
    onBitcoinToBatBeginTransitionSpy = sinon.spy(appActions, 'onBitcoinToBatBeginTransition')
    onChangeSettingSpy = sinon.spy(appActions, 'changeSetting')

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
      getWalletAddresses: function () {
        return {
          'BAT': '0xADDRESS_HERE',
          'BTC': 'ADDRESS_HERE',
          'CARD_ID': 'ADDRESS-GUID-GOES-IN-HERE',
          'ETH': '0xADDRESS_HERE',
          'LTC': 'ADDRESS_HERE'
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
      setBraveryProperties: function (clientProperties, callback) {
        if (typeof callback === 'function') {
          const err = undefined
          const result = {}
          callback(err, result)
        }
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
    onLedgerCallbackSpy.restore()
    onBitcoinToBatBeginTransitionSpy.restore()
    onChangeSettingSpy.restore()
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
    let parsedLedgerData
    let onLaunchSpy
    let setPaymentInfoSpy
    before(function () {
      parsedLedgerData = {
        paymentInfo: {
        },
        properties: {
          wallet: {
            paymentId: 12345
          }
        }
      }
      contributionAmount = 25
    })
    before(function () {
      onLaunchSpy = sinon.spy(ledgerApi.notifications, 'onLaunch')
      setPaymentInfoSpy = sinon.spy(ledgerApi, 'setPaymentInfo')
    })
    after(function () {
      onLaunchSpy.restore()
      setPaymentInfoSpy.restore()
    })
    it('calls notifications.onLaunch', function () {
      onLaunchSpy.reset()
      ledgerApi.onInitRead(defaultAppState, parsedLedgerData)
      assert(onLaunchSpy.calledOnce)
    })
    it('calls setPaymentInfo with contribution amount', function () {
      setPaymentInfoSpy.reset()
      ledgerApi.onInitRead(defaultAppState, parsedLedgerData)
      assert(setPaymentInfoSpy.withArgs(25).calledOnce)
    })

    describe('when contribution amount is still set to the USD amount (before BAT Mercury)', function () {
      after(function () {
        contributionAmount = 25
      })
      describe('when set to 5 USD', function () {
        before(function () {
          setPaymentInfoSpy.reset()
          onChangeSettingSpy.reset()
          contributionAmount = 5
          ledgerApi.onInitRead(defaultAppState, parsedLedgerData)
        })
        it('converts to 25 BAT', function () {
          assert(setPaymentInfoSpy.withArgs(25).calledOnce)
        })
        it('updates the setting', function () {
          assert(onChangeSettingSpy.withArgs(settings.PAYMENTS_CONTRIBUTION_AMOUNT, 25).calledOnce)
        })
      })
      describe('when set to 10 USD', function () {
        before(function () {
          setPaymentInfoSpy.reset()
          onChangeSettingSpy.reset()
          contributionAmount = 10
          ledgerApi.onInitRead(defaultAppState, parsedLedgerData)
        })
        it('converts to 50 BAT', function () {
          assert(setPaymentInfoSpy.withArgs(50).calledOnce)
        })
        it('updates the setting', function () {
          assert(onChangeSettingSpy.withArgs(settings.PAYMENTS_CONTRIBUTION_AMOUNT, 50).calledOnce)
        })
      })
      describe('when set to 15 USD', function () {
        before(function () {
          setPaymentInfoSpy.reset()
          onChangeSettingSpy.reset()
          contributionAmount = 15
          ledgerApi.onInitRead(defaultAppState, parsedLedgerData)
        })
        it('converts to 75 BAT', function () {
          assert(setPaymentInfoSpy.withArgs(75).calledOnce)
        })
        it('updates the setting', function () {
          assert(onChangeSettingSpy.withArgs(settings.PAYMENTS_CONTRIBUTION_AMOUNT, 75).calledOnce)
        })
      })
      describe('when set to 20 USD', function () {
        before(function () {
          setPaymentInfoSpy.reset()
          onChangeSettingSpy.reset()
          contributionAmount = 20
          ledgerApi.onInitRead(defaultAppState, parsedLedgerData)
        })
        it('converts to 100 BAT', function () {
          assert(setPaymentInfoSpy.withArgs(100).calledOnce)
        })
        it('updates the setting', function () {
          assert(onChangeSettingSpy.withArgs(settings.PAYMENTS_CONTRIBUTION_AMOUNT, 100).calledOnce)
        })
      })
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
