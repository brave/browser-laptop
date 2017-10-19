/* global describe, it, before */

const Brave = require('../lib/brave')
const assert = require('assert')
const {urlInput} = require('../lib/selectors')
const {getTargetAboutUrl} = require('../../js/lib/appUrlUtil')
const aboutHistoryUrl = getTargetAboutUrl('about:cookies')

describe('about:cookies', function () {
  function * setup (client) {
    yield client
      .waitForUrl(Brave.newTabUrl)
      .waitForBrowserWindow()
      .waitForVisible(urlInput)
      .windowByUrl(Brave.browserWindowUrl)
  }

  function * addDemoSites (client) {
    const site1 = 'https://brave.com/'
    const site2 = Brave.server.url('cookies.html')
    yield client
      .tabByIndex(0)
      .loadUrl(site1)
      .windowByUrl(Brave.browserWindowUrl)
      .waitForHistoryEntry(site1)
      .tabByUrl(site1)
      .loadUrl(site2)
      .windowByUrl(Brave.browserWindowUrl)
      .waitForHistoryEntry(site2)
      .tabByUrl(site2)
      .loadUrl(aboutHistoryUrl)
  }

  describe('page content', function () {
    Brave.beforeAll(this)

    before(function * () {
      yield setup(this.app.client)
      yield addDemoSites(this.app.client)
    })

    it('displays four cookie entries', function * () {
      yield this.app.client
        .waitForElementCount('tr', 5) // the table header adds one row
    })

    it('displays correct cookie value', function * () {
      yield this.app.client
        .click('th') // reverse-sort by domain
        .waitUntil(function () {
          return this.getText('[data-td-index="1"]').then((text) => text[0] === 'abc')
        })
        .waitUntil(function () {
          return this.getText('[data-td-index="2"]').then((text) => text[0] === '123')
        })
    })

    it('can delete single cookie', function * () {
      yield this.app.client
        .click('[data-td-index="1"]')
        .keys(Brave.keys.BACKSPACE)
        .waitForElementCount('tr', 4)
    })

    it('can delete multiple cookies', function * () {
      yield this.app.client
        .click('tr:nth-child(2)')
        .keys(Brave.keys.SHIFT)
        .click('tr:nth-child(3)')
        .keys(Brave.keys.SHIFT)
        .keys(Brave.keys.BACKSPACE)
        .waitForElementCount('tr', 2)
    })

    it('can clear cookies', function * () {
      yield this.app.client
        .click('[data-l10n-id="clearCookies"]')
        .waitForElementCount('tr', 0)
        .isExisting('[data-l10n-id="noCookiesSaved"]', (isExisting) => assert(isExisting))
    })
  })
})
