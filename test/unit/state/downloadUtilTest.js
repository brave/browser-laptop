/* global describe, it */

const downloadUtil = require('../../../js/state/downloadUtil')
const downloadStates = require('../../../js/constants/downloadStates')
const assert = require('assert')
const Immutable = require('immutable')

describe('downloadUtil', function () {
  describe('shouldAllowPause', function () {
    it('handles falsey input', function () {
      assert.equal(downloadUtil.shouldAllowPause(undefined), false)
    })
    it('returns true if state is `downloadStates.IN_PROGRESS`', function () {
      assert.equal(downloadUtil.shouldAllowPause(new Immutable.Map({
        state: downloadStates.IN_PROGRESS
      }), [downloadStates.IN_PROGRESS]), true)
    })
  })

  describe('getPercentageComplete', function () {
    it('handles falsey input', function () {
      assert.equal(downloadUtil.getPercentageComplete(undefined), '0%')
    })
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

  describe('shouldAllowCopyLink', function () {
    it('returns false if input is falsey', function () {
      assert.equal(downloadUtil.shouldAllowCopyLink(undefined), false)
    })
    it('returns false if `download.url` does not have a value', function () {
      assert.equal(downloadUtil.shouldAllowCopyLink(new Immutable.Map({
        totalBytes: 0
      })), false)
    })
    it('returns true if `download.url` has a value', function () {
      assert.equal(downloadUtil.shouldAllowCopyLink(new Immutable.Map({
        url: 'https://clifton.io/robots.txt'
      })), true)
    })
  })

  describe('getDownloadItems', function () {
    it('returns an empty Immutable.List if intput is falsey', function () {
      assert.deepEqual(downloadUtil.getDownloadItems(undefined), Immutable.List())
    })
    it('returns an empty Immutable.List if `state.downloads` is falsey', function () {
      assert.deepEqual(downloadUtil.getDownloadItems(new Immutable.Map({})), Immutable.List())
    })
  })
})
