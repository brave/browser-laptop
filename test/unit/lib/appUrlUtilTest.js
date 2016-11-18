/* global describe, it */
const appUrlUtil = require('../../../js/lib/appUrlUtil')
const assert = require('assert')

require('../braveUnit')

describe('appUrlUtil', function () {
  describe('getBraveExtUrl', function () {
    it('arg', function () {
      assert.equal(appUrlUtil.getBraveExtUrl('test'),
        'chrome-extension://mnojpmjdmbbfmejpflffifhffcmidifd/test')
    })
    it('no arg', function () {
      assert.equal(appUrlUtil.getBraveExtUrl(),
        'chrome-extension://mnojpmjdmbbfmejpflffifhffcmidifd/')
    })
  })
  describe('getTorrentExtUrl', function () {
    it('arg', function () {
      assert.equal(appUrlUtil.getTorrentExtUrl('test'),
        'chrome-extension://fmdpfempfmekjkcfdehndghogpnpjeno/test')
    })
    it('no arg', function () {
      assert.equal(appUrlUtil.getTorrentExtUrl(),
        'chrome-extension://fmdpfempfmekjkcfdehndghogpnpjeno/')
    })
  })
  describe('aboutUrls', function () {
    it('about:about', function () {
      assert.equal(appUrlUtil.aboutUrls.get('about:about'),
        'chrome-extension://mnojpmjdmbbfmejpflffifhffcmidifd/about-about.html')
    })
  })
  describe('magnet url translation', function () {
    it('getTargetMagnetUrl', function () {
      assert.equal(appUrlUtil.getTargetMagnetUrl('magnet:?foo=bar'),
        'chrome-extension://fmdpfempfmekjkcfdehndghogpnpjeno/webtorrent.html#magnet:?foo=bar')
    })
    it('getSourceMagnetUrl', function () {
      assert.equal(appUrlUtil.getSourceMagnetUrl(
        'chrome-extension://fmdpfempfmekjkcfdehndghogpnpjeno/webtorrent.html#magnet:?foo=bar'),
        'magnet:?foo=bar')
    })
    it('isTargetMagnetUrl', function () {
      assert.equal(appUrlUtil.isSourceMagnetUrl('magnet:?foo=bar'), true)
    })
    it('isSourceMagnetUrl', function () {
      assert.equal(appUrlUtil.isTargetMagnetUrl(
        'chrome-extension://fmdpfempfmekjkcfdehndghogpnpjeno/webtorrent.html#magnet:?foo=bar'),
        true)
    })
  })
})
