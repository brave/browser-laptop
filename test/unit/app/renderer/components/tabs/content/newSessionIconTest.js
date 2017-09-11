/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */
/* global describe, before, after, it */

const mockery = require('mockery')
const {mount} = require('enzyme')
const assert = require('assert')
const Immutable = require('immutable')
const {tabs} = require('../../../../../../../js/constants/config')
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

describe.skip('Tabs content - NewSessionIcon', function () {
  let Tab, windowStore, NewSessionIcon

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
    NewSessionIcon = require('../../../../../../../app/renderer/components/tabs/content/newSessionIcon')
  })

  after(function () {
    mockery.deregisterAll()
    mockery.disable()
  })

  describe('should show', function () {
    it('icon if current tab is a new session tab', function () {
      windowStore.state = defaultWindowStore.merge({
        activeFrameKey: 0,
        frames: [{
          partitionNumber: 1,
          breakpoint: 'default'
        }],
        ui: {
          tabs: {
            hoverTabIndex: null
          }
        }
      })
      const wrapper = mount(<Tab frameKey={frameKey} />)
      assert.equal(wrapper.find('NewSessionIcon').length, 1)
    })

    it('icon if mouse is not over tab and breakpoint is default', function () {
      windowStore.state = defaultWindowStore.merge({
        activeFrameKey: 0,
        frames: [{
          partitionNumber: 1,
          breakpoint: 'default'
        }],
        ui: {
          tabs: {
            hoverTabIndex: null
          }
        }
      })
      const wrapper = mount(<Tab frameKey={frameKey} />)
      assert.equal(wrapper.find('NewSessionIcon').length, 1)
    })

    it('icon if mouse is not over tab and breakpoint is large', function () {
      windowStore.state = defaultWindowStore.merge({
        activeFrameKey: 0,
        frames: [{
          partitionNumber: 1,
          breakpoint: 'large'
        }],
        ui: {
          tabs: {
            hoverTabIndex: null
          }
        }
      })
      const wrapper = mount(<Tab frameKey={frameKey} />)
      assert.equal(wrapper.find('NewSessionIcon').length, 1)
    })

    it('icon if tab is not active and breakpoint is largeMedium', function () {
      windowStore.state = defaultWindowStore.merge({
        activeFrameKey: 0,
        frames: [{
          partitionNumber: 1,
          breakpoint: 'largeMedium'
        }],
        ui: {
          tabs: {
            hoverTabIndex: null
          }
        }
      })
      const wrapper = mount(<Tab frameKey={frameKey} />)
      assert.equal(wrapper.find('NewSessionIcon').length, 1)
    })

    it('partition number for new sessions', function () {
      windowStore.state = defaultWindowStore.mergeIn(['frames', 0], {
        partitionNumber: 3,
        breakpoint: 'default'
      })
      const wrapper = mount(<NewSessionIcon frameKey={frameKey} />)
      assert.equal(wrapper.find('TabIcon').props().symbolContent, 3)
    })

    it('partition number for sessions with number set by opener (ex: clicking target=_blank)', function () {
      windowStore.state = defaultWindowStore.mergeIn(['frames', 0], {
        partitionNumber: 'partition-3',
        breakpoint: 'default'
      })
      const wrapper = mount(<NewSessionIcon frameKey={frameKey} />)
      assert.equal(wrapper.find('TabIcon').props().symbolContent, 3)
    })

    it('max partition number even if session is bigger', function () {
      windowStore.state = defaultWindowStore.mergeIn(['frames', 0], {
        partitionNumber: 1000,
        breakpoint: 'default'
      })
      const wrapper = mount(<NewSessionIcon frameKey={frameKey} />)
      assert.equal(wrapper.find('TabIcon').props().symbolContent, tabs.maxAllowedNewSessions)
    })
    it('passing in a frame key which does not exist does not fail', function () {
      windowStore.state = defaultWindowStore
      const wrapper = mount(<NewSessionIcon frameKey={invalidFrameKey} />)
      assert(wrapper.find('TabIcon'))
    })
  })

  describe('should not show icon', function () {
    it('if current tab is not private', function () {
      windowStore.state = defaultWindowStore.mergeIn(['frames', 0], {
        partitionNumber: false
      })
      const wrapper = mount(<Tab frameKey={frameKey} />)
      assert.equal(wrapper.find('NewSessionIcon').length, 0)
    })

    it('if mouse is over tab and breakpoint is default', function () {
      windowStore.state = defaultWindowStore.mergeIn(['frames', 0], {
        partitionNumber: 1,
        hoverState: true,
        breakpoint: 'default'
      })
      const wrapper = mount(<Tab frameKey={frameKey} />)
      assert.equal(wrapper.find('NewSessionIcon').length, 0)
    })

    it('if mouse is over tab and breakpoint is large', function () {
      windowStore.state = defaultWindowStore.mergeIn(['frames', 0], {
        partitionNumber: 1,
        hoverState: true,
        breakpoint: 'large'
      })
      const wrapper = mount(<Tab frameKey={frameKey} />)
      assert.equal(wrapper.find('NewSessionIcon').length, 0)
    })

    it('if tab is active and breakpoint is largeMedium', function () {
      windowStore.state = defaultWindowStore.mergeIn(['frames', 0], {
        partitionNumber: 1,
        hoverState: true,
        breakpoint: 'largeMedium'
      })
      const wrapper = mount(<Tab frameKey={frameKey} />)
      assert.equal(wrapper.find('NewSessionIcon').length, 0)
    })

    it('if breakpoint is medium', function () {
      windowStore.state = defaultWindowStore.mergeIn(['frames', 0], {
        partitionNumber: 1,
        hoverState: false,
        breakpoint: 'medium'
      })
      const wrapper = mount(<Tab frameKey={frameKey} />)
      assert.equal(wrapper.find('NewSessionIcon').length, 0)
    })

    it('if breakpoint is mediumSmall', function () {
      windowStore.state = defaultWindowStore.mergeIn(['frames', 0], {
        partitionNumber: 1,
        hoverState: false,
        breakpoint: 'mediumSmall'
      })
      const wrapper = mount(<Tab frameKey={frameKey} />)
      assert.equal(wrapper.find('NewSessionIcon').length, 0)
    })

    it('if breakpoint is small', function () {
      windowStore.state = defaultWindowStore.mergeIn(['frames', 0], {
        partitionNumber: 1,
        hoverState: true,
        breakpoint: 'small'
      })
      const wrapper = mount(<Tab frameKey={frameKey} />)
      assert.equal(wrapper.find('NewSessionIcon').length, 0)
    })

    it('if breakpoint is extraSmall', function () {
      windowStore.state = defaultWindowStore.mergeIn(['frames', 0], {
        partitionNumber: 1,
        hoverState: true,
        breakpoint: 'extraSmall'
      })
      const wrapper = mount(<Tab frameKey={frameKey} />)
      assert.equal(wrapper.find('NewSessionIcon').length, 0)
    })

    it('if breakpoint is the smallest', function () {
      windowStore.state = defaultWindowStore.mergeIn(['frames', 0], {
        partitionNumber: 1,
        hoverState: true,
        breakpoint: 'smallest'
      })
      const wrapper = mount(<Tab frameKey={frameKey} />)
      assert.equal(wrapper.find('NewSessionIcon').length, 0)
    })
  })
})
