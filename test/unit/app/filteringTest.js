/* global describe, before, after, it */
const mockery = require('mockery')
const assert = require('assert')
const sinon = require('sinon')
const {cookieExceptions, getTestRefererException} = require('../../../js/data/siteHacks')

require('../braveUnit')

describe('filtering unit tests', function () {
  let filtering
  const fakeElectron = require('../lib/fakeElectron')

  before(function () {
    mockery.enable({
      warnOnReplace: false,
      warnOnUnregistered: false,
      useCleanCache: true
    })
    mockery.registerMock('electron', fakeElectron)
    mockery.registerMock('./adBlock', {adBlockResourceName: 'adblock'})
    filtering = require('../../../app/filtering')
  })

  after(function () {
    mockery.disable()
  })

  describe('applyCookieSetting', function () {
    describe('when cookieSetting === "blockAllCookies"', function () {
      let isResourceEnabledStub
      before(function () {
        isResourceEnabledStub = sinon.stub(filtering, 'isResourceEnabled').returns('blockAllCookies')
      })
      after(function () {
        isResourceEnabledStub.restore()
      })

      it('clears cookie field', function () {
        const url = 'https://cdnp3.stackassets.com/574db2390a12942fcef927356dadc6f9955edea9/store/fe3eb8fc014a20f2d25810b3c4f4b5b0db8695adfd7e8953721a55c51b90/sale_7217_primary_image.jpg'
        const firstPartyUrl = 'https://slashdot.org/'
        const requestHeaders = {
          Cookie: 'optimizelyEndUserId=oeu1491721215718r0.024789086462633003; __ssid=97b17d31-8f1b-4193-8914-df36e7b740f6; optimizelySegments=%7B%22300150879%22%3A%22false%22%2C%22300333436%22%3A%22gc%22%2C%22300387578%22%3A%22campaign%22%7D; optimizelyBuckets=%7B%7D; _pk_id.40.2105=8fca10ea565f58bf.1485982886.187.1499406000.1499405260.; _pk_ses.40.2105=*'
        }
        const result = filtering.applyCookieSetting(requestHeaders, url, firstPartyUrl, false)

        assert.equal(result.Cookie, undefined)
      })

      describe('when there is a cookie exception', function () {
        it('keeps the cookie field', function () {
          let cookieException = false
          let firstPartyUrl = ''
          let url = ''
          for (let key in cookieExceptions) {
            firstPartyUrl = key
            const urls = cookieExceptions[key]
            url = urls[0]
            cookieException = true
            break
          }

          assert(cookieException)

          const requestHeaders = {
            Cookie: 'optimizelyEndUserId=oeu1491721215718r0.024789086462633003; __ssid=97b17d31-8f1b-4193-8914-df36e7b740f6; optimizelySegments=%7B%22300150879%22%3A%22false%22%2C%22300333436%22%3A%22gc%22%2C%22300387578%22%3A%22campaign%22%7D; optimizelyBuckets=%7B%7D; _pk_id.40.2105=8fca10ea565f58bf.1485982886.187.1499406000.1499405260.; _pk_ses.40.2105=*'
          }
          const result = filtering.applyCookieSetting(requestHeaders, url, firstPartyUrl, false)

          assert.equal(result.Cookie, requestHeaders.Cookie)
        })
        it('wildcard cookie exception', function () {
          // Specifically testing drive.google.com
          const firstPartyUrl = 'https://drive.google.com'
          const url = 'https://doc-0g-3g-docs.googleusercontent.com'

          const requestHeaders = {
            Cookie: 'optimizelyEndUserId=oeu1491721215718r0.024789086462633003; __ssid=97b17d31-8f1b-4193-8914-df36e7b740f6; optimizelySegments=%7B%22300150879%22%3A%22false%22%2C%22300333436%22%3A%22gc%22%2C%22300387578%22%3A%22campaign%22%7D; optimizelyBuckets=%7B%7D; _pk_id.40.2105=8fca10ea565f58bf.1485982886.187.1499406000.1499405260.; _pk_ses.40.2105=*'
          }
          const result = filtering.applyCookieSetting(requestHeaders, url, firstPartyUrl, false)

          assert.equal(result.Cookie, requestHeaders.Cookie)
        })
      })
    })

    describe('when cookieSetting === "block3rdPartyCookie"', function () {
      let isResourceEnabledStub
      before(function () {
        isResourceEnabledStub = sinon.stub(filtering, 'isResourceEnabled').returns('block3rdPartyCookie')
      })
      after(function () {
        isResourceEnabledStub.restore()
      })

      describe('stubs referer for third-party referer', function () {
        const firstPartyUrl = 'https://brave.com'
        it('when the hosts are completely different', function () {
          const url = 'https://cdnp3.stackassets.com/574db2390a12942fcef927356dadc6f9955edea9/store/fe3eb8fc014a20f2d25810b3c4f4b5b0db8695adfd7e8953721a55c51b90/sale_7217_primary_image.jpg'
          const requestHeaders = {
            Referer: 'https://brave.com'
          }
          const result = filtering.applyCookieSetting(requestHeaders, url, firstPartyUrl, false)
          assert.equal(result.Referer, 'https://cdnp3.stackassets.com')
        })
        it('when the hosts have different base domains according to the PSL', function () {
          const url = 'https://diracdeltas.github.io/foo?abc#test'
          const requestHeaders = {
            Referer: 'https://github.io'
          }
          const result = filtering.applyCookieSetting(requestHeaders, url, firstPartyUrl, false)
          assert.equal(result.Referer, 'https://diracdeltas.github.io')
        })
      })

      describe('does not change referer for first-party referer', function () {
        const firstPartyUrl = 'https://brave.com'
        it('keeps referer when hosts are the same', function () {
          const url = 'https://test.github.io/test'
          const requestHeaders = {
            Referer: 'https://test.github.io/foo'
          }
          const result = filtering.applyCookieSetting(requestHeaders, url, firstPartyUrl, false)
          assert.equal(result.Referer, 'https://test.github.io/foo')
        })
        it('keeps referer when hosts share a baseDomain', function () {
          const url = 'https://docs.google.com'
          const requestHeaders = {
            Referer: 'https://2.drive.google.com/mydocument#abc'
          }
          const result = filtering.applyCookieSetting(requestHeaders, url, firstPartyUrl, false)
          assert.equal(result.Referer, 'https://2.drive.google.com/mydocument#abc')
        })
      })

      describe('when there is a referer exception', function () {
        it('keeps the referer field', function () {
          const url = 'https://' + getTestRefererException()
          const firstPartyUrl = 'https://slashdot.org/'
          const requestHeaders = {
            Referer: 'https://brave.com'
          }
          const result = filtering.applyCookieSetting(requestHeaders, url, firstPartyUrl, false)

          assert.equal(result.Referer, requestHeaders.Referer)
        })
      })
    })
  })
})
