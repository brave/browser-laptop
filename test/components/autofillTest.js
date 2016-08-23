/* global describe, it, before */

const Brave = require('../lib/brave')
const {urlInput, autofillAddressPanel, autofillCreditCardPanel} = require('../lib/selectors')
const {getTargetAboutUrl} = require('../../js/lib/appUrlUtil')

describe('Autofill', function () {
  function * setup (client) {
    yield client
      .waitUntilWindowLoaded()
      .waitForUrl(Brave.newTabUrl)
      .waitForBrowserWindow()
      .waitForVisible('#window')
      .waitForVisible(urlInput)
  }

  describe('Data Management', function () {
    Brave.beforeAll(this)
    before(function * () {
      yield setup(this.app.client)
    })
    const page1Url = 'about:autofill'
    const addAddressButton = '.addAddressButton'
    const saveAddressButton = '.saveAddressButton'
    const name = 'Brave Lion'
    const organization = 'Brave'
    const streetAddress = '1161 Mission Street, #401'
    const city = 'San Francisco'
    const state = 'CA'
    const postalCode = '94103-1550'
    const country = 'US'
    const phone = '0987654321'
    const email = 'press@brave.com'
    it('Adding Address', function * () {
      yield this.app.client
        .tabByIndex(0)
        .loadUrl(page1Url)
        .url(getTargetAboutUrl(page1Url))
        .waitForVisible(addAddressButton)
        .click(addAddressButton)
        .windowByUrl(Brave.browserWindowUrl)
        .waitForVisible(autofillAddressPanel)
        .click('#nameOnAddress')
        .keys(name)
        .click('#organization')
        .keys(organization)
        .click('#streetAddress')
        .keys(streetAddress)
        .click('#city')
        .keys(city)
        .click('#state')
        .keys(state)
        .click('#postalCode')
        .keys(postalCode)
        .click('#country')
        .keys(country)
        .click('#phone')
        .keys(phone)
        .click('#email')
        .keys(email)
        .click(saveAddressButton)
        .waitUntil(function () {
          return this.getAppState().then((val) => {
            return val.value.autofill.addresses.length === 1
          })
        })
        .tabByUrl(this.page1Url)
        .waitForVisible('.autofillPage')
        .getText('.addressName').should.eventually.be.equal(name)
        .getText('.organization').should.eventually.be.equal(organization)
        .getText('.streetAddress').should.eventually.be.equal(streetAddress)
        .getText('.city').should.eventually.be.equal(city)
        .getText('.state').should.eventually.be.equal(state)
        .getText('.postalCode').should.eventually.be.equal(postalCode)
        .getText('.country').should.eventually.be.equal(country)
        .getText('.phone').should.eventually.be.equal(phone)
        .getText('.email').should.eventually.be.equal(email)
    })
    it('Address form test', function * () {
      const page1Url = 'https://www.roboform.com/filling-test-all-fields'
      yield this.app.client
        .tabByIndex(0)
        .loadUrl(page1Url)
        .url(getTargetAboutUrl(page1Url))
        .waitForVisible('<form>')
        .click('[name="04fullname"]')
        .click('[name="04fullname"]')
        .windowByUrl(Brave.browserWindowUrl)
        .ipcSendRenderer('autofill-selection-clicked', 2, name, 1, 0)
        .setContextMenuDetail()
        .tabByUrl(this.page1Url)
        .getValue('[name="04fullname"]').should.eventually.be.equal(name)
    })
    it('Editing Address', function * () {
      yield this.app.client
        .tabByIndex(0)
        .loadUrl(page1Url)
        .url(getTargetAboutUrl(page1Url))
        .waitForVisible('[title="Edit address"]')
        .click('[title="Edit address"]')
        .windowByUrl(Brave.browserWindowUrl)
        .waitForVisible(autofillAddressPanel)
        .click('#phone')
        .keys('123')
        .click('#email')
        .keys('mm')
        .click(saveAddressButton)
        .waitUntil(function () {
          return this.getAppState().then((val) => {
            return val.value.autofill.addresses.length === 1
          })
        })
        .tabByUrl(this.page1Url)
        .waitForVisible('.autofillPage')
        .getText('.addressName').should.eventually.be.equal(name)
        .getText('.organization').should.eventually.be.equal(organization)
        .getText('.streetAddress').should.eventually.be.equal(streetAddress)
        .getText('.city').should.eventually.be.equal(city)
        .getText('.state').should.eventually.be.equal(state)
        .getText('.postalCode').should.eventually.be.equal(postalCode)
        .getText('.country').should.eventually.be.equal(country)
        .getText('.phone').should.eventually.be.equal(phone + '123')
        .getText('.email').should.eventually.be.equal(email + 'mm')
    })
    it('Edited Address form test', function * () {
      const page1Url = 'https://www.roboform.com/filling-test-all-fields'
      yield this.app.client
        .tabByIndex(0)
        .loadUrl(page1Url)
        .url(getTargetAboutUrl(page1Url))
        .waitForVisible('<form>')
        .click('[name="04fullname"]')
        .click('[name="04fullname"]')
        .windowByUrl(Brave.browserWindowUrl)
        .ipcSendRenderer('autofill-selection-clicked', 2, name, 1, 0)
        .setContextMenuDetail()
        .tabByUrl(this.page1Url)
        .getValue('[name="04fullname"]').should.eventually.be.equal(name)
        .getValue('[name="23cellphon"]').should.eventually.be.equal(phone + '123')
        .getValue('[name="24emailadr"]').should.eventually.be.equal(email + 'mm')
    })
    it('Deleting Address', function * () {
      yield this.app.client
        .tabByIndex(0)
        .loadUrl(page1Url)
        .url(getTargetAboutUrl(page1Url))
        .waitForVisible('[title="Delete address"]')
        .click('[title="Delete address"]')
        .waitForVisible('[data-l10n-id=noAddressesSaved]')
    })
    const addCreditCardButton = '.addCreditCardButton'
    const saveCreditCardButton = '.saveCreditCardButton'
    const cardName = 'Test Card'
    const cardNumber = '1234567890'
    const expMonth = 10
    const expYear = new Date().getFullYear() + 2
    it('Adding Credit Card', function * () {
      yield this.app.client
        .tabByIndex(0)
        .loadUrl(page1Url)
        .url(getTargetAboutUrl(page1Url))
        .waitForVisible(addCreditCardButton)
        .click(addCreditCardButton)
        .windowByUrl(Brave.browserWindowUrl)
        .waitForVisible(autofillCreditCardPanel)
        .click('#nameOnCard')
        .keys(cardName)
        .click('#creditCardNumber')
        .keys(cardNumber)
        .selectByValue('.expMonthSelect', expMonth.toString())
        .selectByValue('.expYearSelect', expYear.toString())
        .click(saveCreditCardButton)
        .waitUntil(function () {
          return this.getAppState().then((val) => {
            return val.value.autofill.creditCards.length === 1
          })
        })
        .tabByUrl(this.page1Url)
        .waitForVisible('.autofillPage')
        .getText('.creditCardName').should.eventually.be.equal(cardName)
        .getText('.creditCardNumber').should.eventually.be.equal('***' + cardNumber.slice(-4))
        .getText('.creditCardPExpirationDate').should.eventually.be.equal(expMonth.toString() + '/' + expYear.toString())
    })
    it('Credit Card form test', function * () {
      const page1Url = 'https://www.roboform.com/filling-test-all-fields'
      yield this.app.client
        .tabByIndex(0)
        .loadUrl(page1Url)
        .url(getTargetAboutUrl(page1Url))
        .waitForVisible('<form>')
        .click('[name="41ccnumber"]')
        .click('[name="41ccnumber"]')
        .windowByUrl(Brave.browserWindowUrl)
        .ipcSendRenderer('autofill-selection-clicked', 2, cardNumber, 65536, 0)
        .setContextMenuDetail()
        .tabByUrl(this.page1Url)
        .getValue('[name="41ccnumber"]').should.eventually.be.equal(cardNumber)
        .getValue('[name="42ccexp_mm"]').should.eventually.be.equal(expMonth.toString())
        .getValue('[name="43ccexp_yy"]').should.eventually.be.equal(expYear.toString())
    })
    it('Editing Credit Card', function * () {
      yield this.app.client
        .tabByIndex(0)
        .loadUrl(page1Url)
        .url(getTargetAboutUrl(page1Url))
        .waitForVisible('[title="Edit creditCard"]')
        .click('[title="Edit creditCard"]')
        .windowByUrl(Brave.browserWindowUrl)
        .waitForVisible(autofillCreditCardPanel)
        .click('#nameOnCard')
        .keys('123')
        .click('#creditCardNumber')
        .keys('123')
        .selectByValue('.expMonthSelect', (expMonth + 1).toString())
        .selectByValue('.expYearSelect', (expYear + 1).toString())
        .click(saveCreditCardButton)
        .waitUntil(function () {
          return this.getAppState().then((val) => {
            return val.value.autofill.creditCards.length === 1
          })
        })
        .tabByUrl(this.page1Url)
        .waitForVisible('.autofillPage')
        .getText('.creditCardName').should.eventually.be.equal(cardName + 123)
        .getText('.creditCardNumber').should.eventually.be.equal('***' + (cardNumber + 123).slice(-4))
        .getText('.creditCardPExpirationDate').should.eventually.be.equal(
          (expMonth + 1).toString() + '/' + (expYear + 1).toString())
    })
    it('Edited Credit Card form test', function * () {
      const page1Url = 'https://www.roboform.com/filling-test-all-fields'
      yield this.app.client
        .tabByIndex(0)
        .loadUrl(page1Url)
        .url(getTargetAboutUrl(page1Url))
        .waitForVisible('<form>')
        .click('[name="41ccnumber"]')
        .click('[name="41ccnumber"]')
        .windowByUrl(Brave.browserWindowUrl)
        .ipcSendRenderer('autofill-selection-clicked', 2, cardNumber, 65536, 0)
        .setContextMenuDetail()
        .tabByUrl(this.page1Url)
        .getValue('[name="41ccnumber"]').should.eventually.be.equal(cardNumber + '123')
        .getValue('[name="42ccexp_mm"]').should.eventually.be.equal((expMonth + 1).toString())
        .getValue('[name="43ccexp_yy"]').should.eventually.be.equal((expYear + 1).toString())
    })
    it('Deleting Credit Card', function * () {
      yield this.app.client
        .tabByIndex(0)
        .loadUrl(page1Url)
        .url(getTargetAboutUrl(page1Url))
        .waitForVisible('[title="Delete creditCard"]')
        .click('[title="Delete creditCard"]')
        .waitForVisible('[data-l10n-id=noCreditCardsSaved]')
    })
  })
})
