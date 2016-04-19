/* global describe, before, it */

const siteSettings = require('../../js/state/siteSettings')
const assert = require('assert')
const Immutable = require('immutable')
let siteSettingsMap = new Immutable.Map()

describe('siteSettings', function () {
  describe('simple URL host pattern', function () {
    before(function () {
      siteSettingsMap = siteSettings.setSiteSettings(siteSettingsMap, 'https://www.brave.com', {
        prop1: 1
      })
    })
    it('can obtain a site setting from a host pattern', function *() {
      const setting = siteSettings.getSiteSettingsForHostPattern(siteSettingsMap, 'https://www.brave.com')
      assert.strictEqual(setting.prop1, 1)
    })
    it('can obtain a site setting from an exact URL', function *() {
      const setting = siteSettings.getSiteSettingsForURL(siteSettingsMap, 'https://www.brave.com')
      assert.strictEqual(setting.prop1, 1)
    })
    it('can obtain a site setting from a URL at that host', function *() {
      const setting = siteSettings.getSiteSettingsForURL(siteSettingsMap, 'https://www.brave.com/projects#test')
      assert.strictEqual(setting.prop1, 1)
    })
  })
  describe('any port pattern', function () {
    before(function () {
      siteSettingsMap = new Immutable.Map()
      siteSettingsMap = siteSettings.setSiteSettings(siteSettingsMap, 'https://www.brave.com:*', {
        prop1: 2
      })
    })
    it('can obtain without a port', function *() {
      const setting = siteSettings.getSiteSettingsForHostPattern(siteSettingsMap, 'https://www.brave.com:*')
      assert.strictEqual(setting.prop1, 2)
    })
    it('can obtain without a port', function *() {
      const setting = siteSettings.getSiteSettingsForURL(siteSettingsMap, 'https://www.brave.com')
      assert.strictEqual(setting.prop1, 2)
    })
    it('can obtain with a specific port', function *() {
      const setting = siteSettings.getSiteSettingsForURL(siteSettingsMap, 'https://www.brave.com:8080/projects#test')
      assert.strictEqual(setting.prop1, 2)
    })
  })
  describe('all https protocol pattern', function () {
    before(function () {
      siteSettingsMap = new Immutable.Map()
      siteSettingsMap = siteSettings.setSiteSettings(siteSettingsMap, 'https://*', {
        prop1: 3
      })
    })
    it('Can obtain from https url', function *() {
      const setting = siteSettings.getSiteSettingsForURL(siteSettingsMap, 'https://www.brave.com')
      assert.strictEqual(setting.prop1, 3)
    })
    it('Cannot obtain from http url', function *() {
      const setting = siteSettings.getSiteSettingsForURL(siteSettingsMap, 'http://www.brave.com')
      assert.strictEqual(setting, undefined)
    })
  })
  describe('http or https specific URLs', function () {
    before(function () {
      siteSettingsMap = new Immutable.Map()
      siteSettingsMap = siteSettings.setSiteSettings(siteSettingsMap, 'http?://www.brave.com', {
        prop1: 4
      })
    })
    it('Can obtain from https url', function *() {
      const setting = siteSettings.getSiteSettingsForURL(siteSettingsMap, 'https://www.brave.com/projects')
      assert.strictEqual(setting.prop1, 4)
    })
    it('Can obtain from http url', function *() {
      const setting = siteSettings.getSiteSettingsForURL(siteSettingsMap, 'http://www.brave.com/projects')
      assert.strictEqual(setting.prop1, 4)
    })
  })
  describe('subdomain wildcards', function () {
    before(function () {
      siteSettingsMap = new Immutable.Map()
      siteSettingsMap = siteSettings.setSiteSettings(siteSettingsMap, 'http?://*.brave.com:*', {
        prop1: 5
      })
    })
    it('Can obtain from no subdomain', function *() {
      const setting = siteSettings.getSiteSettingsForURL(siteSettingsMap, 'https://brave.com/projects')
      assert.strictEqual(setting.prop1, 5)
    })
    it('Can obtain from a single subdomain', function *() {
      const setting = siteSettings.getSiteSettingsForURL(siteSettingsMap, 'https://www.brave.com/projects')
      assert.strictEqual(setting.prop1, 5)
    })
    it('Can obtain from multiple subdomains', function *() {
      const setting = siteSettings.getSiteSettingsForURL(siteSettingsMap, 'http://a.b.brave.com/projects')
      assert.strictEqual(setting.prop1, 5)
    })
    it('Can obtain from multiple subdomains and a different port', function *() {
      const setting = siteSettings.getSiteSettingsForURL(siteSettingsMap, 'http://a.b.brave.com:99/projects')
      assert.strictEqual(setting.prop1, 5)
    })
    it('Cannot obtain from a diff domain', function *() {
      const setting = siteSettings.getSiteSettingsForURL(siteSettingsMap, 'https://brianbondy.com/projects')
      assert.strictEqual(setting, undefined)
    })
  })
  describe('More specific rules override', function () {
    before(function () {
      siteSettingsMap = siteSettings.setSiteSettings(siteSettingsMap, 'https://www.brave.com', {
        prop1: 1
      })
      siteSettingsMap = siteSettings.setSiteSettings(siteSettingsMap, 'https://www.brave.com:*', {
        prop1: 2,
        prop2: 2
      })
      siteSettingsMap = siteSettings.setSiteSettings(siteSettingsMap, 'https://*.brave.com', {
        prop1: 3,
        prop2: 3,
        prop3: 3
      })
    })
    it('can obtain a site setting from a host pattern', function *() {
      let setting = siteSettings.getSiteSettingsForHostPattern(siteSettingsMap, 'https://www.brave.com')
      assert.strictEqual(setting.prop1, 1)
      assert.strictEqual(setting.prop2, undefined)
      assert.strictEqual(setting.prop3, undefined)

      setting = siteSettings.getSiteSettingsForHostPattern(siteSettingsMap, 'https://www.brave.com:*')
      assert.strictEqual(setting.prop1, 2)
      assert.strictEqual(setting.prop2, 2)

      setting = siteSettings.getSiteSettingsForHostPattern(siteSettingsMap, 'https://*.brave.com')
      assert.strictEqual(setting.prop1, 3)
      assert.strictEqual(setting.prop2, 3)
      assert.strictEqual(setting.prop3, 3)
    })
    it('can obtain properly combined settings', function *() {
      const setting = siteSettings.getSiteSettingsForURL(siteSettingsMap, 'https://www.brave.com')
      assert.strictEqual(setting.prop1, 1)
      assert.strictEqual(setting.prop2, 2)
      assert.strictEqual(setting.prop3, 3)
    })
  })
})
