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
        error: null,
        created: true,
        satoshis: 2097027,
        buyURL: undefined,
        paymentURL: 'bitcoin:btc-address-goes-here?amount=0.00277334&label=Brave%20Software',
        passphrase: 'd588b7e3-352d-49ce-8d0f-a4cae1fa4c76',
        buyMaximumUSD: 6,
        reconcileFrequency: 30,
        currency: 'USD',
        bat: '0.00277334',
        address: 'bat-address-goes-here',
        reconcileStamp: 1405324210587,
        transactions: [],
        amount: 10,
        creating: false,
        balance: 0.0210,
        paymentIMG: undefined
      })
    })

    it('defaults to 0 as balance and "USD" as currency symbol', function () {
      const result = ledgerUtil.batToCurrencyString()
      assert.equal(result, '0 USD')
    })
    it('will mark currency with different symbol (if present)', function () {
      const result = ledgerUtil.batToCurrencyString(0, ledgerData.set('currency', 'Sealand dollars'))
      assert.equal(result, '0 Sealand dollars')
    })
    it('will convert value to USD', function () {
      const result = ledgerUtil.batToCurrencyString(1, ledgerData)
      assert.equal(result, '3605.75 USD')
    })
    describe('when rounding values', function () {
      it('will round 4.97 down to 4.75 (cent values greater than .74)', function () {
        const ledgerDataCopy = ledgerData.set('bat', '0.00279000')
        const result = ledgerUtil.batToCurrencyString(0.00138667, ledgerDataCopy)
        assert.equal(result, '4.75 USD')
      })
      it('will round 4.64 down to 4.50 (cent values greater than .49)', function () {
        const ledgerDataCopy = ledgerData.set('bat', '0.00299000')
        const result = ledgerUtil.batToCurrencyString(0.00138667, ledgerDataCopy)
        assert.equal(result, '4.50 USD')
      })
      it('will round 4.33 down to 4.25 (cent values greater than .24)', function () {
        const ledgerDataCopy = ledgerData.set('bat', '0.00320000')
        const result = ledgerUtil.batToCurrencyString(0.00138667, ledgerDataCopy)
        assert.equal(result, '4.25 USD')
      })
      it('will round 4.08 down to 4.00 (cent values less than .24)', function () {
        const ledgerDataCopy = ledgerData.set('bat', '0.00340000')
        const result = ledgerUtil.batToCurrencyString(0.00138667, ledgerDataCopy)
        assert.equal(result, '4.00 USD')
      })
    })
    describe('when ledgerData does not contain exchange information', function () {
      it('returns the raw balance formatted as BAT', function () {
        const result = ledgerUtil.batToCurrencyString(0.00138667, undefined)
        assert.equal(result, '0.00138667 BAT')
      })
    })
  })

  describe('formattedTimeFromNow', function () {
  })

  describe('formattedDateFromTimestamp', function () {
  })

  describe('walletStatus', function () {
  })
})
