/* global describe, before, after, it */
const mockery = require('mockery')
const assert = require('assert')
const Immutable = require('immutable')
require('../../../braveUnit')
const settings = require('../../../../../js/constants/settings')
const ledgerMediaProviders = require('../../../../../app/common/constants/ledgerMediaProviders')

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
        event: 'video-play',
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
      const result = ledgerUtil.formatCurrentBalance(data)
      assert.equal(result, '5.00 BAT')
    })

    it('formats `balance` and `converted` values to two decimal places', function () {
      const result = ledgerUtil.formatCurrentBalance(ledgerData)
      assert.equal(result, '5.00 BAT (1.12 USD)')
    })

    it('defaults `balance` to 0 if not found', function () {
      const result = ledgerUtil.formatCurrentBalance(ledgerData.delete('balance'))
      assert.equal(result, '0.00 BAT (1.12 USD)')
    })

    it('defaults `converted` to 0 if not found', function () {
      const result = ledgerUtil.formatCurrentBalance(ledgerData.delete('converted'))
      assert.equal(result, '5.00 BAT (0.00 USD)')
    })

    it('handles `balance` being a string', function () {
      const result = ledgerUtil.formatCurrentBalance(ledgerData.set('balance', '5'))
      assert.equal(result, '5.00 BAT (1.12 USD)')
    })

    it('handles `converted` being a string', function () {
      const result = ledgerUtil.formatCurrentBalance(ledgerData.set('converted', '1.1234'))
      assert.equal(result, '5.00 BAT (1.12 USD)')
    })

    it('custom format for amount lower then 0.01', function () {
      const result = ledgerUtil.formatCurrentBalance(ledgerData.set('converted', '0.004'))
      assert.equal(result, '5.00 BAT (< 0.01 USD)')
    })
  })

  describe('formattedTimeFromNow', function () {
  })

  describe('formattedDateFromTimestamp', function () {
  })

  describe('walletStatus', function () {
    it('null case', function () {
      const result = ledgerUtil.walletStatus()
      assert.deepEqual(result, {
        id: 'createWalletStatus'
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
          event: 'minute-watched'
        }, ledgerMediaProviders.TWITCH)
        assert.equal(result, null)
      })

      it('content is a live stream', function () {
        const result = ledgerUtil.getMediaId({
          event: 'minute-watched',
          properties: {
            channel: 'tchannel'
          }
        }, ledgerMediaProviders.TWITCH)
        assert.equal(result, 'tchannel')
      })

      it('content is a vod', function () {
        const result = ledgerUtil.getMediaId({
          event: 'minute-watched',
          properties: {
            channel: 'tchannel',
            vod: 'v12343234'
          }
        }, ledgerMediaProviders.TWITCH)
        assert.equal(result, 'tchannel_vod_12343234')
      })

      it('event is video-play', function () {
        const result = ledgerUtil.getMediaId({
          event: 'video-play',
          properties: {
            channel: 'tchannel'
          }
        }, ledgerMediaProviders.TWITCH)
        assert.equal(result, 'tchannel')
      })

      it('event is player_click_playpause', function () {
        const result = ledgerUtil.getMediaId({
          event: 'player_click_playpause',
          properties: {
            channel: 'tchannel'
          }
        }, ledgerMediaProviders.TWITCH)
        assert.equal(result, 'tchannel')
      })

      it('event is vod_seek', function () {
        const result = ledgerUtil.getMediaId({
          event: 'vod_seek',
          properties: {
            channel: 'tchannel'
          }
        }, ledgerMediaProviders.TWITCH)
        assert.equal(result, 'tchannel')
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
      it('null case', function () {
        const result = ledgerUtil.getMediaData(null, ledgerMediaProviders.TWITCH)
        assert.equal(result, null)
      })

      it('data is missing', function () {
        const result = ledgerUtil.getMediaData('https://api.mixpanel.com', ledgerMediaProviders.TWITCH)
        assert.equal(result, null)
      })

      it('data is empty string', function () {
        const result = ledgerUtil.getMediaData('https://api.mixpanel.com?data=', ledgerMediaProviders.TWITCH)
        assert.equal(result, null)
      })

      it('obj is parsed correctly', function () {
        const result = ledgerUtil.getMediaData('https://api.mixpanel.com?data=eyJldmVudCI6Im1pbnV0ZS13YXRjaGVkIiwicHJvcGVydGllcyI6eyJjaGFubmVsIjoidHcifX0=', ledgerMediaProviders.TWITCH)
        assert.deepEqual(result, {
          event: 'minute-watched',
          properties: {
            channel: 'tw'
          }
        })
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
        const result = ledgerUtil.getMediaProvider('https://api.mixpanel.com/?data=lll')
        assert.equal(result, null)
      })

      it('video is on twitch.tv', function () {
        const result = ledgerUtil.getMediaProvider(
          'https://api.mixpanel.com/?data=lll',
          'https://www.twitch.tv/'
        )
        assert.equal(result, ledgerMediaProviders.TWITCH)
      })

      it('video is embeded', function () {
        const result = ledgerUtil.getMediaProvider(
          'https://api.mixpanel.com/?data=lll',
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
      const result = ledgerUtil.generateTwitchCacheData({
        event: 'video-play',
        channel: 'test'
      })
      assert.deepEqual(result.toJS(), {
        event: 'video-play'
      })
    })

    it('properties are present', function () {
      const result = ledgerUtil.generateTwitchCacheData({
        event: 'video-play',
        properties: {
          time: 100,
          minute_logged: 1
        },
        channel: 'test'
      })
      assert.deepEqual(result.toJS(), {
        event: 'video-play',
        time: 100
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
        event: 'video-play',
        properties: {
          time: '1223fa'
        }
      }, 'twitch_test')
      assert.deepEqual(result, 10000)
    })

    it('properties are missing', function () {
      const result = ledgerUtil.getTwitchDuration(baseState, {
        event: 'minute-watched',
        properties: {
          time: '1223fa'
        }
      }, 'twitch_test')
      assert.deepEqual(result, 0)
    })

    it('current time is not a number', function () {
      const result = ledgerUtil.getTwitchDuration(stateWithData, {
        event: 'minute-watched',
        properties: {
          time: '1223fa'
        }
      }, 'twitch_test')
      assert.deepEqual(result, 0)
    })

    it('user paused a video', function () {
      const result = ledgerUtil.getTwitchDuration(stateWithData, {
        event: 'player_click_playpause',
        properties: {
          time: 1519279926
        }
      }, 'twitch_test')
      assert.deepEqual(result, 40000)
    })

    it('first minute watched', function () {
      const result = ledgerUtil.getTwitchDuration(stateWithData, {
        event: 'minute-watched',
        properties: {
          time: 1519279926
        }
      }, 'twitch_test')
      assert.deepEqual(result, 30000)
    })

    it('second minute watched', function () {
      const state = stateWithData
        .setIn(['cache', 'ledgerVideos', 'twitch_test', 'event'], 'minute-watched')

      const result = ledgerUtil.getTwitchDuration(state, {
        event: 'minute-watched',
        properties: {
          time: 1519279926
        }
      }, 'twitch_test')
      assert.deepEqual(result, 40000)
    })

    it('vod seeked', function () {
      const state = stateWithData
        .setIn(['cache', 'ledgerVideos', 'twitch_test', 'event'], 'minute-watched')

      const result = ledgerUtil.getTwitchDuration(state, {
        event: 'vod_seek',
        properties: {
          time: 1519279926
        }
      }, 'twitch_test')
      assert.deepEqual(result, 40000)
    })

    it('end time is negative', function () {
      const result = ledgerUtil.getTwitchDuration(stateWithData, {
        event: 'minute-watched',
        properties: {
          time: 1519249926
        }
      }, 'twitch_test')
      assert.deepEqual(result, 0)
    })

    it('end time is more then 2 minutes', function () {
      const result = ledgerUtil.getTwitchDuration(stateWithData, {
        event: 'minute-watched',
        properties: {
          time: 1519449926
        }
      }, 'twitch_test')
      assert.deepEqual(result, 120000)
    })

    it('we need to floor end time', function () {
      const state = stateWithData
        .setIn(['cache', 'ledgerVideos', 'twitch_test', 'event'], 'minute-watched')

      const result = ledgerUtil.getTwitchDuration(state, {
        event: 'minute-watched',
        properties: {
          time: 1519279926.74353453
        }
      }, 'twitch_test')
      assert.deepEqual(result, 40743)
    })
  })
})
