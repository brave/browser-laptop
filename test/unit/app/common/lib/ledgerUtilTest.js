/* global describe, before, after, it */
const mockery = require('mockery')
const assert = require('assert')
const Immutable = require('immutable')
require('../../../braveUnit')
const settings = require('../../../../../js/constants/settings')
const ledgerMediaProviders = require('../../../../../app/common/constants/ledgerMediaProviders')
const twitchEvents = require('../../../../../app/common/constants/twitchEvents')
const urlUtil = require('../../../../../js/lib/urlutil')
const ledgerStatuses = require('../../../../../app/common/constants/ledgerStatuses')

const defaultState = Immutable.fromJS({
  ledger: {}
})
const baseState = Immutable.fromJS({
  cache: {
    ledgerVideos: {}
  }
})
const stateWithData = Immutable.fromJS({
  cache: {
    ledgerVideos: {
      'twitch_test': {
        publisher: 'twitch#author:test',
        event: twitchEvents.START,
        time: 1519279886
      }
    }
  }
})

describe('ledgerUtil unit test', function () {
  let ledgerUtil
  let fakeLevel
  const fakeElectron = require('../../../lib/fakeElectron')
  const fakeAdBlock = require('../../../lib/fakeAdBlock')

  // settings
  let paymentsMinVisits
  let paymentsMinVisitTime
  let paymentsContributionAmount = 25

  before(function () {
    mockery.enable({
      warnOnReplace: false,
      warnOnUnregistered: false,
      useCleanCache: true
    })

    fakeLevel = () => {
    }

    mockery.registerMock('electron', fakeElectron)
    mockery.registerMock('ad-block', fakeAdBlock)
    mockery.registerMock('level', fakeLevel)
    mockery.registerMock('../../../img/mediaProviders/youtube.png', 'youtube.png')
    mockery.registerMock('../../../img/mediaProviders/twitch.svg', 'twitch.svg')

    mockery.registerMock('../../../js/settings', {
      getSetting: (settingKey) => {
        switch (settingKey) {
          case settings.PAYMENTS_MINIMUM_VISITS:
            return paymentsMinVisits
          case settings.PAYMENTS_MINIMUM_VISIT_TIME:
            return paymentsMinVisitTime
          case settings.PAYMENTS_CONTRIBUTION_AMOUNT:
            return paymentsContributionAmount
        }
        return false
      }
    })

    ledgerUtil = require('../../../../../app/common/lib/ledgerUtil')
  })

  after(function () {
    mockery.disable()
  })

  describe('shouldTrackView', function () {
    it('null case', function () {
      assert.equal(ledgerUtil.shouldTrackView(), false)
    })

    it('we have about error, but dont have tab navigationState', function () {
      const param = Immutable.fromJS({
        aboutDetails: {
          title: 'error'
        }
      })
      assert.equal(ledgerUtil.shouldTrackView(param), false)
    })

    it('we have tab, but dont have active entry', function () {
      const param = Immutable.fromJS({
        navigationState: {}
      })
      assert.equal(ledgerUtil.shouldTrackView(param), false)
    })

    it('we have tab, but active entry dont have httpStatusCode', function () {
      const param = Immutable.fromJS({
        navigationState: {
          activeEntry: {}
        }
      })
      assert.equal(ledgerUtil.shouldTrackView(param), false)
    })

    it('we have tab, but httpStatusCode is 500', function () {
      let param = Immutable.fromJS({
        navigationState: {}
      })

      param = param.setIn(['navigationState', 'activeEntry'], {
        httpStatusCode: 500
      })
      assert.equal(ledgerUtil.shouldTrackView(param), false)
    })

    it('we have tab and httpStatusCode is 200', function () {
      let param = Immutable.fromJS({
        navigationState: {}
      })
      param = param.setIn(['navigationState', 'activeEntry'], {
        httpStatusCode: 200
      })
      assert.equal(ledgerUtil.shouldTrackView(param), true)
    })

    it('we have tab and httpStatusCode is 200, but we have aboutDetails', function () {
      let param = Immutable.fromJS({
        aboutDetails: {
          title: 'error'
        },
        navigationState: {}
      })
      param = param.setIn(['navigationState', 'activeEntry'], {
        httpStatusCode: 200
      })
      assert.equal(ledgerUtil.shouldTrackView(param), false)
    })
  })

  describe('batToCurrencyString', function () {
    let ledgerData

    before(function () {
      ledgerData = Immutable.fromJS({
        currentRate: '2',
        rates: {
          'BTC': 0.2222
        }
      })
    })
    it('null case', function () {
      const result = ledgerUtil.batToCurrencyString()
      assert.equal(result, '0.00 USD')
    })

    it('ledgerData is missing', function () {
      const result = ledgerUtil.batToCurrencyString(1)
      assert.equal(result, '')
    })

    it('rates are not defined yet', function () {
      const data = ledgerData.delete('rates')
      const result = ledgerUtil.batToCurrencyString(1, data)
      assert.equal(result, '')
    })

    it('bat is converted', function () {
      const result = ledgerUtil.batToCurrencyString(5, ledgerData)
      assert.equal(result, '10.00 USD')
    })
  })

  describe('formatCurrentBalance', function () {
    let ledgerData

    before(function () {
      ledgerData = Immutable.fromJS({
        paymentId: 'f5240e31-7df6-466d-9606-adc759298731',
        countryCode: 'US',
        unconfirmed: '0.0000',
        hasBitcoinHandler: false,
        bravery: {
          setting: 'adFree',
          days: 30,
          fee: {
            currency: 'USD',
            amount: 10
          }
        },
        currentRate: '1',
        error: null,
        created: true,
        converted: 1.1234,
        buyURL: undefined,
        paymentURL: 'bitcoin:btc-address-goes-here?amount=5&label=Brave%20Software',
        passphrase: 'd588b7e3-352d-49ce-8d0f-a4cae1fa4c76',
        buyMaximumUSD: 6,
        reconcileFrequency: 30,
        currency: 'USD',
        btc: '0.00277334',
        address: 'btc-address-goes-here',
        reconcileStamp: 1405324210587,
        transactions: [],
        amount: 10,
        creating: false,
        balance: 5.00003,
        paymentIMG: undefined,
        rates: {
          'BTC': 0.2222
        }
      })
    })

    it('defaults to 0 as balance when currency is not present', function () {
      const result = ledgerUtil.formatCurrentBalance()
      assert.equal(result, '0.00 BAT')
    })

    it('defaults to 0 as balance when rate is not present', function () {
      const data = ledgerData.delete('rates')
      const result = ledgerUtil.formatCurrentBalance(data, ledgerData.get('balance'))
      assert.equal(result, '5.00 BAT')
    })

    it('formats `balance` and `converted` values to two decimal places', function () {
      const result = ledgerUtil.formatCurrentBalance(ledgerData, ledgerData.get('balance'))
      assert.equal(result, '5.00 BAT (1.12 USD)')
    })

    it('defaults `balance` to 0 if not found', function () {
      const result = ledgerUtil.formatCurrentBalance(ledgerData.delete('balance'))
      assert.equal(result, '0.00 BAT (1.12 USD)')
    })

    it('defaults `converted` to 0 if not found', function () {
      const result = ledgerUtil.formatCurrentBalance(ledgerData.delete('converted'), ledgerData.get('balance'))
      assert.equal(result, '5.00 BAT (0.00 USD)')
    })

    it('handles `balance` being a string', function () {
      const result = ledgerUtil.formatCurrentBalance(ledgerData, 5)
      assert.equal(result, '5.00 BAT (1.12 USD)')
    })

    it('handles `converted` being a string', function () {
      const result = ledgerUtil.formatCurrentBalance(ledgerData.set('converted', '1.1234'), ledgerData.get('balance'))
      assert.equal(result, '5.00 BAT (1.12 USD)')
    })

    it('custom format for amount lower then 0.01', function () {
      const result = ledgerUtil.formatCurrentBalance(ledgerData.set('converted', '0.004'), ledgerData.get('balance'))
      assert.equal(result, '5.00 BAT (< 0.01 USD)')
    })

    it('formats only `balance` when alt is excluded', function () {
      const result = ledgerUtil.formatCurrentBalance(ledgerData, ledgerData.get('balance'), false)
      assert.equal(result, '5.00 BAT')
    })
  })

  describe('formattedTimeFromNow', function () {
  })

  describe('formattedDateFromTimestamp', function () {
  })

  describe('walletStatus', function () {
    it('null case', function () {
      const result = ledgerUtil.walletStatus(Immutable.Map())
      assert.deepEqual(result, {
        id: 'createWalletStatus'
      })
    })

    it('on fuzzing', function () {
      const result = ledgerUtil.walletStatus(Immutable.fromJS({
        status: ledgerStatuses.FUZZING
      }))
      assert.deepEqual(result, {
        id: 'ledgerFuzzed'
      })
    })

    it('on error', function () {
      const state = Immutable.fromJS({
        error: {
          caller: 'recoveryWallet',
          err: 'No data in backup file'
        }
      })
      const result = ledgerUtil.walletStatus(state)
      assert.deepEqual(result, {
        id: 'statusOnError'
      })
    })

    describe('wallet created', function () {
      describe('insufficient funds', function () {
        it('min balance is missing', function () {
          const state = Immutable.fromJS({
            created: 1111,
            unconfirmed: 24
          })
          const result = ledgerUtil.walletStatus(state)
          assert.deepEqual(result, {
            id: 'insufficientFundsStatus'
          })
        })

        it('funds are above budget', function () {
          const state = Immutable.fromJS({
            created: 1111,
            balance: 30
          })
          const result = ledgerUtil.walletStatus(state)
          assert.deepEqual(result, {
            id: 'createdWalletStatus'
          })
        })

        it('funds are bellow budget', function () {
          const state = Immutable.fromJS({
            created: 1111,
            unconfirmed: 5,
            balance: 10
          })
          const result = ledgerUtil.walletStatus(state)
          assert.deepEqual(result, {
            id: 'insufficientFundsStatus'
          })
        })
      })
    })

    describe('pending funds', function () {
      it('without conversion', function () {
        const state = Immutable.fromJS({
          created: 1111,
          unconfirmed: 5,
          balance: 25
        })
        const result = ledgerUtil.walletStatus(state)
        assert.deepEqual(result, {
          id: 'pendingFundsStatus',
          args: {
            funds: '5.00 BAT'
          }
        })
      })

      it('with conversion', function () {
        const state = Immutable.fromJS({
          created: 1111,
          unconfirmed: 5,
          balance: 25,
          currentRate: 1.5,
          rates: {
            BTC: '0.2'
          }
        })
        const result = ledgerUtil.walletStatus(state)
        assert.deepEqual(result, {
          id: 'pendingFundsStatus',
          args: {
            funds: '5.00 BAT (7.50 USD)'
          }
        })
      })
    })

    it('default crated wallet', function () {
      const state = Immutable.fromJS({
        created: 1111,
        balance: 25
      })
      const result = ledgerUtil.walletStatus(state)
      assert.deepEqual(result, {
        id: 'createdWalletStatus'
      })
    })

    it('wallet with transactions', function () {
      const state = Immutable.fromJS({
        created: 1111,
        balance: 25,
        transactions: [
          {
            timestamp: 1111
          }
        ]
      })
      const result = ledgerUtil.walletStatus(state)
      assert.deepEqual(result, {
        id: 'defaultWalletStatus'
      })
    })

    it('wallet is creating', function () {
      const state = Immutable.fromJS({
        creating: 1111
      })
      const result = ledgerUtil.walletStatus(state)
      assert.deepEqual(result, {
        id: 'creatingWalletStatus'
      })
    })

    it('wallet not crated', function () {
      const result = ledgerUtil.walletStatus(Immutable.Map())
      assert.deepEqual(result, {
        id: 'createWalletStatus'
      })
    })
  })

  describe('shouldShowMenuOption', function () {
    let ledgerState

    before(function () {
      ledgerState = Immutable.fromJS({
        ledger: {},
        siteSettings: {}
      })
    })

    it('null location', function () {
      const result = ledgerUtil.shouldShowMenuOption(ledgerState, null)
      assert.equal(result, false)
    })

    it('false when location is an invalid url', function () {
      const result = ledgerUtil.shouldShowMenuOption(ledgerState, 'brave')
      assert.equal(result, false)
    })

    it('false if url contains a bad domain', function () {
      const result = ledgerUtil.shouldShowMenuOption(ledgerState, 'https://foobar.bananas')
      assert.equal(result, false)
    })

    it('false if a publisher key can not be deduced', function () {
      const result = ledgerUtil.shouldShowMenuOption(ledgerState, 'bravecom/about')
      assert.equal(result, false)
    })

    it('false when the publisher has been deleted from the ledger', function () {
      const publisherKey = 'brave.com'
      const hostPattern = urlUtil.getHostPattern(publisherKey)
      const modifiedState = ledgerState
        .setIn(['siteSettings', hostPattern, 'ledgerPaymentsShown'], false)
      const result = ledgerUtil.shouldShowMenuOption(modifiedState, 'https://brave.com')
      assert.equal(result, false)
    })

    it('true if the publisher has not been deleted from the ledger', function () {
      const publisherKey = 'foo.com'
      const hostPattern = urlUtil.getHostPattern(publisherKey)
      const modifiedState = ledgerState
        .setIn(['siteSettings', hostPattern, 'ledgerPaymentsShown'], false)
      const result = ledgerUtil.shouldShowMenuOption(modifiedState, 'https://brave.com')
      assert.equal(result, true)
    })

    it('true when location has protocol and is a valid url', function () {
      const result = ledgerUtil.shouldShowMenuOption(ledgerState, 'https://brave.com')
      assert.equal(result, true)
    })

    it('true when location has protocol and is a valid url', function () {
      const result = ledgerUtil.shouldShowMenuOption(ledgerState, 'http://www.brave.com')
      assert.equal(result, true)
    })

    it('true when location is valid and is not present in the ledger', function () {
      const stateWithLocations = Immutable.fromJS({
        ledger: {
          locations: [
            'ebay.com'
          ]
        }
      })
      const result = ledgerUtil.shouldShowMenuOption(stateWithLocations, 'https://brave.com')
      assert.equal(result, true)
    })
  })

  describe('getMediaId', function () {
    it('null case', function () {
      const result = ledgerUtil.getMediaId()
      assert.equal(result, null)
    })

    it('unknown type', function () {
      const result = ledgerUtil.getMediaId({}, 'test')
      assert.equal(result, null)
    })

    describe('Youtube', function () {
      it('null case', function () {
        const result = ledgerUtil.getMediaId(null, ledgerMediaProviders.YOUTUBE)
        assert.equal(result, null)
      })

      it('id is provided', function () {
        const result = ledgerUtil.getMediaId({docid: 'kLiLOkzLetE'}, ledgerMediaProviders.YOUTUBE)
        assert.equal(result, 'kLiLOkzLetE')
      })
    })

    describe('Twitch', function () {
      it('null case', function () {
        const result = ledgerUtil.getMediaId(null, ledgerMediaProviders.TWITCH)
        assert.equal(result, null)
      })

      it('event is not correct', function () {
        const result = ledgerUtil.getMediaId({
          event: 'wrong'
        }, ledgerMediaProviders.TWITCH)
        assert.equal(result, null)
      })

      it('properties are missing', function () {
        const result = ledgerUtil.getMediaId({
          event: twitchEvents.MINUTE_WATCHED
        }, ledgerMediaProviders.TWITCH)
        assert.equal(result, null)
      })

      it('content is a live stream', function () {
        const result = ledgerUtil.getMediaId({
          event: twitchEvents.MINUTE_WATCHED,
          properties: {
            channel: 'tchannel'
          }
        }, ledgerMediaProviders.TWITCH)
        assert.equal(result, 'tchannel')
      })

      it('content is a vod', function () {
        const result = ledgerUtil.getMediaId({
          event: twitchEvents.MINUTE_WATCHED,
          properties: {
            channel: 'tchannel',
            vod: 'v12343234'
          }
        }, ledgerMediaProviders.TWITCH)
        assert.equal(result, 'tchannel_vod_12343234')
      })
    })
  })

  describe('getMediaKey', function () {
    it('null case', function () {
      const result = ledgerUtil.getMediaKey()
      assert.equal(result, null)
    })

    it('type is missing', function () {
      const result = ledgerUtil.getMediaKey('kLiLOkzLetE')
      assert.equal(result, null)
    })

    describe('YouTube', function () {
      it('id is null', function () {
        const result = ledgerUtil.getMediaKey(null, ledgerMediaProviders.YOUTUBE)
        assert.equal(result, null)
      })

      it('data is ok', function () {
        const result = ledgerUtil.getMediaKey('kLiLOkzLetE', ledgerMediaProviders.YOUTUBE)
        assert.equal(result, 'youtube_kLiLOkzLetE')
      })
    })
  })

  describe('getMediaData', function () {
    it('null case', function () {
      const result = ledgerUtil.getMediaData()
      assert.equal(result, null)
    })

    it('unknown type', function () {
      const result = ledgerUtil.getMediaData('https://youtube.com', 'test')
      assert.equal(result, null)
    })

    it('query is not present', function () {
      const result = ledgerUtil.getMediaData('https://youtube.com', ledgerMediaProviders.YOUTUBE)
      assert.equal(result, null)
    })

    describe('Youtube', function () {
      it('null case', function () {
        const result = ledgerUtil.getMediaData(null, ledgerMediaProviders.YOUTUBE)
        assert.equal(result, null)
      })

      it('query is present', function () {
        const result = ledgerUtil.getMediaData('https://www.youtube.com/api/stats/watchtime?docid=kLiLOkzLetE&st=11.338&et=21.339', ledgerMediaProviders.YOUTUBE)
        assert.deepEqual(result, {
          docid: 'kLiLOkzLetE',
          st: '11.338',
          et: '21.339'
        })
      })
    })

    describe('Twitch', function () {
      const url = 'https://video-edge-f0f586.sjc01.hls.ttvnw.net/v1/segment/CuDNI7xCy5CGJ8g7G3thdHT26OW_DhnEuVw0tRGN-DKhJxrRTeGe...'

      it('null case', function () {
        const result = ledgerUtil.getMediaData(null, ledgerMediaProviders.TWITCH)
        assert.equal(result, null)
      })

      it('uploadData is missing', function () {
        const result = ledgerUtil.getMediaData(url, ledgerMediaProviders.TWITCH, Immutable.fromJS({
          firstPartyUrl: 'https://www.twitch.tv/videos/241926348'
        }))
        assert.equal(result, null)
      })

      it('bytes is missing', function () {
        const result = ledgerUtil.getMediaData(url, ledgerMediaProviders.TWITCH, Immutable.fromJS({
          firstPartyUrl: 'https://www.twitch.tv/videos/241926348',
          uploadData: []
        }))
        assert.equal(result, null)
      })

      it('data is missing', function () {
        const result = ledgerUtil.getMediaData(url, ledgerMediaProviders.TWITCH, Immutable.fromJS({
          firstPartyUrl: 'https://www.twitch.tv/videos/241926348',
          uploadData: [{
            bytes: new Uint8Array([116, 101, 115, 116])
          }]
        }))
        assert.equal(result, null)
      })

      it('data is empty string', function () {
        const result = ledgerUtil.getMediaData(url, ledgerMediaProviders.TWITCH, Immutable.fromJS({
          firstPartyUrl: 'https://www.twitch.tv/videos/241926348',
          uploadData: [{
            bytes: new Uint8Array([100, 97, 116, 97, 61])
          }]
        }))
        assert.equal(result, null)
      })

      it('single event is parsed correctly', function () {
        const result = ledgerUtil.getMediaData(url, ledgerMediaProviders.TWITCH, Immutable.fromJS({
          firstPartyUrl: 'https://www.twitch.tv/videos/241926348',
          uploadData: [{
            bytes: new Uint8Array([
              100, 97, 116, 97, 61, 87, 51, 115, 105, 90, 88, 90, 108, 98, 110, 81, 105, 79, 105,
              74, 116, 97, 87, 53, 49, 100, 71, 85, 116, 100, 50, 70, 48, 89, 50, 104, 108, 90, 67, 73, 115, 73, 110,
              66, 121, 98, 51, 66, 108, 99, 110, 82, 112, 90, 88, 77, 105, 79, 110, 115, 105, 89, 50, 104, 104, 98,
              109, 53, 108, 98, 67, 73, 54, 73, 110, 82, 51, 73, 110, 49, 57, 88, 81, 61, 61
            ])
          }]
        }))
        assert.deepEqual(result, [{
          event: twitchEvents.MINUTE_WATCHED,
          properties: {
            channel: 'tw'
          }
        }])
      })

      it('multiple events are parsed correctly', function () {
        const result = ledgerUtil.getMediaData(url, ledgerMediaProviders.TWITCH, Immutable.fromJS({
          firstPartyUrl: 'https://www.twitch.tv/videos/241926348',
          uploadData: [{
            bytes: new Uint8Array([
              100, 97, 116, 97, 61, 87, 51, 115, 105, 90, 88, 90, 108, 98, 110, 81, 105, 79, 105,
              74, 50, 97, 87, 82, 108, 98, 121, 49, 119, 98, 71, 70, 53, 73, 105, 119, 105, 99, 72, 74, 118, 99, 71,
              86, 121, 100, 71, 108, 108, 99, 121, 73, 54, 101, 121, 74, 106, 97, 71, 70, 117, 98, 109, 86, 115, 73,
              106, 111, 105, 100, 72, 99, 105, 102, 88, 48, 115, 101, 121, 74, 108, 100, 109, 86, 117, 100, 67, 73, 54,
              73, 110, 90, 112, 90, 71, 86, 118, 88, 50, 86, 121, 99, 109, 57, 121, 73, 105, 119, 105, 99, 72, 74, 118,
              99, 71, 86, 121, 100, 71, 108, 108, 99, 121, 73, 54, 101, 121, 74, 106, 97, 71, 70, 117, 98, 109, 86,
              115, 73, 106, 111, 105, 100, 72, 99, 105, 102, 88, 49, 100
            ])
          }]
        }))
        assert.deepEqual(result, [{
          event: twitchEvents.START,
          properties: {
            channel: 'tw'
          }
        }, {
          event: twitchEvents.VIDEO_ERROR,
          properties: {
            channel: 'tw'
          }
        }])
      })

      it('multiple upload data', function () {
        const result = ledgerUtil.getMediaData(url, ledgerMediaProviders.TWITCH, Immutable.fromJS({
          firstPartyUrl: 'https://www.twitch.tv/videos/241926348',
          uploadData: [
            {
              bytes: new Uint8Array([
                100, 97, 116, 97, 61, 87, 51, 115, 105, 90, 88, 90, 108, 98, 110, 81, 105, 79, 105, 74, 50, 97, 87,
                82, 108, 98, 121, 49, 119, 98, 71, 70, 53, 73, 105, 119, 105, 99
              ])
            },
            {
              bytes: new Uint8Array([
                72, 74, 118, 99, 71, 86, 121, 100, 71, 108, 108, 99, 121, 73, 54, 101, 121, 74,
                106, 97, 71, 70, 117, 98, 109, 86, 115, 73, 106, 111, 105, 100, 72, 99, 105, 102, 88, 48, 115, 101,
                121, 74, 108, 100, 109, 86, 117, 100, 67, 73, 54, 73, 110, 90, 112, 90, 71, 86, 118, 88, 50, 86, 121,
                99, 109, 57, 121, 73, 105, 119, 105, 99, 72, 74, 118, 99, 71, 86, 121, 100, 71, 108, 108, 99, 121,
                73, 54, 101, 121, 74, 106, 97, 71, 70, 117, 98, 109, 86, 115, 73, 106, 111, 105, 100, 72, 99, 105,
                102, 88, 49, 100
              ])
            }
          ]
        }))
        assert.deepEqual(result, [{
          event: twitchEvents.START,
          properties: {
            channel: 'tw'
          }
        }, {
          event: twitchEvents.VIDEO_ERROR,
          properties: {
            channel: 'tw'
          }
        }])
      })
    })
  })

  describe('getYouTubeDuration', function () {
    it('null case', function () {
      const result = ledgerUtil.getYouTubeDuration()
      assert.equal(result, 0)
    })

    it('multiple times', function () {
      const result = ledgerUtil.getYouTubeDuration({
        st: '11.338,21.339,25.000',
        et: '21.339,25.000,26.100'
      })
      assert.equal(result, 14762)
    })

    it('single time', function () {
      const result = ledgerUtil.getYouTubeDuration({
        st: '11.338',
        et: '21.339'
      })
      assert.equal(result, 10001)
    })
  })

  describe('getMediaProvider', function () {
    it('null case', function () {
      const result = ledgerUtil.getMediaProvider()
      assert.equal(result, null)
    })

    it('unknown provider', function () {
      const result = ledgerUtil.getMediaProvider('https://www.brave.com')
      assert.equal(result, null)
    })

    it('youtube', function () {
      const result = ledgerUtil.getMediaProvider('https://www.youtube.com/api/stats/watchtime?docid=kLiLOkzLetE&st=11.338&et=21.339')
      assert.equal(result, ledgerMediaProviders.YOUTUBE)
    })

    describe('twitch', function () {
      it('we only have url', function () {
        const result = ledgerUtil.getMediaProvider('https://ttvnw.net/v1/segment/sdfsdfsdfdsf')
        assert.equal(result, null)
      })

      it('video is on twitch.tv', function () {
        const result = ledgerUtil.getMediaProvider(
          'https://ttvnw.net/v1/segment/sdfsdfsdfdsf',
          'https://www.twitch.tv/'
        )
        assert.equal(result, ledgerMediaProviders.TWITCH)
      })

      it('video is embeded', function () {
        const result = ledgerUtil.getMediaProvider(
          'https://ttvnw.net/v1/segment/sdfsdfsdfdsf',
          'https://www.site.tv/',
          'https://player.twitch.tv/'
        )
        assert.equal(result, ledgerMediaProviders.TWITCH)
      })
    })
  })

  describe('milliseconds', function () {
    it('seconds', function () {
      const result = ledgerUtil.milliseconds.second
      assert.equal(result, 1000)
    })

    it('minute', function () {
      const result = ledgerUtil.milliseconds.minute
      assert.equal(result, 60000)
    })

    it('hour', function () {
      const result = ledgerUtil.milliseconds.hour
      assert.equal(result, 3600000)
    })

    it('day', function () {
      const result = ledgerUtil.milliseconds.day
      assert.equal(result, 86400000)
    })

    it('week', function () {
      const result = ledgerUtil.milliseconds.week
      assert.equal(result, 604800000)
    })

    it('year', function () {
      const result = ledgerUtil.milliseconds.year
      assert.equal(result, 31536000000)
    })
  })

  describe('defaultMonthlyAmounts', function () {
    it('should match', function () {
      assert.deepEqual(ledgerUtil.defaultMonthlyAmounts.toJS(), [5.0, 7.5, 10.0, 17.5, 25.0, 50.0, 75.0, 100.0])
    })
  })

  describe('getDefaultMediaFavicon', function () {
    it('null case', function () {
      const result = ledgerUtil.getDefaultMediaFavicon()
      assert.equal(result, null)
    })

    it('youtube', function () {
      const result = ledgerUtil.getDefaultMediaFavicon('YouTube')
      assert.equal(result, 'youtube.png')
    })

    it('twitch', function () {
      const result = ledgerUtil.getDefaultMediaFavicon('Twitch')
      assert.equal(result, 'twitch.svg')
    })
  })

  describe('generateTwitchCacheData', function () {
    it('null check', function () {
      const result = ledgerUtil.generateTwitchCacheData()
      assert.deepEqual(result.toJS(), {})
    })

    it('properties are missing', function () {
      const result = ledgerUtil.generateTwitchCacheData(baseState, {
        event: twitchEvents.START,
        channel: 'test'
      }, 'twitch_test')

      assert.deepEqual(result.toJS(), {
        event: twitchEvents.START,
        status: 'playing'
      })
    })

    it('properties are present', function () {
      const result = ledgerUtil.generateTwitchCacheData(baseState, {
        event: twitchEvents.START,
        properties: {
          time: 100,
          minute_logged: 1
        },
        channel: 'test'
      }, 'twitch_test')

      assert.deepEqual(result.toJS(), {
        event: twitchEvents.START,
        time: 100,
        status: 'playing'
      })
    })

    describe('user actions: ', function () {
      it('start -> pause', function () {
        const state = baseState
          .setIn(['cache', 'ledgerVideos', 'twitch_test'], Immutable.fromJS({
            event: twitchEvents.START,
            status: 'playing'
          }))

        const result = ledgerUtil.generateTwitchCacheData(state, {
          event: twitchEvents.PLAY_PAUSE,
          channel: 'test'
        }, 'twitch_test')

        assert.deepEqual(result.toJS(), {
          event: twitchEvents.PLAY_PAUSE,
          status: 'paused'
        })
      })

      it('start -> seek', function () {
        const state = baseState
          .setIn(['cache', 'ledgerVideos', 'twitch_test'], Immutable.fromJS({
            event: twitchEvents.START,
            status: 'playing'
          }))

        const result = ledgerUtil.generateTwitchCacheData(state, {
          event: twitchEvents.SEEK,
          channel: 'test'
        }, 'twitch_test')

        assert.deepEqual(result.toJS(), {
          event: twitchEvents.SEEK,
          status: 'playing'
        })
      })

      it('play -> pause -> play', function () {
        const state = baseState
          .setIn(['cache', 'ledgerVideos', 'twitch_test'], Immutable.fromJS({
            event: twitchEvents.PLAY_PAUSE,
            status: 'paused'
          }))

        const result = ledgerUtil.generateTwitchCacheData(state, {
          event: twitchEvents.PLAY_PAUSE,
          channel: 'test'
        }, 'twitch_test')

        assert.deepEqual(result.toJS(), {
          event: twitchEvents.PLAY_PAUSE,
          status: 'playing'
        })
      })

      it('pause -> play -> pause', function () {
        const state = baseState
          .setIn(['cache', 'ledgerVideos', 'twitch_test'], Immutable.fromJS({
            event: twitchEvents.PLAY_PAUSE,
            status: 'playing'
          }))

        const result = ledgerUtil.generateTwitchCacheData(state, {
          event: twitchEvents.PLAY_PAUSE,
          channel: 'test'
        }, 'twitch_test')

        assert.deepEqual(result.toJS(), {
          event: twitchEvents.PLAY_PAUSE,
          status: 'paused'
        })
      })

      it('play -> pause -> seek', function () {
        const state = baseState
          .setIn(['cache', 'ledgerVideos', 'twitch_test'], Immutable.fromJS({
            event: twitchEvents.PLAY_PAUSE,
            status: 'paused'
          }))

        const result = ledgerUtil.generateTwitchCacheData(state, {
          event: twitchEvents.SEEK,
          channel: 'test'
        }, 'twitch_test')

        assert.deepEqual(result.toJS(), {
          event: twitchEvents.SEEK,
          status: 'paused'
        })
      })

      it('pause -> seek -> play', function () {
        const state = baseState
          .setIn(['cache', 'ledgerVideos', 'twitch_test'], Immutable.fromJS({
            event: twitchEvents.SEEK,
            status: 'paused'
          }))

        const result = ledgerUtil.generateTwitchCacheData(state, {
          event: twitchEvents.PLAY_PAUSE,
          channel: 'test'
        }, 'twitch_test')

        assert.deepEqual(result.toJS(), {
          event: twitchEvents.PLAY_PAUSE,
          status: 'playing'
        })
      })

      it('play -> seek -> pause', function () {
        const state = baseState
          .setIn(['cache', 'ledgerVideos', 'twitch_test'], Immutable.fromJS({
            event: twitchEvents.SEEK,
            status: 'playing'
          }))

        const result = ledgerUtil.generateTwitchCacheData(state, {
          event: twitchEvents.PLAY_PAUSE,
          channel: 'test'
        }, 'twitch_test')

        assert.deepEqual(result.toJS(), {
          event: twitchEvents.PLAY_PAUSE,
          status: 'paused'
        })
      })
    })
  })

  describe('getTwitchDuration', function () {
    it('null case', function () {
      const result = ledgerUtil.getTwitchDuration()
      assert.deepEqual(result, 0)
    })

    it('we just video playing', function () {
      const result = ledgerUtil.getTwitchDuration(baseState, {
        event: twitchEvents.START,
        properties: {
          time: '1223fa'
        }
      }, 'twitch_test')
      assert.deepEqual(result, 10000)
    })

    it('properties are missing', function () {
      const result = ledgerUtil.getTwitchDuration(baseState, {
        event: twitchEvents.MINUTE_WATCHED,
        properties: {
          time: '1223fa'
        }
      }, 'twitch_test')
      assert.deepEqual(result, 0)
    })

    it('current time is not a number', function () {
      const result = ledgerUtil.getTwitchDuration(stateWithData, {
        event: twitchEvents.MINUTE_WATCHED,
        properties: {
          time: '1223fa'
        }
      }, 'twitch_test')
      assert.deepEqual(result, 0)
    })

    it('user paused a video', function () {
      const result = ledgerUtil.getTwitchDuration(stateWithData, {
        event: twitchEvents.PLAY_PAUSE,
        properties: {
          time: 1519279926
        }
      }, 'twitch_test')
      assert.deepEqual(result, 30000)
    })

    it('first minute watched', function () {
      const result = ledgerUtil.getTwitchDuration(stateWithData, {
        event: twitchEvents.MINUTE_WATCHED,
        properties: {
          time: 1519279926
        }
      }, 'twitch_test')
      assert.deepEqual(result, 30000)
    })

    it('second minute watched', function () {
      const state = stateWithData
        .setIn(['cache', 'ledgerVideos', 'twitch_test', 'event'], twitchEvents.MINUTE_WATCHED)

      const result = ledgerUtil.getTwitchDuration(state, {
        event: twitchEvents.MINUTE_WATCHED,
        properties: {
          time: 1519279926
        }
      }, 'twitch_test')
      assert.deepEqual(result, 40000)
    })

    it('vod seeked', function () {
      const state = stateWithData
        .setIn(['cache', 'ledgerVideos', 'twitch_test', 'event'], twitchEvents.MINUTE_WATCHED)

      const result = ledgerUtil.getTwitchDuration(state, {
        event: twitchEvents.SEEK,
        properties: {
          time: 1519279926
        }
      }, 'twitch_test')
      assert.deepEqual(result, 40000)
    })

    it('end time is negative', function () {
      const result = ledgerUtil.getTwitchDuration(stateWithData, {
        event: twitchEvents.MINUTE_WATCHED,
        properties: {
          time: 1519249926
        }
      }, 'twitch_test')
      assert.deepEqual(result, 0)
    })

    it('end time is more then 2 minutes', function () {
      const result = ledgerUtil.getTwitchDuration(stateWithData, {
        event: twitchEvents.MINUTE_WATCHED,
        properties: {
          time: 1519449926
        }
      }, 'twitch_test')
      assert.deepEqual(result, 120000)
    })

    it('start event is send twice', function () {
      const state = stateWithData
        .setIn(['cache', 'ledgerVideos', 'twitch_test', 'event'], twitchEvents.START)

      const result = ledgerUtil.getTwitchDuration(state, {
        event: twitchEvents.START,
        properties: {
          time: 1519279926
        }
      }, 'twitch_test')
      assert.deepEqual(result, 0)
    })
  })

  describe('hasRequiredVisits', function () {
    it('null case', function () {
      paymentsMinVisits = 1

      const result = ledgerUtil.hasRequiredVisits(defaultState)
      assert.equal(result, false)
    })

    it('returns true if minimum visits is set to 1', function () {
      paymentsMinVisits = 1
      const publisherKey = 'brave.com'

      const result = ledgerUtil.hasRequiredVisits(defaultState, publisherKey)
      assert(result)
    })

    it('returns false if the publisher is new and minimum visits is set to > 1', function () {
      paymentsMinVisits = 5
      const publisherKey = 'new.com'

      const result = ledgerUtil.hasRequiredVisits(defaultState, publisherKey)
      assert.equal(result, false)
    })

    it('returns true if the publisher is new and minimum visits is set to 1', function () {
      paymentsMinVisits = 1
      const publisherKey = 'new.com'

      const result = ledgerUtil.hasRequiredVisits(defaultState, publisherKey)
      assert.equal(result, true)
    })

    it('returns false if the publisher is > 1 visit away from minimum visits', function () {
      paymentsMinVisits = 5
      const publisherVisits = 3
      const publisherKey = 'brave.com'

      const state = defaultState
        .setIn(['ledger', 'synopsis', 'publishers', publisherKey, 'visits'], publisherVisits)

      const result = ledgerUtil.hasRequiredVisits(state, publisherKey)
      assert.equal(result, false)
    })

    it('returns true if the publisher is 1 visit away from minimum visits', function () {
      paymentsMinVisits = 5
      const publisherVisits = 4
      const publisherKey = 'brave.com'

      const state = defaultState
        .setIn(['ledger', 'synopsis', 'publishers', publisherKey, 'visits'], publisherVisits)

      const result = ledgerUtil.hasRequiredVisits(state, publisherKey)
      assert.equal(result, true)
    })
  })

  describe('getRemainingRequiredTime', function () {
    it('null case', function () {
      paymentsMinVisitTime = 8000

      const result = ledgerUtil.getRemainingRequiredTime(defaultState)
      assert.equal(result, paymentsMinVisitTime)
    })

    it('returns the minimum visit time if the publisher is new', function () {
      paymentsMinVisitTime = 8000
      const publisherKey = 'brave.com'

      const result = ledgerUtil.getRemainingRequiredTime(defaultState, publisherKey)
      assert.equal(result, paymentsMinVisitTime)
    })

    it('returns the minimum visit time if the publisher has duration >= minimum visit time', function () {
      paymentsMinVisitTime = 8000
      const publisherDuration = 8888
      const publisherKey = 'brave.com'

      const state = defaultState
        .setIn(['ledger', 'synopsis', 'publishers', publisherKey, 'duration'], publisherDuration)

      const result = ledgerUtil.getRemainingRequiredTime(state, publisherKey)
      assert.equal(result, paymentsMinVisitTime)
    })

    it('returns the difference in time if the publisher has duration < minimum visit time', function () {
      paymentsMinVisitTime = 8000
      const expectedResult = 1500
      const publisherDuration = 6500
      const publisherKey = 'brave.com'

      const state = defaultState
        .setIn(['ledger', 'synopsis', 'publishers', publisherKey, 'duration'], publisherDuration)

      const result = ledgerUtil.getRemainingRequiredTime(state, publisherKey)
      assert.equal(result, expectedResult)
    })
  })
})
