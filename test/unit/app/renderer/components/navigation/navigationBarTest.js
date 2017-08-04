/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */
/* global describe, it, before, after */

const mockery = require('mockery')
const React = require('react')
const {mount} = require('enzyme')
const assert = require('assert')
const Immutable = require('immutable')
const fakeElectron = require('../../../../lib/fakeElectron')
require('../../../../braveUnit')

class urlBarFake extends React.Component {
  render () {
    return null
  }
}

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

describe('NavigationBar component', function () {
  let NavigationBar, windowStore, appStore

  before(function () {
    mockery.enable({
      warnOnReplace: false,
      warnOnUnregistered: false,
      useCleanCache: true
    })
    mockery.registerMock('electron', fakeElectron)
    mockery.registerMock('../../../js/settings', {
      getSetting: () => true
    })
    mockery.registerMock('../../../../img/url-bar-no-script.svg')
    mockery.registerMock('../../../extensions/brave/img/urlbar/browser_URL_fund_no_verified.svg')
    mockery.registerMock('../../../extensions/brave/img/urlbar/browser_URL_fund_yes_verified.svg')
    mockery.registerMock('../../../extensions/brave/img/urlbar/browser_URL_fund_no.svg')
    mockery.registerMock('../../../extensions/brave/img/urlbar/browser_URL_fund_yes.svg')
    mockery.registerMock('../../../extensions/brave/img/caret_down_grey.svg')
    mockery.registerMock('../../../../../img/toolbar/stoploading_btn.svg')
    mockery.registerMock('../../../../../img/toolbar/reload_btn.svg')
    mockery.registerMock('../../../../../img/toolbar/home_btn.svg')
    mockery.registerMock('../../../../../img/toolbar/bookmark_btn.svg')
    mockery.registerMock('../../../../../img/toolbar/bookmark_marked.svg')
    mockery.registerMock('../../../../app/extensions/brave/img/braveBtn.png')
    mockery.registerMock('../../../../app/extensions/brave/img/braveBtn2x.png')
    mockery.registerMock('../../../../app/extensions/brave/img/braveBtn3x.png')
    mockery.registerMock('../../../../app/extensions/brave/img/braveBtn_hover.png')
    mockery.registerMock('../../../../app/extensions/brave/img/braveBtn2x_hover.png')
    mockery.registerMock('../../../../app/extensions/brave/img/braveBtn3x_hover.png')
    mockery.registerMock('./urlBar', urlBarFake)
    windowStore = require('../../../../../../js/stores/windowStore')
    appStore = require('../../../../../../js/stores/appStoreRenderer')
    NavigationBar = require('../../../../../../app/renderer/components/navigation/navigationBar')
  })

  after(function () {
    mockery.disable()
  })

  describe('publisherToggle', function () {
    it('do not render if about page', function () {
      windowStore.state = defaultWindowStore.setIn(['frames', 0, 'location'], 'about:preferences')
      appStore.state = fakeAppState

      const wrapper = mount(<NavigationBar />)
      assert.equal(wrapper.find('PublisherToggle').length, 0)
    })

    it('do not render if publisher is permanently hidden', function () {
      windowStore.state = defaultWindowStore
      appStore.state = fakeAppState

      const wrapper = mount(<NavigationBar />)
      assert.equal(wrapper.find('PublisherToggle').length, 0)
    })

    it('render if ok', function () {
      windowStore.state = defaultWindowStore
      appStore.state = fakeAppState.setIn(['siteSettings', 'https?://brave.com', 'ledgerPaymentsShown'], true)

      const wrapper = mount(<NavigationBar />)
      assert.equal(wrapper.find('PublisherToggle').length, 1)
    })
  })
})
