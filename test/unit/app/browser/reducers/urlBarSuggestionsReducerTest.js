/* global describe, it, before, after, afterEach */
const mockery = require('mockery')
const sinon = require('sinon')
const Immutable = require('immutable')
const assert = require('assert')

const appConstants = require('../../../../../js/constants/appConstants')
require('../../../braveUnit')

describe('urlBarSuggestionsReducer', function () {
  let urlBarSuggestionsReducer
  before(function () {
    mockery.enable({
      warnOnReplace: false,
      warnOnUnregistered: false,
      useCleanCache: true
    })

    this.siteSuggestionsStub = {
      init: sinon.stub(),
      add: sinon.stub()
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
    this.suggestionStub.generateNewSuggestionsList.reset()
    this.suggestionStub.generateNewSearchXHRResults.reset()
  })

  const site1 = {
    location: 'https://brave.com'
  }

  const initState = Immutable.fromJS({
    sites: {
      'key': site1
    }
  })

  describe('APP_SET_STATE', function () {
    it('inits the suggestions lib with sites', function () {
      urlBarSuggestionsReducer(Immutable.Map(), {actionType: appConstants.APP_SET_STATE, appState: initState})
      const callCount = this.siteSuggestionsStub.init.calledOnce
      assert.equal(callCount, 1)
      assert.deepEqual(this.siteSuggestionsStub.init.args[0][0], [site1])
    })
  })
  describe('APP_ADD_SITE', function () {
    it('adds a site in the suggestions lib', function () {
      const newState = urlBarSuggestionsReducer(initState, {actionType: appConstants.APP_ADD_SITE, siteDetail: site1})
      const callCount = this.siteSuggestionsStub.add.calledOnce
      assert.equal(callCount, 1)
      assert.deepEqual(this.siteSuggestionsStub.add.args[0][0], site1)
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
