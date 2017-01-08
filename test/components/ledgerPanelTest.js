/* global describe, it, beforeEach, before */

const Brave = require('../lib/brave')
const {urlInput, advancedSettings, addFundsButton, paymentsStatus, paymentsWelcomePage, paymentsTab, walletSwitch, ledgerTable} = require('../lib/selectors')
const assert = require('assert')

const prefsUrl = 'about:preferences'
const ledgerAPIWaitTimeout = 10000

function * setup (client) {
  yield client
    .waitForUrl(Brave.newTabUrl)
    .waitForBrowserWindow()
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
      assert.equal(background.value, 'rgba(204,204,204,1)')
    })

    it('payments can be enabled', function * () {
      yield this.app.client
        .tabByIndex(0)
        .loadUrl(prefsUrl)
        .waitForVisible(paymentsTab)
        .click(paymentsTab)
        .waitForVisible(paymentsWelcomePage)
        .waitForVisible(walletSwitch)
        .click(walletSwitch)
        .windowByUrl(Brave.browserWindowUrl)
        .waitUntil(function () {
          return this.getAppState().then((val) => {
            return val.value.settings['payments.enabled'] === true &&
              val.value.settings['payments.notifications'] === true
          })
        }, ledgerAPIWaitTimeout)
    })

    it('payments can be disabled', function * () {
      yield this.app.client
        .tabByIndex(0)
        .loadUrl(prefsUrl)
        .waitForVisible(paymentsTab)
        .click(paymentsTab)
        .waitForVisible(paymentsWelcomePage)
        .waitForVisible(walletSwitch)
        .click(walletSwitch)
        .windowByUrl(Brave.browserWindowUrl)
        .waitUntil(function () {
          return this.getAppState().then((val) => {
            return val.value.settings['payments.enabled'] === true &&
              val.value.settings['payments.notifications'] === true
          })
        }, ledgerAPIWaitTimeout)
        .tabByIndex(0)
        .waitForVisible(walletSwitch)
        .click(walletSwitch)
        .windowByUrl(Brave.browserWindowUrl)
        .waitUntil(function () {
          return this.getAppState().then((val) => {
            return val.value.settings['payments.enabled'] === false &&
              val.value.settings['payments.notifications'] === false
          })
        }, ledgerAPIWaitTimeout)
    })

    it('advanced settings is hidden by default', function * () {
      yield this.app.client
        .tabByIndex(0)
        .loadUrl(prefsUrl)
        .waitForVisible(paymentsTab)
        .click(paymentsTab)
        .waitForVisible(paymentsWelcomePage)
        .waitForVisible(walletSwitch)
        .waitForVisible(advancedSettings, 100, true)
    })

    it('advanced settings is visible when payments are enabled', function * () {
      yield this.app.client
        .tabByIndex(0)
        .loadUrl(prefsUrl)
        .waitForVisible(paymentsTab)
        .click(paymentsTab)
        .waitForVisible(paymentsWelcomePage)
        .waitForVisible(walletSwitch)
        .click(walletSwitch)
        .waitForVisible(advancedSettings, ledgerAPIWaitTimeout)
    })

    it('can create wallet', function * () {
      yield this.app.client
        .tabByIndex(0)
        .loadUrl(prefsUrl)
        .waitForVisible(paymentsTab)
        .click(paymentsTab)
        .waitForVisible(paymentsWelcomePage)
        .waitForVisible(walletSwitch)
        .click(walletSwitch)
        .waitUntil(function () {
          return this.getText(paymentsStatus).then((val) => val.includes('Creating'))
        })
        .waitUntil(function () {
          // Note: wallet creation may take a long time, so this test is likely
          // to time out.
          return this.getText(addFundsButton).then((val) => val.includes('Add funds'))
        }, ledgerAPIWaitTimeout)
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
      .waitForVisible(walletSwitch)
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
      .waitForElementCount(ledgerTable + ' tr', 2)
  })

  it('can sort synopsis table', function * () {
    var site1 = 'http://web.mit.edu/zyan/Public/wait.html'
    var site2 = 'http://example.com/'
    var site3 = 'https://www.eff.org/'
    yield this.app.client
      .url(site1)
      .windowByUrl(Brave.browserWindowUrl)
      .waitForSiteEntry(site1)
      .tabByUrl(site1)
      .url(site2)
      .windowByUrl(Brave.browserWindowUrl)
      .waitForSiteEntry(site2)
      .tabByUrl(site2)
      .url(site3)
      .windowByUrl(Brave.browserWindowUrl)
      .waitForSiteEntry(site3)
      .tabByUrl(site3)
      .loadUrl(prefsUrl)
      .waitForVisible(paymentsTab)
      .click(paymentsTab)
      .waitForVisible('[data-l10n-id="publisher"]')
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
      .waitForVisible('[data-l10n-id="publisher"]')
      .click('[data-l10n-id="publisher"]')
      .waitForVisible(ledgerTable + ' .switchBackground')
      .click(ledgerTable + ' .switchBackground')
      .windowByUrl(Brave.browserWindowUrl)
      .waitUntil(function () {
        return this.getAppState().then((val) => {
          return val.value.siteSettings['https?://eff.org'].ledgerPayments === false
        })
      })
  })
})
