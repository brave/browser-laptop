/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

/* global describe, it, before, beforeEach, after */

const assert = require('assert')
const Immutable = require('immutable')
const mockery = require('mockery')
const fakeElectron = require('../../../lib/fakeElectron')
const {intersection} = require('../../../../../app/renderer/components/styles/global')

const frameKey = 1
const index = 0
let defaultState = Immutable.fromJS({
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
    index: { 1: 0 },
    tabIndex: { 1: 0 }
  }
})

describe('tabUIState unit tests', function () {
  let tabUIState
  let defaultValue

  before(function () {
    mockery.enable({
      warnOnReplace: false,
      warnOnUnregistered: false,
      useCleanCache: true
    })
    mockery.registerMock('electron', fakeElectron)
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

  describe('getThemeColor', function () {
    it('returns an empty string if frame is null/undefined', function * () {
      assert.equal(tabUIState.getThemeColor(), false)
    })

    it('returns the themeColor when PAINT_TABS is true', function * () {
      const state = defaultState.setIn(['frames', index, 'themeColor'], '#c0ff33')
      const result = tabUIState.getThemeColor(state, frameKey)
      assert.equal(result, '#c0ff33')
    })

    it('returns computedThemeColor when PAINT_TABS is true and themeColor is empty', function * () {
      const state = defaultState.mergeIn(['frames', index], {
        themeColor: '',
        computedThemeColor: 'saddlebrown'
      })
      const result = tabUIState.getThemeColor(state, frameKey)
      assert.equal(result, 'saddlebrown')
    })

    it('returns false when PAINT_TABS is false', function * () {
      defaultValue = false
      const state = defaultState.mergeIn(['frames', index], {
        themeColor: '#c0ff33',
        computedThemeColor: 'saddlebrown'
      })
      const result = tabUIState.getThemeColor(state, frameKey)
      assert.equal(result, false)
    })
  })

  describe('getTabIconColor', function () {
    it('returns an empty string if frame is null/undefined', function * () {
      assert.equal(tabUIState.getTabIconColor(), false)
    })

    it('returns black if tab background is lighter, has themeColor, paintTabs is enabled and is active but not private', function * () {
      const state = defaultState.mergeIn(['frames', index], {
        themeColor: '#fff',
        isPrivate: false
      })
      const result = tabUIState.getTabIconColor(state, frameKey)
      assert.equal(result, 'black')
    })

    it('returns black if tab background is darker, has themeColor, paintTabs is enabled and is active but not private', function * () {
      const state = defaultState.mergeIn(['frames', index], {
        themeColor: '#000',
        isPrivate: false
      })
      const result = tabUIState.getTabIconColor(state, frameKey)
      assert.equal(result, 'white')
    })

    it('returns white if tab is active and private', function * () {
      const state = defaultState.mergeIn(['frames', index], {
        themeColor: '#fff',
        isPrivate: true
      })
      const result = tabUIState.getTabIconColor(state, frameKey)
      assert.equal(result, 'white')
    })

    it('returns black if tab is active, not private but has no themeColor', function * () {
      const state = defaultState.mergeIn(['frames', index], {
        themeColor: false,
        isPrivate: false
      })
      const result = tabUIState.getTabIconColor(state, frameKey)
      assert.equal(result, 'black')
    })
  })

  describe('checkIfTextColor', function () {
    it('returns an empty string if frame is null/undefined', function * () {
      assert.equal(tabUIState.checkIfTextColor(), false)
    })

    it('returns true if colors match', function * () {
      const state = defaultState.mergeIn(['frames', index], {
        themeColor: false,
        isPrivate: false
      })
      const result = tabUIState.checkIfTextColor(state, frameKey, 'black')
      assert.equal(result, true)
    })

    it('returns false if colors does not match', function * () {
      const state = defaultState.mergeIn(['frames', index], {
        themeColor: false,
        isPrivate: true
      })
      const result = tabUIState.checkIfTextColor(state, frameKey, 'black')
      assert.equal(result, false)
    })
  })

  describe('showTabEndIcon', function () {
    it('returns false if frame is null/undefined', function * () {
      assert.equal(tabUIState.showTabEndIcon(), false)
    })

    it('returns false for regular tabs', function * () {
      const state = defaultState.mergeIn(['frames', index], {
        isPrivate: false,
        partitionNumber: 0
      })
      const result = tabUIState.showTabEndIcon(state, frameKey)
      assert.equal(result, false)
    })

    it('returns false for regular tabs', function * () {
      const state = defaultState.mergeIn(['frames', index], {
        isPrivate: false,
        partitionNumber: false
      })
      const result = tabUIState.showTabEndIcon(state, frameKey)
      assert.equal(result, false)
    })

    describe('when tab is partitioned', function () {
      it('returns false if intersection is above 35% of tab size and has relative close icon', function * () {
        const state = defaultState
          .setIn(['frames', index, 'partitionNumber'], 1337)
          .mergeIn(['ui', 'tabs'], {
            intersectionRatio: intersection.at75,
            hoverTabIndex: index
          })
        const result = tabUIState.showTabEndIcon(state, frameKey)
        assert.equal(result, false)
      })

      it('returns false if intersection is above 35% of tab size and has fixed close icon', function * () {
        const state = defaultState
          .setIn(['frames', index, 'partitionNumber'], 1337)
          .setIn(['ui', 'tabs', 'intersectionRatio'], intersection.at75)
        const result = tabUIState.showTabEndIcon(state, frameKey)
        assert.equal(result, false)
      })

      it('returns false if intersection is below 35% of tab size', function * () {
        const state = defaultState
          .setIn(['frames', index, 'partitionNumber'], 1337)
          .setIn(['ui', 'tabs', 'intersectionRatio'], intersection.at40)
        const result = tabUIState.showTabEndIcon(state, frameKey)
        assert.equal(result, false)
      })

      it('returns true if not hovering and intersection is above 35% of tab size', function * () {
        const state = defaultState
          .setIn(['frames', index, 'partitionNumber'], 1337)
          .mergeIn(['ui', 'tabs'], {
            intersectionRatio: intersection.noIntersection,
            hoverTabIndex: 123123
          })
        const result = tabUIState.showTabEndIcon(state, frameKey)
        assert.equal(result, true)
      })

      it('returns true if not active and intersection is above 35% of tab size', function * () {
        const state = defaultState
          .set('activeFrameKey', 1337)
          .setIn(['frames', index, 'partitionNumber'], 1337)
          .mergeIn(['ui', 'tabs'], {
            intersectionRatio: intersection.noIntersection
          })
        const result = tabUIState.showTabEndIcon(state, frameKey)
        assert.equal(result, true)
      })
    })

    describe('when tab is private', function () {
      it('returns false if intersection is above 35% of tab size and has relative close icon', function * () {
        const state = defaultState
          .setIn(['frames', index, 'isPrivate'], true)
          .mergeIn(['ui', 'tabs'], {
            intersectionRatio: intersection.at75,
            hoverTabIndex: index
          })
        const result = tabUIState.showTabEndIcon(state, frameKey)
        assert.equal(result, false)
      })

      it('returns false if intersection is above 35% of tab size and has fixed close icon', function * () {
        const state = defaultState
          .setIn(['frames', index, 'isPrivate'], true)
          .setIn(['ui', 'tabs', 'intersectionRatio'], intersection.at75)
        const result = tabUIState.showTabEndIcon(state, frameKey)
        assert.equal(result, false)
      })

      it('returns false if intersection is below 35% of tab size', function * () {
        const state = defaultState
          .setIn(['frames', index, 'isPrivate'], true)
          .setIn(['ui', 'tabs', 'intersectionRatio'], intersection.at40)
        const result = tabUIState.showTabEndIcon(state, frameKey)
        assert.equal(result, false)
      })

      it('returns true if not hovering and intersection is above 35% of tab size', function * () {
        const state = defaultState
          .setIn(['frames', index, 'isPrivate'], true)
          .mergeIn(['ui', 'tabs'], {
            intersectionRatio: intersection.noIntersection,
            hoverTabIndex: 123123
          })
        const result = tabUIState.showTabEndIcon(state, frameKey)
        assert.equal(result, true)
      })

      it('returns true if not active and intersection is above 35% of tab size', function * () {
        const state = defaultState
          .set('activeFrameKey', 1337)
          .setIn(['frames', index, 'isPrivate'], true)
          .mergeIn(['ui', 'tabs'], {
            intersectionRatio: intersection.noIntersection
          })
        const result = tabUIState.showTabEndIcon(state, frameKey)
        assert.equal(result, true)
      })
    })
  })

  describe('addExtraGutterToTitle', function () {
    it('returns false if frame is null/undefined', function * () {
      assert.equal(tabUIState.addExtraGutterToTitle(), false)
    })
    it('returns true for about:newtab', function * () {
      const state = defaultState.setIn(['frames', index, 'location'], 'about:newtab')
      const result = tabUIState.addExtraGutterToTitle(state, frameKey)
      assert.equal(result, true)
    })
    it('returns false for other locations', function * () {
      const state = defaultState.setIn(['frames', index, 'location'], 'whatelse.com')
      const result = tabUIState.addExtraGutterToTitle(state, frameKey)
      assert.equal(result, false)
    })
  })

  describe('centralizeTabIcons', function () {
    it('returns false if frame is null/undefined', function * () {
      assert.equal(tabUIState.centralizeTabIcons(), false)
    })

    it('returns false if intersection is above 15% of tab size', function * () {
      const state = defaultState
        .setIn(['ui', 'tabs', 'intersectionRatio'], intersection.at45)
      const result = tabUIState.centralizeTabIcons(state, frameKey)
      assert.equal(result, false)
    })

    it('returns true if intersection is below or equal 15% of tab size', function * () {
      const state = defaultState
        .setIn(['ui', 'tabs', 'intersectionRatio'], intersection.at20)
      const result = tabUIState.centralizeTabIcons(state, frameKey)
      assert.equal(result, true)
    })
  })
})
