/* global describe, before, after, it */
const {tokenizeInput, init, query, add} = require('../../../../../app/common/lib/siteSuggestions')
const assert = require('assert')
const Immutable = require('immutable')
const sinon = require('sinon')
const fakeElectron = require('../../../lib/fakeElectron')
const mockery = require('mockery')

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

// Compares 2 sites via deepEqual while first clearing out cached data
const siteEqual = (actual, expected) => {
  assert.equal(actual.constructor, expected.constructor)
  if (expected.constructor === Array) {
    assert.equal(actual.length, expected.length)
    for (let i = 0; i < actual.length; i++) {
      assert.deepEqual(actual[i].delete('parsedUrl').toJS(), expected[i].delete('parsedUrl').toJS())
    }
  } else {
    const a = Object.assign({}, actual)
    delete a.parsedUrl
    const e = Object.assign({}, expected)
    delete e.parsedUrl
    assert.deepEqual(a, e)
  }
}

require('../../../braveUnit')

describe('siteSuggestions lib', function () {
  before(function () {
    mockery.enable({
      warnOnReplace: false,
      warnOnUnregistered: false,
      useCleanCache: true
    })
    mockery.registerMock('electron', fakeElectron)
  })
  after(function () {
    mockery.disable()
  })
  describe('tokenizeInput', function () {
    it('empty string has no tokens', function () {
      assert.deepEqual(tokenizeInput(''), [])
    })
    it('undefined has no tokens', function () {
      assert.deepEqual(tokenizeInput(null), [])
    })
    it('null has no tokens', function () {
      assert.deepEqual(tokenizeInput(undefined), [])
    })
    it('lowercases tokens', function () {
      assert.deepEqual(tokenizeInput('BRaD HaTES PRIMES'), ['brad', 'hates', 'primes'])
    })
    it('includes protocol', function () {
      assert.deepEqual(tokenizeInput('https://bradrichter.co/I/hate/primes.html'), ['bradrichter', 'co', 'i', 'hate', 'primes', 'html', 'https:'])
    })
    it('includes query', function () {
      assert.deepEqual(tokenizeInput('https://bradrichter.co/I/hate/primes.html?test=abc&test2=abcd'), ['bradrichter', 'co', 'i', 'hate', 'primes', 'html', 'test', 'abc', 'test2', 'abcd', 'https:'])
    })
    it('does not include hash', function () {
      assert.deepEqual(tokenizeInput('https://bradrichter.co/I/hate/primes.html?test=abc#testing'), ['testing', 'bradrichter', 'co', 'i', 'hate', 'primes', 'html', 'test', 'abc', 'https:'])
    })
    it('spaces get tokenized', function () {
      assert.deepEqual(tokenizeInput('brad\thates primes'), ['brad', 'hates', 'primes'])
    })
    it('periods get tokenized', function () {
      assert.deepEqual(tokenizeInput('brad.hates.primes'), ['brad', 'hates', 'primes'])
    })
    it('/ gets tokenized', function () {
      assert.deepEqual(tokenizeInput('brad/hates/primes'), ['brad', 'hates', 'primes'])
    })
    it('\\ gets tokenized', function () {
      assert.deepEqual(tokenizeInput('brad\\hates\\primes'), ['brad', 'hates', 'primes'])
    })
    it('can tokenize site objects', function () {
      assert.deepEqual(tokenizeInput(Immutable.fromJS(site1)), ['do', 'not', 'use', '3', 'for', 'items', 'because', 'it', 'is', 'prime', 'www', 'bradrichter', 'co', 'bad_numbers', '3', 'https:'])
    })
    it('non URLs get tokenized', function () {
      assert.deepEqual(tokenizeInput('hello world Greatest...Boss...Ever'), ['hello', 'world', 'greatest', 'boss', 'ever'])
    })
  })

  const checkResult = (inputQuery, expectedResults, cb) => {
    query(inputQuery).then((results) => {
      siteEqual(results, expectedResults)
      cb()
    })
  }

  describe('not initialized query', function () {
    it('returns no results if not initialized', function (cb) {
      checkResult('hello', [], cb)
    })
  })

  describe('query', function () {
    let sites

    before(function (cb) {
      sites = Immutable.fromJS([site1, site2, site3, site4, site5])
      this.clock = sinon.useFakeTimers()
      init(sites).then(cb.bind(null, null))
      this.clock.tick(1510)
    })
    after(function () {
      this.clock.restore()
    })
    it('can query with empty string', function (cb) {
      checkResult('', [], cb)
    })
    it('can query with null', function (cb) {
      checkResult(null, [], cb)
    })
    it('can query with undefined', function (cb) {
      checkResult(undefined, [], cb)
    })
    it('returns an empty array when there are no matches', function (cb) {
      checkResult('hello', [], cb)
    })
    it('returns matched result on an exact token', function (cb) {
      checkResult('bradrichter', [sites.get(0), sites.get(2)], cb)
    })
    it('returns matched result on a token prefix', function (cb) {
      checkResult('brad', [sites.get(0), sites.get(2), sites.get(3).delete('count')], cb)
    })
    it('returns no results on input that has a token as a prefix', function (cb) {
      checkResult('bradrichterhatesprimes.com', [], cb)
    })
    it('can query on title', function (cb) {
      checkResult('back', [sites.get(1)], cb)
    })
    it('can query on multiple tokens in different order', function (cb) {
      checkResult('back really', [sites.get(1)], cb)
    })
    it('all tokens must match, not just some', function (cb) {
      checkResult('brave brad', [], cb)
    })
  })

  describe('query', function () {
    describe('sorts results by location', function () {
      before(function (cb) {
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
      })
      it('orders shortest match first', function (cb) {
        query('twitter.com').then((results) => {
          siteEqual(results[0], Immutable.fromJS({ location: 'https://twitter.com' }))
          cb()
        })
      })
      it('matches prefixes first', function (cb) {
        query('twi').then((results) => {
          siteEqual(results[0], Immutable.fromJS({ location: 'https://twitter.com' }))
          cb()
        })
      })
      it('closest to the left match wins', function (cb) {
        query('twitter.com brian').then((results) => {
          siteEqual(results[0], Immutable.fromJS({ location: 'https://twitter.com/brianbondy' }))
          cb()
        })
      })
      it('matches based on tokens and not exactly', function (cb) {
        query('twitter.com/moments').then((results) => {
          siteEqual(results[0], Immutable.fromJS({ location: 'https://twitter.com/i/moments' }))
          cb()
        })
      })
    })
    describe('sorts results by count', function () {
      describe('with lastAccessedTime', function () {
        before(function (cb) {
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
        })
        it('highest count first', function (cb) {
          query('https://brave.com/page').then((results) => {
            siteEqual(results[0], Immutable.fromJS(this.page2))
            cb()
          })
        })
      })
      describe('without last access time', function () {
        before(function (cb) {
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
        })
        it('highest count first', function (cb) {
          query('https://brave.com/page').then((results) => {
            siteEqual(results[0], Immutable.fromJS(this.page2))
            cb()
          })
        })
      })
    })
    describe('sorts results by lastAccessTime', function () {
      describe('with counts', function () {
        before(function (cb) {
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
        })
        it('items with lastAccessTime of 1 get ignored (signifies preloaded default)', function (cb) {
          query('https://bravez.com/page').then((results) => {
            assert.equal(results.length, 0)
            cb()
          })
        })
        it('most recently accessed get sorted first', function (cb) {
          query('bravebrowser').then((results) => {
            siteEqual(results[0], Immutable.fromJS(this.site))
            cb()
          })
        })
      })
      describe('without counts', function () {
        before(function (cb) {
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
        })
        it('items with lastAccessTime of 1 get ignored (signifies preloaded default)', function (cb) {
          query('https://bravez.com/page').then((results) => {
            assert.equal(results.length, 0)
            cb()
          })
        })
        it('most recently accessed get sorted first', function (cb) {
          query('bravebrowser').then((results) => {
            siteEqual(results[0], Immutable.fromJS(this.site))
            cb()
          })
        })
      })
    })
  })

  describe('add sites after init', function () {
    before(function (cb) {
      const sites = [site1, site2, site3, site4]
      init(sites).then(() => {
        add({
          location: 'https://slack.com'
        })
      }).then(cb.bind(null, null))
    })
    it('can be found', function (cb) {
      checkResult('slack', [Immutable.fromJS({ location: 'https://slack.com' })], cb)
    })
    it('adding twice results in 1 result only with latest results', function (cb) {
      const newSite = {
        location: 'https://slack.com',
        count: 30,
        title: 'SlickSlack'
      }
      add(newSite)
      checkResult('slack', [Immutable.fromJS(newSite)], cb)
    })
    it('can add simple strings', function (cb) {
      add({
        location: 'https://slashdot.org'
      })
      checkResult('slash', [Immutable.fromJS({ location: 'https://slashdot.org' })], cb)
    })
    it('can add Immutable objects', function (cb) {
      add(Immutable.fromJS({
        location: 'https://microsoft.com'
      }))
      checkResult('micro', [Immutable.fromJS({ location: 'https://microsoft.com' })], cb)
    })
  })
})
