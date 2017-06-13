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
})
