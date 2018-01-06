/* global describe, it, beforeEach */

const Brave = require('../lib/brave')
const settings = require('../../js/constants/settings')
const {urlInput, urlBarSuggestions} = require('../lib/selectors')
const Immutable = require('immutable')
const aboutHistoryState = require('../../app/common/state/aboutHistoryState')

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
      .waitForHistoryEntry(this.page1Url)
      .tabByIndex(0)
      .loadUrl(this.page2Url)
      .windowByUrl(Brave.browserWindowUrl)
      .waitForHistoryEntry(this.page2Url)
      .newTab()
      .waitForUrl(Brave.newTabUrl)
      .windowByUrl(Brave.browserWindowUrl)
      .waitForExist('[data-test-active-tab][data-frame-key="2"]')
      .waitForElementFocus(urlInput)
  })

  it('does not show Brave default sites', function * () {
    yield this.app.client.ipcSend('shortcut-focus-url')
      .waitForElementFocus(urlInput)
      .setValue(urlInput, 'twitter')
      .waitForElementCount('[data-test-id="list-item"]', 1)
  })

  it('show suggestion when single letter is typed in', function * () {
    yield this.app.client.ipcSend('shortcut-focus-url')
      .waitForElementFocus(urlInput)
      .setInputText(urlInput, 'about:about')
      .waitForExist(urlBarSuggestions)
  })

  it('deactivates suggestions on escape', function * () {
    yield this.app.client
      .setInputText(urlInput, 'Page 1')
      .waitForExist(urlBarSuggestions + ' [data-test-id="list-item"][data-index="0"]')
      .keys(Brave.keys.ESCAPE)
      .waitForElementCount(urlBarSuggestions, 0)
  })

  it('deactivates suggestions on backspace', function * () {
    yield this.app.client
      .setInputText(urlInput, 'Page 1')
      .waitForExist(urlBarSuggestions + ' [data-test-id="list-item"][data-index="0"]')
      .keys(Brave.keys.BACKSPACE)
      .waitForElementCount(urlBarSuggestions, 0)
  })

  it('deactivated suggestions do not pop back up when left or shift is pressed', function * () {
    yield this.app.client
      .setInputText(urlInput, 'Page 1')
      .waitForExist(urlBarSuggestions + ' [data-test-id="list-item"][data-index="0"]')
      .keys(Brave.keys.BACKSPACE)
      .waitForElementCount(urlBarSuggestions, 0)
      .keys(Brave.keys.LEFT)
      .pause(50)
      .keys(Brave.keys.SHIFT + Brave.keys.LEFT)
      .pause(50)
      .keys(Brave.keys.LEFT)
      .pause(50)
      .keys(Brave.keys.SHIFT)
      .pause(50)
      .waitForElementCount(urlBarSuggestions, 0)
  })

  it('deactivates suggestions on delete', function * () {
    yield this.app.client
      .setInputText(urlInput, 'Page 1')
      .waitForExist(urlBarSuggestions + ' [data-test-id="list-item"][data-index="0"]')
      .keys(Brave.keys.DELETE)
      .waitForElementCount(urlBarSuggestions, 0)
  })

  it('navigates to a suggestion when clicked', function * () {
    yield this.app.client
      .setInputText(urlInput, 'Page 1')
      .waitForVisible(urlBarSuggestions + ' [data-test-id="list-item"][data-index="0"]')
      .click(urlBarSuggestions + ' [data-test-id="list-item"][data-index="0"]')
      .tabByIndex(1)
      .waitForUrl(this.page1Url)
      .waitForTabCount(2)
  })

  it('navigates to non-first suggestion when clicked', function * () {
    yield this.app.client
      .setInputText(urlInput, 'Page')
      .waitForVisible(urlBarSuggestions + ' [data-test-id="list-item"][data-index="1"]')
      .click(urlBarSuggestions + ' [data-test-id="list-item"][data-index="1"]')
      .tabByIndex(1)
      .waitForUrl(this.page2Url)
      .waitForTabCount(2)
  })

  it('navigates to a suggestion with keyboard', function * () {
    yield this.app.client
      .setInputText(urlInput, 'Page')
      .waitForExist(urlBarSuggestions)
      .keys(Brave.keys.DOWN)
      .waitForExist(urlBarSuggestions + ' [data-test-id="list-item"][data-index="0"][data-test2-id="selected"]')
      .keys(Brave.keys.DOWN)
      .waitForExist(urlBarSuggestions + ' [data-test-id="list-item"][data-index="1"][data-test2-id="selected"]')
      .keys(Brave.keys.ENTER)
      .tabByIndex(1).getUrl().should.become(this.page2Url)
  })

  it('should keep the first suggestion selected when mouse was one the second suggestion before the list opened', function * () {
    const firstItem = urlBarSuggestions + ' [data-test-id="list-item"][data-index="0"]'
    const secondItem = urlBarSuggestions + ' [data-test-id="list-item"][data-index="1"]'

    yield this.app.client
      .addHistorySite({ location: 'https://www.youtube.com', title: 'YouTube' })
      .addHistorySite({ location: 'http://yoyow.org/', title: 'YOYOW', count: 20 })
      .waitForElementFocus(urlInput)
      .setValue(urlInput, 'y')
      .waitForExist(urlBarSuggestions)
      .waitForInputText(urlInput, 'youtube.com')
      .waitForExist(firstItem + '[data-test2-id="selected"]')
      .moveToObject(secondItem)
      .keys(Brave.keys.ESCAPE)
      .setValue(urlInput, 'y')
      .waitForExist(urlBarSuggestions)
      .waitForInputText(urlInput, 'youtube.com')
      .waitForExist(firstItem + '[data-test2-id="selected"]')
  })

  it('selected item works with mouse hover', function * () {
    const firstItem = urlBarSuggestions + ' [data-test-id="list-item"][data-index="0"]'
    const secondItem = urlBarSuggestions + ' [data-test-id="list-item"][data-index="1"]'
    yield this.app.client
      .setInputText(urlInput, 'o')
      .waitForExist(firstItem)
      .waitForExist(secondItem)
      .moveToObject(firstItem)
      .waitForExist(firstItem + '[data-test2-id="selected"]')
      .moveToObject(secondItem)
      .waitForExist(secondItem + '[data-test2-id="selected"]')
  })

  it('selects a location auto complete result but not for titles', function * () {
    const basePage1Url = Brave.server.url('')
    yield this.app.client
      .setValue(urlInput, 'http://')
      .waitForInputText(urlInput, basePage1Url.slice(0, -1))
      .waitForExist(urlBarSuggestions + ' [data-test2-id="selected"]')
      .setValue(urlInput, 'Page')
      .waitForElementCount(urlBarSuggestions + ' [data-test2-id="selected"]', 0)
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
      .waitForInputText(urlInput, page1Url) // after entering partial URL matching two options, 1st is tentatively filled in (_without_ moving cursor to end)
      .waitForExist(urlBarSuggestions + ' [data-test-id="list-item"]')
      .waitForInputText(urlInput, page1Url) // mousing over 2nd option tentatively completes URL with 2nd option (_without_ moving cursor to end)
      .keys('2.html')
      .waitForInputText(urlInput, page2Url) // without moving mouse, typing rest of 1st option URL overwrites the autocomplete from mouseover
  })

  it('selection is not reset when pressing non-input key', function * () {
    const pagePartialUrl = Brave.server.url('page')
    const page2Url = Brave.server.url('page2.html')
    aboutHistoryState.setHistory(Immutable.fromJS({
      about: {
        history: {
          entries: [],
          updatedStamp: undefined
        }
      }
    }))

    yield this.app.client
      .setValue(urlInput, pagePartialUrl)
      .waitForVisible(urlBarSuggestions)
      .keys(Brave.keys.DOWN)
      .waitForInputText(urlInput, page2Url)
      .keys(Brave.keys.CONTROL)
      .keys(Brave.keys.CONTROL)
      .waitForSelectedText('2.html')
  })

  it('non-prefixed active suggestion loads the suggestion when enter is pressed', function * () {
    yield this.app.client
      .setInputText(urlInput, 'pref')
      .waitForVisible(urlBarSuggestions)
      .keys(Brave.keys.DOWN)
      .waitForExist(urlBarSuggestions + ' [data-test-id="list-item"][data-index="0"][data-test2-id="selected"]')
      .keys(Brave.keys.ENTER)
      .waitForInputText(urlInput, 'about:preferences')
  })

  it('no active suggestion witch matching suggestions does a search', function * () {
    yield this.app.client
      .setInputText(urlInput, 'ave')
      .waitForVisible(urlBarSuggestions)
      .waitForExist(urlBarSuggestions + ' [data-test-id="list-item"][data-index="0"][data-test2-id="notSelected"]')
      .keys(Brave.keys.ENTER)
      .waitForInputText(urlInput, /google.*\/.*q=ave/)
  })
})

describe('search suggestions', function () {
  Brave.beforeEach(this)

  beforeEach(function * () {
    yield this.app.client
      .waitForUrl(Brave.newTabUrl)
      .waitForBrowserWindow()
      .waitForVisible(urlInput)
      .changeSetting(settings.OFFER_SEARCH_SUGGESTIONS, true)
      .pause(100)
  })

  it('Finds search suggestions and performs a search when selected', function * () {
    // Until a refactor happens with search suggestions,
    // they are a bit fragile if you aren't actually typing.
    // So this for loop avoids an intermittent failure.
    // I also couldn't use .typeText() because the autocomplete makes
    // that hang when it checks for the value that was typed.
    // The refactor needed is to allow urlbar suggestions to be built
    // in parts and then rendered together, so that different suggestion
    // types would be combined and rendered together as they are available.
    const input = 'what is'
    for (let i = 0; i < input.length; i++) {
      yield this.app.client
        .keys(input[i])
        .pause(50)
    }
    yield this.app.client
      .waitForVisible(urlBarSuggestions)
      .keys(Brave.keys.DOWN)
      .waitForExist(urlBarSuggestions + ' [data-test-id="list-item"][data-index="0"][data-test2-id="notSelected"]')
      .keys(Brave.keys.ENTER)
      .waitForInputText(urlInput, /google.*\/.*q=what/)
  })

  it('does not offer URL suggestions if user is not typing a URL', function * () {
    const input = 'bug'
    for (let i = 0; i < input.length; i++) {
      yield this.app.client
        .pause(50)
        .keys(input[i])
    }
    yield this.app.client
      .waitForVisible(urlBarSuggestions)
      .waitForExist(urlBarSuggestions + ' [data-test-id="list-item"][data-index="2"]')
      .waitUntil(function () {
        return this.getText(urlBarSuggestions).then((text) => {
          return text.includes('bug') && !text.includes('http')
        })
      })
  })

  it('Can load search suggestions from non-default search provider', function * () {
    yield this.app.client.changeSetting(settings.DEFAULT_SEARCH_ENGINE, 'DuckDuckGo')
      .newTab()
      .waitForUrl(Brave.newTabUrl)
      .windowByUrl(Brave.browserWindowUrl)
      .waitForExist('[data-test-active-tab][data-frame-key="2"]')
      .waitForElementFocus(urlInput)
    const input = 'what is'
    for (let i = 0; i < input.length; i++) {
      yield this.app.client
        .keys(input[i])
        .pause(50)
    }
    yield this.app.client
      .waitForVisible(urlBarSuggestions)
      .keys(Brave.keys.ENTER)
      .waitForInputText(urlInput, /duckduckgo.*\/.*q=what.+is/)
  })
})
