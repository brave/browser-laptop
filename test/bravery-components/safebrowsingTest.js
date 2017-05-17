/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */
/* global describe, it, before */

const Brave = require('../lib/brave')
const {urlInput} = require('../lib/selectors')

describe('safebrowsing interception', function () {
  function * setup (client) {
    yield client
      .waitForBrowserWindow()
      .waitForVisible(urlInput)
  }

  Brave.beforeAll(this)
  before(function * () {
    this.badUrl = 'http://downloadme.org'
    this.safebrowsingUrl = `about:safebrowsing#${this.badUrl}`
    yield setup(this.app.client)
  })

  it('redirects to safebrowsing URL', function * () {
    yield this.app.client
      .tabByIndex(0)
      .url(this.badUrl)
      .waitUntil(function () {
        return this.getText('body').then((val) => {
          return val.includes('For your safety, Brave has blocked this site')
        })
      })
      .windowByUrl(Brave.browserWindowUrl)
      .getAttribute(urlInput, 'value').then((value) => {
        return value === this.safebrowsingUrl
      })
  })
})
