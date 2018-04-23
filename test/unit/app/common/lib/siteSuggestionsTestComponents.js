const {tokenizeInput, init, query, add} = require('../../../../../app/common/lib/siteSuggestions')
const Immutable = require('immutable')
const lolex = require('lolex')

const site1 = {
  location: 'https://www.bradrichter.co/bad_numbers/3',
  title: 'Do not use 3 for items because it is prime'
}
const site2 = {
  location: 'https://www.brave.com',
  title: 'No really, take back the web'
}
const site3 = {
  location: 'https://www.bradrichter.co/bad_numbers/5',
  title: 'Do not use 5 it is so bad, try 6 instead. Much better.'
}
const site4 = {
  location: 'https://www.designers.com/brad',
  title: 'Brad Saves The World!',
  count: 50
}
// Same as site4 but added after in init, should be ignored.
const site5 = {
  location: 'https://www.designers.com/brad',
  title: 'Brad Saves The World!'
}
const sites = Immutable.fromJS([site1, site2, site3, site4, site5])

// Compares 2 sites via deepEqual while first clearing out cached data
const siteEqual = (test, actual, expected) => {
  test.equal(actual.constructor, expected.constructor)
  if (expected.constructor === Array) {
    test.equal(actual.length, expected.length)
    for (let i = 0; i < actual.length; i++) {
      test.deepEqual(actual[i].delete('parsedUrl').toJS(), expected[i].delete('parsedUrl').toJS())
    }
  } else {
    const a = Object.assign({}, actual)
    delete a.parsedUrl
    const e = Object.assign({}, expected)
    delete e.parsedUrl
    test.deepEqual(a, e)
  }
}

const checkResult = (test, inputQuery, expectedResults, cb) => {
  return query(inputQuery).then((results) => {
    siteEqual(test, results, expectedResults)
    cb()
  })
}

module.exports = {
  'tokenizeInput': {
    'empty string has no tokens': (test) => {
      test.deepEqual(tokenizeInput(''), [])
    },
    'undefined has no tokens': (test) => {
      test.deepEqual(tokenizeInput(null), [])
    },
    'null has no tokens': (test) => {
      test.deepEqual(tokenizeInput(undefined), [])
    },
    'lowercases tokens': (test) => {
      test.deepEqual(tokenizeInput('BRaD HaTES PRIMES'), ['brad', 'hates', 'primes'])
    },
    'includes protocol': (test) => {
      test.deepEqual(tokenizeInput('https://bradrichter.co/I/hate/primes.html'), ['bradrichter', 'co', 'i', 'hate', 'primes', 'html', 'https:'])
    },
    'includes query': (test) => {
      test.deepEqual(tokenizeInput('https://bradrichter.co/I/hate/primes.html?test=abc&test2=abcd'), ['bradrichter', 'co', 'i', 'hate', 'primes', 'html', 'test', 'abc', 'test2', 'abcd', 'https:'])
    },
    'does not include hash': (test) => {
      test.deepEqual(tokenizeInput('https://bradrichter.co/I/hate/primes.html?test=abc#testing'), ['testing', 'bradrichter', 'co', 'i', 'hate', 'primes', 'html', 'test', 'abc', 'https:'])
    },
    'spaces get tokenized': (test) => {
      test.deepEqual(tokenizeInput('brad\thates primes'), ['brad', 'hates', 'primes'])
    },
    'periods get tokenized': (test) => {
      test.deepEqual(tokenizeInput('brad.hates.primes'), ['brad', 'hates', 'primes'])
    },
    'forward slash gets tokenized': (test) => {
      test.deepEqual(tokenizeInput('brad/hates/primes'), ['brad', 'hates', 'primes'])
    },
    'backslash gets tokenized': (test) => {
      test.deepEqual(tokenizeInput('brad\\hates\\primes'), ['brad', 'hates', 'primes'])
    },
    'can tokenize site objects': (test) => {
      test.deepEqual(tokenizeInput(Immutable.fromJS(site1)), ['do', 'not', 'use', '3', 'for', 'items', 'because', 'it', 'is', 'prime', 'www', 'bradrichter', 'co', 'bad_numbers', '3', 'https:'])
    },
    'non URLs get tokenized': (test) => {
      test.deepEqual(tokenizeInput('hello world Greatest...Boss...Ever'), ['hello', 'world', 'greatest', 'boss', 'ever'])
    }
  },

  'not initialized query': {
    'returns no results if not initialized': (test, cb) => {
      checkResult(test, 'hello', [], cb).catch(cb)
    }
  },

  'basic query': {
    before: function (cb) {
      this.clock = lolex.install()
      init(sites).then(cb.bind(null, null))
      this.clock.tick(1510)
    },
    after: function () {
      this.clock.uninstall()
    },
    'can query with empty string': (test, cb) => {
      checkResult(test, '', [], cb).catch(cb)
    },
    'can query with null': (test, cb) => {
      checkResult(test, null, [], cb).catch(cb)
    },
    'can query with undefined': (test, cb) => {
      checkResult(test, undefined, [], cb).catch(cb)
    },
    'returns an empty array when there are no matches': (test, cb) => {
      checkResult(test, 'hello', [], cb).catch(cb)
    },
    'returns matched result on an exact token': (test, cb) => {
      checkResult(test, 'bradrichter', [sites.get(0), sites.get(2)], cb).catch(cb)
    },
    'returns matched result on a token prefix': (test, cb) => {
      checkResult(test, 'brad', [sites.get(0), sites.get(2), sites.get(3).delete('count')], cb).catch(cb)
    },
    'returns no results on input that has a token as a prefix': (test, cb) => {
      checkResult(test, 'bradrichterhatesprimes.com', [], cb).catch(cb)
    },
    'can query on title': (test, cb) => {
      checkResult(test, 'back', [sites.get(1)], cb).catch(cb)
    },
    'can query on multiple tokens in different order': (test, cb) => {
      checkResult(test, 'back really', [sites.get(1)], cb).catch(cb)
    },
    'all tokens must match, not just some': (test, cb) => {
      checkResult(test, 'brave brad', [], cb).catch(cb)
    }
  },

  'query': {
    'sorts results by location': {
      before: (cb) => {
        const sites = Immutable.fromJS([{
          location: 'https://brave.com/twi'
        }, {
          location: 'https://twitter.com/brave'
        }, {
          location: 'https://twitter.com/brianbondy'
        }, {
          location: 'https://twitter.com/_brianclif'
        }, {
          location: 'https://twitter.com/cezaraugusto'
        }, {
          location: 'https://bbondy.com/twitter'
        }, {
          location: 'https://twitter.com'
        }, {
          location: 'https://twitter.com/i/moments'
        }])
        init(sites).then(cb.bind(null, null))
      },
      'orders shortest match first': (test, cb) => {
        query('twitter.com').then((results) => {
          siteEqual(test, results[0], Immutable.fromJS({ location: 'https://twitter.com' }))
          cb()
        }).catch(cb)
      },
      'matches prefixes first': (test, cb) => {
        query('twi').then((results) => {
          siteEqual(test, results[0], Immutable.fromJS({ location: 'https://twitter.com' }))
          cb()
        }).catch(cb)
      },
      'closest to the left match wins': (test, cb) => {
        query('twitter.com brian').then((results) => {
          siteEqual(test, results[0], Immutable.fromJS({ location: 'https://twitter.com/brianbondy' }))
          cb()
        }).catch(cb)
      },
      'matches based on tokens and not exactly': (test, cb) => {
        query('twitter.com/moments').then((results) => {
          siteEqual(test, results[0], Immutable.fromJS({ location: 'https://twitter.com/i/moments' }))
          cb()
        }).catch(cb)
      }
    },
    'sorts results by count': {
      'with lastAccessedTime': {
        before: function (cb) {
          const lastAccessedTime = 1494958046427
          this.page2 = {
            location: 'https://brave.com/page2',
            lastAccessedTime,
            count: 20
          }
          const sites = Immutable.fromJS([{
            location: 'https://brave.com/page1',
            lastAccessedTime,
            count: 5
          }, this.page2, {
            location: 'https://brave.com/page3',
            lastAccessedTime,
            count: 2
          }])
          init(sites).then(cb.bind(null, null))
        },
        'highest count first': function (test, cb) {
          query('https://brave.com/page').then((results) => {
            siteEqual(test, results[0], Immutable.fromJS(this.page2))
            cb()
          }).catch(cb)
        }
      },
      'without last access time': {
        before: function (cb) {
          this.page2 = {
            location: 'https://brave.com/page2',
            count: 20
          }
          const sites = Immutable.fromJS([{
            location: 'https://brave.com/page1',
            count: 5
          }, this.page2, {
            location: 'https://brave.com/page3',
            count: 2
          }])
          init(sites).then(cb.bind(null, null))
        },
        'highest count first': function (test, cb) {
          query('https://brave.com/page').then((results) => {
            siteEqual(test, results[0], Immutable.fromJS(this.page2))
            cb()
          }).catch(cb)
        }
      }
    },
    'sorts results by lastAccessTime': {
      'with counts': {
        before: function (cb) {
          this.site = {
            location: 'https://bravebrowser.com/page2',
            lastAccessedTime: 1494958046427,  // most recent
            count: 1
          }
          const sites = Immutable.fromJS([{
            location: 'https://bravez.com/page1',
            lastAccessedTime: 1,
            count: 1
          }, {
            location: 'https://bravebrowser.com/page1',
            lastAccessedTime: 1494957046426,
            count: 1
          }, this.site, {
            location: 'https://bravebrowser.com/page3',
            lastAccessedTime: 1494957046437,
            count: 1
          }])
          init(sites).then(cb.bind(null, null))
        },
        'items with lastAccessTime of 1 get ignored (signifies preloaded default)': (test, cb) => {
          query('https://bravez.com/page').then((results) => {
            test.equal(results.length, 0)
            cb()
          }).catch(cb)
        },
        'most recently accessed get sorted first': function (test, cb) {
          query('bravebrowser').then((results) => {
            siteEqual(test, results[0], Immutable.fromJS(this.site))
            cb()
          }).catch(cb)
        }
      },
      'without counts': {
        before: function (cb) {
          this.site = {
            location: 'https://bravebrowser.com/page2',
            lastAccessedTime: 1494958046427  // most recent
          }
          const sites = Immutable.fromJS([{
            location: 'https://bravez.com/page1',
            lastAccessedTime: 1
          }, {
            location: 'https://bravebrowser.com/page1',
            lastAccessedTime: 1494957046426
          }, this.site, {
            location: 'https://bravebrowser.com/page3',
            lastAccessedTime: 1494957046437
          }])
          init(sites).then(cb.bind(null, null))
        },
        'items with lastAccessTime of 1 get ignored (signifies preloaded default)': (test, cb) => {
          query('https://bravez.com/page').then((results) => {
            test.equal(results.length, 0)
            cb()
          }).catch(cb)
        },
        'most recently accessed get sorted first': function (test, cb) {
          query('bravebrowser').then((results) => {
            siteEqual(test, results[0], Immutable.fromJS(this.site))
            cb()
          }).catch(cb)
        }
      }
    }
  },

  'add sites after init': {
    before: (cb) => {
      const sites = [site1, site2, site3, site4]
      init(sites).then(() => {
        add({ location: 'https://slack.com' })
      }).then(cb.bind(null, null))
    },
    'can be found': (test, cb) => {
      checkResult(test, 'slack', [Immutable.fromJS({ location: 'https://slack.com' })], cb).catch(cb)
    },
    'adding twice results in 1 result only with latest results': (test, cb) => {
      const newSite = {
        location: 'https://slack.com',
        count: 30,
        title: 'SlickSlack'
      }
      add(newSite)
      checkResult(test, 'slack', [Immutable.fromJS(newSite)], cb).catch(cb)
    },
    'can add simple strings': (test, cb) => {
      add({ location: 'https://slashdot.org' })
      checkResult(test, 'slash', [Immutable.fromJS({ location: 'https://slashdot.org' })], cb).catch(cb)
    },
    'can add Immutable objects': (test, cb) => {
      add(Immutable.fromJS({ location: 'https://microsoft.com' }))
      checkResult(test, 'micro', [Immutable.fromJS({ location: 'https://microsoft.com' })], cb).catch(cb)
    }
  }
}
