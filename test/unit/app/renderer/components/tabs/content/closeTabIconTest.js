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
const invalidFrameKey = 71

const fakeAppStoreRenderer = {
  state: Immutable.fromJS({
    windows: [{
      windowId: 1,
      windowUUID: 'uuid'
    }],
    tabs: [{
      tabId: tabId,
      windowId: 1,
      windowUUID: 'uuid',
      url: 'https://brave.com'
    }]
  }),
  addChangeListener: () => {},
  removeChangeListener: () => {}
}

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
      hoverTabIndex: index
    }
  }
})

describe('Tabs content - CloseTabIcon', function () {
  let CloseTabIcon, windowStore

  before(function () {
    mockery.enable({
      warnOnReplace: false,
      warnOnUnregistered: false,
      useCleanCache: true
    })
    mockery.registerMock('electron', fakeElectron)
    mockery.registerMock('../../../js/stores/appStoreRenderer', fakeAppStoreRenderer)
    mockery.registerMock('../../../../extensions/brave/img/tabs/close_btn_hover.svg')
    mockery.registerMock('../../../../extensions/brave/img/tabs/close_btn_normal.svg')
    windowStore = require('../../../../../../../js/stores/windowStore')
    CloseTabIcon = require('../../../../../../../app/renderer/components/tabs/content/closeTabIcon')
  })

  after(function () {
    mockery.deregisterAll()
    mockery.disable()
  })

  describe('should show icon', function () {
    it('if mouse is over tab and breakpoint is default', function () {
      windowStore.state = defaultWindowStore.mergeIn(['frames', 0], {
        hoverState: true,
        breakpoint: 'default'
      })
      const wrapper = mount(<CloseTabIcon frameKey={frameKey} />)
      assert.equal(wrapper.find('TabIcon').props()['data-test2-id'], 'close-icon-on')
    })

    it('if mouse is over tab and breakpoint is large', function () {
      windowStore.state = defaultWindowStore.mergeIn(['frames', 0], {
        hoverState: true,
        breakpoint: 'large'
      })
      const wrapper = mount(<CloseTabIcon frameKey={frameKey} />)
      assert.equal(wrapper.find('TabIcon').props()['data-test2-id'], 'close-icon-on')
    })

    it('if tab size is largeMedium and tab is active', function () {
      windowStore.state = defaultWindowStore.mergeIn(['frames', 0], {
        hoverState: false,
        breakpoint: 'largeMedium'
      })
      const wrapper = mount(<CloseTabIcon frameKey={frameKey} />)
      assert.equal(wrapper.find('TabIcon').props()['data-test2-id'], 'close-icon-on')
    })

    it('if tab size is medium and tab is active', function () {
      windowStore.state = defaultWindowStore.mergeIn(['frames', 0], {
        hoverState: false,
        breakpoint: 'medium'
      })
      const wrapper = mount(<CloseTabIcon frameKey={frameKey} />)
      assert.equal(wrapper.find('TabIcon').props()['data-test2-id'], 'close-icon-on')
    })

    it('if tab size is mediumSmall and tab is active', function () {
      windowStore.state = defaultWindowStore.mergeIn(['frames', 0], {
        hoverState: false,
        breakpoint: 'mediumSmall'
      })
      const wrapper = mount(<CloseTabIcon frameKey={frameKey} />)
      assert.equal(wrapper.find('TabIcon').props()['data-test2-id'], 'close-icon-on')
    })

    it('if tab size is small and tab is active', function () {
      windowStore.state = defaultWindowStore.mergeIn(['frames', 0], {
        hoverState: false,
        breakpoint: 'small'
      })
      const wrapper = mount(<CloseTabIcon frameKey={frameKey} />)
      assert.equal(wrapper.find('TabIcon').props()['data-test2-id'], 'close-icon-on')
    })

    it('if tab size is extraSmall and tab is active', function () {
      windowStore.state = defaultWindowStore.mergeIn(['frames', 0], {
        hoverState: false,
        breakpoint: 'extraSmall'
      })
      const wrapper = mount(<CloseTabIcon frameKey={frameKey} />)
      assert.equal(wrapper.find('TabIcon').props()['data-test2-id'], 'close-icon-on')
    })

    it('passing in a frame key which does not exist does not fail', function () {
      windowStore.state = defaultWindowStore
      const wrapper = mount(<CloseTabIcon frameKey={invalidFrameKey} />)
      assert.equal(wrapper.find('TabIcon').props()['data-test2-id'], 'close-icon-off')
    })
  })

  describe('should not show icon', function () {
    it('if tab is pinned', function () {
      windowStore.state = defaultWindowStore.mergeIn(['frames', 0], {
        hoverState: true,
        pinnedLocation: true
      })
      const wrapper = mount(<CloseTabIcon frameKey={frameKey} />)
      assert.equal(wrapper.find('TabIcon').props()['data-test2-id'], 'close-icon-off')
    })

    it('if tab size is largeMedium and tab is not active', function () {
      windowStore.state = defaultWindowStore.merge({
        activeFrameKey: 0,
        frames: [{
          hoverState: true,
          breakpoint: 'largeMedium'
        }]
      })
      const wrapper = mount(<CloseTabIcon frameKey={frameKey} />)
      assert.equal(wrapper.find('TabIcon').props()['data-test2-id'], 'close-icon-off')
    })

    it('if tab size is medium and tab is not active', function () {
      windowStore.state = defaultWindowStore.merge({
        activeFrameKey: 0,
        frames: [{
          hoverState: true,
          breakpoint: 'medium'
        }]
      })
      const wrapper = mount(<CloseTabIcon frameKey={frameKey} />)
      assert.equal(wrapper.find('TabIcon').props()['data-test2-id'], 'close-icon-off')
    })

    it('if tab size is mediumSmall and tab is not active', function () {
      windowStore.state = defaultWindowStore.merge({
        activeFrameKey: 0,
        frames: [{
          hoverState: true,
          breakpoint: 'mediumSmall'
        }]
      })
      const wrapper = mount(<CloseTabIcon frameKey={frameKey} />)
      assert.equal(wrapper.find('TabIcon').props()['data-test2-id'], 'close-icon-off')
    })

    it('if tab size is small and tab is not active', function () {
      windowStore.state = defaultWindowStore.merge({
        activeFrameKey: 0,
        frames: [{
          hoverState: true,
          breakpoint: 'small'
        }]
      })
      const wrapper = mount(<CloseTabIcon frameKey={frameKey} />)
      assert.equal(wrapper.find('TabIcon').props()['data-test2-id'], 'close-icon-off')
    })

    it('if tab size is extraSmall and tab is not active', function () {
      windowStore.state = defaultWindowStore.merge({
        activeFrameKey: 0,
        frames: [{
          hoverState: true,
          breakpoint: 'extraSmall'
        }]
      })
      const wrapper = mount(<CloseTabIcon frameKey={frameKey} />)
      assert.equal(wrapper.find('TabIcon').props()['data-test2-id'], 'close-icon-off')
    })

    // TODO check what is going on
    it.skip('if tab size is the smallest size', function () {
      windowStore.state = defaultWindowStore.mergeIn(['frames', 0], {
        hoverState: true,
        breakpoint: 'extraSmall'
      })
      const wrapper = mount(<CloseTabIcon frameKey={frameKey} />)
      assert.equal(wrapper.find('TabIcon').props()['data-test2-id'], 'close-icon-off')
    })
  })
})
