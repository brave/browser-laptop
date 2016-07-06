/* global describe, it, before */

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
    yield setup(this.app.client)
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
  })

  it('can accept permission request persistently', function * () {
    yield this.app.client
      .tabByIndex(0)
      .loadUrl(this.notificationUrl)
      .windowByUrl(Brave.browserWindowUrl)
      .waitForExist(notificationBar)
      .waitForExist(notificationBar)
      .element('.notificationItem:nth-Child(1) .notificationOptions')
      .click('[data-l10n-id=rememberDecision]')
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

  // https://travis-ci.org/brave/browser-laptop/builds/132700770
  it.skip('shows notification for login form', function * () {
    yield this.app.client
      .tabByIndex(0)
      .loadUrl(this.loginUrl1)
      .windowByUrl(Brave.browserWindowUrl)
      .waitForExist(notificationBar)
      .waitUntil(function () {
        return this.getText(notificationBar).then((val) => val.includes('localhost') && val.includes('brave_user'))
      })
  })

  // https://travis-ci.org/brave/browser-laptop/builds/132700770
  it.skip('does not show login notification if user turns it off for the site', function * () {
    yield this.app.client
      .tabByIndex(0)
      .loadUrl(this.loginUrl1)
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
