/* global describe, it, beforeEach */

const Brave = require('../lib/brave')
const {activeWebview, findBarInput, findBarMatches, findBarNextButton, findBarClearButton, urlInput, titleBar} = require('../lib/selectors')

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
      .waitForVisible(findBarMatches)
      .waitForTextValue(findBarMatches, '1 of 2')

    // Clicking next goes to the next match
    yield this.app.client
      .click(findBarNextButton)
      .waitForTextValue(findBarMatches, '2 of 2')

    // Clicking next again loops back to the first match
    yield this.app.client
      .click(findBarNextButton)
      .waitForTextValue(findBarMatches, '1 of 2')
  })

  it('should empty the input on clear', function * () {
    yield this.app.client
      .showFindbar()
      .waitForElementFocus(findBarInput)
      .setValue(findBarInput, 'test')

    // Clicking next goes to the next match
    yield this.app.client
      .click(findBarClearButton)
      .waitForInputText(findBarInput, '')
  })

  it('should display no results correctly', function * () {
    yield this.app.client
      .showFindbar()
      .waitForElementFocus(findBarInput)
      .setValue(findBarInput, 'test-not-found')
      .waitForVisible(findBarMatches)
      .waitForTextValue(findBarMatches, '0 matches')
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
      .showFindbar(false)
      .waitForElementCount(findBarInput, 0)
      .showFindbar()
      .waitForVisible(findBarInput)
      .waitForElementFocus(findBarInput)
      .keys('x')
      .waitForInputText(findBarInput, 'x')
  })

  it('focus twice without hide selects text', function * () {
    yield this.app.client
      .showFindbar()
      .waitForElementFocus(findBarInput)
      .setValue(findBarInput, 'test')
      .showFindbar()
      .waitForElementFocus(findBarInput)
      .keys('x')
      .waitForInputText(findBarInput, 'x')
  })

  it('should remember the position across findbar showing', function * () {
    yield this.app.client
      .showFindbar()
      .waitForElementFocus(findBarInput)
      .setValue(findBarInput, 'test')
      .waitForVisible(findBarMatches)
      .waitForTextValue(findBarMatches, '1 of 2')
      .click(findBarNextButton)
      .waitForTextValue(findBarMatches, '2 of 2')

    yield this.app.client.showFindbar(false)
      .showFindbar()
      .waitForElementFocus(findBarInput)
      .waitForTextValue(findBarMatches, '2 of 2')
  })

  it('typing while another frame is loading', function * () {
    const url2 = Brave.server.url('find_in_page2.html')
    yield this.app.client
      .showFindbar()
      .waitForElementFocus(findBarInput)
      .newTab({ url: url2, active: false })
      .setValue(findBarInput, 'test')
      .showFindbar()
      .waitForElementFocus(findBarInput)
      .keys('x')
      .waitForInputText(findBarInput, 'x')
      .keys('y')
      .keys('z')
      .waitForInputText(findBarInput, 'xyz')
  })

  it.skip('findbar input remembered but no active ordinals after navigation until RETURN key', function * () {
    const url2 = Brave.server.url('find_in_page2.html')
    yield this.app.client
      .showFindbar()
      .waitForElementFocus(findBarInput)
      .setValue(findBarInput, 'Brad')
      .waitForTextValue(findBarMatches, '0 matches')

    yield this.app.client
      .waitForVisible(findBarMatches)
      .tabByIndex(0)
      .url(url2)
      .waitForUrl(url2)
      .windowParentByUrl(url2)
      // No findbar
      .waitForElementCount(findBarInput, 0)
      .showFindbar()
      .waitForElementFocus(findBarInput)
      // Matches shouldn't be shown until enter is pressed
      .waitForElementCount(findBarMatches, 0)
      .keys(Brave.keys.RETURN)
      .waitForTextValue(findBarMatches, '1 of 1')
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
      .newTab({ url })
      .waitForTabCount(2)
      .tabByIndex(1)
      .waitForUrl(url)
      .windowParentByUrl(url)
      .showFindbar(true, 2)
      .waitForElementFocus(findBarInput)
      .setValue(findBarInput, 'abc')
      .click('[data-test-id="tab"]')
      .waitForInputText(findBarInput, 'test')
      .middleClick('[data-test-id="tab"]')
      .waitForInputText(findBarInput, 'abc')
      .showFindbar(false, 2)
      .waitForElementCount(findBarInput, 0)
      .showFindbar(true, 2)
      .waitForInputText(findBarInput, 'abc')
  })
})

function * setup (client) {
  yield client
    .waitForUrl(Brave.newTabUrl)
    .waitForBrowserWindow()
    .waitForVisible(urlInput)
}
