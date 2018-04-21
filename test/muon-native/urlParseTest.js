// lazy load requires for dual use in and outside muon
const urlParse = () => require('../../app/common/urlParse')

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

module.exports = {
  urlParseSimple: (test) => {
    test.deepEqual(urlParse()('http://bing.com'), Object.assign(defaultParsedUrl, {
      host: 'bing.com',
      hostname: 'bing.com',
      origin: 'http://bing.com/',
      href: 'http://bing.com/'
    }))
  },
  urlParseComplex: (test) => {
    test.deepEqual(urlParse()('https://brave.com:333/test?abc=123&def#fff'), {
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
    })
  },
  urlParseIssue10270: (test) => {
    test.deepEqual(urlParse()('http://brave.com%60x.code-fu.org/'), Object.assign(defaultParsedUrl, {
      host: 'brave.com%60x.code-fu.org',
      hostname: 'brave.com%60x.code-fu.org',
      href: 'http://brave.com%60x.code-fu.org/',
      origin: 'http://brave.com%60x.code-fu.org/'
    }))
  }
}
