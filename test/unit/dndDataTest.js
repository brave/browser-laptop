/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */
/* global describe, it */

const dndData = require('../../js/dndData')
const assert = require('assert')

describe('dndData', function () {
  describe('hasBraveDragData', function () {
    it('returns false for empty transfer', () => {
      assert.equal(dndData.hasBraveDragData(), false)
      assert.equal(dndData.hasBraveDragData({types: []}), false)
      assert.equal(dndData.hasBraveDragData({}), false)
    })
    it('returns false for regular transfer', () => {
      assert.equal(dndData.hasBraveDragData({types: ['text/plain']}), false)
      assert.equal(dndData.hasBraveDragData({types: ['text/plain', 'text/html']}), false)
    })
    it('returns true for brave transfer', () => {
      assert.equal(dndData.hasBraveDragData({types: ['application/x-brave-tab']}), true)
      assert.equal(dndData.hasBraveDragData({types: ['text/plain', 'text/uri-list', 'application/x-brave-bookmark']}), true)
    })
  })
})
