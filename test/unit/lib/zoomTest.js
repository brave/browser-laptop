/* global describe, it */

const {getZoomValuePercentage, getZoomLevel, getNextZoomLevel} = require('../../../js/lib/zoom')
const {zoom} = require('../../../js/constants/config')
const assert = require('assert')

describe('zoom', function () {
  describe('getZoomPercentage', function () {
    it('formats 0 t0 100%', function * () {
      assert.equal(getZoomValuePercentage(0), 100)
    })
    it('formats positive 20% increments', function * () {
      assert.equal(getZoomValuePercentage(20), 500)
    })
    it('formats negative 20% decrements', function * () {
      assert.equal(getZoomValuePercentage(-3.75), 25)
    })
  })
  describe('getZoomLevel', function () {
    it('formats 100 to 0', function * () {
      assert.equal(getZoomLevel(100), 0)
    })
    it('formats positive value', function * () {
      assert.equal(getZoomLevel(120), 1)
    })
    it('formats negative value', function * () {
      assert.equal(getZoomLevel(25), -3.75)
    })
  })
  describe('getNextZoomLevel', function () {
    it('zoomOut respects minimum', function * () {
      assert.equal(getNextZoomLevel(-200, false), zoom.zoomLevels[0])
    })
    it('zoomIn at minimum goest up', function * () {
      assert.equal(getNextZoomLevel(-200, true), zoom.zoomLevels[1])
    })
    it('zoomIn respects maximum', function * () {
      assert.equal(getNextZoomLevel(200, true), zoom.zoomLevels[zoom.zoomLevels.length - 1])
    })
    it('zooOut at maximum goes down', function * () {
      assert.equal(getNextZoomLevel(200, false), zoom.zoomLevels[zoom.zoomLevels.length - 2])
    })
  })
})
