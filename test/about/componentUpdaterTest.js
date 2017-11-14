/* global describe, it, before */

const Brave = require('../lib/brave')
const {urlInput, notificationItem} = require('../lib/selectors')
const appConfig = require('../../js/constants/appConfig')

describe('component updater', function () {
  function * setup (client) {
    yield client
      .waitForUrl(Brave.newTabUrl)
      .waitForBrowserWindow()
      .waitForVisible(urlInput)
      .windowByUrl(Brave.browserWindowUrl)
      .waitForExist('[data-test-id="tab"][data-frame-key="1"]')
  }

  describe('Google Widevine is disabled by default', function () {
    Brave.beforeAll(this)
    before(function * () {
      yield setup(this.app.client)
    })
    it('Not installed and not enabled by default', function * () {
      const url = Brave.server.url('drm.html')
      yield this.app.client
        .tabByIndex(0)
        .url(url)
        .waitForUrl(url)
        .waitUntil(function () {
          return this.getText('#output')
            .then((text) => {
              return text.includes('Widevine CDM plugin not loaded.')
            })
        })
    })
    it('Google Widevine can be enabled and installed', function * () {
      const isLinux = process.platform === 'linux'
      if (isLinux) {
        this.skip()
        return
      }
      const installButton = '[data-l10n-id="installAndAllow"]'
      const url = Brave.server.url('drm.html')
      yield this.app.client
        .windowByUrl(Brave.browserWindowUrl)
        .tabByIndex(0)
        .url(url)
        .waitForUrl(url)
        .windowByUrl(Brave.browserWindowUrl)
        .waitForVisible(installButton)
        .click(installButton)
        .waitForResourceReady(appConfig.resourceNames.WIDEVINE)
        // TODO(bbondy): flashBlock.js should be less aggressive so we can detect this with the drm.html #output div.
    })
  })
  describe('Google Widevine is enabled but disallowed by default', function () {
    Brave.beforeAll(this)
    before(function * () {
      yield setup(this.app.client)
    })
    it('can be allowed', function * () {
      const isLinux = process.platform === 'linux'
      if (isLinux) {
        this.skip()
        return
      }
      const allowButton = 'button=Allow'
      const url = Brave.server.url('drm.html')
      yield this.app.client
        .windowByUrl(Brave.browserWindowUrl)
        .setResourceEnabled(appConfig.resourceNames.WIDEVINE, true)
        .waitForResourceReady(appConfig.resourceNames.WIDEVINE)
        .tabByIndex(0)
        .url(url)
        .waitForUrl(url)
        .windowByUrl(Brave.browserWindowUrl)
        .waitForElementCount(notificationItem, 1)
        .waitForElementCount(allowButton, 1)
        .click(allowButton)
        .waitForElementCount(notificationItem, 0)
        // TODO(bbondy): flashBlock.js should be less aggressive so we can detect this with the drm.html #output div.
    })
  })
})
