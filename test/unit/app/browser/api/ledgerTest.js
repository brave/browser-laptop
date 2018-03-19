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
const batPublisher = require('bat-publisher')
const ledgerMediaProviders = require('../../../../../app/common/constants/ledgerMediaProviders')
const fs = require('fs')

describe('ledger api unit tests', function () {
  let ledgerApi
  let ledgerNotificationsApi
  let ledgerState
  let updateState
  let ledgerUtil
  let isBusy = false
  let ledgerClient
  let ledgerClientObject
  let ledgerPublisher
  let tabState = Immutable.fromJS({
    partition: 'persist:partition-1'
  })
  let request
  let walletPassphraseReturn
  let updater

  // constants
  const xhr = 'https://www.youtube.com/api/stats/watchtime?docid=kLiLOkzLetE&st=11.338&et=21.339'
  const videoId = 'youtube_kLiLOkzLetE'
  const publisherKey = 'youtube#channel:UCFNTTISby1c_H-rm5Ww5rZg'

  // settings
  let contributionAmount = 10
  let paymentsMinVisitTime = 5000
  let paymentsNotifications = true
  let paymentsAllowPromotions = true
  let contributionAmountSet = true

  // spies
  let onLedgerCallbackSpy
  let onChangeSettingSpy
  let ledgersetPromotionSpy
  let ledgergetPromotionSpy
  let ledgerSetTimeUntilReconcile

  const defaultAppState = Immutable.fromJS({
    cache: {
      ledgerVideos: {}
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
    mockery.registerMock('level', fakeLevel)
    mockery.registerMock('ad-block', fakeAdBlock)
    mockery.registerMock('../../../js/settings', {
      getSetting: (settingKey, settingsCollection, defaultWhenNull = true) => {
        switch (settingKey) {
          case settings.PAYMENTS_CONTRIBUTION_AMOUNT:
            return contributionAmountSet
              ? contributionAmount
              : defaultWhenNull
                ? contributionAmount
                : null
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
    onLedgerCallbackSpy = sinon.spy(appActions, 'onLedgerCallback')
    onChangeSettingSpy = sinon.spy(appActions, 'changeSetting')
    mockery.registerMock('fs', fs)

    // default to tab state which should be tracked
    tabState = tabState.setIn(['navigationState', 'activeEntry'], {
      httpStatusCode: 200
    })

    // ledger client stubbing
    ledgerClient = sinon.stub()
    ledgerClientObject = {
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
      getPaymentId: function () {
        return 'payementIdGoesHere'
      },
      properties: {
        wallet: {
          paymentId: 12345
        }
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
    ledgersetPromotionSpy = sinon.spy(ledgerClientObject, 'setPromotion')
    ledgergetPromotionSpy = sinon.spy(ledgerClientObject, 'getPromotion')
    ledgerSetTimeUntilReconcile = sinon.spy(ledgerClientObject, 'setTimeUntilReconcile')
    ledgerClient.returns(ledgerClientObject)
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
    ledgerUtil = require('../../../../../app/common/lib/ledgerUtil')
    ledgerState = require('../../../../../app/common/state/ledgerState')
    updateState = require('../../../../../app/common/state/updateState')
    updater = require('../../../../../app/updater')

    // once everything is stubbed, load the ledger
    ledgerApi = require('../../../../../app/browser/api/ledger')
  })
  after(function () {
    onLedgerCallbackSpy.restore()
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
    })

    describe('synopsisNormalizer', function () {
      after(function () {
        ledgerApi.setSynopsis(undefined)
      })

      describe('prune synopsis', function () {
        let pruneSynopsisSpy, appActionsSpy

        before(function () {
          pruneSynopsisSpy = sinon.spy(ledgerApi, 'pruneSynopsis')
          appActionsSpy = sinon.spy(appActions, 'onPruneSynopsis')
        })

        afterEach(function () {
          pruneSynopsisSpy.reset()
          appActionsSpy.reset()
        })

        after(function () {
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

      describe('only pinned items with total below 100%', function () {
        let normalizePinnedSpy, roundToTargetSpy, visiblePStub

        const dataState = defaultAppState
          .setIn(['ledger', 'synopsis', 'publishers'], Immutable.fromJS({
            'site1': {
              options: {
                exclude: false
              },
              pinPercentage: 30,
              scores: {
                concave: 9.249426617127623,
                visits: 3
              },
              weight: 30
            },
            'site2': {
              options: {
                exclude: false
              },
              pinPercentage: 20,
              scores: {
                concave: 3.249426617127623,
                visits: 3
              },
              weight: 20
            },
            'site3': {
              options: {
                exclude: false
              },
              pinPercentage: 20,
              scores: {
                concave: 1.249426617127623,
                visits: 3
              },
              weight: 20
            }
          }))

        const expectedSate = dataState
          .setIn(['ledger', 'about', 'synopsis'], Immutable.Map())
          .setIn(['ledger', 'about', 'synopsisOptions'], Immutable.Map())

        before(function () {
          normalizePinnedSpy = sinon.spy(ledgerApi, 'normalizePinned')
          roundToTargetSpy = sinon.spy(ledgerApi, 'roundToTarget')
          visiblePStub = sinon.stub(ledgerUtil, 'visibleP', () => true)
        })

        afterEach(function () {
          normalizePinnedSpy.reset()
          roundToTargetSpy.reset()
        })

        after(function () {
          normalizePinnedSpy.restore()
          roundToTargetSpy.restore()
          visiblePStub.restore()
        })

        it('changed publisher is not known', function () {
          let result = ledgerApi.synopsisNormalizer(dataState, null)
          assert(normalizePinnedSpy.calledOnce)
          assert(roundToTargetSpy.calledOnce)
          result = result.setIn(['ledger', 'about', 'synopsis'], {})
          const newState = expectedSate
            .setIn(['ledger', 'synopsis', 'publishers', 'site1', 'pinPercentage'], 43)
            .setIn(['ledger', 'synopsis', 'publishers', 'site1', 'weight'], 42.857142857142854)
            .setIn(['ledger', 'synopsis', 'publishers', 'site2', 'pinPercentage'], 29)
            .setIn(['ledger', 'synopsis', 'publishers', 'site2', 'weight'], 28.57142857142857)
            .setIn(['ledger', 'synopsis', 'publishers', 'site3', 'pinPercentage'], 28)
            .setIn(['ledger', 'synopsis', 'publishers', 'site3', 'weight'], 28.57142857142857)
            .setIn(['siteSettings', 'https?://site1', 'ledgerPinPercentage'], 43)
            .setIn(['siteSettings', 'https?://site2', 'ledgerPinPercentage'], 29)
            .setIn(['siteSettings', 'https?://site3', 'ledgerPinPercentage'], 28)
          assert.deepEqual(result.toJS(), newState.toJS())
        })

        it('changed publisher is known', function () {
          let result = ledgerApi.synopsisNormalizer(dataState, 'site2')
          assert(normalizePinnedSpy.calledOnce)
          assert(roundToTargetSpy.calledOnce)
          result = result.setIn(['ledger', 'about', 'synopsis'], {})
          const newState = expectedSate
            .setIn(['ledger', 'synopsis', 'publishers', 'site1', 'pinPercentage'], 48)
            .setIn(['ledger', 'synopsis', 'publishers', 'site1', 'weight'], 48)
            .setIn(['ledger', 'synopsis', 'publishers', 'site2', 'pinPercentage'], 20)
            .setIn(['ledger', 'synopsis', 'publishers', 'site2', 'weight'], 20)
            .setIn(['ledger', 'synopsis', 'publishers', 'site3', 'pinPercentage'], 32)
            .setIn(['ledger', 'synopsis', 'publishers', 'site3', 'weight'], 32)
            .setIn(['siteSettings', 'https?://site1', 'ledgerPinPercentage'], 48)
            .setIn(['siteSettings', 'https?://site2', 'ledgerPinPercentage'], 20)
            .setIn(['siteSettings', 'https?://site3', 'ledgerPinPercentage'], 32)
          assert.deepEqual(result.toJS(), newState.toJS())
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
          }
        }

        const result = ledgerApi.pruneSynopsis(defaultAppState)
        assert.deepEqual(result.toJS(), expectedResult)
      })
    })

    describe('checkVerifiedStatus', function () {
      let verifiedPSpy, onPublishersOptionUpdateSpy
      let returnValue = false

      before(function () {
        verifiedPSpy = sinon.spy(ledgerApi, 'verifiedP')
        onPublishersOptionUpdateSpy = sinon.spy(appActions, 'onPublishersOptionUpdate')

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
        onPublishersOptionUpdateSpy.reset()
      })

      after(function () {
        verifiedPSpy.restore()
        onPublishersOptionUpdateSpy.restore()
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
        assert(verifiedPSpy.withArgs(sinon.match.any, ['test.io'], sinon.match.any, 20).calledOnce)
      })

      it('change publisher verified status from true to false', function () {
        const newState = defaultAppState
          .setIn(['ledger', 'publisherTimestamp'], 20)
          .setIn(['ledger', 'synopsis', 'publishers', 'test.io', 'options', 'verifiedTimestamp'], 10)
          .setIn(['ledger', 'synopsis', 'publishers', 'test.io', 'options', 'verified'], true)

        const result = ledgerApi.checkVerifiedStatus(newState, 'test.io')
        assert.deepEqual(result.toJS(), newState.toJS())
        assert(verifiedPSpy.withArgs(sinon.match.any, ['test.io'], sinon.match.any, 20).calledOnce)
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
        assert(verifiedPSpy.withArgs(sinon.match.any, ['test1.io', 'test.io'], sinon.match.any, 20).calledOnce)
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
          duration: 1000,
          providerName: 'YouTube'
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

      it('state for this publisher is corrupted, so we need to fetch it again', function () {
        const badState = defaultAppState
          .setIn(['cache', 'ledgerVideos', videoId], Immutable.fromJS({
            publisher: publisherKey
          }))
          .setIn(['ledger', 'synopsis', 'publishers', publisherKey], Immutable.fromJS({
            options: {
              excluded: false
            }
          }))

        ledgerApi.onMediaRequest(badState, xhr, ledgerMediaProviders.YOUTUBE, 10)
        assert(mediaSpy.calledOnce)
        assert(saveVisitSpy.notCalled)
      })
    })

    describe('onMediaPublisher', function () {
      let saveVisitSpy, verifiedPStub, setPublisherSpy

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
        }
      })

      const response = Immutable.fromJS({
        publisher: publisherKey,
        faviconName: 'Brave',
        faviconURL: 'data:image/jpeg;base64,...',
        publisherURL: 'https://brave.com',
        providerName: 'Youtube'
      })

      before(function () {
        verifiedPStub = sinon.stub(ledgerApi, 'verifiedP', (state, publisherKey, fn) => state)
        saveVisitSpy = sinon.spy(ledgerApi, 'saveVisit')
        setPublisherSpy = sinon.spy(ledgerState, 'setPublisher')
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
              providerName: 'YouTube'
            }
          }
        })
      })

      after(function () {
        verifiedPStub.restore()
        saveVisitSpy.restore()
        setPublisherSpy.restore()
      })

      afterEach(function () {
        ledgerApi.setSynopsis(undefined)
        verifiedPStub.reset()
        saveVisitSpy.reset()
        setPublisherSpy.reset()
      })

      it('null case', function () {
        const result = ledgerApi.onMediaPublisher(defaultAppState)
        assert.deepEqual(result.toJS(), defaultAppState.toJS())
        assert(setPublisherSpy.notCalled)
        assert(saveVisitSpy.notCalled)
      })

      it('we do not have publisher in the synopsis', function () {
        ledgerApi.setSynopsis({
          initPublisher: () => {
            ledgerApi.setSynopsis({
              initPublisher: () => {},
              addPublisher: () => {},
              publishers: {
                [publisherKey]: {
                  exclude: false,
                  options: {
                    exclude: true
                  },
                  providerName: 'YouTube'
                }
              }
            })
          },
          addPublisher: () => {},
          publishers: { }
        })

        const newState = Immutable.fromJS({
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
          }
        })

        const state = ledgerApi.onMediaPublisher(newState, videoId, response, 1000, false)
        assert(saveVisitSpy.calledOnce)
        assert(setPublisherSpy.calledTwice)
        assert.deepEqual(state.toJS(), expectedState.toJS())
      })

      it('create publisher if new and add cache', function () {
        const state = ledgerApi.onMediaPublisher(defaultAppState, videoId, response, 1000, false)
        assert(setPublisherSpy.calledTwice)
        assert(saveVisitSpy.calledOnce)
        assert.deepEqual(state.toJS(), expectedState.toJS())
      })

      it('update publisher if exists', function () {
        const newState = Immutable.fromJS({
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
          }
        })

        const state = ledgerApi.onMediaPublisher(newState, videoId, response, 1000, false)
        assert(setPublisherSpy.calledOnce)
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
            headers: {
              'content-type': 'application/json; charset=utf-8',
              'user-agent': ''
            },
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
    let state = defaultAppState
      .setIn(['ledger', 'info', 'contributionAmount'], 0)
      .setIn(['ledger', 'info', 'monthlyAmounts'], Immutable.List([5.0, 7.5, 10.0, 17.5, 25.0, 50.0, 75.0, 100.0]))

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
        ledgerApi.onWalletProperties(state, Immutable.Map())
        assert(generatePaymentDataSpy.calledOnce)
      })
    })

    describe('addresses', function () {
      it('null case', function () {
        const result = ledgerApi.onWalletProperties(state, Immutable.Map())
        assert.deepEqual(result.toJS(), state.toJS())
      })

      it('set new addresses ', function () {
        const addresses = {
          BAT: 'BAT_address',
          BTC: 'BTC_address',
          CARD_ID: 'CARD_ID_address',
          ETH: 'ETH_address',
          LTC: 'LTC_address'
        }
        const result = ledgerApi.onWalletProperties(state, Immutable.fromJS({
          addresses: addresses
        }))
        const expectedState = state.setIn(['ledger', 'info', 'addresses'], Immutable.fromJS(addresses))
        assert.deepEqual(result.toJS(), expectedState.toJS())
      })
    })

    describe('balance', function () {
      it('null case', function () {
        const result = ledgerApi.onWalletProperties(state, Immutable.Map())
        assert.deepEqual(result.toJS(), state.toJS())
      })

      it('balance is not a number', function () {
        const result = ledgerApi.onWalletProperties(state, Immutable.fromJS({
          balance: '.'
        }))
        assert.deepEqual(result.toJS(), state.toJS())
      })

      it('set new balance', function () {
        const balance = 10.20
        const result = ledgerApi.onWalletProperties(state, Immutable.fromJS({
          balance: balance.toString()
        }))
        const expectedState = state.setIn(['ledger', 'info', 'balance'], balance)
        assert.deepEqual(result.toJS(), expectedState.toJS())
      })
    })

    describe('rates', function () {
      it('null case', function () {
        const result = ledgerApi.onWalletProperties(state, Immutable.Map())
        assert.deepEqual(result.toJS(), state.toJS())
      })

      it('set new rates', function () {
        const rate = 0.1433458965
        const rates = {
          'BTC': 0.00001966,
          'ETH': 0.00042591989579941384,
          'USD': rate,
          'EUR': 0.12100429176330299
        }

        const result = ledgerApi.onWalletProperties(state, Immutable.fromJS({
          rates: rates
        }))
        const expectedState = state
          .setIn(['ledger', 'info', 'rates'], Immutable.fromJS(rates))
          .setIn(['ledger', 'info', 'currentRate'], rate)
        assert.deepEqual(result.toJS(), expectedState.toJS())
      })
    })

    describe('current rate', function () {
      it('null case', function () {
        const result = ledgerApi.onWalletProperties(state, Immutable.Map())
        assert.deepEqual(result.toJS(), state.toJS())
      })

      it('rates are present, but there is no USD rate', function () {
        const rates = {
          'BTC': 0.00001966,
          'ETH': 0.00042591989579941384,
          'EUR': 0.12100429176330299
        }

        const result = ledgerApi.onWalletProperties(state, Immutable.fromJS({
          rates: rates
        }))
        const expectedState = state.setIn(['ledger', 'info', 'rates'], Immutable.fromJS(rates))
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

        const result = ledgerApi.onWalletProperties(state, Immutable.fromJS({
          rates: rates
        }))
        const expectedState = state
          .setIn(['ledger', 'info', 'rates'], Immutable.fromJS(rates))
          .setIn(['ledger', 'info', 'currentRate'], rate)
        assert.deepEqual(result.toJS(), expectedState.toJS())
      })
    })

    describe('monthly amount', function () {
      it('null case', function () {
        const result = ledgerApi.onWalletProperties(state, Immutable.fromJS({
          parameters: {
            adFree: {}
          }
        }))

        const expectedState = state
          .setIn(['ledger', 'info', 'contributionAmount'], 0)

        assert.deepEqual(result.toJS(), expectedState.toJS())
      })

      it('amount is negative', function () {
        const result = ledgerApi.onWalletProperties(state, Immutable.fromJS({
          parameters: {
            adFree: {
              fee: {
                BAT: -25
              }
            }
          }
        }))

        const expectedState = state
          .setIn(['ledger', 'info', 'contributionAmount'], 0)

        assert.deepEqual(result.toJS(), expectedState.toJS())
      })

      it('amount is not a number', function () {
        const result = ledgerApi.onWalletProperties(state, Immutable.fromJS({
          parameters: {
            adFree: {
              fee: {
                BAT: 'sdfsdf'
              }
            }
          }
        }))

        const expectedState = state
          .setIn(['ledger', 'info', 'contributionAmount'], 0)

        assert.deepEqual(result.toJS(), expectedState.toJS())
      })

      it('amount is float', function () {
        const result = ledgerApi.onWalletProperties(state, Immutable.fromJS({
          parameters: {
            adFree: {
              fee: {
                BAT: 17.5
              }
            }
          }
        }))

        const expectedState = state
          .setIn(['ledger', 'info', 'contributionAmount'], 17.5)

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
        const result = ledgerApi.onWalletProperties(state, Immutable.Map())
        assert.deepEqual(result.toJS(), state.toJS())
      })

      it('probi is not a number', function () {
        const result = ledgerApi.onWalletProperties(state, Immutable.fromJS({
          probi: '.'
        }))
        assert.deepEqual(result.toJS(), state.toJS())
      })

      it('rate is not present', function () {
        const result = ledgerApi.onWalletProperties(state, Immutable.fromJS({
          probi: probi,
          balance: 25
        }))
        const expectedState = state
          .setIn(['ledger', 'info', 'probi'], probi)
          .setIn(['ledger', 'info', 'balance'], 25)
        assert.deepEqual(result.toJS(), expectedState.toJS())
      })

      it('amount is null', function () {
        const result = ledgerApi.onWalletProperties(state, Immutable.fromJS({
          probi: probi,
          rates: rates
        }))
        const expectedState = state
          .setIn(['ledger', 'info', 'rates'], Immutable.fromJS(rates))
          .setIn(['ledger', 'info', 'currentRate'], rate)
          .setIn(['ledger', 'info', 'probi'], probi)
        assert.deepEqual(result.toJS(), expectedState.toJS())
      })

      it('small probi', function () {
        const result = ledgerApi.onWalletProperties(state, Immutable.fromJS({
          probi: probi,
          balance: 25,
          rates: rates
        }))
        const expectedState = state
          .setIn(['ledger', 'info', 'rates'], Immutable.fromJS(rates))
          .setIn(['ledger', 'info', 'currentRate'], rate)
          .setIn(['ledger', 'info', 'converted'], 3.5836474125)
          .setIn(['ledger', 'info', 'balance'], 25)
          .setIn(['ledger', 'info', 'probi'], probi)
        assert.deepEqual(result.toJS(), expectedState.toJS())
      })

      it('big probi', function () {
        const bigProbi = '7.309622404968674704085e+21'
        const result = ledgerApi.onWalletProperties(state, Immutable.fromJS({
          probi: bigProbi,
          balance: '7309.6224',
          rates: rates
        }))
        const expectedState = state
          .setIn(['ledger', 'info', 'rates'], Immutable.fromJS(rates))
          .setIn(['ledger', 'info', 'currentRate'], rate)
          .setIn(['ledger', 'info', 'converted'], 1047.8043767167208)
          .setIn(['ledger', 'info', 'balance'], 7309.6224)
          .setIn(['ledger', 'info', 'probi'], bigProbi)
        assert.deepEqual(result.toJS(), expectedState.toJS())
      })
    })

    describe('unconfirmed amount', function () {
      it('null case', function () {
        const result = ledgerApi.onWalletProperties(state, Immutable.Map())
        assert.deepEqual(result.toJS(), state.toJS())
      })

      it('amount is not a number', function () {
        const result = ledgerApi.onWalletProperties(state, Immutable.fromJS({
          unconfirmed: '.'
        }))
        assert.deepEqual(result.toJS(), state.toJS())
      })

      it('amount is ok', function () {
        const result = ledgerApi.onWalletProperties(state, Immutable.fromJS({
          unconfirmed: 50
        }))
        const expectedState = state
          .setIn(['ledger', 'info', 'unconfirmed'], 50)
        assert.deepEqual(result.toJS(), expectedState.toJS())
      })
    })

    describe('monthly amount list', function () {
      const oldState = state

      const body = Immutable.fromJS({
        parameters: {
          adFree: {
            choices: {
              BAT: [
                5,
                15,
                20
              ]
            }
          }
        }
      })

      before(function () {
        state = state
          .deleteIn(['ledger', 'info', 'monthlyAmounts'])
      })

      after(function () {
        state = oldState
      })

      it('null case', function () {
        const result = ledgerApi.onWalletProperties(state, Immutable.Map())
        assert.deepEqual(result.toJS(), oldState.toJS())
      })

      it('list is string', function () {
        const result = ledgerApi.onWalletProperties(state, Immutable.fromJS({
          parameters: {
            adFree: {
              choices: {
                BAT: 'rewrwer'
              }
            }
          }
        }))
        assert.deepEqual(result.toJS(), oldState.toJS())
      })

      it('user has monthly amount that is not on the list', function () {
        const result = ledgerApi.onWalletProperties(state, body)

        const expectedState = oldState
          .setIn(['ledger', 'info', 'monthlyAmounts'], Immutable.List([5.0, 10.0, 15.0, 20.0]))

        assert.deepEqual(result.toJS(), expectedState.toJS())
      })

      it('list is normal', function () {
        contributionAmount = 5

        const expectedState = oldState
        .setIn(['ledger', 'info', 'monthlyAmounts'], Immutable.List([5.0, 15.0, 20.0]))

        const result = ledgerApi.onWalletProperties(state, body)
        assert.deepEqual(result.toJS(), expectedState.toJS())

        contributionAmount = 10
      })
    })
  })

  describe('claimPromotion', function () {
    const state = defaultAppState
      .setIn(['ledger', 'promotion', 'promotionId'], '1')

    before(function () {
      ledgerApi.setClient(ledgerClientObject)
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
      assert(checkVerifiedStatusSpy.withArgs(sinon.match.any, ['clifton.io'], 20).calledOnce)
    })

    it('check multiple publishers', function () {
      const multiple = stateWithData
        .setIn(['ledger', 'synopsis', 'publishers', 'brave.com'], Immutable.fromJS({
          visits: 1
        }))
      ledgerApi.onPublisherTimestamp(multiple, 10, 20)

      assert(checkVerifiedStatusSpy.withArgs(sinon.match.any, ['clifton.io', 'brave.com'], 20).calledOnce)
    })
  })

  describe('lockInContributionAmount', function () {
    const state = defaultAppState
      .setIn(['ledger', 'info', 'contributionAmount'], 10)
    beforeEach(function () {
      onChangeSettingSpy.reset()
      contributionAmountSet = true
    })

    describe('when balance is greater than 0', function () {
      describe('when setting already has a value', function () {
        it('does not call appActions.changeSetting', function () {
          ledgerApi.lockInContributionAmount(state, 5)
          assert(onChangeSettingSpy.notCalled)
        })
      })
      describe('when setting does not have a value', function () {
        it('calls appActions.changeSetting', function () {
          contributionAmountSet = false
          ledgerApi.lockInContributionAmount(state, 5)
          assert(onChangeSettingSpy.withArgs(settings.PAYMENTS_CONTRIBUTION_AMOUNT, contributionAmount).calledOnce)
        })
      })
    })

    describe('when balance is not greater than 0', function () {
      it('does not call appActions.changeSetting', function () {
        ledgerApi.lockInContributionAmount(state, 0)
        assert(onChangeSettingSpy.notCalled)
      })
    })
  })

  describe('onCallback', function () {
    describe('wallet QR', function () {
      const resultParam = Immutable.fromJS({
        properties: {
          wallet: {
            addresses: {
              BAT: 'address'
            }
          }
        }
      })

      it('do not clear QR codes when address is the same', function () {
        const stateWithData = defaultAppState
          .setIn(['ledger', 'info', 'addresses', 'BAT'], 'address')
          .setIn(['ledger', 'info', 'walletQR', 'BAT', 'qr'])

        const result = ledgerApi.onCallback(stateWithData, resultParam)
        assert.deepEqual(result.toJS(), stateWithData.toJS())
      })

      it('clear QR code when we get new addresses', function () {
        const stateWithData = defaultAppState
          .setIn(['ledger', 'info', 'addresses', 'BAT'], 'old address')
          .setIn(['ledger', 'info', 'walletQR', 'BAT'], 'qr')

        // address is not different because we get it from the client in another call
        const expectedState = defaultAppState
          .setIn(['ledger', 'info', 'addresses', 'BAT'], 'old address')
          .setIn(['ledger', 'info', 'walletQR'], Immutable.Map())

        const result = ledgerApi.onCallback(stateWithData, resultParam)
        assert.deepEqual(result.toJS(), expectedState.toJS())
      })
    })
  })

  describe('uintKeySeed', function () {
    const buff = Buffer.from([
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

    const object = {
      0: 32,
      1: 87,
      2: 30,
      3: 26,
      4: 223,
      5: 56,
      6: 224,
      7: 31,
      8: 213,
      9: 136,
      10: 248,
      11: 95,
      12: 136,
      13: 56,
      14: 250,
      15: 78,
      16: 179,
      17: 121,
      18: 255,
      19: 162,
      20: 195,
      21: 39,
      22: 143,
      23: 136,
      24: 18,
      25: 140,
      26: 49,
      27: 216,
      28: 221,
      29: 154,
      30: 78,
      31: 173
    }

    const uint = new Uint8Array(Object.values(buff))

    it('null case', function () {
      const result = ledgerApi.uintKeySeed()
      assert.equal(result, undefined)
    })

    it('seed is in the correct format', function () {
      const result = ledgerApi.uintKeySeed(uint)
      assert.deepStrictEqual(result, uint)
    })

    it('seed needs to be converted (buffer)', function () {
      const result = ledgerApi.uintKeySeed(buff)
      assert.deepStrictEqual(result, uint)
    })

    it('seed needs to be converted (object)', function () {
      const result = ledgerApi.uintKeySeed(object)
      assert.deepStrictEqual(result, uint)
    })
  })

  describe('loadKeysFromBackupFile', function () {
    describe('when parsing the recovery key', function () {
      let stub

      afterEach(function () {
        stub.restore()
      })

      it('works with \\n (Linux)', function () {
        stub = sinon.stub(fs, 'readFileSync', (path, options) => {
          return 'Brave Wallet Recovery Key\nDate created: 01/18/2018\n\nLEDGERBACKUPTEXT4 a b d e f g h i j k l m n o p q\n\nNote: This key is not stored on Brave servers. This key is your only method of recovering your Brave wallet. Save this key in a safe place, separate from your Brave browser. Make sure you keep this key private, or else your wallet will be compromised.'
        })
        const result = ledgerApi.loadKeysFromBackupFile(undefined, 'file.txt')
        assert.equal(result.recoveryKey, 'a b d e f g h i j k l m n o p q')
      })

      it('works with \\r (Classic Mac OS)', function () {
        stub = sinon.stub(fs, 'readFileSync', (path, options) => {
          return 'Brave Wallet Recovery Key\rDate created: 01/18/2018\r\rLEDGERBACKUPTEXT4 a b d e f g h i j k l m n o p q\r\rNote: This key is not stored on Brave servers. This key is your only method of recovering your Brave wallet. Save this key in a safe place, separate from your Brave browser. Make sure you keep this key private, or else your wallet will be compromised.'
        })
        const result = ledgerApi.loadKeysFromBackupFile(undefined, 'file.txt')
        assert.equal(result.recoveryKey, 'a b d e f g h i j k l m n o p q')
      })

      it('works with \\r\\n (Windows)', function () {
        stub = sinon.stub(fs, 'readFileSync', (path, options) => {
          return 'Brave Wallet Recovery Key\r\nDate created: 01/18/2018\r\n\r\nLEDGERBACKUPTEXT4 a b d e f g h i j k l m n o p q\r\nNote: This key is not stored on Brave servers. This key is your only method of recovering your Brave wallet. Save this key in a safe place, separate from your Brave browser. Make sure you keep this key private, or else your wallet will be compromised.'
        })
        const result = ledgerApi.loadKeysFromBackupFile(undefined, 'file.txt')
        assert.equal(result.recoveryKey, 'a b d e f g h i j k l m n o p q')
      })
    })
  })

  describe('checkReferralActivity', function () {
    let checkForUpdateSpy, roundtripSpy, fakeClock

    before(function () {
      checkForUpdateSpy = sinon.stub(updater, 'checkForUpdate')
      roundtripSpy = sinon.stub(ledgerApi, 'roundtrip')
      fakeClock = sinon.useFakeTimers()
      fakeClock.tick(86402000)
    })

    afterEach(function () {
      checkForUpdateSpy.reset()
      roundtripSpy.reset()
    })

    after(function () {
      checkForUpdateSpy.restore()
      roundtripSpy.restore()
      fakeClock.restore()
    })

    it('null case', function () {
      const returnState = ledgerApi.checkReferralActivity(defaultAppState)
      assert(roundtripSpy.notCalled)
      assert(checkForUpdateSpy.withArgs(false, true).calledOnce)
      assert.deepEqual(returnState.toJS(), defaultAppState.toJS())
    })

    it('counter is greater then 30', function () {
      const state = defaultAppState
        .setIn(['updates', 'referralDownloadId'], 1234)
        .setIn(['updates', 'referralAttemptCount'], 30)
      const expectedState = defaultAppState
        .setIn(['updates'], Immutable.Map())
      const returnState = ledgerApi.checkReferralActivity(state)
      assert(checkForUpdateSpy.withArgs(false, true).calledOnce)
      assert(roundtripSpy.notCalled)
      assert.deepEqual(returnState.toJS(), expectedState.toJS())
    })

    it('makes call if this is the first attempt', function () {
      const state = defaultAppState
        .setIn(['updates', 'referralDownloadId'], 1234)
        .setIn(['updates', 'referralAttemptCount'], 1)
      const expectedState = state
        .setIn(['updates', 'referralAttemptCount'], 2)
        .setIn(['updates', 'referralAttemptTimestamp'], 86402000)
      const returnState = ledgerApi.checkReferralActivity(state)
      assert(roundtripSpy.calledOnce)
      assert.deepEqual(returnState.toJS(), expectedState.toJS())
    })

    it('does not make call if within 24 hours of an attempt', function () {
      const state = defaultAppState
        .setIn(['updates', 'referralDownloadId'], 1234)
        .setIn(['updates', 'referralAttemptCount'], 1)
        .setIn(['updates', 'referralAttemptTimestamp'], 87402000)
      const returnState = ledgerApi.checkReferralActivity(state)
      assert(checkForUpdateSpy.withArgs(false, true).calledOnce)
      assert(roundtripSpy.notCalled)
      assert.deepEqual(returnState.toJS(), state.toJS())
    })

    it('round trip is called', function () {
      fakeClock.tick(86402000)
      const state = defaultAppState
        .setIn(['updates', 'referralDownloadId'], 1234)
        .setIn(['updates', 'referralAttemptTimestamp'], 86400000)
      const expectedState = state
        .setIn(['updates', 'referralAttemptCount'], 1)
        .setIn(['updates', 'referralAttemptTimestamp'], 172804000)
      const returnState = ledgerApi.checkReferralActivity(state)
      assert(roundtripSpy.calledOnce)
      assert.deepEqual(returnState.toJS(), expectedState.toJS())
    })
  })

  describe('activityRoundTrip', function () {
    let checkForUpdateSpy, onReferralActivitySpy

    before(function () {
      checkForUpdateSpy = sinon.stub(updater, 'checkForUpdate')
      onReferralActivitySpy = sinon.spy(appActions, 'onReferralActivity')
    })

    afterEach(function () {
      checkForUpdateSpy.reset()
      onReferralActivitySpy.reset()
    })

    after(function () {
      checkForUpdateSpy.restore()
      onReferralActivitySpy.restore()
    })

    it('error', function () {
      ledgerApi.activityRoundTrip('error')
      assert(checkForUpdateSpy.withArgs(false, true).calledOnce)
    })

    it('referral activity is not finalized yet', function () {
      ledgerApi.activityRoundTrip(null, null, {finalized: false})
      assert(checkForUpdateSpy.withArgs(false, true).calledOnce)
    })

    it('referral activity is finalized', function () {
      ledgerApi.activityRoundTrip(null, null, {finalized: true})
      assert(checkForUpdateSpy.notCalled)
      assert(onReferralActivitySpy.calledOnce)
    })
  })

  describe('pathName', function () {
    it('null case', function () {
      const result = ledgerApi.pathName()
      assert.equal(result, null)
    })

    it('name is a file', function () {
      const result = ledgerApi.pathName('test')
      assert.equal(result, `${process.cwd()}/userData/test`)
    })

    it('name has folder path', function () {
      const result = ledgerApi.pathName('folder/test')
      assert.equal(result, `${process.cwd()}/userData/folder/test`)
    })
  })

  describe('onReferralInit', function () {
    let onReferralCodeReadSpy, fsUnlinkSpy

    before(function () {
      onReferralCodeReadSpy = sinon.spy(appActions, 'onReferralCodeRead')
      fsUnlinkSpy = sinon.spy(fs, 'unlink')
    })

    afterEach(function () {
      onReferralCodeReadSpy.reset()
      fsUnlinkSpy.reset()
    })

    after(function () {
      onReferralCodeReadSpy.restore()
      fsUnlinkSpy.restore()
    })

    it('null case', function () {
      ledgerApi.onReferralInit()
      assert(onReferralCodeReadSpy.notCalled)
      assert(fsUnlinkSpy.notCalled)
    })

    it('on error', function () {
      ledgerApi.onReferralInit('error')
      assert(onReferralCodeReadSpy.notCalled)
      assert(fsUnlinkSpy.notCalled)
    })

    it('download id is missing', function () {
      ledgerApi.onReferralInit(null, null, {})
      assert(onReferralCodeReadSpy.notCalled)
      assert(fsUnlinkSpy.notCalled)
    })

    it('download id is provided', function () {
      ledgerApi.onReferralInit(null, null, {download_id: 'rwerer'})
      assert(onReferralCodeReadSpy.calledOnce)
      assert(fsUnlinkSpy.calledOnce)
    })
  })

  describe('onReferralCodeRead', function () {
    let roundtripSpy

    before(function () {
      roundtripSpy = sinon.stub(ledgerApi, 'roundtrip')
    })

    afterEach(function () {
      roundtripSpy.reset()
    })

    after(function () {
      roundtripSpy.restore()
    })

    it('null case', function () {
      ledgerApi.onReferralCodeRead()
      assert(roundtripSpy.notCalled)
    })

    it('code is empty', function () {
      ledgerApi.onReferralCodeRead('')
      assert(roundtripSpy.notCalled)
    })

    it('code is correct', function () {
      ledgerApi.onReferralCodeRead('aaa101')
      assert(roundtripSpy.calledOnce)
    })
  })

  describe('referralCheck', function () {
    let deleteUpdatePropSpy, fakeClock

    before(function () {
      deleteUpdatePropSpy = sinon.spy(updateState, 'deleteUpdateProp')
      fakeClock = sinon.useFakeTimers()
      fakeClock.tick(172800000)
    })

    afterEach(function () {
      deleteUpdatePropSpy.reset()
      fakeClock.reset()
    })

    after(function () {
      deleteUpdatePropSpy.restore()
      fakeClock.restore()
    })

    it('first run is only few days', function () {
      const state = defaultAppState
        .set('firstRunTimestamp', 1000)
        .setIn(['updates', 'referralPromoCode'], '1234')
      const returnedState = ledgerApi.referralCheck(state)
      assert.deepEqual(returnedState.toJS(), state.toJS())
      assert(deleteUpdatePropSpy.notCalled)
    })

    it('first run is over 90 days so we can delete promo code', function () {
      const state = defaultAppState
        .set('firstRunTimestamp', 1000)
        .setIn(['updates', 'referralPromoCode'], '1234')
      fakeClock.tick(7776000000) // 90 days
      const expectedState = state
        .deleteIn(['updates', 'referralPromoCode'])
      const returnedState = ledgerApi.referralCheck(state)
      assert.deepEqual(returnedState.toJS(), expectedState.toJS())
      assert(deleteUpdatePropSpy.calledOnce)
    })
  })

  describe('onVerifiedPStatus', function () {
    let onPublishersOptionUpdateSpy

    before(function () {
      onPublishersOptionUpdateSpy = sinon.spy(appActions, 'onPublishersOptionUpdate')
    })

    afterEach(function () {
      onPublishersOptionUpdateSpy.reset()
    })

    after(function () {
      onPublishersOptionUpdateSpy.restore()
    })

    it('null case', function () {
      ledgerApi.onVerifiedPStatus()
      assert(onPublishersOptionUpdateSpy.notCalled)
    })

    it('on error', function () {
      ledgerApi.onVerifiedPStatus('error')
      assert(onPublishersOptionUpdateSpy.notCalled)
    })

    it('convert regular object into array', function () {
      ledgerApi.onVerifiedPStatus(null, {
        SLD: 'clifton.io',
        RLD: '',
        QLD: '',
        publisher: 'clifton.io',
        properties: { timestamp: '6509162935841980427', verified: true }
      }, 100)
      assert(onPublishersOptionUpdateSpy.withArgs([
        {
          publisherKey: 'clifton.io',
          verified: true,
          verifiedTimestamp: 100
        }
      ]).calledOnce)
    })

    it('all publishers has errors', function () {
      ledgerApi.onVerifiedPStatus(null, [
        {
          publisher: 'https://clifton.io/',
          err: 'error'
        },
        {
          publisher: 'https://brianbondy.com/',
          err: 'error'
        }
      ], 100)
      assert(onPublishersOptionUpdateSpy.notCalled)
    })

    it('publishers are ok', function () {
      ledgerApi.onVerifiedPStatus(null, [
        {
          SLD: 'clifton.io',
          RLD: '',
          QLD: '',
          publisher: 'clifton.io',
          properties: { timestamp: '6509162935841980427', verified: true }
        },
        {
          publisher: 'https://test.com/',
          err: 'error'
        },
        {
          SLD: 'brianbondy.com',
          RLD: '',
          QLD: '',
          publisher: 'brianbondy.com',
          properties: { timestamp: '6509162935841940427', verified: false }
        }
      ], 100)
      assert(onPublishersOptionUpdateSpy.withArgs([
        {
          publisherKey: 'clifton.io',
          verified: true,
          verifiedTimestamp: 100
        },
        {
          publisherKey: 'brianbondy.com',
          verified: false,
          verifiedTimestamp: 100
        }
      ]).calledOnce)
    })
  })

  describe('setPublishersOptions', function () {
    let savePublisherOptionSpy

    before(function () {
      savePublisherOptionSpy = sinon.spy(ledgerApi, 'savePublisherOption')
    })

    afterEach(function () {
      savePublisherOptionSpy.reset()
    })

    after(function () {
      savePublisherOptionSpy.restore()
    })

    it('null case', function () {
      const result = ledgerApi.setPublishersOptions(defaultAppState)
      assert(savePublisherOptionSpy.notCalled)
      assert.deepEqual(result.toJS(), defaultAppState.toJS())
    })

    it('publisher list is empty', function () {
      const result = ledgerApi.setPublishersOptions(defaultAppState, Immutable.List())
      assert(savePublisherOptionSpy.notCalled)
      assert.deepEqual(result.toJS(), defaultAppState.toJS())
    })

    it('publisher is missing publisherKey', function () {
      const result = ledgerApi.setPublishersOptions(defaultAppState, Immutable.fromJS([
        {
          verified: true,
          verifiedTimestamp: 100
        }
      ]))
      assert(savePublisherOptionSpy.notCalled)
      assert.deepEqual(result.toJS(), defaultAppState.toJS())
    })

    it('publisher list is ok', function () {
      const result = ledgerApi.setPublishersOptions(defaultAppState, Immutable.fromJS([
        {
          publisherKey: 'clifton.io',
          verified: true,
          verifiedTimestamp: 100
        },
        {
          publisherKey: 'brianbondy.com',
          verified: false,
          verifiedTimestamp: 200
        }
      ]))
      const expectedState = defaultAppState
        .setIn(['ledger', 'synopsis', 'publishers'], Immutable.fromJS({
          'clifton.io': {
            options: {
              verified: true,
              verifiedTimestamp: 100
            }
          },
          'brianbondy.com': {
            options: {
              verified: false,
              verifiedTimestamp: 200
            }
          }
        }))

      assert(savePublisherOptionSpy.withArgs('clifton.io', 'verified', true).calledOnce)
      assert(savePublisherOptionSpy.withArgs('clifton.io', 'verifiedTimestamp', 100).calledOnce)
      assert(savePublisherOptionSpy.withArgs('brianbondy.com', 'verified', false).calledOnce)
      assert(savePublisherOptionSpy.withArgs('brianbondy.com', 'verifiedTimestamp', 200).calledOnce)
      assert.deepEqual(result.toJS(), expectedState.toJS())
    })
  })

  describe('onFavIconReceived', function () {
    let savePublisherDataSpy, setPublishersPropSpy
    const publisherKey = 'clifton.io'
    const icon = 'blob'

    before(function () {
      savePublisherDataSpy = sinon.spy(ledgerApi, 'savePublisherData')
      setPublishersPropSpy = sinon.spy(ledgerState, 'setPublishersProp')
    })

    afterEach(function () {
      savePublisherDataSpy.reset()
      setPublishersPropSpy.reset()
    })

    after(function () {
      savePublisherDataSpy.restore()
      setPublishersPropSpy.restore()
    })

    it('null case', function () {
      const result = ledgerApi.onFavIconReceived(defaultAppState)
      assert(savePublisherDataSpy.notCalled)
      assert(setPublishersPropSpy.notCalled)
      assert.deepEqual(result.toJS(), defaultAppState.toJS())
    })

    it('icon is saved', function () {
      const expectedSate = defaultAppState
        .setIn(['ledger', 'synopsis', 'publishers', publisherKey, 'faviconURL'], icon)
      const result = ledgerApi.onFavIconReceived(defaultAppState, publisherKey, icon)
      assert(setPublishersPropSpy.withArgs(sinon.match.any, publisherKey, 'faviconURL', icon).calledOnce)
      assert(savePublisherDataSpy.calledOnce)
      assert.deepEqual(result.toJS(), expectedSate.toJS())
    })
  })

  describe('savePublisherOption', function () {
    const expectedSynopsis = {
      options: {},
      publishers: {
        'clifton.io': {
          options: {
            excluded: true
          }
        }
      }
    }

    after(() => {
      ledgerApi.setSynopsis(undefined)
    })

    it('null case', function () {
      ledgerApi.setSynopsis(undefined)
      ledgerApi.savePublisherOption()
      assert.equal(ledgerApi.getSynopsis(), undefined)
    })

    it('publishers object is missing', function () {
      ledgerApi.setSynopsis({
        options: {}
      })
      ledgerApi.savePublisherOption('clifton.io', 'excluded', true)
      assert.deepEqual(ledgerApi.getSynopsis(), {
        options: {}
      })
    })

    it('publisher is missing in the synopsis', function () {
      ledgerApi.setSynopsis({
        options: {},
        publishers: {}
      })
      ledgerApi.savePublisherOption('clifton.io', 'excluded', true)
      assert.deepEqual(ledgerApi.getSynopsis(), expectedSynopsis)
    })

    it('options is missing in the synopsis', function () {
      ledgerApi.setSynopsis({
        options: {},
        publishers: {
          'clifton.io': {}
        }
      })
      ledgerApi.savePublisherOption('clifton.io', 'excluded', true)
      assert.deepEqual(ledgerApi.getSynopsis(), expectedSynopsis)
    })

    it('option already exists', function () {
      ledgerApi.setSynopsis({
        options: {},
        publishers: {
          'clifton.io': {
            options: {
              excluded: false
            }
          }
        }
      })
      ledgerApi.savePublisherOption('clifton.io', 'excluded', true)
      assert.deepEqual(ledgerApi.getSynopsis(), expectedSynopsis)
    })
  })

  describe('savePublisherData', function () {
    const expectedSynopsis = {
      options: {},
      publishers: {
        'clifton.io': {
          faviconURL: 'data'
        }
      }
    }

    after(() => {
      ledgerApi.setSynopsis(undefined)
    })

    it('null case', function () {
      ledgerApi.setSynopsis(undefined)
      ledgerApi.savePublisherData()
      assert.equal(ledgerApi.getSynopsis(), undefined)
    })

    it('publishers object is missing', function () {
      ledgerApi.setSynopsis({
        options: {}
      })
      ledgerApi.savePublisherData('clifton.io', 'faviconURL', 'data')
      assert.deepEqual(ledgerApi.getSynopsis(), {
        options: {}
      })
    })

    it('publisher is missing in the synopsis', function () {
      ledgerApi.setSynopsis({
        options: {},
        publishers: {}
      })
      ledgerApi.savePublisherData('clifton.io', 'faviconURL', 'data')
      assert.deepEqual(ledgerApi.getSynopsis(), expectedSynopsis)
    })

    it('publisher already exists', function () {
      ledgerApi.setSynopsis({
        options: {},
        publishers: {
          'clifton.io': {
            faviconURL: 'oldData'
          }
        }
      })
      ledgerApi.savePublisherData('clifton.io', 'faviconURL', 'data')
      assert.deepEqual(ledgerApi.getSynopsis(), expectedSynopsis)
    })
  })
})
