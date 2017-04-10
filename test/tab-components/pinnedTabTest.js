/* global describe, it, before, beforeEach */

const Brave = require('../lib/brave')

const messages = require('../../js/constants/messages')
const {urlInput, tabsTabs, pinnedTabsTabs} = require('../lib/selectors')

describe('pinnedTabs', function () {
  function * setup (client) {
    yield client
      .waitForUrl(Brave.newTabUrl)
      .waitForBrowserWindow()
      .waitForVisible(urlInput)
  }

  describe('Pins an existing frame', function () {
    Brave.beforeAll(this)
    before(function * () {
      yield setup(this.app.client)
      this.page1 = Brave.server.url('page1.html')
      yield this.app.client
        .newTab({ url: this.page1 })
        .waitForUrl(this.page1)
        .windowByUrl(Brave.browserWindowUrl)
        .waitForExist('[data-test-id="tab"][data-frame-key="2"]')
        .pinTabByIndex(1, true)
        .waitForExist(pinnedTabsTabs)
        .waitForElementCount(pinnedTabsTabs, 1)
        .waitForElementCount(tabsTabs, 1)
    })
    it('creates when signaled', function * () {
      yield this.app.client
        .waitForExist('[data-test-pinned-tab][data-frame-key="2"]')
    })
    it('unpins and creates a non-pinned tab', function * () {
      yield this.app.client
        .pinTabByIndex(1, false)
        .waitForExist('[data-test-pinned-tab="false"][data-frame-key="2"]')
        .waitForElementCount(pinnedTabsTabs, 0)
        .waitForElementCount(tabsTabs, 2)
    })
    it('pinning the same site again combines it', function * () {
      yield this.app.client
        .pinTabByIndex(1, true)
        .newTab({ url: this.page1 })
        .waitForUrl(this.page1)
        .windowByUrl(Brave.browserWindowUrl)
        .waitForExist('[data-test-id="tab"][data-frame-key="3"]')
        .pinTabByIndex(2, true)
        .waitForElementCount(pinnedTabsTabs, 1)
        .waitForElementCount(tabsTabs, 1)
    })
  })

  describe('Pinning with partitions', function () {
    Brave.beforeAll(this)
    it('pinning the same site again with a different session is allowed', function * () {
      yield setup(this.app.client)
      this.page1 = Brave.server.url('page1.html')
      yield this.app.client
        .newTab({ url: this.page1 })
        .waitForUrl(this.page1)
        .windowByUrl(Brave.browserWindowUrl)
        .waitForExist('[data-test-id="tab"][data-frame-key="2"]')
        .pinTabByIndex(1, true)
        .waitForExist(pinnedTabsTabs)
        .waitForElementCount(pinnedTabsTabs, 1)
        .waitForElementCount(tabsTabs, 1)
        .newTab({ url: this.page1, partitionNumber: 1 })
        .waitForExist('[data-test-id="tab"][data-frame-key="3"]')
        .pinTabByIndex(2, true)
        .waitForElementCount(pinnedTabsTabs, 2)
        .waitForElementCount(tabsTabs, 1)
    })
  })

  describe('gets pins from external windows', function () {
    Brave.beforeEach(this)
    beforeEach(function * () {
      yield setup(this.app.client)
      this.page1 = Brave.server.url('page1.html')
    })

    it('when creating as pinned', function * () {
      yield this.app.client
        .newTab({url: this.page1, pinned: true})
        .waitForElementCount(pinnedTabsTabs, 1)
        .newWindowAction()
        .waitForWindowCount(2)
        .windowByIndex(1)
        .waitForElementCount(pinnedTabsTabs, 1)
    })

    it('when pinning after creating', function * () {
      yield this.app.client
        .newTab({url: this.page1})
        .waitForElementCount(tabsTabs, 2)
        .pinTabByIndex(1, true)
        .waitForElementCount(tabsTabs, 1)
        .waitForElementCount(pinnedTabsTabs, 1)
        .newWindowAction()
        .waitForWindowCount(2)
        .windowByIndex(1)
        .waitForElementCount(tabsTabs, 1)
        .waitForElementCount(pinnedTabsTabs, 1)
    })
  })

  describe('unpins from external windows', function () {
    Brave.beforeEach(this)
    beforeEach(function * () {
      yield setup(this.app.client)
      this.page1 = Brave.server.url('page1.html')
      yield this.app.client
        .newTab({url: this.page1, pinned: true})
        .waitForElementCount(pinnedTabsTabs, 1)
        .newWindowAction()
        .waitForWindowCount(2)
        .windowByIndex(1)
        .waitForElementCount(pinnedTabsTabs, 1)
    })

    it('from same window as pinned', function * () {
      yield this.app.client
        .pinTabByIndex(1, false)
        .waitForElementCount(pinnedTabsTabs, 0)
        .windowByIndex(0)
        .waitForElementCount(pinnedTabsTabs, 0)
    })

    it('from different window as pinned', function * () {
      yield this.app.client
        .windowByIndex(0)
        .pinTabByIndex(1, false)
        .waitForElementCount(pinnedTabsTabs, 0)
        .windowByIndex(1)
        .waitForElementCount(pinnedTabsTabs, 0)
    })

    it('closes window if last tab', function * () {
      yield this.app.client
        .windowByIndex(0)
        .closeTabByIndex(0)
        .waitForElementCount(tabsTabs, 0)
        .waitForElementCount(pinnedTabsTabs, 1)
        .windowByIndex(1)
        .closeTabByIndex(0)
        .pinTabByIndex(0, false)
        .waitForWindowCount(1)
    })
  })

  describe('Pinned tab navigation', function () {
    Brave.beforeAll(this)
    before(function * () {
      yield setup(this.app.client)
      this.page1 = Brave.server.url('page1.html')
      yield this.app.client
        .newTab({ url: this.page1 })
        .waitForUrl(this.page1)
        .windowByUrl(Brave.browserWindowUrl)
        .waitForExist('[data-test-id="tab"][data-frame-key="2"]')
        .pinTabByIndex(1, true)
        .waitForExist(pinnedTabsTabs)
    })
    it('navigate within the same origin', function * () {
      const page2 = Brave.server.url('page2.html')
      yield this.app.client
        .tabByUrl(this.page1)
        .url(page2)
        .waitForUrl(page2)
        .windowByUrl(Brave.browserWindowUrl)
        .waitForElementCount(pinnedTabsTabs, 1)
        .waitForElementCount(tabsTabs, 1)
    })
    it('navigating to a different origin opens a new tab', function * () {
      const page2 = Brave.server.url('page2.html').replace('localhost', '127.0.0.1')
      yield this.app.client
        .click(urlInput)
        .setValue(urlInput, page2)
        .keys(Brave.keys.ENTER)
        .windowByUrl(Brave.browserWindowUrl)
        .waitForElementCount(pinnedTabsTabs, 1)
        .waitForElementCount(tabsTabs, 2)
    })
  })

  describe('Closing pinned tabs', function () {
    Brave.beforeAll(this)
    before(function * () {
      yield setup(this.app.client)
      const page1 = Brave.server.url('page1.html')
      yield this.app.client
        .windowByUrl(Brave.browserWindowUrl)
        .newTab({ url: page1, pinned: true })
        .waitForUrl(page1)
        .windowByUrl(Brave.browserWindowUrl)
        .waitForElementCount(pinnedTabsTabs, 1)
        .waitForElementCount(tabsTabs, 1)
        .click(pinnedTabsTabs)
        .waitForElementCount(pinnedTabsTabs + '[data-test-active-tab]', 1)
    })
    it('close attempt retains pinned tab and selects next active frame', function * () {
      yield this.app.client
        .waitForExist('[data-test-active-tab][data-frame-key="2"]')
        .ipcSend(messages.SHORTCUT_CLOSE_FRAME)
        .waitForExist('[data-test-active-tab][data-frame-key="1"]')
    })
  })
})
