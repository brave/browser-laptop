/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */
/* global describe, before, after, it */

const mockery = require('mockery')
const {mount} = require('enzyme')
const assert = require('assert')
const Immutable = require('immutable')
const fakeElectron = require('../../../../lib/fakeElectron')

let UrlBar, windowStore, appStore

const defaultWindowStore = Immutable.fromJS({
  activeFrameKey: 0,
  frames: [{
    key: 0,
    tabId: 1,
    location: 'http://brave.com',
    title: 'Brave'
  }],
  tabs: []
})

const fakeAppState = Immutable.fromJS({
  ledger: {
    synopsis: {
      'brave.com': {
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
      ledgerPaymentsShown: false
    }
  },
  tabs: [{
    active: true,
    tabId: 1,
    canGoBack: true,
    canGoForward: true,
    windowId: 1
  }],
  tabsInternal: {
    index: {
      1: 0
    }
  },
  windows: []
})

describe('UrlBar component', function () {
  before(function () {
    mockery.enable({
      warnOnReplace: false,
      warnOnUnregistered: false,
      useCleanCache: true
    })
    mockery.registerMock('../../../../img/url-bar-no-script.svg', {})
    mockery.registerMock('../../../common/lib/suggestion', {
      getNormalizedSuggestion: () => 'github.com',
      normalizeLocation: () => 'h'
    })
    mockery.registerMock('electron', fakeElectron)
    appStore = require('../../../../../../js/stores/appStoreRenderer')
    windowStore = require('../../../../../../js/stores/windowStore')
    UrlBar = require('../../../../../../app/renderer/components/navigation/urlBar')
  })

  after(function () {
    mockery.disable()
  })

  describe(`Url Bar`, function () {
    let wrapper

    before(function () {
      appStore.state = fakeAppState
      windowStore.state = defaultWindowStore
      wrapper = mount(<UrlBar />)
    })

    describe('updateAutocomplete', function () {
      it('updates input url on autocomplete call', function () {
        wrapper.find('input').simulate('keyPress', { which: 104 })
        assert.equal(wrapper.find('UrlBar').nodes[0].urlInput.value, 'github.com')
      })
    })
  })
})
