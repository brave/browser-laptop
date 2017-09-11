/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */
/* global describe, before, after, it */

const mockery = require('mockery')
const {mount} = require('enzyme')
const Immutable = require('immutable')
const assert = require('assert')
const globalStyles = require('../../../../../../../app/renderer/components/styles/global')
const fakeElectron = require('../../../../../lib/fakeElectron')
require('../../../../../braveUnit')

const url1 = 'https://brave.com'
const favicon1 = 'https://brave.com/favicon.ico'

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

describe.skip('Tabs content - Favicon', function () {
  let Tab, windowStore

  before(function () {
    mockery.enable({
      warnOnReplace: false,
      warnOnUnregistered: false,
      useCleanCache: true
    })
    mockery.registerMock('electron', fakeElectron)
    mockery.registerMock('../../../js/l10n', {
      translation: () => 'translated'
    })
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
    it('favicon if page has one', function () {
      windowStore.state = defaultWindowStore.mergeIn(['frames', 0], {
        location: url1,
        icon: favicon1,
        loading: false
      })
      const wrapper = mount(<Tab frameKey={frameKey} />)
      assert.equal(wrapper.find('Favicon').length, 1)
    })

    it('placeholder icon if page has no favicon', function () {
      windowStore.state = defaultWindowStore.mergeIn(['frames', 0], {
        location: url1,
        icon: null,
        loading: false
      })
      const wrapper = mount(<Tab frameKey={frameKey} />)
      assert.equal(wrapper.find('Favicon TabIcon').props().symbol, globalStyles.appIcons.defaultIcon)
    })

    it('loading icon if page is still loading', function () {
      windowStore.state = defaultWindowStore.mergeIn(['frames', 0], {
        location: url1,
        icon: favicon1,
        loading: true
      })
      const wrapper = mount(<Tab frameKey={frameKey} />)
      assert.equal(wrapper.find('Favicon TabIcon').props()['data-test-id'], 'loading')
    })
  })

  it('should not show favicon for new tab page', function () {
    windowStore.state = defaultWindowStore.mergeIn(['frames', 0], {
      location: 'about:newtab'
    })
    const wrapper = mount(<Tab frameKey={frameKey} />)
    assert.equal(wrapper.find('Favicon').length, 0)
  })
})
