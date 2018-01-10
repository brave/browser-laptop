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
const ledgerMediaProviders = require('../../../../../app/common/constants/ledgerMediaProviders')

describe('ledger api unit tests', function () {
  let ledgerApi
  let ledgerNotificationsApi
  let ledgerState
  let isBusy = false
  let ledgerClient
  let ledgerPublisher
  let tabState = Immutable.fromJS({
    partition: 'persist:partition-1'
  })
  let request
  let walletPassphraseReturn

  // constants
  const xhr = 'https://www.youtube.com/api/stats/watchtime?docid=kLiLOkzLetE&st=11.338&et=21.339'
  const videoId = 'youtube_kLiLOkzLetE'
  const publisherKey = 'youtube#channel:UCFNTTISby1c_H-rm5Ww5rZg'

  // settings
  let contributionAmount = 10
  let paymentsMinVisitTime = 5000
  let paymentsNotifications = true
  let paymentsAllowPromotions = true

  // spies
  let ledgerTransitionSpy
  let ledgerTransitionedSpy
  let onBitcoinToBatTransitionedSpy
  let onLedgerCallbackSpy
  let onBitcoinToBatBeginTransitionSpy
  let onChangeSettingSpy
  let ledgersetPromotionSpy
  let ledgergetPromotionSpy
  let ledgerSetTimeUntilReconcile
  let onPublisherOptionUpdate

  const defaultAppState = Immutable.fromJS({
    cache: {
      ledgerVideos: {}
    },
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
    mockery.registerMock('level', fakeLevel)
    mockery.registerMock('ad-block', fakeAdBlock)
    mockery.registerMock('../../../js/settings', {
      getSetting: (settingKey, settingsCollection, value) => {
        switch (settingKey) {
          case settings.PAYMENTS_CONTRIBUTION_AMOUNT:
            return contributionAmount
          case settings.PAYMENTS_MINIMUM_VISIT_TIME:
            return paymentsMinVisitTime
          case settings.PAYMENTS_NOTIFICATIONS:
            return paymentsNotifications
          case settings.PAYMENTS_ALLOW_PROMOTIONS:
            return paymentsAllowPromotions
        }
        return false
      }
    })
    request = require('../../../../../js/lib/request')
    mockery.registerMock('../../../js/lib/request', request)
    mockery.registerMock('../../../js/actions/appActions', appActions)
    onBitcoinToBatTransitionedSpy = sinon.spy(appActions, 'onBitcoinToBatTransitioned')
    onLedgerCallbackSpy = sinon.spy(appActions, 'onLedgerCallback')
    onBitcoinToBatBeginTransitionSpy = sinon.spy(appActions, 'onBitcoinToBatBeginTransition')
    onChangeSettingSpy = sinon.spy(appActions, 'changeSetting')
    onPublisherOptionUpdate = sinon.spy(appActions, 'onPublisherOptionUpdate')

    // default to tab state which should be tracked
    tabState = tabState.setIn(['navigationState', 'activeEntry'], {
      httpStatusCode: 200
    })

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
      },
      getPromotion: () => {},
      setPromotion: () => {},
      setTimeUntilReconcile: () => {}
    }
    window.getWalletPassphrase = (parsedData) => {
      return walletPassphraseReturn
    }
    ledgerClient.prototype.boolion = function (value) { return false }
    ledgerClient.prototype.getWalletPassphrase = function (parsedData) {
      return window.getWalletPassphrase(parsedData)
    }
    ledgerTransitionSpy = sinon.spy(lc, 'transition')
    ledgerTransitionedSpy = sinon.spy(lc, 'transitioned')
    ledgersetPromotionSpy = sinon.spy(lc, 'setPromotion')
    ledgergetPromotionSpy = sinon.spy(lc, 'getPromotion')
    ledgerSetTimeUntilReconcile = sinon.spy(lc, 'setTimeUntilReconcile')
    ledgerClient.returns(lc)
    mockery.registerMock('bat-client', ledgerClient)

    // ledger publisher stubbing
    ledgerPublisher = {
      ruleset: [],
      getPublisherProps: function () {
        return null
      },
      Synopsis: batPublisher.Synopsis,
      getMedia: () => {
        return {
          getPublisherFromMediaProps: () => {}
        }
      }
    }
    mockery.registerMock('bat-publisher', ledgerPublisher)
    mockery.registerMock('../../common/state/tabState', {
      TAB_ID_NONE: -1,
      getActiveTabId: () => 1,
      getByTabId: (tabId) => {
        return tabState
      }
    })

    ledgerNotificationsApi = require('../../../../../app/browser/api/ledgerNotifications')
    ledgerState = require('../../../../../app/common/state/ledgerState')

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

  describe('when timing does not need to be checked', function () {
    let fakeClock
    before(function () {
      fakeClock = sinon.useFakeTimers()
    })
    after(function () {
      fakeClock.restore()
    })

    describe('initialize', function () {
      let notificationsInitStub
      beforeEach(function () {
        notificationsInitStub = sinon.stub(ledgerNotificationsApi, 'init')
      })

      afterEach(function () {
        notificationsInitStub.restore()
      })

      after(function () {
        ledgerApi.setSynopsis(undefined)
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
        contributionAmount = 10
      })
      before(function () {
        onLaunchSpy = sinon.spy(ledgerNotificationsApi, 'onLaunch')
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
        assert(setPaymentInfoSpy.withArgs(10).calledOnce)
      })

      describe('when contribution amount is still set to the USD amount (before BAT Mercury)', function () {
        after(function () {
          contributionAmount = 10
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

    describe('synopsisNormalizer', function () {
      after(function () {
        ledgerApi.setSynopsis(undefined)
      })

      describe('prune synopsis', function () {
        let pruneSynopsisSpy, appActionsSpy

        beforeEach(function () {
          pruneSynopsisSpy = sinon.spy(ledgerApi, 'pruneSynopsis')
          appActionsSpy = sinon.spy(appActions, 'onPruneSynopsis')
        })

        afterEach(function () {
          pruneSynopsisSpy.restore()
          appActionsSpy.restore()
        })

        it('do not call prune', function () {
          ledgerApi.synopsisNormalizer(defaultAppState)
          assert(pruneSynopsisSpy.notCalled)
          assert(appActionsSpy.notCalled)
        })

        it('call prune', function () {
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
          ledgerApi.synopsisNormalizer(defaultAppState, null, false, true)
          assert(pruneSynopsisSpy.calledOnce)
          assert(appActionsSpy.calledOnce)
        })
      })
    })

    describe('pruneSynopsis', function () {
      after(function () {
        ledgerApi.setSynopsis(undefined)
      })

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
          cache: {
            ledgerVideos: {}
          },
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
      let returnValue = false

      before(function () {
        onPublisherOptionUpdate.reset()
        verifiedPSpy = sinon.spy(ledgerApi, 'verifiedP')

        ledgerApi.setClient({
          publisherInfo: function (publisherKey, callback) {
            callback(null, {
              publisher: 'test.io',
              properties: {
                verified: returnValue
              }
            })
          },
          publishersInfo: function (publisherKey, callback) {
            publisherKey.forEach(key => {
              callback(null, {
                publisher: key,
                properties: {
                  verified: returnValue
                }
              })
            })
          }
        })
      })

      afterEach(function () {
        returnValue = false
        verifiedPSpy.reset()
        onPublisherOptionUpdate.reset()
      })

      after(function () {
        verifiedPSpy.restore()
        onPublisherOptionUpdate.restore()
        ledgerApi.setClient(undefined)
      })

      it('null case', function () {
        const result = ledgerApi.checkVerifiedStatus(defaultAppState)
        assert.deepEqual(result.toJS(), defaultAppState.toJS())
        assert(verifiedPSpy.notCalled)
      })

      it('only update if timestamp is older then current', function () {
        const newState = defaultAppState
          .setIn(['ledger', 'publisherTimestamp'], 20)
          .setIn(['ledger', 'synopsis', 'publishers', 'test.io', 'options', 'verifiedTimestamp'], 20)
        const result = ledgerApi.checkVerifiedStatus(newState, 'test.io')
        assert.deepEqual(result.toJS(), newState.toJS())
        assert(verifiedPSpy.notCalled)
      })

      it('update when timestamp is older', function () {
        returnValue = true
        const newState = defaultAppState
          .setIn(['ledger', 'publisherTimestamp'], 20)
          .setIn(['ledger', 'synopsis', 'publishers', 'test.io', 'options', 'verifiedTimestamp'], 10)

        const result = ledgerApi.checkVerifiedStatus(newState, 'test.io')
        assert.deepEqual(result.toJS(), newState.toJS())
        assert(verifiedPSpy.calledOnce)
        assert(onPublisherOptionUpdate.withArgs('test.io', 'verified', true).calledOnce)
      })

      it('change publisher verified status from true to false', function () {
        const newState = defaultAppState
          .setIn(['ledger', 'publisherTimestamp'], 20)
          .setIn(['ledger', 'synopsis', 'publishers', 'test.io', 'options', 'verifiedTimestamp'], 10)
          .setIn(['ledger', 'synopsis', 'publishers', 'test.io', 'options', 'verified'], true)

        const result = ledgerApi.checkVerifiedStatus(newState, 'test.io')
        assert.deepEqual(result.toJS(), newState.toJS())
        assert(verifiedPSpy.calledOnce)
        assert(onPublisherOptionUpdate.withArgs('test.io', 'verified', false).calledOnce)
      })

      it('handle multiple publishers', function () {
        const newState = defaultAppState
          .setIn(['ledger', 'publisherTimestamp'], 20)
          .setIn(['ledger', 'synopsis', 'publishers', 'test.io', 'options', 'verifiedTimestamp'], 10)
          .setIn(['ledger', 'synopsis', 'publishers', 'test1.io', 'options', 'verifiedTimestamp'], 15)
          .setIn(['ledger', 'synopsis', 'publishers', 'test2.io', 'options', 'verifiedTimestamp'], 20)
          .setIn(['ledger', 'synopsis', 'publishers', 'test3.io', 'options', 'verifiedTimestamp'], 30)

        const result = ledgerApi.checkVerifiedStatus(newState, [
          'test1.io',
          'test2.io',
          'test3.io',
          'test.io'
        ])
        assert.deepEqual(result.toJS(), newState.toJS())
        assert(verifiedPSpy.withArgs(sinon.match.any, ['test1.io', 'test.io'], sinon.match.any).calledOnce)
        assert.deepEqual(onPublisherOptionUpdate.getCall(0).args, ['test1.io', 'verified', false])
        assert.deepEqual(onPublisherOptionUpdate.getCall(2).args, ['test.io', 'verified', false])
      })
    })

    describe('onMediaRequest', function () {
      let mediaSpy, saveVisitSpy

      const cacheAppState = defaultAppState
        .setIn(['cache', 'ledgerVideos', videoId], Immutable.fromJS({
          publisher: publisherKey
        }))
        .setIn(['ledger', 'synopsis', 'publishers', publisherKey], Immutable.fromJS({
          visits: 1,
          duration: 1000
        }))

      beforeEach(function () {
        mediaSpy = sinon.spy(ledgerPublisher, 'getMedia')
        saveVisitSpy = sinon.spy(ledgerApi, 'saveVisit')
      })

      afterEach(function () {
        mediaSpy.restore()
        saveVisitSpy.restore()
        ledgerApi.setCurrentMediaKey(null)
      })

      after(function () {
        ledgerApi.setSynopsis(undefined)
      })

      it('does nothing if input is null', function () {
        const result = ledgerApi.onMediaRequest(defaultAppState)
        assert.deepEqual(result.toJS(), defaultAppState.toJS())
        assert(mediaSpy.notCalled)
        assert(saveVisitSpy.notCalled)
      })

      describe('when tab is private', function () {
        let savedTabState
        before(function () {
          savedTabState = tabState
          // Create a private tab state for this test
          tabState = Immutable.fromJS({
            partition: 'default',
            incognito: true
          })
          tabState = tabState.setIn(['navigationState', 'activeEntry'], {
            httpStatusCode: 200
          })
        })
        after(function () {
          // Revert after test
          tabState = savedTabState
        })
        it('does nothing if tab is private', function () {
          const xhr2 = 'https://www.youtube.com/api/stats/watchtime?docid=kLiLOkzLetE&st=20.338&et=21.339'
          ledgerApi.onMediaRequest(cacheAppState, xhr2, ledgerMediaProviders.YOUTUBE, 1)
          assert(mediaSpy.notCalled)
          assert(saveVisitSpy.notCalled)
        })
      })

      it('set currentMediaKey when it is different than saved', function () {
        ledgerApi.onMediaRequest(defaultAppState, xhr, ledgerMediaProviders.YOUTUBE, 1)
        assert.equal(ledgerApi.getCurrentMediaKey(), videoId)
        assert(mediaSpy.calledOnce)
        assert(saveVisitSpy.notCalled)
      })

      it('get data from cache, if we have publisher in synopsis', function () {
        ledgerApi.onMediaRequest(cacheAppState, xhr, ledgerMediaProviders.YOUTUBE, 1)
        assert(mediaSpy.notCalled)
        assert(saveVisitSpy.withArgs(cacheAppState, publisherKey, {
          duration: 10001,
          revisited: false,
          ignoreMinTime: true
        }).calledOnce)
      })

      it('get data from server if we have cache, but we do not have publisher in synopsis', function () {
        const state = defaultAppState.setIn(['cache', 'ledgerVideos', videoId], Immutable.fromJS({
          publisher: publisherKey
        }))
        ledgerApi.onMediaRequest(state, xhr, ledgerMediaProviders.YOUTUBE, 1)
        assert(mediaSpy.calledOnce)
        assert(saveVisitSpy.notCalled)
      })

      it('revisited if visiting the same media in the same tab', function () {
        // first call, revisit false
        ledgerApi.onMediaRequest(cacheAppState, xhr, ledgerMediaProviders.YOUTUBE, 1)
        assert.equal(ledgerApi.getCurrentMediaKey(), videoId)
        assert(saveVisitSpy.withArgs(cacheAppState, publisherKey, {
          duration: 10001,
          revisited: false,
          ignoreMinTime: true
        }).calledOnce)

        // second call, revisit true
        ledgerApi.onMediaRequest(cacheAppState, xhr, ledgerMediaProviders.YOUTUBE, 1)
        assert(mediaSpy.notCalled)
        assert(saveVisitSpy.withArgs(cacheAppState, publisherKey, {
          duration: 10001,
          revisited: false,
          ignoreMinTime: true
        }).calledOnce)
      })

      it('revisited if visiting media in the background tab', function () {
        // first call, revisit false
        ledgerApi.setCurrentMediaKey('11')
        ledgerApi.onMediaRequest(cacheAppState, xhr, ledgerMediaProviders.YOUTUBE, 10)
        assert.equal(ledgerApi.getCurrentMediaKey(), '11')
        assert(saveVisitSpy.withArgs(cacheAppState, publisherKey, {
          duration: 10001,
          revisited: true,
          ignoreMinTime: true
        }).calledOnce)
      })
    })

    describe('onMediaPublisher', function () {
      let saveVisitSpy, verifiedPStub

      const expectedState = Immutable.fromJS({
        cache: {
          ledgerVideos: {
            'youtube_kLiLOkzLetE': {
              publisher: 'youtube#channel:UCFNTTISby1c_H-rm5Ww5rZg'
            }
          }
        },
        ledger: {
          synopsis: {
            publishers: {
              'youtube#channel:UCFNTTISby1c_H-rm5Ww5rZg': {
                exclude: false,
                options: {
                  exclude: true
                },
                providerName: 'Youtube',
                faviconName: 'Brave',
                faviconURL: 'data:image/jpeg;base64,...',
                publisherURL: 'https://brave.com'
              }
            }
          }
        },
        migrations: {}
      })

      before(function () {
        verifiedPStub = sinon.stub(ledgerApi, 'verifiedP', (state, publisherKey, fn) => state)
      })

      after(function () {
        verifiedPStub.restore()
      })

      beforeEach(function () {
        ledgerApi.setSynopsis({
          initPublisher: () => {},
          addPublisher: () => {},
          publishers: {
            [publisherKey]: {
              exclude: false,
              options: {
                exclude: true
              },
              providerName: 'Youtube'
            }
          }
        })
        saveVisitSpy = sinon.spy(ledgerApi, 'saveVisit')
      })

      afterEach(function () {
        ledgerApi.setSynopsis(undefined)
        saveVisitSpy.restore()
      })

      it('null case', function () {
        const result = ledgerApi.onMediaPublisher(defaultAppState)
        assert.deepEqual(result.toJS(), defaultAppState.toJS())
      })

      it('create publisher if new and add cache', function () {
        const response = Immutable.fromJS({
          publisher: publisherKey,
          faviconName: 'Brave',
          faviconURL: 'data:image/jpeg;base64,...',
          publisherURL: 'https://brave.com',
          providerName: 'Youtube'
        })

        const state = ledgerApi.onMediaPublisher(defaultAppState, videoId, response, 1000, false)
        assert(saveVisitSpy.calledOnce)
        assert.deepEqual(state.toJS(), expectedState.toJS())
      })

      it('update publisher if exists', function () {
        const newState = Immutable.fromJS({
          cache: {
            ledgerVideos: {
              'youtube_kLiLOkzLetE': {
                publisher: 'youtube#channel:UCFNTTISby1c_H-rm5Ww5rZg',
                faviconName: 'Brave',
                providerName: 'Youtube',
                faviconURL: 'data:image/jpeg;base64,...',
                publisherURL: 'https://brave.com'
              }
            }
          },
          ledger: {
            synopsis: {
              publishers: {
                'youtube#channel:UCFNTTISby1c_H-rm5Ww5rZg': {
                  options: {
                    exclude: true
                  },
                  faviconName: 'old Brave',
                  faviconURL: 'data:image/jpeg;base64,...',
                  publisherURL: 'https://brave.io',
                  providerName: 'Youtube'
                }
              }
            }
          },
          migrations: {}
        })

        const response = Immutable.fromJS({
          publisher: publisherKey,
          faviconName: 'Brave',
          faviconURL: 'data:image/jpeg;base64,...',
          publisherURL: 'https://brave.com',
          providerName: 'Youtube'
        })

        const state = ledgerApi.onMediaPublisher(newState, videoId, response, 1000, false)
        assert(saveVisitSpy.calledOnce)
        assert.deepEqual(state.toJS(), expectedState.toJS())
      })
    })

    describe('roundtrip', function () {
      let requestStub
      const simpleCallback = sinon.stub()
      let responseCode = 200

      before(function () {
        requestStub = sinon.stub(request, 'request', (options, callback) => {
          switch (responseCode) {
            case 403:
              callback(null, {
                statusCode: 403,
                headers: {},
                statusMessage: '<html><body>Your requested URL has been blocked by the URL Filter database module of {{EnterpriseName}}. The URL is listed in categories that are not allowed by your administrator at this time.</body></html>',
                httpVersionMajor: 1,
                httpVersionMinor: 1
              })
              break
            case 200:
            default:
              callback(null, {
                statusCode: 200,
                headers: {},
                statusMessage: '',
                httpVersionMajor: 1,
                httpVersionMinor: 1
              }, {timestamp: '6487805648321904641'})
          }
        })
      })

      after(function () {
        requestStub.restore()
      })

      describe('when params.useProxy is true', function () {
        let expectedOptions
        before(function () {
          expectedOptions = {
            url: 'https://ledger-proxy.privateinternetaccess.com/v3/publisher/timestamp',
            method: 'GET',
            payload: undefined,
            responseType: 'text',
            headers: { 'content-type': 'application/json; charset=utf-8' },
            verboseP: undefined
          }
          requestStub.reset()
          simpleCallback.reset()
          ledgerApi.roundtrip({
            server: 'https://ledger.brave.com',
            path: '/v3/publisher/timestamp',
            useProxy: true
          }, {}, simpleCallback)
        })

        it('updates URL to use proxy (ledger-proxy.privateinternetaccess.com)', function () {
          assert(requestStub.withArgs(expectedOptions, sinon.match.func).called)
        })

        it('calls the callback on success', function () {
          assert(simpleCallback.calledOnce)
        })

        describe('when the proxy returns a 403', function () {
          before(function () {
            responseCode = 403
            requestStub.reset()
            ledgerApi.roundtrip({
              server: 'https://ledger.brave.com',
              path: '/v3/publisher/timestamp',
              useProxy: true
            }, {}, simpleCallback)
          })
          after(function () {
            responseCode = 200
          })
          it('calls request a second time (with useProxy = false)', function () {
            assert(requestStub.calledTwice)
            assert(requestStub.withArgs(expectedOptions, sinon.match.func).called)

            const secondCallOptions = Object.assign({}, expectedOptions, {
              url: 'https://ledger.brave.com/v3/publisher/timestamp'
            })
            assert(requestStub.withArgs(secondCallOptions, sinon.match.func).called)
          })
        })
      })
    })
  })

  describe('when timing needs to be checked', function () {
    describe('addSiteVisit', function () {
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

        const result = ledgerApi.addSiteVisit(state, 0, 'https://clifton.io', fakeTabId)
        const visitsByPublisher = ledgerApi.getVisitsByPublisher()

        // Assert state WAS modified AND publisher was recorded
        assert.notDeepEqual(result, state)
        assert(visitsByPublisher['clifton.io'])
      })
      it('does not record a visit when under the PAYMENTS_MINIMUM_VISIT_TIME threshold', function () {
        const state = ledgerApi.initialize(stateWithLocation, true)

        fakeClock.tick(0)

        const result = ledgerApi.addSiteVisit(state, 0, 'https://clifton.io', fakeTabId)
        const visitsByPublisher = ledgerApi.getVisitsByPublisher()

        // Assert state WAS modified but publisher wasn NOT recorded
        assert.notDeepEqual(result, state)
        assert.equal(visitsByPublisher['clifton.io'], undefined)
      })
      it('records time spent on the page when revisited', function () {
        const state = ledgerApi.initialize(stateWithLocation, true)

        fakeClock.tick(2000)
        const result1 = ledgerApi.addSiteVisit(state, 0, 'https://clifton.io', fakeTabId)

        fakeClock.tick(15000)
        const result2 = ledgerApi.addSiteVisit(result1, 0, 'https://clifton.io', fakeTabId)

        const visitsByPublisher = ledgerApi.getVisitsByPublisher()

        // Assert state WAS modified AND publisher was recorded
        assert.notDeepEqual(result1, state)
        assert.notDeepEqual(result2, result1)
        assert(visitsByPublisher['clifton.io'])
      })
    })

    describe('transitionWalletToBat', function () {
      let fakeClock

      before(function () {
        fakeClock = sinon.useFakeTimers()
      })
      after(function () {
        ledgerApi.setSynopsis(undefined)
        fakeClock.restore()
      })

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
  })

  describe('observeTransactions', function () {
    let showPaymentDoneSpy

    before(function () {
      showPaymentDoneSpy = sinon.spy(ledgerNotificationsApi, 'showPaymentDone')
    })

    afterEach(function () {
      showPaymentDoneSpy.reset()
    })

    after(function () {
      showPaymentDoneSpy.restore()
    })

    it('null case', function () {
      ledgerApi.observeTransactions(defaultAppState)
      assert(showPaymentDoneSpy.notCalled)
    })

    it('no new transaction', function () {
      const state = defaultAppState.setIn(['ledger', 'info', 'transactions'], Immutable.fromJS([{votes: 10}]))
      ledgerApi.observeTransactions(state, [{votes: 10}])
      assert(showPaymentDoneSpy.notCalled)
    })

    it('payment notifications are disabled', function () {
      paymentsNotifications = false
      ledgerApi.observeTransactions(defaultAppState, [{votes: 10}])
      assert(showPaymentDoneSpy.notCalled)
      paymentsNotifications = true
    })

    it('payment notifications are enabled, but there is no transactions', function () {
      ledgerApi.observeTransactions(defaultAppState, [])
      assert(showPaymentDoneSpy.notCalled)
    })

    it('transaction is corupted', function () {
      ledgerApi.observeTransactions(defaultAppState, [{votes: 10}])
      assert(showPaymentDoneSpy.notCalled)
    })

    it('show notification (first transaction in the array)', function () {
      ledgerApi.observeTransactions(defaultAppState, [
        {
          contribution: {
            fiat: 10
          }
        },
        {
          contribution: {
            fiat: 30
          }
        }
      ])
      assert(showPaymentDoneSpy.withArgs(10).calledOnce)
    })
  })

  describe('onWalletProperties', function () {
    describe('generatePaymentData', function () {
      let generatePaymentDataSpy

      before(function () {
        generatePaymentDataSpy = sinon.spy(ledgerApi, 'generatePaymentData')
      })

      afterEach(function () {
        generatePaymentDataSpy.reset()
      })

      after(function () {
        generatePaymentDataSpy.restore()
      })

      it('null case', function () {
        ledgerApi.onWalletProperties()
        assert(generatePaymentDataSpy.notCalled)
      })

      it('we need to call generatePaymentData', function () {
        ledgerApi.onWalletProperties(defaultAppState, Immutable.Map())
        assert(generatePaymentDataSpy.calledOnce)
      })
    })

    describe('addresses', function () {
      it('null case', function () {
        const result = ledgerApi.onWalletProperties(defaultAppState, Immutable.Map())
        assert.deepEqual(result.toJS(), defaultAppState.toJS())
      })

      it('set new addresses ', function () {
        const addresses = {
          BAT: 'BAT_address',
          BTC: 'BTC_address',
          CARD_ID: 'CARD_ID_address',
          ETH: 'ETH_address',
          LTC: 'LTC_address'
        }
        const result = ledgerApi.onWalletProperties(defaultAppState, Immutable.fromJS({
          addresses: addresses
        }))
        const expectedState = defaultAppState.setIn(['ledger', 'info', 'addresses'], Immutable.fromJS(addresses))
        assert.deepEqual(result.toJS(), expectedState.toJS())
      })
    })

    describe('balance', function () {
      it('null case', function () {
        const result = ledgerApi.onWalletProperties(defaultAppState, Immutable.Map())
        assert.deepEqual(result.toJS(), defaultAppState.toJS())
      })

      it('balance is not a number', function () {
        const result = ledgerApi.onWalletProperties(defaultAppState, Immutable.fromJS({
          balance: '.'
        }))
        assert.deepEqual(result.toJS(), defaultAppState.toJS())
      })

      it('set new balance', function () {
        const balance = 10.20
        const result = ledgerApi.onWalletProperties(defaultAppState, Immutable.fromJS({
          balance: balance.toString()
        }))
        const expectedState = defaultAppState.setIn(['ledger', 'info', 'balance'], balance)
        assert.deepEqual(result.toJS(), expectedState.toJS())
      })
    })

    describe('rates', function () {
      it('null case', function () {
        const result = ledgerApi.onWalletProperties(defaultAppState, Immutable.Map())
        assert.deepEqual(result.toJS(), defaultAppState.toJS())
      })

      it('set new rates', function () {
        const rate = 0.1433458965
        const rates = {
          'BTC': 0.00001966,
          'ETH': 0.00042591989579941384,
          'USD': rate,
          'EUR': 0.12100429176330299
        }

        const result = ledgerApi.onWalletProperties(defaultAppState, Immutable.fromJS({
          rates: rates
        }))
        const expectedState = defaultAppState
          .setIn(['ledger', 'info', 'rates'], Immutable.fromJS(rates))
          .setIn(['ledger', 'info', 'currentRate'], rate)
        assert.deepEqual(result.toJS(), expectedState.toJS())
      })
    })

    describe('current rate', function () {
      it('null case', function () {
        const result = ledgerApi.onWalletProperties(defaultAppState, Immutable.Map())
        assert.deepEqual(result.toJS(), defaultAppState.toJS())
      })

      it('rates are present, but there is no USD rate', function () {
        const rates = {
          'BTC': 0.00001966,
          'ETH': 0.00042591989579941384,
          'EUR': 0.12100429176330299
        }

        const result = ledgerApi.onWalletProperties(defaultAppState, Immutable.fromJS({
          rates: rates
        }))
        const expectedState = defaultAppState.setIn(['ledger', 'info', 'rates'], Immutable.fromJS(rates))
        assert.deepEqual(result.toJS(), expectedState.toJS())
      })

      it('rates are present (we use fixed USD)', function () {
        const rate = 0.1433458965
        const rates = {
          'BTC': 0.00001966,
          'ETH': 0.00042591989579941384,
          'EUR': 0.12100429176330299,
          'USD': rate
        }

        const result = ledgerApi.onWalletProperties(defaultAppState, Immutable.fromJS({
          rates: rates
        }))
        const expectedState = defaultAppState
          .setIn(['ledger', 'info', 'rates'], Immutable.fromJS(rates))
          .setIn(['ledger', 'info', 'currentRate'], rate)
        assert.deepEqual(result.toJS(), expectedState.toJS())
      })
    })

    describe('probi', function () {
      const rate = 0.1433458965
      const probi = 25000000000000000000
      const rates = {
        'BTC': 0.00001966,
        'ETH': 0.00042591989579941384,
        'EUR': 0.12100429176330299,
        'USD': rate
      }

      it('null case', function () {
        const result = ledgerApi.onWalletProperties(defaultAppState, Immutable.Map())
        assert.deepEqual(result.toJS(), defaultAppState.toJS())
      })

      it('probi is not a number', function () {
        const result = ledgerApi.onWalletProperties(defaultAppState, Immutable.fromJS({
          probi: '.'
        }))
        assert.deepEqual(result.toJS(), defaultAppState.toJS())
      })

      it('rate is not present', function () {
        const result = ledgerApi.onWalletProperties(defaultAppState, Immutable.fromJS({
          probi: probi,
          balance: 25
        }))
        const expectedState = defaultAppState
          .setIn(['ledger', 'info', 'probi'], probi)
          .setIn(['ledger', 'info', 'balance'], 25)
        assert.deepEqual(result.toJS(), expectedState.toJS())
      })

      it('amount is null', function () {
        const result = ledgerApi.onWalletProperties(defaultAppState, Immutable.fromJS({
          probi: probi,
          rates: rates
        }))
        const expectedState = defaultAppState
          .setIn(['ledger', 'info', 'rates'], Immutable.fromJS(rates))
          .setIn(['ledger', 'info', 'currentRate'], rate)
          .setIn(['ledger', 'info', 'probi'], probi)
        assert.deepEqual(result.toJS(), expectedState.toJS())
      })

      it('small probi', function () {
        const result = ledgerApi.onWalletProperties(defaultAppState, Immutable.fromJS({
          probi: probi,
          balance: 25,
          rates: rates
        }))
        const expectedState = defaultAppState
          .setIn(['ledger', 'info', 'rates'], Immutable.fromJS(rates))
          .setIn(['ledger', 'info', 'currentRate'], rate)
          .setIn(['ledger', 'info', 'converted'], '3.58')
          .setIn(['ledger', 'info', 'balance'], 25)
          .setIn(['ledger', 'info', 'probi'], probi)
        assert.deepEqual(result.toJS(), expectedState.toJS())
      })

      it('big probi', function () {
        const bigProbi = '7.309622404968674704085e+21'
        const result = ledgerApi.onWalletProperties(defaultAppState, Immutable.fromJS({
          probi: bigProbi,
          balance: '7309.6224',
          rates: rates
        }))
        const expectedState = defaultAppState
          .setIn(['ledger', 'info', 'rates'], Immutable.fromJS(rates))
          .setIn(['ledger', 'info', 'currentRate'], rate)
          .setIn(['ledger', 'info', 'converted'], '1047.80')
          .setIn(['ledger', 'info', 'balance'], 7309.6224)
          .setIn(['ledger', 'info', 'probi'], bigProbi)
        assert.deepEqual(result.toJS(), expectedState.toJS())
      })
    })

    describe('unconfirmed amount', function () {
      it('null case', function () {
        const result = ledgerApi.onWalletProperties(defaultAppState, Immutable.Map())
        assert.deepEqual(result.toJS(), defaultAppState.toJS())
      })

      it('amount is not a number', function () {
        const result = ledgerApi.onWalletProperties(defaultAppState, Immutable.fromJS({
          unconfirmed: '.'
        }))
        assert.deepEqual(result.toJS(), defaultAppState.toJS())
      })

      it('amount is ok', function () {
        const result = ledgerApi.onWalletProperties(defaultAppState, Immutable.fromJS({
          unconfirmed: 50
        }))
        const expectedState = defaultAppState
          .setIn(['ledger', 'info', 'unconfirmed'], 50)
        assert.deepEqual(result.toJS(), expectedState.toJS())
      })
    })
  })

  describe('claimPromotion', function () {
    const state = defaultAppState
      .setIn(['ledger', 'promotion', 'promotionId'], '1')

    before(function () {
      ledgersetPromotionSpy.reset()
    })

    afterEach(function () {
      ledgersetPromotionSpy.reset()
    })

    it('null case', function () {
      ledgerApi.claimPromotion(defaultAppState)
      assert(ledgersetPromotionSpy.notCalled)
    })

    it('empty client', function () {
      const oldClient = ledgerApi.getClient()
      ledgerApi.setClient(undefined)
      ledgerApi.claimPromotion(state)
      assert(ledgersetPromotionSpy.notCalled)
      ledgerApi.setClient(oldClient)
    })

    it('execute', function () {
      ledgerApi.claimPromotion(state)
      assert(ledgersetPromotionSpy.calledOnce)
    })
  })

  describe('getPromotion', function () {
    before(function () {
      ledgergetPromotionSpy.reset()
      ledgerClient.reset()
    })

    afterEach(function () {
      ledgergetPromotionSpy.reset()
      ledgerClient.reset()
    })

    it('promotions are disabled', function () {
      paymentsAllowPromotions = false
      ledgerApi.getPromotion(defaultAppState)
      assert(ledgerClient.notCalled)
      assert(ledgergetPromotionSpy.notCalled)
      paymentsAllowPromotions = true
    })

    it('empty client', function () {
      const oldClient = ledgerApi.getClient()
      ledgerApi.setClient(undefined)
      ledgerApi.getPromotion(defaultAppState)
      assert(ledgergetPromotionSpy.calledOnce)
      assert(ledgerClient.calledOnce)
      ledgerApi.setClient(oldClient)
    })

    it('empty client with existing wallet', function () {
      const state = defaultAppState.setIn(['ledger', 'info', 'paymentId'], 'a-1-a')
      const oldClient = ledgerApi.getClient()
      ledgerApi.setClient(undefined)
      ledgerApi.getPromotion(state)
      assert(ledgergetPromotionSpy.withArgs(sinon.match.any, 'a-1-a', sinon.match.any).calledOnce)
      assert(ledgerClient.calledOnce)
      ledgerApi.setClient(oldClient)
    })

    it('existing client', function () {
      ledgerApi.getPromotion(defaultAppState)
      assert(ledgerClient.notCalled)
      assert(ledgergetPromotionSpy.calledOnce)
    })
  })

  describe('onPromotionResponse', function () {
    let removeNotificationSpy, fakeClock, getBalanceSpy

    before(function () {
      removeNotificationSpy = sinon.spy(ledgerNotificationsApi, 'removePromotionNotification')
      ledgerSetTimeUntilReconcile.reset()
      getBalanceSpy = sinon.spy(ledgerApi, 'getBalance')
      fakeClock = sinon.useFakeTimers()
    })

    afterEach(function () {
      ledgerSetTimeUntilReconcile.reset()
    })

    after(function () {
      removeNotificationSpy.restore()
      getBalanceSpy.restore()
      fakeClock.restore()
    })

    it('execute', function () {
      fakeClock.tick(6000)
      const result = ledgerApi.onPromotionResponse(defaultAppState)
      const expectedSate = defaultAppState
        .setIn(['ledger', 'promotion', 'claimedTimestamp'], 6000)
      assert(removeNotificationSpy.calledOnce)
      assert(getBalanceSpy.calledOnce)
      assert.deepEqual(result.toJS(), expectedSate.toJS())
    })

    it('set minReconcile timestamp if higher then current reconcileStamp', function () {
      const state = defaultAppState
        .setIn(['ledger', 'promotion', 'minimumReconcileTimestamp'], 10000)
        .setIn(['ledger', 'info', 'reconcileStamp'], 100)
      ledgerApi.onPromotionResponse(state)
      assert(ledgerSetTimeUntilReconcile.calledOnce)
    })

    it('do not set minReconcile timestamp if lower then current reconcileStamp', function () {
      const state = defaultAppState
        .setIn(['ledger', 'promotion', 'minimumReconcileTimestamp'], 10000)
        .setIn(['ledger', 'info', 'reconcileStamp'], 10001)
      ledgerApi.onPromotionResponse(state)
      assert(ledgerSetTimeUntilReconcile.notCalled)
    })
  })

  describe('onWalletRecovery', function () {
    let setRecoveryStatusSpy, getBalanceSpy, fakeClock

    const unit = Buffer.from([
      32,
      87,
      30,
      26,
      223,
      56,
      224,
      31,
      213,
      136,
      248,
      95,
      136,
      56,
      250,
      78,
      179,
      121,
      255,
      162,
      195,
      39,
      143,
      136,
      18,
      140,
      49,
      216,
      221,
      154,
      78,
      173
    ])
    const newSeed = new Uint8Array(Object.values(unit))
    const param = Immutable.fromJS({
      bootStamp: 1512939627058,
      properties: {
        wallet: {
          altcurrency: 'BAT',
          keyinfo: {
            seed: unit
          }
        }
      }
    })

    before(function () {
      setRecoveryStatusSpy = sinon.spy(ledgerState, 'setRecoveryStatus')
      getBalanceSpy = sinon.spy(ledgerApi, 'getBalance')
      onLedgerCallbackSpy.reset()
      fakeClock = sinon.useFakeTimers()
    })

    afterEach(function () {
      setRecoveryStatusSpy.reset()
      onLedgerCallbackSpy.reset()
      getBalanceSpy.reset()
    })

    after(function () {
      setRecoveryStatusSpy.restore()
      onLedgerCallbackSpy.restore()
      getBalanceSpy.restore()
      fakeClock.restore()
    })

    it('on error', function () {
      const result = ledgerApi.onWalletRecovery(defaultAppState, 'Wrong key')
      const expectedSate = defaultAppState
        .set('about', Immutable.fromJS({
          preferences: {
            recoverySucceeded: false,
            updatedStamp: 0
          }
        }))
        .setIn(['ledger', 'info', 'error'], Immutable.fromJS({
          caller: 'recoveryWallet',
          error: 'Wrong key'
        }))
      assert(setRecoveryStatusSpy.withArgs(sinon.match.any, false))
      assert.deepEqual(result.toJS(), expectedSate.toJS())
    })

    it('success', function () {
      const result = ledgerApi.onWalletRecovery(defaultAppState, null, param)
      const expectedSate = defaultAppState
        .set('about', Immutable.fromJS({
          preferences: {
            recoverySucceeded: true,
            updatedStamp: 0
          }
        }))
        .setIn(['ledger', 'info'], Immutable.fromJS({
          addresses: {},
          walletQR: {}
        }))
      assert(setRecoveryStatusSpy.withArgs(sinon.match.any, true))
      assert.deepEqual(result.toJS(), expectedSate.toJS())
      const callBack = onLedgerCallbackSpy.getCall(0).args[0]
      const unit = callBack.getIn(['properties', 'wallet', 'keyinfo', 'seed'])
      assert.deepStrictEqual(unit, newSeed)
    })
  })

  describe('getStateInfo', function () {
    let mergeInfoPropSpy, getWalletPassphraseSpy

    const unit = Buffer.from([
      32,
      87,
      30,
      26,
      223,
      56,
      224,
      31,
      213,
      136,
      248,
      95,
      136,
      56,
      250,
      78,
      179,
      121,
      255,
      162,
      195,
      39,
      143,
      136,
      18,
      140,
      49,
      216,
      221,
      154,
      78,
      173
    ])

    const seedData = {
      properties: {
        days: 30,
        wallet: {
          keyinfo: {
            seed: new Uint8Array(Object.values(unit))
          },
          paymentId: '21951877-5998-4acf-9302-4a7b101c9188',
          addresses: {
            BAT: 'BAT_addres',
            BTC: 'BTC_addres',
            CARD_ID: 'CARD_ID_addres',
            ETH: 'ETH_addres',
            LTC: 'LTC_addres'
          }
        }
      },
      reconcileStamp: 1
    }

    before(function () {
      mergeInfoPropSpy = sinon.spy(ledgerState, 'mergeInfoProp')
      getWalletPassphraseSpy = sinon.spy(window, 'getWalletPassphrase')
    })

    afterEach(function () {
      walletPassphraseReturn = null
      mergeInfoPropSpy.reset()
      getWalletPassphraseSpy.reset()
    })

    after(function () {
      mergeInfoPropSpy.restore()
      getWalletPassphraseSpy.restore()
    })

    it('null case', function () {
      const result = ledgerApi.getStateInfo(defaultAppState)
      assert.deepEqual(result.toJS(), defaultAppState.toJS())
      assert(mergeInfoPropSpy.notCalled)
      assert(getWalletPassphraseSpy.notCalled)
    })

    it('wallet is missing', function () {
      const data = {
        properties: {}
      }
      const result = ledgerApi.getStateInfo(defaultAppState, data)
      assert.deepEqual(result.toJS(), defaultAppState.toJS())
      assert(mergeInfoPropSpy.notCalled)
      assert(getWalletPassphraseSpy.notCalled)
    })

    describe('seed info', function () {
      it('seed is in wrong format', function () {
        const wrongSeed = Immutable
          .fromJS(seedData)
          .setIn(['properties', 'wallet', 'keyinfo', 'seed'], unit)
          .toJS()

        const result = ledgerApi.getStateInfo(defaultAppState, wrongSeed)
        const expectedState = defaultAppState
          .setIn(['ledger', 'info'], Immutable.fromJS({
            'created': true,
            'creating': false,
            'paymentId': '21951877-5998-4acf-9302-4a7b101c9188',
            'reconcileFrequency': 30,
            'reconcileStamp': 1
          }))
        assert.deepEqual(result.toJS(), expectedState.toJS())
        assert(getWalletPassphraseSpy.withArgs(seedData).calledOnce)
      })

      it('seed is missing', function () {
        const missingSeed = Immutable
          .fromJS(seedData)
          .deleteIn(['properties', 'wallet', 'keyinfo'])
          .toJS()

        const result = ledgerApi.getStateInfo(defaultAppState, missingSeed)
        const expectedState = defaultAppState
          .setIn(['ledger', 'info'], Immutable.fromJS({
            'created': true,
            'creating': false,
            'paymentId': '21951877-5998-4acf-9302-4a7b101c9188',
            'reconcileFrequency': 30,
            'reconcileStamp': 1
          }))
        assert.deepEqual(result.toJS(), expectedState.toJS())
        assert(mergeInfoPropSpy.withArgs(sinon.match.any, expectedState.getIn(['ledger', 'info']).toJS()).calledOnce)
      })

      it('passphrase is added to new info', function () {
        walletPassphraseReturn = [
          'test',
          'lol',
          'ok'
        ]

        const result = ledgerApi.getStateInfo(defaultAppState, seedData)
        const expectedState = defaultAppState
          .setIn(['ledger', 'info'], Immutable.fromJS({
            'created': true,
            'creating': false,
            'passphrase': 'test lol ok',
            'paymentId': '21951877-5998-4acf-9302-4a7b101c9188',
            'reconcileFrequency': 30,
            'reconcileStamp': 1
          }))
        assert.deepEqual(result.toJS(), expectedState.toJS())
      })
    })
  })

  describe('onPublisherTimestamp', function () {
    let checkVerifiedStatusSpy

    const stateWithData = defaultAppState
      .setIn(['ledger', 'synopsis', 'publishers', 'clifton.io'], Immutable.fromJS({
        visits: 1
      }))

    before(function () {
      checkVerifiedStatusSpy = sinon.spy(ledgerApi, 'checkVerifiedStatus')
      ledgerApi.setClient({
        publisherInfo: function () {
          return false
        },
        publishersInfo: function () {
          return false
        }
      })
    })

    afterEach(function () {
      checkVerifiedStatusSpy.reset()
    })

    after(function () {
      checkVerifiedStatusSpy.restore()
      ledgerApi.setClient(undefined)
    })

    it('publisher timestamp is the same', function () {
      ledgerApi.onPublisherTimestamp(defaultAppState, 10, 10)
      assert(checkVerifiedStatusSpy.notCalled)
    })

    it('publisher list is empty', function () {
      ledgerApi.onPublisherTimestamp(defaultAppState, 10, 20)
      assert(checkVerifiedStatusSpy.notCalled)
    })

    it('check publishers', function () {
      ledgerApi.onPublisherTimestamp(stateWithData, 10, 20)
      assert(checkVerifiedStatusSpy.withArgs(sinon.match.any, 'clifton.io', 20).calledOnce)
    })

    it('check multiple publishers', function () {
      const multiple = stateWithData
      .setIn(['ledger', 'synopsis', 'publishers', 'brave.com'], Immutable.fromJS({
        visits: 1
      }))
      ledgerApi.onPublisherTimestamp(multiple, 10, 20)

      assert.equal(checkVerifiedStatusSpy.getCall(0).args[1], 'clifton.io')
      assert.equal(checkVerifiedStatusSpy.getCall(1).args[1], 'brave.com')
    })
  })
})
