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

  describe('new tab', function () {
    Brave.beforeAll(this)
    before(function *() {
      yield setup(this.app.client)
    })

    it('creates a new tab when signaled', function *() {
      yield this.app.client
        .ipcSend(messages.SHORTCUT_NEW_FRAME)
        .waitForExist('.tab[data-frame-key="2"]')
        .waitForVisible('webview:not([partition])')
    })

    it('creates a private new tab when signaled', function *() {
      yield this.app.client
        .ipcSend(messages.SHORTCUT_NEW_FRAME, 'http://www.brave.com', { isPrivate: true })
        .waitForExist('.tab[data-frame-key="3"]')
        .waitForVisible('webview[partition="private-1"]')
    })

    it('creates a partitioned new tab when signaled', function *() {
      yield this.app.client
        .ipcSend(messages.SHORTCUT_NEW_FRAME, 'http://www.brave.com', { isPartitioned: true })
        .waitForExist('.tab[data-frame-key="4"]')
        .waitForVisible('webview[partition="persist:partition-1"]')
        .ipcSend(messages.SHORTCUT_NEW_FRAME, 'http://www.brave.com', { isPartitioned: true })
        .waitForExist('.tab[data-frame-key="5"]')
        .waitForVisible('webview[partition="persist:partition-2"]')
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
