/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */
/* global describe, before, after, it */

const React = require('react')
const Immutable = require('immutable')
const mockery = require('mockery')
const {mount} = require('enzyme')
const sinon = require('sinon')
const assert = require('assert')
const fakeElectron = require('../../../../lib/fakeElectron')
require('../../../../braveUnit')

describe('UrlBarIcon component unit tests', function () {
  let UrlBarIcon, windowActions, windowStore, appStore

  const tabId = 1
  const frameKey = 0

  const fakeAppStoreRenderer = Immutable.fromJS({
    windows: [{
      windowId: 1,
      windowUUID: 'uuid'
    }],
    tabs: [{
      tabId: tabId,
      windowId: 1,
      windowUUID: 'uuid',
      url: 'https://brave.com',
      messageBoxDetail: false
    }],
    tabsInternal: {
      index: {
        1: 0
      }
    }
  })

  const defaultWindowStore = Immutable.fromJS({
    activeFrameKey: frameKey,
    frames: [{
      key: frameKey,
      tabId: tabId,
      location: 'https://brave.com',
      security: {
        isSecure: true
      },
      navbar: {
        urlbar: {
          location: 'https://brave.com',
          active: false,
          searchDetail: {
            activateSearchEngine: true
          }
        }
      },
      title: 'Brave Software'
    }],
    tabs: [{
      key: frameKey
    }]
  })

  before(function () {
    mockery.enable({
      warnOnReplace: false,
      warnOnUnregistered: false,
      useCleanCache: true
    })
    mockery.registerMock('electron', fakeElectron)
    windowActions = require('../../../../../../js/actions/windowActions')
    windowStore = require('../../../../../../js/stores/windowStore')
    appStore = require('../../../../../../js/stores/appStoreRenderer')
    UrlBarIcon = require('../../../../../../app/renderer/components/navigation/urlBarIcon')
  })

  after(function () {
    mockery.disable()
  })

  function getIcon (wrapper) {
    const icons = wrapper.find('[data-test-id="urlBarIcon"]')
    assert.equal(icons.length, 1, 'icon found')
    return icons.first()
  }

  describe('general things', function () {
    before(function () {
      appStore.state = fakeAppStoreRenderer
      windowStore.state = defaultWindowStore
    })

    it('sets element as draggable', function () {
      const wrapper = mount(<UrlBarIcon titleMode />)
      const icon = getIcon(wrapper)
      assert.equal(icon.props()['draggable'], true)
    })

    it('shows site information when clicked', function () {
      const spy = sinon.spy(windowActions, 'setSiteInfoVisible')
      const wrapper = mount(<UrlBarIcon titleMode />)
      wrapper.find('[data-test-id="urlBarIcon"]').simulate('click')
      assert.equal(spy.calledOnce, true)
      windowActions.setSiteInfoVisible.restore()
    })
  })

  describe('when user is searching', function () {
    before(function () {
      appStore.state = fakeAppStoreRenderer
      windowStore.state = defaultWindowStore.setIn(['frames', 0, 'navbar', 'urlbar', 'location'], 'https://clifton.io')
    })

    it('does not show site information when clicked', function () {
      const spy = sinon.spy(windowActions, 'setSiteInfoVisible')
      const wrapper = mount(<UrlBarIcon titleMode={false} />)
      wrapper.find('[data-test-id="urlBarIcon"]').simulate('click')
      assert.equal(spy.notCalled, true)
      windowActions.setSiteInfoVisible.restore()
    })
  })

  describe('when active tab is showing a message box', function () {
    before(function () {
      appStore.state = fakeAppStoreRenderer.setIn(['tabs', 0, 'messageBoxDetail'], true)
      windowStore.state = defaultWindowStore
    })

    it('does not set element as draggable', function () {
      const wrapper = mount(<UrlBarIcon titleMode />)
      const icon = getIcon(wrapper)
      assert.equal(icon.props()['draggable'], null)
    })

    it('does not respond to clicks', function () {
      const spy = sinon.spy(windowActions, 'setSiteInfoVisible')
      const wrapper = mount(<UrlBarIcon titleMode />)
      wrapper.find('[data-test-id="urlBarIcon"]').simulate('click')
      assert.equal(spy.notCalled, true)
      windowActions.setSiteInfoVisible.restore()
    })
  })
})
