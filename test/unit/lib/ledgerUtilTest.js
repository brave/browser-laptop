/* global describe, it */
const ledgerUtil = require('../../../app/common/lib/ledgerUtil')
const assert = require('assert')

require('../braveUnit')

describe('ledgerUtil test', function () {
  describe('shouldTrackResponseCode', function () {
    describe('expected success codes', function () {
      it('returns true for various success responses (200, 203, 206)', function () {
        assert.equal(ledgerUtil.shouldTrackResponseCode(200), true)
        assert.equal(ledgerUtil.shouldTrackResponseCode(203), true)
        assert.equal(ledgerUtil.shouldTrackResponseCode(206), true)
      })
      it('returns true for a cached response (304)', function () {
        assert.equal(ledgerUtil.shouldTrackResponseCode(304), true)
      })
    })

    describe('expected failure codes', function () {
      it('returns false for non-content success codes (used for REST apis, etc)', function () {
        assert.equal(ledgerUtil.shouldTrackResponseCode(201), false) // created
        assert.equal(ledgerUtil.shouldTrackResponseCode(202), false) // accepted
      })
      it('returns false for various server side error responses (500-504)', function () {
        assert.equal(ledgerUtil.shouldTrackResponseCode(500), false) // internal server error
        assert.equal(ledgerUtil.shouldTrackResponseCode(501), false) // not implemented
        assert.equal(ledgerUtil.shouldTrackResponseCode(502), false) // bad gateway
        assert.equal(ledgerUtil.shouldTrackResponseCode(503), false) // service unavailable
        assert.equal(ledgerUtil.shouldTrackResponseCode(504), false) // gateway timeout
      })
    })
  })

  describe('shouldTrackView', function () {
    const validView = { tabId: 1, url: 'https://brave.com/' }
    const validResponseList = [{ tabId: validView.tabId, details: { originalURL: validView.url, httpResponseCode: 200 } }]
    const noMatchResponseList = [{ tabId: 3, details: {originalURL: 'https://not-brave.com'} }]
    const matchButErrored = [{ tabId: validView.tabId, details: { originalURL: validView.url, httpResponseCode: 404 } }]

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
})
