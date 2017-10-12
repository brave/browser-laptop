/* global describe, before, after, it */
const mockery = require('mockery')
const assert = require('assert')
const Immutable = require('immutable')
require('../../../braveUnit')

describe('ledgerUtil test', function () {
  let ledgerUtil
  let fakeLevel
  const fakeElectron = require('../../../lib/fakeElectron')
  const fakeAdBlock = require('../../../lib/fakeAdBlock')

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

    ledgerUtil = require('../../../../../app/common/lib/ledgerUtil')
  })

  after(function () {
    mockery.disable()
  })

  describe('shouldTrackView', function () {
    const validView = Immutable.fromJS({
      tabId: 1,
      url: 'https://brave.com/'
    })
    const validResponseList = Immutable.fromJS([
      {
        tabId: validView.get('tabId'),
        details: {
          newURL: validView.get('url'),
          httpResponseCode: 200
        }
      }
    ])
    const noMatchResponseList = Immutable.fromJS([
      {
        tabId: 3,
        details: {
          newURL: 'https://not-brave.com'
        }
      }
    ])
    const matchButErrored = Immutable.fromJS([
      {
        tabId: validView.get('tabId'),
        details: {
          newURL: validView.get('url'),
          httpResponseCode: 404
        }
      }
    ])

    describe('input validation', function () {
      it('returns false if view is falsey', function () {
        assert.equal(ledgerUtil.shouldTrackView(null, validResponseList), false)
      })
      it('returns false if view.url is falsey', function () {
        assert.equal(ledgerUtil.shouldTrackView({tabId: 1}, validResponseList), false)
      })
      it('returns false if view.tabId is falsey', function () {
        assert.equal(ledgerUtil.shouldTrackView({url: 'https://brave.com/'}, validResponseList), false)
      })
      it('returns false if responseList is falsey', function () {
        assert.equal(ledgerUtil.shouldTrackView(validView, null), false)
      })
      it('returns false if responseList is not an array', function () {
        assert.equal(ledgerUtil.shouldTrackView(validView, {}), false)
      })
      it('returns false if responseList is a 0 length array', function () {
        assert.equal(ledgerUtil.shouldTrackView(validView, []), false)
      })
    })

    describe('when finding a matching response based on tabId and url', function () {
      it('returns false if no match found', function () {
        assert.equal(ledgerUtil.shouldTrackView(validView, noMatchResponseList), false)
      })
      it('returns false if match is found BUT response code is a failure (ex: 404)', function () {
        assert.equal(ledgerUtil.shouldTrackView(validView, matchButErrored), false)
      })
      it('returns true when match is found AND response code is a success (ex: 200)', function () {
        assert.equal(ledgerUtil.shouldTrackView(validView, validResponseList), true)
      })
    })
  })

  describe('batToCurrencyString', function () {
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
        paymentIMG: undefined
      })
    })

    it('defaults to 0 as balance when currency is not present', function () {
      const result = ledgerUtil.formatCurrentBalance()
      assert.equal(result, '0.00 BAT')
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
  })

  describe('formattedTimeFromNow', function () {
  })

  describe('formattedDateFromTimestamp', function () {
  })

  describe('walletStatus', function () {
  })
})
