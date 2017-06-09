/* global describe, it, before, beforeEach */

const Brave = require('../lib/brave')
const {urlInput, autofillAddressPanel, autofillCreditCardPanel, clearBrowsingDataButton, clearDataButton, securityTab} = require('../lib/selectors')
const {getTargetAboutUrl} = require('../../js/lib/appUrlUtil')

const addAddressButton = '[data-test-id="addAddressButton"]'
const saveAddressButton = '[data-test-id="saveAddressButton"]'
const addCreditCardButton = '[data-test-id="addCreditCardButton"]'
const saveCreditCardButton = '[data-test-id="saveCreditCardButton"]'
const name = 'Brave Lion'
const nameInput = '[data-test-id="nameOnAddress"]'
const organization = 'Brave'
const organizationInput = '[data-test-id="organization"]'
const streetAddress = '1161 Mission Street, #401'
const streetInput = '[data-test-id="streetAddress"]'
const city = 'San Francisco'
const cityInput = '[data-test-id="city"]'
const state = 'CA'
const stateInput = '[data-test-id="state"]'
const postalCode = '94103-1550'
const postalCodeInput = '[data-test-id="postalCode"]'
const country = 'US'
const countryInput = '[data-test-id="country"]'
const phone = '0987654321'
const phoneInput = '[data-test-id="phone"]'
const email = 'press@brave.com'
const emailInput = '[data-test-id="email"]'
const cardName = 'Test Card'
const cardNameInput = '[data-test-id="creditCardName"]'
const cardNumber = '1234567890'
const cardNumberInput = '[data-test-id="creditCardNumber"]'
const expMonth = 9
const expYear = new Date().getFullYear() + 2

// auto fill form
const formFullNameInput = '[name="04fullname"]'
const formPhoneInput = '[name="23cellphon"]'
const formEmailInput = '[name="24emailadr"]'
const formCardNameInput = '[name="41ccnumber"]'
const formCreditMonthInput = '[name="42ccexp_mm"]'
const formCreditYearInput = '[name="43ccexp_yy"]'

describe('Autofill', function () {
  function * setup (client) {
    yield client
      .waitForUrl(Brave.newTabUrl)
      .waitForBrowserWindow()
      .waitForVisible(urlInput)
  }

  describe('address', function () {
    Brave.beforeEach(this)
    beforeEach(function * () {
      yield setup(this.app.client)
      this.autofillPreferences = 'about:autofill'
      this.formfill = Brave.server.url('formfill.html')

      yield this.app.client
        .tabByIndex(0)
        .loadUrl(this.autofillPreferences)
        .waitForVisible(addAddressButton)
        .click(addAddressButton)
        .windowByUrl(Brave.browserWindowUrl)
        .waitForVisible(autofillAddressPanel)
        .waitForElementFocus(nameInput)
        .typeText(nameInput, name)
        .click(organizationInput)
        .typeText(organizationInput, organization)
        .click(streetInput)
        .typeText(streetInput, streetAddress)
        .click(cityInput)
        .typeText(cityInput, city)
        .click(stateInput)
        .typeText(stateInput, state)
        .click(postalCodeInput)
        .typeText(postalCodeInput, postalCode)
        .click(countryInput)
        .typeText(countryInput, country)
        .click(phoneInput)
        .typeText(phoneInput, phone)
        .click(emailInput)
        .typeText(emailInput, email)
        .click(saveAddressButton)
        .waitUntil(function () {
          return this.getAppState().then((val) => {
            return val.value.autofill.addresses.guid.length === 1
          })
        })
        .tabByIndex(0)
        .loadUrl(this.autofillPreferences)
    })
    it('adds an autofill address', function * () {
      yield this.app.client
        .waitForVisible('[data-test-id="autofillPage"]')
        .waitForTextValue('[data-test-id="addressName"]', name)
        .waitForTextValue(organizationInput, organization)
        .waitForTextValue(streetInput, streetAddress)
        .waitForTextValue(cityInput, city)
        .waitForTextValue(stateInput, state)
        .waitForTextValue(postalCodeInput, postalCode)
        .waitForTextValue(countryInput, country)
        .waitForTextValue(phoneInput, phone)
        .waitForTextValue(emailInput, email)
    })
    it('autofills the address', function * () {
      yield this.app.client
        .tabByIndex(0)
        .loadUrl(this.formfill)
        .waitForVisible('<form>')
        .click(formFullNameInput)
        .click(formFullNameInput)
        .windowByUrl(Brave.browserWindowUrl)
        .waitForVisible('.contextMenuItemText')
        .click('.contextMenuItemText')
        .tabByUrl(this.formfill)
        .waitForInputText(formFullNameInput, name)
        .waitForInputText(formPhoneInput, phone)
        .waitForInputText(formEmailInput, email)
        // TODO(bridiver) - this needs to check all fields
    })
    it('autofills the address in a private tab', function * () {
      yield this.app.client
        .windowByUrl(Brave.browserWindowUrl)
        .newTab({ url: this.formfill + '?2', isPrivate: true })
        .waitForUrl(this.formfill + '?2')
        .waitForVisible('<form>')
        .click(formFullNameInput)
        .click(formFullNameInput)
        .windowByUrl(Brave.browserWindowUrl)
        .waitForVisible('.contextMenuItemText')
        .click('.contextMenuItemText')
        .tabByUrl(this.formfill)
        .waitForInputText(formFullNameInput, name)
        .waitForInputText(formPhoneInput, phone)
        .waitForInputText(formEmailInput, email)
        // TODO(bridiver) - this needs to check all fields
    })
    it('autofills the updated address when edited', function * () {
      yield this.app.client
        // update the address
        .tabByIndex(0)
        .loadUrl(this.autofillPreferences)
        .waitForVisible('[data-test-id="EditAddress"]')
        .click('[data-test-id="EditAddress"]')
        .windowByUrl(Brave.browserWindowUrl)
        .waitForVisible(autofillAddressPanel)
        .click(phoneInput)
        .keys(Brave.keys.END)
        .typeText(phoneInput, '123', phone)
        .click(emailInput)
        .keys(Brave.keys.END)
        .typeText(emailInput, 'mm', email)
        .click(saveAddressButton)
        .waitUntil(function () {
          return this.getAppState().then((val) => {
            return val.value.autofill.addresses.guid.length === 1
          })
        })
        .tabByIndex(0)
        .loadUrl(this.autofillPreferences)
        .waitForVisible('[data-test-id="autofillPage"]')
        .waitForTextValue('[data-test-id="addressName"]', name)
        .waitForTextValue(organizationInput, organization)
        .waitForTextValue(streetInput, streetAddress)
        .waitForTextValue(cityInput, city)
        .waitForTextValue(stateInput, state)
        .waitForTextValue(postalCodeInput, postalCode)
        .waitForTextValue(countryInput, country)
        .waitForTextValue(phoneInput, phone + '123')
        .waitForTextValue(emailInput, email + 'mm')
        // fill out the form
        .loadUrl(this.formfill)
        .waitForVisible('<form>')
        .click(formFullNameInput)
        .click(formFullNameInput)
        .windowByUrl(Brave.browserWindowUrl)
        .waitForVisible('.contextMenuItemText')
        .click('.contextMenuItemText')
        .tabByUrl(this.formfill)
        .waitForInputText(formFullNameInput, name)
        .waitForInputText(formPhoneInput, phone + '123')
        .waitForInputText(formEmailInput, email + 'mm')
        // TODO(bridiver) - this needs to check all fields
    })
    it('deletes the address', function * () {
      yield this.app.client
        .tabByIndex(0)
        .loadUrl(this.autofillPreferences)
        .waitForVisible('[data-test-id="DeleteAddress"]')
        .click('[data-test-id="DeleteAddress"]')
        .loadUrl(this.autofillPreferences)
        .waitForVisible('[data-test-id="noAddressesSaved"]')
    })
  })

  describe('credit card', function () {
    Brave.beforeEach(this)
    beforeEach(function * () {
      yield setup(this.app.client)
      this.autofillPreferences = 'about:autofill'
      this.formfill = Brave.server.url('formfill.html')
      this.formfillHTTPS = 'https://brave.github.io/brave-tests/autofill/formfill.html'

      yield this.app.client
        .tabByIndex(0)
        .loadUrl(this.autofillPreferences)
        .waitForVisible(addCreditCardButton)
        .click(addCreditCardButton)
        .windowByUrl(Brave.browserWindowUrl)
        .waitForVisible(autofillCreditCardPanel)
        .waitForElementFocus(cardNameInput)
        .typeText(cardNameInput, cardName)
        .click(cardNumberInput)
        .typeText(cardNumberInput, cardNumber)
        .selectByValue('[data-test-id="expMonthSelect"]', expMonth < 10 ? '0' + expMonth.toString() : expMonth.toString())
        .selectByValue('[data-test-id="expYearSelect"]', expYear.toString())
        .click(saveCreditCardButton)
        .waitUntil(function () {
          return this.getAppState().then((val) => {
            return val.value.autofill.creditCards.guid.length === 1
          })
        })
        .tabByIndex(0)
        .loadUrl(this.autofillPreferences)
    })
    it('adds an autofill credit card', function * () {
      yield this.app.client
        .waitForVisible('[data-test-id="autofillPage"]')
        .waitForTextValue(cardNameInput, cardName)
        .waitForTextValue(cardNumberInput, '***' + cardNumber.slice(-4))
        .waitForTextValue('[data-test-id="creditCardPExpirationDate"]',
          (expMonth < 10 ? '0' + expMonth.toString() : expMonth.toString()) + '/' + expYear.toString())
    })
    it('autofills the credit card in regular', function * () {
      yield this.app.client
        .tabByIndex(0)
        .loadUrl(this.formfillHTTPS)
        .waitForVisible('<form>')
        .click(formCardNameInput)
        .click(formCardNameInput)
        .windowByUrl(Brave.browserWindowUrl)
        .waitForVisible('.contextMenuItemText')
        .click('.contextMenuItemText')
        .tabByUrl(this.formfillHTTPS)
        .waitForInputText(formCardNameInput, cardNumber)
        .waitForInputText(formCreditMonthInput, expMonth.toString())
        .waitForInputText(formCreditYearInput, expYear.toString())
    })
    it('autofills the credit card in a private tab', function * () {
      yield this.app.client
        .windowByUrl(Brave.browserWindowUrl)
        .newTab({ url: this.formfillHTTPS + '?2', isPrivate: true })
        .waitForUrl(this.formfillHTTPS + '?2')
        .waitForVisible('<form>')
        .click(formCardNameInput)
        .click(formCardNameInput)
        .windowByUrl(Brave.browserWindowUrl)
        .waitForVisible('.contextMenuItemText')
        .click('.contextMenuItemText')
        .tabByUrl(this.formfillHTTPS)
        .waitForInputText(formCardNameInput, cardNumber)
        .waitForInputText(formCreditMonthInput, expMonth.toString())
        .waitForInputText(formCreditYearInput, expYear.toString())
    })
    it('autofills the updated credit card when edited', function * () {
      yield this.app.client
        .tabByIndex(0)
        .loadUrl(this.autofillPreferences)
        .url(getTargetAboutUrl(this.autofillPreferences))
        .waitForVisible('[data-test-id="EditCreditCard"]')
        .click('[data-test-id="EditCreditCard"]')
        .windowByUrl(Brave.browserWindowUrl)
        .waitForVisible(autofillCreditCardPanel)
        .waitForElementFocus(cardNameInput)
        .keys(Brave.keys.END)
        .keys('123')
        .click(cardNumberInput)
        .keys(Brave.keys.END)
        .keys('123')
        .selectByValue('[data-test-id="expMonthSelect"]', (expMonth + 1).toString())
        .selectByValue('[data-test-id="expYearSelect"]', (expYear + 1).toString())
        .click(saveCreditCardButton)
        .waitUntil(function () {
          return this.getAppState().then((val) => {
            return val.value.autofill.creditCards.guid.length === 1
          })
        })
        .tabByIndex(0)
        .loadUrl(this.autofillPreferences)
        .waitForVisible('[data-test-id="autofillPage"]')
        .waitForTextValue(cardNameInput, cardName + 123)
        .waitForTextValue(cardNumberInput, '***' + (cardNumber + 123).slice(-4))
        .waitForTextValue('[data-test-id="creditCardPExpirationDate"]', (expMonth + 1).toString() + '/' + (expYear + 1).toString())
        .tabByIndex(0)
        .loadUrl(this.formfillHTTPS)
        .waitForVisible('<form>')
        .click(formCardNameInput)
        .click(formCardNameInput)
        .windowByUrl(Brave.browserWindowUrl)
        .waitForVisible('.contextMenuItemText')
        .click('.contextMenuItemText')
        .tabByUrl(this.formfillHTTPS)
        .waitForInputText(formCardNameInput, cardNumber + '123')
        .waitForInputText(formCreditMonthInput, (expMonth + 1).toString())
        .waitForInputText(formCreditYearInput, (expYear + 1).toString())
        // TODO(bridiver) this needs to check all fields
    })
    it('deletes the credit card', function * () {
      yield this.app.client
        .tabByIndex(0)
        .loadUrl(this.autofillPreferences)
        .waitForVisible('[data-test-id="DeleteCreditCard"]')
        .click('[data-test-id="DeleteCreditCard"]')
        .loadUrl(this.autofillPreferences)
        .waitForVisible('[data-test-id="noCreditCardsSaved"]')
    })
  })

  describe('clear autofill data', function () {
    Brave.beforeEach(this)
    beforeEach(function * () {
      yield setup(this.app.client)
      this.autofillPreferences = 'about:autofill'
      this.formfill = Brave.server.url('formfill.html')
      this.formfillHTTPS = 'https://brave.github.io/brave-tests/autofill/formfill.html'

      yield this.app.client
        .tabByIndex(0)
        .loadUrl(this.autofillPreferences)
        .waitForVisible(addAddressButton)
        .click(addAddressButton)
        .windowByUrl(Brave.browserWindowUrl)
        .waitForVisible(autofillAddressPanel)
        .waitForElementFocus(nameInput)
        .typeText(nameInput, name)
        .click(organizationInput)
        .typeText(organizationInput, organization)
        .click(streetInput)
        .typeText(streetInput, streetAddress)
        .click(cityInput)
        .typeText(cityInput, city)
        .click(stateInput)
        .typeText(stateInput, state)
        .click(postalCodeInput)
        .typeText(postalCodeInput, postalCode)
        .click(countryInput)
        .typeText(countryInput, country)
        .click(phoneInput)
        .typeText(phoneInput, phone)
        .click(emailInput)
        .typeText(emailInput, email)
        .click(saveAddressButton)
        .waitUntil(function () {
          return this.getAppState().then((val) => {
            return val.value.autofill.addresses.guid.length === 1
          })
        })
        .tabByIndex(0)
        .loadUrl(this.autofillPreferences)
        .waitForVisible(addCreditCardButton)
        .click(addCreditCardButton)
        .windowByUrl(Brave.browserWindowUrl)
        .waitForVisible(autofillCreditCardPanel)
        .waitForElementFocus(cardNameInput)
        .typeText(cardNameInput, cardName)
        .click(cardNumberInput)
        .typeText(cardNumberInput, cardNumber)
        .selectByValue('[data-test-id="expMonthSelect"]', expMonth < 10 ? '0' + expMonth.toString() : expMonth.toString())
        .selectByValue('[data-test-id="expYearSelect"]', expYear.toString())
        .click(saveCreditCardButton)
        .waitUntil(function () {
          return this.getAppState().then((val) => {
            return val.value.autofill.creditCards.guid.length === 1
          })
        })
        .tabByIndex(0)
        .loadUrl(this.autofillPreferences)
    })
    it('adds an autofill address', function * () {
      yield this.app.client
        .waitForVisible('[data-test-id="autofillPage"]')
        .waitForTextValue('[data-test-id="addressName"]', name)
        .waitForTextValue(organizationInput, organization)
        .waitForTextValue(streetInput, streetAddress)
        .waitForTextValue(cityInput, city)
        .waitForTextValue(stateInput, state)
        .waitForTextValue(postalCodeInput, postalCode)
        .waitForTextValue(countryInput, country)
        .waitForTextValue(phoneInput, phone)
        .waitForTextValue(emailInput, email)
    })
    it('adds an autofill credit card', function * () {
      yield this.app.client
        .waitForVisible('[data-test-id="autofillPage"]')
        .waitForTextValue(cardNameInput, cardName)
        .waitForTextValue(cardNumberInput, '***' + cardNumber.slice(-4))
        .waitForTextValue('[data-test-id="creditCardPExpirationDate"]',
          (expMonth < 10 ? '0' + expMonth.toString() : expMonth.toString()) + '/' + expYear.toString())
    })
    it('autofills the address', function * () {
      yield this.app.client
        .tabByIndex(0)
        .loadUrl(this.formfill)
        .waitForVisible('<form>')
        .click(formFullNameInput)
        .click(formFullNameInput)
        .windowByUrl(Brave.browserWindowUrl)
        .waitForVisible('.contextMenuItemText')
        .click('.contextMenuItemText')
        .tabByUrl(this.formfill)
        .waitForInputText(formFullNameInput, name)
        .waitForInputText(formPhoneInput, phone)
        .waitForInputText(formEmailInput, email)
        // TODO(bridiver) - this needs to check all fields
    })
    it('autofills the credit card', function * () {
      yield this.app.client
        .tabByIndex(0)
        .loadUrl(this.formfillHTTPS)
        .waitForVisible('<form>')
        .click(formCardNameInput)
        .click(formCardNameInput)
        .windowByUrl(Brave.browserWindowUrl)
        .waitForVisible('.contextMenuItemText')
        .click('.contextMenuItemText')
        .tabByUrl(this.formfillHTTPS)
        .waitForInputText(formCardNameInput, cardNumber)
        .waitForInputText(formCreditMonthInput, expMonth.toString())
        .waitForInputText(formCreditYearInput, expYear.toString())
    })
    it('clear data now', function * () {
      yield this.app.client
        .tabByIndex(0)
        .loadUrl(getTargetAboutUrl('about:preferences'))
        .waitForVisible(securityTab)
        .click(securityTab)
        .waitForVisible(clearBrowsingDataButton)
        .click(clearBrowsingDataButton)
        .waitForBrowserWindow()
        .waitForVisible('[data-test-id="autofillDataSwitch"]')
        .click('[data-test-id="autofillDataSwitch"] .switchMiddle')
        .waitForVisible(clearDataButton)
        .click(clearDataButton)
    })
    it('does not autofill in regular tab', function * () {
      yield this.app.client
        .windowByUrl(Brave.browserWindowUrl)
        .newTab({ url: this.formfill })
        .waitForUrl(this.formfill)
        .waitForVisible('<form>')
        .click(formFullNameInput)
        .click(formFullNameInput)
        .windowByUrl(Brave.browserWindowUrl)
        .waitForElementCount('contextMenuItemText', 0)
        .tabByIndex(1)
        .waitForInputText(formFullNameInput, '')
        .click(formCardNameInput)
        .click(formCardNameInput)
        .waitForElementCount('contextMenuItemText', 0)
        .tabByIndex(1)
        .waitForInputText(formCardNameInput, '')
    })
  })

  describe('ad-hoc autofill', function () {
    describe('regular tab', function () {
      Brave.beforeAll(this)
      before(function * () {
        yield setup(this.app.client)
        this.formfill = Brave.server.url('formfill.html')
        yield this.app.client
          .tabByIndex(0)
          .loadUrl(this.formfill)
          .waitForVisible('<form>')
          .setValue(formFullNameInput, 'test')
          .click('#submit')
      })
      it('autofills in regular tab', function * () {
        yield this.app.client
          .tabByIndex(0)
          .waitForVisible('<form>')
          .click(formFullNameInput)
          .click(formFullNameInput)
          .windowByUrl(Brave.browserWindowUrl)
          .waitForVisible('.contextMenuItemText')
          .click('.contextMenuItemText')
          .tabByIndex(0)
          .waitForInputText(formFullNameInput, 'test')
      })
      it('autofills in private tab', function * () {
        yield this.app.client
          .windowByUrl(Brave.browserWindowUrl)
          .newTab({ url: this.formfill + '?2', isPrivate: true })
          .waitForUrl(this.formfill + '?2')
          .waitForVisible('<form>')
          .click(formFullNameInput)
          .click(formFullNameInput)
          .windowByUrl(Brave.browserWindowUrl)
          .waitForVisible('.contextMenuItemText')
          .click('.contextMenuItemText')
          .tabByIndex(0)
          .waitForInputText(formFullNameInput, 'test')
      })
    })
    describe('session tab', function () {
      Brave.beforeAll(this)
      before(function * () {
        yield setup(this.app.client)
        this.formfill = Brave.server.url('formfill.html')
        yield this.app.client
          .tabByIndex(0)
          .loadUrl(this.formfill)
          .waitForVisible('<form>')
          .setValue(formFullNameInput, 'test')
          .click('#submit')
      })
      it('autofills in regular tab', function * () {
        yield this.app.client
          .tabByIndex(0)
          .waitForVisible('<form>')
          .click(formFullNameInput)
          .click(formFullNameInput)
          .windowByUrl(Brave.browserWindowUrl)
          .waitForVisible('.contextMenuItemText')
          .click('.contextMenuItemText')
          .tabByIndex(0)
          .waitForInputText(formFullNameInput, 'test')
      })
      it('autofills in session tab', function * () {
        yield this.app.client
          .windowByUrl(Brave.browserWindowUrl)
          .newTab({ url: this.formfill + '?2', partitionNumber: 3 })
          .waitForUrl(this.formfill + '?2')
          .waitForVisible('<form>')
          .click(formFullNameInput)
          .click(formFullNameInput)
          .windowByUrl(Brave.browserWindowUrl)
          .waitForVisible('.contextMenuItemText')
          .click('.contextMenuItemText')
          .tabByIndex(1)
          .waitForInputText(formFullNameInput, 'test')
      })
    })
    describe('private tab', function () {
      Brave.beforeAll(this)
      before(function * () {
        yield setup(this.app.client)
        this.formfill = Brave.server.url('formfill.html')
        yield this.app.client
          .windowByUrl(Brave.browserWindowUrl)
          .newTab({ url: this.formfill, isPrivate: true })
          .waitForUrl(this.formfill)
          .waitForVisible('<form>')
          .setValue(formFullNameInput, 'test')
          .click('#submit')
      })
      it('does not autofill in private tab', function * () {
        yield this.app.client
          .tabByIndex(1)
          .waitForVisible('<form>')
          .click(formFullNameInput)
          .click(formFullNameInput)
          .windowByUrl(Brave.browserWindowUrl)
          .waitForElementCount('contextMenuItemText', 0)
          .tabByIndex(1)
          .waitForInputText(formFullNameInput, '')
      })
      it('does not autofill in regular tab', function * () {
        yield this.app.client
          .tabByIndex(0)
          .loadUrl(this.formfill + '?2')
          .waitForVisible('<form>')
          .click(formFullNameInput)
          .click(formFullNameInput)
          .windowByUrl(Brave.browserWindowUrl)
          .waitForElementCount('contextMenuItemText', 0)
          .tabByIndex(0)
          .waitForInputText(formFullNameInput, '')
      })
    })
    describe('clear autocomplete data', function () {
      Brave.beforeAll(this)
      before(function * () {
        yield setup(this.app.client)
        this.formfill = Brave.server.url('formfill.html')
        yield this.app.client
          .tabByIndex(0)
          .loadUrl(this.formfill)
          .waitForVisible('<form>')
          .setValue(formFullNameInput, 'test')
          .click('#submit')
      })
      it('autofills in regular tab', function * () {
        yield this.app.client
          .tabByIndex(0)
          .waitForVisible('<form>')
          .click(formFullNameInput)
          .click(formFullNameInput)
          .windowByUrl(Brave.browserWindowUrl)
          .waitForVisible('.contextMenuItemText')
          .click('.contextMenuItemText')
          .tabByIndex(0)
          .waitForInputText(formFullNameInput, 'test')
      })
      it('clear data now', function * () {
        yield this.app.client
        .tabByIndex(0)
        .loadUrl(getTargetAboutUrl('about:preferences'))
        .waitForVisible(securityTab)
        .click(securityTab)
        .waitForVisible(clearBrowsingDataButton)
        .click(clearBrowsingDataButton)
        .waitForBrowserWindow()
        .waitForVisible('[data-test-id="autocompleteDataSwitch"]')
        .click('[data-test-id="autocompleteDataSwitch"] .switchMiddle')
        .waitForVisible(clearDataButton)
        .click(clearDataButton)
      })
      it('does not autofill in regular tab', function * () {
        yield this.app.client
          .windowByUrl(Brave.browserWindowUrl)
          .newTab({ url: this.formfill })
          .waitForUrl(this.formfill)
          .waitForVisible('<form>')
          .click(formFullNameInput)
          .click(formFullNameInput)
          .windowByUrl(Brave.browserWindowUrl)
          .waitForElementCount('contextMenuItemText', 0)
          .tabByIndex(1)
          .waitForInputText(formFullNameInput, '')
      })
    })
  })
  describe('autofill context menu', function () {
    Brave.beforeEach(this)
    beforeEach(function * () {
      yield setup(this.app.client)
      this.formfill = Brave.server.url('formfill.html')
      yield this.app.client
        .tabByIndex(0)
        .loadUrl(this.formfill)
        .waitForVisible('<form>')
        .setValue(formFullNameInput, 'test')
        .click('#submit')
    })
    it('hide when scroll', function * () {
      yield this.app.client
        .tabByIndex(0)
        .waitForVisible('<form>')
        .click(formFullNameInput)
        .click(formFullNameInput)
        .windowByUrl(Brave.browserWindowUrl)
        .waitForVisible('.contextMenuItemText')
        .keys(Brave.keys.PAGEDOWN)
        .waitForElementCount('.contextMenuItemText', 0)
    })
    it('hide when new tab', function * () {
      yield this.app.client
        .tabByIndex(0)
        .waitForVisible('<form>')
        .click(formFullNameInput)
        .click(formFullNameInput)
        .windowByUrl(Brave.browserWindowUrl)
        .waitForVisible('.contextMenuItemText')
        .windowByUrl(Brave.browserWindowUrl)
        .newTab({ url: this.formfill + '?2' })
        .waitForUrl(this.formfill + '?2')
        .waitForElementCount('.contextMenuItemText', 0)
    })
  })
})
