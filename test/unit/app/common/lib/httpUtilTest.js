/* global describe, it */
const httpUtil = require('../../../../../app/common/lib/httpUtil')
const assert = require('assert')

require('../../../braveUnit')

describe('httpUtil test', function () {
  describe('responseHasContent', function () {
    describe('expected success codes', function () {
      it('returns true for various success responses (200, 203, 206)', function () {
        assert.equal(httpUtil.responseHasContent(200), true)
        assert.equal(httpUtil.responseHasContent(203), true)
        assert.equal(httpUtil.responseHasContent(206), true)
      })
      it('returns true for a cached response (304)', function () {
        assert.equal(httpUtil.responseHasContent(304), true)
      })
    })

    describe('expected failure codes', function () {
      it('returns false for non-content success codes (used for REST apis, etc)', function () {
        assert.equal(httpUtil.responseHasContent(201), false) // created
        assert.equal(httpUtil.responseHasContent(202), false) // accepted
      })
      it('returns false for various client error responses (400+)', function () {
        assert.equal(httpUtil.responseHasContent(400), false) // bad request
        assert.equal(httpUtil.responseHasContent(401), false) // unauthorized
        assert.equal(httpUtil.responseHasContent(403), false) // forbidden
        assert.equal(httpUtil.responseHasContent(404), false) // not found
      })
      it('returns false for various server side error responses (500-504)', function () {
        assert.equal(httpUtil.responseHasContent(500), false) // internal server error
        assert.equal(httpUtil.responseHasContent(501), false) // not implemented
        assert.equal(httpUtil.responseHasContent(502), false) // bad gateway
        assert.equal(httpUtil.responseHasContent(503), false) // service unavailable
        assert.equal(httpUtil.responseHasContent(504), false) // gateway timeout
      })
    })
  })
})
