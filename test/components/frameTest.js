/* global describe, it, before */

const Brave = require('../lib/brave')
const {activeWebview, findBarInput, findBarMatches, findBarNextButton, findBarClearButton, urlInput, titleBar, backButton, forwardButton} = require('../lib/selectors')
const messages = require('../../js/constants/messages')
const assert = require('assert')

describe('findbar', function () {
  Brave.beforeAll(this)

  before(function * () {
    yield setup(this.app.client)
    const url = Brave.server.url('find_in_page.html')
    yield this.app.client
      .tabByIndex(0)
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
      .click(titleBar)
      .waitForExist(urlInput)
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

  it('findbar input remembered but no active ordinals after navigation until RETURN key', function * () {
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
      .waitUntil(function () {
        return this.getAttribute('webview[data-frame-key="1"]', 'src').then((src) => src === url2)
      })
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
      .click('.tab')
      .waitUntil(function () {
        return this.getValue(findBarInput).then((val) => val === 'test')
      })
      .click('.closeTab')
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

describe('clone tab', function () {
  describe('frame', function () {
    Brave.beforeAll(this)

    before(function * () {
      this.url1 = Brave.server.url('page1.html')
      this.webview1 = '.frameWrapper:nth-child(1) webview'
      this.webview2 = '.frameWrapper.isActive:nth-child(2) webview'

      yield setup(this.app.client)
      yield this.app.client
        .tabByIndex(0)
        .loadUrl(this.url1)
        .windowByUrl(Brave.browserWindowUrl)
        .ipcSend(messages.SHORTCUT_ACTIVE_FRAME_CLONE)
    })

    it('opens a new foreground tab', function * () {
      let url1 = this.url1
      yield this.app.client
        .waitUntil(function () {
          return this.getTabCount().then((count) => {
            return count === 2
          })
        })
        .waitUntil(function () {
          return this.tabByIndex(1).getUrl().then((url) => {
            return url === url1
          })
        })
        .windowByUrl(Brave.browserWindowUrl)
        .waitForExist(this.webview1)
        .waitForExist(this.webview2)
        .waitForExist(this.webview2 + '[src="' + this.url1 + '"]')
    })

    it('uses the cloned webcontents', function * () {
      yield this.app.client
        .windowByUrl(Brave.browserWindowUrl)
        .waitForExist(this.webview2 + '[data-guest-instance-id]')
    })
  })

  describe('index', function () {
    Brave.beforeAll(this)

    before(function * () {
      this.clickWithTargetPage = Brave.server.url('click_with_target.html')
      this.page1 = Brave.server.url('page1.html')

      yield setup(this.app.client)
      yield this.app.client
        .windowByUrl(Brave.browserWindowUrl)
        .waitForUrl(Brave.newTabUrl)
        .url(this.clickWithTargetPage)
        .waitForVisible('#name')
        .click('#name')
      yield this.app.client
        .windowByUrl(Brave.browserWindowUrl)
        .waitForExist('.tab[data-frame-key="2"]')
      yield this.app.client
        .ipcSend('shortcut-set-active-frame-by-index', 0)
        .windowByUrl(Brave.browserWindowUrl)
        .ipcSend(messages.SHORTCUT_ACTIVE_FRAME_CLONE)
        .waitUntil(function () {
          return this.getTabCount().then((count) => {
            return count === 3
          })
        })
    })

    it('inserts after the tab to clone', function * () {
      this.tab1 = '.tabArea:nth-child(1) .tab[data-frame-key="1"]'
      this.tab2 = '.tabArea:nth-child(2) .tab[data-frame-key="3"]'
      this.tab3 = '.tabArea:nth-child(3) .tab[data-frame-key="2"]'
      yield this.app.client
        .windowByUrl(Brave.browserWindowUrl)
        .waitForExist(this.tab1)
        .waitForExist(this.tab2)
        .waitForExist(this.tab3)
    })
  })

  describe('history', function () {
    Brave.beforeAll(this)

    before(function * () {
      this.url1 = Brave.server.url('page1.html')
      this.url2 = Brave.server.url('page2.html')
      this.webview1 = '.frameWrapper:nth-child(1) webview'
      this.webview2 = '.frameWrapper.isActive:nth-child(2) webview'

      yield setup(this.app.client)
      yield this.app.client
        .tabByIndex(0)
        // add some history
        .loadUrl(this.url1)
        .loadUrl(this.url2)
        .windowByUrl(Brave.browserWindowUrl)
        .ipcSend(messages.SHORTCUT_ACTIVE_FRAME_CLONE)
    })

    it('preserves the history', function * () {
      yield this.app.client
        .windowByUrl(Brave.browserWindowUrl)
        .waitForExist(this.webview2 + '[src="' + this.url2 + '"]')
        .waitForExist(backButton + ':not([disabled])')
        .waitForExist(forwardButton + '[disabled]')
        .click(backButton)
        .waitForExist(this.webview2 + '[src="' + this.url1 + '"]')
    })
  })

  describe('back clone', function () {
    Brave.beforeAll(this)

    before(function * () {
      this.url1 = Brave.server.url('page1.html')
      this.url2 = Brave.server.url('page2.html')
      this.webview1 = '.frameWrapper:nth-child(1) webview'
      this.webview2 = '.frameWrapper.isActive:nth-child(2) webview'

      yield setup(this.app.client)
      yield this.app.client
        .tabByIndex(0)
        // add some history
        .loadUrl(this.url1)
        .loadUrl(this.url2)
        .windowByUrl(Brave.browserWindowUrl)
        .ipcSend(messages.SHORTCUT_ACTIVE_FRAME_CLONE, { back: true })
    })

    it('preserves proper navigation', function * () {
      yield this.app.client
        .windowByUrl(Brave.browserWindowUrl)
        .waitForExist(this.webview2 + '[src="' + this.url1 + '"]')
        .waitForExist(backButton + ':not([disabled])')
        .waitForExist(forwardButton + ':not([disabled])')
        .click(forwardButton)
        .waitForExist(this.webview2 + '[src="' + this.url2 + '"]')
        .waitForExist(backButton + ':not([disabled])')
        .waitForExist(forwardButton + '[disabled]')
    })
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
      .loadUrl(this.url)
      .windowByUrl(Brave.browserWindowUrl)
      .waitForExist('.tab[data-frame-key="1"]')
      .waitForExist(this.webview1)
  })

  it('should open in new tab', function * () {
    yield this.app.client
      .ipcSend(messages.SHORTCUT_ACTIVE_FRAME_VIEW_SOURCE)
      .waitUntil(function () {
        return this.getTabCount().then((count) => {
          return count === 2
        })
      })
      .windowByUrl(Brave.browserWindowUrl)
      .waitForExist(this.webview2)
  })

  it('open from pinned tab', function * () {
    yield this.app.client
      .setPinned(this.url, true)
      .ipcSend(messages.SHORTCUT_ACTIVE_FRAME_VIEW_SOURCE)
      .waitUntil(function () {
        return this.getTabCount().then((count) => {
          return count === 2
        })
      })
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

  it('loads a PDF', function * () {
    let url = Brave.server.url('img/test.pdf')
    yield this.app.client
      .windowByUrl(Brave.browserWindowUrl)
      .waitUntil(function () {
        return this.getAppState().then((val) => {
          return val.value.extensions['jdbefljfgobbmcidnmpjamcbhnbphjnb']
        })
      })
      .tabByIndex(0)
      .url(url)
      .waitForVisible('#viewerContainer')
  })
})

function * setup (client) {
  yield client
    .waitForUrl(Brave.newTabUrl)
    .waitForBrowserWindow()
    .waitForVisible(urlInput)
}
