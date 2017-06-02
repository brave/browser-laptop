/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

/* global describe, it, before, after, afterEach */

const assert = require('assert')
const Immutable = require('immutable')
const mockery = require('mockery')
const sinon = require('sinon')
const fakeElectron = require('../../../lib/fakeElectron')
const {braveExtensionId} = require('../../../../../js/constants/config')

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
  let frameStateUtil
  let getFrameByKeyMock

  before(function () {
    mockery.enable({
      warnOnReplace: false,
      warnOnUnregistered: false,
      useCleanCache: true
    })
    frameStateUtil = require('../../../../../js/state/frameStateUtil')
    mockery.registerMock('electron', fakeElectron)
    mockery.registerMock('../../../js/l10n', {
      translation: () => 'translated'
    })
    mockery.registerMock('../../../js/state/frameStateUtil', frameStateUtil)
    tabContentState = require('../../../../../app/common/state/tabContentState')
  })

  after(function () {
    mockery.deregisterAll()
    mockery.disable()
  })

  afterEach(function () {
    if (getFrameByKeyMock) {
      getFrameByKeyMock.restore()
      getFrameByKeyMock = undefined
    }
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

  describe('isTabLoading', function () {
    describe('when provisionalLocation is not set', function () {
      it('returns true if frame.loading', function () {
        getFrameByKeyMock = sinon.stub(frameStateUtil, 'getFrameByKey', (state, frameKey) => {
          return Immutable.fromJS({loading: true})
        })
        assert.equal(tabContentState.isTabLoading(), true)
      })
      it('returns true if location is about:blank', function () {
        getFrameByKeyMock = sinon.stub(frameStateUtil, 'getFrameByKey', (state, frameKey) => {
          return Immutable.fromJS({location: 'about:blank'})
        })
        assert.equal(tabContentState.isTabLoading(), true)
      })
    })

    describe('when provisionalLocation is set', function () {
      it('returns false if loading and provisionalLocation is a brave about page', function () {
        getFrameByKeyMock = sinon.stub(frameStateUtil, 'getFrameByKey', (state, frameKey) => {
          return Immutable.fromJS({
            loading: true,
            provisionalLocation: `chrome-extension://${braveExtensionId}/pageGoesHere`
          })
        })
        assert.equal(tabContentState.isTabLoading(), false)
      })
      it('returns true if loading and provisionalLocation is not a brave about page', function () {
        getFrameByKeyMock = sinon.stub(frameStateUtil, 'getFrameByKey', (state, frameKey) => {
          return Immutable.fromJS({
            loading: true,
            provisionalLocation: 'https://brave.com'
          })
        })
        assert.equal(tabContentState.isTabLoading(), true)
      })
    })
  })

  describe('isMediumView', function () {
    it('handles frame being null/undefined', function () {
      assert.equal(tabContentState.isMediumView(), false)
    })

    it('returns true if valid', function () {
      getFrameByKeyMock = sinon.stub(frameStateUtil, 'getFrameByKey', (state, frameKey) => {
        return Immutable.fromJS({breakpoint: 'large'})
      })
      assert.equal(tabContentState.isMediumView(), true)
    })
  })

  describe('isNarrowView', function () {
    it('returns false if null/undefined', function () {
      assert.equal(tabContentState.isNarrowView(), false)
    })

    it('returns true if valid', function () {
      getFrameByKeyMock = sinon.stub(frameStateUtil, 'getFrameByKey', (state, frameKey) => {
        return Immutable.fromJS({breakpoint: 'small'})
      })
      assert.equal(tabContentState.isNarrowView(), true)
    })
  })

  describe('isNarrowestView', function () {
    it('handles frame being null/undefined', function () {
      assert.equal(tabContentState.isNarrowestView(), false)
    })

    it('returns true if valid', function () {
      getFrameByKeyMock = sinon.stub(frameStateUtil, 'getFrameByKey', (state, frameKey) => {
        return Immutable.fromJS({breakpoint: 'extraSmall'})
      })
      assert.equal(tabContentState.isNarrowestView(), true)
    })
  })
})
