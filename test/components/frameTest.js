/* global describe, it, before */

const Brave = require('../lib/brave')
const { activeWebview, findBarInput, findBarMatches, urlInput } = require('../lib/selectors')
const messages = require('../../js/constants/messages')
const assert = require('assert')

describe.only('findbar', function () {
  Brave.beforeAll(this)

  before(function *() {
    this.url = Brave.server.url('find_in_page.html')
    yield setup(this.app.client)
    yield this.app.client
      .waitUntilWindowLoaded()
      .waitForVisible(activeWebview)
      .loadUrl(this.url)
  })

  it('should focus findbar on show', function *() {
    yield this.app.client
      .loadUrl(this.url)
      .showFindbar()
      .waitForElementFocus(findBarInput)
  })

  it('should ignore case by default', function *() {
    yield this.app.client
      .showFindbar()
      .waitForElementFocus(findBarInput)
      .keys('test')
      .waitForVisible(findBarMatches)
    const match = yield this.app.client.getText(findBarMatches)
    assert.equal(match, '2 matches')
  })

  it('should re-focus findbar if open after blur', function *() {
    yield this.app.client
      .showFindbar()
      .waitForElementFocus(findBarInput)
      .click(activeWebview)
      .showFindbar()
      .waitForElementFocus(findBarInput)
  })

  it('urlbar should be selectable if findbar is active', function *() {
    yield this.app.client
      .showFindbar()
      .waitForElementFocus(findBarInput)
      .keys('test search')
    yield this.app.client
      .click('#navigator')
      .click(urlInput)
      .waitForElementFocus(urlInput)
  })
})

describe('view source', function () {
  Brave.beforeAll(this)

  before(function *() {
    this.url = Brave.server.url('find_in_page.html')
    // todo: move to selectors
    this.webview1 = '.frameWrapper:nth-child(1) webview'
    this.webview2 = '.frameWrapper:nth-child(2) webview'

    yield setup(this.app.client)
    yield this.app.client
      .waitUntilWindowLoaded()
      .waitForVisible(activeWebview)
      .loadUrl(this.url)
      .waitForExist('.tab[data-frame-key="1"]')
      .waitForExist(this.webview1)
  })

  it('should open in new tab', function *() {
    yield this.app.client
      .ipcSend(messages.SHORTCUT_ACTIVE_FRAME_VIEW_SOURCE)
      .waitForExist(this.webview2)
  })

  it('open from pinned tab', function *() {
    yield this.app.client
      .pinTab(2)
      .ipcSend(messages.SHORTCUT_ACTIVE_FRAME_VIEW_SOURCE)
      .waitForExist(this.webview2)
  })
})

function * setup (client) {
  yield client
    .waitUntilWindowLoaded()
    .waitForVisible('#window')
    .waitForVisible(urlInput)
}
