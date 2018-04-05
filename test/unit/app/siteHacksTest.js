/* global describe, before, beforeEach, after, it */
const mockery = require('mockery')
const assert = require('assert')
const sinon = require('sinon')
const Immutable = require('immutable')

require('../braveUnit')

describe('siteHacks unit tests', function () {
  let siteHacks
  let siteHacksData
  let beforeSendCB
  let urlParse
  let filtering
  let appState
  const fakeElectron = require('../lib/fakeElectron')
  const fakeAdBlock = require('../lib/fakeAdBlock')
  const fakeFiltering = {
    getMainFrameUrl: (details) => {
      return filtering.getMainFrameUrl(details)
    },
    isResourceEnabled: (resourceName, url, isPrivate) => {
      return true
    },
    registerBeforeSendHeadersFilteringCB: (cb) => {
      beforeSendCB = cb
    },
    registerBeforeRequestFilteringCB: (cb) => {
      // beforeRequestCB = cb
    }
  }

  before(function () {
    mockery.enable({
      warnOnReplace: false,
      warnOnUnregistered: false,
      useCleanCache: true
    })

    mockery.registerMock('electron', fakeElectron)
    mockery.registerMock('ad-block', fakeAdBlock)
    urlParse = require('../../../app/common/urlParse')
    mockery.registerMock('./common/urlParse', urlParse)
    filtering = require('../../../app/filtering')
    mockery.registerMock('./filtering', fakeFiltering)
    siteHacksData = require('../../../js/data/siteHacks')
    mockery.registerMock('../js/data/siteHacks', siteHacksData)
    mockery.registerMock('../js/stores/appStore', {
      getState: () => appState
    })

    siteHacks = require('../../../app/siteHacks')
  })

  after(function () {
    mockery.disable()
  })

  describe('init', function () {
    let beforeSendSpy
    let beforeRequestSpy

    before(function () {
      beforeSendSpy = sinon.spy(fakeFiltering, 'registerBeforeSendHeadersFilteringCB')
      beforeRequestSpy = sinon.spy(fakeFiltering, 'registerBeforeRequestFilteringCB')
      siteHacks.init()
    })
    after(function () {
      beforeSendSpy.restore()
      beforeRequestSpy.restore()
    })

    it('calls Filtering.registerBeforeSendHeadersFilteringCB', function () {
      assert.equal(beforeSendSpy.calledOnce, true)
    })

    describe('in the callback passed into registerBeforeSendHeadersFilteringCB', function () {
      let getMainFrameUrlSpy
      let onBeforeSendHeadersSpy
      // let result
      const details = {
        resourceType: 'mainFrame',
        requestHeaders: {
          'User-Agent': 'Brave Chrome/60.0.3112.101'
        },
        url: 'https://subdomain.adobe.com',
        tabId: 1
      }
      before(function () {
        getMainFrameUrlSpy = sinon.spy(fakeFiltering, 'getMainFrameUrl')
        onBeforeSendHeadersSpy = sinon.spy(siteHacksData.siteHacks['adobe.com'], 'onBeforeSendHeaders')

        if (typeof beforeSendCB === 'function') {
          beforeSendCB(details)
        }
      })
      after(function () {
        getMainFrameUrlSpy.restore()
        onBeforeSendHeadersSpy.restore()
      })

      it('calls Filtering.getMainFrameUrl', function () {
        assert.equal(getMainFrameUrlSpy.calledOnce, true)
      })

      describe('when site hack is found for domain', function () {
        it('calls hack.onBeforeSendHeaders', function () {
          assert.equal(onBeforeSendHeadersSpy.calledOnce, true)
        })
      })
    })

    it('calls Filtering.registerBeforeRequestFilteringCB', function () {
      assert.equal(beforeRequestSpy.calledOnce, true)
    })
  })

  describe('setReferralHeaders', function () {
    const headers = [
      {
        domains: [ 'test.com', 'domain.si' ],
        headers: { 'X-Brave-Partner': 'partner', 'X-something': 'ok' },
        cookieNames: [],
        expiration: 0
      }
    ]

    beforeEach(() => {
      siteHacks.resetReferralHeaders(null)
    })

    it('headers are missing', function () {
      siteHacks.setReferralHeaders(null)
      assert.equal(siteHacks.getReferralHeaders(), null)
    })

    it('headers are immutable list', function () {
      siteHacks.setReferralHeaders(Immutable.fromJS(headers))
      assert.deepEqual(siteHacks.getReferralHeaders(), headers)
    })

    it('headers are regular array', function () {
      siteHacks.setReferralHeaders(headers)
      assert.deepEqual(siteHacks.getReferralHeaders(), headers)
    })

    it('headers is single object', function () {
      siteHacks.setReferralHeaders({
        domains: [ 'test.com', 'domain.si' ],
        headers: { 'X-Brave-Partner': 'partner', 'X-something': 'ok' },
        cookieNames: [],
        expiration: 0
      })
      assert.deepEqual(siteHacks.getReferralHeaders(), headers)
    })
  })

  describe('beforeHeaders', function () {
    describe('referral headers', function () {
      const details = {
        resourceType: 'mainFrame',
        requestHeaders: {
          'User-Agent': 'Brave Chrome/60.0.3112.101'
        },
        url: 'https://test.com',
        tabId: 1
      }

      const detailExpected = {
        cancel: undefined,
        customCookie: undefined,
        requestHeaders: undefined,
        resourceName: 'siteHacks'
      }

      const headers = [
        {
          domains: [ 'test.com', 'domain.si' ],
          headers: { 'X-Brave-Partner': 'partner' },
          cookieNames: [],
          expiration: 0
        }
      ]

      beforeEach(() => {
        siteHacks.resetReferralHeaders()
        appState = null
      })

      describe('are not set', function () {
        it('app state is null', function () {
          const result = siteHacks.beforeHeaders(details)
          assert.deepEqual(result, detailExpected)
          assert.equal(siteHacks.getReferralHeaders(), null)
        })

        it('headers are now set', function () {
          appState = Immutable.fromJS({
            updates: {
              referralHeaders: headers
            }
          })

          const expectedReturn = {
            cancel: undefined,
            customCookie: undefined,
            requestHeaders: {
              'X-Brave-Partner': 'partner',
              'User-Agent': 'Brave Chrome/60.0.3112.101'
            },
            resourceName: 'siteHacks'
          }

          const result = siteHacks.beforeHeaders(details)
          assert.deepEqual(result, expectedReturn)
          assert.deepEqual(siteHacks.getReferralHeaders(), headers)
        })
      })

      describe('are set', function () {
        it('domains are missing', function () {
          siteHacks.setReferralHeaders({
            headers: { 'X-Brave-Partner': 'partner' },
            cookieNames: [],
            expiration: 0
          })

          const result = siteHacks.beforeHeaders(details)
          assert.deepEqual(result, detailExpected)
        })

        it('domain is not in the headers', function () {
          siteHacks.setReferralHeaders({
            domains: [ 'domain.si' ],
            headers: { 'X-Brave-Partner': 'partner' },
            cookieNames: [],
            expiration: 0
          })

          const result = siteHacks.beforeHeaders(details)
          assert.deepEqual(result, detailExpected)
        })

        it('headers are missing', function () {
          siteHacks.setReferralHeaders({
            domains: [ 'test.com' ],
            cookieNames: [],
            expiration: 0
          })

          const result = siteHacks.beforeHeaders(details)
          assert.deepEqual(result, detailExpected)
        })

        it('header is set', function () {
          siteHacks.setReferralHeaders({
            domains: [ 'test.com', 'domain.si' ],
            headers: { 'X-Brave-Partner': 'partner' },
            cookieNames: [],
            expiration: 0
          })

          const expectedReturn = {
            resourceName: 'siteHacks',
            requestHeaders: {
              'X-Brave-Partner': 'partner',
              'User-Agent': 'Brave Chrome/60.0.3112.101'
            },
            customCookie: undefined,
            cancel: undefined
          }

          const result = siteHacks.beforeHeaders(details)
          assert.deepEqual(result, expectedReturn)
        })

        it('multiple headers are set', function () {
          siteHacks.setReferralHeaders({
            domains: [ 'test.com', 'domain.si' ],
            headers: { 'X-Brave-Partner': 'partner', 'X-something': 'ok' },
            cookieNames: [],
            expiration: 0
          })

          const expectedReturn = {
            cancel: undefined,
            customCookie: undefined,
            requestHeaders: {
              'X-Brave-Partner': 'partner',
              'X-something': 'ok',
              'User-Agent': 'Brave Chrome/60.0.3112.101'
            },
            resourceName: 'siteHacks'
          }

          const result = siteHacks.beforeHeaders(details)
          assert.deepEqual(result, expectedReturn)
        })
      })
    })
  })
})
