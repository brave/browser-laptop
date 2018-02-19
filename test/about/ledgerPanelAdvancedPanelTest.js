/* global describe, it, beforeEach */

const Brave = require('../lib/brave')
const {urlInput, paymentsWelcomePage, paymentsTab, walletSwitch, backupWallet, recoverWallet, saveWalletFile, advancedSettingsButton, recoverWalletFromFileButton, balanceRecovered, balanceNotRecovered, recoveryOverlayOkButton} = require('../lib/selectors')
const messages = require('../../js/constants/messages')

const assert = require('assert')

const prefsUrl = 'about:preferences'
const ledgerAPIWaitTimeout = 60000

const fs = require('fs')
const os = require('os')
const path = require('path')
const urlParse = require('url').parse

const WALLET_RECOVERY_FILE_BASENAME = 'brave_wallet_recovery.txt'
const PASSPHRASE_TRANSLATION_KEY = 'ledgerBackupText4'

const format = require('date-fns/format')

let translationsCache = null

function setup (client) {
  return client
    .waitForBrowserWindow()
    .waitForVisible(urlInput)
    .translations().then(function (translations) {
      if (translations && translations.value) {
        translationsCache = translations.value
      }
      return this
    })
}

function * setupPaymentsTabAndOpenAdvancedSettings (client, tabAlreadyLoaded) {
  yield client
    .tabByIndex(0)

  if (!tabAlreadyLoaded) {
    yield client
      .loadUrl(prefsUrl)
      .waitForVisible(paymentsTab)
      .click(paymentsTab)
      .waitForVisible(paymentsWelcomePage)
      .waitForVisible(walletSwitch)
      .click(walletSwitch)
      .waitForVisible(advancedSettingsButton, ledgerAPIWaitTimeout)
  }

  yield client
    .waitForVisible(advancedSettingsButton, ledgerAPIWaitTimeout)
    .click(advancedSettingsButton)
}

function validateRecoveryFile (recoveryFileContents) {
  const RECOVERY_FILE_EXPECTED_NUM_LINES = 6

  assert.equal(typeof recoveryFileContents, 'string', 'recovery file should contain a string')

  let messageLines = recoveryFileContents.split(os.EOL)

  assert.equal(messageLines.length, RECOVERY_FILE_EXPECTED_NUM_LINES, 'recovery file should have the expected number of lines')

  const passphrasePrefixText = translationsCache[PASSPHRASE_TRANSLATION_KEY]
  assert.equal(typeof passphrasePrefixText, 'string', `passphrase prefix text ("${PASSPHRASE_TRANSLATION_KEY}") should exist in translation cache`)

  let passphraseLine = '' || messageLines[3]

  const passphrasePattern = new RegExp([passphrasePrefixText, '(.+)$'].join(' '))
  const passphrase = (passphraseLine.match(passphrasePattern) || [])[1]
  assert.ok(passphrase)
  assert.equal(typeof passphrase, 'string')
  console.log(`recovered passphrase: ${passphrase}`)

  return true
}

let recoverWalletFromFile = function * (client) {
  yield setupPaymentsTabAndOpenAdvancedSettings(client, true)

  // open "Recover your wallet" submodal and click "Import recovery keys"
  yield client
    .waitForVisible(recoverWallet, ledgerAPIWaitTimeout)
    .click(recoverWallet)
    .waitForVisible(recoverWalletFromFileButton, ledgerAPIWaitTimeout)
    .click(recoverWalletFromFileButton)
}

let generateAndSaveRecoveryFile = function (recoveryFilePath, passphrase) {
  let recoveryFileContents = ''

  if (typeof passphrase === 'string') {
    const date = format(new Date(), 'MM/DD/YYYY')

    const messageLines = [
      translationsCache['ledgerBackupText1'],
      [translationsCache['ledgerBackupText2'], date].join(' '),
      '',
      [translationsCache['ledgerBackupText4'], passphrase].join(' '),
      '',
      translationsCache['ledgerBackupText5']
    ]

    recoveryFileContents = messageLines.join(os.EOL)
  }

  fs.writeFileSync(recoveryFilePath, recoveryFileContents)
}

// TODO re-enable when #9677 is fixed
describe.skip('Advanced payment panel tests', function () {
  let context = this
  Brave.beforeEach(this)

  beforeEach(function * () {
    yield setup(this.app.client)
  })

  it('can backup wallet to file', function * () {
    context.cleanSessionStoreAfterEach = false

    yield setupPaymentsTabAndOpenAdvancedSettings(this.app.client)

    // open "Backup your wallet" sub-modal and click "Save recovery file..."
    yield this.app.client
      .waitForVisible(backupWallet, ledgerAPIWaitTimeout)
      .click(backupWallet)
      .waitForVisible(saveWalletFile, ledgerAPIWaitTimeout)
      .click(saveWalletFile)

    const windowHandlesResponse = yield this.app.client.windowHandles()
    const windowHandles = windowHandlesResponse.value

    // confirm the saved backup file is opened in a new tab
    yield this.app.client.window(windowHandles[0])
      .ipcSend('shortcut-focus-url')
      .waitForElementFocus(urlInput, ledgerAPIWaitTimeout)
      .waitUntil(function () {
        return this.getValue(urlInput)
          .then(function (urlString) {
            // VERIFY that the downloaded recovery file is opened in new tab
            assert.equal(typeof urlString, 'string')
            let urlObj = urlParse(urlString)
            assert.ok(urlObj)
            assert.equal(urlObj.protocol, 'file:')
            assert.equal(path.basename(urlObj.pathname), WALLET_RECOVERY_FILE_BASENAME)

            // VERIFY contents of downloaded recovery file
            let pathname = urlObj.pathname
            // this is a test, so OK to throw exception in here
            let recoveryFileContents = fs.readFileSync(pathname).toString()

            context.recoveryFilePathname = pathname

            return validateRecoveryFile(recoveryFileContents)
          })
      })
      .pause(1000)
      .ipcSend(messages.SHORTCUT_CLOSE_FRAME, 2)
      .pause(1000)
      .ipcSend('shortcut-focus-url')
  })

  it('can recover wallet from file', function * () {
    yield recoverWalletFromFile(this.app.client)

    yield this.app.client
      .waitForVisible(balanceRecovered, ledgerAPIWaitTimeout)
      .waitForVisible(recoveryOverlayOkButton, ledgerAPIWaitTimeout)
      .click(recoveryOverlayOkButton)
      .pause(1000)
  })

  it('shows an error popover if recovery key is missing', function * () {
    generateAndSaveRecoveryFile(context.recoveryFilePathname, '')
    yield recoverWalletFromFile(this.app.client)
    yield this.app.client
      .waitForVisible(balanceNotRecovered, ledgerAPIWaitTimeout)
  })

  it('shows an error popover if the file is empty', function * () {
    generateAndSaveRecoveryFile(context.recoveryFilePathname)
    yield recoverWalletFromFile(this.app.client)
    context.cleanSessionStoreAfterEach = true
    yield this.app.client
      .waitForVisible(balanceNotRecovered, ledgerAPIWaitTimeout)
  })
})
