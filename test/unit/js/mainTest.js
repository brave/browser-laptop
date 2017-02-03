/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */
/* global describe, before, after, it */

const mockery = require('mockery')
const {shallow} = require('enzyme')
const assert = require('assert')
const Immutable = require('immutable')
let Main, NavigationBar
require('../braveUnit')

describe('Main component', function () {
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
    mockery.registerMock('electron', require('../lib/fakeElectron'))
    Main = require('../../../js/components/main')
    NavigationBar = require('../../../js/components/navigationBar')
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
  })
})
