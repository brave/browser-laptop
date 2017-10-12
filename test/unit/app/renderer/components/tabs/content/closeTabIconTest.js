/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */
/* global describe, before, after, it */

const mockery = require('mockery')
const {mount} = require('enzyme')
const assert = require('assert')
const Immutable = require('immutable')
const fakeElectron = require('../../../../../lib/fakeElectron')
const {intersection} = require('../../../../../../../app/renderer/components/styles/global')
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

describe('Tabs content - CloseTabIcon', function () {
  let CloseTabIcon, windowStore, appStore

  before(function () {
    mockery.enable({
      warnOnReplace: false,
      warnOnUnregistered: false,
      useCleanCache: true
    })
    mockery.registerMock('electron', fakeElectron)
    mockery.registerMock('../../../../extensions/brave/img/tabs/close_btn.svg')
    windowStore = require('../../../../../../../js/stores/windowStore')
    appStore = require('../../../../../../../js/stores/appStoreRenderer')
    CloseTabIcon = require('../../../../../../../app/renderer/components/tabs/content/closeTabIcon')
    appStore.state = fakeAppStoreRenderer
  })

  after(function () {
    mockery.deregisterAll()
    mockery.disable()
  })

  describe('should show icon', function () {
    it('if not intersected and tab is hovered', function * () {
      windowStore.state = defaultWindowStore.mergeIn(['ui', 'tabs'], {
        intersectionRatio: intersection.noIntersection,
        hoverTabIndex: index
      })
      const wrapper = mount(<CloseTabIcon tabId={tabId} />)
      assert.equal(wrapper.find('TabIcon').length, 1)
    })

    it('if intersection is at less than 75% size and tab is active', function * () {
      windowStore.state = defaultWindowStore
        .setIn(['ui', 'tabs', 'intersectionRatio'], intersection.at75)
      const wrapper = mount(<CloseTabIcon tabId={tabId} />)
      assert.equal(wrapper.find('TabIcon').length, 1)
    })
  })

  describe('should not show icon', function () {
    it('if tab is intersected at 15% size or less', function * () {
      windowStore.state = defaultWindowStore
        .setIn(['ui', 'tabs', 'intersectionRatio', intersection.at20])
      const wrapper = mount(<CloseTabIcon tabId={tabId} />)
      assert.equal(wrapper.find('TabIcon').length, 0)
    })

    it('if not intersected and tab is not hovered', function * () {
      windowStore.state = defaultWindowStore.mergeIn(['ui', 'tabs'], {
        intersectionRatio: intersection.noIntersection,
        hoverTabIndex: 1337
      })
      const wrapper = mount(<CloseTabIcon tabId={tabId} />)
      assert.equal(wrapper.find('TabIcon').length, 0)
    })

    it('if intersection is at less than 75% size and tab is not active', function * () {
      windowStore.state = defaultWindowStore
        .set('activeFrameKey', 1337)
        .setIn(['ui', 'tabs', 'intersectionRatio'], intersection.at45)
      const wrapper = mount(<CloseTabIcon tabId={tabId} />)
      assert.equal(wrapper.find('TabIcon').length, 0)
    })
  })
})
