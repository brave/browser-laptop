/* global describe, it, before */

const Brave = require('./lib/brave')

const messages = require('../js/constants/messages')
const {urlInput} = require('./lib/selectors')

describe('pinnedTabs', function () {
  function * setup (client) {
    yield client
      .waitUntilWindowLoaded()
      .waitForVisible('#window')
      .waitForVisible(urlInput)
  }

  describe('new pinned tab', function () {
    Brave.beforeAll(this)
    before(function *() {
      this.page1Url = Brave.server.url('page1.html')
      yield setup(this.app.client)
    })
    it.skip('creates when signaled', function *() {
      yield this.app.client
        .ipcSend(messages.SHORTCUT_NEW_FRAME, 'http://www.brave.com', {isPinned: true})
        .waitForExist('.tab.isPinned[data-frame-key="2"]')
    })
  })

  describe('close pinned tab', function () {
    Brave.beforeAll(this)
    before(function *() {
      this.page1Url = Brave.server.url('page1.html')
      yield setup(this.app.client)
    })
    it.skip('should focus on next tab', function *() {
      yield this.app.client
        .ipcSend(messages.SHORTCUT_NEW_FRAME, 'http://www.brave.com')
        .ipcSend(messages.SHORTCUT_NEW_FRAME, 'http://www.brave.com', {isPinned: true})
        .rightClick('.tab.isPinned[data-frame-key="2"]').then(function () {
          // need to implement close button on pinned tabs
          this.click('#close')
        })
        .elementActive('.tab[data-frame-key="1"]').should.eventually.be(true)
    })
  })

  describe('close last pinned tab', function () {
    Brave.beforeAll(this)
    before(function *() {
      this.page1Url = Brave.server.url('page1.html')
      yield setup(this.app.client)
    })

    it.skip('should close the window if there are no other tabs', function *() {
      yield this.app.client
        .ipcSend(messages.SHORTCUT_NEW_FRAME, 'http://www.brave.com', {isPinned: true})
        .rightClick('.tab[data-frame-key="2"]').then(function () {
          // need to implement close button on pinned tabs
          this.click('#close')
        })
        .isExisting('#window').should.eventually.equal(false)
    })
  })
})
