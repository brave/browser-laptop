/* global describe, it, before, after */

const Brave = require('../lib/brave')
const Immutable = require('immutable')
const {urlInput, navigatorBookmarked, navigatorNotBookmarked, pinnedTabsTabs, tabsTabs} = require('../lib/selectors')
const siteTags = require('../../js/constants/siteTags')
const siteUtil = require('../../js/state/siteUtil')

describe('sessionStore', function () {
  function * setup (client) {
    Brave.addCommands()
  }

  describe('state is preserved', function () {
    Brave.beforeAllServerSetup(this)
    before(function * () {
      const page1Url = Brave.server.url('page1.html')
      const site = {
        location: page1Url,
        title: 'some page'
      }
      const key = siteUtil.getSiteKey(Immutable.fromJS(site))
      yield Brave.startApp()
      yield setup(Brave.app.client)
      yield Brave.app.client
        .waitForBrowserWindow()
        .onClearBrowsingData({browserHistory: true})
        .waitForUrl(Brave.newTabUrl)
        .loadUrl(page1Url)
        .windowParentByUrl(page1Url)
        .activateURLMode()
        .waitForExist(navigatorNotBookmarked)
      yield Brave.app.client.addSite(site, siteTags.BOOKMARK)
        .waitUntil(function () {
          return this.getAppState().then((val) => {
            let state = val.value
            return siteUtil.getBookmarks(Immutable.fromJS(state.sites)).size === 1 && state.sites[key].location === page1Url
          })
        })
      yield Brave.stopApp(false)
      yield Brave.startApp()
      yield setup(Brave.app.client)
    })

    after(function * () {
      yield Brave.stopApp()
    })

    it('windowState by preserving open page', function * () {
      const page1Url = Brave.server.url('page1.html')
      yield Brave.app.client
        .waitForUrl(page1Url)
        .waitForBrowserWindow()
        .moveToObject(urlInput)
        .waitForInputText(urlInput, page1Url)
    })

    it('appstate by preserving a bookmark', function * () {
      yield Brave.app.client
        .waitForBrowserWindow()
        .waitForExist(navigatorBookmarked)
    })
  })

  describe('restore active tab', function () {
    describe('regular tab', function () {
      Brave.beforeAllServerSetup(this)
      before(function * () {
        this.page1Url = Brave.server.url('page1.html')
        this.page2Url = Brave.server.url('page2.html')
        this.activeTabSelector = '.frameWrapper.isActive webview[data-frame-key="1"][src="' + this.page1Url + '"]'
        yield Brave.startApp()
        yield setup(Brave.app.client)
        yield Brave.app.client
          .waitForBrowserWindow()
          .waitForUrl(Brave.newTabUrl)
          .loadUrl(this.page1Url)
          .windowByUrl(Brave.browserWindowUrl)
          .newTab({url: this.page2Url})
          .waitForUrl(this.page2Url)
          .windowByUrl(Brave.browserWindowUrl)
          .newTab({url: this.page2Url})
          .waitForUrl(this.page2Url)
          .windowByUrl(Brave.browserWindowUrl)
          .waitForElementCount(tabsTabs, 3)
          .pinTabByIndex(2, true)
          .waitForExist(pinnedTabsTabs)
          .waitForElementCount(pinnedTabsTabs, 1)
          .waitForElementCount(tabsTabs, 2)
          .activateTabByIndex(0)
          .waitForExist(this.activeTabSelector)
        yield Brave.stopApp(false)
        yield Brave.startApp()
        yield setup(Brave.app.client)
      })

      after(function * () {
        yield Brave.stopApp()
      })

      it('restores the last active tab', function * () {
        yield Brave.app.client
          .waitForUrl(this.page1Url)
          // page2Url is lazy loaded
          .waitForBrowserWindow()
          .waitForExist(this.activeTabSelector)
      })
    })

    describe('pinned tab', function () {
      Brave.beforeAllServerSetup(this)
      before(function * () {
        this.page1Url = Brave.server.url('page1.html')
        this.page2Url = Brave.server.url('page2.html')
        this.activeTabSelector = '.frameWrapper.isActive webview[data-frame-key="2"][src="' + this.page2Url + '"]'
        yield Brave.startApp()
        yield setup(Brave.app.client)
        yield Brave.app.client
          .waitForBrowserWindow()
          .waitForUrl(Brave.newTabUrl)
          .loadUrl(this.page1Url)
          .windowByUrl(Brave.browserWindowUrl)
          .newTab({url: this.page2Url})
          .waitForUrl(this.page2Url)
          .windowByUrl(Brave.browserWindowUrl)
          .pinTabByIndex(1, true)
          .waitForExist(pinnedTabsTabs)
          .waitForElementCount(pinnedTabsTabs, 1)
          .waitForElementCount(tabsTabs, 1)
          .waitForExist(this.activeTabSelector)
        yield Brave.stopApp(false)
        yield Brave.startApp()
        yield setup(Brave.app.client)
      })

      after(function * () {
        yield Brave.stopApp()
      })

      it('restores the last active pinned tab', function * () {
        yield Brave.app.client
          // page1Url is lazy loaded
          .waitForUrl(this.page2Url)
          .waitForBrowserWindow()
          .waitForExist(this.activeTabSelector)
      })
    })
  })

  describe('firstRunTimestamp', function () {
    Brave.beforeAllServerSetup(this)
    before(function * () {
      yield Brave.startApp()
      yield setup(Brave.app.client)
    })

    after(function * () {
      yield Brave.stopApp()
    })

    it('sets it once', function * () {
      const timestamp = new Date().getTime()
      let firstRunTimestamp
      yield Brave.app.client
        .waitForUrl(Brave.newTabUrl)
        .waitForBrowserWindow()
        .waitUntil(function () {
          return this.getAppState().then((val) => {
            firstRunTimestamp = val.value.firstRunTimestamp
            return (
              firstRunTimestamp > (timestamp - (30 * 1000)) &&
              firstRunTimestamp <= timestamp
            )
          })
        })

      yield Brave.stopApp(false)
      yield Brave.startApp()
      yield setup(Brave.app.client)
      yield Brave.app.client
        .waitForUrl(Brave.newTabUrl)
        .waitForBrowserWindow()
        .waitUntil(function () {
          return this.getAppState().then((val) => {
            return (val.value.firstRunTimestamp === firstRunTimestamp)
          })
        })
    })
  })
})
