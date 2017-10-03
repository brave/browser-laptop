/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

/* global describe, it */
const pageDataUtil = require('../../../../../app/common/lib/pageDataUtil')
const assert = require('assert')

require('../../../braveUnit')

describe('pageDataUtil unit tests', () => {
  describe('getInfoKey', () => {
    it('null case', () => {
      const result = pageDataUtil.getInfoKey()
      assert.equal(result, null)
    })

    it('url is converted to location', () => {
      const result = pageDataUtil.getInfoKey('https://brave.com')
      assert.equal(result, 'https://brave.com/')
    })
  })
})
