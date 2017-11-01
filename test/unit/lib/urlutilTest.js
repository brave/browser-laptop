/* global describe, it */
const urlUtil = require('../../../js/lib/urlutil')
const assert = require('assert')

require('../braveUnit')

describe('urlutil', function () {
  describe('getScheme', function () {
    it('null for empty', function () {
      assert.equal(urlUtil.getScheme('/file/path/to/file'), null)
    })
    it('localhost: for localhost', function () {
      assert.equal(urlUtil.getScheme('localhost://127.0.0.1'), 'localhost:')
    })
    it('gets scheme with :', function () {
      assert.equal(urlUtil.getScheme('data:datauri'), 'data:')
    })
    it('host:port is not recognized as a scheme', function () {
      assert.equal(urlUtil.getScheme('localhost:8089'), null)
    })
    it('gets scheme with ://', function () {
      assert.equal(urlUtil.getScheme('http://www.brave.com'), 'http://')
    })
  })

  describe('prependScheme', function () {
    it('returns null when input is null', function () {
      assert.equal(urlUtil.prependScheme(null), null)
    })
    it('returns undefined when input is undefined', function () {
      assert.equal(urlUtil.prependScheme(), undefined)
    })
    it('prepends file:// to absolute file path', function () {
      assert.equal(urlUtil.prependScheme('/file/path/to/file'), 'file:///file/path/to/file')
    })
    it('defaults to http://', function () {
      assert.equal(urlUtil.prependScheme('www.brave.com'), 'http://www.brave.com')
    })
    it('keeps schema if already exists', function () {
      assert.equal(urlUtil.prependScheme('https://www.brave.com'), 'https://www.brave.com')
    })
  })

  describe('isNotURL', function () {
    describe('returns false when input:', function () {
      it('is a valid URL', function () {
        assert.equal(urlUtil.isNotURL('brave.com'), false)
      })
      it('is an absolute file path without scheme', function () {
        assert.equal(urlUtil.isNotURL('/file/path/to/file'), false)
      })
      it('is an absolute file path with scheme', function () {
        assert.equal(urlUtil.isNotURL('file:///file/path/to/file'), false)
      })
      describe('for special pages', function () {
        it('is a data URI', function () {
          assert.equal(urlUtil.isNotURL('data:text/html,hi'), false)
        })
        it('is a view source URL', function () {
          assert.equal(urlUtil.isNotURL('view-source://url-here'), false)
        })
        it('is a mailto link', function () {
          assert.equal(urlUtil.isNotURL('mailto:brian@brave.com'), false)
        })
        it('is an about page', function () {
          assert.equal(urlUtil.isNotURL('about:preferences'), false)
        })
        it('is a chrome-extension page', function () {
          assert.equal(urlUtil.isNotURL('chrome-extension://fmfcbgogabcbclcofgocippekhfcmgfj/cast_sender.js'), false)
        })
        it('is a magnet URL', function () {
          assert.equal(urlUtil.isNotURL('chrome://gpu'), false)
        })
        it('is a chrome page', function () {
          assert.equal(urlUtil.isNotURL('magnet:?xt=urn:sha1:YNCKHTQCWBTRNJIV4WNAE52SJUQCZO5C'), false)
        })
      })
      it('contains a hostname and port number', function () {
        assert.equal(urlUtil.isNotURL('someBraveServer:8089'), false)
      })
      it('starts or ends with whitespace', function () {
        assert.equal(urlUtil.isNotURL('  http://brave.com  '), false)
        assert.equal(urlUtil.isNotURL('\n\nhttp://brave.com\n\n'), false)
        assert.equal(urlUtil.isNotURL('\t\thttp://brave.com\t\t'), false)
      })
      it('is a URL which contains basic auth user/pass', function () {
        assert.equal(urlUtil.isNotURL('http://username:password@example.com'), false)
      })
      it('is localhost (case-insensitive)', function () {
        assert.equal(urlUtil.isNotURL('LoCaLhOsT'), false)
      })
      it('is a hostname (not a domain)', function () {
        assert.equal(urlUtil.isNotURL('http://computer001/phpMyAdmin'), false)
      })
      it('ends with period (input contains a forward slash and domain)', function () {
        assert.equal(urlUtil.isNotURL('brave.com/test/cc?_ri_=3vv-8-e.'), false)
      })
      it('is a string with whitespace but has schema', function () {
        assert.equal(urlUtil.isNotURL('https://wwww.brave.com/test space.jpg'), false)
      })
      it('has custom protocol', function () {
        assert.equal(urlUtil.isNotURL('brave://test'), false)
      })
    })

    describe('returns true when input:', function () {
      it('is null or undefined', function () {
        assert.equal(urlUtil.isNotURL(), true)
        assert.equal(urlUtil.isNotURL(null), true)
      })
      it('is not a string', function () {
        assert.equal(urlUtil.isNotURL(false), true)
        assert.equal(urlUtil.isNotURL(333.449), true)
      })
      it('is a quoted string', function () {
        assert.equal(urlUtil.isNotURL('"search term here"'), true)
      })
      it('is a pure string (no TLD)', function () {
        assert.equal(urlUtil.isNotURL('brave'), true)
      })
      describe('search query', function () {
        it('starts with ?', function () {
          assert.equal(urlUtil.isNotURL('?brave'), true)
        })
        it('has a question mark followed by a space', function () {
          assert.equal(urlUtil.isNotURL('? brave'), true)
        })
        it('starts with .', function () {
          assert.equal(urlUtil.isNotURL('.brave'), true)
        })
        it('ends with . (input does NOT contain a forward slash)', function () {
          assert.equal(urlUtil.isNotURL('brave.'), true)
        })
        it('ends with period (input contains only a forward slash)', function () {
          assert.equal(urlUtil.isNotURL('brave/com/test/cc?_ri_=3vv-8-e.'), true)
        })
      })
      it('is a string with schema but invalid domain name', function () {
        assert.equal(urlUtil.isNotURL('https://www.bra ve.com/test space.jpg'), true)
      })
      it('contains more than one word', function () {
        assert.equal(urlUtil.isNotURL('brave is cool'), true)
      })
      it('is not an about page / view source / data URI / mailto / etc', function () {
        assert.equal(urlUtil.isNotURL('not-a-chrome-extension:'), true)
        assert.equal(urlUtil.isNotURL('mailtoo:'), true)
      })
      it('is a URL (without protocol) which contains basic auth user/pass', function () {
        assert.equal(urlUtil.isNotURL('username:password@example.com'), true)
      })
      it('has space in schema', function () {
        assert.equal(urlUtil.isNotURL('https ://brave.com'), true)
      })
    })
  })

  describe('getUrlFromInput', function () {
    it('returns empty string when input is null', function () {
      assert.equal(urlUtil.getUrlFromInput(null), '')
    })
    it('returns empty string when input is undefined', function () {
      assert.equal(urlUtil.getUrlFromInput(), '')
    })
    it('calls prependScheme', function () {
      assert.equal(urlUtil.getUrlFromInput('/file/path/to/file'), 'file:///file/path/to/file')
    })
  })

  describe('isURL', function () {
    it('returns !isNotURL', function () {
      assert.equal(urlUtil.isURL('brave.com'), !urlUtil.isNotURL('brave.com'))
      assert.equal(urlUtil.isURL('brave is cool'), !urlUtil.isNotURL('brave is cool'))
      assert.equal(urlUtil.isURL('mailto:brian@brave.com'), !urlUtil.isNotURL('mailto:brian@brave.com'))
    })
  })

  describe('isFileType', function () {
    it('relative file', function () {
      assert.equal(urlUtil.isFileType('/file/abc/test.pdf', 'pdf'), true)
    })
    it('relative path', function () {
      assert.equal(urlUtil.isFileType('/file/abc/test', 'pdf'), false)
    })
    it('JPG URL', function () {
      assert.equal(urlUtil.isFileType('http://example.com/test/ABC.JPG?a=b#test', 'jpg'), true)
    })
    it('non-JPG URL', function () {
      assert.equal(urlUtil.isFileType('http://example.com/test/jpg', 'jpg'), false)
    })
    it('invalid URL', function () {
      assert.equal(urlUtil.isFileType('foo', 'jpg'), false)
    })
  })

  describe('toPDFJSLocation', function () {
    const baseUrl = 'chrome-extension://jdbefljfgobbmcidnmpjamcbhnbphjnb/'
    it('pdf', function () {
      assert.equal(urlUtil.toPDFJSLocation('http://abc.com/test.pdf'), baseUrl + 'http://abc.com/test.pdf')
    })
    it('non-pdf', function () {
      assert.equal(urlUtil.toPDFJSLocation('http://abc.com/test.pdf.txt'), 'http://abc.com/test.pdf.txt')
    })
    it('file url', function () {
      assert.equal(urlUtil.toPDFJSLocation('file://abc.com/test.pdf.txt'), 'file://abc.com/test.pdf.txt')
    })
    it('empty', function () {
      assert.equal(urlUtil.toPDFJSLocation(''), '')
    })
  })

  describe('getHostname', function () {
    it('returns undefined if the URL is invalid', function () {
      assert.equal(urlUtil.getHostname(null), undefined)
    })
    it('returns the host field (including port number)', function () {
      assert.equal(urlUtil.getHostname('https://brave.com:8080/test/'), 'brave.com:8080')
    })
    it('allows you to exclude the port number', function () {
      assert.equal(urlUtil.getHostname('https://brave.com:8080/test/', true), 'brave.com')
    })
  })

  describe('getHostnamePatterns', function () {
    it('gets bare domain hostname patterns', function () {
      // XXX: *.com probably should be excluded
      assert.deepEqual(urlUtil.getHostnamePatterns('http://brave.com'),
                       ['brave.com', '*.com', 'brave.*'])
    })
    it('gets subdomain hostname patterns', function () {
      assert.deepEqual(urlUtil.getHostnamePatterns('https://bar.brave.com'),
        ['bar.brave.com',
          '*.brave.com',
          'bar.*.com',
          'bar.brave.*'])
      assert.deepEqual(urlUtil.getHostnamePatterns('https://foo.bar.brave.com'),
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
      assert.equal(urlUtil.getLocationIfPDF('chrome-extension://jdbefljfgobbmcidnmpjamcbhnbphjnb/https://www.blackhat.co…king-Kernel-Address-Space-Layout-Randomization-KASLR-With-Intel-TSX-wp.pdf'),
        'https://www.blackhat.co…king-Kernel-Address-Space-Layout-Randomization-KASLR-With-Intel-TSX-wp.pdf')
    })
    it('gets location for PDF JS viewer URL', function () {
      assert.equal(urlUtil.getLocationIfPDF('chrome-extension://jdbefljfgobbmcidnmpjamcbhnbphjnb/content/web/viewer.html?file=http%3A%2F%2Funec.edu.az%2Fapplication%2Fuploads%2F2014%2F12%2Fpdf-sample.pdf'),
        'http://unec.edu.az/application/uploads/2014/12/pdf-sample.pdf')
    })
    it('does not remove wayback machine url location for PDF JS URL', function () {
      assert.equal(urlUtil.getLocationIfPDF('chrome-extension://jdbefljfgobbmcidnmpjamcbhnbphjnb/https://web.archive.org/web/20160106152308/http://stlab.adobe.com/wiki/images/d/d3/Test.pdf'),
        'https://web.archive.org/web/20160106152308/http://stlab.adobe.com/wiki/images/d/d3/Test.pdf')
    })
    it('does not modify location for non-pdf URL', function () {
      assert.equal(urlUtil.getLocationIfPDF('https://www.blackhat.co…king-Kernel-Address-Space-Layout-Randomization-KASLR-With-Intel-TSX-wp.pdf'),
        'https://www.blackhat.co…king-Kernel-Address-Space-Layout-Randomization-KASLR-With-Intel-TSX-wp.pdf')
      assert.equal(urlUtil.getLocationIfPDF('chrome-extension://blank'), 'chrome-extension://blank')
      assert.equal(urlUtil.getLocationIfPDF(null), null)
    })
    it('gets location for file: PDF URL', function () {
      let url = 'chrome-extension://jdbefljfgobbmcidnmpjamcbhnbphjnb/file:///Users/yan/Downloads/test.pdf'
      assert.equal(urlUtil.getLocationIfPDF(url), 'file:///Users/yan/Downloads/test.pdf')
    })
  })

  describe('getDefaultFaviconUrl', function () {
    it('returns empty string if input is not a URL', function () {
      assert.equal(urlUtil.getDefaultFaviconUrl('invalid-url-goes-here'), '')
    })
    it('returns the default favicon URL when given a valid URL', function () {
      assert.equal(urlUtil.getDefaultFaviconUrl('https://brave.com'), 'https://brave.com/favicon.ico')
    })
    it('includes the port in the response when given a valid URL with a port number', function () {
      assert.equal(urlUtil.getDefaultFaviconUrl('https://brave.com:8080'), 'https://brave.com:8080/favicon.ico')
    })
  })

  describe('getPunycodeUrl', function () {
    it('returns original string if input is ASCII', function () {
      assert.equal(urlUtil.getPunycodeUrl('invalid-url-goes-here'), 'invalid-url-goes-here')
    })
    it('returns punycode ASCII string if input is non-ASCII', function () {
      assert.equal(urlUtil.getPunycodeUrl('ebаy.com'), 'xn--eby-7cd.com')
    })
    it('returns the punycode URL when given a valid URL', function () {
      assert.equal(urlUtil.getPunycodeUrl('http://brave:brave@ebаy.com:1234/brave#brave'), 'http://brave:brave@xn--eby-7cd.com:1234/brave#brave')
    })
  })

  describe('isPotentialPhishingUrl', function () {
    it('returns false if input is not a URL', function () {
      assert.equal(urlUtil.isPotentialPhishingUrl(null), false)
    })
    it('returns false if input is a regular URL', function () {
      assert.equal(urlUtil.isPotentialPhishingUrl(' https://google.com'), false)
    })
    it('returns true if input is a data URL', function () {
      assert.equal(urlUtil.isPotentialPhishingUrl('data:text/html,<script>alert("no crash")</script>'), true)
    })
    it('returns true if input is a blob URL', function () {
      assert.equal(urlUtil.isPotentialPhishingUrl('   BLOB:foo '), true)
    })
  })

  describe('isFileScheme', function () {
    describe('returns true when input:', function () {
      it('is an absolute file path with scheme', function () {
        assert.equal(urlUtil.isFileScheme('file:///file/path/to/file'), true)
      })
    })
    describe('returns false when input:', function () {
      it('is an absolute file path without scheme', function () {
        assert.equal(urlUtil.isFileScheme('/file/path/to/file'), false)
      })
      it('is a URL', function () {
        assert.equal(urlUtil.isFileScheme('http://brave.com'), false)
      })
      it('has custom protocol', function () {
        assert.equal(urlUtil.isFileScheme('brave://test'), false)
      })
    })
  })

  describe('getDisplayHost', function () {
    it('url is http', function () {
      const result = urlUtil.getDisplayHost('http://brave.com')
      assert.equal(result, 'brave.com')
    })

    it('url is https', function () {
      const result = urlUtil.getDisplayHost('https://brave.com')
      assert.equal(result, 'brave.com')
    })

    it('url is file', function () {
      const result = urlUtil.getDisplayHost('file://brave.text')
      assert.equal(result, 'file://brave.text')
    })
  })

  describe('getOrigin', function () {
    it('returns file:/// for any file url', function () {
      assert.strictEqual(urlUtil.getOrigin('file://'), 'file:///')
      assert.strictEqual(urlUtil.getOrigin('file:///'), 'file:///')
      assert.strictEqual(urlUtil.getOrigin('file:///some'), 'file:///')
      assert.strictEqual(urlUtil.getOrigin('file:///some/'), 'file:///')
      assert.strictEqual(urlUtil.getOrigin('file:///some/path'), 'file:///')
    })
    it('gets URL origin for simple url', function () {
      assert.strictEqual(urlUtil.getOrigin('https://abc.bing.com'), 'https://abc.bing.com')
    })
    it('gets URL origin for url with port', function () {
      assert.strictEqual(urlUtil.getOrigin('https://bing.com:443/?test=1#abc'), 'https://bing.com:443')
    })
    it('gets URL origin for IP host', function () {
      assert.strictEqual(urlUtil.getOrigin('http://127.0.0.1:443/?test=1#abc'), 'http://127.0.0.1:443')
    })
    it('gets URL origin for slashless protocol URL', function () {
      assert.strictEqual(urlUtil.getOrigin('about:test/foo'), 'about:test')
    })
    it('returns null for invalid URL', function () {
      assert.strictEqual(urlUtil.getOrigin('abc'), null)
    })
    it('returns null for empty URL', function () {
      assert.strictEqual(urlUtil.getOrigin(''), null)
    })
    it('returns null for null URL', function () {
      assert.strictEqual(urlUtil.getOrigin(null), null)
    })
    it('returns correct result for URL with hostname that is a scheme', function () {
      assert.strictEqual(urlUtil.getOrigin('http://http/test'), 'http://http')
    })
  })

  describe('stripLocation', function () {
    it('null scenario', function () {
      const result = urlUtil.stripLocation(null)
      assert.equal(result, '')
    })

    it('empty string', function () {
      const result = urlUtil.stripLocation('')
      assert.equal(result, '')
    })

    it('normal url without # or /', function () {
      const result = urlUtil.stripLocation('https://brave.com')
      assert.equal(result, 'https://brave.com')
    })

    it('normal url with # but not at the end', function () {
      const result = urlUtil.stripLocation('https://brave.com#title')
      assert.equal(result, 'https://brave.com#title')
    })

    it('normal url with # at the end', function () {
      const result = urlUtil.stripLocation('https://brave.com#')
      assert.equal(result, 'https://brave.com')
    })

    it('normal url with / at the end', function () {
      const result = urlUtil.stripLocation('https://brave.com/')
      assert.equal(result, 'https://brave.com')
    })

    it('normal url with /# at the end', function () {
      const result = urlUtil.stripLocation('https://brave.com/#')
      assert.equal(result, 'https://brave.com')
    })

    it('normal url with white space at the end', function () {
      const result = urlUtil.stripLocation('https://brave.com   ')
      assert.equal(result, 'https://brave.com')
    })
  })

  describe('parseFaviconDataUrl', function () {
    it('null scenario', function () {
      const result = urlUtil.parseFaviconDataUrl(null)
      assert.equal(result, null)
    })
    it('empty string', function () {
      const result = urlUtil.parseFaviconDataUrl('')
      assert.equal(result, null)
    })
    it('regular URL', function () {
      const result = urlUtil.parseFaviconDataUrl('http://example.com')
      assert.equal(result, null)
    })
    it('non-image data URL', function () {
      const result = urlUtil.parseFaviconDataUrl('data:text/plain;charset=UTF-8;page=21,the%20data:1234,5678')
      assert.equal(result, null)
    })
    it('non-base64 data URL', function () {
      const result = urlUtil.parseFaviconDataUrl('data:image/jpg,foo')
      assert.equal(result, null)
    })
    it('no-extension data URL', function () {
      const result = urlUtil.parseFaviconDataUrl('data:image/;base64,foo')
      assert.equal(result, null)
    })
    it('valid jpg', function () {
      const jpg = 'data:image/jpeg;base64,' +
        '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDADIiJSwlHzIsKSw4NTI7S31RS0VFS5ltc1p9tZ++u7Kf' +
        'r6zI4f/zyNT/16yv+v/9////////wfD/////////////2wBDATU4OEtCS5NRUZP/zq/O////////' +
        '////////////////////////////////////////////////////////////wAARCAAYAEADAREA' +
        '//AhEBAxEB/8QAGQAAAgMBAAAAAAAAAAAAAAAAAQMAAgQF/8QAJRABAAIBBAEEAgMAAAAAAAAAAQIR' +
        '//AAMSITEEEyJBgTORUWFx/8QAFAEBAAAAAAAAAAAAAAAAAAAAAP/EABQRAQAAAAAAAAAAAAAAAAAA' +
        '//AAD/2gAMAwEAAhEDEQA/AOgM52xQDrjvAV5Xv0vfKUALlTQfeBm0HThMNHXkL0Lw/swN5qgA8yT4' +
        '//MCS1OEOJV8mBz9Z05yfW8iSx7p4j+jA1aD6Wj7ZMzstsfvAas4UyRHvjrAkC9KhpLMClQntlqFc2' +
        '//X1gUj4viwVObKrddH9YDoHvuujAEuNV+bLwFS8XxdSr+Cq3Vf+4F5RgQl6ZR2p1eAzU/HX80YBYy' +
        '//JLCuexwJCO2O1bwCRidAfWBSctswbI12GAJT3yiwFR7+MBjGK2g/WAJR3FdF84E2rK5VR0YH/9k='
      const expected = '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDADIiJSwlHzIsKSw4NTI7S31RS0VFS5ltc1p9tZ++u7Kf' +
        'r6zI4f/zyNT/16yv+v/9////////wfD/////////////2wBDATU4OEtCS5NRUZP/zq/O////////' +
        '////////////////////////////////////////////////////////////wAARCAAYAEADAREA' +
        '//AhEBAxEB/8QAGQAAAgMBAAAAAAAAAAAAAAAAAQMAAgQF/8QAJRABAAIBBAEEAgMAAAAAAAAAAQIR' +
        '//AAMSITEEEyJBgTORUWFx/8QAFAEBAAAAAAAAAAAAAAAAAAAAAP/EABQRAQAAAAAAAAAAAAAAAAAA' +
        '//AAD/2gAMAwEAAhEDEQA/AOgM52xQDrjvAV5Xv0vfKUALlTQfeBm0HThMNHXkL0Lw/swN5qgA8yT4' +
        '//MCS1OEOJV8mBz9Z05yfW8iSx7p4j+jA1aD6Wj7ZMzstsfvAas4UyRHvjrAkC9KhpLMClQntlqFc2' +
        '//X1gUj4viwVObKrddH9YDoHvuujAEuNV+bLwFS8XxdSr+Cq3Vf+4F5RgQl6ZR2p1eAzU/HX80YBYy' +
        '//JLCuexwJCO2O1bwCRidAfWBSctswbI12GAJT3yiwFR7+MBjGK2g/WAJR3FdF84E2rK5VR0YH/9k='
      const result = urlUtil.parseFaviconDataUrl(jpg)
      assert.deepEqual(result, {data: expected, ext: 'jpeg'})
    })
    it('valid png', function () {
      const png = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU//5ErkJggg=='
      const result = urlUtil.parseFaviconDataUrl(png)
      assert.deepEqual(result, {data: 'iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU//5ErkJggg==', ext: 'png'})
    })
  })
})
