/* global describe, it, before, after */
const mockery = require('mockery')
const Immutable = require('immutable')
const assert = require('assert')
const fakeElectron = require('../../../lib/fakeElectron')

const windowConstants = require('../../../../../js/constants/windowConstants')
const appConstants = require('../../../../../js/constants/appConstants')
require('../../../braveUnit')

const windowState = Immutable.fromJS({
  activeFrameKey: 2,
  searchDetail: {},
  frames: [{
    key: 1,
    tabId: 1,
    navbar: {
      urlbar: {
        location: 'https://www.twitter.com'
      }
    }
  }, {
    key: 2,
    tabId: 2,
    title: 'test',
    adblock: {blocked: []},
    audioPlaybackActive: true,
    computedThemeColor: '#ff0000',
    httpsEverywhere: {a: '1'},
    icon: 'https://www.brave.com/favicon.ico',
    location: 'https://www.brave.com/2',
    navbar: {
      urlbar: {
        location: 'https://www.brave.com/2'
      }
    },
    noScript: {blocked: []},
    themeColor: '#ffffff',
    trackingProtection: {blocked: []},
    fingerprintingProtection: {blocked: []}
  }, {
    key: 3,
    location: 'about:newtab'
  }],
  framesInternal: {
    index: {
      1: 0,
      2: 1,
      3: 2
    },
    tabIndex: {
      1: 0,
      2: 1
    }
  }
})

const fakeAppStoreRenderer = {
  state: Immutable.fromJS({
    sites: {
      'key1': {
        location: 'location1',
        tags: [],
        lastAccessedTime: 123
      },
      'key2': {
        location: 'location2',
        tags: [],
        lastAccessedTime: 123
      },
      'key3': {
        title: 'about:newtab',
        location: undefined,
        tags: [],
        lastAccessedTime: 123
      },
      'key4': {
        location: 'http://www.foo.com/1',
        count: 0,
        lastAccessedTime: 1,
        title: 'www.foo/com/1'
      },
      'key5': {
        location: 'http://www.foo.com/2',
        count: 0,
        lastAccessedTime: 2,
        title: 'www.foo/com/2'
      },
      'key6': {
        location: 'http://www.foo.com/3',
        count: 0,
        lastAccessedTime: 3,
        title: 'www.foo/com/3'
      }
    }
  })
}

describe('urlBarReducer', function () {
  let urlBarReducer
  before(function () {
    mockery.enable({
      warnOnReplace: false,
      warnOnUnregistered: false,
      useCleanCache: true
    })
    mockery.registerMock('electron', fakeElectron)
    mockery.registerMock('../../../js/stores/appStoreRenderer', fakeAppStoreRenderer)
    urlBarReducer = require('../../../../../app/renderer/reducers/urlBarReducer')
  })
  after(function () {
    mockery.disable()
  })

  describe('APP_URL_BAR_TEXT_CHANGED', function () {
    before(function () {
      this.location = 'this test is brought to you by coffee.'
      this.newState = urlBarReducer(windowState, {actionType: appConstants.APP_URL_BAR_TEXT_CHANGED, input: this.location})
    })

    it('Changes urlbar state for active frame key', function () {
      assert.equal(this.newState.getIn(['frames', 1, 'navbar', 'urlbar', 'location']), this.location)
    })

    it('Does not change url bar state of non active frame key', function () {
      assert.equal(this.newState.getIn(['frames', 0, 'navbar', 'urlbar', 'location']), 'https://www.twitter.com')
    })
  })

  describe('WINDOW_SET_NAVIGATED', function () {
    describe('Basic', function () {
      it('updates navbar navbar for URL navigation', function () {
        this.location = 'https:/www.brave.com/3'
        this.newState = urlBarReducer(windowState, {actionType: windowConstants.WINDOW_SET_NAVIGATED, location: this.location})
        assert.equal(this.newState.getIn(['frames', 1, 'navbar', 'urlbar', 'location']), this.location)
      })
      it('does not update navbar for about:newtab nav', function () {
        this.location = 'about:newtab'
        this.newState = urlBarReducer(windowState, {actionType: windowConstants.WINDOW_SET_NAVIGATED, location: this.location, key: 3})
        assert.equal(this.newState.getIn(['frames', 2, 'navbar', 'urlbar', 'location']), undefined)
      })
    })
    describe('In page navigation', function () {
      before(function () {
        this.location = 'https://www.brave.com/'
        this.newState = urlBarReducer(windowState, {actionType: windowConstants.WINDOW_SET_NAVIGATED, location: this.location, isNavigatedInPage: true})
      })
      it('does not reset values', function () {
        assert.equal(this.newState.getIn(['frames', 1, 'title']), 'test')
        assert.deepEqual(this.newState.getIn(['frames', 1, 'adblock']).toJS(), {blocked: []})
        assert.equal(this.newState.getIn(['frames', 1, 'audioPlaybackActive']), true)
        assert.equal(this.newState.getIn(['frames', 1, 'computedThemeColor']), '#ff0000')
        assert.deepEqual(this.newState.getIn(['frames', 1, 'httpsEverywhere']).toJS(), {a: '1'})
        assert.equal(this.newState.getIn(['frames', 1, 'icon']), 'https://www.brave.com/favicon.ico')
        assert.equal(this.newState.getIn(['frames', 1, 'location']), this.location)
        assert.deepEqual(this.newState.getIn(['frames', 1, 'noScript']).toJS(), {blocked: []})
        assert.equal(this.newState.getIn(['frames', 1, 'themeColor']), '#ffffff')
        assert.deepEqual(this.newState.getIn(['frames', 1, 'trackingProtection']).toJS(), {blocked: []})
        assert.deepEqual(this.newState.getIn(['frames', 1, 'fingerprintingProtection']).toJS(), {blocked: []})
      })
    })
    describe('Navigation', function () {
      before(function () {
        this.location = 'https://www.brave.com/'
        this.newState = urlBarReducer(windowState, {actionType: windowConstants.WINDOW_SET_NAVIGATED, location: this.location})
      })
      it('resets values', function () {
        assert.equal(this.newState.getIn(['frames', 1, 'title']), '')
        assert.deepEqual(this.newState.getIn(['frames', 1, 'adblock']).toJS(), {})
        assert.equal(this.newState.getIn(['frames', 1, 'audioPlaybackActive']), false)
        assert.equal(this.newState.getIn(['frames', 1, 'computedThemeColor']), undefined)
        assert.deepEqual(this.newState.getIn(['frames', 1, 'httpsEverywhere']).toJS(), {})
        assert.equal(this.newState.getIn(['frames', 1, 'icon']), undefined)
        assert.equal(this.newState.getIn(['frames', 1, 'location']), this.location)
        assert.deepEqual(this.newState.getIn(['frames', 1, 'noScript']).toJS(), {})
        assert.equal(this.newState.getIn(['frames', 1, 'themeColor']), undefined)
        assert.deepEqual(this.newState.getIn(['frames', 1, 'trackingProtection']).toJS(), {})
        assert.deepEqual(this.newState.getIn(['frames', 1, 'fingerprintingProtection']).toJS(), {})
      })
    })
  })

  describe('WINDOW_SET_NAVIGATION_ABORTED', function () {
    before(function () {
    })
    it('sets the correct frame\'s text', function () {
      // Active frame key is 2 but let's update tabId 1 (frameKey 1 too)
      const action = {
        actionType: windowConstants.WINDOW_SET_NAVIGATION_ABORTED,
        tabId: 1,
        location: 'https://facebook.com/'
      }
      this.newState = urlBarReducer(windowState, action)
      assert.equal(this.newState.getIn(['frames', 0, 'navbar', 'urlbar', 'location']), action.location)
      assert.equal(this.newState.getIn(['frames', 0, 'location']), action.location)
    })
  })

  describe('suggestions', function () {
    let urlBarReducer
    const windowState = Immutable.fromJS({
      activeFrameKey: 2,
      frames: [{
        key: 1
      }, {
        tabId: 2,
        key: 2,
        location: 'https://www.brave.com',
        navbar: {
          urlbar: {
            location: 'about:newtab',
            suggestions: {
              shouldRender: true,
              selectedIndex: 2,
              suggestionList: ['2.71828', '18284', '59045', '23536'],
              searchResults: [
                '3.1415926535'
              ]
            }
          }
        }
      }, {
        key: 3,
        location: 'about:newtab'
      }],
      framesInternal: {
        index: {
          2: 1
        },
        tabIndex: {
          2: 1
        }
      }
    })

    before(function () {
      mockery.enable({
        warnOnReplace: false,
        warnOnUnregistered: false,
        useCleanCache: true
      })
      mockery.registerMock('electron', fakeElectron)
      mockery.registerMock('../../../js/stores/appStoreRenderer', fakeAppStoreRenderer)
      mockery.registerMock('../../../js/settings', { getSetting: (settingKey, settingsCollection, value) => {
        switch (settingKey) {
          default: return true
        }
      }})
      urlBarReducer = require('../../../../../app/renderer/reducers/urlBarReducer')
    })

    after(function () {
      mockery.disable()
    })

    describe('WINDOW_SET_NAVIGATED', function () {
      it('turns off suggestions', function () {
        const newState = urlBarReducer(windowState, {actionType: windowConstants.WINDOW_SET_NAVIGATED, location: 'http://brave.com'})
        assert.equal(newState.getIn(['frames', 1, 'navbar', 'urlbar', 'suggestions', 'shouldRender']), false)
      })
    })

    describe('WINDOW_SET_FINDBAR_SHOWN', function () {
      it('turns off suggestions', function () {
        const newState = urlBarReducer(windowState, {actionType: windowConstants.WINDOW_SET_FINDBAR_SHOWN, shown: true})
        assert.equal(newState.getIn(['frames', 1, 'navbar', 'urlbar', 'suggestions', 'shouldRender']), false)
      })
    })

    describe('WINDOW_PREVIOUS_URL_BAR_SUGGESTION_SELECTED', function () {
      it('turns off suggestions', function () {
        const newState = urlBarReducer(windowState, {actionType: windowConstants.WINDOW_PREVIOUS_URL_BAR_SUGGESTION_SELECTED})
        assert.equal(newState.getIn(['frames', 1, 'navbar', 'urlbar', 'suggestions', 'selectedIndex']), 1)
      })
    })

    describe('WINDOW_NEXT_URL_BAR_SUGGESTION_SELECTED', function () {
      it('turns off suggestions', function () {
        const newState = urlBarReducer(windowState, {actionType: windowConstants.WINDOW_NEXT_URL_BAR_SUGGESTION_SELECTED})
        assert.equal(newState.getIn(['frames', 1, 'navbar', 'urlbar', 'suggestions', 'selectedIndex']), 3)
      })
    })

    describe('WINDOW_SEARCH_SUGGESTION_RESULTS_AVAILABLE', function () {
      it('turns off suggestions', function () {
        const searchResults = Immutable.fromJS(['0110001001110010011010010110000101101110'])
        const newState = urlBarReducer(windowState, {actionType: windowConstants.WINDOW_SEARCH_SUGGESTION_RESULTS_AVAILABLE, searchResults, tabId: 2})
        assert.deepEqual(newState.getIn(['frames', 1, 'navbar', 'urlbar', 'suggestions', 'searchResults']).toJS(), searchResults.toJS())
      })
    })

    describe('APP_URL_BAR_TEXT_CHANGED', function () {
      // TODO
    })

    describe('WINDOW_URL_BAR_AUTOCOMPLETE_ENABLED', function () {
      it('state is toggled', function () {
        const newState = urlBarReducer(windowState, {actionType: windowConstants.WINDOW_URL_BAR_AUTOCOMPLETE_ENABLED, enabled: false})
        assert.equal(newState.getIn(['frames', 1, 'navbar', 'urlbar', 'suggestions', 'autocompleteEnabled']), false)
      })
    })

    describe('WINDOW_SET_URL_BAR_SUGGESTIONS', function () {
      it('suggestion results can be updated', function () {
        const suggestionList = Immutable.fromJS(['0.207879576'])
        const newState = urlBarReducer(windowState, {actionType: windowConstants.WINDOW_SET_URL_BAR_SUGGESTIONS, suggestionList, selectedIndex: null})
        assert.equal(newState.getIn(['frames', 1, 'navbar', 'urlbar', 'suggestions', 'suggestionList']), suggestionList)
        assert.equal(newState.getIn(['frames', 1, 'navbar', 'urlbar', 'suggestions', 'selectedIndex']), null)
      })
    })

    describe('WINDOW_SET_URL_BAR_ACTIVE', function () {
      it('active state can be toggled', function () {
        let newState = urlBarReducer(windowState, {actionType: windowConstants.WINDOW_SET_URL_BAR_ACTIVE, isActive: true})
        assert.equal(newState.getIn(['frames', 1, 'navbar', 'urlbar', 'active']), true)
        newState = urlBarReducer(windowState, {actionType: windowConstants.WINDOW_SET_URL_BAR_ACTIVE, isActive: false})
        assert.equal(newState.getIn(['frames', 1, 'navbar', 'urlbar', 'suggestions', 'shouldRender']), false)
        assert.equal(newState.getIn(['frames', 1, 'navbar', 'urlbar', 'suggestions', 'selectedIndex']), null)
        assert.equal(newState.getIn(['frames', 1, 'navbar', 'urlbar', 'suggestions', 'suggestionList']), null)
      })
    })

    describe('WINDOW_SET_RENDER_URL_BAR_SUGGESTIONS', function () {
      it('turns off suggestions for not enabled', function () {
        const newState = urlBarReducer(windowState, {actionType: windowConstants.WINDOW_SET_RENDER_URL_BAR_SUGGESTIONS, enabled: false})
        assert.equal(newState.getIn(['frames', 1, 'navbar', 'urlbar', 'suggestions', 'shouldRender']), false)
      })
      it('turns on suggestions for enabled', function () {
        let newState = urlBarReducer(windowState, {actionType: windowConstants.WINDOW_SET_RENDER_URL_BAR_SUGGESTIONS, enabled: false})
        newState = urlBarReducer(newState, {actionType: windowConstants.WINDOW_SET_RENDER_URL_BAR_SUGGESTIONS, enabled: true})
        assert.equal(newState.getIn(['frames', 1, 'navbar', 'urlbar', 'suggestions', 'shouldRender']), true)
      })
    })

    describe('WINDOW_ACTIVE_URL_BAR_SUGGESTION_CLICKED', function () {
      it('', function (cb) {
        const inputState = windowState.setIn(['frames', 1, 'navbar', 'urlbar', 'suggestions', 'suggestionList', 2], {onClick: cb})
        // Thiis test will finish when the callback is called from the click event
        urlBarReducer(inputState, {actionType: windowConstants.WINDOW_ACTIVE_URL_BAR_SUGGESTION_CLICKED})
      })
    })
  })
})
