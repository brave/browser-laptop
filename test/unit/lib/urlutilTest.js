/* global describe, it */
const UrlUtil = require('../../../js/lib/urlutil')
const assert = require('assert')

require('../braveUnit')

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
    it('returns null when input is null', function () {
      assert.equal(UrlUtil.prependScheme(null), null)
    })
    it('returns undefined when input is undefined', function () {
      assert.equal(UrlUtil.prependScheme(), undefined)
    })
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

  describe('isNotURL', function () {
    it('returns true when input is null', function () {
      assert.equal(UrlUtil.isNotURL(null), true)
    })
    it('returns true when input is undefined', function () {
      assert.equal(UrlUtil.isNotURL(), true)
    })
    it('returns false when input is "localhost"', function () {
      assert.equal(UrlUtil.isNotURL('localhost'), false)
    })
    it('returns true when input is a quoted string', function () {
      assert.equal(UrlUtil.isNotURL('"brave.com"'), true)
    })
    it('returns true when input is a pure string (no TLD)', function () {
      assert.equal(UrlUtil.isNotURL('brave'), true)
    })
    it('returns false when input is a string with whitespace but has schema', function () {
      assert.equal(UrlUtil.isNotURL('https://wwww.brave.com/test space.jpg'), false)
    })
    it('returns true when input is a string with schema but invalid domain name', function () {
      assert.equal(UrlUtil.isNotURL('https://www.bra ve.com/test space.jpg'), true)
    })
    it('returns true when input contains more than one word', function () {
      assert.equal(UrlUtil.isNotURL('brave is cool'), true)
    })
    it('returns false when input has custom protocol', function () {
      assert.equal(UrlUtil.isNotURL('brave://test'), false)
    })
    it('returns true when input has space in schema', function () {
      assert.equal(UrlUtil.isNotURL('https ://brave.com'), true)
    })
    it('returns false when input is chrome-extension', function () {
      assert.equal(UrlUtil.isNotURL('chrome-extension://fmfcbgogabcbclcofgocippekhfcmgfj/cast_sender.js'), false)
    })
    it('returns false when input is mailto', function () {
      assert.equal(UrlUtil.isNotURL('mailto:brian@brave.com'), false)
    })
    describe('search query', function () {
      it('returns true when input starts with ?', function () {
        assert.equal(UrlUtil.isNotURL('?brave'), true)
      })
      it('returns true when input has a question mark followed by a space', function () {
        assert.equal(UrlUtil.isNotURL('? brave'), true)
      })
      it('returns true when input starts with .', function () {
        assert.equal(UrlUtil.isNotURL('.brave'), true)
      })
      it('returns true when input end with .', function () {
        assert.equal(UrlUtil.isNotURL('brave.'), true)
      })
    })
    it('returns false when input is a valid URL', function () {
      assert.equal(UrlUtil.isNotURL('brave.com'), false)
    })
  })

  describe('getUrlFromInput', function () {
    it('returns empty string when input is null', function () {
      assert.equal(UrlUtil.getUrlFromInput(null), '')
    })
    it('returns empty string when input is undefined', function () {
      assert.equal(UrlUtil.getUrlFromInput(), '')
    })
    it('calls prependScheme', function () {
      assert.equal(UrlUtil.getUrlFromInput('/file/path/to/file'), 'file:///file/path/to/file')
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

  describe('isFileType', function () {
    it('relative file', function * () {
      assert.equal(UrlUtil.isFileType('/file/abc/test.pdf', 'pdf'), true)
    })
    it('relative path', function * () {
      assert.equal(UrlUtil.isFileType('/file/abc/test', 'pdf'), false)
    })
    it('JPG URL', function * () {
      assert.equal(UrlUtil.isFileType('http://example.com/test/ABC.JPG?a=b#test', 'jpg'), true)
    })
    it('non-JPG URL', function * () {
      assert.equal(UrlUtil.isFileType('http://example.com/test/jpg', 'jpg'), false)
    })
    it('invalid URL', function * () {
      assert.equal(UrlUtil.isFileType('foo', 'jpg'), false)
    })
  })

  describe('getHostname', function () {
    it('returns undefined if the URL is invalid', function () {
      assert.equal(UrlUtil.getHostname(null), undefined)
    })
    it('returns the host field (including port number)', function () {
      assert.equal(UrlUtil.getHostname('https://brave.com:8080/test/'), 'brave.com:8080')
    })
    it('allows you to exclude the port number', function () {
      assert.equal(UrlUtil.getHostname('https://brave.com:8080/test/', true), 'brave.com')
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

  describe('isFlashInstallUrl', function () {
    it('gets English flash install', function () {
      assert(UrlUtil.isFlashInstallUrl('https://get.adobe.com/flashplayer'))
      assert(UrlUtil.isFlashInstallUrl('https://www.adobe.com/go/getflash/'))
      assert(UrlUtil.isFlashInstallUrl('http://www.macromedia.com/go/GETFLASH'))
    })
    it('gets non-English flash install', function () {
      assert(UrlUtil.isFlashInstallUrl('https://get.adobe.com/jp/flashplayer#test'))
      assert(UrlUtil.isFlashInstallUrl('https://get.adobe.com/en/us/flashplayer/etc'))
      assert(UrlUtil.isFlashInstallUrl('https://get.adobe.com/en-US/flashplayer/etc'))
    })
    it('returns false for non-flash url', function () {
      assert(!UrlUtil.isFlashInstallUrl('https://gettadobe.com/jp/flashplayer'))
    })
  })

  describe('shouldInterceptFlash', function () {
    it('intercepts flash', function () {
      assert(UrlUtil.shouldInterceptFlash('http://adobe.com.abc/flashthing'))
      assert(UrlUtil.shouldInterceptFlash('https://site.duckduckgo.com'))
    })
    it('does not intercept on search engine pages', function () {
      assert(!UrlUtil.shouldInterceptFlash('https://www.google.com/#q=flash'))
      assert(!UrlUtil.shouldInterceptFlash('https://www.google.jp/#q=flash'))
      assert(!UrlUtil.shouldInterceptFlash('https://www.google.co.uk/#q=flash'))
      assert(!UrlUtil.shouldInterceptFlash('https://duckduckgo.com/?q=flash+player&t=hd&ia=about'))
      assert(!UrlUtil.shouldInterceptFlash('https://www.bing.com/search?q=flash&go=Submit&qs=n&form=QBLH'))
      assert(!UrlUtil.shouldInterceptFlash('https://yandex.ru/search/?lr=21411&msid=1469118356.6242.22900.32200&text=flash%20player'))
      assert(!UrlUtil.shouldInterceptFlash('https://search.yahoo.com/search;_ylt=AwrBT4at95BXs8sAdpdXNyoA;_ylc=X1MDMjc2NjY3OQRfcgMyBGZyA3lmcC1'))
    })
    it('does not intercept on adobe site', function () {
      assert(!UrlUtil.shouldInterceptFlash('https://www.adobe.com/test'))
    })
  })

  describe('getLocationIfPDF', function () {
    it('gets location for PDF JS URL', function () {
      assert.equal(UrlUtil.getLocationIfPDF('chrome-extension://jdbefljfgobbmcidnmpjamcbhnbphjnb/https://www.blackhat.co…king-Kernel-Address-Space-Layout-Randomization-KASLR-With-Intel-TSX-wp.pdf'),
        'https://www.blackhat.co…king-Kernel-Address-Space-Layout-Randomization-KASLR-With-Intel-TSX-wp.pdf')
    })
    it('does not modify location for non-pdf URL', function () {
      assert.equal(UrlUtil.getLocationIfPDF('https://www.blackhat.co…king-Kernel-Address-Space-Layout-Randomization-KASLR-With-Intel-TSX-wp.pdf'),
        'https://www.blackhat.co…king-Kernel-Address-Space-Layout-Randomization-KASLR-With-Intel-TSX-wp.pdf')
      assert.equal(UrlUtil.getLocationIfPDF('chrome-extension://blank'), 'chrome-extension://blank')
      assert.equal(UrlUtil.getLocationIfPDF(null), null)
    })
  })

  describe('getDefaultFaviconUrl', function () {
    it('returns empty string if input is not a URL', function () {
      assert.equal(UrlUtil.getDefaultFaviconUrl('invalid-url-goes-here'), '')
    })
    it('returns the default favicon URL when given a valid URL', function () {
      assert.equal(UrlUtil.getDefaultFaviconUrl('https://brave.com'), 'https://brave.com/favicon.ico')
    })
    it('includes the port in the response when given a valid URL with a port number', function () {
      assert.equal(UrlUtil.getDefaultFaviconUrl('https://brave.com:8080'), 'https://brave.com:8080/favicon.ico')
    })
  })
})
