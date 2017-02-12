/* global describe, it */
const UrlUtil = require('../../../js/lib/urlutil')
const assert = require('assert')

require('../braveUnit')

describe('urlutil', function () {
  describe('getScheme', function () {
    it('null for empty', function () {
      assert.equal(UrlUtil.getScheme('/file/path/to/file'), null)
    })
    it('localhost: for localhost', function () {
      assert.equal(UrlUtil.getScheme('localhost://127.0.0.1'), 'localhost:')
    })
    it('gets scheme with :', function () {
      assert.equal(UrlUtil.getScheme('data:datauri'), 'data:')
    })
    it('host:port is not recognized as a scheme', function () {
      assert.equal(UrlUtil.getScheme('localhost:8089'), null)
    })
    it('gets scheme with ://', function () {
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
    it('prepends file:// to absolute file path', function () {
      assert.equal(UrlUtil.prependScheme('/file/path/to/file'), 'file:///file/path/to/file')
    })
    it('defaults to http://', function () {
      assert.equal(UrlUtil.prependScheme('www.brave.com'), 'http://www.brave.com')
    })
    it('keeps schema if already exists', function () {
      assert.equal(UrlUtil.prependScheme('https://www.brave.com'), 'https://www.brave.com')
    })
  })

  describe('isNotURL', function () {
    describe('returns false when input:', function () {
      it('is a valid URL', function () {
        assert.equal(UrlUtil.isNotURL('brave.com'), false)
      })
      it('is an absolute file path without scheme', function () {
        assert.equal(UrlUtil.isNotURL('/file/path/to/file'), false)
      })
      it('is an absolute file path with scheme', function () {
        assert.equal(UrlUtil.isNotURL('file:///file/path/to/file'), false)
      })
      describe('for special pages', function () {
        it('is a data URI', function () {
          assert.equal(UrlUtil.isNotURL('data:text/html,hi'), false)
        })
        it('is a view source URL', function () {
          assert.equal(UrlUtil.isNotURL('view-source://url-here'), false)
        })
        it('is a mailto link', function () {
          assert.equal(UrlUtil.isNotURL('mailto:brian@brave.com'), false)
        })
        it('is an about page', function () {
          assert.equal(UrlUtil.isNotURL('about:preferences'), false)
        })
        it('is a chrome-extension page', function () {
          assert.equal(UrlUtil.isNotURL('chrome-extension://fmfcbgogabcbclcofgocippekhfcmgfj/cast_sender.js'), false)
        })
        it('is a magnet URL', function () {
          assert.equal(UrlUtil.isNotURL('magnet:?xt=urn:sha1:YNCKHTQCWBTRNJIV4WNAE52SJUQCZO5C'), false)
        })
      })
      it('contains a hostname and port number', function () {
        assert.equal(UrlUtil.isNotURL('someBraveServer:8089'), false)
      })
      it('starts or ends with whitespace', function () {
        assert.equal(UrlUtil.isNotURL('  http://brave.com  '), false)
        assert.equal(UrlUtil.isNotURL('\n\nhttp://brave.com\n\n'), false)
        assert.equal(UrlUtil.isNotURL('\t\thttp://brave.com\t\t'), false)
      })
      it('is a URL which contains basic auth user/pass', function () {
        assert.equal(UrlUtil.isNotURL('http://username:password@example.com'), false)
      })
      it('is localhost (case-insensitive)', function () {
        assert.equal(UrlUtil.isNotURL('LoCaLhOsT'), false)
      })
      it('is a hostname (not a domain)', function () {
        assert.equal(UrlUtil.isNotURL('http://computer001/phpMyAdmin'), false)
      })
      it('ends with period (input contains a forward slash and domain)', function () {
        assert.equal(UrlUtil.isNotURL('brave.com/test/cc?_ri_=3vv-8-e.'), false)
      })
      it('is a string with whitespace but has schema', function () {
        assert.equal(UrlUtil.isNotURL('https://wwww.brave.com/test space.jpg'), false)
      })
      it('has custom protocol', function () {
        assert.equal(UrlUtil.isNotURL('brave://test'), false)
      })
    })

    describe('returns true when input:', function () {
      it('is null or undefined', function () {
        assert.equal(UrlUtil.isNotURL(), true)
        assert.equal(UrlUtil.isNotURL(null), true)
      })
      it('is not a string', function () {
        assert.equal(UrlUtil.isNotURL(false), true)
        assert.equal(UrlUtil.isNotURL(333.449), true)
      })
      it('is a quoted string', function () {
        assert.equal(UrlUtil.isNotURL('"search term here"'), true)
      })
      it('is a pure string (no TLD)', function () {
        assert.equal(UrlUtil.isNotURL('brave'), true)
      })
      describe('search query', function () {
        it('starts with ?', function () {
          assert.equal(UrlUtil.isNotURL('?brave'), true)
        })
        it('has a question mark followed by a space', function () {
          assert.equal(UrlUtil.isNotURL('? brave'), true)
        })
        it('starts with .', function () {
          assert.equal(UrlUtil.isNotURL('.brave'), true)
        })
        it('ends with . (input does NOT contain a forward slash)', function () {
          assert.equal(UrlUtil.isNotURL('brave.'), true)
        })
        it('ends with period (input contains only a forward slash)', function () {
          assert.equal(UrlUtil.isNotURL('brave/com/test/cc?_ri_=3vv-8-e.'), true)
        })
      })
      it('is a string with schema but invalid domain name', function () {
        assert.equal(UrlUtil.isNotURL('https://www.bra ve.com/test space.jpg'), true)
      })
      it('contains more than one word', function () {
        assert.equal(UrlUtil.isNotURL('brave is cool'), true)
      })
      it('is not an about page / view source / data URI / mailto / etc', function () {
        assert.equal(UrlUtil.isNotURL('not-a-chrome-extension:'), true)
        assert.equal(UrlUtil.isNotURL('mailtoo:'), true)
      })
      it('is a URL (without protocol) which contains basic auth user/pass', function () {
        assert.equal(UrlUtil.isNotURL('username:password@example.com'), true)
      })
      it('has space in schema', function () {
        assert.equal(UrlUtil.isNotURL('https ://brave.com'), true)
      })
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
    it('returns !isNotURL', function () {
      assert.equal(UrlUtil.isURL('brave.com'), !UrlUtil.isNotURL('brave.com'))
      assert.equal(UrlUtil.isURL('brave is cool'), !UrlUtil.isNotURL('brave is cool'))
      assert.equal(UrlUtil.isURL('mailto:brian@brave.com'), !UrlUtil.isNotURL('mailto:brian@brave.com'))
    })
  })

  describe('isFileType', function () {
    it('relative file', function () {
      assert.equal(UrlUtil.isFileType('/file/abc/test.pdf', 'pdf'), true)
    })
    it('relative path', function () {
      assert.equal(UrlUtil.isFileType('/file/abc/test', 'pdf'), false)
    })
    it('JPG URL', function () {
      assert.equal(UrlUtil.isFileType('http://example.com/test/ABC.JPG?a=b#test', 'jpg'), true)
    })
    it('non-JPG URL', function () {
      assert.equal(UrlUtil.isFileType('http://example.com/test/jpg', 'jpg'), false)
    })
    it('invalid URL', function () {
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

  describe('getDisplayLocation', function () {
    it('gets display location for PDF JS URL', function () {
      assert.equal(UrlUtil.getDisplayLocation('chrome-extension://jdbefljfgobbmcidnmpjamcbhnbphjnb/https://www.blackhat.co…king-Kernel-Address-Space-Layout-Randomization-KASLR-With-Intel-TSX-wp.pdf', true),
        'https://www.blackhat.co…king-Kernel-Address-Space-Layout-Randomization-KASLR-With-Intel-TSX-wp.pdf')
    })
    it('does not modify display location for non-pdf URL', function () {
      assert.equal(UrlUtil.getDisplayLocation('http://example.com', true),
        'http://example.com')
    })
    it('shows blank for about:newtab', function () {
      assert.equal(UrlUtil.getDisplayLocation('about:newtab'), '')
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

  describe('getPunycodeUrl', function () {
    it('returns empty string if input is not a URL', function () {
      assert.equal(UrlUtil.getPunycodeUrl('invalid-url-goes-here'), 'invalid-url-goes-here')
    })
    it('returns the punycode URL when given a valid URL', function () {
      assert.equal(UrlUtil.getPunycodeUrl('http://brave:brave@ebаy.com:1234/brave#brave'), 'http://brave:brave@xn--eby-7cd.com:1234/brave#brave')
    })
  })
})
