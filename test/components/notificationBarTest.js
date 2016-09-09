/* global describe, it, before, beforeEach */

const Brave = require('../lib/brave')
const {activeWebview, notificationBar, titleBar, urlInput} = require('../lib/selectors')

describe('notificationBar', function () {
  function * setup (client) {
    yield client
      .waitUntilWindowLoaded()
      .waitForBrowserWindow()
      .waitForVisible('#window')
      .waitForVisible(urlInput)
  }

  Brave.beforeAll(this)
  before(function * () {
    this.notificationUrl = Brave.server.url('notification.html')
    this.loginUrl1 = Brave.server.url('login1.html')
    this.loginUrl2 = Brave.server.url('login2.html')
    this.loginUrl3 = Brave.server.url('login3.html')
    this.loginUrl4 = Brave.server.url('login4.html')
    this.loginUrl5 = Brave.server.url('login5.html')
    yield setup(this.app.client)
  })

  beforeEach(function * () {
    yield this.app.client
      .waitForExist('.notificationItem', undefined, true)
  })

  it('shows notification bar for geolocation', function * () {
    let notificationUrl = Brave.server.url('geolocation.html')
    yield this.app.client
      .tabByIndex(0)
      .loadUrl(notificationUrl)
      .windowByUrl(Brave.browserWindowUrl)
      .waitForExist(notificationBar)
      .waitUntil(function () {
        return this.getText(notificationBar).then((val) => val.includes('location'))
      }).click('button=Deny')
  })

  it('can deny permission request', function * () {
    yield this.app.client
      .tabByIndex(0)
      .loadUrl(this.notificationUrl)
      .windowByUrl(Brave.browserWindowUrl)
      .waitForExist(notificationBar)
      .element('.notificationItem:nth-Child(1) .notificationOptions')
      .click('button=Deny')
      .moveToObject(activeWebview)
      .waitForExist(titleBar)
      .waitUntil(function () {
        return this.getText(titleBar).then((val) => val.includes('denied'))
      })
  })

  it('does not show the same notification twice', function * () {
    let notificationUrl = Brave.server.url('double-notification.html')
    yield this.app.client
      .tabByIndex(0)
      .loadUrl(notificationUrl)
      .windowByUrl(Brave.browserWindowUrl)
      .waitForExist('.notificationItem:nth-child(2)')
      .waitUntil(function () {
        return this.getText('.notificationItem:last-child').then((val) => val.includes('notification'))
      })
      .click('button=Deny')
      .click('button=Deny')
  })

  it('can accept permission request persistently', function * () {
    yield this.app.client
      .tabByIndex(0)
      .loadUrl(this.notificationUrl)
      .windowByUrl(Brave.browserWindowUrl)
      .waitForExist(notificationBar)
      .waitForExist('[data-l10n-id=rememberDecision]')
      .click('[data-l10n-id=rememberDecision]')
      .waitForExist('button=Allow')
      .click('button=Allow')
      .moveToObject(activeWebview)
      .waitForExist(titleBar)
      .waitUntil(function () {
        return this.getText(titleBar).then((val) => val.includes('granted'))
      })
    yield this.app.client
      .tabByIndex(0)
      .loadUrl(Brave.newTabUrl)
    yield this.app.client
      .loadUrl(this.notificationUrl)
      .windowByUrl(Brave.browserWindowUrl)
      .moveToObject(activeWebview)
      .waitForExist(titleBar)
      .waitUntil(function () {
        return this.getText(titleBar).then((val) => val.includes('granted'))
      })
  })

  it('shows notification for login form', function * () {
    yield this.app.client
      .tabByIndex(0)
      .loadUrl(this.loginUrl1)
      .windowByUrl(Brave.browserWindowUrl)
      .waitForExist(notificationBar)
      .waitUntil(function () {
        return this.getText(notificationBar).then((val) => val.includes('localhost') && val.includes('brave_user'))
      }).click('button=No')
  })

  it('autofills remembered password on login form', function * () {
    yield this.app.client
      .tabByIndex(0)
      .loadUrl(this.loginUrl1)
      .windowByUrl(Brave.browserWindowUrl)
      .waitForExist(notificationBar)
      .waitUntil(function () {
        return this.getText(notificationBar).then((val) => val.includes('localhost') && val.includes('brave_user'))
      }).click('button=Yes')
      .tabByIndex(0)
      .loadUrl('about:passwords')
      .waitForExist('tr.passwordItem')
      .windowByUrl(Brave.browserWindowUrl)
      .tabByIndex(0)
      .loadUrl(this.loginUrl4)
      .waitUntil(function () {
        return this.getValue('#user').then((val) => val === 'brave_user') &&
          this.getValue('#password').then((val) => val === 'testing') &&
          this.getValue('#user2').then((val) => val === '') &&
          this.getValue('#password2').then((val) => val === '')
      })
  })

  it('autofills remembered password on login page with multiple forms', function * () {
    yield this.app.client
      .tabByIndex(0)
      .loadUrl(this.loginUrl1)
      .windowByUrl(Brave.browserWindowUrl)
      .tabByIndex(0)
      .loadUrl(this.loginUrl5)
      .waitUntil(function () {
        return this.getValue('#user').then((val) => val === 'brave_user') &&
          this.getValue('#password').then((val) => val === 'testing') &&
          this.getValue('#user2').then((val) => val === 'brave_user') &&
          this.getValue('#password2').then((val) => val === 'testing')
      })
  })

  it('does not show login form notification if user turns it off for the site', function * () {
    yield this.app.client
      .tabByIndex(0)
      .loadUrl(this.loginUrl3)
      .windowByUrl(Brave.browserWindowUrl)
      .waitForExist(notificationBar)
      .waitUntil(function () {
        return this.getText(notificationBar).then((val) => val.includes('localhost') && val.includes('brave_user'))
      })
      .click('button=Never for this site')
      .tabByIndex(0)
      .loadUrl(this.loginUrl2)
      .windowByUrl(Brave.browserWindowUrl)
      .isExisting(notificationBar).should.eventually.be.false
  })
})
