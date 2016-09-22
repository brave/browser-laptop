/* global describe, it, beforeEach, before */

const Brave = require('../lib/brave')
const {urlInput, addFundsButton, paymentsStatus, paymentsWelcomePage, paymentsTab, walletSwitch, ledgerTable} = require('../lib/selectors')
const assert = require('assert')

const prefsUrl = 'about:preferences'

function * setup (client) {
  yield client
    .waitUntilWindowLoaded()
    .waitForUrl(Brave.newTabUrl)
    .waitForBrowserWindow()
    .waitForVisible('#window')
    .waitForVisible(urlInput)
}

describe('Payments Panel', function () {
  describe('can setup payments', function () {
    Brave.beforeEach(this)
    beforeEach(function * () {
      yield setup(this.app.client)
    })

    it('shows welcome page', function * () {
      yield this.app.client
        .tabByIndex(0)
        .loadUrl(prefsUrl)
        .waitForVisible(paymentsTab)
        .click(paymentsTab)
        .waitForVisible(paymentsWelcomePage)
      let background = yield this.app.client.getCssProperty(walletSwitch, 'background-color')
      assert.equal(background.value, 'rgba(211,211,211,1)')
    })

    it('payments can be enabled', function * () {
      yield this.app.client
        .tabByIndex(0)
        .loadUrl(prefsUrl)
        .waitForVisible(paymentsTab)
        .click(paymentsTab)
        .waitForVisible(paymentsWelcomePage)
        .click(walletSwitch)
        .windowByUrl(Brave.browserWindowUrl)
        .waitUntil(function () {
          return this.getAppState().then((val) => {
            return val.value.settings['payments.enabled'] === true &&
              val.value.settings['payments.notifications'] === true
          })
        })
    })

    it('payments can be disabled', function * () {
      yield this.app.client
        .tabByIndex(0)
        .loadUrl(prefsUrl)
        .waitForVisible(paymentsTab)
        .click(paymentsTab)
        .waitForVisible(paymentsWelcomePage)
        .click(walletSwitch)
        .windowByUrl(Brave.browserWindowUrl)
        .waitUntil(function () {
          return this.getAppState().then((val) => {
            return val.value.settings['payments.enabled'] === true &&
              val.value.settings['payments.notifications'] === true
          })
        })
        .tabByUrl(prefsUrl)
        .click(walletSwitch)
        .windowByUrl(Brave.browserWindowUrl)
        .waitUntil(function () {
          return this.getAppState().then((val) => {
            return val.value.settings['payments.enabled'] === false &&
              val.value.settings['payments.notifications'] === false
          })
        })
    })

    it('can create wallet', function * () {
      yield this.app.client
        .tabByIndex(0)
        .loadUrl(prefsUrl)
        .waitForVisible(paymentsTab)
        .click(paymentsTab)
        .waitForVisible(paymentsWelcomePage)
        .click(walletSwitch)
        .waitUntil(function () {
          return this.getText(paymentsStatus).then((val) => val.includes('Creating'))
        })
        .waitUntil(function () {
          // Note: wallet creation may take a long time, so this test is likely
          // to time out.
          return this.getText(addFundsButton).then((val) => val.includes('Add funds'))
        })
    })
  })
})

describe('synopsis', function () {
  Brave.beforeAll(this)

  before(function * () {
    yield setup(this.app.client)
    yield this.app.client
      .tabByIndex(0)
      .loadUrl(prefsUrl)
      .waitForVisible(paymentsTab)
      .click(paymentsTab)
      .waitForVisible(paymentsWelcomePage)
      .click(walletSwitch)
      .waitUntil(function () {
        return this.getText(paymentsStatus).then((val) => val.includes('Creating'))
      })
  })

  it('no table if empty synopsis', function * () {
    yield this.app.client
      .isExisting(ledgerTable).then((isExisting) => isExisting === false)
  })

  it('creates synopsis table after visiting a site', function * () {
    var site1 = 'http://web.mit.edu/zyan/Public/wait.html'
    yield this.app.client
      .url(site1)
      .waitUntil(function () {
        return this.getText('div').then((val) => val === 'done')
      })
      .windowByUrl(Brave.browserWindowUrl)
      .tabByUrl(site1)
      .loadUrl(prefsUrl)
      .waitForVisible(paymentsTab)
      .click(paymentsTab)
      .waitUntil(function () {
        return this.elements(ledgerTable + ' tr').then((response) => {
          return response.value.length === 2
        })
      })
  })

  it('can sort synopsis table', function * () {
    var site1 = 'http://web.mit.edu/zyan/Public/wait.html'
    var site2 = 'http://example.com'
    var site3 = 'https://eff.org'
    yield this.app.client
      .url(site1)
      .windowByUrl(Brave.browserWindowUrl)
      .tabByUrl(site1)
      .url(site2)
      .windowByUrl(Brave.browserWindowUrl)
      .tabByUrl(site2)
      .url(site3)
      .windowByUrl(Brave.browserWindowUrl)
      .tabByUrl(site3)
      .loadUrl(prefsUrl)
      .waitForVisible(paymentsTab)
      .click(paymentsTab)
      .click('[data-l10n-id="publisher"]')
      .waitUntil(function () {
        return this.getText(ledgerTable + ' a').then((text) => {
          return text[0] === 'eff.org' && text[2] === 'mit.edu'
        })
      })
      .click('[data-l10n-id="publisher"]')
      .waitUntil(function () {
        return this.getText(ledgerTable + ' a').then((text) => {
          return text[2] === 'eff.org' && text[0] === 'mit.edu'
        })
      })
  })

  it('can disable site', function * () {
    var site1 = 'https://eff.org'
    yield this.app.client
      .url(site1)
      .windowByUrl(Brave.browserWindowUrl)
      .tabByUrl(site1)
      .loadUrl(prefsUrl)
      .waitForVisible(paymentsTab)
      .click(paymentsTab)
      .click('[data-l10n-id="publisher"]')
      .click(ledgerTable + ' .switchBackground')
      .windowByUrl(Brave.browserWindowUrl)
      .waitUntil(function () {
        return this.getAppState().then((val) => {
          return val.value.siteSettings['https?://eff.org'].ledgerPayments === false
        })
      })
  })
})
