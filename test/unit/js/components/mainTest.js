/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */
/* global describe, before, after, it */

const mockery = require('mockery')
const {shallow} = require('enzyme')
const assert = require('assert')
const Immutable = require('immutable')
let Main, NavigationBar
require('../../braveUnit')

describe('Main component unit tests', function () {
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
    mockery.registerMock('../../extensions/brave/img/caret_down_grey.svg', 'caret_down_grey.svg')
    mockery.registerMock('../../extensions/brave/img/tabs/new_session.svg')
    mockery.registerMock('electron', require('../../lib/fakeElectron'))
    Main = require('../../../../js/components/main')
    NavigationBar = require('../../../../app/renderer/components/navigation/navigationBar')
  })

  after(function () {
    mockery.disable()
  })

  const windowState = Immutable.fromJS({
    activeFrameKey: 0,
    frames: [{
      key: 0,
      tabId: 1,
      location: 'http://brave.com'
    }],
    tabs: []
  })

  const appState = Immutable.fromJS({
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
      tabId: 1,
      canGoBack: true,
      canGoForward: true
    }]
  })

  describe('when user has history going forwards and backwards', function () {
    let wrapper

    before(function () {
      wrapper = shallow(
        <Main windowState={windowState} appState={appState} />
      )
    })

    it('both back/forward navigationButtonContainers are enabled', function () {
      assert.equal(wrapper.find('div.backforward > div.navigationButtonContainer.disabled').length, 0)
    })

    it('back navigation button is enabled', function () {
      const node = wrapper.find('div.backforward > div.navigationButtonContainer > .backButton').node
      assert.equal(node.props.disabled, false)
    })

    it('forward navigation button is enabled', function () {
      const node = wrapper.find('div.backforward > div.navigationButtonContainer > .forwardButton').node
      assert.equal(node.props.disabled, false)
    })
  })

  describe('when active tab is showing a message box', function () {
    let wrapper

    before(function () {
      const appState2 = appState.mergeIn(['tabs', 0], {
        messageBoxDetail: {
          message: 'sample message',
          title: 'sample title'
        }
      })

      wrapper = shallow(
        <Main windowState={windowState} appState={appState2} />
      )
    })

    it('passes activeTabShowingMessageBox to NavigationBar', function () {
      const navigationBar = wrapper.find(NavigationBar).node
      assert.equal(navigationBar.props.activeTabShowingMessageBox, true)
    })

    it('disables both back/forward navigationButtonContainers', function () {
      assert.equal(wrapper.find('div.backforward > div.navigationButtonContainer.disabled').length, 2)
    })

    it('disables the back navigation button', function () {
      const node = wrapper.find('div.backforward > div.navigationButtonContainer > .backButton').node
      assert.equal(node.props.disabled, true)
    })

    it('disables the forward navigation button', function () {
      const node = wrapper.find('div.backforward > div.navigationButtonContainer > .forwardButton').node
      assert.equal(node.props.disabled, true)
    })

    it('disables the lion icon', function () {
      const node = wrapper.find('[testId="braveShieldButton"]').node
      assert.equal(node.props.disabled, true)
    })
  })

  describe('getTotalBlocks', function () {
    let instance

    before(function () {
      let wrapper = shallow(
        <Main windowState={windowState} appState={appState} />
      )
      instance = wrapper.instance()
    })

    it('returns false if there are no units blocked', function () {
      const frames = Immutable.fromJS({
        adblock: { blocked: [] },
        trackingProtection: { blocked: [] },
        noScript: { blocked: [] },
        fingerprintingProtection: { blocked: [] }
      })
      const result = instance.getTotalBlocks(frames)
      assert.equal(result, false)
    })

    it('returns total of items (ads / trackers / scripts / fingerprints) blocked', function () {
      const frames = Immutable.fromJS({
        adblock: { blocked: [1] },
        trackingProtection: { blocked: [1, 2] },
        noScript: { blocked: [1, 2, 3, 4] },
        fingerprintingProtection: { blocked: [1, 2, 3, 4, 5, 6, 7, 8] }
      })
      const result = instance.getTotalBlocks(frames)
      assert.equal(result, 15)
    })

    it('defaults values to 0 if element is not a list or is not present', function () {
      const frames = Immutable.fromJS({
        adblock: { blocked: 'not a list' },
        trackingProtection: {},
        noScript: { blocked: [1] },
        fingerprintingProtection: { blocked: {} }
      })
      const result = instance.getTotalBlocks(frames)
      assert.equal(result, 1)
    })

    it('returns false if the input is falsey', function () {
      assert.equal(instance.getTotalBlocks(), false)
      assert.equal(instance.getTotalBlocks(undefined), false)
      assert.equal(instance.getTotalBlocks(null), false)
      assert.equal(instance.getTotalBlocks(false), false)
    })

    it('converts the input to an immutable object', function () {
      const mutableFrames = {
        adblock: { blocked: [1] },
        trackingProtection: { blocked: [1, 2] },
        noScript: { blocked: [1, 2, 3, 4] },
        fingerprintingProtection: { blocked: [1, 2, 3, 4, 5, 6, 7, 8] }
      }
      const result = instance.getTotalBlocks(mutableFrames)
      assert.equal(result, 15)
    })

    it('returns "99+" if tracker count is > 99', function () {
      const mutableFrames = {
        adblock: { blocked: [] }
      }

      for (let i = 1; i < 101; i++) {
        mutableFrames.adblock.blocked.push(i)
      }

      const result = instance.getTotalBlocks(mutableFrames)
      assert.equal(result, '99+')
    })
  })
})
