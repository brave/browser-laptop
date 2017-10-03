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

  describe('formattedTimeFromNow', function () {
  })

  describe('formattedDateFromTimestamp', function () {
  })

  describe('walletStatus', function () {
  })
})
