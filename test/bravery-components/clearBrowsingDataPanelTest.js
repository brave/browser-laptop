/* global describe, it, beforeEach */

const Brave = require('../lib/brave')
const {urlInput, braveMenu, noScriptSwitch, braveryPanel, notificationBar, clearBrowsingDataButton, securityTab, clearDataButton} = require('../lib/selectors')
const {getTargetAboutUrl} = require('../../js/lib/appUrlUtil')
const {getHistory} = require('../../app/common/lib/historyUtil')
const messages = require('../../js/constants/messages')

describe('Clear Browsing Panel', function () {
  function * setup (client) {
    yield client
      .waitForUrl(Brave.newTabUrl)
      .waitForBrowserWindow()
      .waitForVisible(urlInput)
  }

  function * openBraveMenu (client) {
    return client
      .windowByUrl(Brave.browserWindowUrl)
      .waitForVisible(braveMenu)
      .click(braveMenu)
      .waitForVisible(braveryPanel)
  }

  function * openClearBrowsingDataPanel (client) {
    return client
      .tabByIndex(0)
      .loadUrl(getTargetAboutUrl('about:preferences'))
      .waitForVisible(securityTab)
      .click(securityTab)
      .waitForVisible(clearBrowsingDataButton)
      .click(clearBrowsingDataButton)
      .waitForBrowserWindow()
  }

  describe('with saved state values', function () {
    Brave.beforeEach(this)
    beforeEach(function * () {
      const page1Url = Brave.server.url('page1.html')
      yield setup(this.app.client)
      yield this.app.client
        .tabByIndex(0)
        .loadUrl(page1Url)
        .waitForBrowserWindow()
    })

    it('saves the history switch state', function * () {
      const page1Url = Brave.server.url('page1.html')
      const browserHistorySwitch = '.browserHistorySwitch'
      yield openClearBrowsingDataPanel(this.app.client)
      yield this.app.client
        .waitForVisible(browserHistorySwitch)
        .waitForVisible(clearDataButton)
        .click(`${browserHistorySwitch} .switchBackground`)
        .click(clearDataButton)
        .waitUntil(function () {
          return this.getAppState().then((val) => {
            return getHistory(val.value.sites).size === 0
          })
        })
      yield this.app.client
        .tabByIndex(0)
        .loadUrl(page1Url)
        .waitForBrowserWindow()
        .waitUntil(function () {
          return this.getAppState().then((val) => {
            return getHistory(val.value.sites).size === 1
          })
        })
      yield openClearBrowsingDataPanel(this.app.client)
      yield this.app.client
        .waitForVisible(`${browserHistorySwitch} .switchedOn`)
        .waitForVisible(clearDataButton)
        .click(clearDataButton)
        .waitUntil(function () {
          return this.getAppState().then((val) => {
            return getHistory(val.value.sites).size === 0
          })
        })
    })
  })

  describe('with history', function () {
    Brave.beforeEach(this)
    beforeEach(function * () {
      const page1Url = Brave.server.url('page1.html')
      yield setup(this.app.client)
      yield this.app.client
        .onClearBrowsingData({browserHistory: true})
        .tabByIndex(0)
        .loadUrl(page1Url)
        .waitForBrowserWindow()
        .waitUntil(function () {
          return this.getAppState().then((val) =>
            getHistory(val.value.sites).size === 1 &&
            val.value.about.history.entries.length === 1 &&
            getHistory(val.value.about.newtab.sites).size === 1)
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
        .waitForVisible(clearDataButton)
        .click(clearDataButton)
        .waitUntil(function () {
          return this.getAppState().then((val) => {
            return getHistory(val.value.sites).size === 0
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
        .onClearBrowsingData({browserHistory: true})
        .tabByIndex(0)
        .loadUrl(page1Url)
        .waitForBrowserWindow()
        .waitUntil(function () {
          return this.getAppState().then((val) => {
            return getHistory(val.value.sites).size === 1
          })
        })
    })

    it('clears closedFrames', function * () {
      const page2Url = Brave.server.url('page2.html')
      yield this.app.client
        .windowByUrl(Brave.browserWindowUrl)
        .newTab({ url: page2Url })
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
        .onClearBrowsingData({browserHistory: true})
        .waitUntil(function () {
          return this.getWindowState().then((val) => {
            return val.value.closedFrames.length === 0
          })
        })
    })
  })

  describe('with site settings', function () {
    Brave.beforeEach(this)
    beforeEach(function * () {
      this.notificationUrl = Brave.server.url('notification.html')
      yield setup(this.app.client)
      yield this.app.client
        .tabByIndex(0)
        .loadUrl(this.notificationUrl)
        .windowByUrl(Brave.browserWindowUrl)
        .waitForExist(notificationBar)
        .waitForExist('[data-l10n-id=rememberDecision]')
        .click('[data-l10n-id=rememberDecision]')
        .waitForExist('button=Allow')
        .click('button=Allow')
      yield this.app.client
        .tabByIndex(0)
        .url('https://example.com')
      yield openBraveMenu(this.app.client)
      yield this.app.client
        .click(noScriptSwitch)
        .waitUntil(function () {
          return this.getAppState().then((val) => {
            return Object.keys(val.value.siteSettings).length === 2
          })
        })
    })

    it('clears site settings and permissions', function * () {
      yield this.app.client
        .tabByIndex(0)
        .loadUrl(getTargetAboutUrl('about:preferences'))
        .waitForVisible(securityTab)
        .click(securityTab)
        .waitForVisible(clearBrowsingDataButton)
        .click(clearBrowsingDataButton)
        .waitForBrowserWindow()
        .waitForVisible('.siteSettingsSwitch')
        .click('.siteSettingsSwitch .switchBackground')
        .waitForVisible(clearDataButton)
        .click(clearDataButton)
        .waitUntil(function () {
          return this.getAppState().then((val) => {
            return Object.keys(val.value.siteSettings).length === 0
          })
        })
    })
  })
})
