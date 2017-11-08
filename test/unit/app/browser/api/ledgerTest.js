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
const migrationState = require('../../../../../app/common/state/migrationState')
const batPublisher = require('bat-publisher')

const defaultAppState = Immutable.fromJS({
  ledger: {},
  migrations: {}
})

describe('ledger api unit tests', function () {
  let ledgerApi
  let isBusy = false
  let ledgerClient

  // settings
  let paymentsEnabled
  let paymentsNotifications
  let paymentsMinVisitTime = 5000
  let contributionAmount = 25

  // spies
  let ledgerTransitionSpy
  let ledgerTransitionedSpy
  let onBitcoinToBatTransitionedSpy
  let onLedgerCallbackSpy
  let onBitcoinToBatBeginTransitionSpy
  let onChangeSettingSpy

  before(function () {
    mockery.enable({
      warnOnReplace: false,
      warnOnUnregistered: false,
      useCleanCache: true
    })
    const fakeLevel = (pathName) => {
      return {
        batch: function (entries, cb) {
          if (typeof cb === 'function') cb()
        },
        get: function (key, cb) {
          if (typeof cb === 'function') cb(null, '{"' + key + '": "value-goes-here"}')
        }
      }
    }
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
          case settings.PAYMENTS_MINIMUM_VISIT_TIME:
            return paymentsMinVisitTime
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
      },
      publisherTimestamp: function () {
        return 0
      }
    }
    ledgerClient.prototype.boolion = function (value) { return false }
    ledgerClient.prototype.getWalletPassphrase = function (state) {}
    ledgerTransitionSpy = sinon.spy(lc, 'transition')
    ledgerTransitionedSpy = sinon.spy(lc, 'transitioned')
    ledgerClient.returns(lc)
    mockery.registerMock('bat-client', ledgerClient)

    // ledger publisher stubbing
    const lp = {
      ruleset: [],
      getPublisherProps: function (publisher) {
        return null
      },
      Synopsis: batPublisher.Synopsis
    }
    mockery.registerMock('bat-publisher', lp)

    // once everything is stubbed, load the ledger
    ledgerApi = require('../../../../../app/browser/api/ledger')
  })
  after(function () {
    onBitcoinToBatTransitionedSpy.restore()
    onLedgerCallbackSpy.restore()
    onBitcoinToBatBeginTransitionSpy.restore()
    onChangeSettingSpy.restore()
    mockery.deregisterAll()
    mockery.disable()
  })

  describe('initialize', function () {
    let notificationsInitStub
    beforeEach(function () {
      notificationsInitStub = sinon.stub(ledgerApi.notifications, 'init')
    })
    afterEach(function () {
      notificationsInitStub.restore()
    })
    it('calls notifications.init', function () {
      ledgerApi.initialize(defaultAppState, true)
      assert(notificationsInitStub.calledOnce)
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
      ledgerApi.setSynopsis(undefined)
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

  describe('addVisit', function () {
    const fakeTabId = 7
    let stateWithLocation
    let fakeClock
    before(function () {
      const locationData = Immutable.fromJS({
        publisher: 'clifton.io',
        stickyP: true,
        exclude: false
      })
      stateWithLocation = defaultAppState.setIn(['ledger', 'locations', 'https://clifton.io/'], locationData)
    })
    beforeEach(function () {
      fakeClock = sinon.useFakeTimers()
      ledgerApi.clearVisitsByPublisher()
    })
    afterEach(function () {
      ledgerApi.setSynopsis(undefined)
      fakeClock.restore()
    })
    it('records a visit when over the PAYMENTS_MINIMUM_VISIT_TIME threshold', function () {
      const state = ledgerApi.initialize(stateWithLocation, true)

      fakeClock.tick(6000)

      const result = ledgerApi.addVisit(state, 0, 'https://clifton.io', fakeTabId)
      const visitsByPublisher = ledgerApi.getVisitsByPublisher()

      // Assert state WAS modified AND publisher was recorded
      assert.notDeepEqual(result, state)
      assert(visitsByPublisher['clifton.io'])
    })
    it('does not record a visit when under the PAYMENTS_MINIMUM_VISIT_TIME threshold', function () {
      const state = ledgerApi.initialize(stateWithLocation, true)

      fakeClock.tick(0)

      const result = ledgerApi.addVisit(state, 0, 'https://clifton.io', fakeTabId)
      const visitsByPublisher = ledgerApi.getVisitsByPublisher()

      // Assert state WAS modified but publisher wasn NOT recorded
      assert.notDeepEqual(result, state)
      assert.equal(visitsByPublisher['clifton.io'], undefined)
    })
    it('records time spent on the page when revisited', function () {
      const state = ledgerApi.initialize(stateWithLocation, true)

      fakeClock.tick(2000)
      const result1 = ledgerApi.addVisit(state, 0, 'https://clifton.io', fakeTabId)

      fakeClock.tick(15000)
      const result2 = ledgerApi.addVisit(result1, 0, 'https://clifton.io', fakeTabId)

      const visitsByPublisher = ledgerApi.getVisitsByPublisher()

      // Assert state WAS modified AND publisher was recorded
      assert.notDeepEqual(result1, state)
      assert.notDeepEqual(result2, result1)
      assert(visitsByPublisher['clifton.io'])
    })
  })

  describe('checkBtcBatMigrated', function () {
    let transitionWalletToBatStub
    before(function () {
      transitionWalletToBatStub = sinon.stub(ledgerApi, 'transitionWalletToBat')
    })
    after(function () {
      transitionWalletToBatStub.restore()
    })

    describe('when not a new install and wallet has not been upgraded', function () {
      let result
      before(function () {
        const notMigratedYet = defaultAppState.merge(Immutable.fromJS({
          firstRunTimestamp: 12345,
          migrations: {
            batMercuryTimestamp: 34512,
            btc2BatTimestamp: 34512,
            btc2BatNotifiedTimestamp: 34512,
            btc2BatTransitionPending: false
          }
        }))
        assert.equal(migrationState.inTransition(notMigratedYet), false)
        transitionWalletToBatStub.reset()
        result = ledgerApi.checkBtcBatMigrated(notMigratedYet, true)
      })
      it('sets transition status to true', function () {
        assert(migrationState.inTransition(result))
      })
      it('calls transitionWalletToBat', function () {
        assert(transitionWalletToBatStub.calledOnce)
      })
    })

    describe('when a transition is already being shown', function () {
      it('sets transition to false if new install', function () {
        const stuckOnMigrate = defaultAppState.merge(Immutable.fromJS({
          firstRunTimestamp: 12345,
          migrations: {
            batMercuryTimestamp: 12345,
            btc2BatTimestamp: 12345,
            btc2BatNotifiedTimestamp: 12345,
            btc2BatTransitionPending: true
          }
        }))
        assert(migrationState.isNewInstall(stuckOnMigrate))
        assert.equal(migrationState.hasUpgradedWallet(stuckOnMigrate), false)
        assert(migrationState.inTransition(stuckOnMigrate))

        const result = ledgerApi.checkBtcBatMigrated(stuckOnMigrate, true)
        assert.equal(migrationState.inTransition(result), false)
      })
      it('sets transition to false if wallet has been upgraded', function () {
        const stuckOnMigrate = defaultAppState.merge(Immutable.fromJS({
          firstRunTimestamp: 12345,
          migrations: {
            batMercuryTimestamp: 34512,
            btc2BatTimestamp: 54321,
            btc2BatNotifiedTimestamp: 34512,
            btc2BatTransitionPending: true
          }
        }))
        assert.equal(migrationState.isNewInstall(stuckOnMigrate), false)
        assert(migrationState.hasUpgradedWallet(stuckOnMigrate))
        assert(migrationState.inTransition(stuckOnMigrate))

        const result = ledgerApi.checkBtcBatMigrated(stuckOnMigrate, true)
        assert.equal(migrationState.inTransition(result), false)
      })
    })
  })

  describe('transitionWalletToBat', function () {
    describe('when client is not busy', function () {
      before(function () {
        ledgerApi.onBootStateFile(defaultAppState)
        ledgerTransitionSpy.reset()
        onBitcoinToBatTransitionedSpy.reset()
        onLedgerCallbackSpy.reset()
        ledgerTransitionedSpy.reset()
        onBitcoinToBatBeginTransitionSpy.reset()
        ledgerClient.reset()
        ledgerApi.resetNewClient()
        isBusy = false
        ledgerApi.transitionWalletToBat()
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
        ledgerApi.onBootStateFile(defaultAppState)
        ledgerTransitionSpy.reset()
        onBitcoinToBatTransitionedSpy.reset()
        onLedgerCallbackSpy.reset()
        ledgerTransitionedSpy.reset()
        onBitcoinToBatBeginTransitionSpy.reset()
        ledgerClient.reset()
        ledgerApi.resetNewClient()
        isBusy = true
        ledgerApi.transitionWalletToBat()
      })
      after(function () {
        isBusy = false
      })
      it('does not call AppActions.onBitcoinToBatBeginTransition', function () {
        assert(onBitcoinToBatBeginTransitionSpy.notCalled)
      })
      it('does not call client.transition', function () {
        assert(ledgerTransitionSpy.notCalled)
      })
    })
    describe('when client is not v1', function () {
      let oldClient
      before(function () {
        const batState = ledgerApi.onBootStateFile(defaultAppState)
        ledgerTransitionSpy.reset()
        onBitcoinToBatTransitionedSpy.reset()
        onLedgerCallbackSpy.reset()
        ledgerTransitionedSpy.reset()
        onBitcoinToBatBeginTransitionSpy.reset()
        ledgerClient.reset()
        oldClient = ledgerApi.getClient()
        ledgerApi.setClient({
          options: {
            version: 'v2'
          }
        })
        ledgerApi.resetNewClient()
        ledgerApi.transitionWalletToBat(batState)
      })
      after(function () {
        ledgerApi.setClient(oldClient)
      })
      it('calls AppActions.onBitcoinToBatTransitioned', function () {
        assert(onBitcoinToBatTransitionedSpy.calledOnce)
      })
      it('does not call client.transition', function () {
        assert(ledgerTransitionSpy.notCalled)
      })
    })
  })

  describe('notifications', function () {
    let fakeClock
    before(function () {
      fakeClock = sinon.useFakeTimers()
    })
    after(function () {
      fakeClock.restore()
    })
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
        fakeClock.tick(0)
        ledgerApi.notifications.init(defaultAppState)
        fakeClock.tick(ledgerApi.notifications.pollingInterval)
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

  describe('synopsisNormalizer', function () {
    describe('prune synopsis', function () {
      let pruneSynopsisSpy

      before(function () {
        pruneSynopsisSpy = sinon.spy(ledgerApi, 'pruneSynopsis')
      })

      after(function () {
        pruneSynopsisSpy.restore()
      })

      it('do not call prune', function () {
        ledgerApi.synopsisNormalizer(defaultAppState)
        assert(pruneSynopsisSpy.notCalled)
      })

      it('call prune', function () {
        ledgerApi.synopsisNormalizer(defaultAppState, null, false, true)
        assert(pruneSynopsisSpy.calledOnce)
      })
    })
  })

  describe('pruneSynopsis', function () {
    it('null case', function () {
      const result = ledgerApi.pruneSynopsis(defaultAppState)
      assert.deepEqual(result.toJS(), defaultAppState.toJS())
    })

    it('toJSON return is empty', function () {
      ledgerApi.setSynopsis({
        toJSON: () => {}
      })
      const result = ledgerApi.pruneSynopsis(defaultAppState)
      assert.deepEqual(result.toJS(), defaultAppState.toJS())
    })

    it('toJSON returns publishers', function () {
      ledgerApi.setSynopsis({
        toJSON: () => {
          return {
            publishers: {
              'clifton.io': {
                visits: 1
              }
            }
          }
        }
      })

      const expectedResult = {
        ledger: {
          synopsis: {
            publishers: {
              'clifton.io': {
                visits: 1
              }
            }
          }
        },
        migrations: {}
      }

      const result = ledgerApi.pruneSynopsis(defaultAppState)
      assert.deepEqual(result.toJS(), expectedResult)
    })
  })

  describe('checkVerifiedStatus', function () {
    let verifiedPSpy

    before(function () {
      verifiedPSpy = sinon.spy(ledgerApi, 'verifiedP')
      ledgerApi.setClient({
        publisherInfo: function () {
          return false
        }
      })
    })

    after(function () {
      verifiedPSpy.restore()
    })

    it('null case', function () {
      const result = ledgerApi.checkVerifiedStatus(defaultAppState)
      assert.deepEqual(result.toJS(), defaultAppState.toJS())
      assert(verifiedPSpy.notCalled)
    })

    it('only update if timestamp is older then current', function () {
      const newState = defaultAppState
        .setIn(['ledger', 'publisherTimestamp'], 20)
        .setIn(['ledger', 'synopsis', 'publishers', 'clifton.io', 'options', 'verifiedTimestamp'], 20)
      const result = ledgerApi.checkVerifiedStatus(newState, 'clifton.io')
      assert.deepEqual(result.toJS(), newState.toJS())
      assert(verifiedPSpy.notCalled)
    })

    it('update when timestamp is older', function () {
      const newState = defaultAppState
        .setIn(['ledger', 'publisherTimestamp'], 20)
        .setIn(['ledger', 'synopsis', 'publishers', 'clifton.io', 'options', 'verifiedTimestamp'], 10)

      const expectedState = newState
        .setIn(['ledger', 'about', 'synopsis'], [])
        .setIn(['ledger', 'about', 'synopsisOptions'], {})
        .setIn(['ledger', 'synopsis', 'publishers', 'clifton.io', 'options', 'verified'], true)
      const result = ledgerApi.checkVerifiedStatus(newState, 'clifton.io')
      assert.deepEqual(result.toJS(), expectedState.toJS())
      assert(verifiedPSpy.calledOnce)
    })
  })
})
