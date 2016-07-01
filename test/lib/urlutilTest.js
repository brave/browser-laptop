/* global describe, it */

const UrlUtil = require('../../js/lib/urlutil')
const assert = require('assert')

describe('urlutil', function () {
  describe('getScheme', function () {
    it('null for empty', function * () {
      assert.equal(UrlUtil.getScheme('/file/path/to/file'), null)
    })

    it('localhost: for localhost', function * () {
      assert.equal(UrlUtil.getScheme('localhost://127.0.0.1'), 'localhost:')
    })

    it('gets scheme with :', function * () {
      assert.equal(UrlUtil.getScheme('data:datauri'), 'data:')
    })

    it('host:port is not recognized as a scheme', function * () {
      assert.equal(UrlUtil.getScheme('localhost:8089'), null)
    })

    it('gets scheme with ://', function * () {
      assert.equal(UrlUtil.getScheme('http://www.brave.com'), 'http://')
    })
  })

  describe('prependScheme', function () {
    it('prepends file:// to absolute file path', function * () {
      assert.equal(UrlUtil.prependScheme('/file/path/to/file'), 'file:///file/path/to/file')
    })

    it('defaults to http://', function * () {
      assert.equal(UrlUtil.prependScheme('www.brave.com'), 'http://www.brave.com')
    })

    it('keeps schema if already exists', function * () {
      assert.equal(UrlUtil.prependScheme('https://www.brave.com'), 'https://www.brave.com')
    })
  })

  describe('isURL', function () {
    it('absolute file path without scheme', function * () {
      assert.equal(UrlUtil.isURL('/file/path/to/file'), true)
    })

    it('absolute file path with scheme', function * () {
      assert.equal(UrlUtil.isURL('file:///file/path/to/file'), true)
    })

    it('detects data URI', function * () {
      assert.equal(UrlUtil.isURL('data:text/html,hi'), true)
    })

    it('someBraveServer:8089', function * () {
      assert.equal(UrlUtil.isURL('someBraveServer:8089'), true)
    })

    it('localhost', function * () {
      assert.equal(UrlUtil.isURL('localhost:8089'), true)
    })
  })

  describe('getHostnamePatterns', function () {
    it('gets bare domain hostname patterns', function () {
      // XXX: *.com probably should be excluded
      assert.deepEqual(UrlUtil.getHostnamePatterns('http://brave.com'),
                       ['brave.com', '*.com', 'brave.*'])
    })
    it('gets subdomain hostname patterns', function () {
      assert.deepEqual(UrlUtil.getHostnamePatterns('https://bar.brave.com'),
                       ['bar.brave.com',
                        '*.brave.com',
                        'bar.*.com',
                        'bar.brave.*'])
      assert.deepEqual(UrlUtil.getHostnamePatterns('https://foo.bar.brave.com'),
                       ['foo.bar.brave.com',
                        '*.bar.brave.com',
                        'foo.*.brave.com',
                        'foo.bar.*.com',
                        'foo.bar.brave.*',
                        '*.brave.com'])
    })
  })
})
