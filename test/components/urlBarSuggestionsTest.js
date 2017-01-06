/* global describe, it, beforeEach */

const Brave = require('../lib/brave')
const messages = require('../../js/constants/messages')
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
    const page1Url = this.page1Url
    const page2Url = this.page2Url
    yield this.app.client
      .tabByIndex(0)
      .loadUrl(page1Url)
      .windowByUrl(Brave.browserWindowUrl)
      .waitForSiteEntry(page1Url)
      .waitUntil(function () {
        return this.getAppState().then((val) => {
          return !!val.value.sites.find((site) => site.location === page1Url)
        })
      })
      .tabByIndex(0)
      .loadUrl(this.page2Url)
      .windowByUrl(Brave.browserWindowUrl)
      .waitForSiteEntry(page2Url)
      .ipcSend(messages.SHORTCUT_NEW_FRAME)
      .waitForUrl(Brave.newTabUrl)
      .windowByUrl(Brave.browserWindowUrl)
      .waitForExist('.tab[data-frame-key="2"].active')
      .waitForElementFocus(urlInput)
      .waitUntil(function () {
        return this.getAppState().then((val) => {
          return !!val.value.sites.find((site) => site.location === page2Url)
        })
      })
  })

  it('show suggestion when single letter is typed in', function * () {
    yield this.app.client.ipcSend('shortcut-focus-url')
      .waitForElementFocus(urlInput)
      .setValue(urlInput, 'a')
      .waitUntil(function () {
        return this.getValue(urlInput).then((val) => val === 'a')
      })
      .waitForExist(urlBarSuggestions)
  })

  it('deactivates suggestions on escape', function * () {
    yield this.app.client
      .setValue(urlInput, 'Page 1')
      .waitUntil(function () {
        return this.getValue(urlInput).then((val) => val === 'Page 1')
      })
      .waitForExist(urlBarSuggestions + ' li.suggestionItem[data-index="1"]')
      .keys(Brave.keys.ESCAPE)
      .waitUntil(function () {
        return this.isExisting(urlBarSuggestions).then((exists) => exists === false)
      })
  })

  it('deactivates suggestions on backspace', function * () {
    yield this.app.client
      .setValue(urlInput, 'Page 1')
      .waitUntil(function () {
        return this.getValue(urlInput).then((val) => val === 'Page 1')
      })
      .waitForExist(urlBarSuggestions + ' li.suggestionItem[data-index="1"]')
      .keys(Brave.keys.BACKSPACE)
      .waitUntil(function () {
        return this.isExisting(urlBarSuggestions).then((exists) => exists === false)
      })
  })

  it('deactivates suggestions on delete', function * () {
    yield this.app.client
      .setValue(urlInput, 'Page 1')
      .waitUntil(function () {
        return this.getValue(urlInput).then((val) => val === 'Page 1')
      })
      .waitForExist(urlBarSuggestions + ' li.suggestionItem[data-index="1"]')
      .keys(Brave.keys.DELETE)
      .waitUntil(function () {
        return this.isExisting(urlBarSuggestions).then((exists) => exists === false)
      })
  })

  it('navigates to a suggestion when clicked', function * () {
    yield this.app.client
      .setValue(urlInput, 'Page 1')
      .waitUntil(function () {
        return this.getValue(urlInput).then((val) => val === 'Page 1')
      })
      .waitForVisible(urlBarSuggestions + ' li.suggestionItem[data-index="1"]')
      .click(urlBarSuggestions + ' li.suggestionItem[data-index="1"]')
      .tabByIndex(1)
      .waitForUrl(this.page1Url)
  })

  it('navigates to a suggestion with keyboard', function * () {
    yield this.app.client
      .setValue(urlInput, 'Page')
      .waitUntil(function () {
        return this.getValue(urlInput).then((val) => val === 'Page')
      })
      .waitForExist(urlBarSuggestions)
      .keys(Brave.keys.DOWN)
      .waitForExist(urlBarSuggestions + ' li.suggestionItem[data-index="1"].selected')
      .keys(Brave.keys.DOWN)
      .waitForExist(urlBarSuggestions + ' li.suggestionItem[data-index="2"].selected')
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

  it('selection is not reset', function * () {
    const pagePartialUrl = Brave.server.url('page')
    yield this.app.client
      .moveToObject(urlInput)
      .setValue(urlInput, pagePartialUrl)
      .waitForExist(urlBarSuggestions)
      .keys(Brave.keys.DOWN)
      .keys(Brave.keys.CONTROL)
      .keys(Brave.keys.CONTROL)
      .waitForSelectedText('1.html')
  })
})
