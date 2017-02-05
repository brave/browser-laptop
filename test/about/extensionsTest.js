/* global describe, it, before */

const Brave = require('../lib/brave')
const {urlInput} = require('../lib/selectors')
const {getTargetAboutUrl} = require('../../js/lib/appUrlUtil')
const settingsConst = require('../../js/constants/settings')
const {passwordManagers, extensionIds} = require('../../js/constants/passwordManagers')
const aboutExtensionsUrl = getTargetAboutUrl('about:extensions')
const extensionDownloadWaitTime = 30000

describe('about:extensions', function () {
  function * setup (client) {
    yield client
      .waitForUrl(Brave.newTabUrl)
      .waitForBrowserWindow()
      .waitForVisible(urlInput)
      .windowByUrl(Brave.browserWindowUrl)
      .waitForExist('[data-test-id="tab"][data-frame-key="1"]')
      .tabByIndex(0)
      .url(aboutExtensionsUrl)
  }
  describe('PDFJS', function () {
    Brave.beforeAll(this)
    before(function * () {
      yield setup(this.app.client)
    })
    it('installs by default', function * () {
      yield this.app.client
        .waitForVisible('[data-extension-id="jdbefljfgobbmcidnmpjamcbhnbphjnb"]')
    })
  })
  describe('Pocket', function () {
    Brave.beforeAll(this)
    before(function * () {
      yield setup(this.app.client)
    })
    it('installs when preference is enabled', function * () {
      yield this.app.client
        .windowByUrl(Brave.browserWindowUrl)
        .changeSetting(settingsConst.POCKET_ENABLED, true)
        .tabByIndex(0)
        .waitForVisible('[data-extension-id="niloccemoadcdkdjlinkgdfekeahmflj"]', extensionDownloadWaitTime)
    })
    it('Opens up the signup page', function * () {
      const pocketURL = 'https://getpocket.com/signup?mode=minimal&src=installed'
      yield this.app.client
        .tabByIndex(0)
        .waitForUrl(pocketURL)
        .url(pocketURL)
    })
  })
  describe('1Password', function () {
    Brave.beforeAll(this)
    before(function * () {
      yield setup(this.app.client)
    })
    it('installs when enabled', function * () {
      yield this.app.client
        .windowByUrl(Brave.browserWindowUrl)
        .changeSetting(settingsConst.ACTIVE_PASSWORD_MANAGER, passwordManagers.ONE_PASSWORD)
        .waitForVisible(`.extensionBrowserAction[data-button-value="${extensionIds[passwordManagers.ONE_PASSWORD]}"]`)
        .tabByIndex(0)
        .waitForVisible(`[data-extension-id="${extensionIds[passwordManagers.ONE_PASSWORD]}"]`, extensionDownloadWaitTime)
    })
  })
  describe('Dashlane installs when enabled', function () {
    Brave.beforeAll(this)
    before(function * () {
      yield setup(this.app.client)
    })
    it('installs', function * () {
      yield this.app.client
        .windowByUrl(Brave.browserWindowUrl)
        .changeSetting(settingsConst.ACTIVE_PASSWORD_MANAGER, passwordManagers.DASHLANE)
        .waitForVisible(`.extensionBrowserAction[data-button-value="${extensionIds[passwordManagers.DASHLANE]}"]`)
        .tabByIndex(0)
        .waitForVisible(`[data-extension-id="${extensionIds[passwordManagers.DASHLANE]}"]`, extensionDownloadWaitTime)
    })
  })
  describe('LastPass installs when enabled', function () {
    Brave.beforeAll(this)
    before(function * () {
      yield setup(this.app.client)
    })
    it('installs', function * () {
      yield this.app.client
        .windowByUrl(Brave.browserWindowUrl)
        .changeSetting(settingsConst.ACTIVE_PASSWORD_MANAGER, passwordManagers.LAST_PASS)
        .waitForVisible(`.extensionBrowserAction[data-button-value="${extensionIds[passwordManagers.LAST_PASS]}"]`)
        .tabByIndex(0)
        .waitForVisible(`[data-extension-id="${extensionIds[passwordManagers.LAST_PASS]}"]`, extensionDownloadWaitTime)
    })
  })
  describe('Enpass installs when enabled', function () {
    Brave.beforeAll(this)
    before(function * () {
      yield setup(this.app.client)
    })
    it('installs', function * () {
      yield this.app.client
        .windowByUrl(Brave.browserWindowUrl)
        .changeSetting(settingsConst.ACTIVE_PASSWORD_MANAGER, passwordManagers.ENPASS)
        .waitForVisible(`.extensionBrowserAction[data-button-value="${extensionIds[passwordManagers.ENPASS]}"]`)
        .tabByIndex(0)
        .waitForVisible(`[data-extension-id="${extensionIds[passwordManagers.ENPASS]}"]`, extensionDownloadWaitTime)
    })
  })
})
