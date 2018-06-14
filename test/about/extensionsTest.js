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
  describe('Honey', function () {
    Brave.beforeAll(this)
    before(function * () {
      yield setup(this.app.client)
    })
    it('installs when preference is enabled', function * () {
      yield this.app.client
        .windowByUrl(Brave.browserWindowUrl)
        .changeSetting(settingsConst.HONEY_ENABLED, true)
        .tabByIndex(0)
        .waitForVisible('[data-extension-id="bmnlcjabgnpnenekpadlanbbkooimhnj"]', extensionDownloadWaitTime)
    })
  })

  // Remove skip when https://github.com/brave/browser-laptop/issues/9531 is resolved
  // See: https://github.com/brave/browser-laptop/issues/11234
  describe.skip('Vimium', function () {
    Brave.beforeAll(this)
    before(function * () {
      yield setup(this.app.client)
    })
    it('installs when preference is enabled', function * () {
      yield this.app.client
        .windowByUrl(Brave.browserWindowUrl)
        .changeSetting(settingsConst.VIMIUM_ENABLED, true)
        .tabByIndex(0)
        .waitForVisible('[data-extension-id="dbepggeogbaibhgnhhndojpepiihcmeb"]', extensionDownloadWaitTime)
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
        .waitForVisible(`[data-test-id="extensionBrowserAction ${extensionIds[passwordManagers.ONE_PASSWORD]}"]`)
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
        .waitForVisible(`[data-test-id="extensionBrowserAction ${extensionIds[passwordManagers.DASHLANE]}"]`)
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
        .waitForVisible(`[data-test-id="extensionBrowserAction ${extensionIds[passwordManagers.LAST_PASS]}"]`)
        .tabByIndex(0)
        .waitForVisible(`[data-extension-id="${extensionIds[passwordManagers.LAST_PASS]}"]`, extensionDownloadWaitTime)
    })
  })

  // Remove skip when https://github.com/brave/browser-laptop/issues/7778 is resolved
  // See: https://github.com/brave/browser-laptop/issues/11234
  describe.skip('Enpass installs when enabled', function () {
    Brave.beforeAll(this)
    before(function * () {
      yield setup(this.app.client)
    })
    it('installs', function * () {
      yield this.app.client
        .windowByUrl(Brave.browserWindowUrl)
        .changeSetting(settingsConst.ACTIVE_PASSWORD_MANAGER, passwordManagers.ENPASS)
        .waitForVisible(`[data-test-id="extensionBrowserAction ${extensionIds[passwordManagers.ENPASS]}"]`)
        .tabByIndex(0)
        .waitForVisible(`[data-extension-id="${extensionIds[passwordManagers.ENPASS]}"]`, extensionDownloadWaitTime)
    })
  })
  describe('bitwarden installs when enabled', function () {
    Brave.beforeAll(this)
    before(function * () {
      yield setup(this.app.client)
    })
    it('installs', function * () {
      yield this.app.client
        .windowByUrl(Brave.browserWindowUrl)
        .changeSetting(settingsConst.ACTIVE_PASSWORD_MANAGER, passwordManagers.BITWARDEN)
        .waitForVisible(`[data-test-id="extensionBrowserAction ${extensionIds[passwordManagers.BITWARDEN]}"]`)
        .tabByIndex(0)
        .waitForVisible(`[data-extension-id="${extensionIds[passwordManagers.BITWARDEN]}"]`, extensionDownloadWaitTime)
    })
  })
})
