/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */
/* global describe, it, before, beforeEach, after */

const assert = require('assert')
const mockery = require('mockery')
const Immutable = require('immutable')

require('../../../braveUnit')

describe('publisherUtil test', function () {
  let publisherUtil, getSetting

  before(function () {
    mockery.enable({
      warnOnReplace: false,
      warnOnUnregistered: false,
      useCleanCache: true
    })

    mockery.registerMock('../../../js/settings', {
      getSetting: () => getSetting
    })
    publisherUtil = require('../../../../../app/common/lib/publisherUtil')
  })

  beforeEach(function () {
    getSetting = true
  })

  after(function () {
    mockery.disable()
  })

  describe('shouldShowAddPublisherButton', function () {
    const state = Immutable.fromJS({
      siteSettings: {
        'https?://brave.com': {
          ledgerPayments: false
        }
      }
    })

    it('location is empty', function () {
      const result = publisherUtil.shouldShowAddPublisherButton(state, '', 'brave.com')
      assert.equal(result, false)
    })

    it('location is about page', function () {
      const result = publisherUtil.shouldShowAddPublisherButton(state, 'about:about', 'about:about')
      assert.equal(result, false)
    })

    it('location is file', function () {
      const result = publisherUtil.shouldShowAddPublisherButton(state, 'file://test.txt', 'test.txt')
      assert.equal(result, false)
    })

    it('payment is disabled', function () {
      getSetting = false
      const result = publisherUtil.shouldShowAddPublisherButton(state, 'https://brave.com', 'brave.com')
      assert.equal(result, false)
    })

    it('everything is ok', function () {
      const result = publisherUtil.shouldShowAddPublisherButton(state, 'https://brave.com', 'brave.com')
      assert.equal(result, true)
    })
  })
})
