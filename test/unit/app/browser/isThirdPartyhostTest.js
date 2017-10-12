/* global describe, it */

require('../../braveUnit')
const assert = require('assert')
const isThirdPartyHost = require('../../../../app/browser/isThirdPartyHost')

const braveHost = 'brave.com'

describe('isThirdPartyHost test', function () {
  it('A URL should not be third party to itself', function () {
    assert.ok(!isThirdPartyHost(braveHost, braveHost))
  })
  it('A subdomain URL should not be third party', function () {
    assert.ok(!isThirdPartyHost(braveHost, 'ragu.brave.com'))
  })
  it('Unrelated URLs should be third party', function () {
    assert.ok(isThirdPartyHost(braveHost, 'ragu.com'))
  })
  it('Checks subdomains properly', function () {
    assert.ok(isThirdPartyHost(braveHost, 'brave.ragu.com'))
  })
})
