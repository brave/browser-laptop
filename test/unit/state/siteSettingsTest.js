/* global describe, before, it */

const siteSettings = require('../../../js/state/siteSettings')
const siteUtil = require('../../../js/state/siteUtil')
const assert = require('assert')
const Immutable = require('immutable')
let siteSettingsMap = new Immutable.Map()

describe('siteSettings', function () {
  describe('simple URL host pattern', function () {
    before(function () {
      siteSettingsMap = siteSettings.mergeSiteSetting(siteSettingsMap, 'https://www.brave.com', 'prop1', 1)
    })
    it('can obtain a site setting from a host pattern', function * () {
      const setting = siteSettings.getSiteSettingsForHostPattern(siteSettingsMap, 'https://www.brave.com')
      assert.strictEqual(setting.get('prop1'), 1)
    })
    it('can obtain a site setting from an exact URL', function * () {
      const setting = siteSettings.getSiteSettingsForURL(siteSettingsMap, 'https://www.brave.com')
      assert.strictEqual(setting.get('prop1'), 1)
    })
    it('can obtain a site setting from a URL at that host', function * () {
      const setting = siteSettings.getSiteSettingsForURL(siteSettingsMap, 'https://www.brave.com/projects#test')
      assert.strictEqual(setting.get('prop1'), 1)
    })
  })
  describe('any port pattern', function () {
    before(function () {
      siteSettingsMap = new Immutable.Map()
      siteSettingsMap = siteSettings.mergeSiteSetting(siteSettingsMap, 'https://www.brave.com:*', 'prop1', 2)
    })
    it('can obtain with a wildcard port for host pattern', function * () {
      const setting = siteSettings.getSiteSettingsForHostPattern(siteSettingsMap, 'https://www.brave.com:*')
      assert.strictEqual(setting.get('prop1'), 2)
    })
    it('can obtain without a port', function * () {
      const setting = siteSettings.getSiteSettingsForURL(siteSettingsMap, 'https://www.brave.com')
      assert.strictEqual(setting.get('prop1'), 2)
    })
    it('can obtain with a specific port', function * () {
      const setting = siteSettings.getSiteSettingsForURL(siteSettingsMap, 'https://www.brave.com:8080/projects#test')
      assert.strictEqual(setting.get('prop1'), 2)
    })
  })
  describe('all https protocol pattern', function () {
    before(function () {
      siteSettingsMap = new Immutable.Map()
      siteSettingsMap = siteSettings.mergeSiteSetting(siteSettingsMap, 'https://*', 'prop1', 3)
    })
    it('Can obtain from https url', function * () {
      const setting = siteSettings.getSiteSettingsForURL(siteSettingsMap, 'https://www.brave.com')
      assert.strictEqual(setting.get('prop1'), 3)
    })
    it('Cannot obtain from http url', function * () {
      const setting = siteSettings.getSiteSettingsForURL(siteSettingsMap, 'http://www.brave.com')
      assert.strictEqual(setting, undefined)
    })
  })
  describe('http or https specific URLs', function () {
    before(function () {
      siteSettingsMap = new Immutable.Map()
      siteSettingsMap = siteSettings.mergeSiteSetting(siteSettingsMap, 'https?://www.brave.com', 'prop1', 4)
    })
    it('Can obtain from https url', function * () {
      const setting = siteSettings.getSiteSettingsForURL(siteSettingsMap, 'https://www.brave.com/projects')
      assert.strictEqual(setting.get('prop1'), 4)
    })
    it('Can obtain from http url', function * () {
      const setting = siteSettings.getSiteSettingsForURL(siteSettingsMap, 'http://www.brave.com/projects')
      assert.strictEqual(setting.get('prop1'), 4)
    })
  })
  describe('subdomain wildcards', function () {
    before(function () {
      siteSettingsMap = new Immutable.Map()
      siteSettingsMap = siteSettings.mergeSiteSetting(siteSettingsMap, 'https?://*.brave.com:*', 'prop1', 5)
    })
    it('Can obtain from no subdomain', function * () {
      const setting = siteSettings.getSiteSettingsForURL(siteSettingsMap, 'https://brave.com/projects')
      assert.strictEqual(setting.get('prop1'), 5)
    })
    it('Can obtain from a single subdomain', function * () {
      const setting = siteSettings.getSiteSettingsForURL(siteSettingsMap, 'https://www.brave.com/projects')
      assert.strictEqual(setting.get('prop1'), 5)
    })
    it('Can obtain from multiple subdomains', function * () {
      const setting = siteSettings.getSiteSettingsForURL(siteSettingsMap, 'http://a.b.brave.com/projects')
      assert.strictEqual(setting.get('prop1'), 5)
    })
    it('Can obtain from multiple subdomains and a different port', function * () {
      const setting = siteSettings.getSiteSettingsForURL(siteSettingsMap, 'http://a.b.brave.com:99/projects')
      assert.strictEqual(setting.get('prop1'), 5)
    })
    it('Cannot obtain from a diff domain', function * () {
      const setting = siteSettings.getSiteSettingsForURL(siteSettingsMap, 'https://brianbondy.com/projects')
      assert.strictEqual(setting, undefined)
    })
  })
  describe('Overwriting a setting works', function () {
    before(function () {
      siteSettingsMap = new Immutable.Map()
      siteSettingsMap = siteSettings.mergeSiteSetting(siteSettingsMap, 'https://www.brave.com', 'prop1', 1)
      siteSettingsMap = siteSettings.mergeSiteSetting(siteSettingsMap, 'https://www.brave.com', 'prop1', 2)
    })
    it('can overwrites what is needed but does not ', function * () {
      let setting = siteSettings.getSiteSettingsForHostPattern(siteSettingsMap, 'https://www.brave.com')
      assert.strictEqual(setting.get('prop1'), 2)
    })
    it('merging settings does not lose other data', function * () {
      siteSettingsMap = siteSettings.mergeSiteSetting(siteSettingsMap, 'https://www.brave.com', 'prop2', 3)
      let setting = siteSettings.getSiteSettingsForHostPattern(siteSettingsMap, 'https://www.brave.com')
      assert.strictEqual(setting.get('prop1'), 2)
      assert.strictEqual(setting.get('prop2'), 3)
    })
  })
  describe('More specific rules override', function () {
    before(function () {
      siteSettingsMap = new Immutable.Map()

      siteSettingsMap = siteSettings.mergeSiteSetting(siteSettingsMap, 'https://*.brave.com', 'prop1', 3)
      siteSettingsMap = siteSettings.mergeSiteSetting(siteSettingsMap, 'https://*.brave.com', 'prop2', 3)
      siteSettingsMap = siteSettings.mergeSiteSetting(siteSettingsMap, 'https://*.brave.com', 'prop3', 3)

      siteSettingsMap = siteSettings.mergeSiteSetting(siteSettingsMap, 'https://www.brave.com', 'prop1', 1)

      siteSettingsMap = siteSettings.mergeSiteSetting(siteSettingsMap, 'https://www.brave.com:*', 'prop1', 2)
      siteSettingsMap = siteSettings.mergeSiteSetting(siteSettingsMap, 'https://www.brave.com:*', 'prop2', 2)

      siteSettingsMap = siteSettings.mergeSiteSetting(siteSettingsMap, '*', 'prop1', 4)
      siteSettingsMap = siteSettings.mergeSiteSetting(siteSettingsMap, '*', 'prop2', 4)
      siteSettingsMap = siteSettings.mergeSiteSetting(siteSettingsMap, '*', 'prop3', 4)
      siteSettingsMap = siteSettings.mergeSiteSetting(siteSettingsMap, '*', 'prop4', 4)
    })
    it('can obtain a site setting from a host pattern', function * () {
      let setting = siteSettings.getSiteSettingsForHostPattern(siteSettingsMap, 'https://www.brave.com')
      assert.strictEqual(setting.get('prop1'), 1)
      assert.strictEqual(setting.get('prop2'), undefined)
      assert.strictEqual(setting.get('prop3'), undefined)

      setting = siteSettings.getSiteSettingsForHostPattern(siteSettingsMap, 'https://www.brave.com:*')
      assert.strictEqual(setting.get('prop1'), 2)
      assert.strictEqual(setting.get('prop2'), 2)

      setting = siteSettings.getSiteSettingsForHostPattern(siteSettingsMap, 'https://*.brave.com')
      assert.strictEqual(setting.get('prop1'), 3)
      assert.strictEqual(setting.get('prop2'), 3)
      assert.strictEqual(setting.get('prop3'), 3)

      setting = siteSettings.getSiteSettingsForHostPattern(siteSettingsMap, '*')
      assert.strictEqual(setting.get('prop1'), 4)
      assert.strictEqual(setting.get('prop2'), 4)
      assert.strictEqual(setting.get('prop3'), 4)
      assert.strictEqual(setting.get('prop4'), 4)
    })
    it('can obtain properly combined settings', function * () {
      const setting = siteSettings.getSiteSettingsForURL(siteSettingsMap, 'https://www.brave.com')
      assert.strictEqual(setting.get('prop1'), 1)
      assert.strictEqual(setting.get('prop2'), 2)
      assert.strictEqual(setting.get('prop3'), 3)
      assert.strictEqual(setting.get('prop4'), 4)
    })
  })
})

describe('siteUtil', function () {
  describe('gets URL origin', function () {
    it('gets URL origin for simple url', function () {
      assert.strictEqual(siteUtil.getOrigin('https://abc.bing.com'), 'https://abc.bing.com')
    })
    it('gets URL origin for url with port', function () {
      assert.strictEqual(siteUtil.getOrigin('https://bing.com:443/?test=1#abc'), 'https://bing.com:443')
    })
    it('gets URL origin for IP host', function () {
      assert.strictEqual(siteUtil.getOrigin('http://127.0.0.1:443/?test=1#abc'), 'http://127.0.0.1:443')
    })
    it('gets URL origin for slashless protocol URL', function () {
      assert.strictEqual(siteUtil.getOrigin('about:test/foo'), 'about:test')
    })
    it('returns null for invalid URL', function () {
      assert.strictEqual(siteUtil.getOrigin('abc'), null)
    })
    it('returns null for empty URL', function () {
      assert.strictEqual(siteUtil.getOrigin(''), null)
    })
    it('returns null for null URL', function () {
      assert.strictEqual(siteUtil.getOrigin(null), null)
    })
    it('returns correct result for URL with hostname that is a scheme', function () {
      assert.strictEqual(siteUtil.getOrigin('http://http/test'), 'http://http')
    })
  })
})
