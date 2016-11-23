/* global describe, it */
const suggestion = require('../../../app/renderer/lib/suggestion')
const assert = require('assert')
const Immutable = require('immutable')

require('../braveUnit')

const AGE_DECAY = 50

describe('suggestion', function () {
  it('normalizes location', function () {
    assert.ok(suggestion.normalizeLocation('https://www.site.com') === 'site.com', 'www. prefix removed')
    assert.ok(suggestion.normalizeLocation('http://site.com') === 'site.com', 'location not modified')
  })

  it('sorts sites correctly', function () {
    assert.ok(suggestion.sortingPriority(10, 100, 50, AGE_DECAY) > suggestion.sortingPriority(10, 100, 40, AGE_DECAY), 'newer sites with equal access counts sort earlier')
    assert.ok(suggestion.sortingPriority(10, 100, 50, AGE_DECAY) < suggestion.sortingPriority(11, 100, 40, AGE_DECAY), 'Sites with higher access counts sort earlier (unless time delay overriden)')
    assert.ok(suggestion.sortingPriority(10, 10000000000, 10000000000, AGE_DECAY) > suggestion.sortingPriority(11, 10000000000, 1000000000, AGE_DECAY), 'much newer sites without lower counts sort with higher priority')
  })

  it('sorts simple sites higher than complex sites', function () {
    const siteSimple = Immutable.Map({ location: 'http://www.site.com' })
    const siteComplex = Immutable.Map({ location: 'http://www.site.com/?foo=bar#a' })
    assert.ok(suggestion.simpleDomainNameValue(siteSimple) === 1, 'simple site returns 1')
    assert.ok(suggestion.simpleDomainNameValue(siteComplex) === 0, 'complex site returns 0')
  })

  it('Determines prefixes which should be normalized', function () {
    const prefixes = ['http://', 'https://', 'www.']
    prefixes.forEach((prefix) => {
      for (let i = 0; i < prefix.length; i++) {
        const substring = prefix.substring(0, i + 1)
        assert.equal(suggestion.shouldNormalizeLocation(substring), false)
      }
    })
  })

  it('Determines prefixes which should NOT be normalized', function () {
    const prefixes = ['httphttp', 'brave.com', 'www3', 'http://www.x']
    prefixes.forEach((prefix) => {
      assert.equal(suggestion.shouldNormalizeLocation(prefix), true)
    })
  })
})

const site1 = Immutable.Map({
  location: 'http://www.foo.com/1',
  count: 0,
  lastAccessedTime: 0,
  title: 'www.foo/com/1'
})

const site2 = Immutable.Map({
  location: 'http://www.foo.com/2',
  count: 0,
  lastAccessedTime: 0,
  title: 'www.foo/com/2'
})

const site3 = Immutable.Map({
  location: 'http://www.foo.com/3',
  count: 0,
  lastAccessedTime: 0,
  title: 'www.foo/com/3'
})

describe('suggestion', function () {
  it('shows virtual history item', function () {
    var history = Immutable.List([site1, site2, site3])
    var virtual = suggestion.createVirtualHistoryItems(history)
    assert.ok(virtual.length > 0, 'virtual location created')
    assert.ok(virtual[0].get('location') === 'http://www.foo.com')
    assert.ok(virtual[0].get('title') === 'www.foo.com')
    assert.ok(virtual[0].get('lastAccessedTime') > 0)
    history = Immutable.List([site1, site2])
    virtual = suggestion.createVirtualHistoryItems(history)
    assert.ok(virtual.length === 0, 'virtual location not created')
  })
})
