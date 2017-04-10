/* global describe, it */
const extensionsUtil = require('../../../app/renderer/lib/extensionsUtil')
const assert = require('assert')

require('../braveUnit')

describe('extensionsUtil', function () {
  describe('bravifyText', function () {
    it('fixes Chrome', function () {
      assert.equal(extensionsUtil.bravifyText('Chrome'), 'Brave')
    })
    it('fixes GoogleChrome', function () {
      assert.equal(extensionsUtil.bravifyText('GoogleChrome'), 'Brave')
    })
    it('fixes Google Chrome', function () {
      assert.equal(extensionsUtil.bravifyText('Google Chrome'), 'Brave')
    })
  })
})
