/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

/* global describe, it, before, beforeEach, after, afterEach */

const assert = require('assert')
const Immutable = require('immutable')
const mockery = require('mockery')
const sinon = require('sinon')
const fakeElectron = require('../../../lib/fakeElectron')
const {braveExtensionId} = require('../../../../../js/constants/config')
const styles = require('../../../../../app/renderer/components/styles/global')

const frameKey = 1
const index = 0
const defaultWindowStore = Immutable.fromJS({
  activeFrameKey: frameKey,
  frames: [{
    key: frameKey,
    tabId: 1,
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

describe.skip('tabUIState unit tests', function () {
  let tabUIState
  let frameStateUtil
  let getFrameByKeyMock
  let defaultValue
  let isFrameKeyActive

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
    mockery.registerMock('../../../js/settings', {
      getSetting: () => defaultValue
    })
    tabUIState = require('../../../../../app/common/state/tabUIState')
  })

  beforeEach(function () {
    defaultValue = true
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

    if (isFrameKeyActive) {
      isFrameKeyActive.restore()
      isFrameKeyActive = undefined
    }
  })

  describe('getDisplayTitle', function () {
    it('should return empty string if frame is not found', function * () {
      const result = tabUIState.getDisplayTitle(defaultWindowStore, 0)
      assert.equal(result, '')
    })

    it('should return translated title for about:blank', function * () {
      const windowStore = defaultWindowStore.mergeIn(['frames', 0], {
        location: 'about:blank'
      })
      const result = tabUIState.getDisplayTitle(windowStore, frameKey)
      assert.equal(result, 'translated')
    })

    it('should return translated title for about:newtab', function * () {
      const windowStore = defaultWindowStore.mergeIn(['frames', 0], {
        location: 'about:blank'
      })
      const result = tabUIState.getDisplayTitle(windowStore, frameKey)
      assert.equal(result, 'translated')
    })

    it('should return title', function * () {
      const title = 'Brave'
      const windowStore = defaultWindowStore.mergeIn(['frames', 0], {
        title: title
      })
      const result = tabUIState.getDisplayTitle(windowStore, frameKey)
      assert.equal(result, title)
    })

    it('should return location if title is not provided', function * () {
      const result = tabUIState.getDisplayTitle(defaultWindowStore, frameKey)
      assert.equal(result, defaultWindowStore.getIn(['frames', 0, 'location']))
    })

    it('should replace play indicator from the title (added by Youtube)', function * () {
      const windowStore = defaultWindowStore.mergeIn(['frames', 0], {
        title: '▶ Brave'
      })
      const result = tabUIState.getDisplayTitle(windowStore, frameKey)
      assert.equal(result, 'Brave')
    })
  })

  describe('isTabLoading', function () {
    it('handles frame being null/undefined', function () {
      assert.equal(tabUIState.isTabLoading(), false)
    })

    describe('when provisionalLocation is not set', function () {
      it('returns true if frame.loading', function () {
        getFrameByKeyMock = sinon.stub(frameStateUtil, 'getFrameByKey', (state, frameKey) => {
          return Immutable.fromJS({loading: true})
        })
        assert.equal(tabUIState.isTabLoading(), true)
      })
      it('returns true if location is about:blank', function () {
        getFrameByKeyMock = sinon.stub(frameStateUtil, 'getFrameByKey', (state, frameKey) => {
          return Immutable.fromJS({location: 'about:blank'})
        })
        assert.equal(tabUIState.isTabLoading(), true)
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
        assert.equal(tabUIState.isTabLoading(), false)
      })
      it('returns true if loading and provisionalLocation is not a brave about page', function () {
        getFrameByKeyMock = sinon.stub(frameStateUtil, 'getFrameByKey', (state, frameKey) => {
          return Immutable.fromJS({
            loading: true,
            provisionalLocation: 'https://brave.com'
          })
        })
        assert.equal(tabUIState.isTabLoading(), true)
      })
    })
  })

  describe('isMediumView', function () {
    it('handles frame being null/undefined', function () {
      assert.equal(tabUIState.isMediumView(), false)
    })

    it('returns true if valid', function () {
      getFrameByKeyMock = sinon.stub(frameStateUtil, 'getFrameByKey', (state, frameKey) => {
        return Immutable.fromJS({breakpoint: 'large'})
      })
      assert.equal(tabUIState.isMediumView(), true)
    })
  })

  describe('isNarrowView', function () {
    it('returns false if null/undefined', function () {
      assert.equal(tabUIState.isNarrowView(), false)
    })

    it('returns true if valid', function () {
      getFrameByKeyMock = sinon.stub(frameStateUtil, 'getFrameByKey', (state, frameKey) => {
        return Immutable.fromJS({breakpoint: 'small'})
      })
      assert.equal(tabUIState.isNarrowView(), true)
    })
  })

  describe('isNarrowestView', function () {
    it('handles frame being null/undefined', function () {
      assert.equal(tabUIState.isNarrowestView(), false)
    })

    it('returns true if valid', function () {
      getFrameByKeyMock = sinon.stub(frameStateUtil, 'getFrameByKey', (state, frameKey) => {
        return Immutable.fromJS({breakpoint: 'extraSmall'})
      })
      assert.equal(tabUIState.isNarrowestView(), true)
    })
  })

  describe('getThemeColor', function () {
    it('handles frame being null/undefined', function () {
      assert.equal(tabUIState.getThemeColor(), false)
    })

    it('if PAINT_TABS is false', function () {
      defaultValue = false
      assert.equal(tabUIState.getThemeColor(), false)
    })

    it('if PAINT_TABS is true, but dont have themeColor', function () {
      getFrameByKeyMock = sinon.stub(frameStateUtil, 'getFrameByKey', () => {
        return null
      })
      assert.equal(tabUIState.getThemeColor(), false)
    })

    it('if PAINT_TABS is true and have themeColor', function () {
      getFrameByKeyMock = sinon.stub(frameStateUtil, 'getFrameByKey', () => {
        return Immutable.fromJS({
          themeColor: '#F00'
        })
      })
      assert.equal(tabUIState.getThemeColor(), '#F00')
    })

    it('if PAINT_TABS is true and have computedThemeColor', function () {
      getFrameByKeyMock = sinon.stub(frameStateUtil, 'getFrameByKey', () => {
        return Immutable.fromJS({
          computedThemeColor: '#FFF'
        })
      })
      assert.equal(tabUIState.getThemeColor(), '#FFF')
    })

    it('if PAINT_TABS is true and both theme colors are provided', function () {
      getFrameByKeyMock = sinon.stub(frameStateUtil, 'getFrameByKey', () => {
        return Immutable.fromJS({
          themeColor: '#F00',
          computedThemeColor: '#FFF'
        })
      })
      assert.equal(tabUIState.getThemeColor(), '#F00')
    })
  })

  describe('canPlayAudio', function () {
    it('handles frame being null/undefined', function () {
      assert.equal(tabUIState.canPlayAudio(), false)
    })

    it('if audioPlaybackActive and audioMuted is not defined', function () {
      getFrameByKeyMock = sinon.stub(frameStateUtil, 'getFrameByKey', () => {
        return null
      })
      assert.equal(tabUIState.canPlayAudio(), false)
    })

    it('if audioPlaybackActive is true', function () {
      getFrameByKeyMock = sinon.stub(frameStateUtil, 'getFrameByKey', () => {
        return Immutable.fromJS({
          audioPlaybackActive: true
        })
      })
      assert.equal(tabUIState.canPlayAudio(), true)
    })

    it('if audioMuted is true', function () {
      getFrameByKeyMock = sinon.stub(frameStateUtil, 'getFrameByKey', () => {
        return Immutable.fromJS({
          audioMuted: true
        })
      })
      assert.equal(tabUIState.canPlayAudio(), true)
    })

    it('if both provided', function () {
      getFrameByKeyMock = sinon.stub(frameStateUtil, 'getFrameByKey', () => {
        return Immutable.fromJS({
          audioPlaybackActive: true,
          audioMuted: false
        })
      })
      assert.equal(tabUIState.canPlayAudio(), true)
    })
  })

  describe('getPageIndex', function () {
    it('handles frame being null/undefined', function () {
      const state = Immutable.fromJS({})
      assert.equal(tabUIState.getPageIndex(state), 0)
    })

    it('tabPageIndex is provided', function () {
      const state = Immutable.fromJS({
        ui: {
          tabs: {
            tabPageIndex: 1
          }
        }
      })
      assert.equal(tabUIState.getPageIndex(state), 1)
    })

    it('previewTabPageIndex is provided', function () {
      const state = Immutable.fromJS({
        ui: {
          tabs: {
            previewTabPageIndex: 1
          }
        }
      })
      assert.equal(tabUIState.getPageIndex(state), 1)
    })

    it('both are provided', function () {
      const state = Immutable.fromJS({
        ui: {
          tabs: {
            previewTabPageIndex: 1,
            tabPageIndex: 2
          }
        }
      })
      assert.equal(tabUIState.getPageIndex(state), 1)
    })
  })

  describe('getTabIconColor', function () {
    it('handles frame being null/undefined', function () {
      const state = Immutable.fromJS({})
      assert.equal(tabUIState.getTabIconColor(state), '')
    })

    it('tab is private and active', function () {
      const state = defaultWindowStore
      getFrameByKeyMock = sinon.stub(frameStateUtil, 'getFrameByKey', () => {
        return Immutable.fromJS({
          isPrivate: true
        })
      })
      isFrameKeyActive = sinon.stub(frameStateUtil, 'isFrameKeyActive', () => {
        return true
      })
      assert.equal(tabUIState.getTabIconColor(state), styles.color.white100)
    })

    it('tab is not private and active, but paint is disabled', function () {
      const state = defaultWindowStore
      getFrameByKeyMock = sinon.stub(frameStateUtil, 'getFrameByKey', () => {
        return Immutable.fromJS({
          isPrivate: false
        })
      })
      isFrameKeyActive = sinon.stub(frameStateUtil, 'isFrameKeyActive', () => {
        return true
      })
      defaultValue = false
      assert.equal(tabUIState.getTabIconColor(state), styles.color.black100)
    })

    it('all valid', function () {
      const state = defaultWindowStore
      getFrameByKeyMock = sinon.stub(frameStateUtil, 'getFrameByKey', () => {
        return Immutable.fromJS({
          isPrivate: false,
          themeColor: '#F00'
        })
      })
      isFrameKeyActive = sinon.stub(frameStateUtil, 'isFrameKeyActive', () => {
        return true
      })
      assert.equal(tabUIState.getTabIconColor(state), 'white')
    })
  })

  describe('hasFixedCloseIcon', function () {
    it('handles frame being null/undefined', function () {
      const state = Immutable.fromJS({})
      assert.equal(tabUIState.hasFixedCloseIcon(state), false)
    })

    it('frame is not active', function () {
      getFrameByKeyMock = sinon.stub(frameStateUtil, 'getFrameByKey', () => {
        return Immutable.fromJS({
          breakpoint: 'default'
        })
      })
      isFrameKeyActive = sinon.stub(frameStateUtil, 'isFrameKeyActive', () => {
        return false
      })
      assert.equal(tabUIState.hasFixedCloseIcon(), false)
    })

    it('frame is active and breakpoint is small', function () {
      getFrameByKeyMock = sinon.stub(frameStateUtil, 'getFrameByKey', () => {
        return Immutable.fromJS({
          breakpoint: 'small'
        })
      })
      isFrameKeyActive = sinon.stub(frameStateUtil, 'isFrameKeyActive', () => {
        return true
      })
      assert.equal(tabUIState.hasFixedCloseIcon(), true)
    })

    it('frame is active and breakpoint is default', function () {
      getFrameByKeyMock = sinon.stub(frameStateUtil, 'getFrameByKey', () => {
        return Immutable.fromJS({
          breakpoint: 'default'
        })
      })
      isFrameKeyActive = sinon.stub(frameStateUtil, 'isFrameKeyActive', () => {
        return true
      })
      assert.equal(tabUIState.hasFixedCloseIcon(), false)
    })

    it('frame is active and breakpoint is dynamic', function () {
      getFrameByKeyMock = sinon.stub(frameStateUtil, 'getFrameByKey', () => {
        return Immutable.fromJS({
          breakpoint: 'dynamic'
        })
      })
      isFrameKeyActive = sinon.stub(frameStateUtil, 'isFrameKeyActive', () => {
        return true
      })
      assert.equal(tabUIState.hasFixedCloseIcon(), false)
    })
  })

  describe('hasRelativeCloseIcon', function () {
    it('handles frame being null/undefined', function () {
      const state = Immutable.fromJS({})
      assert.equal(tabUIState.hasRelativeCloseIcon(state), false)
    })

    it('if not hovering (tabIndex !== hoverTabIndex)', function () {
      const state = defaultWindowStore.setIn(['ui', 'tabs', 'hoverTabIndex'], null)
      assert.equal(tabUIState.hasRelativeCloseIcon(state, frameKey), false)
    })

    it('if hovering (tabIndex === hoverTabIndex) and break point is small', function () {
      const state = defaultWindowStore
      getFrameByKeyMock = sinon.stub(frameStateUtil, 'getFrameByKey', () => {
        return Immutable.fromJS({
          breakpoint: 'small'
        })
      })
      assert.equal(tabUIState.hasRelativeCloseIcon(state, frameKey), false)
    })

    it('if hovering (tabIndex === hoverTabIndex) and break point is default', function () {
      const state = defaultWindowStore
      getFrameByKeyMock = sinon.stub(frameStateUtil, 'getFrameByKey', () => {
        return Immutable.fromJS({
          breakpoint: 'default'
        })
      })
      assert.equal(tabUIState.hasRelativeCloseIcon(state, frameKey), true)
    })

    it('if hovering (tabIndex === hoverTabIndex) and break point is dynamic', function () {
      const state = defaultWindowStore
      getFrameByKeyMock = sinon.stub(frameStateUtil, 'getFrameByKey', () => {
        return Immutable.fromJS({
          breakpoint: 'dynamic'
        })
      })
      assert.equal(tabUIState.hasRelativeCloseIcon(state, frameKey), true)
    })
  })

  describe('hasVisibleSecondaryIcon', function () {
    let hasRelativeCloseIcon, hasFixedCloseIcon

    afterEach(function () {
      if (hasRelativeCloseIcon) {
        hasRelativeCloseIcon.restore()
        hasRelativeCloseIcon = undefined
      }
      if (hasFixedCloseIcon) {
        hasFixedCloseIcon.restore()
        hasFixedCloseIcon = undefined
      }
    })

    it('handles frame being null/undefined', function () {
      const state = Immutable.fromJS({})
      assert.equal(tabUIState.hasVisibleSecondaryIcon(state), false)
    })

    it('hasRelativeCloseIcon, dont have hasFixedCloseIcon and is default', function () {
      getFrameByKeyMock = sinon.stub(frameStateUtil, 'getFrameByKey', () => {
        return Immutable.fromJS({
          breakpoint: 'default'
        })
      })
      hasRelativeCloseIcon = sinon.stub(tabUIState, 'hasRelativeCloseIcon', () => {
        return true
      })
      hasFixedCloseIcon = sinon.stub(tabUIState, 'hasFixedCloseIcon', () => {
        return false
      })
      assert.equal(tabUIState.hasVisibleSecondaryIcon(), false)
    })

    it('dont have hasRelativeCloseIcon, have hasFixedCloseIcon and is default', function () {
      getFrameByKeyMock = sinon.stub(frameStateUtil, 'getFrameByKey', () => {
        return Immutable.fromJS({
          breakpoint: 'default'
        })
      })
      hasRelativeCloseIcon = sinon.stub(tabUIState, 'hasRelativeCloseIcon', () => {
        return false
      })
      hasFixedCloseIcon = sinon.stub(tabUIState, 'hasFixedCloseIcon', () => {
        return true
      })
      assert.equal(tabUIState.hasVisibleSecondaryIcon(), false)
    })

    it('dont have hasRelativeCloseIcon, dont have hasFixedCloseIcon and is small', function () {
      getFrameByKeyMock = sinon.stub(frameStateUtil, 'getFrameByKey', () => {
        return Immutable.fromJS({
          breakpoint: 'small'
        })
      })
      hasRelativeCloseIcon = sinon.stub(tabUIState, 'hasRelativeCloseIcon', () => {
        return false
      })
      hasFixedCloseIcon = sinon.stub(tabUIState, 'hasFixedCloseIcon', () => {
        return false
      })
      assert.equal(tabUIState.hasVisibleSecondaryIcon(), false)
    })

    it('dont have hasRelativeCloseIcon, dont have hasFixedCloseIcon and is default', function () {
      getFrameByKeyMock = sinon.stub(frameStateUtil, 'getFrameByKey', () => {
        return Immutable.fromJS({
          breakpoint: 'default'
        })
      })
      hasRelativeCloseIcon = sinon.stub(tabUIState, 'hasRelativeCloseIcon', () => {
        return false
      })
      hasFixedCloseIcon = sinon.stub(tabUIState, 'hasFixedCloseIcon', () => {
        return false
      })
      assert.equal(tabUIState.hasVisibleSecondaryIcon(), true)
    })
  })
})
