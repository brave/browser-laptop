/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */
/* global describe, before, after, it */

require('../../../../braveUnit')
const mockery = require('mockery')
const {mount} = require('enzyme')
const assert = require('assert')
const Immutable = require('immutable')
let Navigator, windowStore, appStore
let settingDefaultValue = true

const defaultWindowStore = Immutable.fromJS({
  activeFrameKey: 0,
  frames: [{
    key: 0,
    tabId: 1,
    location: 'http://brave.com',
    title: 'Brave',
    adBlock: {
      blocked: ['a', 'b', 'c']
    }
  }],
  tabs: []
})

const appStoreRenderer = Immutable.fromJS({
  extensions: {
  },
  settings: {
  },
  siteSettings: {
    'https?://brave.com': {
      example3: true
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

const fakeWindowState = {
  shouldAllowWindowDrag: () => false
}

const fakeCurrentWindow = {
  isMaximized: () => false,
  isFullScreen: () => false,
  isFocused: () => false,
  getCurrentWindowId: () => 1
}

describe('Navigator component unit tests', function () {
  before(function () {
    mockery.enable({
      warnOnReplace: false,
      warnOnUnregistered: false,
      useCleanCache: true
    })
    mockery.registerMock('../../extensions/brave/img/urlbar/browser_URL_fund_no_verified.svg', {})
    mockery.registerMock('../../extensions/brave/img/urlbar/browser_URL_fund_yes_verified.svg', {})
    mockery.registerMock('../../extensions/brave/img/urlbar/browser_URL_fund_no.svg', {})
    mockery.registerMock('../../extensions/brave/img/urlbar/browser_URL_fund_yes.svg', {})
    mockery.registerMock('../../extensions/brave/img/tabs/new_session.svg')
    mockery.registerMock('../../../extensions/brave/img/caret_down_grey.svg')
    mockery.registerMock('../../../../img/url-bar-no-script.svg', {})
    mockery.registerMock('electron', require('../../../../lib/fakeElectron'))
    mockery.registerMock('../../../common/state/windowState', fakeWindowState)
    mockery.registerMock('../../currentWindow', fakeCurrentWindow)
    mockery.registerMock('./navigationBar', () => null)
    mockery.registerMock('../../../../js/state/frameStateUtil', {
      getActiveFrame: () => defaultWindowStore.getIn(['frames', 0]),
      getTotalBlocks: () => 2
    })
    mockery.registerMock('../../../common/state/shieldState', {
      braveShieldsEnabled: () => true
    })

    mockery.registerMock('../../../../js/settings', {
      getSetting: () => {
        return settingDefaultValue
      }
    })
    mockery.registerMock('../../../../../js/l10n', {
      translation: (token) => token
    })
    appStore = require('../../../../../../js/stores/appStoreRenderer')
    windowStore = require('../../../../../../js/stores/windowStore')
    Navigator = require('../../../../../../app/renderer/components/navigation/navigator')
  })

  after(function () {
    mockery.deregisterAll()
    mockery.disable()
  })

  describe('when user has history going forwards and backwards', function () {
    let wrapper

    before(function () {
      appStore.state = appStoreRenderer
      windowStore.state = defaultWindowStore
      wrapper = mount(<Navigator />)
    })

    it('both back/forward buttons are enabled', function () {
      assert.equal(wrapper.find('[data-test-id="navigationBackButtonEnabled"]').length, 1)
      assert.equal(wrapper.find('[data-test-id="navigationForwardButtonEnabled"]').length, 1)
    })

    it('back navigation button is enabled', function () {
      assert.equal(wrapper.find('[data-test-id="navigationBackButtonEnabled"]').length, 1)
    })

    it('forward navigation button is enabled', function () {
      assert.equal(wrapper.find('[data-test-id="navigationForwardButtonEnabled"]').length, 1)
    })
  })

  describe('when active tab is showing a message box', function () {
    let wrapper

    before(function () {
      const appState2 = appStoreRenderer.mergeIn(['tabs', 0], {
        messageBoxDetail: {
          message: 'sample message',
          title: 'sample title'
        }
      })

      appStore.state = appState2
      windowStore.state = defaultWindowStore
      wrapper = mount(<Navigator />)
    })

    it('disables both back/forward buttons', function () {
      assert.equal(wrapper.find('[data-test-id="navigationBackButtonDisabled"]').length, 1)
      assert.equal(wrapper.find('[data-test-id="navigationForwardButtonDisabled"]').length, 1)
    })

    it('disables the back navigation button', function () {
      assert.equal(wrapper.find('[data-test-id="navigationBackButtonDisabled"]').length, 1)
    })

    it('disables the forward navigation button', function () {
      assert.equal(wrapper.find('[data-test-id="navigationForwardButtonDisabled"]').length, 1)
    })

    it('disables the lion icon', function () {
      const node = wrapper.find('[data-test-id="braveMenuDisabled shield-down-false"]').getDOMNode()
      assert.equal(node.disabled, true)
    })
  })
})
