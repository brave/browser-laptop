/* global describe, it, before, after */
const mockery = require('mockery')
const sinon = require('sinon')
const Immutable = require('immutable')
const assert = require('assert')
const fakeElectron = require('../../../lib/fakeElectron')

const appConstants = require('../../../../../js/constants/appConstants')
require('../../../braveUnit')

describe('spellCheckerReducer unit tests', function () {
  let spellCheckerReducer
  let fakeWebContentsCache, fakeWebContents, fakeSpellChecker
  let getWebContentsSpy, replaceMisspellingSpy, replaceSpy, addWordSpy, removeWordSpy
  const dictionaryWord = 'braave'
  const dictionarySuggestion = 'brave'
  const tabId = 111

  before(function () {
    mockery.enable({
      warnOnReplace: false,
      warnOnUnregistered: false,
      useCleanCache: true
    })

    fakeSpellChecker = {
      addWord: () => {},
      removeWord: () => {}
    }

    fakeWebContents = {
      isDestroyed: () => false,
      replaceMisspelling: (suggestion) => {},
      replace: (word) => {}
    }

    fakeWebContentsCache = {
      getWebContents: (tabId) => {
        return fakeWebContents
      }
    }

    getWebContentsSpy = sinon.spy(fakeWebContentsCache, 'getWebContents')
    replaceMisspellingSpy = sinon.spy(fakeWebContents, 'replaceMisspelling')
    replaceSpy = sinon.spy(fakeWebContents, 'replace')
    addWordSpy = sinon.spy(fakeSpellChecker, 'addWord')
    removeWordSpy = sinon.spy(fakeSpellChecker, 'removeWord')

    mockery.registerMock('electron', fakeElectron)
    mockery.registerMock('../webContentsCache', fakeWebContentsCache)
    mockery.registerMock('../../spellChecker', fakeSpellChecker)

    spellCheckerReducer = require('../../../../../app/browser/reducers/spellCheckerReducer')
  })

  after(function () {
    getWebContentsSpy.restore()
    replaceMisspellingSpy.restore()
    replaceSpy.restore()
    addWordSpy.restore()
    removeWordSpy.restore()
    mockery.disable()
  })

  describe('APP_SPELLING_SUGGESTED', function () {
    before(function () {
      getWebContentsSpy.reset()
      replaceMisspellingSpy.reset()

      spellCheckerReducer(Immutable.Map(), Immutable.fromJS({
        actionType: appConstants.APP_SPELLING_SUGGESTED,
        tabId: tabId,
        suggestion: dictionarySuggestion
      }))
    })
    it('gets the webcontents by tabId', function () {
      assert(getWebContentsSpy.withArgs(tabId).calledOnce)
    })
    it('calls webcontents.replaceMisspelling', function () {
      assert(replaceMisspellingSpy.withArgs(dictionarySuggestion).calledOnce)
    })
  })

  describe('APP_LEARN_SPELLING', function () {
    before(function () {
      getWebContentsSpy.reset()
      replaceMisspellingSpy.reset()
      addWordSpy.reset()

      spellCheckerReducer(Immutable.Map(), Immutable.fromJS({
        actionType: appConstants.APP_LEARN_SPELLING,
        tabId: tabId,
        word: dictionaryWord
      }))
    })
    it('calls spellChecker.addWord', function () {
      assert(addWordSpy.withArgs(dictionaryWord).calledOnce)
    })
    it('gets the webcontents by tabId', function () {
      assert(getWebContentsSpy.withArgs(tabId).calledOnce)
    })
    it('calls webcontents.replaceMisspelling', function () {
      assert(replaceMisspellingSpy.withArgs(dictionaryWord).calledOnce)
    })
  })

  describe('APP_FORGET_LEARNED_SPELLING', function () {
    before(function () {
      getWebContentsSpy.reset()
      replaceSpy.reset()
      removeWordSpy.reset()

      spellCheckerReducer(Immutable.Map(), Immutable.fromJS({
        actionType: appConstants.APP_FORGET_LEARNED_SPELLING,
        tabId: tabId,
        word: dictionaryWord
      }))
    })
    it('calls spellChecker.removeWord', function () {
      assert(removeWordSpy.withArgs(dictionaryWord).calledOnce)
    })
    it('gets the webcontents by tabId', function () {
      assert(getWebContentsSpy.withArgs(tabId).calledOnce)
    })
    it('calls webcontents.replace', function () {
      assert(replaceSpy.withArgs(dictionaryWord).calledOnce)
    })
  })
})
