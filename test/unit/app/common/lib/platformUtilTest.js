/* global describe, it, afterEach */
const assert = require('assert')
let platformUtil = require('../../../../../app/common/lib/platformUtil')

require('../../../braveUnit')

describe('platformUtil', function () {
  // see atom_extensions_dispatcher_delegate.cc for all values
  const mockWin7 = {
    platform: 'win32',
    platformVersion: 'win7'
  }
  const mockWin8 = {
    platform: 'win32',
    platformVersion: 'win8'
  }
  const mockWin10 = {
    platform: 'win32',
    platformVersion: 'win10'
  }
  const mockMacOS = {
    platform: 'darwin',
    platformVersion: ''
  }
  const loadMocks = (osMock) => {
    this.originalPlatform = process.platform
    this.originalPlatformVersion = process.platformVersion
    Object.defineProperty(process, 'platform', {
      value: osMock.platform,
      configurable: true
    })
    Object.defineProperty(process, 'platformVersion', {
      value: osMock.platformVersion,
      configurable: true
    })
  }
  const unloadMocks = () => {
    Object.defineProperty(process, 'platform', {
      value: this.originalPlatform
    })
    Object.defineProperty(process, 'platformVersion', {
      value: this.originalPlatformVersion
    })
  }

  afterEach(function () {
    unloadMocks()
  })

  describe('getPlatformStyles', function () {
    it('prepends style with platform--', function () {
      loadMocks(mockWin7)

      const result = platformUtil.getPlatformStyles()
      assert.equal(result[0].match(/^platform--/), 'platform--')
    })
    it('returns the style "win7" for Windows 7', function () {
      loadMocks(mockWin7)

      const result = platformUtil.getPlatformStyles()
      assert.equal(result.length, 2)
      assert.equal(result[1], 'win7')
    })
    it('returns the style "win10" for Windows 8', function () {
      loadMocks(mockWin8)

      const result = platformUtil.getPlatformStyles()
      assert.equal(result.length, 2)
      assert.equal(result[1], 'win10')
    })
    it('returns the style "win10" for Windows 10', function () {
      loadMocks(mockWin10)

      const result = platformUtil.getPlatformStyles()
      assert.equal(result.length, 2)
      assert.equal(result[1], 'win10')
    })
  })

  describe('getPathFromFileURI', function () {
    const winFileURI = 'file:///C:/brave/brave%20is%20awesome'
    const fileURI = 'file:///brave/brave%20is%20awesome'
    const winExpectedResult = 'C:/brave/brave is awesome'
    const expectedResult = '/brave/brave is awesome'
    it('return path for window', function () {
      loadMocks(mockWin10)
      const result = platformUtil.getPathFromFileURI(winFileURI)
      assert.equal(result, winExpectedResult)
    })
    it('return path for non window', function () {
      loadMocks(mockMacOS)
      const result = platformUtil.getPathFromFileURI(fileURI)
      assert.equal(result, expectedResult)
    })
  })

  describe('isDarwin', function () {
    it('returns true if using macOS', function () {
      loadMocks(mockMacOS)
      assert.equal(platformUtil.isDarwin(), true)
    })
    it('returns false if not using macOS', function () {
      loadMocks(mockWin10)
      assert.equal(platformUtil.isDarwin(), false)
    })
  })

  describe('isWindows', function () {
    it('returns true if using Windows', function () {
      loadMocks(mockWin10)
      assert.equal(platformUtil.isWindows(), true)
    })
    it('returns false if not using Windows', function () {
      loadMocks(mockMacOS)
      assert.equal(platformUtil.isWindows(), false)
    })
  })
})
