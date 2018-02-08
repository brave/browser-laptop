/* global describe, before, after, it */
const mockery = require('mockery')
const assert = require('assert')

require('../braveUnit')

describe('importer unit tests', function () {
  let importer
  const fakeElectron = require('../lib/fakeElectron')

  before(function () {
    mockery.enable({
      warnOnReplace: false,
      warnOnUnregistered: false,
      useCleanCache: true
    })
    mockery.registerMock('electron', fakeElectron)
    mockery.registerMock('./adBlock', {adBlockResourceName: 'adblock'})
    importer = require('../../../app/importer')
  })

  after(function () {
    mockery.disable()
  })

  describe('shouldSkipCookie', function () {
    it('returns true if domain is google and name is one which has a mismatch', function () {
      assert.equal(importer.shouldSkipCookie({domain: '.google.com', name: 'OSID'}), true)
      assert.equal(importer.shouldSkipCookie({domain: 'mail.google.com', name: 'LSID'}), true)
      assert.equal(importer.shouldSkipCookie({domain: '.google.com.tw', name: 'SIDCC'}), true)
    })

    it('returns false for other cases', function () {
      assert.equal(importer.shouldSkipCookie({domain: '.brave.com', name: 'OSID'}), false)
      assert.equal(importer.shouldSkipCookie({domain: 'ggoogle.com', name: 'OSID'}), false)
      assert.equal(importer.shouldSkipCookie({domain: '.google.comm', name: 'OSID'}), false)
      assert.equal(importer.shouldSkipCookie({domain: '.google.comm.', name: 'OSID'}), false)
      assert.equal(importer.shouldSkipCookie({domain: '.google.com', name: 'BRAVE'}), false)
    })
  })
})
