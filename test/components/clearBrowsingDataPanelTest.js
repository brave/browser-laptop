/* global describe, it, beforeEach */

const Brave = require('../lib/brave')
const {urlInput, clearBrowsingDataButton, securityTab} = require('../lib/selectors')
const {getTargetAboutUrl} = require('../../js/lib/appUrlUtil')
const messages = require('../../js/constants/messages')

describe('Clear Browsing Panel', function () {
  function * setup (client) {
    yield client
      .waitUntilWindowLoaded()
      .waitForUrl(Brave.newTabUrl)
      .waitForBrowserWindow()
      .waitForVisible('#window')
      .waitForVisible(urlInput)
  }

  describe('with history', function () {
    Brave.beforeEach(this)
    beforeEach(function * () {
      const page1Url = Brave.server.url('page1.html')
      yield setup(this.app.client)
      yield this.app.client
        .tabByIndex(0)
        .loadUrl(page1Url)
        .waitForBrowserWindow()
        .waitUntil(function () {
          return this.getAppState().then((val) => {
            return val.value.sites.length === 1
          })
        })
    })

    it('shows clearing options', function * () {
      const clearBrowsingDataButton = '.clearBrowsingDataButton'
      yield this.app.client
        .tabByIndex(0)
        .loadUrl(getTargetAboutUrl('about:preferences'))
        .waitForVisible(securityTab)
        .click(securityTab)
        .waitForVisible(clearBrowsingDataButton)
    })

    it('clears the browsing history', function * () {
      yield this.app.client
        .tabByIndex(0)
        .loadUrl(getTargetAboutUrl('about:preferences'))
        .waitForVisible(securityTab)
        .click(securityTab)
        .waitForVisible(clearBrowsingDataButton)
        .click(clearBrowsingDataButton)
        .waitForBrowserWindow()
        .waitForVisible('.browserHistorySwitch')
        .waitForVisible('.clearDataButton')
        .click('.clearDataButton')
        .waitUntil(function () {
          return this.getAppState().then((val) => {
            return val.value.sites.length === 0
          })
        })
    })
  })

  describe('with closedFrames', function () {
    Brave.beforeEach(this)
    beforeEach(function * () {
      const page1Url = Brave.server.url('page1.html')
      yield setup(this.app.client)
      yield this.app.client
        .tabByIndex(0)
        .loadUrl(page1Url)
        .waitForBrowserWindow()
        .waitUntil(function () {
          return this.getAppState().then((val) => {
            return val.value.sites.length === 1
          })
        })
    })

    it('clears closedFrames', function * () {
      const page2Url = Brave.server.url('page2.html')
      yield this.app.client
        .windowByUrl(Brave.browserWindowUrl)
        .ipcSend(messages.SHORTCUT_NEW_FRAME, page2Url)
        .waitUntil(function () {
          return this.getWindowState().then((val) => {
            return val.value.frames.length === 2
          })
        })
        .ipcSend(messages.SHORTCUT_CLOSE_FRAME)
        .waitUntil(function () {
          return this.getWindowState().then((val) => {
            return val.value.closedFrames.length === 1
          })
        })
        .clearAppData({browserHistory: true})
        .waitUntil(function () {
          return this.getWindowState().then((val) => {
            return val.value.closedFrames.length === 0
          })
        })
    })
  })
})
