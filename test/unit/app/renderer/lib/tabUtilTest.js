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
      assert.notEqual(tabUtil.hasTabAsRelatedTarget(fakeDataset), true)
    })
  })
})
