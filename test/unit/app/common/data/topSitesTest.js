/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */
/* global describe, it */

const assert = require('assert')

require('../../../braveUnit')
const {topSites, getSiteOrder} = require('../../../../../app/common/data/topSites')

describe('topSites', function () {
  describe('topSites', function () {
    it('exports an array with top sites', function () {
      assert.equal(topSites.constructor, Array)
      assert.ok(topSites.length > 0)
      assert.equal(topSites[0], 'google.com')
    })
  })
  describe('getSiteOrder', function () {
    it('obtains the first site\'s order', function () {
      assert.equal(getSiteOrder('google.com'), 1)
    })
    it('obtains an arbigrary site\'s order', function () {
      assert.equal(getSiteOrder('calendar.google.com'), 4)
    })
    it('orders unknown sites as max int', function () {
      assert.equal(getSiteOrder('bradhatesprimes.com'), 9007199254740991)
    })
  })
})
