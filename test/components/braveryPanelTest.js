/* global describe, it, before, beforeEach */

const Brave = require('../lib/brave')
const {urlInput, braveMenu, braveMenuDisabled, adsBlockedStat, braveryPanel, httpsEverywhereStat, noScriptStat, noScriptSwitch, fpSwitch, fpStat, noScriptNavButton} = require('../lib/selectors')

describe('Bravery Panel', function () {
  function * setup (client) {
    yield client
      .waitUntilWindowLoaded()
      .waitForUrl(Brave.newTabUrl)
      .waitForBrowserWindow()
      .waitForVisible('#window')
      .waitForVisible(urlInput)
  }

  function * openBraveMenu (client) {
    return client
      .windowByUrl(Brave.browserWindowUrl)
      .waitForVisible(braveMenu)
      .click(braveMenu)
      .waitForVisible(braveryPanel)
  }

  function * waitForDataFile (client, dataFile) {
    return client.waitUntil(function () {
      return this.getAppState().then((val) =>
        val.value[dataFile].etag && val.value[dataFile].etag.length > 0)
    })
  }

  describe('General', function () {
    Brave.beforeAll(this)
    before(function * () {
      yield setup(this.app.client)
    })
    it('shows disabled brave button for about:newpage', function * () {
      yield this.app.client.waitForVisible(braveMenuDisabled)
    })
    it('shows brave button (not disabled) for normal pages', function * () {
      const page1Url = Brave.server.url('page1.html')
      yield this.app.client
        .tabByIndex(0)
        .loadUrl(page1Url)
        .windowByUrl(Brave.browserWindowUrl)
        .waitForVisible(braveMenu)
    })
  })
  describe('Stats', function () {
    Brave.beforeEach(this)
    beforeEach(function * () {
      yield setup(this.app.client)
    })
    it('detects blocked elements', function * () {
      yield waitForDataFile(this.app.client, 'trackingProtection')
      const url = Brave.server.url('tracking.html')
      yield this.app.client
        .tabByIndex(0)
        .loadUrl(url)
      yield openBraveMenu(this.app.client)
      yield this.app.client
        .waitUntil(function () {
          return this.getText(adsBlockedStat)
            .then((blocked) => blocked === '2')
        })
    })
    it('detects adblock elements', function * () {
      yield waitForDataFile(this.app.client, 'adblock')
      const url = Brave.server.url('adblock.html')
      yield this.app.client
        .tabByIndex(0)
        .loadUrl(url)
      yield openBraveMenu(this.app.client)
      yield this.app.client
        .waitUntil(function () {
          return this.getText(adsBlockedStat)
            .then((blocked) => blocked === '1')
        })
    })
    it('detects https upgrades', function * () {
      yield waitForDataFile(this.app.client, 'httpsEverywhere')
      const url = Brave.server.url('httpsEverywhere.html')
      yield this.app.client
        .tabByIndex(0)
        .loadUrl(url)
      yield openBraveMenu(this.app.client)
      yield this.app.client
        .waitUntil(function () {
          return this.getText(httpsEverywhereStat)
            .then((upgraded) => upgraded === '1')
        })
    })
    it('blocks scripts', function * () {
      const url = Brave.server.url('scriptBlock.html')
      yield this.app.client
        .tabByIndex(0)
        .loadUrl(url)
        .waitUntil(function () {
          return this.getText('body')
            .then((body) => body === 'test1 test2')
        })
      yield openBraveMenu(this.app.client)
      yield this.app.client
        .click(noScriptSwitch)
        .waitForVisible(noScriptNavButton)
        .waitUntil(function () {
          return this.getText(noScriptStat)
            .then((stat) => stat === '2')
        })
    })
    it('shows noscript tag content', function * () {
      const url = Brave.server.url('scriptBlock.html')
      yield this.app.client
        .tabByIndex(0)
        .loadUrl(url)
        .waitUntil(function () {
          return this.getElementSize('noscript')
            .then((size) => size.height === 0 && size.width === 0)
        })
      yield openBraveMenu(this.app.client)
      yield this.app.client
        .click(noScriptSwitch)
        .tabByIndex(0)
        .loadUrl(url)
        .waitUntil(function () {
          // getText returns empty in this case
          return this.getElementSize('noscript')
            .then((size) => size.height > 0)
        })
    })
    it('blocks fingerprinting', function * () {
      const url = Brave.server.url('fingerprinting.html')
      yield this.app.client
        .tabByIndex(0)
        .loadUrl(url)
      yield openBraveMenu(this.app.client)
      yield this.app.client
        .click(fpSwitch)
        .waitUntil(function () {
          return this.getText(fpStat)
            .then((stat) => stat === '3')
        })
    })
    it('allows fingerprinting when setting is off', function * () {
      const url = Brave.server.url('fingerprinting.html')
      yield this.app.client
        .tabByIndex(0)
        .loadUrl(url)
        .waitUntil(function () {
          return this.getText('body')
            .then((text) => text === 'fingerprinting test')
        })
      yield openBraveMenu(this.app.client)
      this.app.client
        .waitUntil(function () {
          return this.getText(fpStat)
            .then((stat) => stat === '0')
        })
    })
  })
})
