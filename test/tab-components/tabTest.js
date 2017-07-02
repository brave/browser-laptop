/* global describe, it, before, beforeEach */

const Brave = require('../lib/brave')
const messages = require('../../js/constants/messages')
const settings = require('../../js/constants/settings')
const {urlInput, backButton, forwardButton, activeTab, activeTabTitle, activeTabFavicon, newFrameButton, notificationBar, contextMenu, pinnedTabsTabs, tabsTabs} = require('../lib/selectors')

const newTabUrl = 'chrome-extension://mnojpmjdmbbfmejpflffifhffcmidifd/about-newtab.html'

describe('tab tests', function () {
  function * setup (client) {
    yield client
      .waitForUrl(Brave.newTabUrl)
      .waitForBrowserWindow()
      .waitForVisible(urlInput)
  }

  describe('back forward actions', function () {
    Brave.beforeEach(this)
    beforeEach(function * () {
      yield setup(this.app.client)
      this.page1 = Brave.server.url('page1.html')
      this.page2 = Brave.server.url('page2.html')
    })

    it('sets correct title', function * () {
      yield this.app.client
        .tabByIndex(0)
        .loadUrl(this.page1)
        .windowByUrl(Brave.browserWindowUrl)
        .waitForTextValue(activeTabTitle, 'Page 1')
        .tabByIndex(0)
        .loadUrl(this.page2)
        .windowByUrl(Brave.browserWindowUrl)
        .waitForTextValue(activeTabTitle, 'Page 2')
        .waitForExist(backButton)
        .click(backButton)
        .waitForUrl(this.page1)
        .windowByUrl(Brave.browserWindowUrl)
        .waitForTextValue(activeTabTitle, 'Page 1')
        .waitForExist(forwardButton)
        .click(forwardButton)
        .waitForUrl(this.page2)
        .windowByUrl(Brave.browserWindowUrl)
        .waitForTextValue(activeTabTitle, 'Page 2')
    })

    it('middle click opens in the new tab', function * () {
      yield this.app.client
        .tabByIndex(0)
        .loadUrl(this.page1)
        .windowByUrl(Brave.browserWindowUrl)
        .waitForTextValue(activeTabTitle, 'Page 1')
        .tabByIndex(0)
        .loadUrl(this.page2)
        .windowByUrl(Brave.browserWindowUrl)
        .waitForTextValue(activeTabTitle, 'Page 2')
        .waitForExist(backButton)
        .click(backButton)
        .waitForUrl(this.page1)
        .windowByUrl(Brave.browserWindowUrl)
        .waitForTextValue(activeTabTitle, 'Page 1')
        .waitForExist(forwardButton)
        .rightClick(forwardButton)
        .waitForExist(contextMenu)
        .middleClick(`${contextMenu} [data-index="0"]`)
        .waitForTabCount(2)
    })
  })

  describe('new tab signal', function () {
    Brave.beforeAll(this)
    before(function * () {
      yield setup(this.app.client)
    })

    it('creates a new tab when signaled', function * () {
      yield this.app.client
        .newTab()
        .waitForExist('[data-test-id="tab"][data-frame-key="2"]')
    })

    it('makes the non partitioned webview visible', function * () {
      yield this.app.client
        .waitForVisible('.frameWrapper[data-partition="persist:default"] webview')
    })

    it('shows new tab title instead of about:newtab', function * () {
      yield this.app.client
        .newTab()
        .waitForExist('[data-test-id="tab"][data-frame-key="2"]')
        .waitForTextValue('[data-test-id="tab"][data-frame-key="2"]', 'New Tab')
    })

    it('shows empty urlbar', function * () {
      yield this.app.client
        .newTab()
        .waitForExist('webview[data-frame-key="4"]')
        .waitUntil(function () {
          return this.getAttribute('webview[data-frame-key="4"]', 'src').then((value) => value === newTabUrl)
        })
        .waitUntil(function () {
          return this.getAttribute(urlInput, 'value').then((value) => value === '')
        })
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
    it('shows empty urlbar', function * () {
      yield this.app.client
        .click(newFrameButton)
        .waitForExist('webview[data-frame-key="2"]')
        .waitUntil(function () {
          return this.getAttribute('webview[data-frame-key="2"]', 'src').then((value) => value === newTabUrl)
        })
        .waitUntil(function () {
          return this.getAttribute(urlInput, 'value').then((value) => value === '')
        })
    })
    it.skip('shows a context menu when long pressed (click and hold)', function * () {
      yield this.app.client
        .moveToObject(newFrameButton)
        .buttonDown(0)
        .waitForExist('.contextMenu .contextMenuItem .contextMenuItemText')
        .buttonUp(0)
    })
    it.skip('shows a context menu when right clicked', function * () {
      yield this.app.client
        .rightClick(newFrameButton)
        .waitForExist('.contextMenu .contextMenuItem .contextMenuItemText')
    })
  })

  describe('tab order', function () {
    describe('with pinned tabs', function () {
      Brave.beforeAll(this)
      before(function * () {
        this.page1 = Brave.server.url('page1.html')
        this.page2 = Brave.server.url('page2.html')
        yield setup(this.app.client)
        yield this.app.client
          .waitForExist('.tabArea:nth-of-type(1) [data-frame-key="1"]') // original newtab
          .newTab({ url: this.page1, pinned: true })
          .waitForExist(pinnedTabsTabs + '[data-frame-key="2"]')
          .newTab({ url: this.page1 })
          .waitForExist(tabsTabs + '[data-frame-key="3"]')
          .newTab({ url: this.page2 })
          .waitForExist(tabsTabs + '[data-frame-key="4"]')
      })

      it('sequentially by default', function * () {
        yield this.app.client
          .waitForExist('.tabArea:nth-of-type(2) [data-frame-key="3"]')
          .waitForExist('webview[data-frame-key="3"][src="' + this.page1 + '"]')
          .waitForExist('.tabArea:nth-of-type(3) [data-frame-key="4"]')
          .waitForExist('.frameWrapper.isActive webview[data-frame-key="4"][src="' + this.page2 + '"]')
      })
    })
    describe('sequentially by default', function () {
      Brave.beforeAll(this)
      before(function * () {
        yield setup(this.app.client)
      })

      it('creates a new tab when signaled', function * () {
        yield this.app.client
          .newTab({ url: 'about:blank', active: false })
          .waitForExist('[data-test-id="tab"][data-frame-key="2"]')
          .newTab({ url: 'about:blank' })
          .waitForExist('.tabArea + .tabArea + .tabArea [data-test-id="tab"][data-frame-key="3"]')
      })
    })
    describe('new tabs with openerTabId', function () {
      Brave.beforeAll(this)
      before(function * () {
        yield setup(this.app.client)
      })

      it('respects window tab ordering', function * () {
        const data = {}
        yield this.app.client
          .newTab({ url: 'about:blank', active: false })
          .waitForTabCount(2)
          .windowByUrl(Brave.browserWindowUrl)
          .waitForExist('[data-test-id="tab"][data-frame-key="2"]')
          .getTabIdByIndex(0).then((tabId) => {
            data.tabId = tabId
          })

        yield this.app.client
          .newTab({ url: 'about:blank', openerTabId: data.tabId })
          .waitForTabCount(3)
          .windowByUrl(Brave.browserWindowUrl)
          .waitForExist('.tabArea:nth-child(2) [data-test-id="tab"][data-frame-key="3"]')
      })
    })
  })

  describe('new private tab signal', function () {
    Brave.beforeAll(this)
    before(function * () {
      const page1 = Brave.server.url('page1.html')
      yield setup(this.app.client)
      yield this.app.client
        .newTab({ url: page1, isPrivate: true })
        .waitForUrl(page1)
        .windowByUrl(Brave.browserWindowUrl)
    })
    it('creates a new private tab', function * () {
      yield this.app.client
        .waitForExist('[data-test-private-tab][data-frame-key="2"]')
    })
    it('makes the private webview visible', function * () {
      yield this.app.client
        .waitForVisible('.frameWrapper[data-partition="default"] webview')
    })
  })

  describe('new session tab signal', function () {
    Brave.beforeAll(this)
    before(function * () {
      const page1 = Brave.server.url('page1.html')
      yield setup(this.app.client)
      yield this.app.client
        .newTab({ url: page1, isPartitioned: true })
        .waitForUrl(page1)
        .windowByUrl(Brave.browserWindowUrl)
    })
    it('creates a new session tab', function * () {
      yield this.app.client
        .waitForExist('[data-test-id="tab"][data-frame-key="2"]')
    })
    it('makes the new session webview visible', function * () {
      yield this.app.client
        .waitForVisible('.frameWrapper[data-partition="persist:partition-1"] webview')
    })
  })

  describe('specific session tab signal', function () {
    Brave.beforeAll(this)
    before(function * () {
      const page1 = Brave.server.url('page1.html')
      yield setup(this.app.client)
      yield this.app.client
        .newTab({ url: page1, partitionNumber: 3 })
        .waitForUrl(page1)
        .windowByUrl(Brave.browserWindowUrl)
    })
    it('creates a new session tab', function * () {
      yield this.app.client
        .waitForExist('[data-test-id="tab"][data-frame-key="2"]')
    })
    it('makes the new session webview visible', function * () {
      yield this.app.client
        .waitForVisible('.frameWrapper[data-partition="persist:partition-3"] webview')
    })
  })

  describe('close tab', function () {
    const tabCountBeforeTabClose = 2
    const tabCountAfterTabClose = 1
    Brave.beforeAll(this)
    before(function * () {
      this.page1 = Brave.server.url('page1.html')
      yield setup(this.app.client)
    })
    it('can close a normal tab', function * () {
      yield this.app.client
        .waitForBrowserWindow()
        .waitForExist('[data-test-active-tab][data-frame-key="1"]')
        .newTab()
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
        .newTab({
          location: this.page1,
          discarded: true,
          active: false
        }, false)
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
        .newTab({ url: this.page1 })
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

  describe('sequentially closing tabs', function () {
    Brave.beforeAll(this)
    before(function * () {
      const page1 = Brave.server.url('adblock2.html')
      const page2 = Brave.server.url('red_bg.html')
      const page3 = Brave.server.url('yellow_header.html')

      yield setup(this.app.client)
      yield this.app.client
        .newTab({ url: page1 })
        .waitForUrl(page1)
        .windowByUrl(Brave.browserWindowUrl)
        .waitForExist('[data-test-id="tab"][data-frame-key="2"]')
        .newTab({ url: page2 })
        .waitForUrl(page2)
        .windowByUrl(Brave.browserWindowUrl)
        .waitForExist('[data-test-id="tab"][data-frame-key="3"]')
        .newTab({ url: page3 })
        .waitForUrl(page3)
        .windowByUrl(Brave.browserWindowUrl)
        .waitForExist('[data-test-id="tab"][data-frame-key="4"]')
    })

    it('fallsback to last active tab if next tab does not exist', function * () {
      yield this.app.client.changeSetting(settings.SHOW_TAB_PREVIEWS, false)
      yield this.app.client
        .moveToObject('[data-test-id="tab"][data-frame-key="3"]')
        .middleClick('[data-test-id="tab"][data-frame-key="3"]')
        .moveToObject('[data-test-id="tab"][data-frame-key="4"]')
        .middleClick('[data-test-id="tab"][data-frame-key="4"]')
        .waitForVisible('[data-test-active-tab="true"][data-frame-key="2"]')
    })
  })

  describe('webview previews when tab is hovered', function () {
    Brave.beforeAll(this)
    before(function * () {
      const page1 = Brave.server.url('page1.html')
      const page2 = Brave.server.url('page2.html')
      yield setup(this.app.client)
      yield this.app.client
        .newTab({ url: page1 })
        .waitForUrl(page1)
        .windowByUrl(Brave.browserWindowUrl)
        .waitForExist('[data-test-id="tab"][data-frame-key="2"]')
        .newTab({ url: page2 })
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

  describe('webview previews the next tab when current hovered tab is closed', function () {
    Brave.beforeAll(this)
    before(function * () {
      const page1 = Brave.server.url('adblock2.html')
      const page2 = Brave.server.url('red_bg.html')
      const page3 = Brave.server.url('page_favicon_not_found.html')
      const page4 = Brave.server.url('yellow_header.html')
      const page5 = Brave.server.url('page1.html')
      const page6 = Brave.server.url('page2.html')
      yield setup(this.app.client)
      yield this.app.client
        .newTab({ url: page1 })
        .waitForUrl(page1)
        .windowByUrl(Brave.browserWindowUrl)
        .waitForExist('[data-test-id="tab"][data-frame-key="2"]')
        .newTab({ url: page2 })
        .waitForUrl(page2)
        .windowByUrl(Brave.browserWindowUrl)
        .waitForExist('[data-test-id="tab"][data-frame-key="3"]')
        .newTab({ url: page3 })
        .waitForUrl(page3)
        .windowByUrl(Brave.browserWindowUrl)
        .waitForExist('[data-test-id="tab"][data-frame-key="4"]')
        .newTab({ url: page4 })
        .waitForUrl(page4)
        .windowByUrl(Brave.browserWindowUrl)
        .waitForExist('[data-test-id="tab"][data-frame-key="5"]')
        .newTab({ url: page5 })
        .waitForUrl(page5)
        .windowByUrl(Brave.browserWindowUrl)
        .waitForExist('[data-test-id="tab"][data-frame-key="6"]')
        .newTab({ url: page6 })
        .waitForUrl(page6)
        .windowByUrl(Brave.browserWindowUrl)
        .waitForExist('[data-test-id="tab"][data-frame-key="7"]')
    })

    it('show active tab content if next tab does not exist', function * () {
      yield this.app.client
        .moveToObject('[data-test-id="tab"][data-frame-key="2"]')
        .click('[data-test-id="tab"][data-frame-key="2"]')
        .moveToObject('[data-test-id="tab"][data-frame-key="7"]')
        .middleClick('[data-test-id="tab"][data-frame-key="7"]')
        // no preview should be shown
        .waitForVisible('.frameWrapper.isPreview webview', 500, true)
    })
    it('preview the next tab if preview option is on', function * () {
      yield this.app.client
        .moveToObject('[data-test-id="tab"][data-frame-key="2"]')
        .click('[data-test-id="tab"][data-frame-key="2"]')
        .moveToObject('[data-test-id="tab"][data-frame-key="4"]')
        .middleClick('[data-test-id="tab"][data-frame-key="4"]')
        .waitForExist('.frameWrapper.isPreview webview[data-frame-key="5"]')
        .waitForVisible('.frameWrapper.isPreview webview[data-frame-key="5"]')
    })
    it('do not preview the next tab if preview option is off', function * () {
      yield this.app.client.changeSetting(settings.SHOW_TAB_PREVIEWS, false)
      yield this.app.client
        .moveToObject('[data-test-id="tab"][data-frame-key="2"]')
        .click('[data-test-id="tab"][data-frame-key="2"]')
        .moveToObject('[data-test-id="tab"][data-frame-key="5"]')
        .middleClick('[data-test-id="tab"][data-frame-key="5"]')
        // no preview should be shown
        .waitForVisible('.frameWrapper.isPreview webview', 500, true)
    })
  })

  describe('new tabs open per the switch to new tabs setting', function () {
    Brave.beforeAll(this)
    before(function * () {
      yield setup(this.app.client)
      this.page1 = Brave.server.url('page1.html')
      this.page2 = Brave.server.url('page2.html')
      yield this.app.client
        .newTab({ url: this.page1, active: false })
    })
    it('new tab opens in background when `active == false`', function * () {
      yield this.app.client
        .waitForUrl(this.page1)
        .windowByUrl(Brave.browserWindowUrl)
        .waitForExist('[data-test-id="tab"][data-frame-key="2"]')
        .waitForExist('.frameWrapper:not(.isActive) webview[data-frame-key="2"]')
        .windowByUrl(Brave.browserWindowUrl)
        .waitForTab({index: 1, active: false})
    })
    describe('change setting to SWITCH_TO_NEW_TABS', function * () {
      before(function * () {
        yield this.app.client
          .changeSetting(settings.SWITCH_TO_NEW_TABS, true)
          .newTab({ url: this.page2, active: false })
      })
      it('forces `active == false` to open in the foreground', function * () {
        yield this.app.client
          .waitForUrl(this.page2)
          .waitForExist('[data-test-id="tab"][data-frame-key="2"]')
          .waitForExist('.frameWrapper .isActive webview[data-frame-key="2"]')
          .windowByUrl(Brave.browserWindowUrl)
          .waitForTab({index: 1, active: true})
      })
    })
  })

  describe('tabs with icons', function () {
    Brave.beforeAll(this)
    before(function * () {
      yield setup(this.app.client)
    })

    it('shows tab\'s icon when page is not about:blank or about:newtab ', function * () {
      const url = Brave.server.url('favicon.html')
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

    describe('unloaded tabs', function () {
      before(function * () {
        this.faviconUrl = Brave.server.url('img/test.ico')
        const url = Brave.server.url('favicon.html')
        yield this.app.client
          .newTab({
            location: url,
            faviconUrl: this.faviconUrl,
            discarded: true,
            active: false
          }, false)
      })

      it('should display the specified favicon', function * () {
        yield this.app.client
          .waitForExist('[data-frame-key="2"] [data-test-favicon="' + this.faviconUrl + '"]')
      })
    })
  })

  describe('about:blank tab', function () {
    Brave.beforeAll(this)
    before(function * () {
      yield setup(this.app.client)
    })

    it('has untitled text right away', function * () {
      yield this.app.client
        .newTab({ url: 'about:blank', active: false })
        .waitForVisible('[data-test-id="tab"][data-frame-key="2"]')
        // This should not be converted to a waitUntil
        .waitForTextValue('[data-test-id="tab"][data-frame-key="2"]', 'Untitled')
    })
  })

  describe('webview in fullscreen mode', function () {
    Brave.beforeAll(this)
    before(function * () {
      yield setup(this.app.client)
    })

    it('keep favicon and title after exiting fullscreen mode', function * () {
      const url1 = Brave.server.url('fullscreen.html')

      yield this.app.client
        .tabByIndex(0)
        .loadUrl(url1)
        .tabByUrl(url1)
        .waitForExist('#fullscreenImg')
        .click('#fullscreenImg')
        .windowByUrl(Brave.browserWindowUrl)
        .waitForExist(notificationBar)
        .waitForExist('button=Allow')
        .click('button=Allow')
        .tabByUrl(url1)
        .waitForExist('#fullscreenImg')
        .click('#fullscreenImg')
        .windowByUrl(Brave.browserWindowUrl)
        .moveToObject(activeTab)
        .waitForExist(activeTabFavicon)
        .waitForTextValue(activeTabTitle, 'fullscreenPage')
    })
  })

  describe('tab transfer', function () {
    Brave.beforeEach(this)
    beforeEach(function * () {
      yield setup(this.app.client)
      this.page1 = Brave.server.url('page1.html')
      yield this.app.client
        .windowByUrl(Brave.browserWindowUrl)
    })

    it('can detach into new windows', function * () {
      yield this.app.client
        .newTab({ url: this.page1 })
        .waitForUrl(this.page1)
        .waitForBrowserWindow()
        .waitForTab({index: 0, url: Brave.newTabUrl, windowId: 1})
        .waitForTab({index: 1, url: this.page1, windowId: 1})
        .waitForWindowCount(1)
        .waitForTabCount(2)
        .waitForBrowserWindow()
        .detachTabByIndex(1)
        .waitForWindowCount(2)
        .waitForTabCount(2)
        .waitForBrowserWindow()
        .waitForTab({index: 0, url: Brave.newTabUrl, windowId: 1})
        .waitForTab({index: 0, url: this.page1, windowId: 2})
        .waitForElementCount('.frameWrapper.isActive', 1)
    })

    it('can move into an existing window', function * () {
      yield this.app.client
        .newTab({ url: this.page1 })
        .waitForUrl(this.page1)
        .waitForBrowserWindow()
        .waitForTab({index: 0, url: Brave.newTabUrl, windowId: 1})
        .waitForTab({index: 1, url: this.page1, windowId: 1})
        .waitForWindowCount(1)
        .waitForTabCount(2)
        .waitForBrowserWindow()
        .newWindowAction()
        .waitForUrl(Brave.newTabUrl)
        .waitForWindowCount(2)
        .waitForTabCount(3)
        .waitForBrowserWindow()
        .detachTabByIndex(1, 2)
        .waitForTab({index: 0, url: Brave.newTabUrl, windowId: 1})
        .waitForTab({index: 0, url: Brave.newTabUrl, windowId: 2})
        .waitForTab({index: 1, url: this.page1, windowId: 2})
        .waitForTabCount(3)
        .waitForWindowCount(2)
    })

    it('can detach the last tab into an existing window', function * () {
      yield this.app.client
        .tabByIndex(0)
        .loadUrl(this.page1)
        .waitForUrl(this.page1)
        .waitForBrowserWindow()
        .waitForTab({index: 0, url: this.page1, windowId: 1})
        .waitForWindowCount(1)
        .waitForTabCount(1)
        .waitForBrowserWindow()
        .newWindowAction()
        .waitForWindowCount(2)
        .waitForTabCount(2)
        .waitForBrowserWindow()
        .waitForTab({index: 0, url: this.page1, windowId: 1})
        .waitForTab({index: 0, url: Brave.newTabUrl, windowId: 2})
        .detachTabByIndex(0, 2)
        .waitForWindowCount(1)
        .waitForTabCount(2)
        .windowByIndex(0)
        .waitForTab({index: 0, url: Brave.newTabUrl, windowId: 2})
        .waitForTab({index: 1, url: this.page1, windowId: 2})
    })
  })
})
