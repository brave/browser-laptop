/* global describe, it, before, after */
const mockery = require('mockery')
const Immutable = require('immutable')
const assert = require('assert')
const sinon = require('sinon')
const fakeElectron = require('../../../lib/fakeElectron')

const windowConstants = require('../../../../../js/constants/windowConstants')
const appConstants = require('../../../../../js/constants/appConstants')
const settings = require('../../../../../js/constants/settings')
const tabActionConsts = require('../../../../../app/common/constants/tabAction')

require('../../../braveUnit')

let getSettingsValue = true

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
    mockery.registerMock('./stores/appStoreRenderer', fakeAppStoreRenderer)
    mockery.registerMock('../../../js/settings', { getSetting: (settingKey) => {
      return getSettingsValue
    }})
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

  describe('tabActions.didFinishNavigation', function () {
    before(function () {
      this.newState = urlBarReducer(windowState, {actionType: tabActionConsts.FINISH_NAVIGATION,
        tabId: 2,
        navigationState: Immutable.fromJS({
          visibleEntry: {
            virtualURL: 'about:preferences',
            url: 'chrome-extension://blah/about-preferences.html'
          },
          activeEntry: {
            virtualURL: 'dont pick this one',
            url: 'dont pick this one either'
          },
          lastCommittedEntry: {
            virtualURL: 'nope',
            url: 'nope nope'
          }
        })
      })
    })

    it('sets the urlbar location to the navigationEntry visible entry virtualURL', function () {
      assert.equal(this.newState.getIn(['frames', 1, 'navbar', 'urlbar', 'location']), 'about:preferences')
    })

    it('turns off suggestions', function () {
      assert.equal(this.newState.getIn(['frames', 1, 'navbar', 'urlbar', 'suggestions', 'shouldRender']), false)
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
              suggestionList: [{
                location: 'https://brave.com/2.71828'
              }, {
                location: 'https://brave.com/18284'
              }, {
                location: 'https://brave.com/59045'
              }, {
                location: 'https://brave.com/23536'
              }],
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
      this.suggestionClickHandlers = {
        navigateSiteClickHandler: sinon.mock()
      }
      mockery.registerMock('../suggestionClickHandlers', this.suggestionClickHandlers)
      urlBarReducer = require('../../../../../app/renderer/reducers/urlBarReducer')
    })

    after(function () {
      mockery.disable()
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

    describe('APP_URL_BAR_TEXT_CHANGED', function () {
      // TODO
      const action = {
        actionType: appConstants.APP_URL_BAR_TEXT_CHANGED,
        input: 'I am Commander Data and my cat is named Spot'
      }
      const stateWithPrivateTab = windowState.setIn(['frames', 1, 'isPrivate'], true)
      it('does not set a custom search provider for default session tabs', () => {
        const newState = urlBarReducer(windowState, action)
        const hasCustomSearchProvider = newState.hasIn(['frames', 1, 'navbar', 'urlbar', 'searchDetail'])
        assert.equal(hasCustomSearchProvider, false)
      })
      it('searches using custom search provider in Private Tabs with Tor enabled', () => {
        const newState = urlBarReducer(stateWithPrivateTab, action)
        const hasCustomSearchProvider = newState.hasIn(['frames', 1, 'navbar', 'urlbar', 'searchDetail'])
        assert.equal(hasCustomSearchProvider, true)
      })
      it('searches using default search provider in Private Tabs without Tor enabled', () => {
        getSettingsValue = false
        const newState = urlBarReducer(stateWithPrivateTab, action)
        const hasCustomSearchProvider = newState.hasIn(['frames', 1, 'navbar', 'urlbar', 'searchDetail'])
        assert.equal(hasCustomSearchProvider, false)
        getSettingsValue = true
      })

      it('searches using Private Search provider in Private Tabs, with relevant setting value', () => {
        // due to the urlbarreducer only dealing with window state but reading from appState settings,
        // we must mutate appState and then change it back after
        const oldAppState = fakeAppStoreRenderer.state
        fakeAppStoreRenderer.state = oldAppState.set('settings', Immutable.fromJS({
          [settings.USE_ALTERNATIVE_PRIVATE_SEARCH_ENGINE]: true
        }))
        after(() => {
          fakeAppStoreRenderer.state = oldAppState
        })
        const newState = urlBarReducer(stateWithPrivateTab, action)
        const actualSearchInfo = newState.getIn(['frames', 1, 'navbar', 'urlbar', 'searchDetail'])
        assert.ok(actualSearchInfo, 'custom search provider was set')
        assert.equal(actualSearchInfo.get('name'), 'DuckDuckGo', 'uses duck duck go as default private search')
        assert.equal(actualSearchInfo.get('activateSearchEngine'), true)
      })
    })

    describe('WINDOW_URL_BAR_AUTOCOMPLETE_ENABLED', function () {
      it('state is toggled', function () {
        const newState = urlBarReducer(windowState, {actionType: windowConstants.WINDOW_URL_BAR_AUTOCOMPLETE_ENABLED, enabled: false})
        assert.equal(newState.getIn(['frames', 1, 'navbar', 'urlbar', 'suggestions', 'autocompleteEnabled']), false)
      })
    })

    describe('APP_URL_BAR_SUGGESTIONS_CHANGED', function () {
      it('suggestion results can be updated', function () {
        const suggestionList = Immutable.fromJS(['0.207879576'])
        const newState = urlBarReducer(windowState, {actionType: appConstants.APP_URL_BAR_SUGGESTIONS_CHANGED, suggestionList, selectedIndex: null})
        assert.equal(newState.getIn(['frames', 1, 'navbar', 'urlbar', 'suggestions', 'suggestionList']), suggestionList)
        assert.equal(newState.getIn(['frames', 1, 'navbar', 'urlbar', 'suggestions', 'selectedIndex']), null)
      })
      describe('when autocompleteEnabled', function () {
        it('handles a null urlbar location', function () {
          let testState = windowState.setIn(['frames', 1, 'navbar', 'urlbar', 'suggestions', 'autocompleteEnabled'], true)
          testState = testState.setIn(['frames', 1, 'navbar', 'urlbar', 'location'], undefined)
          const suggestionList = Immutable.fromJS([{location: 'http://example.com'}])
          urlBarReducer(testState, {actionType: appConstants.APP_URL_BAR_SUGGESTIONS_CHANGED, suggestionList, selectedIndex: null})
        })
        it('handles a suggestion that is not immutable', function () {
          let testState = windowState.setIn(['frames', 1, 'navbar', 'urlbar', 'suggestions', 'autocompleteEnabled'], true)
          testState = testState.setIn(['frames', 1, 'navbar', 'urlbar', 'location'], 'http://example.com')
          const suggestionList = Immutable.fromJS(['test'])
          urlBarReducer(testState, {actionType: appConstants.APP_URL_BAR_SUGGESTIONS_CHANGED, suggestionList, selectedIndex: null})
        })
        it('handles a suggestion without location', function () {
          let testState = windowState.setIn(['frames', 1, 'navbar', 'urlbar', 'suggestions', 'autocompleteEnabled'], true)
          testState = testState.setIn(['frames', 1, 'navbar', 'urlbar', 'location'], 'http://example.com')
          const suggestionList = Immutable.fromJS([{}])
          urlBarReducer(testState, {actionType: appConstants.APP_URL_BAR_SUGGESTIONS_CHANGED, suggestionList, selectedIndex: null})
        })
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
      it('callback is not called sync', function () {
        const inputState = windowState.setIn(['frames', 1, 'navbar', 'urlbar', 'suggestions', 'suggestionList', Immutable.fromJS([{location: 'https://www.brave.com'}])])
        urlBarReducer(inputState, {actionType: windowConstants.WINDOW_ACTIVE_URL_BAR_SUGGESTION_CLICKED})
        assert.equal(this.suggestionClickHandlers.navigateSiteClickHandler.callCount, 0)
      })
      it('sets the urlbar to disabled', function () {
        const inputState = windowState.setIn(['frames', 1, 'navbar', 'urlbar', 'suggestions', 'suggestionList', Immutable.fromJS([{location: 'https://www.brave.com'}])])
        const newState = urlBarReducer(inputState, {actionType: windowConstants.WINDOW_ACTIVE_URL_BAR_SUGGESTION_CLICKED})
        assert.equal(newState.getIn(['frames', 1, 'navbar', 'urlbar', 'suggestions', 'autocompleteEnabled']), false)
      })
    })
  })
})
