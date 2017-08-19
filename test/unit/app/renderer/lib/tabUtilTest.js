/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

/* global describe, it */
const tabUtil = require('../../../../../app/renderer/lib/tabUtil')
const assert = require('assert')

require('../../../braveUnit')

describe('tabUtil', function () {
  describe('hasTabAsRelatedTarget', function () {
    const fakeEvent = (fakeDataset) => ({
      relatedTarget: {
        parentNode: {
          dataset: { [fakeDataset]: true }
        }
      }
    })

    it('null case', function () {
      assert.equal(tabUtil.hasTabAsRelatedTarget(null), false)
    })

    it('dataset is not provided', function () {
      const param = {
        relatedTarget: {
          parentNode: { }
        }
      }
      assert.equal(tabUtil.hasTabAsRelatedTarget(param), false)
    })

    it('returns true if dataset is tab', function () {
      const fakeDataset = fakeEvent('tab')
      assert.equal(tabUtil.hasTabAsRelatedTarget(fakeDataset), true)
    })

    it('returns true if dataset is tabArea', function () {
      const fakeDataset = fakeEvent('tabArea')
      assert.equal(tabUtil.hasTabAsRelatedTarget(fakeDataset), true)
    })

    it('returns false if dataset is neither tab nor tabArea', function () {
      const fakeDataset = fakeEvent('badCoffee')
      assert.equal(tabUtil.hasTabAsRelatedTarget(fakeDataset), false)
    })
  })
})
