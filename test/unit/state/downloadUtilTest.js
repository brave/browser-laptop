/* global describe, it */

const downloadUtil = require('../../../js/state/downloadUtil')
const assert = require('assert')
const Immutable = require('immutable')

describe('downloadUtil', function () {
  describe('getPercentageComplete', function () {
    it('returns percentage complete for nonzero totalBytes', function () {
      assert.equal(downloadUtil.getPercentageComplete(new Immutable.Map({
        totalBytes: 100,
        receivedBytes: 10
      })), '10%')
      assert.equal(downloadUtil.getPercentageComplete(new Immutable.Map({
        totalBytes: 1,
        receivedBytes: 1
      })), '100%')
      assert.equal(downloadUtil.getPercentageComplete(new Immutable.Map({
        totalBytes: 0,
        receivedBytes: 1
      })), '0%')
    })
    it('returns percentage complete for falsey totalBytes', function () {
      assert.equal(downloadUtil.getPercentageComplete(new Immutable.Map({
        totalBytes: 0,
        receivedBytes: 10
      })), '0%')
      assert.equal(downloadUtil.getPercentageComplete(new Immutable.Map({
        totalBytes: 0,
        receivedBytes: 0
      })), '0%')
      assert.equal(downloadUtil.getPercentageComplete(new Immutable.Map({
        receivedBytes: 0
      })), '0%')
    })
  })
})
