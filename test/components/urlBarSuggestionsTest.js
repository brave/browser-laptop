/* global describe, it, before, beforeEach */

const Brave = require('../lib/brave')
const messages = require('../../js/constants/messages')
const settings = require('../../js/constants/settings')
const {urlInput, urlBarSuggestions} = require('../lib/selectors')

describe('urlBarSuggestions', function () {
  function * setup (client) {
    yield client
      .waitForUrl(Brave.newTabUrl)
      .waitForBrowserWindow()
      .waitForVisible(urlInput)
  }

  Brave.beforeEach(this)
  beforeEach(function * () {
    this.page1Url = Brave.server.url('page1.html')
    this.page2Url = Brave.server.url('page2.html')

    yield setup(this.app.client)
    yield this.app.client
      .tabByIndex(0)
      .loadUrl(this.page1Url)
      .windowByUrl(Brave.browserWindowUrl)
      .waitForSiteEntry(this.page1Url)
      .tabByIndex(0)
      .loadUrl(this.page2Url)
      .windowByUrl(Brave.browserWindowUrl)
      .waitForSiteEntry(this.page2Url)
      .ipcSend(messages.SHORTCUT_NEW_FRAME)
      .waitForUrl(Brave.newTabUrl)
      .windowByUrl(Brave.browserWindowUrl)
      .waitForExist('[data-test-active-tab][data-frame-key="2"]')
      .waitForElementFocus(urlInput)
  })

  it('show suggestion when single letter is typed in', function * () {
    yield this.app.client.ipcSend('shortcut-focus-url')
      .waitForElementFocus(urlInput)
      .setInputText(urlInput, 'a')
      .waitUntil(function () {
        return this.getValue(urlInput).then((val) => val === 'a')
      })
      .waitForExist(urlBarSuggestions)
  })

  it('deactivates suggestions on escape', function * () {
    yield this.app.client
      .setInputText(urlInput, 'Page 1')
      .waitForExist(urlBarSuggestions + ' li.suggestionItem[data-index="0"]')
      .keys(Brave.keys.ESCAPE)
      .waitUntil(function () {
        return this.isExisting(urlBarSuggestions).then((exists) => exists === false)
      })
  })

  it('deactivates suggestions on backspace', function * () {
    yield this.app.client
      .setInputText(urlInput, 'Page 1')
      .waitForExist(urlBarSuggestions + ' li.suggestionItem[data-index="0"]')
      .keys(Brave.keys.BACKSPACE)
      .waitUntil(function () {
        return this.isExisting(urlBarSuggestions).then((exists) => exists === false)
      })
  })

  it('deactivates suggestions on delete', function * () {
    yield this.app.client
      .setInputText(urlInput, 'Page 1')
      .waitForExist(urlBarSuggestions + ' li.suggestionItem[data-index="0"]')
      .keys(Brave.keys.DELETE)
      .waitUntil(function () {
        return this.isExisting(urlBarSuggestions).then((exists) => exists === false)
      })
  })

  it('navigates to a suggestion when clicked', function * () {
    yield this.app.client
      .setInputText(urlInput, 'Page 1')
      .waitForVisible(urlBarSuggestions + ' li.suggestionItem[data-index="0"]')
      .click(urlBarSuggestions + ' li.suggestionItem[data-index="0"]')
      .tabByIndex(1)
      .waitForUrl(this.page1Url)
      .waitForTabCount(2)
  })

  it('navigates to non-first suggestion when clicked', function * () {
    yield this.app.client
      .setInputText(urlInput, 'Page')
      .waitForVisible(urlBarSuggestions + ' li.suggestionItem[data-index="1"]')
      .click(urlBarSuggestions + ' li.suggestionItem[data-index="1"]')
      .tabByIndex(1)
      .waitForUrl(this.page2Url)
      .waitForTabCount(2)
  })

  it('navigates to a suggestion with keyboard', function * () {
    yield this.app.client
      .setInputText(urlInput, 'Page')
      .waitForExist(urlBarSuggestions)
      .keys(Brave.keys.DOWN)
      .waitForExist(urlBarSuggestions + ' li.suggestionItem[data-index="0"].selected')
      .keys(Brave.keys.DOWN)
      .waitForExist(urlBarSuggestions + ' li.suggestionItem[data-index="1"].selected')
      .keys(Brave.keys.ENTER)
      .tabByIndex(1).getUrl().should.become(this.page1Url)
  })

  it('selects a location auto complete result but not for titles', function * () {
    const page2Url = Brave.server.url('page2.html')
    yield this.app.client
      .setValue(urlInput, 'http://')
      .waitUntil(function () {
        return this.getValue(urlInput).then((val) => val === page2Url)
      })
      .waitForExist(urlBarSuggestions + ' li.selected')
      .setValue(urlInput, 'Page')
      .waitForExist(urlBarSuggestions + ' li.selected', 1000, true)
  })

  it('on suggestion mouseover, appends autocomplete URLs without interrupting typing', function * () {
    const page1Url = Brave.server.url('page1.html')
    const page2Url = Brave.server.url('page2.html')
    const pagePartialUrl = Brave.server.url('page')
    // test that entering a partial URL which matches two options autocompletes initially to 1st option,
    // but switches to other option when that is highlighted, while keeping cursor in same position,
    // so that finally, if the rest of the 1st option is entered via keyboard, it overwrites the suggestion from the mouse
    yield this.app.client
      .keys(pagePartialUrl)
      .waitUntil(function () {
        return this.getValue(urlInput).then(function (val) {
          return val === page2Url // after entering partial URL matching two options, 1st is tentatively filled in (_without_ moving cursor to end)
        })
      })
      .waitForExist(urlBarSuggestions + ' li.suggestionItem')
      .moveToObject(urlBarSuggestions + ' li.suggestionItem:not(.selected)')
      .waitUntil(function () {
        return this.getValue(urlInput).then(function (val) {
          return val === page1Url // mousing over 2nd option tentatively completes URL with 2nd option (_without_ moving cursor to end)
        })
      })
      .keys('2.html')
      .waitUntil(function () {
        return this.getValue(urlInput).then(function (val) {
          return val === page2Url // without moving mouse, typing rest of 1st option URL overwrites the autocomplete from mouseover
        })
      })
  })

  it('selection is not reset when pressing non-input key', function * () {
    const pagePartialUrl = Brave.server.url('page')
    yield this.app.client
      .setInputText(urlInput, pagePartialUrl)
      .waitForVisible(urlBarSuggestions)
      .keys(Brave.keys.DOWN)
      .waitForInputText(urlInput, this.page1Url)
      .keys(Brave.keys.CONTROL)
      .keys(Brave.keys.CONTROL)
      .waitForSelectedText('1.html')
  })

  it('non-prefixed active suggestion loads the suggestion when enter is pressed', function * () {
    yield this.app.client
      .setInputText(urlInput, 'pref')
      .waitForVisible(urlBarSuggestions)
      .keys(Brave.keys.DOWN)
      .waitForExist(urlBarSuggestions + ' li.suggestionItem[data-index="0"].selected')
      .keys(Brave.keys.ENTER)
      .waitForInputText(urlInput, 'about:preferences')
  })

  it('no active suggestion witch matching suggestions does a search', function * () {
    yield this.app.client
      .setInputText(urlInput, 'ave')
      .waitForVisible(urlBarSuggestions)
      .waitForExist(urlBarSuggestions + ' li.suggestionItem[data-index="0"]:not(.selected)')
      .keys(Brave.keys.ENTER)
      .waitForInputText(urlInput, /google.*\/.*q=ave/)
  })
})

describe('search suggestions', function () {
  Brave.beforeAll(this)

  before(function * () {
    yield this.app.client
      .waitForUrl(Brave.newTabUrl)
      .waitForBrowserWindow()
      .waitForVisible(urlInput)
  })

  it('Finds search suggestions and performs a search when selected', function * () {
    yield this.app.client
      .changeSetting(settings.OFFER_SEARCH_SUGGESTIONS, true)
      .setInputText(urlInput, 'what is')
      .waitForVisible(urlBarSuggestions)
      .keys(Brave.keys.DOWN)
      .waitForExist(urlBarSuggestions + ' li.suggestionItem[data-index="0"]:not(.selected)')
      .keys(Brave.keys.ENTER)
      .waitForInputText(urlInput, /google.*\/.*q=what.+is/)
  })
})
