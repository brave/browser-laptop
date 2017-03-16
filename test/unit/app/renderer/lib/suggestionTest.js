/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */
/* global describe, before, after, it */

const mockery = require('mockery')
const assert = require('assert')
const sinon = require('sinon')
const Immutable = require('immutable')
const {makeImmutable} = require('../../../../../app/common/state/immutableUtil')
const _ = require('underscore')
let suggestion
require('../../../braveUnit')

const AGE_DECAY = 50

const fakeImmutableUtil = {
  makeImmutable: (obj) => {
    return makeImmutable(obj)
  }
}

describe('suggestion unit tests', function () {
  let makeImmutableSpy

  before(function () {
    mockery.enable({
      warnOnReplace: false,
      warnOnUnregistered: false,
      useCleanCache: true
    })

    makeImmutableSpy = sinon.spy(fakeImmutableUtil, 'makeImmutable')
    mockery.registerMock('../../common/state/immutableUtil', fakeImmutableUtil)
    suggestion = require('../../../../../app/renderer/lib/suggestion')
  })

  after(function () {
    makeImmutableSpy.restore()
    mockery.disable()
  })

  describe('normalizeLocation', function () {
    it('normalizes location', function () {
      assert.ok(suggestion.normalizeLocation('https://www.site.com') === 'site.com', 'www. prefix removed')
      assert.ok(suggestion.normalizeLocation('http://site.com') === 'site.com', 'location not modified')
    })
  })

  describe('sortingPriority', function () {
    it('sorts sites correctly', function () {
      assert.ok(suggestion.sortingPriority(10, 100, 50, AGE_DECAY) > suggestion.sortingPriority(10, 100, 40, AGE_DECAY), 'newer sites with equal access counts sort earlier')
      assert.ok(suggestion.sortingPriority(10, 100, 50, AGE_DECAY) < suggestion.sortingPriority(11, 100, 40, AGE_DECAY), 'Sites with higher access counts sort earlier (unless time delay overriden)')
      assert.ok(suggestion.sortingPriority(10, 10000000000, 10000000000, AGE_DECAY) > suggestion.sortingPriority(11, 10000000000, 1000000000, AGE_DECAY), 'much newer sites without lower counts sort with higher priority')
    })
  })

  describe('simpleDomainNameValue', function () {
    it('sorts simple sites higher than complex sites', function () {
      const siteSimple = Immutable.Map({ location: 'http://www.site.com' })
      const siteComplex = Immutable.Map({ location: 'http://www.site.com/?foo=bar#a' })
      assert.ok(suggestion.simpleDomainNameValue(siteSimple) === 1, 'simple site returns 1')
      assert.ok(suggestion.simpleDomainNameValue(siteComplex) === 0, 'complex site returns 0')
    })
  })

  describe('shouldNormalizeLocation', function () {
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

  describe('createVirtualHistoryItems', function () {
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

    it('handles input being null/undefined', function () {
      const emptyResult = Immutable.Map()
      assert.deepEqual(suggestion.createVirtualHistoryItems(), emptyResult)
      assert.deepEqual(suggestion.createVirtualHistoryItems(undefined), emptyResult)
      assert.deepEqual(suggestion.createVirtualHistoryItems(null), emptyResult)
    })

    it('handles entries with unparseable "location" field', function () {
      const badInput = makeImmutable({
        site1: {
          location: undefined
        },
        site2: {
          location: null
        },
        site3: {
          location: ''
        },
        site4: {
          location: 'httphttp://lol.com'
        }
      })
      assert.ok(suggestion.createVirtualHistoryItems(badInput))
    })

    it('calls immutableUtil.makeImmutable', function () {
      const callCount = makeImmutableSpy.withArgs({}).callCount
      suggestion.createVirtualHistoryItems()
      assert.equal(makeImmutableSpy.withArgs({}).callCount, callCount + 1)
    })

    it('shows virtual history item', function () {
      var history = Immutable.List([site1, site2, site3])
      var virtual = suggestion.createVirtualHistoryItems(history).toJS()
      var keys = _.keys(virtual)
      assert.ok(keys.length > 0, 'virtual location created')
      assert.ok(virtual[keys[0]].location === 'http://www.foo.com')
      assert.ok(virtual[keys[0]].title === 'www.foo.com')
      assert.ok(virtual[keys[0]].lastAccessedTime > 0)
    })
  })
})
