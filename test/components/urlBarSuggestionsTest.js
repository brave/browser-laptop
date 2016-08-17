/* global describe, it, before */

const Brave = require('../lib/brave')
const messages = require('../../js/constants/messages')
const {urlInput, urlBarSuggestions} = require('../lib/selectors')

describe('urlbarSuggestions', function () {
  function * setup (client) {
    yield client
      .waitUntilWindowLoaded()
      .waitForUrl(Brave.newTabUrl)
      .waitForBrowserWindow()
      .waitForVisible('#window')
      .waitForVisible(urlInput)
  }

  Brave.beforeAll(this)
  before(function * () {
    this.page1Url = Brave.server.url('page1.html')
    this.page2Url = Brave.server.url('page2.html')

    yield setup(this.app.client)
    yield this.app.client
      .tabByUrl(Brave.newTabUrl)
      .url(this.page1Url)
      .waitForUrl(this.page1Url)
      .windowByUrl(Brave.browserWindowUrl)
      .ipcSend(messages.SHORTCUT_NEW_FRAME)
      .waitForUrl(Brave.newTabUrl)
      .windowByUrl(Brave.browserWindowUrl)
      .waitForExist('.tab[data-frame-key="2"].active')
      .waitForElementFocus(urlInput)

    // add the page2.html to history (necessary for autocomplete mouseover test)
    yield this.app.client
      .tabByUrl(Brave.newTabUrl)
      .url(this.page2Url)
      .waitForUrl(this.page2Url)
      .windowByUrl(Brave.browserWindowUrl)
      .ipcSend(messages.SHORTCUT_NEW_FRAME)
      .waitForUrl(Brave.newTabUrl)
      .windowByUrl(Brave.browserWindowUrl)
      .waitForElementFocus(urlInput)
  })

  it('deactivates suggestions on escape', function * () {
    yield this.app.client.ipcSend('shortcut-focus-url')
      .waitForElementFocus(urlInput)
      .setValue(urlInput, 'Page 1')
      .waitUntil(function () {
        return this.getValue(urlInput).then((val) => val === 'Page 1')
      })
      .waitForExist(urlBarSuggestions)
      .keys('\uE00C')
      .waitUntil(function () {
        return this.isExisting(urlBarSuggestions).then((exists) => exists === false)
      })
  })

  it('navigates to a suggestion when clicked', function * () {
    yield this.app.client.ipcSend('shortcut-focus-url')
      .waitForElementFocus(urlInput)
      .setValue(urlInput, 'Page 1')
      .waitUntil(function () {
        return this.getValue(urlInput).then((val) => val === 'Page 1')
      })
      .waitForExist(urlBarSuggestions)
      .click(urlBarSuggestions + ' li.suggestionItem[data-index="2"]')
      .waitForExist('.tab[data-frame-key="1"].active')
  })

  it('navigates to a suggestion with keyboard', function * () {
    yield this.app.client.ipcSend(messages.SHORTCUT_NEW_FRAME)
      .waitForUrl(Brave.newTabUrl)
      .windowByUrl(Brave.browserWindowUrl)
      .waitForExist('.tab[data-frame-key="4"].active')
      .ipcSend('shortcut-focus-url')
      .waitForElementFocus(urlInput)
      .setValue(urlInput, 'Page 1')
      .waitUntil(function () {
        return this.getValue(urlInput).then((val) => val === 'Page 1')
      })
      .waitForExist(urlBarSuggestions)
      .keys('Down arrow')
      .waitForExist(urlBarSuggestions + ' li.selected')
      .keys('Down arrow')
      .waitForExist(urlBarSuggestions + ' li.selected')
      .keys('Enter')
      .waitForExist('.tab[data-frame-key="1"].active')
  })

  it('selects a location auto complete result but not for titles', function * () {
    const page1Url = Brave.server.url('page1.html')
    yield this.app.client.ipcSend(messages.SHORTCUT_NEW_FRAME)
      .waitForUrl(Brave.newTabUrl)
      .windowByUrl(Brave.browserWindowUrl)
      .waitForExist('.tab[data-frame-key="5"].active')
      .ipcSend('shortcut-focus-url')
      .waitForElementFocus(urlInput)
      .setValue(urlInput, 'http://')
      .waitUntil(function () {
        return this.getValue(urlInput).then((val) => val === page1Url)
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
    yield this.app.client.ipcSend(messages.SHORTCUT_NEW_FRAME)
      .waitForUrl(Brave.newTabUrl)
      .windowByUrl(Brave.browserWindowUrl)
      .waitForExist('.tab[data-frame-key="6"].active')
      .ipcSend('shortcut-focus-url')
      .waitForElementFocus(urlInput)
      .keys(pagePartialUrl)
      .waitUntil(function () {
        return this.getValue(urlInput).then(function (val) {
          return val === page1Url // after entering partial URL matching two options, 1st is tentatively filled in (_without_ moving cursor to end)
        })
      })
      .waitForExist(urlBarSuggestions + ' li.suggestionItem')
      .moveToObject(urlBarSuggestions + ' li.suggestionItem:not(.selected)')
      .waitUntil(function () {
        return this.getValue(urlInput).then(function (val) {
          return val === page2Url // mousing over 2nd option tentatively completes URL with 2nd option (_without_ moving cursor to end)
        })
      })
      .keys('1.html')
      .waitUntil(function () {
        return this.getValue(urlInput).then(function (val) {
          return val === page1Url // without moving mouse, typing rest of 1st option URL overwrites the autocomplete from mouseover
        })
      })
  })
})
