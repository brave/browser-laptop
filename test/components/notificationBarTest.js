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
    yield this.app.client.loadUrl(notificationUrl)
      .waitForExist(notificationBar)
      .waitUntil(function () {
        return this.getText(notificationBar).then((val) => val.includes('location'))
      }).click('button=Deny')
  })

  it('can deny permission request', function * () {
    yield this.app.client.loadUrl(this.notificationUrl)
      .waitForExist(notificationBar)
      .element('.notificationItem:nth-Child(1) .notificationOptions')
      .click('button=Deny')
      .moveToObject(activeWebview)
      .waitForExist(titleBar)
      .waitUntil(function () {
        return this.getText(titleBar).then((val) => val.includes('denied'))
      })
  })

  it('can accept permission request persistently', function * () {
    yield this.app.client.loadUrl(this.notificationUrl)
      .waitForExist(notificationBar)
      .element('.notificationItem:nth-Child(1) .notificationOptions')
      .click('label*=Remember')
      .click('button=Allow')
      .moveToObject(activeWebview)
      .waitForExist(titleBar)
      .waitUntil(function () {
        return this.getText(titleBar).then((val) => val.includes('granted'))
      })
    yield this.app.client.loadUrl(Brave.newTabUrl)
    yield this.app.client.loadUrl(this.notificationUrl)
      .moveToObject(activeWebview)
      .waitForExist(titleBar)
      .waitUntil(function () {
        return this.getText(titleBar).then((val) => val.includes('granted'))
      })
  })

  it('shows notification for login form', function * () {
    yield this.app.client.loadUrl(this.loginUrl1)
      .waitForExist(notificationBar)
      .waitUntil(function () {
        return this.getText(notificationBar).then((val) => val.includes('localhost') && val.includes('brave_user'))
      })
  })

  it('does not show login notification if user turns it off for the site', function * () {
    yield this.app.client.loadUrl(this.loginUrl1)
      .waitForExist(notificationBar)
      .waitUntil(function () {
        return this.getText(notificationBar).then((val) => val.includes('localhost') && val.includes('brave_user'))
      })
      .click('button=Never for this site')
      .loadUrl(this.loginUrl2)
      .pause(2000)
      .isExisting(notificationBar).then((exists) => !exists)
  })
})
