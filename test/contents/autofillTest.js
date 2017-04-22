/* global describe, it, before, beforeEach */

const Brave = require('../lib/brave')
const {urlInput, autofillAddressPanel, autofillCreditCardPanel, clearBrowsingDataButton, clearDataButton, securityTab} = require('../lib/selectors')
const {getTargetAboutUrl} = require('../../js/lib/appUrlUtil')

const addAddressButton = '[data-test-id="addAddressButton"]'
const saveAddressButton = '[data-test-id="saveAddressButton"]'
const addCreditCardButton = '[data-test-id="addCreditCardButton"]'
const saveCreditCardButton = '[data-test-id="saveCreditCardButton"]'
const name = 'Brave Lion'
const organization = 'Brave'
const streetAddress = '1161 Mission Street, #401'
const city = 'San Francisco'
const state = 'CA'
const postalCode = '94103-1550'
const country = 'US'
const phone = '0987654321'
const email = 'press@brave.com'
const cardName = 'Test Card'
const cardNumber = '1234567890'
const expMonth = 9
const expYear = new Date().getFullYear() + 2

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
        .click('[data-test-id="nameOnAddress"]')
        .keys(name)
        .click('[data-test-id="organization"]')
        .keys(organization)
        .click('[data-test-id="streetAddress"]')
        .keys(streetAddress)
        .click('[data-test-id="city"]')
        .keys(city)
        .click('[data-test-id="state"]')
        .keys(state)
        .click('[data-test-id="postalCode"]')
        .keys(postalCode)
        .click('[data-test-id="country"]')
        .keys(country)
        .click('[data-test-id="phone"]')
        .keys(phone)
        .click('[data-test-id="email"]')
        .keys(email)
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
        .waitForTextValue('[data-test-id="organization"]', organization)
        .waitForTextValue('[data-test-id="streetAddress"]', streetAddress)
        .waitForTextValue('[data-test-id="city"]', city)
        .waitForTextValue('[data-test-id="state"]', state)
        .waitForTextValue('[data-test-id="postalCode"]', postalCode)
        .waitForTextValue('[data-test-id="country"]', country)
        .waitForTextValue('[data-test-id="phone"]', phone)
        .waitForTextValue('[data-test-id="email"]', email)
    })
    it('autofills the address', function * () {
      yield this.app.client
        .tabByIndex(0)
        .loadUrl(this.formfill)
        .waitForVisible('<form>')
        .click('[name="04fullname"]')
        .click('[name="04fullname"]')
        .windowByUrl(Brave.browserWindowUrl)
        .waitForVisible('.contextMenuItemText')
        .click('.contextMenuItemText')
        .tabByUrl(this.formfill)
        .waitForInputText('[name="04fullname"]', name)
        .waitForInputText('[name="23cellphon"]', phone)
        .waitForInputText('[name="24emailadr"]', email)
        // TODO(bridiver) - this needs to check all fields
    })
    it('autofills the address in a private tab', function * () {
      yield this.app.client
        .windowByUrl(Brave.browserWindowUrl)
        .newTab({ url: this.formfill + '?2', isPrivate: true })
        .waitForUrl(this.formfill + '?2')
        .waitForVisible('<form>')
        .click('[name="04fullname"]')
        .click('[name="04fullname"]')
        .windowByUrl(Brave.browserWindowUrl)
        .waitForVisible('.contextMenuItemText')
        .click('.contextMenuItemText')
        .tabByUrl(this.formfill)
        .waitForInputText('[name="04fullname"]', name)
        .waitForInputText('[name="23cellphon"]', phone)
        .waitForInputText('[name="24emailadr"]', email)
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
        .click('[data-test-id="phone"]')
        .keys(Brave.keys.END)
        .keys('123')
        .click('[data-test-id="email"]')
        .keys(Brave.keys.END)
        .keys('mm')
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
        .waitForTextValue('[data-test-id="organization"]', organization)
        .waitForTextValue('[data-test-id="streetAddress"]', streetAddress)
        .waitForTextValue('[data-test-id="city"]', city)
        .waitForTextValue('[data-test-id="state"]', state)
        .waitForTextValue('[data-test-id="postalCode"]', postalCode)
        .waitForTextValue('[data-test-id="country"]', country)
        .waitForTextValue('[data-test-id="phone"]', phone + '123')
        .waitForTextValue('[data-test-id="email"]', email + 'mm')
        // fill out the form
        .loadUrl(this.formfill)
        .waitForVisible('<form>')
        .click('[name="04fullname"]')
        .click('[name="04fullname"]')
        .windowByUrl(Brave.browserWindowUrl)
        .waitForVisible('.contextMenuItemText')
        .click('.contextMenuItemText')
        .tabByUrl(this.formfill)
        .waitForInputText('[name="04fullname"]', name)
        .waitForInputText('[name="23cellphon"]', phone + '123')
        .waitForInputText('[name="24emailadr"]', email + 'mm')
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

      yield this.app.client
        .tabByIndex(0)
        .loadUrl(this.autofillPreferences)
        .waitForVisible(addCreditCardButton)
        .click(addCreditCardButton)
        .windowByUrl(Brave.browserWindowUrl)
        .waitForVisible(autofillCreditCardPanel)
        .click('[data-test-id="creditCardNameWrapper"]')
        .keys(cardName)
        .click('[data-test-id="creditCardNumberWrapper"]')
        .keys(cardNumber)
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
        .waitForTextValue('[data-test-id="creditCardName"]', cardName)
        .waitForTextValue('[data-test-id="creditCardNumber"]', '***' + cardNumber.slice(-4))
        .waitForTextValue('[data-test-id="creditCardPExpirationDate"]',
          (expMonth < 10 ? '0' + expMonth.toString() : expMonth.toString()) + '/' + expYear.toString())
    })
    it.skip('autofills the credit card', function * () {
      yield this.app.client
        .tabByIndex(0)
        .loadUrl(this.formfill)
        .waitForVisible('<form>')
        .click('[name="41ccnumber"]')
        .click('[name="41ccnumber"]')
        .windowByUrl(Brave.browserWindowUrl)
        .waitForVisible('.contextMenuItemText')
        .click('.contextMenuItemText')
        .tabByUrl(this.formfill)
        .waitForInputText('[name="41ccnumber"]', cardNumber)
        .waitForInputText('[name="42ccexp_mm"]', expMonth.toString())
        .waitForInputText('[name="43ccexp_yy"]', expYear.toString())
    })
    it.skip('autofills the credit card in a private tab', function * () {
      yield this.app.client
        .windowByUrl(Brave.browserWindowUrl)
        .newTab({ url: this.formfill + '?2', isPrivate: true })
        .waitForUrl(this.formfill + '?2')
        .waitForVisible('<form>')
        .click('[name="41ccnumber"]')
        .click('[name="41ccnumber"]')
        .windowByUrl(Brave.browserWindowUrl)
        .waitForVisible('.contextMenuItemText')
        .click('.contextMenuItemText')
        .tabByUrl(this.formfill)
        .waitForInputText('[name="41ccnumber"]', cardNumber)
        .waitForInputText('[name="42ccexp_mm"]', expMonth.toString())
        .waitForInputText('[name="43ccexp_yy"]', expYear.toString())
    })
    it.skip('autofills the updated credit card when edited', function * () {
      yield this.app.client
        .tabByIndex(0)
        .loadUrl(this.autofillPreferences)
        .url(getTargetAboutUrl(this.autofillPreferences))
        .waitForVisible('[data-test-id="EditCreditCard"]')
        .click('[data-test-id="EditCreditCard"]')
        .windowByUrl(Brave.browserWindowUrl)
        .waitForVisible(autofillCreditCardPanel)
        .click('[data-test-id="creditCardNameWrapper"]')
        .keys(Brave.keys.END)
        .keys('123')
        .click('[data-test-id="creditCardNumberWrapper"]')
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
        .waitForTextValue('[data-test-id="creditCardName"]', cardName + 123)
        .waitForTextValue('[data-test-id="creditCardNumber"]', '***' + (cardNumber + 123).slice(-4))
        .waitForTextValue('[data-test-id="creditCardPExpirationDate"]', (expMonth + 1).toString() + '/' + (expYear + 1).toString())
        .tabByIndex(0)
        .loadUrl(this.formfill)
        .waitForVisible('<form>')
        .click('[name="41ccnumber"]')
        .click('[name="41ccnumber"]')
        .windowByUrl(Brave.browserWindowUrl)
        .waitForVisible('.contextMenuItemText')
        .click('.contextMenuItemText')
        .tabByUrl(this.formfill)
        .waitForInputText('[name="41ccnumber"]', cardNumber + '123')
        .waitForInputText('[name="42ccexp_mm"]', (expMonth + 1).toString())
        .waitForInputText('[name="43ccexp_yy"]', (expYear + 1).toString())
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

      yield this.app.client
        .tabByIndex(0)
        .loadUrl(this.autofillPreferences)
        .waitForVisible(addAddressButton)
        .click(addAddressButton)
        .windowByUrl(Brave.browserWindowUrl)
        .waitForVisible(autofillAddressPanel)
        .click('[data-test-id="nameOnAddress"]')
        .keys(name)
        .click('[data-test-id="organization"]')
        .keys(organization)
        .click('[data-test-id="streetAddress"]')
        .keys(streetAddress)
        .click('[data-test-id="city"]')
        .keys(city)
        .click('[data-test-id="state"]')
        .keys(state)
        .click('[data-test-id="postalCode"]')
        .keys(postalCode)
        .click('[data-test-id="country"]')
        .keys(country)
        .click('[data-test-id="phone"]')
        .keys(phone)
        .click('[data-test-id="email"]')
        .keys(email)
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
        .click('[data-test-id="creditCardNameWrapper"]')
        .keys(cardName)
        .click('[data-test-id="creditCardNumberWrapper"]')
        .keys(cardNumber)
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
        .waitForTextValue('[data-test-id="organization"]', organization)
        .waitForTextValue('[data-test-id="streetAddress"]', streetAddress)
        .waitForTextValue('[data-test-id="city"]', city)
        .waitForTextValue('[data-test-id="state"]', state)
        .waitForTextValue('[data-test-id="postalCode"]', postalCode)
        .waitForTextValue('[data-test-id="country"]', country)
        .waitForTextValue('[data-test-id="phone"]', phone)
        .waitForTextValue('[data-test-id="email"]', email)
    })
    it('adds an autofill credit card', function * () {
      yield this.app.client
        .waitForVisible('[data-test-id="autofillPage"]')
        .waitForTextValue('[data-test-id="creditCardName"]', cardName)
        .waitForTextValue('[data-test-id="creditCardNumber"]', '***' + cardNumber.slice(-4))
        .waitForTextValue('[data-test-id="creditCardPExpirationDate"]',
          (expMonth < 10 ? '0' + expMonth.toString() : expMonth.toString()) + '/' + expYear.toString())
    })
    it('autofills the address', function * () {
      yield this.app.client
        .tabByIndex(0)
        .loadUrl(this.formfill)
        .waitForVisible('<form>')
        .click('[name="04fullname"]')
        .click('[name="04fullname"]')
        .windowByUrl(Brave.browserWindowUrl)
        .waitForVisible('.contextMenuItemText')
        .click('.contextMenuItemText')
        .tabByUrl(this.formfill)
        .waitForInputText('[name="04fullname"]', name)
        .waitForInputText('[name="23cellphon"]', phone)
        .waitForInputText('[name="24emailadr"]', email)
        // TODO(bridiver) - this needs to check all fields
    })
    it.skip('autofills the credit card', function * () {
      yield this.app.client
        .tabByIndex(0)
        .loadUrl(this.formfill)
        .waitForVisible('<form>')
        .click('[name="41ccnumber"]')
        .click('[name="41ccnumber"]')
        .windowByUrl(Brave.browserWindowUrl)
        .waitForVisible('.contextMenuItemText')
        .click('.contextMenuItemText')
        .tabByUrl(this.formfill)
        .waitForInputText('[name="41ccnumber"]', cardNumber)
        .waitForInputText('[name="42ccexp_mm"]', expMonth.toString())
        .waitForInputText('[name="43ccexp_yy"]', expYear.toString())
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
        .click('[name="04fullname"]')
        .click('[name="04fullname"]')
        .windowByUrl(Brave.browserWindowUrl)
        .waitForElementCount('contextMenuItemText', 0)
        .tabByIndex(1)
        .waitForInputText('[name="04fullname"]', '')
        .click('[name="41ccnumber"]')
        .click('[name="41ccnumber"]')
        .waitForElementCount('contextMenuItemText', 0)
        .tabByIndex(1)
        .waitForInputText('[name="41ccnumber"]', '')
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
          .setValue('[name="04fullname"]', 'test')
          .click('#submit')
      })
      it('autofills in regular tab', function * () {
        yield this.app.client
          .tabByIndex(0)
          .waitForVisible('<form>')
          .click('[name="04fullname"]')
          .click('[name="04fullname"]')
          .windowByUrl(Brave.browserWindowUrl)
          .waitForVisible('.contextMenuItemText')
          .click('.contextMenuItemText')
          .tabByIndex(0)
          .waitForInputText('[name="04fullname"]', 'test')
      })
      it('autofills in private tab', function * () {
        yield this.app.client
          .windowByUrl(Brave.browserWindowUrl)
          .newTab({ url: this.formfill + '?2', isPrivate: true })
          .waitForUrl(this.formfill + '?2')
          .waitForVisible('<form>')
          .click('[name="04fullname"]')
          .click('[name="04fullname"]')
          .windowByUrl(Brave.browserWindowUrl)
          .waitForVisible('.contextMenuItemText')
          .click('.contextMenuItemText')
          .tabByIndex(0)
          .waitForInputText('[name="04fullname"]', 'test')
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
          .setValue('[name="04fullname"]', 'test')
          .click('#submit')
      })
      it('autofills in regular tab', function * () {
        yield this.app.client
          .tabByIndex(0)
          .waitForVisible('<form>')
          .click('[name="04fullname"]')
          .click('[name="04fullname"]')
          .windowByUrl(Brave.browserWindowUrl)
          .waitForVisible('.contextMenuItemText')
          .click('.contextMenuItemText')
          .tabByIndex(0)
          .waitForInputText('[name="04fullname"]', 'test')
      })
      it('autofills in session tab', function * () {
        yield this.app.client
          .windowByUrl(Brave.browserWindowUrl)
          .newTab({ url: this.formfill + '?2', partitionNumber: 3 })
          .waitForUrl(this.formfill + '?2')
          .waitForVisible('<form>')
          .click('[name="04fullname"]')
          .click('[name="04fullname"]')
          .windowByUrl(Brave.browserWindowUrl)
          .waitForVisible('.contextMenuItemText')
          .click('.contextMenuItemText')
          .tabByIndex(1)
          .waitForInputText('[name="04fullname"]', 'test')
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
          .setValue('[name="04fullname"]', 'test')
          .click('#submit')
      })
      it('does not autofill in private tab', function * () {
        yield this.app.client
          .tabByIndex(1)
          .waitForVisible('<form>')
          .click('[name="04fullname"]')
          .click('[name="04fullname"]')
          .windowByUrl(Brave.browserWindowUrl)
          .waitForElementCount('contextMenuItemText', 0)
          .tabByIndex(1)
          .waitForInputText('[name="04fullname"]', '')
      })
      it('does not autofill in regular tab', function * () {
        yield this.app.client
          .tabByIndex(0)
          .loadUrl(this.formfill + '?2')
          .waitForVisible('<form>')
          .click('[name="04fullname"]')
          .click('[name="04fullname"]')
          .windowByUrl(Brave.browserWindowUrl)
          .waitForElementCount('contextMenuItemText', 0)
          .tabByIndex(0)
          .waitForInputText('[name="04fullname"]', '')
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
          .setValue('[name="04fullname"]', 'test')
          .click('#submit')
      })
      it('autofills in regular tab', function * () {
        yield this.app.client
          .tabByIndex(0)
          .waitForVisible('<form>')
          .click('[name="04fullname"]')
          .click('[name="04fullname"]')
          .windowByUrl(Brave.browserWindowUrl)
          .waitForVisible('.contextMenuItemText')
          .click('.contextMenuItemText')
          .tabByIndex(0)
          .waitForInputText('[name="04fullname"]', 'test')
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
          .click('[name="04fullname"]')
          .click('[name="04fullname"]')
          .windowByUrl(Brave.browserWindowUrl)
          .waitForElementCount('contextMenuItemText', 0)
          .tabByIndex(1)
          .waitForInputText('[name="04fullname"]', '')
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
        .setValue('[name="04fullname"]', 'test')
        .click('#submit')
    })
    it('hide when scroll', function * () {
      yield this.app.client
        .tabByIndex(0)
        .waitForVisible('<form>')
        .click('[name="04fullname"]')
        .click('[name="04fullname"]')
        .windowByUrl(Brave.browserWindowUrl)
        .waitForVisible('.contextMenuItemText')
        .keys(Brave.keys.PAGEDOWN)
        .waitForElementCount('.contextMenuItemText', 0)
    })
    it('hide when new tab', function * () {
      yield this.app.client
        .tabByIndex(0)
        .waitForVisible('<form>')
        .click('[name="04fullname"]')
        .click('[name="04fullname"]')
        .windowByUrl(Brave.browserWindowUrl)
        .waitForVisible('.contextMenuItemText')
        .windowByUrl(Brave.browserWindowUrl)
        .newTab({ url: this.formfill + '?2' })
        .waitForUrl(this.formfill + '?2')
        .waitForElementCount('.contextMenuItemText', 0)
    })
  })
})
