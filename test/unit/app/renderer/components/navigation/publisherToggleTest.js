/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */
/* global describe, it, before, after */

const mockery = require('mockery')
const {mount} = require('enzyme')
const assert = require('assert')
const Immutable = require('immutable')
const fakeElectron = require('../../../../lib/fakeElectron')
require('../../../../braveUnit')

describe('PublisherToggle component', function () {
  let PublisherToggle, windowStore, appStore

  const fakeAppState = Immutable.fromJS({
    locationInfo: {
      'https://brave.com': {
        exclude: false,
        publisher: 'brave.com',
        stickyP: false,
        timestamp: 1496942403068,
        verified: true
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
          publisherURL: 'https://brave.com',
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
        ledgerPayments: false,
        ledgerPaymentsShown: false
      }
    }
  })

  const defaultWindowStore = Immutable.fromJS({
    activeFrameKey: 0,
    frames: [{
      key: 0,
      tabId: 1,
      location: 'https://brave.com'
    }],
    tabs: [{
      key: 0
    }]
  })

  before(function () {
    mockery.enable({
      warnOnReplace: false,
      warnOnUnregistered: false,
      useCleanCache: true
    })
    mockery.registerMock('electron', fakeElectron)
    mockery.registerMock('../../../extensions/brave/img/urlbar/browser_URL_fund_no_verified.svg')
    mockery.registerMock('../../../extensions/brave/img/urlbar/browser_URL_fund_yes_verified.svg')
    mockery.registerMock('../../../extensions/brave/img/urlbar/browser_URL_fund_no.svg')
    mockery.registerMock('../../../extensions/brave/img/urlbar/browser_URL_fund_yes.svg')
    mockery.registerMock('../../../../js/settings', {
      getSetting: () => true
    })
    windowStore = require('../../../../../../js/stores/windowStore')
    appStore = require('../../../../../../js/stores/appStoreRenderer')
    PublisherToggle = require('../../../../../../app/renderer/components/navigation/publisherToggle')
  })

  after(function () {
    mockery.deregisterAll()
    mockery.disable()
  })

  describe('default behaviour (when autoSuggest is ON)', function () {
    it('Show as disabled if publisher is on exclusion list', function () {
      windowStore.state = defaultWindowStore
      appStore.state = fakeAppState.setIn(['locationInfo', 'https://brave.com', 'exclude'], true)

      const wrapper = mount(<PublisherToggle />)
      assert.equal(wrapper.find('[data-test-id="publisherToggle"]').length, 1)
      assert.equal(wrapper.find('button').props()['data-test-authorized'], false)
    })

    it('Show as verified if publisher is shown as verified on locationInfo list', function () {
      windowStore.state = defaultWindowStore
      appStore.state = fakeAppState
      const wrapper = mount(<PublisherToggle />)
      assert.equal(wrapper.find('[data-test-id="publisherToggle"]').length, 1)
      assert.equal(wrapper.find('button').props()['data-test-verified'], true)
    })
  })

  describe('user interaction behaviour', function () {
    it('show as enabled if ledgerPayments is true for that publisher', function () {
      windowStore.state = defaultWindowStore
      appStore.state = fakeAppState.setIn(['siteSettings', 'https?://brave.com', 'ledgerPayments'], true)

      const wrapper = mount(<PublisherToggle />)
      assert.equal(wrapper.find('[data-test-id="publisherToggle"]').length, 1)
      assert.equal(wrapper.find('button').props()['data-test-authorized'], true)
    })

    it('Show as disabled if ledgerPayments is false for that publisher', function () {
      windowStore.state = defaultWindowStore
      appStore.state = fakeAppState

      const wrapper = mount(<PublisherToggle />)
      assert.equal(wrapper.find('button').props()['data-test-authorized'], false)
    })
  })
})
