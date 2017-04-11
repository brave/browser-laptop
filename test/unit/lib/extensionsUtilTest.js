/* global describe, it */
const extensionsUtil = require('../../../app/renderer/lib/extensionsUtil')
const assert = require('assert')

require('../braveUnit')

describe('extensionsUtil', function () {
  describe('bravifyText', function () {
    it('fixes `Chrome`', function () {
      assert.equal(extensionsUtil.bravifyText('Chrome'), 'Brave')
    })
    it('fixes `GoogleChrome`', function () {
      assert.equal(extensionsUtil.bravifyText('GoogleChrome'), 'Brave')
    })
    it('fixes `Google Chrome`', function () {
      assert.equal(extensionsUtil.bravifyText('Google Chrome'), 'Brave')
    })
    it('does a global replace (more than one occurrence)', function () {
      assert.equal(extensionsUtil.bravifyText(
        'This Chrome extension is the best one in the Google Chrome store. Use Chrome today!'),
        'This Brave extension is the best one in the Brave store. Use Brave today!')
    })
    it('does not replace Google', function () {
      assert.equal(extensionsUtil.bravifyText('Google Docs'), 'Google Docs')
    })
    it('does not replace lowercase c `chrome`', function () {
      assert.equal(extensionsUtil.bravifyText('Shiny chrome plated thing'), 'Shiny chrome plated thing')
    })
  })
})
