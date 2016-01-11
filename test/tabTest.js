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
        .ipcSend(messages.SHORTCUT_NEW_FRAME, 'http://www.brianbondy.com', true)
        .waitForExist('.tab[data-frame-key="3"]')
        .waitForVisible('webview[partition]')
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
})
