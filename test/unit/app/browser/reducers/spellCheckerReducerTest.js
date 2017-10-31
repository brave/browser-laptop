/* global describe, it, before, after */
const mockery = require('mockery')
const sinon = require('sinon')
const Immutable = require('immutable')
const assert = require('assert')
const fakeElectron = require('../../../lib/fakeElectron')

const appConstants = require('../../../../../js/constants/appConstants')
const settings = require('../../../../../js/constants/settings')
require('../../../braveUnit')

describe('spellCheckerReducer unit tests', function () {
  let spellCheckerReducer
  let fakeWebContentsCache, fakeWebContents, fakeSpellChecker, fakeSettings, fakeUserPrefs
  let getWebContentsSpy, replaceMisspellingSpy, replaceSpy, addWordSpy, removeWordSpy,
    setUserPrefSpy, getSettingSpy
  let spellCheckEnabled
  const dictionaryWord = 'braave'
  const dictionarySuggestion = 'brave'
  const tabId = 111
  const enabledPref = 'browser.enable_spellchecking'
  const dictsPref = 'spellcheck.dictionaries'
  const dicts = ['en-US', 'fr-FR']

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

    fakeSettings = {
      getSetting: (settingKey, settingsCollection) => {
        switch (settingKey) {
          case settings.SPELLCHECK_ENABLED:
            return spellCheckEnabled
          case settings.SPELLCHECK_LANGUAGES:
            return dicts
        }
      }
    }

    fakeUserPrefs = {
      setUserPref: (path, value, incognito = false) => {}
    }

    getWebContentsSpy = sinon.spy(fakeWebContentsCache, 'getWebContents')
    replaceMisspellingSpy = sinon.spy(fakeWebContents, 'replaceMisspelling')
    replaceSpy = sinon.spy(fakeWebContents, 'replace')
    addWordSpy = sinon.spy(fakeSpellChecker, 'addWord')
    removeWordSpy = sinon.spy(fakeSpellChecker, 'removeWord')
    setUserPrefSpy = sinon.spy(fakeUserPrefs, 'setUserPref')
    getSettingSpy = sinon.spy(fakeSettings, 'getSetting')

    mockery.registerMock('electron', fakeElectron)
    mockery.registerMock('../webContentsCache', fakeWebContentsCache)
    mockery.registerMock('../../spellChecker', fakeSpellChecker)
    mockery.registerMock('../../../js/state/userPrefs', fakeUserPrefs)
    mockery.registerMock('../../../js/settings', fakeSettings)

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

  describe('APP_WINDOW_CREATED', function () {
    describe('APP_WINDOW_CREATED with enabled', function () {
      before(function () {
        getSettingSpy.reset()
        setUserPrefSpy.reset()
        spellCheckEnabled = true
        spellCheckerReducer(Immutable.Map(), Immutable.fromJS({
          actionType: appConstants.APP_WINDOW_CREATED
        }))
      })
      it('calls setUserPref to set enabledPref to true', function () {
        assert(setUserPrefSpy.withArgs(enabledPref, true).calledOnce)
      })
      it('calls setUserPref to set dictionaries', function () {
        assert(setUserPrefSpy.withArgs(dictsPref, dicts).calledOnce)
      })
    })
    describe('APP_WINDOW_CREATED with disabled', function () {
      before(function () {
        getSettingSpy.reset()
        setUserPrefSpy.reset()
        spellCheckEnabled = false
        spellCheckerReducer(Immutable.Map(), Immutable.fromJS({
          actionType: appConstants.APP_WINDOW_CREATED
        }))
      })
      it('calls setUserPref to set enabledPref to true', function () {
        assert(setUserPrefSpy.withArgs(enabledPref, false).calledOnce)
      })
      it('not calls setUserPref to set dictionaries', function () {
        assert(setUserPrefSpy.withArgs(dictsPref, dicts).notCalled)
      })
    })
  })

  describe('APP_CHANGE_SETTING', function () {
    describe('SPELLCHECK_ENABLED with enabled', function () {
      before(function () {
        getSettingSpy.reset()
        setUserPrefSpy.reset()
        spellCheckEnabled = true
        spellCheckerReducer(Immutable.Map(), Immutable.fromJS({
          actionType: appConstants.APP_CHANGE_SETTING,
          key: settings.SPELLCHECK_ENABLED
        }))
      })
      it('calls setUserPref to set enabledPref to true', function () {
        assert(setUserPrefSpy.withArgs(enabledPref, true).calledOnce)
      })
      it('calls setUserPref to set dictionaries', function () {
        assert(setUserPrefSpy.withArgs(dictsPref, dicts).calledOnce)
      })
    })
    describe('SPELLCHECK_ENABLED with disabled', function () {
      before(function () {
        getSettingSpy.reset()
        setUserPrefSpy.reset()
        spellCheckEnabled = false
        spellCheckerReducer(Immutable.Map(), Immutable.fromJS({
          actionType: appConstants.APP_CHANGE_SETTING,
          key: settings.SPELLCHECK_ENABLED
        }))
      })
      it('calls setUserPref to set enabledPref to true', function () {
        assert(setUserPrefSpy.withArgs(enabledPref, false).calledOnce)
      })
      it('not calls setUserPref to set dictionaries', function () {
        assert(setUserPrefSpy.withArgs(dictsPref, dicts).notCalled)
      })
    })
    describe('SPELLCHECK_LANGUAGES with enabled', function () {
      before(function () {
        getSettingSpy.reset()
        setUserPrefSpy.reset()
        spellCheckEnabled = true
        spellCheckerReducer(Immutable.Map(), Immutable.fromJS({
          actionType: appConstants.APP_CHANGE_SETTING,
          key: settings.SPELLCHECK_LANGUAGES
        }))
      })
      it('calls setUserPref to set enabledPref to true', function () {
        assert(setUserPrefSpy.withArgs(enabledPref, true).calledOnce)
      })
      it('calls setUserPref to set dictionaries', function () {
        assert(setUserPrefSpy.withArgs(dictsPref, dicts).calledOnce)
      })
    })
    describe('SPELLCHECK_LANGUAGES with disabled', function () {
      before(function () {
        getSettingSpy.reset()
        setUserPrefSpy.reset()
        spellCheckEnabled = false
        spellCheckerReducer(Immutable.Map(), Immutable.fromJS({
          actionType: appConstants.APP_CHANGE_SETTING,
          key: settings.SPELLCHECK_LANGUAGES
        }))
      })
      it('calls setUserPref to set enabledPref to true', function () {
        assert(setUserPrefSpy.withArgs(enabledPref, false).calledOnce)
      })
      it('not calls setUserPref to set dictionaries', function () {
        assert(setUserPrefSpy.withArgs(dictsPref, dicts).notCalled)
      })
    })
    describe('other settings', function () {
      before(function () {
        getSettingSpy.reset()
        setUserPrefSpy.reset()
        spellCheckEnabled = false
        spellCheckerReducer(Immutable.Map(), Immutable.fromJS({
          actionType: appConstants.APP_CHANGE_SETTING,
          key: 'other-settings'
        }))
      })
      it('not calls setUserPref to set enabledPref to true', function () {
        assert(setUserPrefSpy.withArgs(enabledPref, false).notCalled)
      })
      it('not calls setUserPref to set dictionaries', function () {
        assert(setUserPrefSpy.withArgs(dictsPref, dicts).notCalled)
      })
    })
  })
})
