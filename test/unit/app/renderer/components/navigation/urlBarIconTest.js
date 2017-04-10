/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */
/* global describe, before, after, it */

const React = require('react')
const mockery = require('mockery')
const {mount} = require('enzyme')
const sinon = require('sinon')
const assert = require('assert')
let UrlBarIcon, windowActions
require('../../../../braveUnit')

describe('UrlBarIcon component unit tests', function () {
  before(function () {
    mockery.enable({
      warnOnReplace: false,
      warnOnUnregistered: false,
      useCleanCache: true
    })
    mockery.registerMock('electron', require('../../../../lib/fakeElectron'))
    UrlBarIcon = require('../../../../../../app/renderer/components/navigation/urlBarIcon')
    windowActions = require('../../../../../../js/actions/windowActions')
  })

  after(function () {
    mockery.disable()
  })

  const props = {
    activateSearchEngine: false,
    active: false,
    isSecure: true,
    isHTTPPage: true,
    loading: false,
    location: 'https://brave.com/',
    title: 'UrlBarIcon unit test',
    titleMode: true,
    isSearching: false,
    activeTabShowingMessageBox: false
  }

  it('sets element as draggable', function () {
    const wrapper = mount(
      <UrlBarIcon {...props} />
    )
    assert.equal(wrapper.find('span[draggable]').length, 1)
  })

  it('shows site information when clicked', function () {
    const spy = sinon.spy(windowActions, 'setSiteInfoVisible')
    const wrapper = mount(
      <UrlBarIcon {...props} />
    )
    wrapper.find('span').simulate('click')
    assert.equal(spy.calledOnce, true)
    windowActions.setSiteInfoVisible.restore()
  })

  describe('when active tab is showing a message box', function () {
    const props2 = Object.assign({}, props)

    before(function () {
      props2.activeTabShowingMessageBox = true
    })

    it('does not set element as draggable', function () {
      const wrapper = mount(
        <UrlBarIcon {...props2} />
      )
      assert.equal(wrapper.find('span[draggable]').length, 0)
    })

    it('does not respond to clicks', function () {
      const spy = sinon.spy(windowActions, 'setSiteInfoVisible')
      const wrapper = mount(
        <UrlBarIcon {...props2} />
      )
      wrapper.find('span').simulate('click')
      assert.equal(spy.notCalled, true)
      windowActions.setSiteInfoVisible.restore()
    })
  })
})
