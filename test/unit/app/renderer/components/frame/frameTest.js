/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */
/* global describe, before, after, it */

const mockery = require('mockery')
const {mount} = require('enzyme')
const sinon = require('sinon')
const assert = require('assert')
const Immutable = require('immutable')
let Frame, windowStore
require('../../../../braveUnit')

const tabId = 1
const frameKey = 0

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
  }]
})

describe.skip('Frame component unit tests', function () {
  const fakeWindowActions = {
    frameShortcutChanged: () => {},
    setFindbarShown: () => {},
    setActiveFrame: () => {}
  }

  const domUtil = {
    appendChild: () => {},
    createWebView: () => {
      return {
        setAttribute: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        attachGuest: () => {},
        zoomIn: () => {},
        zoomOut: () => {},
        zoomReset: () => {},
        executeScriptInTab: () => {},
        focus: () => {},
        getZoomPercent: () => {}
      }
    }
  }

  before(function () {
    mockery.enable({
      warnOnReplace: false,
      warnOnUnregistered: false,
      useCleanCache: true
    })

    mockery.registerMock('../../extensions/brave/img/caret_down_grey.svg', 'caret_down_grey.svg')
    mockery.registerMock('electron', require('../../../../lib/fakeElectron'))
    mockery.registerMock('../actions/windowActions', fakeWindowActions)
    mockery.registerMock('../../app/renderer/lib/domUtil', domUtil)
    // the version in frame.js
    mockery.registerMock('../stores/appStoreRenderer', fakeAppStoreRenderer)
    // the version in reduxComponent.js
    mockery.registerMock('../../../js/stores/appStoreRenderer', fakeAppStoreRenderer)
    Frame = require('../../../../../../app/renderer/components/frame/frame')
    windowStore = require('../../../../../../js/stores/windowStore')
  })

  after(function () {
    mockery.disable()
  })

  const expectCall = (shortcut, expectedCall, expectedArgs) => {
    windowStore.state = defaultWindowStore.setIn(['frames', 0, 'activeShortcut'], shortcut)
    const wrapper = mount(
      <Frame frameKey={frameKey} />
    )
    const instance = wrapper.instance()
    const expectedCallSpy = sinon.spy(instance, expectedCall)
    instance.handleShortcut()
    if (expectedArgs) {
      assert.equal(expectedCallSpy.withArgs(expectedArgs).calledOnce, true)
    } else {
      assert.equal(expectedCallSpy.calledOnce, true)
    }
    expectedCallSpy.restore()
  }

  const expectWindowActionCall = (shortcut, expectedCall, expectNoCalls) => {
    windowStore.state = defaultWindowStore.setIn(['frames', 0, 'activeShortcut'], shortcut)
    const wrapper = mount(
      <Frame frameKey={frameKey} />
    )
    const instance = wrapper.instance()
    const expectedCallSpy = sinon.spy(fakeWindowActions, expectedCall)
    instance.handleShortcut()
    if (expectNoCalls) {
      assert.equal(expectedCallSpy.notCalled, true)
    } else {
      assert.equal(expectedCallSpy.calledOnce, true)
    }
    expectedCallSpy.restore()
  }

  describe('handleShortcut', function () {
    it('calls zoomIn when set to "zoom-in"', function () {
      expectCall('zoom-in', 'zoomIn')
    })

    it('calls zoomOut when set to "zoom-out"', function () {
      expectCall('zoom-out', 'zoomOut')
    })

    it('calls zoomReset when set to "zoom-reset"', function () {
      expectCall('zoom-reset', 'zoomReset')
    })

    it('calls windowActions.setFindbarShown when set to "show-findbar"', function () {
      expectWindowActionCall('show-findbar', 'setFindbarShown')
    })

    it('calls onFindAgain with true when set to "find-next"', function () {
      expectCall('find-next', 'onFindAgain', true)
    })

    it('calls onFindAgain with false when set to "find-prev"', function () {
      expectCall('find-prev', 'onFindAgain', false)
    })

    it('calls windowActions.frameShortcutChanged when truthy', function () {
      expectWindowActionCall('not-a-real-value', 'frameShortcutChanged')
    })

    it('does not call windowActions.frameShortcutChanged if falsey', function () {
      expectWindowActionCall(undefined, 'frameShortcutChanged', true)
    })
  })
})
