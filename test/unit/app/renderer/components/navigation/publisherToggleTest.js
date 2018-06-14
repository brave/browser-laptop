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
    ledger: {
      synopsis: {
        options: {
          scorekeeper: 'concave',
          'minPublisherDuration': 1,
          'minPublisherVisits': 0
        },
        publishers: {
          'brave.com': {
            scores: {
              concave: 1
            },
            duration: 623405,
            faviconURL: '',
            percentage: 100,
            publisherURL: 'https://brave.com',
            score: 9.365888800773842,
            site: 'brave.com',
            options: {
              verified: true
            },
            visits: 1,
            weight: 100
          },
          'orimi.com': {
            scores: {
              concave: 1
            },
            duration: 623405,
            faviconURL: '',
            percentage: 100,
            publisherURL: 'https://orimi.com',
            score: 9.365888800773842,
            site: 'orimi.com',
            options: {
              verified: true
            },
            visits: 1,
            weight: 100
          }
        }
      },
      locations: {
        'https://brave.com': {
          exclude: false,
          publisher: 'brave.com',
          stickyP: false,
          timestamp: 1496942403068,
          verified: true
        }
      }
    },
    siteSettings: {
      'https?://brave.com': {
        ledgerPayments: false,
        ledgerPaymentsShown: true
      }
    },
    settings: {
      'payments.enabled': true
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

  function getButton (wrapper, shouldExist = true) {
    const buttons = wrapper.find('[data-test-id="publisherButton"]')
    if (!shouldExist) {
      assert.equal(buttons.length, 0, 'button did not exist')
      return
    }
    assert.equal(buttons.length, 1, 'button existed')
    return buttons.first()
  }

  describe('default behaviour (when autoSuggest is ON)', function () {
    it('Show as unauthorized if publisher is on exclusion list', function () {
      windowStore.state = defaultWindowStore
      appStore.state = fakeAppState.setIn(['ledger', 'synopsis', 'publishers', 'brave.com', 'options', 'exclude'], true)
      const button = getButton(mount(<PublisherToggle />))

      assert.equal(button.props()['data-test-authorized'], false)
    })

    it('Show as verified if publisher is shown as verified on ledger locations list', function () {
      windowStore.state = defaultWindowStore
      appStore.state = fakeAppState
      const button = getButton(mount(<PublisherToggle />))

      assert.equal(button.props()['data-test-verified'], true)
    })
  })

  describe('user interaction behaviour', function () {
    it('show as enabled and authorized if ledgerPayments is true for that publisher', function () {
      windowStore.state = defaultWindowStore
      appStore.state = fakeAppState.setIn(['siteSettings', 'https?://brave.com', 'ledgerPayments'], true)
      const button = getButton(mount(<PublisherToggle />))

      assert.equal(button.props()['disabled'], false)
      assert.equal(button.props()['data-test-authorized'], true)
    })

    it('show as enabled and unauthorized if ledgerPayments is false for that publisher', function () {
      windowStore.state = defaultWindowStore
      appStore.state = fakeAppState.setIn(['siteSettings', 'https?://brave.com', 'ledgerPayments'], false)
      const button = getButton(mount(<PublisherToggle />))
      assert.equal(button.props()['disabled'], false)
      assert.equal(button.props()['data-test-authorized'], false)
    })

    it('Show as disabled if ledgerPaymentsShown is false for that publisher', function () {
      windowStore.state = defaultWindowStore
      appStore.state = fakeAppState.setIn(['siteSettings', 'https?://brave.com', 'ledgerPaymentsShown'], false)
      const button = getButton(mount(<PublisherToggle />))
      assert.equal(button.props()['disabled'], true)
    })

    it('Show as disabled for about pages', function () {
      windowStore.state = defaultWindowStore.setIn(['frames', 0, 'location'], 'about:preferences')
      appStore.state = fakeAppState
      const button = getButton(mount(<PublisherToggle />))
      assert.equal(button.props()['disabled'], true)
    })

    it('shows as disabled for file URLs', function () {
      windowStore.state = defaultWindowStore.setIn(['frames', 0, 'location'], 'file://test.txt')
      appStore.state = fakeAppState
      const button = getButton(mount(<PublisherToggle />))
      assert.equal(button.props()['disabled'], true)
    })

    it('shows as enabled for PDF URLs', function () {
      windowStore.state = defaultWindowStore.setIn(['frames', 0, 'location'], 'chrome-extension://jdbefljfgobbmcidnmpjamcbhnbphjnb/http://orimi.com/pdf-test.pdf')
      appStore.state = fakeAppState
      const button = getButton(mount(<PublisherToggle />))
      assert.equal(button.props()['disabled'], false)
    })
  })
})
