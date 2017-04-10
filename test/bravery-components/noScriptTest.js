/* global describe, it, beforeEach, before, after */

const Brave = require('../lib/brave')
const appConfig = require('../../js/constants/appConfig')
const assert = require('assert')
const {urlInput, noScriptNavButton, noScriptInfo, noScriptAllowTempButton, noScriptAllowOnceButton} = require('../lib/selectors')

const result = '#result'

function * setup (client) {
  yield client
    .waitForUrl(Brave.newTabUrl)
    .waitForBrowserWindow()
    .waitForVisible(urlInput)
    .setResourceEnabled(appConfig.resourceNames.NOSCRIPT, true)
}

function * setupBrave (client) {
  Brave.addCommands()
}

describe('noscript info', function () {
  Brave.beforeEach(this)

  beforeEach(function * () {
    this.url = Brave.server.url('noscript.html')
    yield setup(this.app.client)
  })

  it('can selectively allow scripts', function * () {
    yield this.app.client
      .tabByIndex(0)
      .loadUrl(this.url)
      .waitForTextValue(result, '0')
      .windowByUrl(Brave.browserWindowUrl)
      .waitForVisible(noScriptNavButton)
      .click(noScriptNavButton)
      .waitForVisible(noScriptInfo)
      .waitUntil(function () {
        return this.getText('.blockedOriginsList')
          .then((text) => {
            return text.includes('https://cdnjs.cloudflare.com') && text.includes('http://localhost:')
          })
      })
      .click('[for="checkbox-for-https://cdnjs.cloudflare.com"]') // keep blocking cloudflare
      .waitForVisible(noScriptAllowTempButton)
      .click(noScriptAllowTempButton)
      .tabByIndex(0)
      .loadUrl(this.url)
      .waitForTextValue(result, '1')
      .windowByUrl(Brave.browserWindowUrl)
      .waitForVisible(noScriptNavButton)
      .click(noScriptNavButton)
      .waitForVisible(noScriptInfo)
      .waitUntil(function () {
        return this.getText('.blockedOriginsList')
          .then((text) => {
            return text.includes('https://cdnjs.cloudflare.com') && !text.includes('http://localhost:')
          })
      })
      .click(noScriptAllowOnceButton) // unblock cloudflare
      .tabByIndex(0)
      .loadUrl(this.url)
      .waitForTextValue(result, '2')
  })

  it('only shows allow once in private tab', function * () {
    yield this.app.client
      .newTab({ url: this.url, isPrivate: true })
      .waitForTabCount(2)
      .windowByUrl(Brave.browserWindowUrl)
      .waitForVisible(noScriptNavButton)
      .click(noScriptNavButton)
      .waitForVisible(noScriptAllowOnceButton)
      .isExisting(noScriptAllowTempButton).then((isExisting) => assert(!isExisting))
      .click(noScriptAllowOnceButton)
      .tabByIndex(1)
      .loadUrl(this.url)
      .waitForTextValue(result, '2')
  })
})

describe('noscript', function () {
  Brave.beforeAllServerSetup(this)

  before(function * () {
    this.url = Brave.server.url('noscript.html')
    yield Brave.startApp()
    yield setupBrave(Brave.app.client)
    yield setup(Brave.app.client)
  })

  it('can allow scripts when the url host is an ipv4 address', function * () {
    const host = '127.0.0.1'
    const modifiedUrl = this.url.replace('localhost', host)
    yield Brave.app.client
      .tabByIndex(0)
      .loadUrl(modifiedUrl)
      .waitForTextValue(result, '0')
      .windowByUrl(Brave.browserWindowUrl)
      .waitForVisible(noScriptNavButton)
      .click(noScriptNavButton)
      .waitForVisible(noScriptInfo)
      .waitUntil(function () {
        return this.getText('.blockedOriginsList')
          .then((text) => { return text.includes('http://' + host + ':') })
      })
      .waitForVisible(noScriptAllowOnceButton)
      .click(noScriptAllowOnceButton) // unblock cloudflare
      .tabByIndex(0)
      .loadUrl(modifiedUrl)
      .waitForTextValue(result, '2')
  })

  it('can allow scripts when the url host is an ipv6 address', function * () {
    const host = '[::1]'
    const modifiedUrl = this.url.replace('localhost', host)

    if (process.env.TRAVIS) {
      this.skip()
    } else {
      yield Brave.app.client
        .tabByIndex(0)
        .loadUrl(modifiedUrl)
        .waitForTextValue(result, '0')
        .windowByUrl(Brave.browserWindowUrl)
        .waitForVisible(noScriptNavButton)
        .click(noScriptNavButton)
        .waitForVisible(noScriptInfo)
        .waitUntil(function () {
          return this.getText('.blockedOriginsList')
            .then((text) => { return text.includes('http://' + host + ':') })
        })
        .waitForVisible(noScriptAllowOnceButton)
        .click(noScriptAllowOnceButton) // unblock cloudflare
        .tabByIndex(0)
        .loadUrl(modifiedUrl)
        .waitForTextValue(result, '2')
    }
  })

  after(function * () {
    yield Brave.stopApp()
  })
})
