/* global describe, it */

require('../../../braveUnit')
const assert = require('assert')
const {URL} = require('url')

const site = new URL('https://www.brave.com')
const thirdPartyResource = new URL('https://www.coffee.com/logo.png')
const firstPartyResource = new URL('https://www.brave.com/logo.png')
const {shouldDoAdBlockCheck} = require('../../../../../app/browser/ads/adBlockUtil')

describe('adBlockUtil test', function () {
  describe('shouldDoAdBlockCheck', function () {
    it('http protocol allows ad block checks', function () {
      assert.ok(shouldDoAdBlockCheck('script', new URL('https://www.brave.com'), thirdPartyResource, false))
    })
    it('https protocol allows ad block checks', function () {
      assert.ok(shouldDoAdBlockCheck('script', new URL('https://www.brave.com'), thirdPartyResource, false))
    })
    it('ftp protocol does not allow ad block checks', function () {
      assert.ok(!shouldDoAdBlockCheck('script', new URL('ftp://www.brave.com'), thirdPartyResource, false))
    })
    it('should check third party urls', function () {
      assert.ok(shouldDoAdBlockCheck('script', site, thirdPartyResource, false))
    })
    it('should NOT check first party urls', function () {
      assert.ok(!shouldDoAdBlockCheck('script', site, firstPartyResource, false))
    })
    it('Avoid checks with unknown resource types', function () {
      // This test is valid just as long as we don't start handling beefaroni resource types in the ad block lib!!!
      assert.ok(!shouldDoAdBlockCheck('beefaroni', site, new URL('https://disqus.com/test'), false))
    })
    it('should check first party hosts on youtube', function () {
      assert.ok(shouldDoAdBlockCheck('script', new URL('https://www.youtube.com'), new URL('https://www.youtube.com/script.js'), false))
    })
    it('diqus is allowed as third party, for now', function () {
      assert.ok(!shouldDoAdBlockCheck('script', site, new URL('https://disqus.com/test'), false))
      assert.ok(!shouldDoAdBlockCheck('script', site, new URL('https://hello.disqus.com/test'), false))
      assert.ok(!shouldDoAdBlockCheck('script', site, new URL('https://a.disquscdn.com/test'), false))
      assert.ok(!shouldDoAdBlockCheck('script', site, new URL('https://b.a.disquscdn.com/test'), false))
    })
    it('should NOT check third party urls for main frame', function () {
      assert.ok(shouldDoAdBlockCheck('mainFrame', site, site, true))
    })
  })
})
