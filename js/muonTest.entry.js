const urlParse = require('../app/common/urlParse')
const urlUtil = require('./lib/urlutil')
const assert = require('assert')

const assertEqual = (actual, expected, name) => {
  const elem = document.createElement('div')
  elem.id = name
  elem.innerText = 'fail'

  try {
    assert.deepEqual(actual, expected)
    elem.innerText = 'success'
  } catch (e) {
    elem.innerText = JSON.stringify(actual)
  }
  document.body.appendChild(elem)
}

const defaultParsedUrl = {
  hash: '',
  host: '',
  hostname: '',
  href: '',
  origin: '',
  path: '/',
  pathname: '/',
  port: '',
  protocol: 'http:',
  query: '',
  search: ''
}

const runTests = () => {
  assertEqual(urlParse('http://bing.com'),
    Object.assign(defaultParsedUrl, {
      host: 'bing.com',
      hostname: 'bing.com',
      origin: 'http://bing.com/',
      href: 'http://bing.com/'
    }), 'urlParseSimple')

  assertEqual(urlParse('https://brave.com:333/test?abc=123&def#fff'),
    {
      host: 'brave.com:333',
      hostname: 'brave.com',
      origin: 'https://brave.com:333/',
      protocol: 'https:',
      port: '333',
      hash: '#fff',
      pathname: '/test',
      path: '/test?abc=123&def',
      search: '?abc=123&def',
      query: 'abc=123&def',
      href: 'https://brave.com:333/test?abc=123&def#fff'
    }, 'urlParseComplex')

  assertEqual(urlUtil.getOrigin('http://www.brave.com/foo'), 'http://www.brave.com', 'getOriginSimple')
  assertEqual(urlUtil.getOrigin('file:///aaa'), 'file:///', 'getOriginFile')
  assertEqual(urlUtil.getOrigin('http://brave.com:333/foo'), 'http://brave.com:333', 'getOriginWithPort')
  assertEqual(urlUtil.getOrigin('http://127.0.0.1:443/?test=1#abc'), 'http://127.0.0.1:443', 'getOriginIP')
  assertEqual(urlUtil.getOrigin('about:preferences#abc'), 'about:preferences', 'getOriginAbout')
  assertEqual(urlUtil.getOrigin('http://http/test'), 'http://http', 'getOriginSchemeHost')
  assertEqual(urlUtil.getOrigin(''), null, 'getOriginNull')
  assertEqual(urlUtil.getOrigin('abc'), null, 'getOriginInvalid')
}

runTests()
