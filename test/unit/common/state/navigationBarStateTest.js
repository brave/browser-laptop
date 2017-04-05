/* global describe, it, before */
const navigationBarState = require('../../../../app/common/state/navigationBarState')
const Immutable = require('immutable')
const assert = require('chai').assert

const defaultAppState = Immutable.fromJS({
  tabs: []
})

const defaultState = navigationBarState.defaultState

describe('navigationBarState', function () {
  describe('getNavigationBar', function () {
    before(function () {
      this.appState = defaultAppState.set('tabs', Immutable.fromJS([
        { tabId: 1,
          frame: {
            navbar: defaultState.set('test', '1')
          }
        },
        { tabId: 2, frame: {} },
        { tabId: 3 }
      ]))
    })

    it('returns the navbar state for `tabId`', function () {
      assert.deepEqual(navigationBarState.getNavigationBar(this.appState, 1), defaultState.set('test', '1'))
    })

    it('returns the default navbar state for `tabId` if missing', function () {
      assert.deepEqual(navigationBarState.getNavigationBar(this.appState, 2), defaultState)
      assert.deepEqual(navigationBarState.getNavigationBar(this.appState, 3), defaultState)
      assert.deepEqual(navigationBarState.getNavigationBar(this.appState, 4), defaultState)
    })
  })

  describe('getUrlBar', function () {
    before(function () {
      this.appState = defaultAppState.set('tabs', Immutable.fromJS([
        { tabId: 1,
          frame: {
            navbar: defaultState.setIn(['urlbar', 'test'], '1')
          }
        },
        { tabId: 2, frame: {} },
        { tabId: 3 }
      ]))
    })

    it('returns the urlbar state for `tabId`', function () {
      assert.deepEqual(navigationBarState.getUrlBar(this.appState, 1), defaultState.get('urlbar').set('test', '1'))
    })

    it('returns the default urlbar state for `tabId` if missing', function () {
      assert.deepEqual(navigationBarState.getUrlBar(this.appState, 2), defaultState.get('urlbar'))
      assert.deepEqual(navigationBarState.getUrlBar(this.appState, 3), defaultState.get('urlbar'))
      assert.deepEqual(navigationBarState.getUrlBar(this.appState, 4), defaultState.get('urlbar'))
    })
  })
})
