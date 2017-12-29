/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

/* global describe, it, before, beforeEach, after, afterEach */

const Brave = require('../lib/brave')
const assert = require('assert')
const {urlInput, navigatorBookmarked, navigatorNotBookmarked, pinnedTabsTabs, tabsTabs} = require('../lib/selectors')
const siteTags = require('../../js/constants/siteTags')
const settings = require('../../js/constants/settings')
const {getTargetAboutUrl} = require('../../js/lib/appUrlUtil')
const {startsWithOption} = require('../../app/common/constants/settingsEnums')

describe('sessionStore test', function () {
  function * setup (client) {
    yield client
      .waitForBrowserWindow()
      .waitForVisible(urlInput)
  }

  function * setupBrave () {
    Brave.addCommands()
  }

  function * checkWindow (client, width, height, x, y) {
    yield client.app.client
      .windowByIndex(0)
      .browserWindow.getBounds().should.eventually.have.property('width').should.become(width)

    yield client.app.client
      .windowByIndex(0)
      .browserWindow.getBounds().should.eventually.have.property('height').should.become(height)

    yield client.app.client
      .windowByIndex(0)
      .browserWindow.getBounds().then((res) => res.x).should.eventually.be.equal(x)

    yield client.app.client
      .windowByIndex(0)
      .browserWindow.getBounds().then((res) => res.y).should.eventually.be.equal(y)
  }

  function * restart () {
    yield Brave.stopApp(false, 10000)
    yield Brave.startApp()
    yield setupBrave()
  }

  describe('state is preserved with a normal shutdown', function () {
    Brave.beforeAllServerSetup(this)
    before(function * () {
      const page1Url = Brave.server.url('page1.html')
      const site = {
        location: page1Url,
        title: 'some page',
        type: siteTags.BOOKMARK
      }
      yield Brave.startApp()
      yield setupBrave(Brave.app.client)
      yield Brave.app.client
        .waitForBrowserWindow()
        .changeSetting(settings.DISABLE_TITLE_MODE, false)
        .waitForUrl(Brave.newTabUrl)
        .loadUrl(page1Url)
        .windowParentByUrl(page1Url)
        .activateURLMode()
        .waitForExist(navigatorNotBookmarked)
        .addBookmark(site)
        .waitForExist(navigatorBookmarked)
      // See: #10490
      yield restart()
    })

    after(function * () {
      yield Brave.stopApp()
    })

    it('windowState by preserving open page', function * () {
      const page1Url = Brave.server.url('page1.html')
      yield Brave.app.client
        .waitForUrl(page1Url)
        .waitForBrowserWindow()
        .activateURLMode()
        .waitForInputText(urlInput, page1Url)
    })

    it('appstate by preserving a bookmark', function * () {
      yield Brave.app.client
        .waitForBrowserWindow()
        .activateURLMode()
        .waitForExist(navigatorBookmarked)
    })
  })

  describe('state is preserved with a hung window', function () {
    Brave.beforeAllServerSetup(this)
    before(function * () {
      const page1Url = Brave.server.url('page1.html')
      const site = {
        location: page1Url,
        title: 'some page',
        type: siteTags.BOOKMARK
      }
      yield Brave.startApp()
      yield setupBrave(Brave.app.client)
      yield Brave.app.client
        .waitForBrowserWindow()
        .changeSetting(settings.DISABLE_TITLE_MODE, false)
        .waitForUrl(Brave.newTabUrl)
        .loadUrl(page1Url)
        .windowParentByUrl(page1Url)
        .activateURLMode()
        .waitForExist(navigatorNotBookmarked)
        .addBookmark(site)
        .waitForExist(navigatorBookmarked)
      // See: #10490
      yield restart()

      yield Brave.app.client
        .windowByUrl(Brave.browserWindowUrl)
        .waitForBrowserWindow()
        .activateURLMode()
        .waitForInputText(urlInput, page1Url)
        .stopReportingStateUpdates()
        .newTab({active: false})
        .waitForTabCount(2)
        .waitForBrowserWindow()
      // See: #10490
      yield restart()
    })

    after(function * () {
      yield Brave.stopApp()
    })

    it('windowState by preserving open page', function * () {
      const page1Url = Brave.server.url('page1.html')
      yield Brave.app.client
        .waitForUrl(page1Url)
        .waitForBrowserWindow()
        .activateURLMode()
        .waitForInputText(urlInput, page1Url)
    })

    it('appstate by preserving a bookmark', function * () {
      yield Brave.app.client
        .waitForBrowserWindow()
        .activateURLMode()
        .waitForExist(navigatorBookmarked)
    })

    it('has only 1 tab on restore', function * () {
      yield Brave.app.client
        .waitForTabCount(1)
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
        yield setupBrave(Brave.app.client)
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
          .activateTabByIndex(1)
          .waitForExist(this.activeTabSelector, 30000)
        // See: #10490
        yield restart()
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
        yield setupBrave(Brave.app.client)
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
        // See: #10490
        yield restart()
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
      yield setupBrave(Brave.app.client)
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

      // See: #10490
      yield restart()
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

  describe('window position and size are restored correctly', function () {
    Brave.beforeAllServerSetup(this)
    const width = 600
    const height = 700
    const x = 100
    const y = 200

    beforeEach(function * () {
      yield Brave.startApp()
      yield setupBrave(Brave.app.client)
      yield setup(Brave.app.client)

      yield Brave.app.client
        .waitForUrl(Brave.newTabUrl)
        .waitForBrowserWindow()
        .unmaximize()
        .resizeWindow(width, height)
        .setWindowPosition(x, y)
    })

    afterEach(function * () {
      yield Brave.stopApp()
    })

    it('brave starts with windows from last time', function * () {
      yield Brave.app.client
        .waitForUrl(Brave.newTabUrl)
        .waitForBrowserWindow()
        .changeSetting(settings.STARTUP_MODE, startsWithOption.WINDOWS_TABS_FROM_LAST_TIME)

      // See: #10490
      yield restart()
      yield setup(Brave.app.client)

      yield checkWindow(Brave, width, height, x, y)
    })

    it('brave starts with home page', function * () {
      yield Brave.app.client
        .waitForUrl(Brave.newTabUrl)
        .waitForBrowserWindow()
        .changeSetting(settings.STARTUP_MODE, startsWithOption.HOMEPAGE)

      // See: #10490
      yield restart()
      yield setup(Brave.app.client)

      yield checkWindow(Brave, width, height, x, y)
    })

    it('brave starts with new tab page', function * () {
      yield Brave.app.client
        .waitForUrl(Brave.newTabUrl)
        .waitForBrowserWindow()
        .changeSetting(settings.STARTUP_MODE, startsWithOption.NEW_TAB_PAGE)

      // See: #10490
      yield restart()
      yield setup(Brave.app.client)

      yield checkWindow(Brave, width, height, x, y)
    })
  })

  describe('clears data on shutdown', function () {
    Brave.beforeAllServerSetup(this)
    beforeEach(function * () {
      yield Brave.startApp()
      yield setupBrave(Brave.app.client)
      yield setup(Brave.app.client)
      yield Brave.app.client
        .waitForUrl(Brave.newTabUrl)
        .waitForBrowserWindow()
    })
    it('clears history', function * () {
      const aboutHistoryUrl = getTargetAboutUrl('about:history')
      yield Brave.app.client
        .changeSetting(settings.SHUTDOWN_CLEAR_HISTORY, true)
        .addHistorySite({ location: 'https://abcdefg.com/test' })
        .tabByIndex(0)
        .url(aboutHistoryUrl)
        .waitForElementCount('[data-test-id="time"]', 1)
      yield restart()
      yield Brave.app.client
        .waitForBrowserWindow()
        .tabByIndex(0)
        .url(aboutHistoryUrl)
        .pause(100)
        .isExisting('[data-test-id="time"]').then((isExisting) => assert(!isExisting))
    })
  })
})
