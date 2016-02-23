/* global describe, it */

const UrlUtil = require('../../js/lib/urlutil')
const assert = require('assert')

describe.only('urlutil', function () {
  describe('getScheme', function () {
    it('null for empty', function *() {
      assert.equal(UrlUtil.getScheme('/file/path/to/file'), null)
    })

    it('null for localhost', function *() {
      assert.equal(UrlUtil.getScheme('localhost://127.0.0.1'), null)
    })

    it('gets scheme with :', function *() {
      assert.equal(UrlUtil.getScheme('data:datauri'), 'data:')
    })

    it('gets scheme with ://', function *() {
      assert.equal(UrlUtil.getScheme('http://www.brave.com'), 'http://')
    })
  })

  describe('prependScheme', function () {
    it('prepends file:// to absolute file path', function *() {
      assert.equal(UrlUtil.prependScheme('/file/path/to/file'), 'file:///file/path/to/file')
    })

    it('defaults to http://', function *() {
      assert.equal(UrlUtil.prependScheme('www.brave.com'), 'http://www.brave.com')
    })

    it('keeps schema if already exists', function *() {
      assert.equal(UrlUtil.prependScheme('https://www.brave.com'), 'https://www.brave.com')
    })
  })

  describe('isURL', function () {
    it.skip('absolute file path without scheme', function *() {
      assert.equal(UrlUtil.isURL('/file/path/to/file'), true)
    })

    it('absolute file path with scheme', function *() {
      assert.equal(UrlUtil.isURL('file:///file/path/to/file'), true)
    })

    it('detects data URI', function *() {
      assert.equal(UrlUtil.isURL('data:datauri'), true)
    })
  })
})
