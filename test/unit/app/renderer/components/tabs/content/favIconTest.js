/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */
/* global describe, before, after, it */

const mockery = require('mockery')
const {mount} = require('enzyme')
const assert = require('assert')
const Immutable = require('immutable')
const fakeElectron = require('../../../../../lib/fakeElectron')
require('../../../../../braveUnit')

const index = 0
const tabId = 1
const frameKey = 1

const fakeAppStoreRenderer = Immutable.fromJS({
  windows: [{
    windowId: 1,
    windowUUID: 'uuid'
  }],
  tabs: [{
    tabId: tabId,
    windowId: 1,
    windowUUID: 'uuid',
    url: 'https://brave.com'
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
    location: 'http://brave.com'
  }],
  tabs: [{
    key: frameKey,
    index: index
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

describe('Tabs content - Favicon', function () {
  let Favicon, windowStore, appStore

  before(function () {
    mockery.enable({
      warnOnReplace: false,
      warnOnUnregistered: false,
      useCleanCache: true
    })
    mockery.registerMock('electron', fakeElectron)
    mockery.registerMock('../../../../extensions/brave/img/tabs/default.svg')
    mockery.registerMock('../../../../extensions/brave/img/tabs/loading.svg')
    windowStore = require('../../../../../../../js/stores/windowStore')
    appStore = require('../../../../../../../js/stores/appStoreRenderer')
    Favicon = require('../../../../../../../app/renderer/components/tabs/content/favicon')
    appStore.state = fakeAppStoreRenderer
  })

  after(function () {
    mockery.deregisterAll()
    mockery.disable()
  })

  describe('loading icon', function () {
    it('shows when tab is loading', function * () {
      windowStore.state = defaultWindowStore.mergeIn(['frames', 0], {
        icon: 'winter-is-coming.jpg',
        loading: true
      })
      const wrapper = mount(<Favicon tabId={tabId} />)
      assert.equal(wrapper.find('TabIcon').props()['data-test-id'], 'loading')
    })
    it('does not show when tab is not loading', function * () {
      windowStore.state = defaultWindowStore.mergeIn(['frames', 0], {
        icon: 'winter-is-coming.jpg',
        loading: false
      })
      const wrapper = mount(<Favicon tabId={tabId} />)
      assert.notEqual(wrapper.find('TabIcon').props()['data-test-id'], 'loading')
      assert.equal(wrapper.find('TabIcon').props()['data-test-id'], 'winter-is-coming.jpg')
    })
  })
  describe('default icon', function () {
    it('shows when tab has no icon', function * () {
      windowStore.state = defaultWindowStore.mergeIn(['frames', 0], {
        icon: null,
        loading: false
      })
      const wrapper = mount(<Favicon tabId={tabId} />)
      assert.equal(wrapper.find('TabIcon').props()['data-test-id'], 'defaultIcon')
    })
    it('does not show when tab has an icon', function * () {
      windowStore.state = defaultWindowStore.mergeIn(['frames', 0], {
        icon: 'the-night-is-dark-and-full-of-terror.jpg',
        loading: false
      })
      const wrapper = mount(<Favicon tabId={tabId} />)
      assert.notEqual(wrapper.find('TabIcon').props()['data-test-id'], 'defaultIcon')
    })
  })
  describe('favicon', function () {
    it('shows if page has a favicon', function * () {
      windowStore.state = defaultWindowStore.mergeIn(['frames', 0], {
        icon: 'bbondy-king-of-the-north.jpg',
        loading: false
      })
      const wrapper = mount(<Favicon tabId={tabId} />)
      assert.equal(wrapper.find('TabIcon').props()['data-test-id'], 'bbondy-king-of-the-north.jpg')
    })

    it('does not show if page is loading', function * () {
      windowStore.state = defaultWindowStore.mergeIn(['frames', 0], {
        icon: 'iron-throne-belongs-to-serg.jpg',
        loading: true
      })
      const wrapper = mount(<Favicon tabId={tabId} />)
      assert.notEqual(wrapper.find('TabIcon').props()['data-test-id'], 'iron-throne-belongs-to-serg.jpg')
      assert.equal(wrapper.find('TabIcon').props()['data-test-id'], 'loading')
    })

    it('does not show if page has no favicon', function * () {
      windowStore.state = defaultWindowStore.mergeIn(['frames', 0], {
        icon: null,
        loading: false
      })
      const wrapper = mount(<Favicon tabId={tabId} />)
      assert.notEqual(wrapper.find('TabIcon').props()['data-test-id'], null)
      assert.equal(wrapper.find('TabIcon').props()['data-test-id'], 'defaultIcon')
    })
  })
})
