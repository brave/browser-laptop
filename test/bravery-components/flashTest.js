/* global describe, it, before */

const Brave = require('../lib/brave')
const {notificationBar, urlInput} = require('../lib/selectors')

describe('flash install interception', function () {
  function * setup (client) {
    yield client
      .waitForBrowserWindow()
      .waitForVisible(urlInput)
      .changeSetting('security.flash.installed', true)
      .setResourceEnabled('flash', true)
      .waitUntil(function () {
        return this.getAppState().then((val) => {
          return val.value.flash.enabled === true
        })
      })
  }

  Brave.beforeAll(this)
  before(function * () {
    this.flashUrl = Brave.server.url('flash_interception.html')
    yield setup(this.app.client)
  })

  it('shows notification bar on link click', function * () {
    yield this.app.client
      .tabByIndex(0)
      .loadUrl(this.flashUrl)
      .click('#flashLink')
      .windowByUrl(Brave.browserWindowUrl)
      .waitForExist(notificationBar)
      .waitUntil(function () {
        return this.getText(notificationBar).then((val) => val.includes('run Flash Player'))
      })
      .click('button=Deny')
      .waitForElementCount('.notificationItem', 0)
  })
  it('shows notification bar on img click', function * () {
    yield this.app.client
      .tabByIndex(0)
      .loadUrl(this.flashUrl)
      .click('#flashImage')
      .windowByUrl(Brave.browserWindowUrl)
      .waitForExist(notificationBar)
      .waitUntil(function () {
        return this.getText(notificationBar).then((val) => val.includes('run Flash Player'))
      })
  })
  it('shows notification bar on nested span click', function * () {
    yield this.app.client
      .tabByIndex(0)
      .loadUrl(this.flashUrl)
      .click('#flashNestedSpan')
      .windowByUrl(Brave.browserWindowUrl)
      .waitForExist(notificationBar)
      .waitUntil(function () {
        return this.getText(notificationBar).then((val) => val.includes('run Flash Player'))
      })
  })
  it('shows flash notification bar when small element is loaded', function * () {
    const flashUrl = Brave.server.url('flash_small.html')
    yield this.app.client
      .tabByIndex(0)
      .loadUrl(flashUrl)
      .windowByUrl(Brave.browserWindowUrl)
      .waitForExist(notificationBar)
      .waitUntil(function () {
        return this.getText(notificationBar).then((val) => val.includes('run Flash Player'))
      })
  })
  it('shows flash notification bar when invisible element is loaded', function * () {
    const flashUrl = Brave.server.url('flash_invisible.html')
    yield this.app.client
      .tabByIndex(0)
      .loadUrl(flashUrl)
      .windowByUrl(Brave.browserWindowUrl)
      .waitForExist(notificationBar)
      .waitUntil(function () {
        return this.getText(notificationBar).then((val) => val.includes('run Flash Player'))
      })
  })
})
