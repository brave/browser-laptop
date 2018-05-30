/* global describe, it, beforeEach */

const Brave = require('../lib/brave')
const {
  urlInput,
  addFundsButton,
  paymentsWelcomePage,
  paymentsTab,
  walletSwitch,
  advancedSettingsDialog,
  advancedSettingsButton
} = require('../lib/selectors')

const ledgerAPIWaitTimeout = 20000
const prefsUrl = 'about:preferences'
const sites = [
  'http://example.com/',
  'https://brianbondy.com/'
]
const sites2 = [
  'http://example.com/',
  'https://www.eff.org/',
  'https://brianbondy.com/',
  'https://clifton.io/'
]
const firstTable = '[data-tbody-index="0"]'
const firstTableFirstRow = `${firstTable} [data-row-index="0"]`
const firstTableSecondRow = `${firstTable} [data-row-index="1"]`
const firstTableThirdRow = `${firstTable} [data-row-index="2"]`
const secondTable = '[data-tbody-index="1"]'
const secondTableFirstRow = `${secondTable} [data-row-index="0"]`
const secondTableSecondRow = `${secondTable} [data-row-index="1"]`
const secondTableThirdRow = `${secondTable} [data-row-index="2"]`
const secondTableForthRow = `${secondTable} [data-row-index="3"]`

function * setup (client) {
  yield client
    .waitForUrl(Brave.newTabUrl)
    .waitForBrowserWindow()
    .waitForVisible(urlInput)
}

function * before (client, siteList) {
  yield client
    .tabByIndex(0)
    .loadUrl(prefsUrl)
    .waitForVisible(paymentsTab)
    .click(paymentsTab)
    .waitForVisible(paymentsWelcomePage)
    .waitForVisible(walletSwitch)
    .click(walletSwitch)
    .waitForEnabled(addFundsButton, ledgerAPIWaitTimeout)
    .windowByUrl(Brave.browserWindowUrl)

  for (let site of siteList) {
    yield client
      .windowByUrl(Brave.browserWindowUrl)
      .newTab({url: site})
      .waitForHistoryEntry(site, false)
      .waitForTabCount(2)
      .then(() => new Promise(resolve => setTimeout(resolve, 500)))
      .windowByUrl(Brave.browserWindowUrl)
      .closeTabByIndex(1)
      .waitForTabCount(1)
  }

  yield client
    .tabByUrl(prefsUrl)
}

function findBiggestPercentage (synopsis) {
  return synopsis.get('publishers').map((publisher, key) => {
    return publisher.set('publisherKey', key)
  }).sort((a, b) => {
    const aValue = a.get('pinPercentage') || 0
    const bValue = b.get('pinPercentage') || 0
    if (aValue < bValue) { return 1 }
    if (aValue > bValue) { return -1 }
    if (aValue === bValue) { return 0 }
  }).first()
}

describe('Ledger table', function () {
  describe('2 publishers', function () {
    Brave.beforeEach(this)
    beforeEach(function * () {
      yield setup(this.app.client)
      yield before(this.app.client, sites)
    })

    it('check if all sites are on the unpinned by default', function * () {
      yield this.app.client
        .tabByIndex(0)
        .waitForElementCount(`${secondTable} tr`, sites.length)
    })

    it('pin publisher', function * () {
      let topPublisher

      yield this.app.client
        .tabByIndex(0)
        .click(`${secondTableFirstRow} [data-test-pinned="false"]`)
        .waitForVisible(`${firstTableFirstRow} [data-test-pinned="true"]`)
        .windowByUrl(Brave.browserWindowUrl)
        .waitUntilSynopsis(function (synopsis) {
          topPublisher = findBiggestPercentage(synopsis)
          return true
        })
        .tabByIndex(0)
        .waitForVisible(`${firstTableFirstRow} [data-test-id="siteName"]`)
        .waitUntil(function () {
          return this.getText(`${firstTableFirstRow} [data-test-id="siteName"]`).then((value) => {
            return value === topPublisher.get('publisherKey')
          })
        }, 5000)
        .waitForVisible(`${firstTableFirstRow} [data-test-id="pinnedInput"]`)
        .waitUntil(function () {
          return this.getValue(`${firstTableFirstRow} [data-test-id="pinnedInput"]`).then((value) => {
            return Number(value) === topPublisher.get('pinPercentage')
          })
        }, 5000)
    })

    it('pin publisher and change percentage', function * () {
      yield this.app.client
        .tabByIndex(0)
        .click(`${secondTableFirstRow} [data-test-pinned="false"]`)
        .waitForVisible(`${firstTableFirstRow} [data-test-pinned="true"]`)
        .click(`${firstTableFirstRow} [data-test-id="pinnedInput"]`)
        .pause(100)
        .keys([Brave.keys.DELETE, Brave.keys.DELETE, '40', Brave.keys.ENTER])
        .waitForInputText(`${firstTableFirstRow} [data-test-id="pinnedInput"]`, '40')
        .waitForTextValue(`${secondTableSecondRow} [data-test-id="percentageValue"]`, '60')
    })

    it('pin publisher and change percentage over 100', function * () {
      yield this.app.client
        .tabByIndex(0)
        .click(`${secondTableFirstRow} [data-test-pinned="false"]`)
        .waitForVisible(`${firstTableFirstRow} [data-test-pinned="true"]`)
        .click(`${firstTableFirstRow} [data-test-id="pinnedInput"]`)
        .keys([Brave.keys.DELETE, Brave.keys.DELETE, '150', Brave.keys.ENTER])
        .waitForInputText(`${firstTableFirstRow} [data-test-id="pinnedInput"]`, '100')
        .waitForTextValue(`${secondTableSecondRow} [data-test-id="percentageValue"]`, '0')
    })

    it('pin excluded publisher', function * () {
      let topPublisher

      yield this.app.client
        .tabByIndex(0)
        .click(`${secondTableFirstRow} [data-test-id="switchBackground"]`)
        .waitForVisible(`${secondTableSecondRow} [data-switch-status="false"]`)
        .click(`${secondTableSecondRow} [data-test-pinned="false"]`)
        .waitForVisible(`${firstTableFirstRow} [data-test-pinned="true"]`)
        .windowByUrl(Brave.browserWindowUrl)
        .waitUntilSynopsis(function (synopsis) {
          topPublisher = findBiggestPercentage(synopsis)
          return true
        })
        .tabByIndex(0)
        .waitForVisible(`${firstTableFirstRow} [data-test-id="siteName"]`)
        .waitUntil(function () {
          return this.getText(`${firstTableFirstRow} [data-test-id="siteName"]`).then((value) => {
            return value === topPublisher.get('publisherKey')
          })
        }, 5000)
        .waitForVisible(`${firstTableFirstRow} [data-switch-status="true"]`)
    })

    it('check pinned sites amount, when you have 0 eligible unpinned sites', function * () {
      yield this.app.client
        .tabByIndex(0)
        .click(`${secondTableFirstRow} [data-test-pinned="false"]`)
        .waitForVisible(`${firstTableFirstRow} [data-test-pinned="true"]`)
        .click(`${firstTableFirstRow} [data-test-id="pinnedInput"]`)
        .keys([Brave.keys.DELETE, Brave.keys.DELETE, '60', Brave.keys.ENTER])
        .waitForInputText(`${firstTableFirstRow} [data-test-id="pinnedInput"]`, '60')
        .waitForTextValue(`${secondTableSecondRow} [data-test-id="percentageValue"]`, '40')
        .click(`${secondTableSecondRow} [data-test-id="switchBackground"]`)
        .waitForInputText(`${firstTableFirstRow} [data-test-id="pinnedInput"]`, '100')
    })

    it('toggle non-verified option', function * () {
      yield this.app.client
        .tabByIndex(0)
        .click(advancedSettingsButton)
        .waitForVisible(advancedSettingsDialog)
        .click('[data-test-id="payment-advance-nonverified"] [data-test-id="switchBackground"]')
        .click('[data-l10n-id="done"]')
        .waitForElementCount(advancedSettingsDialog, 0)
        .waitForElementCount(`${secondTable} tr`, 1)
    })
  })

  describe('4 publishers', function () {
    Brave.beforeEach(this)

    beforeEach(function * () {
      yield setup(this.app.client)
      yield before(this.app.client, sites2)
    })

    it('check if all sites are on the unpinned list', function * () {
      yield this.app.client
        .tabByIndex(0)
        .waitForElementCount(`${secondTable} tr`, sites2.length)
    })

    it('pin 3 publishers', function * () {
      yield this.app.client
        .tabByIndex(0)
        .click(`${secondTableFirstRow} [data-test-pinned="false"]`)
        .waitForElementCount(`${firstTable} tr`, 1)
        .click(`${secondTableSecondRow} [data-test-pinned="false"]`)
        .waitForElementCount(`${firstTable} tr`, 2)
        .click(`${secondTableThirdRow} [data-test-pinned="false"]`)
        .waitForElementCount(`${firstTable} tr`, 3)
        .waitForElementCount(`${secondTable} tr`, sites2.length - 3)
    })

    it('pin 3 publishers and check unpinned value', function * () {
      let pinnedSum = 0
      yield this.app.client
        .tabByIndex(0)
        .click(`${secondTableFirstRow} [data-test-pinned="false"]`)
        .waitForElementCount(`${firstTable} tr`, 1)
        .click(`${secondTableSecondRow} [data-test-pinned="false"]`)
        .waitForElementCount(`${firstTable} tr`, 2)
        .click(`${secondTableThirdRow} [data-test-pinned="false"]`)
        .waitForElementCount(`${firstTable} tr`, 3)
        .windowByUrl(Brave.browserWindowUrl)
        .waitUntilSynopsis(function (synopsis) {
          pinnedSum = synopsis.get('publishers').reduce((total, publisher) => {
            if (publisher.get('pinPercentage') !== undefined) {
              return total + publisher.get('pinPercentage')
            }

            return total
          }, 0)
          return true
        })
        .tabByIndex(0)
        .waitUntil(function () {
          return this.getText(`${secondTableForthRow} [data-test-id="percentageValue"]`).then((value) => {
            return Number(value) === (100 - pinnedSum)
          })
        }, 5000)
    })

    it('pin 3 publishers custom value and check unpinned value', function * () {
      yield this.app.client
        .tabByIndex(0)
        .click(`${secondTableFirstRow} [data-test-pinned="false"]`)
        .waitForElementCount(`${firstTable} tr`, 1)
        .click(`${secondTableSecondRow} [data-test-pinned="false"]`)
        .waitForElementCount(`${firstTable} tr`, 2)
        .click(`${secondTableThirdRow} [data-test-pinned="false"]`)
        .waitForElementCount(`${firstTable} tr`, 3)
        .click(`${firstTableFirstRow} [data-test-id="pinnedInput"]`)
        .keys([Brave.keys.DELETE, Brave.keys.DELETE, '40', Brave.keys.ENTER])
        .pause(100)
        .click(`${firstTableSecondRow} [data-test-id="pinnedInput"]`)
        .keys([Brave.keys.DELETE, Brave.keys.DELETE, '30', Brave.keys.ENTER])
        .pause(100)
        .click(`${firstTableThirdRow} [data-test-id="pinnedInput"]`)
        .keys([Brave.keys.DELETE, Brave.keys.DELETE, '20', Brave.keys.ENTER])
        .pause(100)
        .waitForTextValue(`${secondTableForthRow} [data-test-id="percentageValue"]`, '10')
    })

    it('pin 3 publishers over 100 value and check unpinned value', function * () {
      yield this.app.client
        .tabByIndex(0)
        .click(`${secondTableFirstRow} [data-test-pinned="false"]`)
        .waitForElementCount(`${firstTable} tr`, 1)
        .click(`${secondTableSecondRow} [data-test-pinned="false"]`)
        .waitForElementCount(`${firstTable} tr`, 2)
        .click(`${secondTableThirdRow} [data-test-pinned="false"]`)
        .waitForElementCount(`${firstTable} tr`, 3)
        .click(`${firstTableFirstRow} [data-test-id="pinnedInput"]`)
        .keys([Brave.keys.DELETE, Brave.keys.DELETE, '40', Brave.keys.ENTER])
        .click(`${firstTableSecondRow} [data-test-id="pinnedInput"]`)
        .keys([Brave.keys.DELETE, Brave.keys.DELETE, '30', Brave.keys.ENTER])
        .click(`${firstTableThirdRow} [data-test-id="pinnedInput"]`)
        .keys([Brave.keys.DELETE, Brave.keys.DELETE, '20', Brave.keys.ENTER])
        .click(`${firstTableThirdRow} [data-test-id="pinnedInput"]`)
        .keys([Brave.keys.DELETE, Brave.keys.DELETE, '150', Brave.keys.ENTER])
        .waitForInputText(`${firstTableFirstRow} [data-test-id="pinnedInput"]`, '1')
        .waitForInputText(`${firstTableSecondRow} [data-test-id="pinnedInput"]`, '1')
        .waitForInputText(`${firstTableThirdRow} [data-test-id="pinnedInput"]`, '98')
        .waitForTextValue(`${secondTableForthRow} [data-test-id="percentageValue"]`, '0')
    })
  })
})
