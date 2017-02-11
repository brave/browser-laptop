/* global describe, it, before, beforeEach */

const Brave = require('../lib/brave')
const messages = require('../../js/constants/messages')
const assert = require('assert')
const settings = require('../../js/constants/settings')
const {urlInput, backButton, forwardButton, activeTabTitle, activeTabFavicon, newFrameButton} = require('../lib/selectors')

describe('tab tests', function () {
  function * setup (client) {
    yield client
      .waitForUrl(Brave.newTabUrl)
      .waitForBrowserWindow()
      .waitForVisible(urlInput)
  }

  describe('back forward actions', function () {
    Brave.beforeAll(this)
    before(function * () {
      yield setup(this.app.client)
    })

    it('sets correct title', function * () {
      var page1 = Brave.server.url('page1.html')
      var page2 = Brave.server.url('page2.html')

      yield this.app.client
        .tabByIndex(0)
        .loadUrl(page1)
        .windowByUrl(Brave.browserWindowUrl)
        .waitUntil(function () {
          return this.getText(activeTabTitle)
            .then((title) => title === 'Page 1')
        })
        .tabByIndex(0)
        .loadUrl(page2)
        .windowByUrl(Brave.browserWindowUrl)
        .waitUntil(function () {
          return this.getText(activeTabTitle)
            .then((title) => title === 'Page 2')
        })
        .waitForExist(backButton)
        .click(backButton)
        .waitForUrl(page1)
        .windowByUrl(Brave.browserWindowUrl)
        .waitUntil(function () {
          return this.getText(activeTabTitle)
            .then((title) => title === 'Page 1')
        })
        .waitForExist(forwardButton)
        .click(forwardButton)
        .waitForUrl(page2)
        .windowByUrl(Brave.browserWindowUrl)
        .waitUntil(function () {
          return this.getText(activeTabTitle)
            .then((title) => title === 'Page 2')
        })
    })
  })

  describe('new tab signal', function () {
    Brave.beforeAll(this)
    before(function * () {
      yield setup(this.app.client)
    })

    it('creates a new tab when signaled', function * () {
      yield this.app.client
        .ipcSend(messages.SHORTCUT_NEW_FRAME)
        .waitForExist('[data-test-id="tab"][data-frame-key="2"]')
    })

    it('makes the non partitioned webview visible', function * () {
      yield this.app.client
        .waitForVisible('webview[partition="persist:default"]')
    })
  })

  describe('new tab button', function () {
    Brave.beforeEach(this)
    beforeEach(function * () {
      yield setup(this.app.client)
    })

    it('creates a new tab when clicked', function * () {
      yield this.app.client
        .click(newFrameButton)
        .waitForExist('[data-test-id="tab"][data-frame-key="2"]')
    })
    it('shows a context menu when long pressed (click and hold)', function * () {
      yield this.app.client
        .moveToObject(newFrameButton)
        .buttonDown(0)
        .waitForExist('.contextMenu .contextMenuItem .contextMenuItemText')
        .buttonUp(0)
    })
    it('shows a context menu when right clicked', function * () {
      yield this.app.client
        .rightClick(newFrameButton)
        .waitForExist('.contextMenu .contextMenuItem .contextMenuItemText')
    })
  })

  describe('tab order', function () {
    describe('sequentially by default', function () {
      Brave.beforeAll(this)
      before(function * () {
        yield setup(this.app.client)
      })

      it('creates a new tab when signaled', function * () {
        yield this.app.client
          .ipcSend(messages.SHORTCUT_NEW_FRAME, 'about:blank', { openInForeground: false })
          .waitForExist('[data-test-id="tab"][data-frame-key="2"]')
          .ipcSend(messages.SHORTCUT_NEW_FRAME, 'about:blank')
          .waitForExist('.tabArea + .tabArea + .tabArea [data-test-id="tab"][data-frame-key="3"]')
      })
    })
    describe('respects parentFrameKey', function () {
      Brave.beforeAll(this)
      before(function * () {
        yield setup(this.app.client)
      })

      it('creates a new tab when signaled', function * () {
        yield this.app.client
          .ipcSend(messages.SHORTCUT_NEW_FRAME, 'about:blank', { openInForeground: false })
          .waitForExist('[data-test-id="tab"][data-frame-key="2"]')
          .ipcSend(messages.SHORTCUT_NEW_FRAME, 'about:blank', { parentFrameKey: 1 })
          .waitForExist('.tabArea:nth-child(2) [data-test-id="tab"][data-frame-key="3"]')
      })
    })
  })

  describe('new private tab signal', function () {
    Brave.beforeAll(this)
    before(function * () {
      yield setup(this.app.client)
      var url = Brave.server.url('page1.html')
      yield this.app
        .client.ipcSend(messages.SHORTCUT_NEW_FRAME, url, { isPrivate: true })
        .waitForUrl(url)
        .windowByUrl(Brave.browserWindowUrl)
    })
    it('creates a new private tab', function * () {
      yield this.app.client
        .waitForExist('[data-test-private-tab][data-frame-key="2"]')
    })
    it('makes the private webview visible', function * () {
      yield this.app.client
        .waitForVisible('webview[partition="default"]')
    })
  })

  describe('new session tab signal', function () {
    Brave.beforeAll(this)
    before(function * () {
      yield setup(this.app.client)
      var url = Brave.server.url('page1.html')
      yield this.app
        .client.ipcSend(messages.SHORTCUT_NEW_FRAME, url, { isPartitioned: true })
        .waitForUrl(url)
        .windowByUrl(Brave.browserWindowUrl)
    })
    it('creates a new session tab', function * () {
      yield this.app.client
        .waitForExist('[data-test-id="tab"][data-frame-key="2"]')
    })
    it('makes the new session webview visible', function * () {
      yield this.app.client
        .waitForVisible('webview[partition="persist:partition-1"]')
    })
  })

  describe('specific session tab signal', function () {
    Brave.beforeAll(this)
    before(function * () {
      yield setup(this.app.client)
      var url = Brave.server.url('page1.html')
      yield this.app
        .client.ipcSend(messages.SHORTCUT_NEW_FRAME, url, { partitionNumber: 3 })
        .waitForUrl(url)
        .windowByUrl(Brave.browserWindowUrl)
    })
    it('creates a new session tab', function * () {
      yield this.app.client
        .waitForExist('[data-test-id="tab"][data-frame-key="2"]')
    })
    it('makes the new session webview visible', function * () {
      yield this.app.client
        .waitForVisible('webview[partition="persist:partition-3"]')
    })
  })

  describe('close tab', function () {
    var tabCountBeforeTabClose = 2
    var tabCountAfterTabClose = 1
    Brave.beforeAll(this)
    before(function * () {
      yield setup(this.app.client)
    })
    it('can close a normal tab', function * () {
      yield this.app.client
        .waitForBrowserWindow()
        .waitForExist('[data-test-active-tab][data-frame-key="1"]')
        .ipcSend(messages.SHORTCUT_NEW_FRAME)
        .waitUntil(function () {
          return this.waitForUrl(Brave.newTabUrl)
            .waitForTabCount(tabCountBeforeTabClose)
        })
      yield this.app.client
        .waitForBrowserWindow()
        .ipcSend(messages.SHORTCUT_CLOSE_FRAME)
        .waitUntil(function () {
          return this.waitForUrl(Brave.newTabUrl)
            .waitForTabCount(tabCountAfterTabClose)
        })
    })
    it('can close an unloaded tab', function * () {
      yield this.app.client
        .waitForBrowserWindow()
        .windowByUrl(Brave.browserWindowUrl)
        .ipcSend(messages.SHORTCUT_NEW_FRAME, Brave.server.url('page1.html'), {frameOpts: {unloaded: true, location: Brave.server.url('page1.html'), title: 'hi', tabId: null}, openInForeground: false})
        .waitForElementCount('[data-test-id="tab"]', 2)
        // This ensures it's actually unloaded
        .waitForTabCount(1)
        .windowByUrl(Brave.browserWindowUrl)
        .ipcSend(messages.SHORTCUT_CLOSE_OTHER_FRAMES, 1, true, true)
        .waitForTabCount(tabCountAfterTabClose)
    })
    it('should undo last closed tab', function * () {
      yield this.app.client
        .waitForBrowserWindow()
        .waitForExist('[data-test-active-tab][data-frame-key="1"]')
        .ipcSend(messages.SHORTCUT_NEW_FRAME, Brave.server.url('page1.html'))
        .waitUntil(function () {
          return this.waitForUrl(Brave.newTabUrl)
            .waitForTabCount(tabCountBeforeTabClose)
        })
      yield this.app.client
        .waitForBrowserWindow()
        .ipcSend(messages.SHORTCUT_CLOSE_FRAME)
        .waitUntil(function () {
          return this.waitForUrl(Brave.newTabUrl)
            .waitForTabCount(tabCountAfterTabClose)
        })
      yield this.app.client
        .waitForBrowserWindow()
        .ipcSend(messages.SHORTCUT_UNDO_CLOSED_FRAME)
        .waitUntil(function () {
          return this.waitForUrl(Brave.newTabUrl)
            .waitForTabCount(tabCountBeforeTabClose)
        })
    })
  })

  describe('webview previews when tab is hovered', function () {
    Brave.beforeAll(this)
    before(function * () {
      var page1 = Brave.server.url('page1.html')
      var page2 = Brave.server.url('page2.html')

      yield setup(this.app.client)
      yield this.app.client
        .ipcSend(messages.SHORTCUT_NEW_FRAME, page1)
        .waitForUrl(page1)
        .windowByUrl(Brave.browserWindowUrl)
        .waitForExist('[data-test-id="tab"][data-frame-key="2"]')
        .ipcSend(messages.SHORTCUT_NEW_FRAME, page2)
        .waitForUrl(page2)
        .windowByUrl(Brave.browserWindowUrl)
        .waitForExist('[data-test-id="tab"][data-frame-key="3"]')
    })
    it('shows a tab preview', function * () {
      yield this.app.client
        .moveToObject('[data-test-id="tab"][data-frame-key="2"]')
        .moveToObject('[data-test-id="tab"][data-frame-key="2"]', 3, 3)
        .waitForExist('.frameWrapper.isPreview webview[data-frame-key="2"]')
        .moveToObject(urlInput)
    })
    it('does not show tab previews when setting is off', function * () {
      yield this.app.client.changeSetting(settings.SHOW_TAB_PREVIEWS, false)
      yield this.app.client
        .moveToObject('[data-test-id="tab"][data-frame-key="2"]')
        .moveToObject('[data-test-id="tab"][data-frame-key="2"]', 3, 3)
      try {
        yield this.app.client.waitForExist('.frameWrapper.isPreview webview[data-frame-key="2"]', 1000)
      } catch (e) {
        return
      }
      throw new Error('Preview should never become active when previews are off')
    })
  })

  describe('new tabs open per the switch to new tabs setting', function () {
    Brave.beforeAll(this)
    before(function * () {
      yield setup(this.app.client)
    })
    it('new tab opens in background by default', function * () {
      var url = Brave.server.url('page1.html')
      yield this.app.client
        .ipcSend(messages.SHORTCUT_NEW_FRAME, url, {openInForeground: false})
        .waitForUrl(url)
        .windowByUrl(Brave.browserWindowUrl)
        .waitForExist('[data-test-id="tab"][data-frame-key="2"]')
      yield this.app.client.waitForExist('.frameWrapper:not(.isActive) webview[data-frame-key="2"]')
    })
    it('changing new tab default makes new tabs open in background by default', function * () {
      var url = Brave.server.url('page2.html')
      yield this.app.client.changeSetting(settings.SWITCH_TO_NEW_TABS, true)
      yield this.app.client
        .ipcSend(messages.SHORTCUT_NEW_FRAME, url, {openInForeground: false})
        .waitForUrl(url)
        .windowByUrl(Brave.browserWindowUrl)
        .waitForExist('[data-test-id="tab"][data-frame-key="3"]')
      yield this.app.client.waitForExist('.frameWrapper.isActive webview[data-frame-key="3"]')
    })
  })

  describe('tabs with icons', function () {
    Brave.beforeAll(this)
    before(function * () {
      yield setup(this.app.client)
    })

    it('shows tab\'s icon when page is not about:blank or about:newtab ', function * () {
      var url = Brave.server.url('favicon.html')
      yield this.app.client
        .tabByIndex(0)
        .loadUrl(url)
        .windowByUrl(url)
        .waitForExist(activeTabFavicon)
    })

    it('about:newtab shouldn\'t have a tab icon', function * () {
      yield this.app.client
        .tabByIndex(0)
        .loadUrl('about:newtab')
        .windowByUrl('about:newtab')
        .waitForElementCount(activeTabFavicon, 0)
    })
  })

  describe('about:blank tab', function () {
    Brave.beforeAll(this)
    before(function * () {
      yield setup(this.app.client)
    })

    it('has untitled text right away', function * () {
      yield this.app.client
        .ipcSend(messages.SHORTCUT_NEW_FRAME, 'about:blank', { openInForeground: false })
        .waitForVisible('[data-test-id="tab"][data-frame-key="2"]')
        // This should not be converted to a waitUntil
        .getText('[data-test-id="tab"][data-frame-key="2"]').then((val) => assert.equal(val, 'Untitled'))
    })
  })
})
