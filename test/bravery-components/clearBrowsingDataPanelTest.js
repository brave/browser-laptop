/* global describe, it, beforeEach */

const Brave = require('../lib/brave')
const {urlInput, braveMenu, noScriptSwitch, braveryPanel, notificationBar, clearBrowsingDataButton, securityTab, clearDataButton} = require('../lib/selectors')
const {getTargetAboutUrl} = require('../../js/lib/appUrlUtil')
const aboutPreferencesUrl = getTargetAboutUrl('about:preferences')
const {getHistory} = require('../../app/common/lib/historyUtil')
const messages = require('../../js/constants/messages')
const siteSettingsList = require('../../js/data/siteSettingsList')

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
      .loadUrl(aboutPreferencesUrl)
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
      yield openClearBrowsingDataPanel(this.app.client)
      yield this.app.client
        .waitForVisible('[data-test-id="browserHistorySwitch"]')
        .waitForVisible(clearDataButton)
        .click('[data-test-id="browserHistorySwitch"] .switchBackground')
        .click(clearDataButton)
        .waitUntil(function () {
          return this.getAppState().then((val) => {
            return getHistory(val.value.historySites).size === 0
          })
        })
      yield this.app.client
        .tabByIndex(0)
        .loadUrl(page1Url)
        .waitForBrowserWindow()
        .waitUntil(function () {
          return this.getAppState().then((val) => {
            return getHistory(val.value.historySites).size === 1
          })
        })
      yield openClearBrowsingDataPanel(this.app.client)
      yield this.app.client
        .waitForVisible('[data-test-id="browserHistorySwitch"] .switchedOn')
        .waitForVisible(clearDataButton)
        .click(clearDataButton)
        .waitUntil(function () {
          return this.getAppState().then((val) => {
            return getHistory(val.value.historySites).size === 0
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
        .onClearBrowsingData('browserHistory', true)
        .tabByIndex(0)
        .loadUrl(page1Url)
        .waitForBrowserWindow()
        .pause(5500) // top sites are debounced for 5 seconds
        .waitUntil(function () {
          return this.getAppState().then((val) => {
            console.log(getHistory(val.value.historySites).size)
            console.log(val.value.about.history.entries.length)
            console.log(getHistory(val.value.about.newtab.sites))

            return getHistory(val.value.historySites).size === 1 &&
              val.value.about.history.entries.length === 1 &&
              getHistory(val.value.about.newtab.sites).size === 6 &&
              val.value.about.newtab.sites[0].title === 'Page 1'
          })
        })
    })

    it('shows clearing options', function * () {
      yield this.app.client
        .tabByIndex(0)
        .loadUrl(aboutPreferencesUrl)
        .waitForVisible(securityTab)
        .click(securityTab)
        .waitForVisible(clearBrowsingDataButton)
    })

    it('clears the browsing history', function * () {
      yield this.app.client
        .tabByIndex(0)
        .loadUrl(aboutPreferencesUrl)
        .waitForVisible(securityTab)
        .click(securityTab)
        .waitForVisible(clearBrowsingDataButton)
        .click(clearBrowsingDataButton)
        .waitForBrowserWindow()
        .waitForVisible('[data-test-id="browserHistorySwitch"] .switchedOn')
        .waitForVisible(clearDataButton)
        .click(clearDataButton)
        .waitUntil(function () {
          return this.getAppState().then((val) => {
            return getHistory(val.value.historySites).size === 0
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
        .onClearBrowsingData('browserHistory', true)
        .tabByIndex(0)
        .loadUrl(page1Url)
        .waitForBrowserWindow()
        .waitUntil(function () {
          return this.getAppState().then((val) => {
            return getHistory(val.value.historySites).size === 1
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
        .onClearBrowsingData('browserHistory', true)
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
            return Object.keys(val.value.siteSettings).length === (2 + siteSettingsList.defaultSiteSettingsList.length)
          })
        })
    })

    it('clears site settings and permissions', function * () {
      yield this.app.client
        .tabByIndex(0)
        .loadUrl(aboutPreferencesUrl)
        .waitForVisible(securityTab)
        .click(securityTab)
        .waitForVisible(clearBrowsingDataButton)
        .click(clearBrowsingDataButton)
        .waitForBrowserWindow()
        .waitForVisible('[data-test-id="siteSettingsSwitch"]')
        .click('[data-test-id="siteSettingsSwitch"] .switchBackground')
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
