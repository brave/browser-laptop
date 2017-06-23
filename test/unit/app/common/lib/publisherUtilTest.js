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

  describe('enabledForPaymentsPublisher', function () {
    const state = Immutable.fromJS({
      locationInfo: {
        'https://brave.com': {
          exclude: false,
          publisher: 'brave.com',
          stickyP: false,
          timestamp: 1496942403068,
          verified: false
        }
      },
      publisherInfo: {
        synopsis: {
          0: {
            daysSpent: 0,
            duration: 623405,
            faviconURL: '',
            hoursSpent: 0,
            minutesSpent: 10,
            percentage: 100,
            publisherURL: 'http://brave.com',
            score: 9.365888800773842,
            secondsSpent: 23,
            site: 'brave.com',
            verified: false,
            views: 1,
            weight: 100
          }
        }
      },
      siteSettings: {
        'https?://brave.com': {
          ledgerPayments: false
        }
      }
    })

    it('host settings is null, but publisher synopsis is valid', function () {
      let newState = state.set('siteSettings', Immutable.fromJS({}))
      const result = publisherUtil.enabledForPaymentsPublisher(newState, 'https://brave.com')
      assert.equal(result, true)
    })

    it('host settings is null, publisher synopsis is null, but auto include is on and exclude on off', function () {
      let newState = state.set('siteSettings', Immutable.fromJS({}))
      newState = newState.set('publisherInfo', Immutable.fromJS({}))
      const result = publisherUtil.enabledForPaymentsPublisher(newState, 'https://brave.com')
      assert.equal(result, true)
    })

    it('host settings is set and ledgerPayments is false', function () {
      const result = publisherUtil.enabledForPaymentsPublisher(state, 'https://brave.com')
      assert.equal(result, false)
    })

    it('host settings is set and ledgerPayments is true', function () {
      let newState = state.setIn(['siteSettings', 'https?://brave.com', 'ledgerPayments'], true)
      const result = publisherUtil.enabledForPaymentsPublisher(newState, 'https://brave.com')
      assert.equal(result, true)
    })
  })
})
