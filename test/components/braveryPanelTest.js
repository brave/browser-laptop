/* global describe, it, before */

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
      .waitForUrl(Brave.newTabUrl)
      .windowByUrl(Brave.browserWindowUrl)
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
        .url(page1Url)
        .windowByUrl(Brave.browserWindowUrl)
        .waitForVisible(braveMenu)
    })
  })
  describe('Stats', function () {
    Brave.beforeAll(this)
    before(function * () {
      yield setup(this.app.client)
    })
    it('detects blocked elements', function * () {
      const url = Brave.server.url('tracking.html')
      yield this.app.client
        .tabByIndex(0)
        .loadUrl(url)
        .url(url)
        .windowByUrl(Brave.browserWindowUrl)
        .waitForVisible(braveMenu)
        .click(braveMenu)
        .waitForVisible(braveryPanel)
        .waitUntil(function () {
          return this.getText(adsBlockedStat)
            .then((blocked) => blocked === '2')
        })
    })
    it('detects adblock elements', function * () {
      const url = Brave.server.url('adblock.html')
      yield this.app.client
        .tabByIndex(0)
        .loadUrl(url)
        .url(url)
        .windowByUrl(Brave.browserWindowUrl)
        .waitForVisible(braveMenu)
        .waitForVisible(braveryPanel)
        .waitUntil(function () {
          return this.getText(adsBlockedStat)
            .then((blocked) => blocked === '1')
        })
    })
    it('detects https upgrades', function * () {
      const url = Brave.server.url('httpsEverywhere.html')
      yield this.app.client
        .tabByIndex(0)
        .loadUrl(url)
        .url(url)
        .windowByUrl(Brave.browserWindowUrl)
        .waitForVisible(braveMenu)
        .waitForVisible(braveryPanel)
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
        .url(url)
        .windowByUrl(Brave.browserWindowUrl)
        .waitForVisible(braveMenu)
        .waitForVisible(braveryPanel)
        .click(noScriptSwitch)
        .waitForVisible(noScriptNavButton)
        .waitUntil(function () {
          return this.getText(noScriptStat)
            .then((stat) => stat === '2')
        })
        .click(noScriptSwitch)
    })
    it('blocks fingerprinting', function * () {
      const url = Brave.server.url('fingerprinting.html')
      yield this.app.client
        .click(fpSwitch)
        .tabByIndex(0)
        .loadUrl(url)
        .url(url)
        .waitUntil(function () {
          return this.getText('body')
            .then((text) => text === 'fingerprinting test')
        })
        .windowByUrl(Brave.browserWindowUrl)
        .waitForVisible(braveMenu)
        .waitForVisible(braveryPanel)
        .waitUntil(function () {
          return this.getText(fpStat)
            .then((stat) => stat === '1')
        })
        .click(fpSwitch)
    })
    it('allows fingerprinting when setting is off', function * () {
      const url = Brave.server.url('fingerprinting.html')
      yield this.app.client
        .tabByIndex(0)
        .loadUrl(url)
        .url(url)
        .waitUntil(function () {
          return this.getText('body')
            .then((text) => text !== 'fingerprinting test')
        })
        .windowByUrl(Brave.browserWindowUrl)
        .waitForVisible(braveMenu)
        .waitForVisible(braveryPanel)
        .waitUntil(function () {
          return this.getText(fpStat)
            .then((stat) => stat === '0')
        })
        .click(fpSwitch)
    })
  })
})
