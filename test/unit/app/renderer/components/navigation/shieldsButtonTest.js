/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */
/* global describe, before, after, it */

require('../../../../braveUnit')
const mockery = require('mockery')
const {mount} = require('enzyme')
const assert = require('assert')
const Immutable = require('immutable')
let ShieldsButton, windowStore, appStore
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

describe('ShieldsButton component', function () {
  before(function () {
    mockery.enable({
      warnOnReplace: false,
      warnOnUnregistered: false,
      useCleanCache: true
    })
    mockery.registerMock('electron', require('../../../../lib/fakeElectron'))
    mockery.registerMock('../../../common/state/windowState', fakeWindowState)
    mockery.registerMock('../../currentWindow', fakeCurrentWindow)
    mockery.registerMock('./navigationBar', () => null)
    const fakeFrameStateUtil = {
      getActiveFrame: () => defaultWindowStore.getIn(['frames', 0]),
      getTotalBlocks: () => 2
    }
    mockery.registerMock('../../../../../js/state/frameStateUtil', fakeFrameStateUtil)
    mockery.registerMock('../../../../js/state/frameStateUtil', fakeFrameStateUtil)
    mockery.registerMock('../../../common/state/shieldState', {
      braveShieldsEnabled: () => true
    })

    mockery.registerMock('../../../../../js/settings', {
      getSetting: () => {
        return settingDefaultValue
      }
    })
    mockery.registerMock('../../../../../js/l10n', {
      translation: (token) => token
    })
    appStore = require('../../../../../../js/stores/appStoreRenderer')
    windowStore = require('../../../../../../js/stores/windowStore')
    appStore.state = appStoreRenderer
    windowStore.state = defaultWindowStore
    ShieldsButton = require('../../../../../../app/renderer/components/navigation/buttons/shieldsButton')
  })

  after(function () {
    mockery.deregisterAll()
    mockery.disable()
  })

  it('lion icon is shown by default', function () {
    const wrapper = mount(<ShieldsButton />)
    const node = wrapper.find('[data-test-id="braveMenu shield-down-false"]').getDOMNode()
    assert.equal(node.disabled, false)
  })

  it('counter is shown by default', function () {
    const wrapper = mount(<ShieldsButton />)
    assert.equal(wrapper.find('[data-test-id="lionBadge"]').length, 1)
  })

  it('counter is not shown when disabled via settings', function () {
    settingDefaultValue = false
    const wrapper = mount(<ShieldsButton />)
    assert.equal(wrapper.find('[data-test-id="lionBadge"]').length, 0)
  })
})
