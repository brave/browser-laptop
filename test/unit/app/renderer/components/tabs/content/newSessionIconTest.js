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
    location: 'http://brave.com',
    partitionNumber: 1
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
  },
  ui: {
    tabs: {
      tabHoverState: 1
    }
  }
})

describe('Tabs content - NewSessionIcon', function () {
  let NewSessionIcon, windowStore, appStore

  before(function () {
    mockery.enable({
      warnOnReplace: false,
      warnOnUnregistered: false,
      useCleanCache: true
    })
    mockery.registerMock('electron', fakeElectron)
    mockery.registerMock('../../../../extensions/brave/img/tabs/new_session.svg')
    mockery.registerMock('../../../../../fonts/poppins.css')
    windowStore = require('../../../../../../../js/stores/windowStore')
    appStore = require('../../../../../../../js/stores/appStoreRenderer')
    NewSessionIcon = require('../../../../../../../app/renderer/components/tabs/content/newSessionIcon')
    appStore.state = fakeAppStoreRenderer
  })

  after(function () {
    mockery.deregisterAll()
    mockery.disable()
  })

  describe('should show icon', function () {
    it('if tab is not hovered', function * () {
      windowStore.state = defaultWindowStore
        .mergeIn(['ui', 'tabs'], {
          intersectionRatio: intersection.noIntersection,
          tabHoverIndex: 1337
        })
      const wrapper = mount(<NewSessionIcon tabId={tabId} />)
      assert.equal(wrapper.find('TabIcon').length, 1)
    })

    it('if tab is not active and size is small', function * () {
      windowStore.state = defaultWindowStore
        .mergeIn(['ui', 'tabs'], {
          tabHoverIndex: 1337,
          intersectionRatio: intersection.at45
        })
        .set('activeFrameKey', 1337)
      const wrapper = mount(<NewSessionIcon tabId={tabId} />)
      assert.equal(wrapper.find('TabIcon').length, 1)
    })
  })

  describe('should not show icon', function () {
    it('if tab is not partitioned', function * () {
      windowStore.state = defaultWindowStore
        .setIn(['frames', index, 'partitionNumber'], false)
      const wrapper = mount(<NewSessionIcon tabId={tabId} />)
      assert.equal(wrapper.find('TabIcon').length, 0)
    })

    it('if tab is being hovered', function * () {
      windowStore.state = defaultWindowStore
        .setIn(['ui', 'tabs', 'hoverTabIndex'], index)
      const wrapper = mount(<NewSessionIcon tabId={tabId} />)
      assert.equal(wrapper.find('TabIcon').length, 0)
    })

    it('if for active tab if size is small', function * () {
      windowStore.state = defaultWindowStore
        .setIn(['ui', 'tabs', 'intersectionRatio'], intersection.at45)
      const wrapper = mount(<NewSessionIcon tabId={tabId} />)
      assert.equal(wrapper.find('TabIcon').length, 0)
    })

    it('if tab is being intersected at 35% or less', function * () {
      windowStore.state = defaultWindowStore
      .setIn(['ui', 'tabs', 'intersectionRatio'], intersection.at20)
      const wrapper = mount(<NewSessionIcon tabId={tabId} />)
      assert.equal(wrapper.find('TabIcon').length, 0)
    })

    it('if partitionNumber is zero', function * () {
      windowStore.state = defaultWindowStore
        .setIn(['frames', index, 'partitionNumber'], 0)
      const wrapper = mount(<NewSessionIcon tabId={tabId} />)
      assert.equal(wrapper.find('TabIcon').length, 0)
    })
  })
})
