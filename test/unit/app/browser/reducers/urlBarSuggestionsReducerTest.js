/* global describe, it, before, after, afterEach */
const mockery = require('mockery')
const sinon = require('sinon')
const Immutable = require('immutable')
const assert = require('assert')

const appConstants = require('../../../../../js/constants/appConstants')
require('../../../braveUnit')
const siteTags = require('../../../../../js/constants/siteTags')

describe('urlBarSuggestionsReducer unit test', function () {
  let urlBarSuggestionsReducer

  const site1 = {
    location: 'https://brave.com',
    type: siteTags.BOOKMARK,
    partitionNumber: 0
  }

  const initState = Immutable.fromJS({
    bookmarks: {
      'key': site1
    },
    historySites: {}
  })

  before(function () {
    mockery.enable({
      warnOnReplace: false,
      warnOnUnregistered: false,
      useCleanCache: true
    })

    this.siteSuggestionsStub = {
      init: sinon.stub(),
      add: sinon.stub(),
      remove: sinon.stub()
    }
    mockery.registerMock('../../common/lib/siteSuggestions', this.siteSuggestionsStub)

    this.suggestionStub = {
      generateNewSuggestionsList: sinon.stub(),
      generateNewSearchXHRResults: sinon.stub()
    }
    mockery.registerMock('../../common/lib/suggestion', this.suggestionStub)

    urlBarSuggestionsReducer = require('../../../../../app/browser/reducers/urlBarSuggestionsReducer')
  })

  after(function () {
    mockery.disable()
  })

  afterEach(function () {
    this.siteSuggestionsStub.init.reset()
    this.siteSuggestionsStub.add.reset()
    this.siteSuggestionsStub.remove.reset()
    this.suggestionStub.generateNewSuggestionsList.reset()
    this.suggestionStub.generateNewSearchXHRResults.reset()
  })

  describe('APP_SET_STATE', function () {
    it('inits the suggestions lib with sites', function () {
      urlBarSuggestionsReducer(Immutable.Map(), {actionType: appConstants.APP_SET_STATE, appState: initState})
      const callCount = this.siteSuggestionsStub.init.calledOnce
      assert.equal(callCount, 1)
      assert.deepEqual(this.siteSuggestionsStub.init.args[0][0], Immutable.fromJS({
        'key': site1
      }))
    })
  })
  describe('APP_ADD_BOOKMARK', function () {
    it('adds a site in the suggestions lib', function () {
      const newState = urlBarSuggestionsReducer(initState, {actionType: appConstants.APP_ADD_BOOKMARK, siteDetail: site1})
      const callCount = this.siteSuggestionsStub.add.calledOnce
      assert.equal(callCount, 1)
      assert.deepEqual(this.siteSuggestionsStub.add.args[0][0], Immutable.fromJS(site1))
      assert.deepEqual(newState, initState)
    })
  })
  describe('APP_REMOVE_BOOKMARK', function () {
    let customState

    before(function () {
      customState = initState
        .setIn(['bookmarks', '1'], Immutable.fromJS({
          location: 'https://brianbondy.com',
          type: siteTags.BOOKMARK,
          partitionNumber: 0
        }))
        .setIn(['bookmarks', '2'], Immutable.fromJS({
          location: 'https://clifton.io',
          type: siteTags.BOOKMARK,
          partitionNumber: 0
        }))
        .setIn(['historySites', 'https://brianbondy.com|0'], Immutable.fromJS({
          location: 'https://brianbondy.com',
          partitionNumber: 0
        }))
    })

    it('null case', function () {
      urlBarSuggestionsReducer(customState, {
        actionType: appConstants.APP_REMOVE_BOOKMARK
      })
      assert.equal(this.siteSuggestionsStub.remove.notCalled, true)
    })

    it('bookmark key is list (multiple bookmarks)', function () {
      urlBarSuggestionsReducer(customState, {
        actionType: appConstants.APP_REMOVE_BOOKMARK,
        bookmarkKey: [
          '2',
          'key'
        ]
      })
      const argument = Immutable.List()
        .push(customState.getIn(['bookmarks', '2']))
        .push(customState.getIn(['bookmarks', 'key']))
      assert.deepEqual(this.siteSuggestionsStub.remove.args[0][0], argument)
    })

    it('bookmark key is map (single bookmark)', function () {
      urlBarSuggestionsReducer(customState, {
        actionType: appConstants.APP_REMOVE_BOOKMARK,
        bookmarkKey: '2'
      })
      const argument = customState.getIn(['bookmarks', '2'])
      assert.deepEqual(this.siteSuggestionsStub.remove.args[0][0], argument)
    })

    it('bookmark key is map and history with the same site exists', function () {
      urlBarSuggestionsReducer(customState, {
        actionType: appConstants.APP_REMOVE_BOOKMARK,
        bookmarkKey: '1'
      })
      assert.equal(this.siteSuggestionsStub.remove.notCalled, true)
    })

    it('bookmark key is list and history with the same site exists', function () {
      urlBarSuggestionsReducer(customState, {
        actionType: appConstants.APP_REMOVE_BOOKMARK,
        bookmarkKey: [
          '1',
          'key'
        ]
      })
      const argument = Immutable.List()
        .push(customState.getIn(['bookmarks', 'key']))
      assert.deepEqual(this.siteSuggestionsStub.remove.args[0][0], argument)
    })
  })

  describe('APP_REMOVE_HISTORY_SITE', function () {
    let customState

    before(function () {
      customState = initState
        .setIn(['historySites', '1'], Immutable.fromJS({
          location: 'https://brianbondy.com'
        }))
        .setIn(['historySites', '2'], Immutable.fromJS({
          location: 'https://clifton.io'
        }))
        .setIn(['historySites', '3'], Immutable.fromJS({
          location: 'https://brave.com'
        }))
        .setIn(['cache', 'bookmarkLocation', 'https://brave.com'], Immutable.fromJS([
          'https://brave.com|0|0'
        ]))
    })

    it('null case', function () {
      urlBarSuggestionsReducer(customState, {
        actionType: appConstants.APP_REMOVE_HISTORY_SITE
      })
      assert.equal(this.siteSuggestionsStub.remove.notCalled, true)
    })

    it('history key is list (multiple history sites)', function () {
      urlBarSuggestionsReducer(customState, {
        actionType: appConstants.APP_REMOVE_HISTORY_SITE,
        historyKey: [
          '1',
          '2'
        ]
      })
      const argument = Immutable.List()
        .push(customState.getIn(['historySites', '1']))
        .push(customState.getIn(['historySites', '2']))
      assert.deepEqual(this.siteSuggestionsStub.remove.args[0][0], argument)
    })

    it('history key is map (single history site)', function () {
      urlBarSuggestionsReducer(customState, {
        actionType: appConstants.APP_REMOVE_HISTORY_SITE,
        historyKey: '1'
      })
      const argument = customState.getIn(['historySites', '1'])
      assert.deepEqual(this.siteSuggestionsStub.remove.args[0][0], argument)
    })

    it('history key is list and bookmark with the same site exists', function () {
      urlBarSuggestionsReducer(customState, {
        actionType: appConstants.APP_REMOVE_HISTORY_SITE,
        historyKey: [
          '1',
          '3'
        ]
      })
      const argument = Immutable.List()
        .push(customState.getIn(['historySites', '1']))
      assert.deepEqual(this.siteSuggestionsStub.remove.args[0][0], argument)
    })

    it('history key is map and bookmark with the same site exists', function () {
      urlBarSuggestionsReducer(customState, {
        actionType: appConstants.APP_REMOVE_HISTORY_SITE,
        historyKey: '3'
      })
      assert.equal(this.siteSuggestionsStub.remove.notCalled, true)
    })
  })
  describe('APP_ADD_HISTORY_SITE', function () {
    it('adds a site in the suggestions lib', function () {
      const newState = urlBarSuggestionsReducer(initState, {actionType: appConstants.APP_ADD_HISTORY_SITE, siteDetail: site1})
      const callCount = this.siteSuggestionsStub.add.calledOnce
      assert.equal(callCount, 1)
      assert.deepEqual(this.siteSuggestionsStub.add.args[0][0], Immutable.fromJS(site1))
      assert.deepEqual(newState, initState)
    })
  })
  describe('APP_EDIT_BOOKMARK', function () {
    it('adds a site in the suggestions lib', function () {
      const newState = urlBarSuggestionsReducer(initState, {actionType: appConstants.APP_EDIT_BOOKMARK, siteDetail: site1})
      const callCount = this.siteSuggestionsStub.add.calledOnce
      assert.equal(callCount, 1)
      assert.deepEqual(this.siteSuggestionsStub.add.args[0][0], Immutable.fromJS(site1))
      assert.deepEqual(newState, initState)
    })
  })
  describe('APP_URL_BAR_TEXT_CHANGED', function () {
    it('regenerates suggestions', function () {
      const windowId = 1
      const tabId = 42
      const input = 'hello world'
      const newState = urlBarSuggestionsReducer(initState, {actionType: appConstants.APP_URL_BAR_TEXT_CHANGED, tabId, windowId, input})
      const callCount = this.suggestionStub.generateNewSuggestionsList.calledOnce
      assert.equal(callCount, 1)
      assert.deepEqual(this.suggestionStub.generateNewSuggestionsList.args[0][0], initState)
      assert.deepEqual(this.suggestionStub.generateNewSuggestionsList.args[0][1], windowId)
      assert.deepEqual(this.suggestionStub.generateNewSuggestionsList.args[0][2], tabId)
      assert.deepEqual(this.suggestionStub.generateNewSuggestionsList.args[0][3], input)
      assert.deepEqual(newState, initState)

      const xhrCallCount = this.suggestionStub.generateNewSearchXHRResults.calledOnce
      assert.equal(xhrCallCount, 1)
      assert.deepEqual(this.suggestionStub.generateNewSearchXHRResults.args[0][0], initState)
      assert.deepEqual(this.suggestionStub.generateNewSearchXHRResults.args[0][1], windowId)
      assert.deepEqual(this.suggestionStub.generateNewSearchXHRResults.args[0][2], tabId)
      assert.deepEqual(this.suggestionStub.generateNewSearchXHRResults.args[0][3], input)
    })
  })
})
