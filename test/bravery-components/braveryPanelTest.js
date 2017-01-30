/* global describe, it, before, beforeEach */

const Brave = require('../lib/brave')
const {cookieControl, allowAllCookiesOption, blockAllCookiesOption, urlInput, braveMenu, braveMenuDisabled, adsBlockedStat, adsBlockedControl, showAdsOption, blockAdsOption, braveryPanel, httpsEverywhereStat, noScriptStat, noScriptSwitch, fpSwitch, fpStat, noScriptNavButton, customFiltersInput} = require('../lib/selectors')
const {getTargetAboutUrl} = require('../../js/lib/appUrlUtil')

describe('Bravery Panel', function () {
  function * setup (client) {
    yield client
      .waitForUrl(Brave.newTabUrl)
      .waitForBrowserWindow()
      .waitForVisible(urlInput)
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
    it('lion badge', function * () {
      const url = Brave.server.url('tracking.html')
      yield this.app.client
        .waitForDataFile('trackingProtection')
        .tabByIndex(0)
        .loadUrl(url)
        .windowByUrl(Brave.browserWindowUrl)
        .waitForTextValue('[data-test-id="lionBadge"]', '2')
    })
  })
  describe('Stats', function () {
    Brave.beforeEach(this)
    beforeEach(function * () {
      yield setup(this.app.client)
    })
    it('detects blocked elements in private tab', function * () {
      const url = Brave.server.url('tracking.html')
      yield this.app.client
        .waitForDataFile('trackingProtection')
        .newTab({ url, isPrivate: true })
        .waitForTabCount(2)
        .waitForUrl(url)
        .windowByUrl(Brave.browserWindowUrl)
        .openBraveMenu(braveMenu, braveryPanel)
        .waitForTextValue(adsBlockedStat, '2')
        .click(adsBlockedControl)
        .waitForVisible(showAdsOption)
        .click(showAdsOption)
        .waitForTextValue(adsBlockedStat, '0')
        .keys(Brave.keys.ESCAPE)
        .newTab({ url })
        .waitForTabCount(3)
        .waitForUrl(url)
        .openBraveMenu(braveMenu, braveryPanel)
        .waitForTextValue(adsBlockedStat, '2')
    })
    it('detects blocked elements', function * () {
      const url = Brave.server.url('tracking.html')
      yield this.app.client
        .waitForDataFile('trackingProtection')
        .tabByIndex(0)
        .loadUrl(url)
        .openBraveMenu(braveMenu, braveryPanel)
        .waitForTextValue(adsBlockedStat, '2')
        .click(adsBlockedControl)
        .waitForVisible(showAdsOption)
        .click(showAdsOption)
        .waitForTextValue(adsBlockedStat, '0')
        .keys(Brave.keys.ESCAPE)
        .newTab({ url, isPrivate: true })
        .waitForTabCount(2)
        .waitForUrl(url)
        .openBraveMenu(braveMenu, braveryPanel)
        .waitForTextValue(adsBlockedStat, '0')
        .click(adsBlockedControl)
        .waitForVisible(blockAdsOption)
        .click(blockAdsOption)
        .waitForTextValue(adsBlockedStat, '2')
    })
    it('downloads and detects regional adblock resources in private tab', function * () {
      const url = Brave.server.url('adblock.html')
      const aboutAdblockURL = getTargetAboutUrl('about:adblock')
      const adblockUUID = '48796273-E783-431E-B864-44D3DCEA66DC'
      yield this.app.client
        .waitForDataFile('adblock')
        .tabByIndex(0)
        .loadUrl(aboutAdblockURL)
        .url(aboutAdblockURL)
        .waitForVisible(`.switch-${adblockUUID}`)
        .click(`.switch-${adblockUUID} .switchBackground`)
        .windowByUrl(Brave.browserWindowUrl)
        .waitUntil(function () {
          return this.getAppState().then((val) => {
            return val.value[adblockUUID] && val.value[adblockUUID].etag && val.value[adblockUUID].etag.length > 0
          })
        })
        .newTab({ url, isPrivate: true })
        .waitForTabCount(2)
        .waitForUrl(url)
        .windowByUrl(Brave.browserWindowUrl)
        .openBraveMenu(braveMenu, braveryPanel)
        .waitForTextValue(adsBlockedStat, '2')
        .click(adsBlockedControl)
        .waitForVisible(showAdsOption)
        .click(showAdsOption)
        .waitForTextValue(adsBlockedStat, '0')
        .keys(Brave.keys.ESCAPE)
        .newTab({ url })
        .waitForTabCount(3)
        .waitForUrl(url)
        .openBraveMenu(braveMenu, braveryPanel)
        .waitForTextValue(adsBlockedStat, '2')
    })
    it('downloads and detects regional adblock resources', function * () {
      const url = Brave.server.url('adblock.html')
      const aboutAdblockURL = getTargetAboutUrl('about:adblock')
      const adblockUUID = '48796273-E783-431E-B864-44D3DCEA66DC'
      yield this.app.client
        .waitForDataFile('adblock')
        .tabByIndex(0)
        .loadUrl(aboutAdblockURL)
        .url(aboutAdblockURL)
        .waitForVisible(`.switch-${adblockUUID}`)
        .click(`.switch-${adblockUUID} .switchBackground`)
        .windowByUrl(Brave.browserWindowUrl)
        .waitUntil(function () {
          return this.getAppState().then((val) => {
            return val.value[adblockUUID] && val.value[adblockUUID].etag && val.value[adblockUUID].etag.length > 0
          })
        })
        .tabByIndex(0)
        .loadUrl(url)
        .url(url)
        .openBraveMenu(braveMenu, braveryPanel)
        .waitForTextValue(adsBlockedStat, '2')
        .click(adsBlockedControl)
        .waitForVisible(showAdsOption)
        .click(showAdsOption)
        .waitForTextValue(adsBlockedStat, '0')
        .keys(Brave.keys.ESCAPE)
        .newTab({ url, isPrivate: true })
        .waitForTabCount(2)
        .waitForUrl(url)
        .openBraveMenu(braveMenu, braveryPanel)
        .waitForTextValue(adsBlockedStat, '0')
        .click(adsBlockedControl)
        .waitForVisible(blockAdsOption)
        .click(blockAdsOption)
        .waitForTextValue(adsBlockedStat, '2')
    })
    it('detects adblock resources in private tab', function * () {
      const url = Brave.server.url('adblock.html')
      yield this.app.client
        .waitForDataFile('adblock')
        .newTab({ url, isPrivate: true })
        .waitForTabCount(2)
        .waitForUrl(url)
        .windowByUrl(Brave.browserWindowUrl)
        .openBraveMenu(braveMenu, braveryPanel)
        .waitForTextValue(adsBlockedStat, '1')
        .click(adsBlockedControl)
        .waitForVisible(showAdsOption)
        .click(showAdsOption)
        .waitForTextValue(adsBlockedStat, '0')
        .keys(Brave.keys.ESCAPE)
        .newTab({ url })
        .waitForTabCount(3)
        .waitForUrl(url)
        .openBraveMenu(braveMenu, braveryPanel)
        .waitForTextValue(adsBlockedStat, '1')
    })
    it('detects adblock resources', function * () {
      const url = Brave.server.url('adblock.html')
      yield this.app.client
        .waitForDataFile('adblock')
        .newTab({ url })
        .waitForTabCount(2)
        .waitForUrl(url)
        .windowByUrl(Brave.browserWindowUrl)
        .openBraveMenu(braveMenu, braveryPanel)
        .waitForTextValue(adsBlockedStat, '1')
        .click(adsBlockedControl)
        .waitForVisible(showAdsOption)
        .click(showAdsOption)
        .waitForTextValue(adsBlockedStat, '0')
        .keys(Brave.keys.ESCAPE)
        .newTab({ url, isPrivate: true })
        .waitForTabCount(3)
        .waitForUrl(url)
        .openBraveMenu(braveMenu, braveryPanel)
        .waitForTextValue(adsBlockedStat, '0')
        .click(adsBlockedControl)
        .waitForVisible(blockAdsOption)
        .click(blockAdsOption)
        .waitForTextValue(adsBlockedStat, '1')
    })
    it('blocks custom adblock resources in private tab', function * () {
      const customFilterRulesUUID = 'CE61F035-9F0A-4999-9A5A-D4E46AF676F7'
      const url = Brave.server.url('adblock.html')
      const aboutAdblockURL = getTargetAboutUrl('about:adblock')
      yield this.app.client
        .waitForDataFile('adblock')
        .tabByIndex(0)
        .loadUrl(aboutAdblockURL)
        .waitForVisible(customFiltersInput)
        .click(customFiltersInput)
        .typeText(customFiltersInput, 'testblock.brave.com')
        .windowByUrl(Brave.browserWindowUrl)
        .waitUntil(function () {
          return this.getAppState().then((val) => {
            return val.value[customFilterRulesUUID] && val.value[customFilterRulesUUID].etag && val.value[customFilterRulesUUID].etag.length > 0
          })
        })
        .newTab({ url, isPrivate: true })
        .waitForTabCount(2)
        .waitForUrl(url)
        .windowByUrl(Brave.browserWindowUrl)
        .openBraveMenu(braveMenu, braveryPanel)
        .waitForTextValue(adsBlockedStat, '2')
        .click(adsBlockedControl)
        .waitForVisible(showAdsOption)
        .click(showAdsOption)
        .waitForTextValue(adsBlockedStat, '0')
        .keys(Brave.keys.ESCAPE)
        .newTab({ url })
        .waitForTabCount(3)
        .waitForUrl(url)
        .openBraveMenu(braveMenu, braveryPanel)
        .waitForTextValue(adsBlockedStat, '2')
    })
    it('blocks custom adblock resources', function * () {
      const customFilterRulesUUID = 'CE61F035-9F0A-4999-9A5A-D4E46AF676F7'
      const url = Brave.server.url('adblock.html')
      const aboutAdblockURL = getTargetAboutUrl('about:adblock')
      yield this.app.client
        .waitForDataFile('adblock')
        .tabByIndex(0)
        .loadUrl(aboutAdblockURL)
        .url(aboutAdblockURL)
        .waitForVisible(customFiltersInput)
        .click(customFiltersInput)
        .typeText(customFiltersInput, 'testblock.brave.com')
        .windowByUrl(Brave.browserWindowUrl)
        .waitUntil(function () {
          return this.getAppState().then((val) => {
            return val.value[customFilterRulesUUID] && val.value[customFilterRulesUUID].etag && val.value[customFilterRulesUUID].etag.length > 0
          })
        })
        .newTab({ url })
        .waitForTabCount(2)
        .waitForUrl(url)
        .windowByUrl(Brave.browserWindowUrl)
        .openBraveMenu(braveMenu, braveryPanel)
        .waitForTextValue(adsBlockedStat, '2')
        .click(adsBlockedControl)
        .waitForVisible(showAdsOption)
        .click(showAdsOption)
        .waitForTextValue(adsBlockedStat, '0')
        .keys(Brave.keys.ESCAPE)
        .newTab({ url, isPrivate: true })
        .waitForTabCount(3)
        .waitForUrl(url)
        .openBraveMenu(braveMenu, braveryPanel)
        .waitForTextValue(adsBlockedStat, '0')
        .click(adsBlockedControl)
        .waitForVisible(blockAdsOption)
        .click(blockAdsOption)
        .waitForTextValue(adsBlockedStat, '2')
    })
    it('blocks websocket tracking', function * () {
      const url = Brave.server.url('websockets.html')
      yield this.app.client
        .waitForDataFile('adblock')
        .tabByIndex(0)
        .loadUrl(url)
        .waitForTextValue('#result', 'success')
        .waitForTextValue('#error', 'error')
        .openBraveMenu(braveMenu, braveryPanel)
        .waitForTextValue(adsBlockedStat, '1')
        .click(adsBlockedStat)
        .waitUntil(function () {
          return this.getText('.braveryPanelBody li')
            .then((body) => {
              return body[0] === 'ws://ag.innovid.com/dv/sync?tid=2'
            })
        })
    })
    // TODO(bridiver) using slashdot won't provide reliable results so we should
    // create our own iframe page with urls we expect to be blocked
    it('detects blocked elements in iframe in private tab', function * () {
      const url = Brave.server.url('slashdot.html')
      yield this.app.client
        .newTab({ url, isPrivate: true })
        .waitForTabCount(2)
        .windowByUrl(Brave.browserWindowUrl)
        .openBraveMenu(braveMenu, braveryPanel)
        .waitUntil(function () {
          return this.getText(adsBlockedStat)
            .then((blocked) => Number(blocked) > 1)
        })
        .click(adsBlockedControl)
        .waitForVisible(showAdsOption)
        .click(showAdsOption)
        .waitForTextValue(adsBlockedStat, '0')
        .keys(Brave.keys.ESCAPE)
        .newTab({ url })
        .waitForTabCount(3)
        .openBraveMenu(braveMenu, braveryPanel)
        .waitUntil(function () {
          return this.getText(adsBlockedStat)
            .then((blocked) => Number(blocked) > 1)
        })
    })
    it('detects blocked elements in iframe', function * () {
      const url = Brave.server.url('slashdot.html')
      yield this.app.client
        .tabByIndex(0)
        .loadUrl(url)
        .openBraveMenu(braveMenu, braveryPanel)
        .waitUntil(function () {
          return this.getText(adsBlockedStat)
            .then((blocked) => Number(blocked) > 1)
        })
        .click(adsBlockedControl)
        .waitForVisible(showAdsOption)
        .click(showAdsOption)
        .waitForTextValue(adsBlockedStat, '0')
        .keys(Brave.keys.ESCAPE)
        .newTab({ url, isPrivate: true })
        .waitForTabCount(1)
        .waitForUrl(url)
        .openBraveMenu(braveMenu, braveryPanel)
        .waitForTextValue(adsBlockedStat, '0')
        .click(adsBlockedControl)
        .waitForVisible(blockAdsOption)
        .click(blockAdsOption)
        .waitUntil(function () {
          return this.getText(adsBlockedStat)
            .then((blocked) => Number(blocked) > 1)
        })
    })
    it('detects https upgrades in private tab', function * () {
      const url = Brave.server.url('httpsEverywhere.html')
      yield this.app.client
        .waitForDataFile('httpsEverywhere')
        .newTab({ url, isPrivate: true })
        .waitForTabCount(2)
        .waitForUrl(url)
        .windowByUrl(Brave.browserWindowUrl)
        .openBraveMenu(braveMenu, braveryPanel)
        .waitForTextValue(httpsEverywhereStat, '1')
    })
    it('detects https upgrades', function * () {
      const url = Brave.server.url('httpsEverywhere.html')
      yield this.app.client
        .waitForDataFile('httpsEverywhere')
        .tabByIndex(0)
        .loadUrl(url)
        .openBraveMenu(braveMenu, braveryPanel)
        .waitForTextValue(httpsEverywhereStat, '1')
    })
    it('blocks scripts in a regular tab', function * () {
      const url = Brave.server.url('scriptBlock.html')
      yield this.app.client
        .tabByIndex(0)
        .loadUrl(url)
        .waitForTextValue('body', 'test1 test2')
        .openBraveMenu(braveMenu, braveryPanel)
        .click(noScriptSwitch)
        .waitForTextValue(noScriptStat, '2')
        .keys(Brave.keys.ESCAPE)
        .waitForVisible(noScriptNavButton)
        .newTab({ url })
        .waitForTabCount(2)
        .waitForUrl(url)
        .waitUntil(function () {
          // getText returns empty in this case
          return this.getElementSize('noscript')
            .then((size) => size.height > 0)
        })
        .openBraveMenu(braveMenu, braveryPanel)
        .waitForTextValue(noScriptStat, '2')
        .waitForVisible(noScriptNavButton)
    })
    it('blocks scripts in a private tab', function * () {
      const url = Brave.server.url('scriptBlock.html')
      yield this.app.client
        .tabByIndex(0)
        .loadUrl(url)
        .waitForTextValue('body', 'test1 test2')
        .openBraveMenu(braveMenu, braveryPanel)
        .click(noScriptSwitch)
        .waitForTextValue(noScriptStat, '2')
        .keys(Brave.keys.ESCAPE)
        .waitForVisible(noScriptNavButton)
        .newTab({ url, isPrivate: true })
        .waitForTabCount(2)
        .waitForUrl(url)
        .waitUntil(function () {
          // getText returns empty in this case
          return this.getElementSize('noscript')
            .then((size) => size.height > 0)
        })
        .openBraveMenu(braveMenu, braveryPanel)
        .waitForTextValue(noScriptStat, '2')
        .click(noScriptSwitch)
        .waitForTextValue(noScriptStat, '0')
        .keys(Brave.keys.ESCAPE)
        .waitForElementCount(noScriptNavButton, 0)
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
        .openBraveMenu(braveMenu, braveryPanel)
        .click(noScriptSwitch)
        .tabByIndex(0)
        .loadUrl(url)
        .waitUntil(function () {
          // getText returns empty in this case
          return this.getElementSize('noscript')
            .then((size) => size.height > 0)
        })
    })
    it('blocks cookies', function * () {
      const url = Brave.server.url('cookies.html')
      const expectedBlocked = ['local storage:',
        'session storage:',
        'indexeddb:',
        'cookies:',
        '""',
        'websql:',
        'filesystem API:'
      ].join('\n')
      yield this.app.client
        .tabByIndex(0)
        .loadUrl(url)
        .openBraveMenu(braveMenu, braveryPanel)
        .click(cookieControl)
        .waitForVisible(blockAllCookiesOption)
        .click(blockAllCookiesOption)
        .tabByIndex(0)
        .loadUrl(url)
        .waitForTextValue('body', expectedBlocked)
    })
    it('allows cookies', function * () {
      const url = Brave.server.url('cookies.html')
      yield this.app.client
        .tabByIndex(0)
        .loadUrl(url)
        .openBraveMenu(braveMenu, braveryPanel)
        .click(cookieControl)
        .waitForVisible(allowAllCookiesOption)
        .click(allowAllCookiesOption)
        .tabByIndex(0)
        .loadUrl(url)
        .waitUntil(function () {
          return this.getText('body').then((text) => {
            return text.includes('abc=123')
          })
        })
    })
    it('blocks fingerprinting', function * () {
      const url = Brave.server.url('fingerprinting.html')
      yield this.app.client
        .tabByIndex(0)
        .loadUrl(url)
        .openBraveMenu(braveMenu, braveryPanel)
        .click(fpSwitch)
        .waitUntil(function () {
          // TOOD: This should be 3, but see:
          // https://github.com/brave/browser-laptop/issues/3227
          return this.getText(fpStat)
            .then((stat) => stat === '2' || stat === '3')
        })
        .keys(Brave.keys.ESCAPE)
        .newTab({ url, isPrivate: true })
        .waitForTabCount(2)
        .waitForUrl(url)
        .openBraveMenu(braveMenu, braveryPanel)
        .waitUntil(function () {
          // TOOD: This should be 3, but see:
          // https://github.com/brave/browser-laptop/issues/3227
          return this.getText(fpStat)
            .then((stat) => stat === '2' || stat === '3')
        })
        .click(fpSwitch)
        .waitForTextValue(fpStat, '0')
        .keys(Brave.keys.ESCAPE)
        .newTab({ url })
        .waitForTabCount(3)
        .waitForUrl(url)
        .openBraveMenu(braveMenu, braveryPanel)
        .click(fpSwitch)
        .waitUntil(function () {
          // TOOD: This should be 3, but see:
          // https://github.com/brave/browser-laptop/issues/3227
          return this.getText(fpStat)
            .then((stat) => stat === '2' || stat === '3')
        })
    })
    it('block device enumeration', function * () {
      const url = Brave.server.url('enumerate_devices.html')
      yield this.app.client
        .tabByIndex(0)
        .loadUrl(url)
        .waitUntil(function () {
          return this.getText('body')
            .then((body) => {
              return body.includes('default')
            })
        })
        .openBraveMenu(braveMenu, braveryPanel)
        .click(fpSwitch)
        .waitUntil(function () {
          return this.getText(fpStat)
            .then((stat) => stat === '1')
        })
        .tabByUrl(url)
        .waitUntil(function () {
          return this.getText('body')
            .then((body) => {
              return body === ''
            })
        })
    })
    it('allows fingerprinting when setting is off in private tab', function * () {
      const url = Brave.server.url('fingerprinting.html')
      yield this.app.client
        .newTab({ url, isPrivate: true })
        .waitForTabCount(2)
        .waitForUrl(url)
        .waitForTextValue('body', 'fingerprinting test')
        .openBraveMenu(braveMenu, braveryPanel)
        .waitForTextValue(fpStat, '0')
    })
    it('allows fingerprinting when setting is off', function * () {
      const url = Brave.server.url('fingerprinting.html')
      yield this.app.client
        .tabByIndex(0)
        .loadUrl(url)
        .waitForTextValue('body', 'fingerprinting test')
        .openBraveMenu(braveMenu, braveryPanel)
        .waitForTextValue(fpStat, '0')
    })
  })
})
