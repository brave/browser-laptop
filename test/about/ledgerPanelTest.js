/* global describe, it, beforeEach, before, afterEach */

const Brave = require('../lib/brave')
const {
  urlInput,
  advancedSettingsButton,
  addFundsButton,
  paymentsWelcomePage,
  paymentsTab,
  walletSwitch,
  siteSettingItem,
  ledgerTable,
  nextButton,
  previousButton,
  securityTab,
  addFundsDialog,
  addFundsWizard,
  addFundsWelcome,
  modalOverlay,
  modalOverlayCloseButton
} = require('../lib/selectors')
const assert = require('assert')
const settings = require('../../js/constants/settings')

const prefsUrl = 'about:preferences'
const ledgerAPIWaitTimeout = 20000
const site1 = 'http://example.com/'
const site2 = 'https://www.eff.org/'
const site3 = 'http://web.mit.edu/zyan/Public/wait.html'
const BatTOSUrl = 'https://basicattentiontoken.org/contributor-terms-of-service/'

function * setupBrave () {
  Brave.addCommands()
}

function * setup (client) {
  yield client
    .waitForUrl(Brave.newTabUrl)
    .waitForBrowserWindow()
    .waitForVisible(urlInput)
}

describe('Regular payment panel tests', function () {
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
        .waitForVisible(walletSwitch)
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
        .waitForElementCount(advancedSettingsButton, 0)
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
        .waitForVisible(advancedSettingsButton, ledgerAPIWaitTimeout)
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
        .waitForEnabled(addFundsButton)
    })

    it('clicks BAT TOS link when payments are enabled', function * () {
      yield this.app.client
        .tabByIndex(0)
        .loadUrl(prefsUrl)
        .waitForVisible(paymentsTab)
        .click(paymentsTab)
        .waitForVisible(paymentsWelcomePage)
        .waitForVisible(walletSwitch)
        .click(walletSwitch)
        .waitForEnabled(addFundsButton, ledgerAPIWaitTimeout)
        .waitForVisible('[data-test-id="termsOfService"]')
        .click('[data-test-id="termsOfService"]')
        .tabByUrl(BatTOSUrl)
        .waitForUrl(BatTOSUrl)
        .windowByUrl(Brave.browserWindowUrl)
        .waitForHistoryEntry(BatTOSUrl)
    })

    it('clicks BAT TOS link when payments are disabled', function * () {
      yield this.app.client
        .tabByIndex(0)
        .loadUrl(prefsUrl)
        .waitForVisible(paymentsTab)
        .click(paymentsTab)
        .waitForVisible(paymentsWelcomePage)
        .waitForVisible('[data-test-id="termsOfService"]')
        .click('[data-test-id="termsOfService"]')
        .tabByUrl(BatTOSUrl)
        .waitForUrl(BatTOSUrl)
        .windowByUrl(Brave.browserWindowUrl)
        .waitForHistoryEntry(BatTOSUrl)
    })
  })

  describe('ledger history', function () {
    Brave.beforeAllServerSetup(this)

    beforeEach(function * () {
      yield Brave.startApp()
      yield setupBrave(Brave.app.client)
    })

    it('is NOT cleared if payment is disabled before the close and clear history is false', function * () {
      yield setup(Brave.app.client)
      yield Brave.app.client
        .tabByIndex(0)
        .loadUrl(prefsUrl)
        .waitForVisible(paymentsTab)
        .click(paymentsTab)
        .waitForVisible(paymentsWelcomePage)
        .waitForVisible(walletSwitch)
        .click(walletSwitch)
        .waitForEnabled(addFundsButton, ledgerAPIWaitTimeout)
        .tabByIndex(0)
        .loadUrl(site1)
        .windowByUrl(Brave.browserWindowUrl)
        .waitForHistoryEntry(site1)
        .tabByUrl(site1)
        .loadUrl(site2)
        .windowByUrl(Brave.browserWindowUrl)
        .waitForHistoryEntry(site2)
        .tabByUrl(site2)
        .loadUrl(prefsUrl)
        .waitForVisible(paymentsTab)
        .click(paymentsTab)
        .waitForElementCount('[data-tbody-index="1"] tr', 2)
        .click(walletSwitch)
        .waitForElementCount(addFundsButton, 0)
      // See: #10490
      yield Brave.stopApp(false, 10000)

      yield Brave.startApp()
      yield setupBrave(Brave.app.client)
      yield Brave.app.client
        .waitForBrowserWindow()
        .waitForVisible(urlInput)
        .tabByIndex(0)
        .waitForVisible(paymentsWelcomePage)
        .waitForVisible(walletSwitch)
        .click(walletSwitch)
        .waitForEnabled(addFundsButton, ledgerAPIWaitTimeout)
        .waitForElementCount('[data-tbody-index="1"] tr', 2)

      yield Brave.stopApp()
    })

    it('is NOT cleared if payment is enabled before the close and clear history is true', function * () {
      yield setup(Brave.app.client)
      yield Brave.app.client
        .tabByIndex(0)
        .loadUrl(prefsUrl)
        .waitForVisible(paymentsTab)
        .click(paymentsTab)
        .waitForVisible(paymentsWelcomePage)
        .waitForVisible(walletSwitch)
        .click(walletSwitch)
        .waitForEnabled(addFundsButton, ledgerAPIWaitTimeout)
        .tabByIndex(0)
        .loadUrl(site1)
        .windowByUrl(Brave.browserWindowUrl)
        .waitForHistoryEntry(site1)
        .tabByUrl(site1)
        .loadUrl(site2)
        .windowByUrl(Brave.browserWindowUrl)
        .waitForHistoryEntry(site2)
        .tabByUrl(site2)
        .loadUrl(prefsUrl)
        .waitForVisible(paymentsTab)
        .click(paymentsTab)
        .waitForElementCount('[data-tbody-index="1"] tr', 2)
        .click(securityTab)
        .waitForVisible('[data-test-id="clearBrowsingHistory"]')
        .click('[data-test-id="clearBrowsingHistory"] [data-test-id="switchBackground"]')
      yield Brave.stopApp(false, 10000)

      yield Brave.startApp()
      yield setupBrave(Brave.app.client)
      yield Brave.app.client
        .waitForBrowserWindow()
        .waitForVisible(urlInput)
        .tabByIndex(0)
        .waitForVisible('[data-test-id="clearBrowsingHistory"]')
        .click(paymentsTab)
        .waitForEnabled(addFundsButton)
        .waitForElementCount('[data-tbody-index="1"] tr', 2)

      yield Brave.stopApp()
    })

    it('is CLEARED if payment is disabled before the close and clear history is true', function * () {
      yield setup(Brave.app.client)
      yield Brave.app.client
        .tabByIndex(0)
        .loadUrl(prefsUrl)
        .waitForVisible(paymentsTab)
        .click(paymentsTab)
        .waitForVisible(paymentsWelcomePage)
        .waitForVisible(walletSwitch)
        .click(walletSwitch, ledgerAPIWaitTimeout)
        .waitForEnabled(addFundsButton)
        .tabByIndex(0)
        .loadUrl(site1)
        .windowByUrl(Brave.browserWindowUrl)
        .waitForHistoryEntry(site1)
        .tabByUrl(site1)
        .loadUrl(site2)
        .windowByUrl(Brave.browserWindowUrl)
        .waitForHistoryEntry(site2)
        .tabByUrl(site2)
        .loadUrl(prefsUrl)
        .waitForVisible(paymentsTab)
        .click(paymentsTab)
        .waitForElementCount('[data-tbody-index="1"] tr', 2)
        .click(walletSwitch)
        .waitForElementCount(addFundsButton, 0)
        .click(securityTab)
        .waitForVisible('[data-test-id="clearBrowsingHistory"]')
        .click('[data-test-id="clearBrowsingHistory"] [data-test-id="switchBackground"]')
      yield Brave.stopApp(false, 10000)

      yield Brave.startApp()
      yield setupBrave(Brave.app.client)
      yield Brave.app.client
        .waitForBrowserWindow()
        .waitForVisible(urlInput)
        .tabByIndex(0)
        .waitForVisible('[data-test-id="clearBrowsingHistory"]')
        .click(paymentsTab)
        .waitForVisible(paymentsWelcomePage)
        .waitForVisible(walletSwitch)
        .click(walletSwitch, ledgerAPIWaitTimeout)
        .waitForEnabled(addFundsButton)
        .waitForElementCount('[data-tbody-index="1"] tr', 0)

      yield Brave.stopApp()
    })
  })

  describe('auto include', function () {
    Brave.beforeEach(this)

    beforeEach(function * () {
      yield setup(this.app.client)
      yield this.app.client
        .changeSetting(settings.PAYMENTS_SITES_AUTO_SUGGEST, true)
        .tabByIndex(0)
        .loadUrl(prefsUrl)
        .waitForVisible(paymentsTab)
        .click(paymentsTab)
        .waitForVisible(paymentsWelcomePage)
        .waitForVisible(walletSwitch)
        .click(walletSwitch)
        .waitForEnabled(addFundsButton, ledgerAPIWaitTimeout)
    })

    it('site is added automatically', function * () {
      yield this.app.client
        .loadUrl(site1)
        .windowByUrl(Brave.browserWindowUrl)
        .waitForHistoryEntry(site1)
        .tabByUrl(site1)
        .loadUrl(site2)
        .windowByUrl(Brave.browserWindowUrl)
        .waitForHistoryEntry(site2)
        .tabByUrl(site2)
        .loadUrl(prefsUrl)
        .waitForVisible(paymentsTab)
        .click(paymentsTab)
        .waitForVisible('[data-l10n-id="publisher"]')
        .windowByUrl(Brave.browserWindowUrl)
        .waitUntil(function () {
          return this.getAppState().then((val) => {
            return val.value.ledger.synopsis.publishers['example.com'].options.exclude === false
          })
        })
        .waitUntil(function () {
          return this.getAppState().then((val) => {
            return val.value.ledger.synopsis.publishers['eff.org'].options.exclude === false
          })
        })
    })

    it('site is not added automatically', function * () {
      yield this.app.client
        .windowByUrl(Brave.browserWindowUrl)
        .changeSetting(settings.PAYMENTS_SITES_AUTO_SUGGEST, false)
        .tabByIndex(0)
        .loadUrl(site1)
        .windowByUrl(Brave.browserWindowUrl)
        .waitForHistoryEntry(site1)
        .tabByUrl(site1)
        .loadUrl(site2)
        .windowByUrl(Brave.browserWindowUrl)
        .waitForHistoryEntry(site2)
        .tabByUrl(site2)
        .loadUrl(prefsUrl)
        .waitForVisible(paymentsTab)
        .click(paymentsTab)
        .waitForVisible('[data-l10n-id="publisher"]')
        .windowByUrl(Brave.browserWindowUrl)
        .waitUntil(function () {
          return this.getAppState().then((val) => {
            return val.value.ledger.synopsis.publishers['example.com'].options.exclude === true
          })
        })
        .waitUntil(function () {
          return this.getAppState().then((val) => {
            return val.value.ledger.synopsis.publishers['eff.org'].options.exclude === true
          })
        })
    })

    it('first site included, second site excluded', function * () {
      yield this.app.client
        .tabByIndex(0)
        .loadUrl(site1)
        .windowByUrl(Brave.browserWindowUrl)
        .waitForHistoryEntry(site1)
        .tabByUrl(site1)
        .windowByUrl(Brave.browserWindowUrl)
        .changeSetting(settings.PAYMENTS_SITES_AUTO_SUGGEST, false)
        .tabByIndex(0)
        .loadUrl(site2)
        .windowByUrl(Brave.browserWindowUrl)
        .waitForHistoryEntry(site2)
        .tabByUrl(site2)
        .loadUrl(prefsUrl)
        .waitForVisible(paymentsTab)
        .click(paymentsTab)
        .waitForVisible('[data-l10n-id="publisher"]')
        .windowByUrl(Brave.browserWindowUrl)
        .waitUntil(function () {
          return this.getAppState().then((val) => {
            return val.value.ledger.synopsis.publishers['example.com'].options.exclude === false
          })
        })
        .waitUntil(function () {
          return this.getAppState().then((val) => {
            return val.value.ledger.synopsis.publishers['eff.org'].options.exclude === true
          })
        })
    })
  })

  describe('add funds welcome screen', function () {
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
        .waitForEnabled(addFundsButton, ledgerAPIWaitTimeout)
        .waitForExist(addFundsButton)
    })

    afterEach(function * () {
      yield this.app.client
        .waitForExist(modalOverlayCloseButton)
        .moveToObject(modalOverlayCloseButton)
        .click(modalOverlayCloseButton)
        .waitForExist(addFundsButton)
    })

    it('opens the modal dialog when you click the add funds button', function * () {
      yield this.app.client
        .click(addFundsButton)
        .waitForExist(modalOverlay)
        .waitForElementCount(modalOverlay, 1)
    })

    it('renders the welcome screen', function * () {
      yield this.app.client
        .click(addFundsButton)
        .waitForExist(modalOverlay)
        .waitForExist(addFundsDialog)
        .waitForExist(addFundsWelcome)
        .waitForElementCount(addFundsWelcome, 1)
    })

    it('renders the wizard when you click next button', function * () {
      yield this.app.client
        .click(addFundsButton)
        .waitForExist(modalOverlay)
        .waitForExist(addFundsDialog)
        .waitForExist(addFundsWelcome)
        .waitForElementCount(addFundsWelcome, 1)
        .waitForExist(nextButton)
        .click(nextButton)
        .waitForExist(addFundsWizard)
        .waitForElementCount(addFundsWizard, 1)
    })
  })

  describe('add funds wizard screen', function () {
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
        .waitForEnabled(addFundsButton, ledgerAPIWaitTimeout)
        .waitForExist(addFundsButton)
        .click(addFundsButton)
        .waitForExist(modalOverlay)
        .waitForExist(addFundsDialog)
        .waitForExist(nextButton)
        .click(nextButton)
        .waitForExist(addFundsWizard)
        .waitForElementCount(addFundsWizard, 1)
        .waitForExist(modalOverlayCloseButton)
        .click(modalOverlayCloseButton)
    })

    beforeEach(function * () {
      yield this.app.client
        .waitForExist(addFundsButton)
        .click(addFundsButton)
    })

    afterEach(function * () {
      yield this.app.client
        .waitForExist(previousButton)
        .click(previousButton)
        .waitForExist(modalOverlayCloseButton)
        .click(modalOverlayCloseButton)
    })

    it('opens the BTC address screen when you click BTC button', function * () {
      yield this.app.client
        .waitForExist('[data-test-id="btcButton"]')
        .click('[data-test-id="btcButton"]')
        .waitForElementCount('[data-test-id="addFundsWizardAddressBTC"]', 1)
    })

    it('opens the ETH address screen when you click ETH button', function * () {
      yield this.app.client
        .waitForExist('[data-test-id="ethButton"]')
        .click('[data-test-id="ethButton"]')
        .waitForElementCount('[data-test-id="addFundsWizardAddressETH"]', 1)
    })

    it('opens the BAT address screen when you click BAT button', function * () {
      yield this.app.client
        .waitForExist('[data-test-id="batButton"]')
        .click('[data-test-id="batButton"]')
        .waitForElementCount('[data-test-id="addFundsWizardAddressBAT"]', 1)
    })

    it('opens the LTC address screen when you click LTC button', function * () {
      yield this.app.client
        .waitForExist('[data-test-id="ltcButton"]')
        .click('[data-test-id="ltcButton"]')
        .waitForElementCount('[data-test-id="addFundsWizardAddressLTC"]', 1)
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
      .waitForEnabled(addFundsButton)
  })

  it('no table if empty synopsis', function * () {
    yield this.app.client
      .waitForElementCount(ledgerTable, 0)
  })

  it('creates synopsis table after visiting a site', function * () {
    yield this.app.client
      .url(site3)
      .waitForTextValue('div', 'done')
      .windowByUrl(Brave.browserWindowUrl)
      .tabByUrl(site3)
      .loadUrl(prefsUrl)
      .waitForVisible(paymentsTab)
      .click(paymentsTab)
      .waitForElementCount(ledgerTable + ' tr', 2)
  })

  it('can sort synopsis table', function * () {
    yield this.app.client
      .loadUrl(site3)
      .windowByUrl(Brave.browserWindowUrl)
      .waitForHistoryEntry(site3, false)
      .tabByUrl(site3)
      .loadUrl(site1)
      .windowByUrl(Brave.browserWindowUrl)
      .waitForHistoryEntry(site1)
      .tabByUrl(site1)
      .loadUrl(site2)
      .windowByUrl(Brave.browserWindowUrl)
      .waitForHistoryEntry(site2)
      .tabByUrl(site2)
      .loadUrl(prefsUrl)
      .waitForVisible(paymentsTab)
      .click(paymentsTab)
      .waitForVisible('[data-l10n-id="publisher"]')
      .click('[data-l10n-id="publisher"]')
      .waitUntil(function () {
        return this.getText(`${ledgerTable} a`).then((text) => {
          return text[0] === 'eff.org' && text[2] === 'mit.edu'
        })
      })
      .click('[data-l10n-id="publisher"]')
      .waitUntil(function () {
        return this.getText(`${ledgerTable} a`).then((text) => {
          return text[2] === 'eff.org' && text[0] === 'mit.edu'
        })
      })
  })

  it('can disable site', function * () {
    yield this.app.client
      .loadUrl(site2)
      .loadUrl(prefsUrl)
      .waitForVisible(paymentsTab)
      .click(paymentsTab)
      .waitForVisible('[data-l10n-id="publisher"]')
      .click('[data-l10n-id="publisher"]')
      .waitForVisible(siteSettingItem + ' [data-test-id="switchBackground"]')
      .click(siteSettingItem + ' [data-test-id="switchBackground"]')
      .windowByUrl(Brave.browserWindowUrl)
      .waitUntil(function () {
        return this.getAppState().then((val) => {
          return val.value.siteSettings['https?://eff.org'].ledgerPayments === false
        })
      })
  })
})
