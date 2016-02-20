/* global describe, it, before */

const Brave = require('../lib/brave')
const messages = require('../../js/constants/messages')
const {urlInput, urlBarSuggestions} = require('../lib/selectors')

describe('urlbarSuggestions', function () {
  function * setup (client) {
    yield client
      .waitUntilWindowLoaded()
      .waitForVisible('#window')
      .waitForVisible(urlInput)
  }

  Brave.beforeAll(this)
  before(function *() {
    this.page1Url = Brave.server.url('page1.html')
    yield setup(this.app.client)
    yield this.app.client.loadUrl(this.page1Url)
      .ipcSend(messages.SHORTCUT_NEW_FRAME)
      .waitForExist('.tab[data-frame-key="2"].active')
      .waitForElementFocus(urlInput)
  })

  it('navigates to a suggestion when clicked', function *() {
    yield this.app.client.ipcSend('shortcut-focus-url')
      .waitForElementFocus(urlInput)
      .setValue(urlInput, 'Page 1')
      .waitUntil(function () {
        return this.getValue(urlInput).then(val => val === 'Page 1')
      })
      .waitForExist(urlBarSuggestions)
      .click(urlBarSuggestions + ' li')
      .waitForExist('.tab[data-frame-key="1"].active')
  })

  it('navigates to a suggestion with keyboard', function *() {
    yield this.app.client.ipcSend(messages.SHORTCUT_NEW_FRAME)
      .waitForExist('.tab[data-frame-key="3"].active')
      .ipcSend('shortcut-focus-url')
      .waitForElementFocus(urlInput)
      .setValue(urlInput, 'Page 1')
      .waitUntil(function () {
        return this.getValue(urlInput).then(val => val === 'Page 1')
      })
      .waitForExist(urlBarSuggestions)
      .keys('Down arrow')
      .waitForExist(urlBarSuggestions + ' li.selected')
      .keys('Enter')
      .waitForExist('.tab[data-frame-key="1"].active')
  })
})
