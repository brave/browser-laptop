/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

/* global describe, before, it, after */

const mockery = require('mockery')
const {mount} = require('enzyme')
const assert = require('assert')
const Immutable = require('immutable')
const fakeElectron = require('../../../../../lib/fakeElectron')
require('../../../../../braveUnit')

const url1 = 'https://brave.com'
const pageTitle1 = 'Brave Software'
const tabId = 1
const frameKey = 1
const invalidFrameKey = 71

const fakeAppStoreRenderer = Immutable.fromJS({
  windows: [{
    windowId: 1,
    windowUUID: 'uuid'
  }],
  tabs: [{
    tabId: tabId,
    windowId: 1,
    windowUUID: 'uuid',
    url: url1
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
    location: url1,
    title: pageTitle1
  }],
  tabs: [{
    key: frameKey
  }],
  framesInternal: {
    index: {
      1: 0
    },
    tabIndex: {
      1: 0
    }
  }
})

describe.skip('Tabs content - Title', function () {
  let Tab, windowStore, appStore

  before(function () {
    mockery.enable({
      warnOnReplace: false,
      warnOnUnregistered: false,
      useCleanCache: true
    })
    mockery.registerMock('electron', fakeElectron)
    mockery.registerMock('../../../../extensions/brave/img/tabs/loading.svg')
    mockery.registerMock('../../../../extensions/brave/img/tabs/new_session.svg')
    mockery.registerMock('../../../../extensions/brave/img/tabs/private.svg')
    mockery.registerMock('../../../../extensions/brave/img/tabs/close_btn_hover.svg')
    mockery.registerMock('../../../../extensions/brave/img/tabs/close_btn_normal.svg')
    windowStore = require('../../../../../../../js/stores/windowStore')
    appStore = require('../../../../../../../js/stores/appStoreRenderer')
    Tab = require('../../../../../../../app/renderer/components/tabs/tab')
    appStore.state = fakeAppStoreRenderer
  })

  after(function () {
    mockery.deregisterAll()
    mockery.disable()
  })

  describe('should show text', function () {
    it('if page has a title', function () {
      windowStore.state = defaultWindowStore.mergeIn(['frames', 0], {
        location: url1,
        title: pageTitle1
      })
      const wrapper = mount(<Tab frameKey={frameKey} />)
      assert.equal(wrapper.find('TabTitle div').text(), pageTitle1)
    })
    it('if breakpoint is default', function () {
      windowStore.state = defaultWindowStore.mergeIn(['frames', 0], {
        location: url1,
        title: pageTitle1,
        breakpoint: 'default'
      })
      const wrapper = mount(<Tab frameKey={frameKey} />)
      assert.equal(wrapper.find('TabTitle div').text(), pageTitle1)
    })
    it('if breakpoint is large', function () {
      windowStore.state = defaultWindowStore.mergeIn(['frames', 0], {
        location: url1,
        title: pageTitle1,
        breakpoint: 'large'
      })
      const wrapper = mount(<Tab frameKey={frameKey} />)
      assert.equal(wrapper.find('TabTitle div').text(), pageTitle1)
    })
    it('if breakpoint is medium', function () {
      windowStore.state = defaultWindowStore.mergeIn(['frames', 0], {
        location: url1,
        title: pageTitle1,
        breakpoint: 'medium'
      })
      const wrapper = mount(<Tab frameKey={frameKey} />)
      assert.equal(wrapper.find('TabTitle div').text(), pageTitle1)
    })
    it('if breakpoint is mediumSmall and tab is not active', function () {
      windowStore.state = defaultWindowStore.merge({
        activeFrameKey: 0,
        frames: [{
          location: url1,
          title: pageTitle1,
          breakpoint: 'mediumSmall'
        }]
      })
      const wrapper = mount(<Tab frameKey={frameKey} />)
      assert.equal(wrapper.find('TabTitle div').text(), pageTitle1)
    })
    it('if breakpoint is small and tab is not active', function () {
      windowStore.state = defaultWindowStore.merge({
        activeFrameKey: 0,
        frames: [{
          location: url1,
          title: pageTitle1,
          breakpoint: 'small'
        }]
      })
      const wrapper = mount(<Tab frameKey={frameKey} />)
      assert.equal(wrapper.find('TabTitle div').text(), pageTitle1)
    })
    it('passing in a frame key which does not exist does not fail', function () {
      windowStore.state = defaultWindowStore
      const wrapper = mount(<Tab frameKey={invalidFrameKey} />)
      assert.equal(wrapper.find('TabTitle div').text(), '')
    })
  })

  describe('should not show text', function () {
    it('if tab is pinned', function () {
      windowStore.state = defaultWindowStore.mergeIn(['frames', 0], {
        location: url1,
        title: pageTitle1,
        pinnedLocation: true
      })
      appStore.state = fakeAppStoreRenderer.setIn(['tabs', 0, 'pinned'], true)
      const wrapper = mount(<Tab frameKey={frameKey} />)
      assert.equal(wrapper.find('TabTitle').length, 0)
    })
    it('if breakpoint is mediumSmall and tab is active', function () {
      windowStore.state = defaultWindowStore.mergeIn(['frames', 0], {
        location: url1,
        title: pageTitle1,
        breakpoint: 'mediumSmall'
      })
      const wrapper = mount(<Tab frameKey={frameKey} />)
      assert.equal(wrapper.find('TabTitle').length, 0)
    })
    it('if breakpoint is small and tab is active', function () {
      windowStore.state = defaultWindowStore.mergeIn(['frames', 0], {
        location: url1,
        title: pageTitle1,
        breakpoint: 'small'
      })
      const wrapper = mount(<Tab frameKey={frameKey} />)
      assert.equal(wrapper.find('TabTitle').length, 0)
    })
    it('if breakpoint is extraSmall', function () {
      windowStore.state = defaultWindowStore.mergeIn(['frames', 0], {
        location: url1,
        title: pageTitle1,
        breakpoint: 'extraSmall'
      })
      const wrapper = mount(<Tab frameKey={frameKey} />)
      assert.equal(wrapper.find('TabTitle').length, 0)
    })
    it('if breakpoint is the smallest', function () {
      windowStore.state = defaultWindowStore.mergeIn(['frames', 0], {
        location: url1,
        title: pageTitle1,
        breakpoint: 'smallest'
      })
      const wrapper = mount(<Tab frameKey={frameKey} />)
      assert.equal(wrapper.find('TabTitle').length, 0)
    })
  })
})
