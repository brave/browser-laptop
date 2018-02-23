/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

/* global describe, it */
const assert = require('assert')
require('../../../braveUnit')
const Immutable = require('immutable')
const immutableUtil = require('../../../../../app/common/state/immutableUtil')

describe('immutableUtil unit test', function () {
  describe('isImmutable', function () {
    it('false when Array', function () {
      assert(!immutableUtil.isImmutable([]))
    })
    it('falsy when non-array Object', function () {
      assert(!immutableUtil.isImmutable({}))
    })
    it('falsy when null', function () {
      assert(!immutableUtil.isImmutable(null))
    })
    it('falsy when undewfined', function () {
      assert(!immutableUtil.isImmutable(undefined))
    })
    it('falsy when boolean', function () {
      assert(!immutableUtil.isImmutable(true))
    })
    it('truthy when Immutable.Map', function () {
      assert(immutableUtil.isImmutable(Immutable.Map()))
    })
    it('truthy when Immutable.List', function () {
      assert(immutableUtil.isImmutable(Immutable.List()))
    })
  })
  describe('isMap', function () {
    it('Immutable.Map returns true', function () {
      assert.equal(immutableUtil.isMap(Immutable.Map()), true)
    })
    it('Immutable.List returns false', function () {
      assert.equal(immutableUtil.isMap(Immutable.List()), false)
    })
    it('Array returns false', function () {
      assert.equal(immutableUtil.isMap([]), false)
    })
    it('Object returns false', function () {
      assert.equal(immutableUtil.isMap({cezar: 'axe kick expert'}), false)
    })
    it('null returns false', function () {
      assert.equal(immutableUtil.isMap(null), false)
    })
    it('undefined returns false', function () {
      assert.equal(immutableUtil.isMap(undefined), false)
    })
  })
  describe('isList', function () {
    it('Immutable.List returns true', function () {
      assert.equal(immutableUtil.isList(Immutable.List()), true)
    })
    it('Immutable.Map returns false', function () {
      assert.equal(immutableUtil.isList(Immutable.Map()), false)
    })
    it('Array returns false', function () {
      assert.equal(immutableUtil.isList([]), false)
    })
    it('Object returns false', function () {
      assert.equal(immutableUtil.isList({}), false)
    })
    it('null returns false', function () {
      assert.equal(immutableUtil.isList(null), false)
    })
    it('undefined returns false', function () {
      assert.equal(immutableUtil.isList(undefined), false)
    })
  })
  describe('isSameHashCode', function () {
    it('returns true if both undefined or null', function () {
      assert.deepEqual(immutableUtil.isSameHashCode(undefined, null), true)
    })
    it('returns true for 2 identical but different Immutable objects', function () {
      assert.deepEqual(immutableUtil.isSameHashCode(Immutable.fromJS({a: 1, b: [1, 2, 3]}), Immutable.fromJS({a: 1, b: [1, 2, 3]})), true)
    })
    it('returns false for 2 different Immutable objects', function () {
      assert.deepEqual(immutableUtil.isSameHashCode(Immutable.fromJS({a: 1, b: [1, 2]}), Immutable.fromJS({a: 1, b: [1, 2, 3]})), false)
    })
  })
  describe('makeImmutable', function () {
    it('converts an Object Map to Immutable.Map', function () {
      assert.deepEqual(immutableUtil.makeImmutable({a: 1}).constructor, Immutable.Map)
    })
    it('converts an Array Immutable.List', function () {
      assert.deepEqual(immutableUtil.makeImmutable([1]).constructor, Immutable.List)
    })
    it('converts an Object Immutable.Map to Immutable.Map', function () {
      assert.deepEqual(immutableUtil.makeImmutable(Immutable.Map()).constructor, Immutable.Map)
    })
    it('converts an Array Immutable.List', function () {
      assert.deepEqual(immutableUtil.makeImmutable(Immutable.List()).constructor, Immutable.List)
    })
  })
  describe('makeJS', function () {
    it('converts an Object an Object', function () {
      assert.deepEqual(immutableUtil.makeJS({a: 1}), {a: 1})
    })
    it('converts an Array to an Array', function () {
      assert.deepEqual(immutableUtil.makeJS([1]), [1])
    })
    it('converts an Immutable.Map Object to an Object', function () {
      assert.deepEqual(immutableUtil.makeJS(Immutable.fromJS({a: 1})), {a: 1})
    })
    it('converts an Immutable.List to an Array', function () {
      assert.deepEqual(immutableUtil.makeJS(Immutable.fromJS([1])), [1])
    })
    it('converts a string to a string', function () {
      assert.equal(immutableUtil.makeJS('hi'), 'hi')
    })
    it('converts a boolean to a boolean', function () {
      assert.equal(immutableUtil.makeJS(false), false)
    })
    it('converts a number to a number', function () {
      assert.equal(immutableUtil.makeJS(42), 42)
    })
    it('converts undefined to undefined', function () {
      assert.equal(immutableUtil.makeJS(undefined), undefined)
    })
    it('converts null to null', function () {
      assert.equal(immutableUtil.makeJS(null), null)
    })
    it('converts null to null', function () {
      assert.equal(immutableUtil.makeJS(null), null)
    })
    it('converts null to default value if a deafult value is specified', function () {
      assert.deepEqual(immutableUtil.makeJS(null, {a: 1}), {a: 1})
    })
    it('converts undefined to default value if a deafult value is specified', function () {
      assert.deepEqual(immutableUtil.makeJS(undefined, {a: 1}), {a: 1})
    })
    it('converts false to false when a default value is specified', function () {
      assert.deepEqual(immutableUtil.makeJS(false, {a: 1}), false)
    })
  })
  describe('deleteImmutablePaths', function () {
    it('removes properties with simple strings', function () {
      const data = Immutable.fromJS({a: 'Cezar is a black belt in ameri-do-te', b: 2, c: 3})
      assert.deepEqual(immutableUtil.deleteImmutablePaths(data, ['a', 'b']).toJS(), {c: 3})
    })
    it('removes properties with array string paths', function () {
      const data = Immutable.fromJS({a: {a1: 4, a2: 8}, c: 'Cezar learnt directly from master ken', d: 5})
      assert.deepEqual(immutableUtil.deleteImmutablePaths(data, [['a', 'a1'], 'c']).toJS(), {a: {a2: 8}, d: 5})
    })
  })
  describe('findNullKeyPaths', function () {
    it('finds maps which have a null key', function () {
      const data = Immutable.fromJS({
        normal: {
          key1: 'value'
        },
        bad: { },
        anotherBad: {
          deeper: { }
        },
        null: {
          badParent: 'value4'
        },
        nullValue: null
      })
      .setIn(['bad', null], 'value2')
      .setIn(['anotherBad', 'deeper', null], 'value3')
      .set(null, Immutable.fromJS({badParent: 'value4'}))

      const expectedNullPaths = [
        ['bad', null],
        ['anotherBad', 'deeper', null],
        [null]
      ]
      const actualNullPaths = immutableUtil.findNullKeyPaths(data)
      assert.deepEqual(actualNullPaths, expectedNullPaths)
    })
  })
})
