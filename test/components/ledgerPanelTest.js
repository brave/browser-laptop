/* global describe, it, beforeEach */

const Brave = require('../lib/brave')
const {urlInput, addFundsButton, paymentsStatus, paymentsWelcomePage, paymentsTab, walletSwitch} = require('../lib/selectors')
const assert = require('assert')

const prefsUrl = 'about:preferences'

describe('Payments Panel', function () {
  function * setup (client) {
    yield client
      .waitUntilWindowLoaded()
      .waitForUrl(Brave.newTabUrl)
      .waitForBrowserWindow()
      .waitForVisible('#window')
      .waitForVisible(urlInput)
  }

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
          return this.getText(paymentsStatus).then((val) => val.includes('get started'))
        })
        .click(addFundsButton)
        .waitUntil(function () {
          return this.getText(paymentsStatus).then((val) => val.includes('Creating'))
        })
    })
  })
})
