/* global describe, it, before */

const Brave = require('./lib/brave')
const Config = require('../js/constants/config').default
const messages = require('../js/constants/messages')
const {urlInput, newFrameButtonInsideTabs, newFrameButtonOutsideTabs} = require('./lib/selectors')
const assert = require('assert')

describe('tabs', function () {
  function * setup (client) {
    yield client
      .waitUntilWindowLoaded()
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
        .waitForExist('.tab[data-frame-key="2"]')
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

  describe('new tab button', function () {
    Brave.beforeAll(this)
    before(function *() {
      yield setup(this.app.client)
    })

    it('tab button is located at the correct position', function *() {
      // The first 5 tabs per page should show up with the new tab button next to the tabs
      // and upon clicking it should jump back next to the tabs.
      for (let i = 0; i < Config.tabs.tabsPerPage - 1; i++) {
        yield this.app.client.waitForExist(newFrameButtonInsideTabs)
          .isExisting(newFrameButtonOutsideTabs).then(isExisting =>
            assert(!isExisting))
          .click(newFrameButtonInsideTabs)
      }
      yield this.app.client.waitForExist(newFrameButtonOutsideTabs)
        .isExisting(newFrameButtonInsideTabs).then(isExisting =>
          assert(!isExisting))
        .click(newFrameButtonOutsideTabs)
        .waitForExist(newFrameButtonInsideTabs)
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
})
