/* global describe, it, before */

const Brave = require('../lib/brave')

const messages = require('../../js/constants/messages')
const siteTags = require('../../js/constants/siteTags')
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
      this.page1Url = Brave.server.url('page1.html')
      yield this.app.client
        .newTab({ url: this.page1Url })
        .waitForUrl(this.page1Url)
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
        .newTab({ url: this.page1Url })
        .waitForUrl(this.page1Url)
        .windowByUrl(Brave.browserWindowUrl)
        .waitForExist('[data-test-id="tab"][data-frame-key="3"]')
        .pinTabByIndex(2, true)
        .waitForElementCount(pinnedTabsTabs, 1)
        .waitForElementCount(tabsTabs, 2)
    })
  })

  describe('Pinning with partitions', function () {
    Brave.beforeAll(this)
    it('pinning the same site again with a different session is allowed', function * () {
      yield setup(this.app.client)
      this.page1Url = Brave.server.url('page1.html')
      yield this.app.client
        .newTab({ url: this.page1Url })
        .waitForUrl(this.page1Url)
        .windowByUrl(Brave.browserWindowUrl)
        .waitForExist('[data-test-id="tab"][data-frame-key="2"]')
        .pinTabByIndex(1, true)
        .waitForExist(pinnedTabsTabs)
        .waitForElementCount(pinnedTabsTabs, 1)
        .waitForElementCount(tabsTabs, 1)
        .newTab({ url: this.page1Url, partitionNumber: 1 })
        .waitForExist('[data-test-id="tab"][data-frame-key="3"]')
        .pinTabByIndex(2, true)
        .waitForElementCount(pinnedTabsTabs, 2)
        .waitForElementCount(tabsTabs, 1)
    })
  })

  describe('Gets pins from external windows', function () {
    Brave.beforeAll(this)
    before(function * () {
      yield setup(this.app.client)
      const page1Url = Brave.server.url('page1.html')
      const page2Url = Brave.server.url('page2.html')
      yield this.app.client
        .addSite({ location: page1Url }, siteTags.PINNED)
        .waitForUrl(page1Url)
        .windowByUrl(Brave.browserWindowUrl)
        .waitForExist('[data-test-pinned-tab][data-frame-key="2"]')
        .addSite({ location: page2Url }, siteTags.PINNED)
        .waitForUrl(page2Url)
        .windowByUrl(Brave.browserWindowUrl)
        .waitForExist('[data-test-pinned-tab][data-frame-key="3"]')
    })
    it('creates when signaled', function * () {
      yield this.app.client.waitUntil(function () {
        return this.windowByUrl(Brave.browserWindowUrl)
          .waitForElementCount(pinnedTabsTabs, 2)
      })
      .waitUntil(function () {
        return this.windowByUrl(Brave.browserWindowUrl)
          .waitForElementCount(tabsTabs, 1)
      })
    })
    it('disappears when signaled externally', function * () {
      const page1Url = Brave.server.url('page1.html')
      yield this.app.client
        .removeSite({ location: page1Url }, siteTags.PINNED)
        .waitForElementCount(pinnedTabsTabs, 1)
        .waitForElementCount(tabsTabs, 1)
    })
    it('Adding a site that already exists does not add another pinned tab', function * () {
      const page2Url = Brave.server.url('page2.html')
      yield this.app.client
        .addSite({ location: page2Url }, siteTags.PINNED)
        .waitForElementCount(pinnedTabsTabs, 1)
        .waitForElementCount(tabsTabs, 1)
    })
    it('Adding a site with a diff session that already exists is allowed', function * () {
      const page2Url = Brave.server.url('page2.html')
      yield this.app.client
        .addSite({ location: page2Url, partitionNumber: 1 }, siteTags.PINNED)
        .waitForElementCount(pinnedTabsTabs, 2)
        .waitForElementCount(tabsTabs, 1)
    })
  })

  describe('Pinned tab navigation', function () {
    Brave.beforeAll(this)
    before(function * () {
      yield setup(this.app.client)
      this.page1Url = Brave.server.url('page1.html')
      yield this.app.client
        .newTab({ url: this.page1Url })
        .waitForUrl(this.page1Url)
        .windowByUrl(Brave.browserWindowUrl)
        .waitForExist('[data-test-id="tab"][data-frame-key="2"]')
        .pinTabByIndex(1, true)
        .waitForExist(pinnedTabsTabs)
    })
    it('navigate within the same origin', function * () {
      const page2Url = Brave.server.url('page2.html')
      yield this.app.client
        .tabByUrl(this.page1Url)
        .url(page2Url)
        .waitForUrl(page2Url)
        .windowByUrl(Brave.browserWindowUrl)
        .waitForElementCount(pinnedTabsTabs, 1)
        .waitForElementCount(tabsTabs, 1)
    })
    it('navigating to a different origin opens a new tab', function * () {
      const page2Url = Brave.server.url('page2.html').replace('localhost', '127.0.0.1')
      yield this.app.client
        .click(urlInput)
        .setValue(urlInput, page2Url)
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
      const page1Url = Brave.server.url('page1.html')
      yield this.app.client
        .windowByUrl(Brave.browserWindowUrl)
        .addSite({ location: page1Url }, siteTags.PINNED)
        .waitForUrl(page1Url)
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
