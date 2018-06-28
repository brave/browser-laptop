// lazy load requires for dual use in and outside muon
const urlUtil = () => require('../../../js/lib/urlutil')

module.exports = {
  'getScheme': {
    'null for empty': (test) => {
      test.equal(urlUtil().getScheme('/file/path/to/file'), null)
    },
    'localhost: for localhost': (test) => {
      test.equal(urlUtil().getScheme('localhost://127.0.0.1'), 'localhost:')
    },
    'gets scheme with :': (test) => {
      test.equal(urlUtil().getScheme('data:datauri'), 'data:')
    },
    'host:port is not recognized as a scheme': (test) => {
      test.equal(urlUtil().getScheme('localhost:8089'), null)
    },
    'gets scheme with ://': (test) => {
      test.equal(urlUtil().getScheme('http://www.brave.com'), 'http://')
    }
  },

  'prependScheme': {
    'returns null when input is null': (test) => {
      test.equal(urlUtil().prependScheme(null), null)
    },
    'returns undefined when input is undefined': (test) => {
      test.equal(urlUtil().prependScheme(), undefined)
    },
    'prepends file:// to absolute file path': (test) => {
      test.equal(urlUtil().prependScheme('/file/path/to/file'), 'file:///file/path/to/file')
    },
    'defaults to http://': (test) => {
      test.equal(urlUtil().prependScheme('www.brave.com'), 'http://www.brave.com')
    },
    'keeps schema if already exists': (test) => {
      test.equal(urlUtil().prependScheme('https://www.brave.com'), 'https://www.brave.com')
    }
  },

  'isNotURL': {
    'returns false when input:': {
      'is a valid URL': (test) => {
        test.equal(urlUtil().isNotURL('brave.com'), false)
      },
      'is an absolute file path without scheme': (test) => {
        test.equal(urlUtil().isNotURL('/file/path/to/file'), false)
      },
      'is an absolute file path without scheme with space in name': (test) => {
        test.equal(urlUtil().isNotURL('/path/to/file/with space'), false)
      },
      'is an absolute file path with scheme': (test) => {
        test.equal(urlUtil().isNotURL('file:///file/path/to/file'), false)
      },
      'for special pages': {
        'is a data URI': (test) => {
          test.equal(urlUtil().isNotURL('data:text/html,hi'), false)
        },
        'is a view source URL': (test) => {
          test.equal(urlUtil().isNotURL('view-source://url-here'), false)
        },
        'is a mailto link': (test) => {
          test.equal(urlUtil().isNotURL('mailto:brian@brave.com'), false)
        },
        'is an about page': (test) => {
          test.equal(urlUtil().isNotURL('about:preferences'), false)
        },
        'is a chrome-extension page': (test) => {
          test.equal(urlUtil().isNotURL('chrome-extension://fmfcbgogabcbclcofgocippekhfcmgfj/cast_sender.js'), false)
        },
        'is a magnet URL': (test) => {
          test.equal(urlUtil().isNotURL('chrome://gpu'), false)
        },
        'is a chrome page': (test) => {
          test.equal(urlUtil().isNotURL('magnet:?xt=urn:sha1:YNCKHTQCWBTRNJIV4WNAE52SJUQCZO5C'), false)
        }
      },
      'contains a hostname and port number': (test) => {
        test.equal(urlUtil().isNotURL('someBraveServer:8089'), false)
      },
      'starts or ends with whitespace': (test) => {
        test.equal(urlUtil().isNotURL('  http://brave.com  '), false)
        test.equal(urlUtil().isNotURL('\n\nhttp://brave.com\n\n'), false)
        test.equal(urlUtil().isNotURL('\t\thttp://brave.com\t\t'), false)
      },
      'is a URL which contains basic auth user/pass': (test) => {
        test.equal(urlUtil().isNotURL('http://username:password@example.com'), false)
      },
      'is localhost (case-insensitive)': (test) => {
        test.equal(urlUtil().isNotURL('LoCaLhOsT'), false)
      },
      'is a hostname (not a domain)': (test) => {
        test.equal(urlUtil().isNotURL('http://computer001/phpMyAdmin'), false)
      },
      'ends with period (input contains a forward slash and domain)': (test) => {
        test.equal(urlUtil().isNotURL('brave.com/test/cc?_ri_=3vv-8-e.'), false)
      },
      'is a string with whitespace but has schema': (test) => {
        test.equal(urlUtil().isNotURL('https://wwww.brave.com/test space.jpg'), false)
      },
      'has custom protocol': (test) => {
        test.equal(urlUtil().isNotURL('brave://test'), false)
      },
      'returns url with encoded space character in the query string': (test) => {
        test.equal(urlUtil().isNotURL('https://www.google.ca/search?q=dog cat'), false)
      },
      'is a Windows file path without scheme': (test) => {
        test.equal(urlUtil().isNotURL('C:\\Path\to\\file'), false)
      },
      'is a Windows file path without scheme with space in file name': (test) => {
        test.equal(urlUtil().isNotURL('C:\\Path\\with\\some space'), false)
      }
    },

    'returns true when input:': {
      'is null or undefined': (test) => {
        test.equal(urlUtil().isNotURL(), true)
        test.equal(urlUtil().isNotURL(null), true)
      },
      'is not a string': (test) => {
        test.equal(urlUtil().isNotURL(false), true)
        test.equal(urlUtil().isNotURL(333.449), true)
      },
      'is a quoted string': (test) => {
        test.equal(urlUtil().isNotURL('"search term here"'), true)
      },
      'is a pure string (no TLD)': (test) => {
        test.equal(urlUtil().isNotURL('brave'), true)
      },
      'search query': {
        'starts with question mark': (test) => {
          test.equal(urlUtil().isNotURL('?brave'), true)
        },
        'has a question mark followed by a space': (test) => {
          test.equal(urlUtil().isNotURL('? brave'), true)
        },
        'is a pure query string without domain name': (test) => {
          test.equal(urlUtil().isNotURL('?query=hello'), true)
        },
        'starts with period': (test) => {
          test.equal(urlUtil().isNotURL('.brave'), true)
        },
        'ends with period (input does NOT contain a forward slash)': (test) => {
          test.equal(urlUtil().isNotURL('brave.'), true)
        },
        'ends with period (input contains only a forward slash)': (test) => {
          test.equal(urlUtil().isNotURL('brave/com/test/cc?_ri_=3vv-8-e.'), true)
        }
      },
      'is a string with schema but invalid domain name': (test) => {
        test.equal(urlUtil().isNotURL('https://www.bra ve.com/test space.jpg'), true)
      },
      'contains more than one word': (test) => {
        test.equal(urlUtil().isNotURL('brave is cool'), true)
      },
      'is not an about page / view source / data URI / mailto / etc': (test) => {
        test.equal(urlUtil().isNotURL('not-a-chrome-extension:'), true)
        test.equal(urlUtil().isNotURL('mailtoo:'), true)
      },
      'is a URL (without protocol) which contains basic auth user/pass': (test) => {
        test.equal(urlUtil().isNotURL('username:password@example.com'), true)
      },
      'has space in schema': (test) => {
        test.equal(urlUtil().isNotURL('https ://brave.com'), true)
      }
    }
  },

  'getUrlFromInput': {
    'returns empty string when input is null': (test) => {
      test.equal(urlUtil().getUrlFromInput(null), '')
    },
    'returns empty string when input is undefined': (test) => {
      test.equal(urlUtil().getUrlFromInput(), '')
    },
    'calls prependScheme': (test) => {
      test.equal(urlUtil().getUrlFromInput('/file/path/to/file'), 'file:///file/path/to/file')
    },
    'returns URL with file schema for Windows': (test) => {
      test.equal(urlUtil().getUrlFromInput('C:\\path\\to\\file'), 'file:///C:/path/to/file')
    },
    'returns url with file schema for Windows with space character encoded': (test) => {
      test.equal(urlUtil().getUrlFromInput('C:\\path\\to\\file name'), 'file:///C:/path/to/file%20name')
    }
  },

  'isURL': {
    'returns !isNotURL': (test) => {
      test.equal(urlUtil().isURL('brave.com'), !urlUtil().isNotURL('brave.com'))
      test.equal(urlUtil().isURL('brave is cool'), !urlUtil().isNotURL('brave is cool'))
      test.equal(urlUtil().isURL('mailto:brian@brave.com'), !urlUtil().isNotURL('mailto:brian@brave.com'))
    }
  },

  'isFileType': {
    'relative file': (test) => {
      test.equal(urlUtil().isFileType('file:///file/abc/test.pdf', 'pdf'), true)
    },
    'relative path': (test) => {
      test.equal(urlUtil().isFileType('file:///file/abc/test', 'pdf'), false)
    },
    'JPG URL': (test) => {
      test.equal(urlUtil().isFileType('http://example.com/test/ABC.JPG?a=b#test', 'jpg'), true)
    },
    'non-JPG URL': (test) => {
      test.equal(urlUtil().isFileType('http://example.com/test/jpg', 'jpg'), false)
    },
    'invalid URL': (test) => {
      test.equal(urlUtil().isFileType('foo', 'jpg'), false)
    }
  },

  'toPDFJSLocation': {
    'pdf': (test) => {
      const baseUrl = 'chrome-extension://jdbefljfgobbmcidnmpjamcbhnbphjnb/'
      test.equal(urlUtil().toPDFJSLocation('http://abc.com/test.pdf'), baseUrl + 'content/web/viewer.html?file=http%3A%2F%2Fabc.com%2Ftest.pdf')
    },
    'non-pdf': (test) => {
      test.equal(urlUtil().toPDFJSLocation('http://abc.com/test.pdf.txt'), 'http://abc.com/test.pdf.txt')
    },
    'file url': (test) => {
      test.equal(urlUtil().toPDFJSLocation('file://abc.com/test.pdf.txt'), 'file://abc.com/test.pdf.txt')
    },
    'empty': (test) => {
      test.equal(urlUtil().toPDFJSLocation(''), '')
    }
  },

  'getPDFViewerUrl': {
    'regular url': (test) => {
      const baseUrl = 'chrome-extension://jdbefljfgobbmcidnmpjamcbhnbphjnb/content/web/viewer.html?file='
      test.equal(urlUtil().getPDFViewerUrl('http://example.com'), baseUrl + 'http%3A%2F%2Fexample.com')
    },
    'file url': (test) => {
      const baseUrl = 'chrome-extension://jdbefljfgobbmcidnmpjamcbhnbphjnb/content/web/viewer.html?file='
      test.equal(urlUtil().getPDFViewerUrl('file:///Users/yan/some files/test.pdf'), baseUrl + 'file%3A%2F%2F%2FUsers%2Fyan%2Fsome%20files%2Ftest.pdf')
    }
  },

  'getHostname': {
    'returns undefined if the URL is invalid': (test) => {
      test.equal(urlUtil().getHostname(null), undefined)
    },
    'returns the host field (including port number)': (test) => {
      test.equal(urlUtil().getHostname('https://brave.com:8080/test/'), 'brave.com:8080')
    },
    'allows you to exclude the port number': (test) => {
      test.equal(urlUtil().getHostname('https://brave.com:8080/test/', true), 'brave.com')
    }
  },

  'getHostnamePatterns': {
    'gets bare domain hostname patterns': (test) => {
      // XXX: *.com probably should be excluded
      test.deepEqual(urlUtil().getHostnamePatterns('http://brave.com'),
                        ['brave.com', '*.com', 'brave.*'])
    },
    'gets subdomain hostname patterns': (test) => {
      test.deepEqual(urlUtil().getHostnamePatterns('https://bar.brave.com'),
        ['bar.brave.com',
          '*.brave.com',
          'bar.*.com',
          'bar.brave.*'])
      test.deepEqual(urlUtil().getHostnamePatterns('https://foo.bar.brave.com'),
        ['foo.bar.brave.com',
          '*.bar.brave.com',
          'foo.*.brave.com',
          'foo.bar.*.com',
          'foo.bar.brave.*',
          '*.brave.com'])
    }
  },

  'getLocationIfPDF': {
    'gets location for PDF JS URL': (test) => {
      test.equal(urlUtil().getLocationIfPDF('chrome-extension://jdbefljfgobbmcidnmpjamcbhnbphjnb/https://www.blackhat.co…king-Kernel-Address-Space-Layout-Randomization-KASLR-With-Intel-TSX-wp.pdf'),
        'https://www.blackhat.co…king-Kernel-Address-Space-Layout-Randomization-KASLR-With-Intel-TSX-wp.pdf')
    },
    'gets location for PDF JS viewer URL': (test) => {
      test.equal(urlUtil().getLocationIfPDF('chrome-extension://jdbefljfgobbmcidnmpjamcbhnbphjnb/content/web/viewer.html?file=http%3A%2F%2Funec.edu.az%2Fapplication%2Fuploads%2F2014%2F12%2Fpdf-sample.pdf'),
        'http://unec.edu.az/application/uploads/2014/12/pdf-sample.pdf')
    },
    'does not remove wayback machine url location for PDF JS URL': (test) => {
      test.equal(urlUtil().getLocationIfPDF('chrome-extension://jdbefljfgobbmcidnmpjamcbhnbphjnb/https://web.archive.org/web/20160106152308/http://stlab.adobe.com/wiki/images/d/d3/Test.pdf'),
        'https://web.archive.org/web/20160106152308/http://stlab.adobe.com/wiki/images/d/d3/Test.pdf')
    },
    'does not modify location for non-pdf URL': (test) => {
      test.equal(urlUtil().getLocationIfPDF('https://www.blackhat.co…king-Kernel-Address-Space-Layout-Randomization-KASLR-With-Intel-TSX-wp.pdf'),
        'https://www.blackhat.co…king-Kernel-Address-Space-Layout-Randomization-KASLR-With-Intel-TSX-wp.pdf')
      test.equal(urlUtil().getLocationIfPDF('chrome-extension://blank'), 'chrome-extension://blank')
      test.equal(urlUtil().getLocationIfPDF(null), null)
    },
    'gets location for file: PDF URL': (test) => {
      let url = 'chrome-extension://jdbefljfgobbmcidnmpjamcbhnbphjnb/file:///Users/yan/Downloads/test.pdf'
      test.equal(urlUtil().getLocationIfPDF(url), 'file:///Users/yan/Downloads/test.pdf')
    }
  },

  'getDefaultFaviconUrl': {
    'returns empty string if input is not a URL': (test) => {
      test.equal(urlUtil().getDefaultFaviconUrl('invalid-url-goes-here'), '')
    },
    'returns the default favicon URL when given a valid URL': (test) => {
      test.equal(urlUtil().getDefaultFaviconUrl('https://brave.com'), 'https://brave.com/favicon.ico')
    },
    'includes the port in the response when given a valid URL with a port number': (test) => {
      test.equal(urlUtil().getDefaultFaviconUrl('https://brave.com:8080'), 'https://brave.com:8080/favicon.ico')
    }
  },

  'getPunycodeUrl': {
    'returns original string if input is ASCII': (test) => {
      test.equal(urlUtil().getPunycodeUrl('invalid-url-goes-here'), 'invalid-url-goes-here')
    },
    'returns punycode ASCII string if input is non-ASCII': (test) => {
      test.equal(urlUtil().getPunycodeUrl('ebаy.com'), 'xn--eby-7cd.com')
    },
    'returns the punycode URL when given a valid URL': (test) => {
      test.equal(urlUtil().getPunycodeUrl('http://brave:brave@ebаy.com:1234/brave#brave'), 'http://brave:brave@xn--eby-7cd.com:1234/brave#brave')
    },
    'returns the punycode URL when given a URL contains @': (test) => {
      test.equal(urlUtil().getPunycodeUrl('ebаy.com/@ebаy.com'), 'xn--eby-7cd.com/@xn--eby-7cd.com')
    }
  },

  'isPotentialPhishingUrl': {
    'returns false if input is not a URL': (test) => {
      test.equal(urlUtil().isPotentialPhishingUrl(null), false)
    },
    'returns false if input is a regular URL': (test) => {
      test.equal(urlUtil().isPotentialPhishingUrl(' https://google.com'), false)
    },
    'returns true if input is a data URL': (test) => {
      test.equal(urlUtil().isPotentialPhishingUrl('data:text/html,<script>alert("no crash")</script>'), true)
    },
    'returns true if input is a blob URL': (test) => {
      test.equal(urlUtil().isPotentialPhishingUrl('   BLOB:foo '), true)
    }
  },

  'isFileScheme': {
    'returns true when input:': {
      'is an absolute file path with scheme': (test) => {
        test.equal(urlUtil().isFileScheme('file:///file/path/to/file'), true)
      }
    },
    'returns false when input:': {
      'is an absolute file path without scheme': (test) => {
        test.equal(urlUtil().isFileScheme('/file/path/to/file'), false)
      },
      'is a URL': (test) => {
        test.equal(urlUtil().isFileScheme('http://brave.com'), false)
      },
      'has custom protocol': (test) => {
        test.equal(urlUtil().isFileScheme('brave://test'), false)
      }
    }
  },

  'getDisplayHost': {
    'url is http': (test) => {
      const result = urlUtil().getDisplayHost('http://brave.com')
      test.equal(result, 'brave.com')
    },

    'url is https': (test) => {
      const result = urlUtil().getDisplayHost('https://brave.com')
      test.equal(result, 'brave.com')
    },

    'url is file': (test) => {
      const result = urlUtil().getDisplayHost('file://brave.text')
      test.equal(result, 'file://brave.text')
    }
  },

  'getOrigin': {
    'returns file:/// for any file url': (test) => {
      test.strictEqual(urlUtil().getOrigin('file://'), 'file:///')
      test.strictEqual(urlUtil().getOrigin('file:///'), 'file:///')
      test.strictEqual(urlUtil().getOrigin('file:///some'), 'file:///')
      test.strictEqual(urlUtil().getOrigin('file:///some/'), 'file:///')
      test.strictEqual(urlUtil().getOrigin('file:///some/path'), 'file:///')
    },
    'gets URL origin for simple url': (test) => {
      test.strictEqual(urlUtil().getOrigin('https://abc.bing.com'), 'https://abc.bing.com')
    },
    'gets URL origin for url with port': (test) => {
      test.strictEqual(urlUtil().getOrigin('https://bing.com:8000/?test=1#abc'), 'https://bing.com:8000')
    },
    'gets URL origin for IP host': (test) => {
      test.strictEqual(urlUtil().getOrigin('http://127.0.0.1:443/?test=1#abc'), 'http://127.0.0.1:443')
    },
    'gets URL origin for about:': (test) => {
      test.strictEqual(urlUtil().getOrigin('about:preferences#abc'), 'about:preferences')
    },
    'gets URL origin for slashless protocol URL': (test) => {
      test.strictEqual(urlUtil().getOrigin('about:test'), 'about:test')
      test.strictEqual(urlUtil().getOrigin('about:test/'), 'about:test')
      test.strictEqual(urlUtil().getOrigin('about:test/foo'), 'about:test')
      test.strictEqual(urlUtil().getOrigin('about:test/foo/bar'), 'about:test')
      test.strictEqual(urlUtil().getOrigin('about:test/foo/bar#baz'), 'about:test')
    },
    'returns null for invalid URL': (test) => {
      test.strictEqual(urlUtil().getOrigin('abc'), null)
    },
    'returns null for empty URL': (test) => {
      test.strictEqual(urlUtil().getOrigin(''), null)
    },
    'returns null for null URL': (test) => {
      test.strictEqual(urlUtil().getOrigin(null), null)
    },
    'returns correct result for URL with hostname that is a scheme': (test) => {
      test.strictEqual(urlUtil().getOrigin('http://http/test'), 'http://http')
    }
  },

  'stripLocation': {
    'null scenario': (test) => {
      const result = urlUtil().stripLocation(null)
      test.equal(result, '')
    },

    'empty string': (test) => {
      const result = urlUtil().stripLocation('')
      test.equal(result, '')
    },

    'normal url without hash or slash': (test) => {
      const result = urlUtil().stripLocation('https://brave.com')
      test.equal(result, 'https://brave.com')
    },

    'normal url with hash but not at the end': (test) => {
      const result = urlUtil().stripLocation('https://brave.com#title')
      test.equal(result, 'https://brave.com#title')
    },

    'normal url with hash at the end': (test) => {
      const result = urlUtil().stripLocation('https://brave.com#')
      test.equal(result, 'https://brave.com')
    },

    'normal url with slash at the end': (test) => {
      const result = urlUtil().stripLocation('https://brave.com/')
      test.equal(result, 'https://brave.com')
    },

    'normal url with slash hash at the end': (test) => {
      const result = urlUtil().stripLocation('https://brave.com/#')
      test.equal(result, 'https://brave.com')
    },

    'normal url with white space at the end': (test) => {
      const result = urlUtil().stripLocation('https://brave.com   ')
      test.equal(result, 'https://brave.com')
    }
  },

  'parseFaviconDataUrl': {
    'null scenario': (test) => {
      const result = urlUtil().parseFaviconDataUrl(null)
      test.equal(result, null)
    },
    'empty string': (test) => {
      const result = urlUtil().parseFaviconDataUrl('')
      test.equal(result, null)
    },
    'regular URL': (test) => {
      const result = urlUtil().parseFaviconDataUrl('http://example.com')
      test.equal(result, null)
    },
    'non-image data URL': (test) => {
      const result = urlUtil().parseFaviconDataUrl('data:text/plain;charset=UTF-8;page=21,the%20data:1234,5678')
      test.equal(result, null)
    },
    'non-base64 data URL': (test) => {
      const result = urlUtil().parseFaviconDataUrl('data:image/jpg,foo')
      test.equal(result, null)
    },
    'no-extension data URL': (test) => {
      const result = urlUtil().parseFaviconDataUrl('data:image/;base64,foo')
      test.equal(result, null)
    },
    'valid jpg': (test) => {
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
      const result = urlUtil().parseFaviconDataUrl(jpg)
      test.deepEqual(result, {data: expected, ext: 'jpeg'})
    },
    'valid png': (test) => {
      const png = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU//5ErkJggg=='
      const result = urlUtil().parseFaviconDataUrl(png)
      test.deepEqual(result, {data: 'iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU//5ErkJggg==', ext: 'png'})
    }
  },

  'isInternalUrl': {
    'null scenario': (test) => {
      const result = urlUtil().isInternalUrl(null)
      test.equal(result, false)
    },
    'localhost': (test) => {
      const result = urlUtil().isInternalUrl('http://localhost:399/abc')
      test.equal(result, true)
    },
    'localhost.com': (test) => {
      const result = urlUtil().isInternalUrl('http://localhost.com:399/abc')
      test.equal(result, false)
    },
    'invalid URL': (test) => {
      const result = urlUtil().isInternalUrl('adsf')
      test.equal(result, false)
    },
    'local IP': (test) => {
      const result = urlUtil().isInternalUrl('http://192.168.1.255:3000')
      test.equal(result, true)
      const result2 = urlUtil().isInternalUrl('http://127.0.0.1/')
      test.equal(result2, true)
    },
    'remote IP': (test) => {
      const result = urlUtil().isInternalUrl('http://54.0.0.1:3000')
      test.equal(result, false)
    },
    'local IPv6': (test) => {
      const result = urlUtil().isInternalUrl('https://[::1]:3000')
      test.equal(result, true)
      const result2 = urlUtil().isInternalUrl('http://[fe80::c12:79e9:bd20:31e1]/')
      test.equal(result2, true)
    },
    'remote IPv6': (test) => {
      const result = urlUtil().isInternalUrl('http://[2001:4860:4860::8888]:8000')
      test.equal(result, false)
    },
    '.local URL': (test) => {
      const result = urlUtil().isInternalUrl('https://adsf.local')
      test.equal(result, true)
    }
  },

  'isUrlPDF': {
    'null case': (test) => {
      const result = urlUtil().isUrlPDF(null)
      test.equal(result, false)
    },

    'url is not pdf': (test) => {
      const result = urlUtil().isUrlPDF('https://clifton.io')
      test.equal(result, false)
    },

    'url is pdf': (test) => {
      const result = urlUtil().isUrlPDF('chrome-extension://jdbefljfgobbmcidnmpjamcbhnbphjnb/http://www.test.com/test.pdf')
      test.equal(result, true)
    }
  },

  'getUrlFromPDFUrl': {
    'null case': (test) => {
      const result = urlUtil().getUrlFromPDFUrl(null)
      test.equal(result, null)
    },

    'url is not PDF': (test) => {
      const result = urlUtil().getUrlFromPDFUrl('https://clifton.io')
      test.equal(result, 'https://clifton.io')
    },

    'url is pdf': (test) => {
      const result = urlUtil().getUrlFromPDFUrl('chrome-extension://jdbefljfgobbmcidnmpjamcbhnbphjnb/http://www.test.com/test.pdf')
      test.equal(result, 'http://www.test.com/test.pdf')
    }
  },

  'isOnionUrl': {
    'null url': (test) => {
      const result = urlUtil().isOnionUrl(null)
      test.equal(result, false)
    },

    'regular url': (test) => {
      const result = urlUtil().isOnionUrl('http://bing.com')
      test.equal(result, false)
    },

    'onion url': (test) => {
      const result = urlUtil().isOnionUrl('https://facebookcorewwwi.onion/')
      test.equal(result, true)
    },

    'weird onion url': (test) => {
      const result = urlUtil().isOnionUrl('hTtpS://ABCDEF.onioN/?test=1#abc')
      test.equal(result, true)
    }
  }
}
