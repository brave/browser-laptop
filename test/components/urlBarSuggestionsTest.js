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
      .waitForExist('.tab[data-frame-key="3"].active')
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
      .waitForExist('.tab[data-frame-key="4"].active')
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
})
