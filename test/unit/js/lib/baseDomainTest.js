/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */
/* global describe, it */

const {getBaseDomain} = require('../../../../js/lib/baseDomain')
const assert = require('assert')

require('../../braveUnit')

describe('getBaseDomain', function () {
  it('regular domain and subdomains', function () {
    const domain = 'brave.com'
    assert.equal(domain, getBaseDomain('brave.com'))
    assert.equal(domain, getBaseDomain('test.brave.com'))
    assert.equal(domain, getBaseDomain('foo.test.brave.com'))
  })
  it('international domains', function () {
    assert.equal('brave.comа', getBaseDomain('www.brave.xn--com-8cd'))
    assert.equal('brave.\u9ce5\u53d6.jp', getBaseDomain('\u9ce5\u53d6.jp.brave.\u9ce5\u53d6.jp'))
    assert.equal('ebаy.com', getBaseDomain('xn--eby-7cd.com'))
  })
  it('multi-part domains', function () {
    assert.equal('diracdeltas.github.io', getBaseDomain('diracdeltas.github.io'))
    assert.equal('diracdeltas.github.io', getBaseDomain('foo.diracdeltas.github.io'))
    assert.equal('bar.ginoza.okinawa.jp', getBaseDomain('foo.bar.ginoza.okinawa.jp'))
    assert.equal('brave.co.uk', 'brave.co.uk')
  })
  it('tlds', function () {
    assert.equal('', getBaseDomain('github.io'))
    assert.equal('', getBaseDomain('co.uk'))
  })
  it('non-hostname inputs', function () {
    assert.equal('', getBaseDomain(''))
    assert.equal('hello world', getBaseDomain('hello world'))
    assert.equal('[2001:0db8:85a3:0000:0000:8a2e:0370:7334]', getBaseDomain('[2001:0db8:85a3:0000:0000:8a2e:0370:7334]'))
    assert.equal('http://2001::7334', getBaseDomain('http://2001::7334'))
  })
})
