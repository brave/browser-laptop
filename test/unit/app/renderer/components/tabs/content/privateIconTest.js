/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */
/* global describe, before, after, it */

const mockery = require('mockery')
const {mount} = require('enzyme')
const Immutable = require('immutable')
const assert = require('assert')
const fakeElectron = require('../../../../../lib/fakeElectron')
require('../../../../../braveUnit')

const index = 0
const tabId = 1
const frameKey = 1

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
    index: index,
    key: frameKey
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

describe('Tabs content - PrivateIcon', function () {
  let Tab, windowStore

  before(function () {
    mockery.enable({
      warnOnReplace: false,
      warnOnUnregistered: false,
      useCleanCache: true
    })
    mockery.registerMock('electron', fakeElectron)
    mockery.registerMock('../../../js/stores/appStoreRenderer', fakeAppStoreRenderer)
    mockery.registerMock('../../../../extensions/brave/img/tabs/loading.svg')
    mockery.registerMock('../../../../extensions/brave/img/tabs/new_session.svg')
    mockery.registerMock('../../../../extensions/brave/img/tabs/private.svg')
    mockery.registerMock('../../../../extensions/brave/img/tabs/close_btn_hover.svg')
    mockery.registerMock('../../../../extensions/brave/img/tabs/close_btn_normal.svg')
    windowStore = require('../../../../../../../js/stores/windowStore')
    Tab = require('../../../../../../../app/renderer/components/tabs/tab')
  })

  after(function () {
    mockery.deregisterAll()
    mockery.disable()
  })

  describe('should show icon', function () {
    it('if current tab is private', function () {
      windowStore.state = defaultWindowStore.merge({
        activeFrameKey: 0,
        frames: [{
          isPrivate: true,
          breakpoint: 'default'
        }],
        ui: {
          tabs: {
            hoverTabIndex: null
          }
        }
      })
      const wrapper = mount(<Tab frameKey={frameKey} />)
      assert.equal(wrapper.find('PrivateIcon').length, 1)
    })

    it('if tab is not active and breakpoint is largeMedium', function () {
      windowStore.state = defaultWindowStore.merge({
        activeFrameKey: 0,
        frames: [{
          isPrivate: true,
          hoverState: false,
          breakpoint: 'largeMedium'
        }]
      })
      const wrapper = mount(<Tab frameKey={frameKey} />)
      assert.equal(wrapper.find('PrivateIcon').length, 1)
    })

    it('if mouse is not over tab and breakpoint is large', function () {
      windowStore.state = defaultWindowStore.merge({
        activeFrameKey: 0,
        frames: [{
          isPrivate: true,
          breakpoint: 'large'
        }],
        ui: {
          tabs: {
            hoverTabIndex: null
          }
        }
      })
      const wrapper = mount(<Tab frameKey={frameKey} />)
      assert.equal(wrapper.find('PrivateIcon').length, 1)
    })

    it('if mouse is not over tab and breakpoint is default', function () {
      windowStore.state = defaultWindowStore.merge({
        activeFrameKey: 0,
        frames: [{
          isPrivate: true,
          breakpoint: 'default'
        }],
        ui: {
          tabs: {
            hoverTabIndex: null
          }
        }
      })
      const wrapper = mount(<Tab frameKey={frameKey} />)
      assert.equal(wrapper.find('PrivateIcon').length, 1)
    })
  })

  describe('should not show icon', function () {
    it('if current tab is not private', function () {
      windowStore.state = defaultWindowStore.mergeIn(['frames', 0], {
        isPrivate: false
      })
      const wrapper = mount(<Tab frameKey={frameKey} />)
      assert.equal(wrapper.find('PrivateIcon').length, 0)
    })

    it('if mouse is over tab and breakpoint is default', function () {
      windowStore.state = defaultWindowStore.mergeIn(['frames', 0], {
        isPrivate: true,
        hoverState: true,
        breakpoint: 'default'
      })
      const wrapper = mount(<Tab frameKey={frameKey} />)
      assert.equal(wrapper.find('PrivateIcon').length, 0)
    })

    it('if mouse is over tab and breakpoint is large', function () {
      windowStore.state = defaultWindowStore.mergeIn(['frames', 0], {
        isPrivate: true,
        hoverState: true,
        breakpoint: 'large'
      })
      const wrapper = mount(<Tab frameKey={frameKey} />)
      assert.equal(wrapper.find('PrivateIcon').length, 0)
    })

    it('if tab is active and breakpoint is largeMedium', function () {
      windowStore.state = defaultWindowStore.mergeIn(['frames', 0], {
        isPrivate: true,
        hoverState: true,
        breakpoint: 'largeMedium'
      })
      const wrapper = mount(<Tab frameKey={frameKey} />)
      assert.equal(wrapper.find('PrivateIcon').length, 0)
    })

    it('if breakpoint is medium', function () {
      windowStore.state = defaultWindowStore.mergeIn(['frames', 0], {
        isPrivate: true,
        hoverState: false,
        breakpoint: 'medium'
      })
      const wrapper = mount(<Tab frameKey={frameKey} />)
      assert.equal(wrapper.find('PrivateIcon').length, 0)
    })

    it('if breakpoint is mediumSmall', function () {
      windowStore.state = defaultWindowStore.mergeIn(['frames', 0], {
        isPrivate: true,
        hoverState: false,
        breakpoint: 'mediumSmall'
      })
      const wrapper = mount(<Tab frameKey={frameKey} />)
      assert.equal(wrapper.find('PrivateIcon').length, 0)
    })

    it('if breakpoint is small', function () {
      windowStore.state = defaultWindowStore.mergeIn(['frames', 0], {
        isPrivate: true,
        hoverState: true,
        breakpoint: 'small'
      })
      const wrapper = mount(<Tab frameKey={frameKey} />)
      assert.equal(wrapper.find('PrivateIcon').length, 0)
    })

    it('if breakpoint is extraSmall', function () {
      windowStore.state = defaultWindowStore.mergeIn(['frames', 0], {
        isPrivate: true,
        hoverState: true,
        breakpoint: 'extraSmall'
      })
      const wrapper = mount(<Tab frameKey={frameKey} />)
      assert.equal(wrapper.find('PrivateIcon').length, 0)
    })

    it('if breakpoint is the smallest', function () {
      windowStore.state = defaultWindowStore.mergeIn(['frames', 0], {
        isPrivate: true,
        hoverState: true,
        breakpoint: 'smallest'
      })
      const wrapper = mount(<Tab frameKey={frameKey} />)
      assert.equal(wrapper.find('PrivateIcon').length, 0)
    })
  })
})
