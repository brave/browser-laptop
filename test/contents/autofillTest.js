/* global describe, it, before, beforeEach */

const Brave = require('../lib/brave')
const {urlInput, autofillAddressPanel, autofillCreditCardPanel, clearBrowsingDataButton, securityTab} = require('../lib/selectors')
const {getTargetAboutUrl} = require('../../js/lib/appUrlUtil')

const addAddressButton = '.addAddressButton'
const saveAddressButton = '.saveAddressButton'
const addCreditCardButton = '.addCreditCardButton'
const saveCreditCardButton = '.saveCreditCardButton'
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
            return val.value.autofill.addresses.guid.length === 1
          })
        })
        .tabByIndex(0)
        .loadUrl(this.autofillPreferences)
    })
    it('adds an autofill address', function * () {
      yield this.app.client
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
        .getValue('[name="04fullname"]').should.eventually.be.equal(name)
        .getValue('[name="23cellphon"]').should.eventually.be.equal(phone)
        .getValue('[name="24emailadr"]').should.eventually.be.equal(email)
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
        .getValue('[name="04fullname"]').should.eventually.be.equal(name)
        .getValue('[name="23cellphon"]').should.eventually.be.equal(phone)
        .getValue('[name="24emailadr"]').should.eventually.be.equal(email)
        // TODO(bridiver) - this needs to check all fields
    })
    it('autofills the updated address when edited', function * () {
      yield this.app.client
        // update the address
        .tabByIndex(0)
        .loadUrl(this.autofillPreferences)
        .waitForVisible('[title="Edit address"]')
        .click('[title="Edit address"]')
        .windowByUrl(Brave.browserWindowUrl)
        .waitForVisible(autofillAddressPanel)
        .click('#phone')
        .keys(Brave.keys.END)
        .keys('123')
        .click('#email')
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
        // fill out the form
        .loadUrl(this.formfill)
        .waitForVisible('<form>')
        .click('[name="04fullname"]')
        .click('[name="04fullname"]')
        .windowByUrl(Brave.browserWindowUrl)
        .waitForVisible('.contextMenuItemText')
        .click('.contextMenuItemText')
        .tabByUrl(this.formfill)
        .getValue('[name="04fullname"]').should.eventually.be.equal(name)
        .getValue('[name="23cellphon"]').should.eventually.be.equal(phone + '123')
        .getValue('[name="24emailadr"]').should.eventually.be.equal(email + 'mm')
        // TODO(bridiver) - this needs to check all fields
    })
    it('deletes the address', function * () {
      yield this.app.client
        .tabByIndex(0)
        .loadUrl(this.autofillPreferences)
        .waitForVisible('[title="Delete address"]')
        .click('[title="Delete address"]')
        .loadUrl(this.autofillPreferences)
        .waitForVisible('[data-l10n-id=noAddressesSaved]')
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
        .click('#nameOnCard')
        .keys(cardName)
        .click('#creditCardNumber')
        .keys(cardNumber)
        .selectByValue('.expMonthSelect', expMonth < 10 ? '0' + expMonth.toString() : expMonth.toString())
        .selectByValue('.expYearSelect', expYear.toString())
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
        .waitForVisible('.autofillPage')
        .getText('.creditCardName').should.eventually.be.equal(cardName)
        .getText('.creditCardNumber').should.eventually.be.equal('***' + cardNumber.slice(-4))
        .getText('.creditCardPExpirationDate').should.eventually.be.equal(
          (expMonth < 10 ? '0' + expMonth.toString() : expMonth.toString()) + '/' + expYear.toString())
    })
    it('autofills the credit card', function * () {
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
        .getValue('[name="41ccnumber"]').should.eventually.be.equal(cardNumber)
        .getValue('[name="42ccexp_mm"]').should.eventually.be.equal(expMonth.toString())
        .getValue('[name="43ccexp_yy"]').should.eventually.be.equal(expYear.toString())
    })
    it('autofills the credit card in a private tab', function * () {
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
        .getValue('[name="41ccnumber"]').should.eventually.be.equal(cardNumber)
        .getValue('[name="42ccexp_mm"]').should.eventually.be.equal(expMonth.toString())
        .getValue('[name="43ccexp_yy"]').should.eventually.be.equal(expYear.toString())
    })
    it('autofills the updated credit card when edited', function * () {
      yield this.app.client
        .tabByIndex(0)
        .loadUrl(this.autofillPreferences)
        .url(getTargetAboutUrl(this.autofillPreferences))
        .waitForVisible('[title="Edit creditCard"]')
        .click('[title="Edit creditCard"]')
        .windowByUrl(Brave.browserWindowUrl)
        .waitForVisible(autofillCreditCardPanel)
        .click('#nameOnCard')
        .keys(Brave.keys.END)
        .keys('123')
        .click('#creditCardNumber')
        .keys(Brave.keys.END)
        .keys('123')
        .selectByValue('.expMonthSelect', (expMonth + 1).toString())
        .selectByValue('.expYearSelect', (expYear + 1).toString())
        .click(saveCreditCardButton)
        .waitUntil(function () {
          return this.getAppState().then((val) => {
            return val.value.autofill.creditCards.guid.length === 1
          })
        })
        .tabByIndex(0)
        .loadUrl(this.autofillPreferences)
        .waitForVisible('.autofillPage')
        .getText('.creditCardName').should.eventually.be.equal(cardName + 123)
        .getText('.creditCardNumber').should.eventually.be.equal('***' + (cardNumber + 123).slice(-4))
        .getText('.creditCardPExpirationDate').should.eventually.be.equal(
          (expMonth + 1).toString() + '/' + (expYear + 1).toString())
        .tabByIndex(0)
        .loadUrl(this.formfill)
        .waitForVisible('<form>')
        .click('[name="41ccnumber"]')
        .click('[name="41ccnumber"]')
        .windowByUrl(Brave.browserWindowUrl)
        .waitForVisible('.contextMenuItemText')
        .click('.contextMenuItemText')
        .tabByUrl(this.formfill)
        .getValue('[name="41ccnumber"]').should.eventually.be.equal(cardNumber + '123')
        .getValue('[name="42ccexp_mm"]').should.eventually.be.equal((expMonth + 1).toString())
        .getValue('[name="43ccexp_yy"]').should.eventually.be.equal((expYear + 1).toString())
        // TODO(bridiver) this needs to check all fields
    })
    it('deletes the credit card', function * () {
      yield this.app.client
        .tabByIndex(0)
        .loadUrl(this.autofillPreferences)
        .waitForVisible('[title="Delete creditCard"]')
        .click('[title="Delete creditCard"]')
        .loadUrl(this.autofillPreferences)
        .waitForVisible('[data-l10n-id=noCreditCardsSaved]')
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
            return val.value.autofill.addresses.guid.length === 1
          })
        })
        .tabByIndex(0)
        .loadUrl(this.autofillPreferences)
        .waitForVisible(addCreditCardButton)
        .click(addCreditCardButton)
        .windowByUrl(Brave.browserWindowUrl)
        .waitForVisible(autofillCreditCardPanel)
        .click('#nameOnCard')
        .keys(cardName)
        .click('#creditCardNumber')
        .keys(cardNumber)
        .selectByValue('.expMonthSelect', expMonth < 10 ? '0' + expMonth.toString() : expMonth.toString())
        .selectByValue('.expYearSelect', expYear.toString())
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
    it('adds an autofill credit card', function * () {
      yield this.app.client
        .waitForVisible('.autofillPage')
        .getText('.creditCardName').should.eventually.be.equal(cardName)
        .getText('.creditCardNumber').should.eventually.be.equal('***' + cardNumber.slice(-4))
        .getText('.creditCardPExpirationDate').should.eventually.be.equal(
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
        .getValue('[name="04fullname"]').should.eventually.be.equal(name)
        .getValue('[name="23cellphon"]').should.eventually.be.equal(phone)
        .getValue('[name="24emailadr"]').should.eventually.be.equal(email)
        // TODO(bridiver) - this needs to check all fields
    })
    it('autofills the credit card', function * () {
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
        .getValue('[name="41ccnumber"]').should.eventually.be.equal(cardNumber)
        .getValue('[name="42ccexp_mm"]').should.eventually.be.equal(expMonth.toString())
        .getValue('[name="43ccexp_yy"]').should.eventually.be.equal(expYear.toString())
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
        .waitForVisible('.autofillDataSwitch')
        .click('.autofillDataSwitch .switchMiddle')
        .waitForVisible('.clearDataButton')
        .click('.clearDataButton')
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
        .waitForExist('contextMenuItemText', 500, true)
        .tabByIndex(1)
        .getValue('[name="04fullname"]').should.eventually.be.equal('')
        .click('[name="41ccnumber"]')
        .click('[name="41ccnumber"]')
        .waitForExist('contextMenuItemText', 500, true)
        .tabByIndex(1)
        .getValue('[name="41ccnumber"]').should.eventually.be.equal('')
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
          .getValue('[name="04fullname"]').should.eventually.be.equal('test')
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
          .getValue('[name="04fullname"]').should.eventually.be.equal('test')
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
          .getValue('[name="04fullname"]').should.eventually.be.equal('test')
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
          .getValue('[name="04fullname"]').should.eventually.be.equal('test')
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
          .waitForExist('contextMenuItemText', 500, true)
          .tabByIndex(1)
          .getValue('[name="04fullname"]').should.eventually.be.equal('')
      })
      it('does not autofill in regular tab', function * () {
        yield this.app.client
          .tabByIndex(0)
          .loadUrl(this.formfill + '?2')
          .waitForVisible('<form>')
          .click('[name="04fullname"]')
          .click('[name="04fullname"]')
          .windowByUrl(Brave.browserWindowUrl)
          .waitForExist('contextMenuItemText', 500, true)
          .tabByIndex(0)
          .getValue('[name="04fullname"]').should.eventually.be.equal('')
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
          .getValue('[name="04fullname"]').should.eventually.be.equal('test')
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
        .waitForVisible('.autocompleteDataSwitch')
        .click('.autocompleteDataSwitch .switchMiddle')
        .waitForVisible('.clearDataButton')
        .click('.clearDataButton')
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
          .waitForExist('contextMenuItemText', 500, true)
          .tabByIndex(1)
          .getValue('[name="04fullname"]').should.eventually.be.equal('')
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
        .waitForVisible('.contextMenuItemText', 1000, true)
    })
    it('hide when new tab', function * () {
      yield this.app.client
        .tabByIndex(0)
        .waitForVisible('<form>')
        .click('[name="04fullname"]')
        .click('[name="04fullname"]')
        .windowByUrl(Brave.browserWindowUrl)
        .waitForVisible('.contextMenuItemText')
        .newTab({ url: this.formfill + '?2' })
        .waitForVisible('.contextMenuItemText', 1000, true)
    })
  })
})
