/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */
/* global describe, it, before */

const Brave = require('../lib/brave')
const {urlInput} = require('../lib/selectors')

const expectedText = 'For your safety, Brave has blocked this site'
const link = '#clickme'

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
    this.url = Brave.server.url('safebrowsing.html')
    this.expectedText = 'For your safety, Brave has blocked this site'
    yield setup(this.app.client)
  })

  it('redirects to safebrowsing URL', function * () {
    yield this.app.client
      .tabByIndex(0)
      .url(this.badUrl)
      .waitUntil(function () {
        return this.getText('body').then((val) => {
          return val.includes(expectedText)
        })
      })
      .windowByUrl(Brave.browserWindowUrl)
      .getAttribute(urlInput, 'value').then((value) => {
        return value === this.safebrowsingUrl
      })
  })

  it('can redirect to safebrowsing by clicking on a link', function * () {
    yield this.app.client
      .tabByIndex(0)
      .loadUrl(this.url)
      .waitForVisible(link)
      .click(link)
      .waitUntil(function () {
        return this.getText('body').then((val) => {
          return val.includes(expectedText)
        })
      })
  })

  it('can redirect to safebrowsing by opening in a new tab', function * () {
    yield this.app.client
      .tabByIndex(0)
      .loadUrl(this.url)
      .isDarwin().then((val) => {
        return val ? this.app.client.keys(Brave.keys.COMMAND) : this.app.client.keys(Brave.keys.CONTROL)
      })
      .waitForVisible(link)
      .click(link)
      .windowByUrl(Brave.browserWindowUrl)
      .tabByIndex(1)
      .waitUntil(function () {
        return this.getText('body').then((val) => {
          return val.includes(expectedText)
        })
      })
  })
})
