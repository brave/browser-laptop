/* global describe, before, after, it */
const mockery = require('mockery')
const assert = require('assert')

require('../braveUnit')

describe('locale unit tests', function () {
  let locale
  let testLocale = 'en-US'
  const fakeElectron = require('../lib/fakeElectron')

  before(function () {
    fakeElectron.app.getLocale = () => testLocale

    mockery.enable({
      warnOnReplace: false,
      warnOnUnregistered: false,
      useCleanCache: true
    })
    mockery.registerMock('electron', fakeElectron)
    locale = require('../../../app/locale')
  })

  after(function () {
    mockery.disable()
  })

  describe('getDefaultLocale', function () {
    it('defaults to en-US if locale is falsey', function () {
      testLocale = undefined
      assert.equal(locale.getDefaultLocale(), 'en-US')
    })

    it('defaults to en-US if locale is not in supported locales/languages list', function () {
      testLocale = 'not-a-real-locale'
      assert.equal(locale.getDefaultLocale(), 'en-US')
    })

    it('ignores the supported locales/languages list if you pass `true`', function () {
      testLocale = 'not-a-real-locale'
      assert.equal(locale.getDefaultLocale(true), 'not-a-real-locale')
    })

    it('replaces underscore in locale with hyphen', function () {
      testLocale = 'en_US'
      assert.equal(locale.getDefaultLocale(), 'en-US')
    })

    it('puts a country code in place if one does not exist', function () {
      testLocale = 'fr'
      assert.equal(locale.getDefaultLocale(), 'fr-FR')
    })
  })
})
