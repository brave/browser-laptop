/* global describe, it, before */

const Brave = require('../lib/brave')
const { activeWebview, findBarInput, findBarMatches, findBarNextButton, urlInput, titleBar } = require('../lib/selectors')
const messages = require('../../js/constants/messages')
const assert = require('assert')

describe('findbar', function () {
  Brave.beforeAll(this)

  before(function * () {
    yield setup(this.app.client)
    const url = Brave.server.url('find_in_page.html')
    yield this.app.client
      .tabByUrl(Brave.newTabUrl)
      .url(url)
      .waitForUrl(url)
      .windowParentByUrl(url)
      .waitUntil(function () {
        return this.getAttribute('webview[data-frame-key="1"]', 'src').then((src) => src === url)
      })
      .waitForElementFocus('webview[data-frame-key="1"]')
  })

  it('should focus findbar on show', function * () {
    yield this.app.client
      .showFindbar()
      .waitForElementFocus(findBarInput)
  })

  it('should ignore case by default', function * () {
    yield this.app.client
      .showFindbar()
      .waitForElementFocus(findBarInput)
      .setValue(findBarInput, 'test')
       .waitUntil(function () {
         return this.getValue(findBarInput).then((val) => val === 'test')
       })
      .waitForVisible(findBarMatches)
    let match = yield this.app.client.getText(findBarMatches)
    assert.equal(match, '1 of 2')

    // Clicking next goes to the next match
    yield this.app.client
      .click(findBarNextButton)
    match = yield this.app.client.getText(findBarMatches)
    assert.equal(match, '2 of 2')

    // Clicking next again loops back to the first match
    yield this.app.client
      .click(findBarNextButton)
    match = yield this.app.client.getText(findBarMatches)
    assert.equal(match, '1 of 2')
  })

  it('should display no results correctly', function * () {
    yield this.app.client
      .showFindbar()
      .waitForElementFocus(findBarInput)
      .setValue(findBarInput, 'test-not-found')
       .waitUntil(function () {
         return this.getValue(findBarInput).then((val) => val === 'test-not-found')
       })
      .waitForVisible(findBarMatches)
    let match = yield this.app.client.getText(findBarMatches)
    assert.equal(match, '0 matches')
  })

  it('should re-focus findbar if open after blur', function * () {
    yield this.app.client
      .showFindbar()
      .waitForElementFocus(findBarInput)
      .click(activeWebview)
      .windowByUrl(Brave.browserWindowUrl)
      .showFindbar()
      .waitForElementFocus(findBarInput)
  })

  it('urlbar should be selectable if findbar is active', function * () {
    yield this.app.client
      .showFindbar()
      .waitForElementFocus(findBarInput)
      .keys('test search')
    yield this.app.client
      .click(titleBar)
      .waitForExist(urlInput)
      .click(urlInput)
      .waitForVisible(findBarInput)
      .waitForElementFocus(urlInput)
  })

  it('should remember the position across findbar showing', function * () {
    yield this.app.client
      .showFindbar()
      .waitForElementFocus(findBarInput)
      .setValue(findBarInput, 'test')
       .waitUntil(function () {
         return this.getValue(findBarInput).then((val) => val === 'test')
       })
      .waitForVisible(findBarMatches)
    let match = yield this.app.client.getText(findBarMatches)
    assert.equal(match, '1 of 2')
    yield this.app.client
      .click(findBarNextButton)
    match = yield this.app.client.getText(findBarMatches)
    assert.equal(match, '2 of 2')

    yield this.app.client.showFindbar(false)
      .showFindbar()
      .waitForElementFocus(findBarInput)
    match = yield this.app.client.getText(findBarMatches)
    assert.equal(match, '2 of 2')
  })
})

describe('view source', function () {
  Brave.beforeAll(this)

  before(function * () {
    this.url = Brave.server.url('find_in_page.html')
    // todo: move to selectors
    this.webview1 = '.frameWrapper:nth-child(1) webview'
    this.webview2 = '.frameWrapper:nth-child(2) webview'

    yield setup(this.app.client)
    yield this.app.client
      .tabByIndex(0)
      .url(this.url)
      .waitForUrl(this.url)
      .windowByUrl(Brave.browserWindowUrl)
      .waitForExist('.tab[data-frame-key="1"]')
      .waitForExist(this.webview1)
  })

  it('should open in new tab', function * () {
    yield this.app.client
      .ipcSend(messages.SHORTCUT_ACTIVE_FRAME_VIEW_SOURCE)
      .windowByUrl(Brave.browserWindowUrl)
      .waitForExist(this.webview2)
  })

  it('open from pinned tab', function * () {
    yield this.app.client
      .setPinned(this.url, true)
      .ipcSend(messages.SHORTCUT_ACTIVE_FRAME_VIEW_SOURCE)
      .windowByUrl(Brave.browserWindowUrl)
      .waitForExist(this.webview2)
  })
})

describe('resource loading', function () {
  Brave.beforeAll(this)
  before(function * () {
    yield setup(this.app.client)
    yield this.app.client
      .windowByUrl(Brave.browserWindowUrl)
      .waitForExist('.tab[data-frame-key="1"]')
  })

  it('loads an image', function * () {
    let url = Brave.server.url('img/test.ico')
    yield this.app.client
      .tabByIndex(0)
      .url(url)
      .waitForUrl(url)
      .waitForVisible('img')
  })
})

function * setup (client) {
  yield client
    .waitUntilWindowLoaded()
    .waitForUrl(Brave.newTabUrl)
    .waitForBrowserWindow()
    .waitForVisible('#window')
    .waitForVisible(urlInput)
}

