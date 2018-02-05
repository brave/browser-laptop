/* global describe, before, after, it */
const { assert } = require('chai')
const mockery = require('mockery')

describe('cmdLine', function () {
  before(function () {
    mockery.enable({
      warnOnReplace: false,
      warnOnUnregistered: false,
      useCleanCache: true
    })
    mockery.registerMock('path', require('path').win32)
    const fakeElectron = Object.assign({}, require('../lib/fakeElectron'))
    const fakeAdBlock = require('../lib/fakeAdBlock')
    fakeElectron.reset()
    mockery.registerMock('electron', fakeElectron)
    mockery.registerMock('ad-block', fakeAdBlock)
    // force win32 path parsing

    mockery.registerMock('leveldown', {})
    this.cmdLine = require('../../../app/cmdLine')
  })

  after(function () {
    mockery.disable()
  })

  const initialArgs = ['myapp.js']

  describe('getValueForKey', function () {
    it('finds value for key', function () {
      const testValue = 'myValue'
      const testKey = 'myKey'
      const result = this.cmdLine.getValueForKey(testKey, [...initialArgs, testKey, testValue])
      assert.equal(result, testValue)
    })
    it('does not find a value for missing key', function () {
      const testValue = 'myValue'
      const testKey = 'myKey'
      const result = this.cmdLine.getValueForKey(testKey, [...initialArgs, testValue])
      assert.isNull(result)
    })
  })

  describe('getFirstRunPromoCode', function () {
    const key = '--squirrel-installer-path'

    it('finds and parses promo code', function () {
      const promoCode = 'pem001'
      const validPromoCodeInstallerPath = `d:\\my\\location\\on-disk\\in-a-folder-tes301\\Setup-Brave-x64-${promoCode}.exe`
      const args = [...initialArgs, key, validPromoCodeInstallerPath, '--other', 'arg', '--and-another']
      const result = this.cmdLine.getFirstRunPromoCode(args)
      assert.equal(result, promoCode)
    })
    it(`does not find promo code when there isn't one`, function () {
      const noPromoCodeInstallerPath = `d:\\my\\location\\on-disk\\in-a-folder-tes301\\Setup-Brave-x64.exe`
      const args = [...initialArgs, key, noPromoCodeInstallerPath, '--other', 'arg', '--and-another']
      const result = this.cmdLine.getFirstRunPromoCode(args)
      assert.isNull(result)
    })
  })
})
