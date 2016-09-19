/* global describe, it, before */

const Brave = require('../lib/brave')
const {urlInput} = require('../lib/selectors')
const {getTargetAboutUrl} = require('../../js/lib/appUrlUtil')
const settingsConst = require('../../js/constants/settings')
const {passwordManagers, extensionIds} = require('../../js/constants/passwordManagers')
const aboutExtensionsUrl = getTargetAboutUrl('about:extensions')

describe('about:extensions', function () {
  function * setup (client) {
    yield client
      .waitUntilWindowLoaded()
      .waitForUrl(Brave.newTabUrl)
      .waitForBrowserWindow()
      .waitForVisible('#window')
      .waitForVisible(urlInput)
      .windowByUrl(Brave.browserWindowUrl)
      .waitForExist('.tab[data-frame-key="1"]')
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
        .waitForVisible('[data-extension-id="oemmndcbldboiebfnladdacbdfmadadm"]')
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
        .waitForVisible(`[data-extension-id="${extensionIds[passwordManagers.ONE_PASSWORD]}"]`)
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
        .waitForVisible(`[data-extension-id="${extensionIds[passwordManagers.DASHLANE]}"]`)
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
        .waitForVisible(`[data-extension-id="${extensionIds[passwordManagers.LAST_PASS]}"]`)
    })
  })
})
