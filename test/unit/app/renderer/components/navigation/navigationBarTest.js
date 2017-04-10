/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */
/* global describe, before, after, it */

const React = require('react')
const mockery = require('mockery')
const {shallow} = require('enzyme')
const assert = require('assert')
const Immutable = require('immutable')
let NavigationBar, UrlBar
require('../../../../braveUnit')

describe('NavigationBar component unit tests', function () {
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
    NavigationBar = require('../../../../../../app/renderer/components/navigation/navigationBar')
    UrlBar = require('../../../../../../app/renderer/components/navigation/urlBar')
  })

  after(function () {
    mockery.disable()
  })

  const props = {
    navbar: Immutable.fromJS({
      urlbar: {
        active: true
      }
    }),
    activeFrameKey: 1,
    canGoForward: false,
    searchDetail: {
      example: true
    },
    location: 'https://brave.com',
    title: 'UrlBar unit test',
    history: {
      example2: true
    },
    isSecure: true,
    siteSettings: Immutable.fromJS({
      'https?://brave.com': {
        example3: true
      }
    }),
    synopsis: [],
    activeTabShowingMessageBox: false
  }

  describe('passing properties through (without changing them) to UrlBar', function () {
    let urlBar

    before(function () {
      const wrapper = shallow(
        <NavigationBar {...props} />
      )
      urlBar = wrapper.find(UrlBar).node
    })

    it('passes activeFrameKey', function () {
      assert.equal(urlBar.props.activeFrameKey, props.activeFrameKey)
    })

    it('passes canGoForward', function () {
      assert.equal(urlBar.props.canGoForward, props.canGoForward)
    })

    it('passes searchDetail', function () {
      assert.deepEqual(urlBar.props.searchDetail, props.searchDetail)
    })

    it('passes location', function () {
      assert.equal(urlBar.props.location, props.location)
    })

    it('passes title', function () {
      assert.equal(urlBar.props.title, props.title)
    })

    it('passes history', function () {
      assert.equal(urlBar.props.history, props.history)
    })

    it('passes isSecure', function () {
      assert.equal(urlBar.props.isSecure, props.isSecure)
    })

    it('passes activeTabShowingMessageBox', function () {
      assert.equal(urlBar.props.activeTabShowingMessageBox, props.activeTabShowingMessageBox)
    })
  })
})
