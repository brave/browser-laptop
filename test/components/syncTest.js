/* global describe, it, beforeEach */

const Brave = require('../lib/brave')
const Immutable = require('immutable')
const {urlInput, syncTab, syncSwitch} = require('../lib/selectors')

const prefsUrl = 'about:preferences'
const startButton = '[data-l10n-id="syncStart"]'
const addButton = '[data-l10n-id="syncAdd"]'
const createButton = '[data-l10n-id="syncCreate"]'
const newDeviceButton = '[data-l10n-id="syncNewDevice"]'

function toHex (byteArray) {
  let str = ''
  for (var i = 0; i < byteArray.length; i++) {
    let char = byteArray[i].toString(16)
    if (char.length === 1) {
      char = '0' + char
    }
    str = str + char
  }
  return str
}

function * setup (client) {
  yield client
    .waitForUrl(Brave.newTabUrl)
    .waitForBrowserWindow()
    .waitForVisible(urlInput)
}

describe('Sync Panel', function () {
  describe('sync setup', function () {
    Brave.beforeEach(this)
    beforeEach(function * () {
      yield setup(this.app.client)
    })

    it('sync profile can be created', function * () {
      yield this.app.client
        .tabByIndex(0)
        .loadUrl(prefsUrl)
        .waitForVisible(syncTab)
        .click(syncTab)
        .waitForVisible(startButton)
        .click(startButton)
        .waitForVisible(createButton)
        .setValue('input', 'pyramid 0')
        .click(createButton)
        .windowByUrl(Brave.browserWindowUrl)
        .waitUntil(function () {
          return this.getAppState().then((val) => {
            return val.value.settings['sync.enabled'] === true &&
              val.value.settings['sync.device-name'] === 'pyramid 0'
          })
        })
    })

    it('sync profile can be recreated', function * () {
      const codewords = 'Idyllic undergrowth sheepman chez wishy undergroundeR verseman plyer  a, a, a, a, a, a, a, a '
      const hex = '68c2ecccc83a2080fc8beccbf55da43c00000000000000000000000000000000'
      yield this.app.client
        .tabByIndex(0)
        .loadUrl(prefsUrl)
        .waitForVisible(syncTab)
        .click(syncTab)
        .waitForVisible(addButton)
        .click(addButton)
        .setValue('textarea', codewords)
        .setValue('input', 'pyramid 1')
        .click(createButton)
        .windowByUrl(Brave.browserWindowUrl)
        .waitUntil(function () {
          return this.getAppState().then((val) => {
            return val.value.settings['sync.enabled'] === true &&
              val.value.settings['sync.device-name'] === 'pyramid 1' &&
              toHex(val.value.sync.seed) === hex &&
              val.value.sync.seedQr.startsWith('data:image/png;base64,')
          })
        })
        .tabByIndex(0)
        .loadUrl(prefsUrl)
        .waitForVisible(syncTab)
        .click(syncTab)
        .waitForExist(newDeviceButton)
        .click(newDeviceButton)
        .click('[data-l10n-id="syncShowPassphrase"]')
        .waitUntil(function () {
          return this.getText('#syncPassphrase').then((text) => {
            return text === 'idyllic undergrowth sheepman chez\nwishy undergrounder verseman plyer\na a a a\na a a a'
          })
        })
    })
  })

  describe('sync post-setup', function () {
    Brave.beforeEach(this)
    beforeEach(function * () {
      yield setup(this.app.client)
      yield this.app.client.saveSyncInitData(Immutable.fromJS([
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0
      ]), Immutable.fromJS([0]), 0, 'data:image/png;base64,foo')
    })

    it('sync can be toggled', function * () {
      yield this.app.client
        .tabByIndex(0)
        .loadUrl(prefsUrl)
        .waitForVisible(syncTab)
        .click(syncTab)
        .waitForVisible(syncSwitch)
        .click(syncSwitch)
        .windowByUrl(Brave.browserWindowUrl)
        .waitUntil(function () {
          return this.getAppState().then((val) => {
            return val.value.settings['sync.enabled'] === true
          })
        })
        .tabByIndex(0)
        .waitForVisible(syncSwitch)
        .click(syncSwitch)
        .windowByUrl(Brave.browserWindowUrl)
        .waitUntil(function () {
          return this.getAppState().then((val) => {
            return val.value.settings['sync.enabled'] === false
          })
        })
    })

    it('sync categories can be enabled', function * () {
      yield this.app.client
        .tabByIndex(0)
        .loadUrl(prefsUrl)
        .waitForVisible(syncTab)
        .click(syncTab)
        .waitForVisible(syncSwitch)
        .click(syncSwitch)
        .waitForExist('#syncData .switchBackground')
        .click('#syncData .switchBackground')
        .windowByUrl(Brave.browserWindowUrl)
        .waitUntil(function () {
          return this.getAppState().then((val) => {
            return val.value.settings['sync.type.bookmark'] === false
          })
        })
    })

    it('shows sync QR code and words', function * () {
      yield this.app.client
        .tabByIndex(0)
        .loadUrl(prefsUrl)
        .waitForVisible(syncTab)
        .click(syncTab)
        .waitForVisible(syncSwitch)
        .click(syncSwitch)
        .waitForExist(newDeviceButton)
        .click(newDeviceButton)
        .click('[data-l10n-id="syncShowPassphrase"]')
        .waitUntil(function () {
          return this.getText('#syncPassphrase').then((text) => {
            return text === 'a a a a\na a a a\na a a a\na a a a'
          })
        })
        .click('[data-l10n-id="syncShowQR"]')
        .waitUntil(function () {
          return this.getAttribute('#syncQR', 'src').then((text) => {
            return text === 'data:image/png;base64,foo'
          })
        })
    })
  })
})
