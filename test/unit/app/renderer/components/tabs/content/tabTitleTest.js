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
  },
  ui: {
    tabs: {
      tabHoverState: 1
    }
  }
})

describe('Tabs content - TabTitle', function () {
  let TabTitle, windowStore, appStore
  before(function () {
    mockery.enable({
      warnOnReplace: false,
      warnOnUnregistered: false,
      useCleanCache: true
    })
    mockery.registerMock('electron', fakeElectron)
    mockery.registerMock('../../../../js/l10n', { translation: () => 'translated' })
    mockery.registerMock('../../../../extensions/brave/img/tabs/private.svg')
    windowStore = require('../../../../../../../js/stores/windowStore')
    appStore = require('../../../../../../../js/stores/appStoreRenderer')
    TabTitle = require('../../../../../../../app/renderer/components/tabs/content/tabTitle')
    appStore.state = fakeAppStoreRenderer
  })

  after(function () {
    mockery.deregisterAll()
    mockery.disable()
  })

  describe('should show icon', function () {
    it('if is not intersected at 35% of tab size', function * () {
      windowStore.state = defaultWindowStore
        .set('activeFrameKey', 1337)
        .setIn(['ui', 'tabs', 'intersectionRatio'], intersection.at60)
        .mergeIn(['frames', index], {
          isPrivate: false,
          partitionNumber: false
        })
      const wrapper = mount(<TabTitle tabId={tabId} />)
      assert.equal(wrapper.find('TabTitle').props().showTabTitle, true)
    })

    it('if not active and intersected at 45% of tab size with no private icon visible', function * () {
      windowStore.state = defaultWindowStore
        .set('activeFrameKey', 1337)
        .setIn(['ui', 'tabs', 'intersectionRatio'], intersection.at45)
        .setIn(['frames', index, 'isPrivate'], false)
      const wrapper = mount(<TabTitle tabId={tabId} />)
      assert.equal(wrapper.find('TabTitle').props().showTabTitle, true)
    })

    it('if not active and intersected at 45% of tab size with no partition icon visible', function * () {
      windowStore.state = defaultWindowStore
        .set('activeFrameKey', 1337)
        .setIn(['ui', 'tabs', 'intersectionRatio'], intersection.at45)
        .setIn(['frames', index, 'partitionNumber'], null)
      const wrapper = mount(<TabTitle tabId={tabId} />)
      assert.equal(wrapper.find('TabTitle').props().showTabTitle, true)
    })

    it('if is intersected at 45% of tab size and is about:newtab', function * () {
      windowStore.state = defaultWindowStore
        .set('activeFrameKey', 1337)
        .setIn(['ui', 'tabs', 'intersectionRatio'], intersection.at45)
        .setIn(['frames', index, 'location'], 'about:newtab')
      const wrapper = mount(<TabTitle tabId={tabId} />)
      assert.equal(wrapper.find('TabTitle').props().showTabTitle, true)
    })

    it('if is intersected at 45% of tab size and is not active', function * () {
      windowStore.state = defaultWindowStore
        .set('activeFrameKey', 1337)
        .setIn(['ui', 'tabs', 'intersectionRatio'], intersection.at45)
      const wrapper = mount(<TabTitle tabId={tabId} />)
      assert.equal(wrapper.find('TabTitle').props().showTabTitle, true)
    })
  })

  describe('should not show icon', function () {
    it('if is intersected at 35% of tab size', function * () {
      windowStore.state = defaultWindowStore
        .setIn(['ui', 'tabs', 'intersectionRatio'], intersection.at40)
      const wrapper = mount(<TabTitle tabId={tabId} />)
      assert.equal(wrapper.find('TabTitle').props().showTabTitle, false)
    })

    it('if active and intersected at 45% of tab size', function * () {
      windowStore.state = defaultWindowStore
        .setIn(['ui', 'tabs', 'intersectionRatio'], intersection.at45)
      const wrapper = mount(<TabTitle tabId={tabId} />)
      assert.equal(wrapper.find('TabTitle').props().showTabTitle, false)
    })

    it('if not active and intersected at 45% of tab size with partition icon visible', function * () {
      windowStore.state = defaultWindowStore
        .set('activeFrameKey', 1337)
        .setIn(['ui', 'tabs', 'intersectionRatio'], intersection.at45)
        .setIn(['frames', index, 'partitionNumber'], 1)
      const wrapper = mount(<TabTitle tabId={tabId} />)
      assert.equal(wrapper.find('TabTitle').props().showTabTitle, false)
    })

    it('if not active and intersected at 45% of tab size with private icon visible', function * () {
      windowStore.state = defaultWindowStore
        .set('activeFrameKey', 1337)
        .setIn(['ui', 'tabs', 'intersectionRatio'], intersection.at45)
        .setIn(['frames', index, 'isPrivate'], true)
      const wrapper = mount(<TabTitle tabId={tabId} />)
      assert.equal(wrapper.find('TabTitle').props().showTabTitle, false)
    })
  })
})
