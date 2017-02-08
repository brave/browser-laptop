/* global describe, it, beforeEach */

const Brave = require('../lib/brave')
const {activeWebview, findBarInput, findBarMatches, findBarNextButton, findBarClearButton, urlInput, titleBar} = require('../lib/selectors')
const messages = require('../../js/constants/messages')
const assert = require('assert')

describe('findBar', function () {
  Brave.beforeEach(this)
  beforeEach(function * () {
    yield setup(this.app.client)
    const url = Brave.server.url('find_in_page.html')
    yield this.app.client
      .changeSetting('general.disable-title-mode', false)
      .tabByIndex(0)
      .url(url)
      .waitForUrl(url)
      .windowParentByUrl(url)
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

  it('should empty the input on clear', function * () {
    yield this.app.client
      .showFindbar()
      .waitForElementFocus(findBarInput)
      .setValue(findBarInput, 'test')
      .waitUntil(function () {
        return this.getValue(findBarInput).then((val) => val === 'test')
      })

    // Clicking next goes to the next match
    yield this.app.client
      .click(findBarClearButton)
    let match = yield this.app.client.getValue(findBarInput)
    assert.equal(match, '')
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
      .activateTitleMode()
      .click(titleBar)
      .waitForVisible(urlInput)
      .click(urlInput)
      .waitForVisible(findBarInput)
      .waitForElementFocus(urlInput)
  })

  it('findbar text should be replaced and never appended', function * () {
    yield this.app.client
      .showFindbar()
      .waitForElementFocus(findBarInput)
      .setValue(findBarInput, 'test')
      .waitUntil(function () {
        return this.getValue(findBarInput).then((val) => val === 'test')
      })
      .showFindbar(false)
      .waitForVisible(findBarInput, 500, true)
      .showFindbar()
      .waitForVisible(findBarInput)
      .waitForElementFocus(findBarInput)
      .keys('x')
      .waitUntil(function () {
        return this.getValue(findBarInput).then((val) => val === 'x')
      })
  })

  it('focus twice without hide selects text', function * () {
    yield this.app.client
      .showFindbar()
      .waitForElementFocus(findBarInput)
      .setValue(findBarInput, 'test')
      .waitUntil(function () {
        return this.getValue(findBarInput).then((val) => val === 'test')
      })
      .showFindbar()
      .waitForElementFocus(findBarInput)
      .keys('x')
      .waitUntil(function () {
        return this.getValue(findBarInput).then((val) => val === 'x')
      })
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

  it('typing while another frame is loading', function * () {
    const url2 = Brave.server.url('find_in_page2.html')
    yield this.app.client
      .showFindbar()
      .waitForElementFocus(findBarInput)
      .ipcSend(messages.SHORTCUT_NEW_FRAME, url2, { openInForeground: false })
      .setValue(findBarInput, 'test')
      .waitUntil(function () {
        return this.getValue(findBarInput).then((val) => val === 'test')
      })
      .showFindbar()
      .waitForElementFocus(findBarInput)
      .keys('x')
      .waitUntil(function () {
        return this.getValue(findBarInput).then((val) => val === 'x')
      })
      .keys('y')
      .keys('z')
      .waitUntil(function () {
        return this.getValue(findBarInput).then((val) => val === 'xyz')
      })
     .ipcSend(messages.SHORTCUT_CLOSE_FRAME, 2)
  })

  it.skip('findbar input remembered but no active ordinals after navigation until RETURN key', function * () {
    const url2 = Brave.server.url('find_in_page2.html')
    yield this.app.client
      .showFindbar()
      .waitForElementFocus(findBarInput)
      .setValue(findBarInput, 'Brad')
      .waitUntil(function () {
        return this.getValue(findBarInput).then((val) => val === 'Brad')
      })
    let match = yield this.app.client.getText(findBarMatches)
    assert.equal(match, '0 matches')

    yield this.app.client
      .waitForVisible(findBarMatches)
      .tabByIndex(0)
      .url(url2)
      .waitForUrl(url2)
      .windowParentByUrl(url2)
      // No findbar
      .waitForVisible(findBarInput, 500, true)
      .showFindbar()
      .waitForElementFocus(findBarInput)
      // Matches shouldn't be shown until enter is pressed
      .waitForVisible(findBarMatches, 500, true)
      .keys(Brave.keys.RETURN)
      .waitForVisible(findBarMatches)
    match = yield this.app.client.getText(findBarMatches)
    assert.equal(match, '1 of 1')
  })

  it('remembers findbar input when switching frames', function * () {
    const url = Brave.server.url('find_in_page.html')
    yield this.app.client
      .windowParentByUrl(url)
      .tabByIndex(0)
      .url(url)
      .waitForUrl(url)
      .windowParentByUrl(url)
      .showFindbar()
      .waitForElementFocus(findBarInput)
      .setValue(findBarInput, 'test')
      .ipcSend(messages.SHORTCUT_NEW_FRAME, url)
      .waitForTabCount(2)
      .tabByIndex(1)
      .waitForUrl(url)
      .windowParentByUrl(url)
      .showFindbar(true, 2)
      .waitForElementFocus(findBarInput)
      .setValue(findBarInput, 'abc')
      .click('[data-test-id="tab"]')
      .waitUntil(function () {
        return this.getValue(findBarInput).then((val) => val === 'test')
      })
      .click('[data-test-id="tab"]')
      .click('[data-test-id="closeTabIcon"]')
      .waitUntil(function () {
        return this.getValue(findBarInput).then((val) => val === 'abc')
      })
      .showFindbar(false, 2)
      .waitUntil(function () {
        return this.element(findBarInput).then((val) => val.value === null)
      })
      .showFindbar(true, 2)
      .waitUntil(function () {
        return this.getValue(findBarInput).then((val) => val === 'abc')
      })
  })
})

function * setup (client) {
  yield client
    .waitForUrl(Brave.newTabUrl)
    .waitForBrowserWindow()
    .waitForVisible(urlInput)
}
