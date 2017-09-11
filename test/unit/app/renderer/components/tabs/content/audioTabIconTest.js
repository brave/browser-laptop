/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */
/* global describe, before, it, after */

const mockery = require('mockery')
const {mount} = require('enzyme')
const assert = require('assert')
const Immutable = require('immutable')
const globalStyles = require('../../../../../../../app/renderer/components/styles/global')
const fakeElectron = require('../../../../../lib/fakeElectron')
require('../../../../../braveUnit')

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

describe.skip('Tabs content - AudioTabIcon', function () {
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

  describe('should show', function () {
    it('play icon if page has audio enabled', function () {
      windowStore.state = defaultWindowStore.mergeIn(['frames', 0], {
        audioPlaybackActive: true,
        breakpoint: 'default'
      })
      const wrapper = mount(<Tab frameKey={frameKey} />)
      assert.equal(wrapper.find('AudioTabIcon TabIcon').props().symbol, globalStyles.appIcons.volumeOn)
    })

    it('mute icon if page has audio muted', function () {
      windowStore.state = defaultWindowStore.mergeIn(['frames', 0], {
        audioPlaybackActive: true,
        audioMuted: true,
        breakpoint: 'default'
      })
      const wrapper = mount(<Tab frameKey={frameKey} />)
      assert.equal(wrapper.find('AudioTabIcon TabIcon').props().symbol, globalStyles.appIcons.volumeOff)
    })
    it('passing in a frame key which does not exist does not fail', function () {
      windowStore.state = defaultWindowStore
      const wrapper = mount(<Tab frameKey={invalidFrameKey} />)
      // No audio icon is rendered in this case so just check for Tab
      assert(wrapper.find('Tab'))
    })
  })

  describe('should not show', function () {
    it('any audio icon if page has audio disabled', function () {
      windowStore.state = defaultWindowStore.mergeIn(['frames', 0], {
        audioPlaybackActive: false,
        breakpoint: 'default'
      })
      const wrapper = mount(<Tab frameKey={frameKey} />)
      assert.equal(wrapper.find('AudioTabIcon').length, 0)
      assert.equal(wrapper.find('AudioTabIcon').length, 0)
    })

    it('play audio icon if tab size is different than default', function () {
      windowStore.state = defaultWindowStore.mergeIn(['frames', 0], {
        audioPlaybackActive: true,
        audioMuted: false,
        breakpoint: 'small'
      })
      const wrapper = mount(<Tab frameKey={frameKey} />)
      assert.equal(wrapper.find('AudioTabIcon').length, 0)
    })

    it('mute icon if tab size is different than default', function () {
      windowStore.state = defaultWindowStore.mergeIn(['frames', 0], {
        audioPlaybackActive: true,
        audioMuted: true,
        breakpoint: 'small'
      })
      const wrapper = mount(<Tab frameKey={frameKey} />)
      assert.equal(wrapper.find('AudioTabIcon').length, 0)
    })
  })
})
