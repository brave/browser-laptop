/* global describe, it, before */

const Brave = require('../lib/brave')
const messages = require('../../js/constants/messages')
const settings = require('../../js/constants/settings')
const {urlInput} = require('../lib/selectors')

describe('tabs', function () {
  function * setup (client) {
    yield client
      .waitUntilWindowLoaded()
      .waitForUrl(Brave.newTabUrl)
      .waitForBrowserWindow()
      .waitForVisible('#window')
      .waitForVisible(urlInput)
  }

  describe('new tab signal', function () {
    Brave.beforeAll(this)
    before(function * () {
      yield setup(this.app.client)
    })

    it('creates a new tab when signaled', function * () {
      yield this.app.client
        .ipcSend(messages.SHORTCUT_NEW_FRAME)
        .waitForExist('.tab[data-frame-key="2"]')
    })

    it('makes the non partitioned webview visible', function * () {
      yield this.app.client
        .waitForVisible('webview[partition="persist:default"]')
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
          .waitForExist('.tab[data-frame-key="2"]')
          .ipcSend(messages.SHORTCUT_NEW_FRAME, 'about:blank')
          .waitForExist('.tabArea + .tabArea + .tabArea .tab[data-frame-key="3"')
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
          .waitForExist('.tab[data-frame-key="2"]')
          .ipcSend(messages.SHORTCUT_NEW_FRAME, 'about:blank', { parentFrameKey: 1 })
          .waitForExist('.tabArea:nth-child(2) .tab[data-frame-key="3"]')
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
        .waitForExist('.tab.private[data-frame-key="2"]')
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
        .waitForExist('.tab[data-frame-key="2"]')
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
        .waitForExist('.tab[data-frame-key="2"]')
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
    it('should close the tab', function * () {
      yield this.app.client
        .waitForBrowserWindow()
        .waitForExist('.tab.active[data-frame-key="1"]')
        .ipcSend(messages.SHORTCUT_NEW_FRAME)
        .waitUntil(function () {
          return this.waitForUrl(Brave.newTabUrl).getTabCount().then((count) => count === tabCountBeforeTabClose)
        })
      yield this.app.client
        .waitForBrowserWindow()
        .ipcSend(messages.SHORTCUT_CLOSE_FRAME)
        .waitUntil(function () {
          return this.waitForUrl(Brave.newTabUrl).getTabCount().then((count) => count === tabCountAfterTabClose)
        })
    })
    it('should undo last closed tab', function * () {
      yield this.app.client
        .waitForBrowserWindow()
        .waitForExist('.tab.active[data-frame-key="1"]')
        .ipcSend(messages.SHORTCUT_NEW_FRAME)
        .waitUntil(function () {
          return this.waitForUrl(Brave.newTabUrl).getTabCount().then((count) => count === tabCountBeforeTabClose)
        })
      yield this.app.client
        .waitForBrowserWindow()
        .ipcSend(messages.SHORTCUT_CLOSE_FRAME)
        .waitUntil(function () {
          return this.waitForUrl(Brave.newTabUrl).getTabCount().then((count) => count === tabCountAfterTabClose)
        })
      yield this.app.client
        .waitForBrowserWindow()
        .ipcSend(messages.SHORTCUT_UNDO_CLOSED_FRAME)
        .waitUntil(function () {
          return this.waitForUrl(Brave.newTabUrl).getTabCount().then((count) => count === tabCountBeforeTabClose)
        })
    })
  })

  describe('webview background-tab events', function () {
    Brave.beforeAll(this)
    before(function * () {
      yield setup(this.app.client)
      yield this.app.client
        .sendWebviewEvent(1, 'new-window', {}, 'new-window', Brave.server.url('page1.html'), 'some-frame', 'background-tab')
    })
    it('opens in a new, but not active tab', function * () {
      yield this.app.client
        .windowByUrl(Brave.browserWindowUrl)
        .waitForExist('.tab.active[data-frame-key="1"]')
        .waitForExist('.tab:not(.active)[data-frame-key="2"]')
    })
  })

  describe('webview foreground-tab events', function () {
    Brave.beforeAll(this)
    before(function * () {
      yield setup(this.app.client)
      yield this.app.client
        .sendWebviewEvent(1, 'new-window', {}, 'new-window', Brave.server.url('page1.html'), 'some-frame', 'foreground-tab')
    })
    it('opens in a new active tab', function * () {
      yield this.app.client
        .waitForExist('.frameWrapper:not(.isActive) webview[data-frame-key="1"]')
        .waitForExist('.frameWrapper.isActive webview[data-frame-key="2"]')
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
        .waitForExist('.tab[data-frame-key="2"]')
        .ipcSend(messages.SHORTCUT_NEW_FRAME, page2)
        .waitForUrl(page2)
        .windowByUrl(Brave.browserWindowUrl)
        .waitForExist('.tab[data-frame-key="3"]')
    })
    it('shows a tab preview', function * () {
      yield this.app.client
        .moveToObject('.tab[data-frame-key="2"]')
        .moveToObject('.tab[data-frame-key="2"]', 3, 3)
        .waitForExist('.frameWrapper.isPreview webview[data-frame-key="2"]')
        .moveToObject(urlInput)
    })
    it('does not show tab previews when setting is off', function * () {
      yield this.app.client.changeSetting(settings.SHOW_TAB_PREVIEWS, false)
      yield this.app.client
        .moveToObject('.tab[data-frame-key="2"]')
        .moveToObject('.tab[data-frame-key="2"]', 3, 3)
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
        .waitForExist('.tab[data-frame-key="2"]')
      yield this.app.client.waitForExist('.frameWrapper:not(.isActive) webview[data-frame-key="2"]')
    })
    it('changing new tab default makes new tabs open in background by default', function * () {
      var url = Brave.server.url('page2.html')
      yield this.app.client.changeSetting(settings.SWITCH_TO_NEW_TABS, true)
      yield this.app.client
        .ipcSend(messages.SHORTCUT_NEW_FRAME, url, {openInForeground: false})
        .waitForUrl(url)
        .windowByUrl(Brave.browserWindowUrl)
        .waitForExist('.tab[data-frame-key="3"]')
      yield this.app.client.waitForExist('.frameWrapper.isActive webview[data-frame-key="3"]')
    })
  })
})
