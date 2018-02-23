/* global describe, it, before, beforeEach */

const Brave = require('../lib/brave')

const {urlInput, tabsTabs, pinnedTabsTabs} = require('../lib/selectors')

describe('pinnedTabs', function () {
  function * setup (client) {
    yield client
      .waitForUrl(Brave.newTabUrl)
      .waitForBrowserWindow()
      .waitForVisible(urlInput)
  }

  describe('Pins an existing frame', function () {
    Brave.beforeEach(this)
    beforeEach(function * () {
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
        .pinTabByIndex(0, false)
        .waitForExist('[data-test-pinned-tab="false"][data-frame-key="2"]')
        .waitForElementCount(pinnedTabsTabs, 0)
        .waitForElementCount(tabsTabs, 2)
        .waitForTextValue('[data-test-pinned-tab="false"][data-frame-key="2"]', 'Page 1')
    })
    it('pinning the same site again combines it', function * () {
      yield this.app.client
        .newTab({ url: this.page1 })
        .waitForUrl(this.page1)
        .windowByUrl(Brave.browserWindowUrl)
        .waitForExist('[data-test-id="tab"][data-frame-key="3"]')
        .pinTabByIndex(2, true)
        .waitForElementCount(pinnedTabsTabs, 1)
        .waitForElementCount(tabsTabs, 1)
    })
    it('can pin a PDF', function * () {
      const pdfUrl = 'http://orimi.com/pdf-test.pdf'
      yield this.app.client
        .tabByIndex(0)
        .url(pdfUrl)
        .pause(1000) // wait for PDF load
        .windowByUrl(Brave.browserWindowUrl)
        .pinTabByIndex(1, true)
        .waitForElementCount(pinnedTabsTabs, 2)
        .waitForElementCount(tabsTabs, 0)
    })
  })

  describe('Moving pinned tabs', function () {
    Brave.beforeEach(this)
    // test case for bug solved with #10531
    it('reorders pins without forgetting about them', function * () {
      yield setup(this.app.client)
      const page1 = Brave.server.url('page1.html')
      const page2 = Brave.server.url('page2.html')
      const page3 = Brave.server.url('page_no_title.html')
      const page4 = Brave.server.url('red_bg.html')
      yield this.app.client
        // open new tab and pin it
        .newTab({ url: page1 })
        .waitForUrl(page1)
        .windowByUrl(Brave.browserWindowUrl)
        .waitForExist('[data-test-id="tab"][data-frame-key="2"]')
        .pinTabByIndex(1, true)
        // open another new tab and pin it
        .newTab({ url: page2 })
        .waitForUrl(page2)
        .windowByUrl(Brave.browserWindowUrl)
        .waitForExist('[data-test-id="tab"][data-frame-key="3"]')
        .pinTabByIndex(2, true)
        // make sure a non pinned page exists
        .newTab({ url: page3 })
        .waitForUrl(page3)
        .windowByUrl(Brave.browserWindowUrl)
        .waitForExist('[data-test-id="tab"][data-frame-key="4"]')
        // change pinned tabs order
        .moveTabByFrameKey(3, 2, true)
        // check the move worked
        .waitForExist('[data-test-id="tab-area"][data-frame-key="3"] + [data-test-id="tab-area"][data-frame-key="2"]')
        // create another tab and pin it
        .newTab({ url: page4 })
        .waitForUrl(page4)
        .windowByUrl(Brave.browserWindowUrl)
        .waitForExist('[data-test-id="tab"][data-frame-key="5"]')
        .pinTabByIndex(4, true)
        // check we still have the other pinned tabs
        .waitForExist('[data-test-id="tab-area"][data-frame-key="3"] + [data-test-id="tab-area"][data-frame-key="2"] + [data-test-id="tab-area"][data-frame-key="5"]')
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

  describe('close groups of tab with some pinned', function () {
    Brave.beforeEach(this)
    beforeEach(function * () {
      this.page1 = Brave.server.url('page1.html')
      yield setup(this.app.client)
      this.app.client
        .newTab({pinned: true})
        .waitForElementCount('[data-test-id="tab"]', 2)
        .newTab()
        .waitForElementCount('[data-test-id="tab"]', 3)
    })
    describe('closeTabsToRightMenuItemClicked', function () {
      it('can close tabs to the right', function * () {
        yield this.app.client
          .closeTabsToRight(1)
          .waitForElementCount('[data-test-id="tab"]', 2)
      })
    })
    describe('closeTabsToLeftMenuItemClicked', function () {
      it('can close tabs to the left', function * () {
        yield this.app.client
          .closeTabsToLeft(2)
          .waitForElementCount('[data-test-id="tab"]', 2)
      })
    })
    describe('closeOtherTabsMenuItemClicked', function () {
      it('can close other tabs', function * () {
        yield this.app.client
          .closeOtherTabs(2)
          .waitForElementCount('[data-test-id="tab"]', 2)
      })
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
        .windowByIndex(0)
        .pinTabByIndex(1, false)
        .waitForElementCount(pinnedTabsTabs, 0)
        .windowByIndex(1)
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
        .activateURLMode()
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
        .activateURLMode()
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
    it('closes the pinned with middle click', function * () {
      yield this.app.client
        .click(pinnedTabsTabs)
        .waitForExist('[data-test-active-tab]')
        .middleClick(pinnedTabsTabs)
        .waitForElementCount(pinnedTabsTabs, 0)
    })
  })

  describe('Going back to original state after unpinning', function () {
    Brave.beforeAll(this)
    before(function * () {
      yield setup(this.app.client)
      const page1 = Brave.server.url('page1.html')
      const page2 = Brave.server.url('page2.html')
      yield this.app.client
        .windowByUrl(Brave.browserWindowUrl)
        .newTab({ url: page1, pinned: true })
        .waitForUrl(page1)
        .windowByUrl(Brave.browserWindowUrl)
        .newTab({ url: page2, pinned: true })
        .waitForUrl(page2)
        .windowByUrl(Brave.browserWindowUrl)
        .waitForElementCount(pinnedTabsTabs, 2)
        .waitForElementCount(tabsTabs, 1)
    })
    it('shows the tab title', function * () {
      yield this.app.client
        .pinTabByIndex(2, false)
        .waitForExist('[data-test-id="tab"][data-frame-key="3"]')
        .waitForVisible('[data-test-id="tab"][data-frame-key="3"]')
        .waitForTextValue('[data-test-id="tab"][data-frame-key="3"]', 'Page 2')
    })
  })
})
