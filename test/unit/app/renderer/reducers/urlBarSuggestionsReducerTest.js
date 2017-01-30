/* global describe, it, before, after */
const mockery = require('mockery')
const Immutable = require('immutable')
const assert = require('assert')
const fakeElectron = require('../../../lib/fakeElectron')

const windowConstants = require('../../../../../js/constants/windowConstants')
require('../../../braveUnit')

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
  }]
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

describe('urlBarSuggestionsReducer unit tests', function () {
  let urlBarSuggestionsReducer
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
    urlBarSuggestionsReducer = require('../../../../../app/renderer/reducers/urlBarSuggestionsReducer')
  })

  after(function () {
    mockery.disable()
  })

  describe('WINDOW_SET_NAVIGATED', function () {
    it('turns off suggestions', function () {
      const newState = urlBarSuggestionsReducer(windowState, {actionType: windowConstants.WINDOW_SET_NAVIGATED})
      assert.equal(newState.getIn(['frames', 1, 'navbar', 'urlbar', 'suggestions', 'shouldRender']), false)
    })
  })

  describe('WINDOW_SET_FINDBAR_SHOWN', function () {
    it('turns off suggestions', function () {
      const newState = urlBarSuggestionsReducer(windowState, {actionType: windowConstants.WINDOW_SET_FINDBAR_SHOWN, shown: true})
      assert.equal(newState.getIn(['frames', 1, 'navbar', 'urlbar', 'suggestions', 'shouldRender']), false)
    })
  })

  describe('WINDOW_PREVIOUS_URL_BAR_SUGGESTION_SELECTED', function () {
    it('turns off suggestions', function () {
      const newState = urlBarSuggestionsReducer(windowState, {actionType: windowConstants.WINDOW_PREVIOUS_URL_BAR_SUGGESTION_SELECTED})
      assert.equal(newState.getIn(['frames', 1, 'navbar', 'urlbar', 'suggestions', 'selectedIndex']), 1)
    })
  })

  describe('WINDOW_NEXT_URL_BAR_SUGGESTION_SELECTED', function () {
    it('turns off suggestions', function () {
      const newState = urlBarSuggestionsReducer(windowState, {actionType: windowConstants.WINDOW_NEXT_URL_BAR_SUGGESTION_SELECTED})
      assert.equal(newState.getIn(['frames', 1, 'navbar', 'urlbar', 'suggestions', 'selectedIndex']), 3)
    })
  })

  describe('WINDOW_SEARCH_SUGGESTION_RESULTS_AVAILABLE', function () {
    it('turns off suggestions', function () {
      const searchResults = Immutable.fromJS(['0110001001110010011010010110000101101110'])
      const newState = urlBarSuggestionsReducer(windowState, {actionType: windowConstants.WINDOW_SEARCH_SUGGESTION_RESULTS_AVAILABLE, searchResults, tabId: 2})
      assert.deepEqual(newState.getIn(['frames', 1, 'navbar', 'urlbar', 'suggestions', 'searchResults']).toJS(), searchResults.toJS())
    })
  })

  describe('WINDOW_SET_NAVBAR_INPUT', function () {
    // TODO
  })

  describe('WINDOW_URL_BAR_AUTOCOMPLETE_ENABLED', function () {
    it('state is toggled', function () {
      const newState = urlBarSuggestionsReducer(windowState, {actionType: windowConstants.WINDOW_URL_BAR_AUTOCOMPLETE_ENABLED, enabled: false})
      assert.equal(newState.getIn(['frames', 1, 'navbar', 'urlbar', 'suggestions', 'autocompleteEnabled']), false)
    })
  })

  describe('WINDOW_SET_URL_BAR_SUGGESTIONS', function () {
    it('suggestion results can be updated', function () {
      const suggestionList = Immutable.fromJS(['0.207879576'])
      const newState = urlBarSuggestionsReducer(windowState, {actionType: windowConstants.WINDOW_SET_URL_BAR_SUGGESTIONS, suggestionList, selectedIndex: null})
      assert.equal(newState.getIn(['frames', 1, 'navbar', 'urlbar', 'suggestions', 'suggestionList']), suggestionList)
      assert.equal(newState.getIn(['frames', 1, 'navbar', 'urlbar', 'suggestions', 'selectedIndex']), null)
    })
  })

  describe('WINDOW_SET_URL_BAR_ACTIVE', function () {
    it('active state can be toggled', function () {
      let newState = urlBarSuggestionsReducer(windowState, {actionType: windowConstants.WINDOW_SET_URL_BAR_ACTIVE, isActive: true})
      assert.equal(newState.getIn(['frames', 1, 'navbar', 'urlbar', 'active']), true)
      newState = urlBarSuggestionsReducer(windowState, {actionType: windowConstants.WINDOW_SET_URL_BAR_ACTIVE, isActive: false})
      assert.equal(newState.getIn(['frames', 1, 'navbar', 'urlbar', 'suggestions', 'shouldRender']), false)
      assert.equal(newState.getIn(['frames', 1, 'navbar', 'urlbar', 'suggestions', 'selectedIndex']), null)
      assert.equal(newState.getIn(['frames', 1, 'navbar', 'urlbar', 'suggestions', 'suggestionList']), null)
    })
  })

  describe('WINDOW_SET_RENDER_URL_BAR_SUGGESTIONS', function () {
    it('turns off suggestions for not enabled', function () {
      const newState = urlBarSuggestionsReducer(windowState, {actionType: windowConstants.WINDOW_SET_RENDER_URL_BAR_SUGGESTIONS, enabled: false})
      assert.equal(newState.getIn(['frames', 1, 'navbar', 'urlbar', 'suggestions', 'shouldRender']), false)
    })
    it('turns on suggestions for enabled', function () {
      let newState = urlBarSuggestionsReducer(windowState, {actionType: windowConstants.WINDOW_SET_RENDER_URL_BAR_SUGGESTIONS, enabled: false})
      newState = urlBarSuggestionsReducer(newState, {actionType: windowConstants.WINDOW_SET_RENDER_URL_BAR_SUGGESTIONS, enabled: true})
      assert.equal(newState.getIn(['frames', 1, 'navbar', 'urlbar', 'suggestions', 'shouldRender']), true)
    })
  })

  describe('WINDOW_ACTIVE_URL_BAR_SUGGESTION_CLICKED', function () {
    it('', function (cb) {
      const inputState = windowState.setIn(['frames', 1, 'navbar', 'urlbar', 'suggestions', 'suggestionList', 2], {onClick: cb})
      // Thiis test will finish when the callback is called from the click event
      urlBarSuggestionsReducer(inputState, {actionType: windowConstants.WINDOW_ACTIVE_URL_BAR_SUGGESTION_CLICKED})
    })
  })
})
