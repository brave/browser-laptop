/* global describe, it, before */

const Brave = require('../lib/brave')
const appConfig = require('../../js/constants/appConfig')
const settings = require('../../js/constants/settings')
const {urlInput, newFrameButton, tabsTabs, tabPage, tabPage1, tabPage2, closeTab, activeWebview} = require('../lib/selectors')
const assert = require('assert')

describe('tab pages', function () {
  function * setup (client) {
    yield client
      .waitUntilWindowLoaded()
      .waitForUrl(Brave.newTabUrl)
      .waitForBrowserWindow()
      .waitForVisible(urlInput)
      .waitForUrl(Brave.newTabUrl)
      .windowByUrl(Brave.browserWindowUrl)
  }

  describe('basic tab page functionality', function () {
    Brave.beforeAll(this)

    before(function * () {
      yield setup(this.app.client)
      yield this.app.client.elements(tabPage, function (e, res) {
        assert.equal(0, res.value.length)
      })
      // Create a full tab set, but not a second page
      for (let i = 0; i < appConfig.defaultSettings[settings.TABS_PER_PAGE] - 1; i++) {
        yield this.app.client.windowByUrl(Brave.browserWindowUrl).click(newFrameButton)
      }
    })

    it('shows 2 tab pages when there are more than 1 page worth of tabs', function * () {
      yield this.app.client.click(newFrameButton)
        .waitUntil(function () {
          return this.elements(tabPage).then((res) => res.value.length === 2)
        })
    })

    it('shows no tab pages when you have only 1 page', function * () {
      yield this.app.client.click(closeTab)
        .waitUntil(function () {
          return this.elements(tabPage).then((res) => res.value.length === 0)
        })
    })

    it('focuses active tab\'s page when closing last tab on page', function * () {
      yield this.app.client.waitForVisible('.tab.active')
    })

    describe('allows changing to tab pages', function () {
      before(function * () {
        // Make sure there are 2 tab pages
        yield this.app.client
          .click(newFrameButton)
          .waitUntil(function () {
            return this.elements(tabPage).then((res) => res.value.length === 2)
          })
      })

      it('clicking tab page changes', function * () {
        yield this.app.client.click(tabPage1)
          .waitForExist(tabPage1 + '.active')
      })

      it('clicking on webview resets tab page selection', function * () {
        yield this.app.client.click(activeWebview)
          .waitForExist(tabPage2 + '.active')
      })
    })

    describe('tabs per page setting', function () {
      it('takes effect immediately', function * () {
        const defaultTabsPerPage = appConfig.defaultSettings[settings.TABS_PER_PAGE]
        yield this.app.client.changeSetting(settings.TABS_PER_PAGE, 1)
        yield this.app.client.waitUntil(function () {
          return this.elements(tabPage).then((res) => res.value.length === (defaultTabsPerPage + 1))
        })
      })
    })
  })

  describe('tab page previews', function () {
    Brave.beforeAll(this)

    before(function * () {
      yield setup(this.app.client)
      yield this.app.client.changeSetting(settings.TABS_PER_PAGE, appConfig.defaultSettings[settings.TABS_PER_PAGE])
      // Make sure there are 2 tab pages
      for (let i = 0; i < appConfig.defaultSettings[settings.TABS_PER_PAGE]; i++) {
        yield this.app.client.windowByUrl(Brave.browserWindowUrl).click(newFrameButton)
      }

      yield this.app.client
        .waitUntil(function () {
          return this.elements(tabPage).then((res) => res.value.length === 2)
        })
    })

    it('hovering over a tab page changes it', function * () {
      yield this.app.client
        .waitForExist(tabPage2 + '.active')
        .moveToObject(tabPage1, 5, 5)
        .waitForExist('.tabStripContainer.isPreview')
        .waitUntil(function () {
          return this.elements(tabsTabs).then((res) => res.value.length === appConfig.defaultSettings[settings.TABS_PER_PAGE])
        })
    })
  })
})
