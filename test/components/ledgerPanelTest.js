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
  function * newFrame (client, frameKey = 2) {
    yield client
      .ipcSend('shortcut-new-frame')
      // wait for correct urlInput based on frameKey
      .waitUntil(function () {
        return this.getTabCount().then((count) => {
          return count === frameKey
        })
      })
      .windowByUrl(Brave.browserWindowUrl)
      .waitForVisible('div[id="navigator"][data-frame-key="' + frameKey + '"] ' + urlInput)
      .waitForElementFocus(urlInput)
  }

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
      .waitUntil(function () {
        return this.getText(addFundsButton).then((val) => val.includes('Add funds'))
      })
  })

  it('no table if empty synopsis', function * () {
    yield this.app.client
      .isExisting(ledgerTable).then((isExisting) => isExisting === false)
  })

  it.skip('creates synopsis table after visiting a site', function * () {
    // TODO (mrose17): re-enable this test once ledger properly ignores the 8
    // second pageview limit during tests
    yield this.app.client
      .url('http://web.mit.edu/zyan/Public/wait.html')
      .waitUntil(function () {
        return this.getText('div').then((val) => val === 'done')
      })
      .windowByUrl(Brave.browserWindowUrl)
    yield newFrame(this.app.client)
    yield this.app.client
      .tabByUrl(Brave.newTabUrl)
      .loadUrl(prefsUrl)
      .waitForVisible(paymentsTab)
      .click(paymentsTab)
      .waitForExist(ledgerTable)
      .then((isExisting) => isExisting === true)
  })
})
