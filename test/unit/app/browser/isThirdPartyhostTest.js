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
    assert.ok(!isThirdPartyHost('ragu.brave.com', braveHost))
  })
  it('A 2nd level subdomain URL should not be third party', function () {
    assert.ok(!isThirdPartyHost(braveHost, 'foo.bar.brave.com'))
    assert.ok(!isThirdPartyHost('foo.bar.brave.com', braveHost))
  })
  it('Unrelated URLs should be third party', function () {
    assert.ok(isThirdPartyHost(braveHost, 'ragu.com'))
    assert.ok(isThirdPartyHost('ragu.com', braveHost))
  })
  it('Checks subdomains properly', function () {
    assert.ok(isThirdPartyHost(braveHost, 'brave.ragu.com'))
    assert.ok(isThirdPartyHost('brave.ragu.com', braveHost))
  })
  it('Handles multi-part TLDs', function () {
    assert.ok(isThirdPartyHost('diracdeltas.github.io', 'brave.github.io'))
    assert.ok(isThirdPartyHost('github.io', 'brave.github.io'))
    assert.ok(!isThirdPartyHost('github.io', 'github.io'))
    assert.ok(isThirdPartyHost('brave.github.io', 'github.io'))
    assert.ok(isThirdPartyHost('brave.co.uk', 'example.co.uk'))
  })
  it('Handles IPv4', function () {
    assert.ok(isThirdPartyHost('172.217.6.46', '173.217.6.46'))
    assert.ok(!isThirdPartyHost('172.217.6.46', '172.217.6.46'))
  })
  it('Handles IPv6', function () {
    assert.ok(!isThirdPartyHost('[2001:db8:85a3::8a2e:370:7334]', '[2001:db8:85a3::8a2e:370:7334]'))
    assert.ok(!isThirdPartyHost('2001:db8:85a3::8a2e:370:7334', '2001:db8:85a3::8a2e:370:7334'))
    assert.ok(isThirdPartyHost('[2001:db8:85a3::8a2e:370:7334]', '[2002:db8:85a3::8a2e:370:7334]'))
    assert.ok(isThirdPartyHost('2001:db8:85a3::8a2e:370:7334', '2002:db8:85a3::8a2e:370:7334'))
  })
  it('Handles null', function () {
    assert.ok(isThirdPartyHost('', ''))
    assert.ok(isThirdPartyHost(null, null))
    assert.ok(isThirdPartyHost('', null))
  })
})
