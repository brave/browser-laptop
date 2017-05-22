/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

/* global describe, it, before, after */

const assert = require('assert')
const Immutable = require('immutable')
const mockery = require('mockery')
const fakeElectron = require('../../../lib/fakeElectron')

const frameKey = 1
const defaultWindowStore = Immutable.fromJS({
  activeFrameKey: frameKey,
  frames: [{
    key: frameKey,
    tabId: 1,
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

describe('tabContentState unit tests', function () {
  let tabContentState

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
    tabContentState = require('../../../../../app/common/state/tabContentState')
  })

  after(function () {
    mockery.deregisterAll()
    mockery.disable()
  })

  describe('getDisplayTitle', function () {
    it('should return empty string if frame is not found', function * () {
      const result = tabContentState.getDisplayTitle(defaultWindowStore, 0)
      assert.equal(result, '')
    })

    it('should return translated title for about:blank', function * () {
      const windowStore = defaultWindowStore.mergeIn(['frames', 0], {
        location: 'about:blank'
      })
      const result = tabContentState.getDisplayTitle(windowStore, frameKey)
      assert.equal(result, 'translated')
    })

    it('should return translated title for about:newtab', function * () {
      const windowStore = defaultWindowStore.mergeIn(['frames', 0], {
        location: 'about:blank'
      })
      const result = tabContentState.getDisplayTitle(windowStore, frameKey)
      assert.equal(result, 'translated')
    })

    it('should return title', function * () {
      const title = 'Brave'
      const windowStore = defaultWindowStore.mergeIn(['frames', 0], {
        title: title
      })
      const result = tabContentState.getDisplayTitle(windowStore, frameKey)
      assert.equal(result, title)
    })

    it('should return location if title is not provided', function * () {
      const result = tabContentState.getDisplayTitle(defaultWindowStore, frameKey)
      assert.equal(result, defaultWindowStore.getIn(['frames', 0, 'location']))
    })

    it('should replace play indicator from the title (added by Youtube)', function * () {
      const windowStore = defaultWindowStore.mergeIn(['frames', 0], {
        title: '▶ Brave'
      })
      const result = tabContentState.getDisplayTitle(windowStore, frameKey)
      assert.equal(result, 'Brave')
    })
  })
})
