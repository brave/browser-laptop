/* global describe, it */
const mockery = require('mockery')
const assert = require('assert')
let platformUtil = require('../../../../../app/common/lib/platformUtil')

require('../../../braveUnit')

describe('platformUtil', function () {
  const mockWin7 = {
    platform: () => 'win32',
    release: () => '6.1.7601'
  }
  const mockWin8 = {
    platform: () => 'win32',
    release: () => '6.3.9600'
  }
  const mockWin10 = {
    platform: () => 'win32',
    release: () => '10.0.10586'
  }
  const mockMacOS = {
    platform: () => 'darwin'
  }

  // For more details on Mockery, see https://github.com/mfncooper/mockery
  const loadMocks = (osMock) => {
    mockery.enable({ warnOnReplace: false, warnOnUnregistered: false, useCleanCache: true })
    mockery.registerMock('os', osMock)
    platformUtil = require('../../../../../app/common/lib/platformUtil')
  }
  const unloadMocks = () => {
    mockery.disable()
    platformUtil = require('../../../../../app/common/lib/platformUtil')
  }

  describe('getPlatformStyles', function () {
    it('prepends style with platform--', function () {
      const result = platformUtil.getPlatformStyles()
      assert.equal(result[0].match(/^platform--/), 'platform--')
    })
    it('returns the style "win7" for Windows 7', function () {
      loadMocks(mockWin7)

      const result = platformUtil.getPlatformStyles()
      assert.equal(result.length, 2)
      assert.equal(result[1], 'win7')

      unloadMocks()
    })
    it('returns the style "win10" for Windows 8', function () {
      loadMocks(mockWin8)

      const result = platformUtil.getPlatformStyles()
      assert.equal(result.length, 2)
      assert.equal(result[1], 'win10')

      unloadMocks()
    })
    it('returns the style "win10" for Windows 10', function () {
      loadMocks(mockWin10)

      const result = platformUtil.getPlatformStyles()
      assert.equal(result.length, 2)
      assert.equal(result[1], 'win10')

      unloadMocks()
    })
  })

  describe('isDarwin', function () {
    it('returns true if using macOS', function () {
      loadMocks(mockMacOS)
      assert.equal(platformUtil.isDarwin(), true)
      unloadMocks()
    })
    it('returns false if not using macOS', function () {
      loadMocks(mockWin10)
      assert.equal(platformUtil.isDarwin(), false)
      unloadMocks()
    })
  })

  describe('isWindows', function () {
    it('returns true if using Windows', function () {
      loadMocks(mockWin10)
      assert.equal(platformUtil.isWindows(), true)
      unloadMocks()
    })
    it('returns false if not using Windows', function () {
      loadMocks(mockMacOS)
      assert.equal(platformUtil.isWindows(), false)
      unloadMocks()
    })
  })
})
