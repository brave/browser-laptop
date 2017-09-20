/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

/* global describe, it, beforeEach */

const Brave = require('../lib/brave')
const {urlInput, urlbarIcon, siteInfoDialog, viewCertificateButton} = require('../lib/selectors')

describe('siteInfo component tests', function () {
  function * setup (client) {
    yield client
      .waitForUrl(Brave.newTabUrl)
      .waitForBrowserWindow()
      .waitForVisible(urlInput)
  }

  describe('view certificate button', function () {
    const page1 = 'https://brave.github.io/brave-tests/'
    const isLinux = process.platform === 'linux'

    Brave.beforeEach(this)
    beforeEach(function * () {
      yield setup(this.app.client)
    })

    it('hide it if on linux', function * () {
      if (!isLinux) {
        this.skip()
        return
      }

      yield this.app.client
        .tabByIndex(0)
        .loadUrl(page1)
        .windowByUrl(Brave.browserWindowUrl)
        .click(urlbarIcon)
        .waitForElementCount(siteInfoDialog, 1)
        .waitForElementCount(viewCertificateButton, 0)
    })

    it('show it if on other then linux', function * () {
      if (isLinux) {
        this.skip()
        return
      }
      yield this.app.client
        .tabByIndex(0)
        .loadUrl(page1)
        .windowByUrl(Brave.browserWindowUrl)
        .click(urlbarIcon)
        .waitForElementCount(siteInfoDialog, 1)
        .waitForElementCount(viewCertificateButton, 1)
    })
  })

  describe('siteInfo warning on phishing URLs', function () {
    Brave.beforeEach(this)
    beforeEach(function * () {
      yield setup(this.app.client)
    })

    it('siteInfo popup closes when navigating from data: to https:', function * () {
      const page1 = 'data:text/html,<meta http-equiv="refresh" content="1; url=https://example.com/">'
      yield this.app.client
        .tabByIndex(0)
        .loadUrl(page1)
        .windowByUrl(Brave.browserWindowUrl)
        .waitForElementCount(siteInfoDialog, 1)
        .waitForElementCount(siteInfoDialog, 0)
    })

    it('shows siteInfo once when switching to a new tab', function * () {
      const page1 = 'data:,Hello%2C%20World!'
      yield this.app.client
        .tabByIndex(0)
        .url('https://example.com')
        .windowByUrl(Brave.browserWindowUrl)
        .newTab({
          active: false,
          url: page1
        })
        .windowByUrl(Brave.browserWindowUrl)
        .waitForElementCount(siteInfoDialog, 0)
        .activateTabByIndex(1)
        .waitForElementCount(siteInfoDialog, 1)
        .activateTabByIndex(0)
        .waitForElementCount(siteInfoDialog, 0)
        .activateTabByIndex(1)
        .waitForExist('[data-test-active-tab][data-frame-key="2"]')
        .waitForElementCount(siteInfoDialog, 0)
    })
  })
})
