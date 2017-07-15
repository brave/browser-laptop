/* global describe, it, before, beforeEach */

const Brave = require('../lib/brave')
const appConfig = require('../../js/constants/appConfig')
const settings = require('../../js/constants/settings')
const messages = require('../../js/constants/messages')
const {
  urlInput,
  newFrameButton,
  pinnedTabsTabs,
  tabsTabs,
  tabPage,
  tabPage1,
  tabPage2,
  activeWebview,
  activeTab,
  tabsTab,
  closeTab
} = require('../lib/selectors')

describe('tab pages', function () {
  function * setup (client) {
    yield client
      .waitForUrl(Brave.newTabUrl)
      .waitForBrowserWindow()
      .waitForVisible(urlInput)
  }

  describe('basic tab page functionality', function () {
    Brave.beforeEach(this)

    beforeEach(function * () {
      yield setup(this.app.client)
      yield this.app.client
        .waitForElementCount(tabPage, 0)
      // Create a full tab set, but not a second page
      yield this.app.client.windowByUrl(Brave.browserWindowUrl)
      for (let i = 0; i < appConfig.defaultSettings[settings.TABS_PER_PAGE] - 1; i++) {
        yield this.app.client
          .click(newFrameButton)
          .waitForElementCount(tabsTabs, i + 2)
      }
    })

    it('shows 2 tab pages when there are more than 1 page worth of tabs', function * () {
      yield this.app.client.click(newFrameButton)
        .waitForElementCount(tabPage, 2)
    })

    it('shows no tab pages when you have only 1 page', function * () {
      yield this.app.client
        .waitForExist('[data-test-id="tab"][data-frame-key="1"]')
        .middleClick('[data-test-active-tab]')
        .waitForElementCount(tabPage, 0)
    })

    it('focuses active tab\'s page when closing last tab on page', function * () {
      yield this.app.client.waitForVisible('[data-test-active-tab]')
    })

    it('shows the right number of tabs after closing with mouse', function * () {
      const numTabsPerPage = appConfig.defaultSettings[settings.TABS_PER_PAGE]
      yield this.app.client.click(newFrameButton)
        .waitForElementCount(tabPage, 2)
        .moveToObject(activeTab)
        .click(closeTab)
        // No tab page indicator elements when 1 page
        .waitForElementCount(tabPage, 0)
        .waitForElementCount(tabsTabs, numTabsPerPage)
    })

    it('closing tabs with close-to-left option', function * () {
      let tabId = 0
      yield this.app.client
        .click(newFrameButton)
        .waitForElementCount(tabPage, 2)
        .waitUntil(function () {
          return this.getAppState().then((state) => {
            const length = state.value.tabs.length
            tabId = state.value.tabs[length - 1].id
            return true
          })
        })
        .waitUntil(function () {
          return this.ipcSend(messages.SHORTCUT_CLOSE_OTHER_FRAMES, tabId, false, true)
        })
        .waitForElementCount(tabPage, 0)
        .waitForElementCount(tabsTabs, 1)
    })

    describe('allows changing to tab pages', function () {
      beforeEach(function * () {
        // Make sure there are 2 tab pages
        yield this.app.client
          .click(newFrameButton)
          .waitForElementCount(tabPage, 2)
      })

      it('clicking tab page changes', function * () {
        yield this.app.client.click(tabPage1)
          .waitForElementCount(tabPage1 + '.active', 1)
      })

      it('clicking on webview resets tab page selection', function * () {
        yield this.app.client
          .waitForElementCount(tabPage2 + '.active', 1)
          .click(activeWebview)
          .waitForElementCount(tabPage2 + '.active', 1)
      })
    })

    describe('tabs per page setting', function () {
      it('takes effect immediately', function * () {
        const newValue = 6
        const tabs = appConfig.defaultSettings[settings.TABS_PER_PAGE]
        const numberOfPages = Math.ceil(tabs / newValue)
        const numberOfTabs = tabs - (Math.floor(tabs / newValue) * newValue)
        yield this.app.client
          .tabByIndex(1)
          .loadUrl('about:preferences')
          .waitForVisible(tabsTab)
          .click(tabsTab)
          .waitForElementCount('[data-test-id="tabsPerTabPage"]', 1)
          .click('[data-test-id="tabsPerTabPage"]')
          .click(`option[value="${newValue}"]`)
          .waitForBrowserWindow()
          .waitForElementCount(tabPage, numberOfPages)
          .waitForElementCount('.tabArea', numberOfTabs)
      })
    })
  })

  describe('basic tab page functionality with pinned tabs', function () {
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

      yield this.app.client
        .waitForElementCount(tabPage, 0)

      for (let i = 0; i < appConfig.defaultSettings[settings.TABS_PER_PAGE] - 1; i++) {
        yield this.app.client
          .click(newFrameButton)
          .waitForElementCount(tabsTabs, i + 2)
      }
    })

    it('shows no tab pages when you have 1 pinned and 20 unpinned tabs', function * () {
      yield this.app.client
        .waitForExist('[data-test-id="tab"][data-frame-key="1"]')
        .middleClick(activeTab)
        .waitForElementCount(tabPage, 0)
    })

    it('shows second tab page when you have 1 pinned and 21 unpinned tabs', function * () {
      yield this.app.client
        .click(newFrameButton)
        .waitForElementCount(tabPage, 2)
    })
  })

  describe('tab page previews', function () {
    Brave.beforeAll(this)

    before(function * () {
      yield setup(this.app.client)
      yield this.app.client.changeSetting(settings.TABS_PER_PAGE, appConfig.defaultSettings[settings.TABS_PER_PAGE])
      // Make sure there are 2 tab pages
      yield this.app.client.windowByUrl(Brave.browserWindowUrl)
      const tabsPerPage = appConfig.defaultSettings[settings.TABS_PER_PAGE]
      for (let i = 0; i < tabsPerPage; i++) {
        yield this.app.client
          .waitForExist(newFrameButton)
          .click(newFrameButton)
          .waitForElementCount(tabsTabs, ((i + 1) % tabsPerPage) + 1)
      }
      yield this.app.client
        .waitForElementCount(tabPage, 2)
    })

    it('hovering over a tab page changes it', function * () {
      yield this.app.client
        .waitForExist(tabPage2 + '.active')
        .moveToObject(tabPage1, 5, 5)
        .waitForExist('.tabStripContainer.isPreview')
        .waitForElementCount(tabsTabs, appConfig.defaultSettings[settings.TABS_PER_PAGE])
    })
  })
})
