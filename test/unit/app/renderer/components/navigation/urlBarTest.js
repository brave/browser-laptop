/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */
/* global describe, before, after, it */

const React = require('react')
const mockery = require('mockery')
const {shallow} = require('enzyme')
const assert = require('assert')
const Immutable = require('immutable')
let UrlBar, UrlBarIcon
require('../../../../braveUnit')

describe('UrlBar component unit tests', function () {
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
    mockery.registerMock('electron', require('../../../../lib/fakeElectron'))
    UrlBar = require('../../../../../../app/renderer/components/navigation/urlBar')
    UrlBarIcon = require('../../../../../../app/renderer/components/navigation/urlBarIcon')
  })

  after(function () {
    mockery.disable()
  })

  const props = {
    activeFrameKey: 1,
    canGoForward: false,
    searchDetail: undefined,
    loading: false,
    location: 'https://brave.com',
    title: 'UrlBar unit test',
    history: undefined,
    isSecure: true,
    hasLocationValueSuffix: undefined,
    startLoadTime: undefined,
    endLoadTime: undefined,
    titleMode: true,
    urlbar: Immutable.fromJS({
      active: true
    }),
    onStop: undefined,
    menubarVisible: false,
    noBorderRadius: undefined,
    activeTabShowingMessageBox: false
  }

  describe('passing properties through (without changing them) to UrlBarIcon', function () {
    let urlBarIcon

    before(function () {
      const wrapper = shallow(
        <UrlBar {...props} />
      )
      urlBarIcon = wrapper.find(UrlBarIcon).node
    })

    it('passes isSecure', function () {
      assert.equal(urlBarIcon.props.isSecure, props.isSecure)
    })

    it('passes loading', function () {
      assert.equal(urlBarIcon.props.loading, props.loading)
    })

    it('passes title', function () {
      assert.equal(urlBarIcon.props.title, props.title)
    })

    it('passes titleMode', function () {
      assert.equal(urlBarIcon.props.titleMode, props.titleMode)
    })

    it('passes activeTabShowingMessageBox', function () {
      assert.equal(urlBarIcon.props.activeTabShowingMessageBox, props.activeTabShowingMessageBox)
    })
  })
})
