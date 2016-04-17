/* global describe, it, before */

const Brave = require('../lib/brave')
const messages = require('../../js/constants/messages')
const settings = require('../../js/constants/settings')
const {urlInput} = require('../lib/selectors')

describe('tabs', function () {
  function * setup (client) {
    yield client
      .waitUntilWindowLoaded()
      .waitForUrl(Brave.browserWindowUrl)
      .waitForVisible('#window')
      .waitForVisible(urlInput)
  }

  describe('new tab signal', function () {
    Brave.beforeAll(this)
    before(function *() {
      yield setup(this.app.client)
    })

    it('creates a new tab when signaled', function *() {
      yield this.app.client
        .ipcSend(messages.SHORTCUT_NEW_FRAME)
        .waitForExist('.tab[data-frame-key="2"]')
    })

    it('makes the non partitioned webview visible', function *() {
      yield this.app.client
        .waitForVisible('webview:not([partition])')
    })
  })

  describe('new private tab signal', function () {
    Brave.beforeAll(this)
    before(function *() {
      yield setup(this.app.client)
    })
    it('creates a new private tab when signaled', function *() {
      yield this.app.client
        .ipcSend(messages.SHORTCUT_NEW_FRAME, 'http://www.brave.com', { isPrivate: true })
        .waitForExist('.tab.private[data-frame-key="2"]')
    })
    it('makes the private webview visible', function *() {
      yield this.app.client
        .waitForVisible('webview[partition="private-1"]')
    })
  })

  describe('new session tab signal', function () {
    Brave.beforeAll(this)
    before(function *() {
      yield setup(this.app.client)
    })
    it('creates a new session tab when signaled', function *() {
      yield this.app.client
        .ipcSend(messages.SHORTCUT_NEW_FRAME, 'http://www.brave.com', { isPartitioned: true })
        .waitForExist('.tab[data-frame-key="2"]')
    })
    it('makes the new session webview visible', function *() {
      yield this.app.client
        .waitForVisible('webview[partition="persist:partition-1"]')
    })
  })

  describe('close tab', function () {
    var windowCountBeforeTabClose = 3
    var windowCountAfterTabClose = 2
    Brave.beforeAll(this)
    before(function *() {
      yield setup(this.app.client)
    })
    it('should close the tab', function * () {
      yield this.app.client
        .waitForUrl(Brave.browserWindowUrl)
        .ipcSend(messages.SHORTCUT_NEW_FRAME)
        .waitUntil(function () {
          return this.waitForUrl(Brave.browserWindowUrl).getWindowCount().then((count) => count === windowCountBeforeTabClose)
        })
      yield this.app.client
        .waitForUrl(Brave.browserWindowUrl)
        .ipcSend(messages.SHORTCUT_CLOSE_FRAME)
        .waitUntil(function () {
          return this.waitForUrl(Brave.browserWindowUrl).getWindowCount().then((count) => count === windowCountAfterTabClose)
        })
    })
    it('should undo last closed tab', function * () {
      yield this.app.client
        .waitForUrl(Brave.browserWindowUrl)
        .ipcSend(messages.SHORTCUT_NEW_FRAME)
        .waitUntil(function () {
          return this.waitForUrl(Brave.browserWindowUrl).getWindowCount().then((count) => count === windowCountBeforeTabClose)
        })
      yield this.app.client
        .waitForUrl(Brave.browserWindowUrl)
        .ipcSend(messages.SHORTCUT_CLOSE_FRAME)
        .waitUntil(function () {
          return this.waitForUrl(Brave.browserWindowUrl).getWindowCount().then((count) => count === windowCountAfterTabClose)
        })
      yield this.app.client
        .waitForUrl(Brave.browserWindowUrl)
        .ipcSend(messages.SHORTCUT_UNDO_CLOSED_FRAME)
        .waitUntil(function () {
          return this.waitForUrl(Brave.browserWindowUrl).getWindowCount().then((count) => count === windowCountBeforeTabClose)
        })
    })
  })

  describe('webview background-tab events', function () {
    Brave.beforeAll(this)
    before(function *() {
      yield setup(this.app.client)
    })
    it('opens background tab', function *() {
      yield this.app.client
        .sendWebviewEvent(1, 'new-window', {}, 'new-window', 'http://www.brave.com', 'some-frame', 'background-tab')
    })
    it('opens in a new active tab', function *() {
      yield this.app.client.waitForExist('.frameWrapper:not(.isActive) webview[data-frame-key="2"]')
    })
  })

  describe('webview foreground-tab events', function () {
    Brave.beforeAll(this)
    before(function *() {
      yield setup(this.app.client)
    })
    it('opens foreground tab', function *() {
      yield this.app.client
        .sendWebviewEvent(1, 'new-window', {}, 'new-window', 'http://www.brave.com', 'some-frame', 'foreground-tab')
    })
    it('opens in a new, but not active tab', function *() {
      yield this.app.client.waitForExist('.frameWrapper.isActive webview[data-frame-key="2"]')
    })
  })

  describe('webview previews when tab is hovered', function () {
    Brave.beforeAll(this)
    before(function *() {
      yield setup(this.app.client)
      yield this.app.client
        .ipcSend(messages.SHORTCUT_NEW_FRAME)
        .waitForExist('.tab[data-frame-key="2"]')
        .ipcSend(messages.SHORTCUT_NEW_FRAME)
        .waitForExist('.tab[data-frame-key="3"]')
    })
    it('shows a tab preview', function *() {
      yield this.app.client
        .moveToObject('.tab[data-frame-key="2"]')
        .moveToObject('.tab[data-frame-key="2"]', 3, 3)
        .waitForExist('.frameWrapper.isPreview webview[data-frame-key="2"]')
        .moveToObject(urlInput)
    })
    it('does not show tab previews when setting is off', function *() {
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
    before(function *() {
      yield setup(this.app.client)
    })
    it('new tab opens in background by default', function *() {
      yield this.app.client
        .ipcSend(messages.SHORTCUT_NEW_FRAME, 'about:blank', {openInForeground: false})
        .waitForExist('.tab[data-frame-key="2"]')
      yield this.app.client.waitForExist('.frameWrapper:not(.isActive) webview[data-frame-key="2"]')
    })
    it('changing new tab default makes new tabs open in background by default', function *() {
      yield this.app.client.changeSetting(settings.SWITCH_TO_NEW_TABS, true)
      yield this.app.client
        .ipcSend(messages.SHORTCUT_NEW_FRAME, 'about:blank', {openInForeground: false})
        .waitForExist('.tab[data-frame-key="3"]')
      yield this.app.client.waitForExist('.frameWrapper.isActive webview[data-frame-key="3"]')
    })
  })
})
