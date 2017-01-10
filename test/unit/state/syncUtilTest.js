/* global describe, it */

const syncUtil = require('../../../js/state/syncUtil')
const assert = require('assert')

describe('syncUtil', () => {
  describe('ipcSafeObject()', () => {
    it('does nothing with objects already safe', () => {
      const object = {chill: true, time: 42, nest: {egg: 'tree'}}
      assert.deepEqual(syncUtil.ipcSafeObject(object), object)
    })

    it('does nothing with Arrays', () => {
      const object = {arr: [1, 2, 3]}
      assert.deepEqual(syncUtil.ipcSafeObject(object), object)
      const deepObject = {deep: {arr: [1, 2, 3]}}
      assert.deepEqual(syncUtil.ipcSafeObject(deepObject), deepObject)
    })

    it('converts Uint8Array to Array', () => {
      const object = {chill: true, arr: new Uint8Array([1, 2, 3])}
      const expected = {chill: true, arr: [1, 2, 3]}
      assert.deepEqual(syncUtil.ipcSafeObject(object), expected)
      const deepObject = {chill: true, deep: {arr: new Uint8Array([1, 2, 3])}}
      const deepExpected = {chill: true, deep: {arr: [1, 2, 3]}}
      assert.deepEqual(syncUtil.ipcSafeObject(deepObject), deepExpected)
    })
  })
})
