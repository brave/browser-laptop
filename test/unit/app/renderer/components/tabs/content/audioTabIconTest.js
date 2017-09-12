/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */
/* global describe, before, after, it */

const mockery = require('mockery')
const {mount} = require('enzyme')
const assert = require('assert')
const Immutable = require('immutable')
const fakeElectron = require('../../../../../lib/fakeElectron')
const globalStyles = require('../../../../../../../app/renderer/components/styles/global')
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

describe('Tabs content - AudioTabIcon', function () {
  let AudioTabIcon, windowStore, appStore

  before(function () {
    mockery.enable({
      warnOnReplace: false,
      warnOnUnregistered: false,
      useCleanCache: true
    })
    mockery.registerMock('electron', fakeElectron)
    windowStore = require('../../../../../../../js/stores/windowStore')
    appStore = require('../../../../../../../js/stores/appStoreRenderer')
    AudioTabIcon = require('../../../../../../../app/renderer/components/tabs/content/audioTabIcon')
    appStore.state = fakeAppStoreRenderer
  })

  after(function () {
    mockery.deregisterAll()
    mockery.disable()
  })

  describe('should show icon', function () {
    it('volumeOn if page has audio enabled', function * () {
      windowStore.state = defaultWindowStore.mergeIn(['frames', 0], {
        audioPlaybackActive: true
      })
      const wrapper = mount(<AudioTabIcon tabId={tabId} />)
      assert.equal(wrapper.find('TabIcon').props()['data-test-id'], globalStyles.appIcons.volumeOn)
    })

    it('volumeOff if page has audio muted', function * () {
      windowStore.state = defaultWindowStore.mergeIn(['frames', 0], {
        audioPlaybackActive: true,
        audioMuted: true
      })
      const wrapper = mount(<AudioTabIcon tabId={tabId} />)
      assert.equal(wrapper.find('TabIcon').props()['data-test-id'], globalStyles.appIcons.volumeOff)
    })
  })

  describe('should not show icon', function () {
    it('if page has audio disabled', function * () {
      windowStore.state = defaultWindowStore.mergeIn(['frames', 0], {
        audioPlaybackActive: false,
        audioMuted: false
      })
      const wrapper = mount(<AudioTabIcon tabId={tabId} />)
      assert.equal(wrapper.find('TabIcon').length, 0)
    })

    it('if tab is intersected', function * () {
      windowStore.state = defaultWindowStore.mergeIn(['frames', 0], {
        audioPlaybackActive: true,
        audioMuted: false
      })
      windowStore.state = defaultWindowStore.setIn(['ui', 'tabs', 'intersection'], 0)
      const wrapper = mount(<AudioTabIcon tabId={tabId} />)
      assert.equal(wrapper.find('TabIcon').length, 0)
    })
  })
})
