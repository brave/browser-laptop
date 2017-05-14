/* global describe, before, it */
const {tokenizeInput, init, query, add} = require('../../../../../app/common/lib/siteSuggestions')
const assert = require('assert')
const Immutable = require('immutable')

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
  title: 'Brad Saves The World!'
}

require('../../../braveUnit')

describe('siteSuggestions lib', function () {
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
    it('does not include http', function () {
      assert.deepEqual(tokenizeInput('http://bradrichter.co/I/hate/primes.html'), ['bradrichter', 'co', 'i', 'hate', 'primes', 'html'])
    })
    it('does not include https as a token', function () {
      assert.deepEqual(tokenizeInput('https://bradrichter.co/I/hate/primes.html'), ['bradrichter', 'co', 'i', 'hate', 'primes', 'html'])
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
    it('? gets tokenized', function () {
      assert.deepEqual(tokenizeInput('brad?hates?primes'), ['brad', 'hates', 'primes'])
    })
    it('& gets tokenized', function () {
      assert.deepEqual(tokenizeInput('brad&hates&primes'), ['brad', 'hates', 'primes'])
    })
    it('can tokenize site objects', function () {
      assert.deepEqual(tokenizeInput(site1), ['do', 'not', 'use', '3', 'for', 'items', 'because', 'it', 'is', 'prime', 'www', 'bradrichter', 'co', 'bad_numbers', '3'])
    })
  })

  const checkResult = (inputQuery, expectedResults, cb) => {
    query(inputQuery).then((results) => {
      assert.deepEqual(results, expectedResults)
      cb()
    })
  }

  describe('not initialized query', function () {
    it('returns no results if not initialized', function (cb) {
      checkResult('hello', [], cb)
    })
  })
  describe('query', function () {
    before(function (cb) {
      const sites = [site1, site2, site3, site4]
      init(sites).then(cb.bind(null, null))
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
      checkResult('bradrichter', [site1, site3], cb)
    })
    it('returns matched result on a token prefix', function (cb) {
      checkResult('brad', [site1, site3, site4], cb)
    })
    it('returns no results on input that has a token as a prefix', function (cb) {
      checkResult('bradrichterhatesprimes.com', [], cb)
    })
    it('can query on title', function (cb) {
      checkResult('back', [site2], cb)
    })
    it('can query on multiple tokens in different order', function (cb) {
      checkResult('back really', [site2], cb)
    })
    it('all tokens must match, not just some', function (cb) {
      checkResult('brave brad', [], cb)
    })
  })
  describe('query sorts results', function () {
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
        assert.deepEqual(results[0], { location: 'https://twitter.com' })
        cb()
      })
    })
    it('matches prefixes first', function (cb) {
      query('twi').then((results) => {
        assert.deepEqual(results[0], { location: 'https://twitter.com' })
        cb()
      })
    })
    it('closest to the left match wins', function (cb) {
      query('twitter.com brian').then((results) => {
        assert.deepEqual(results[0], { location: 'https://twitter.com/brianbondy' })
        cb()
      })
    })
    it('matches based on tokens and not exactly', function (cb) {
      query('twitter.com/moments').then((results) => {
        assert.deepEqual(results[0], { location: 'https://twitter.com/i/moments' })
        cb()
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
      checkResult('slack', [{ location: 'https://slack.com' }], cb)
    })
    it('adding twice results in 1 result only', function (cb) {
      add({
        location: 'https://slack.com'
      })
      checkResult('slack', [{ location: 'https://slack.com' }], cb)
    })
    it('can add simple strings', function (cb) {
      add({
        location: 'https://slashdot.org'
      })
      checkResult('slash', [{ location: 'https://slashdot.org' }], cb)
    })
    it('can add Immutable objects', function (cb) {
      add(Immutable.fromJS({
        location: 'https://microsoft.com'
      }))
      checkResult('micro', [{ location: 'https://microsoft.com' }], cb)
    })
  })
})
