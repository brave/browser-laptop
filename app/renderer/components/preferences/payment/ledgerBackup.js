/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const {StyleSheet, css} = require('aphrodite/no-important')

// components
const ImmutableComponent = require('../../immutableComponent')
const BrowserButton = require('../../common/browserButton')

// style
const globalStyles = require('../../styles/global')

// other
const aboutActions = require('../../../../../js/about/aboutActions')
const appActions = require('../../../../../js/actions/appActions')

class LedgerBackupContent extends ImmutableComponent {
  copyToClipboard (text) {
    aboutActions.setClipboard(text)
    appActions.onLedgerBackupSuccess()
  }

  render () {
    const passphrase = this.props.ledgerData.get('passphrase')

    return <section>
      <div data-l10n-id='ledgerBackupText1' />
      <div className={css(styles.ledgerBackupText_bottom)} data-l10n-id='ledgerBackupText2' />
      <div className={css(styles.ledgerBackupContent)}>
        <BrowserButton secondaryColor
          l10nId='copy'
          testId='copyButtonSecond'
          onClick={this.copyToClipboard.bind(this, passphrase)}
        />
        <div className={css(styles.ledgerBackupContent__key)}>{passphrase}</div>
      </div>
    </section>
  }
}

class LedgerBackupFooter extends ImmutableComponent {
  constructor () {
    super()
    this.printKeys = this.printKeys.bind(this)
    this.saveKeys = this.saveKeys.bind(this)
  }

  generateKeyFile (backupAction) {
    aboutActions.ledgerGenerateKeyFile(backupAction)
  }

  printKeys () {
    this.generateKeyFile('print')
  }

  saveKeys () {
    this.generateKeyFile('save')
  }

  render () {
    return <section>
      <BrowserButton groupedItem primaryColor
        l10nId='printKeys'
        testId='printKeysButton'
        onClick={this.printKeys}
      />
      <BrowserButton groupedItem primaryColor
        l10nId='saveRecoveryFile'
        testId='saveRecoveryFileButton'
        onClick={this.saveKeys}
      />
      <BrowserButton groupedItem secondaryColor
        l10nId='done'
        testId='doneButton'
        onClick={this.props.hideOverlay.bind(this, 'ledgerBackup')}
      />
    </section>
  }
}

const styles = StyleSheet.create({
  ledgerBackupText_bottom: {
    fontWeight: '600',
    marginTop: globalStyles.spacing.dialogInsideMargin
  },

  ledgerBackupContent: {
    display: 'flex',
    alignItems: 'center',
    margin: `${globalStyles.spacing.dialogInsideMargin} auto`
  },

  ledgerBackupContent__key: {
    marginLeft: `calc(${globalStyles.spacing.dialogInsideMargin} * 2)`,

    // See syncTab.js
    cursor: 'text',
    userSelect: 'text', // #11641
    color: globalStyles.color.braveDarkOrange,

    // See: https://github.com/Khan/aphrodite#object-key-ordering
    fontSize: '18px',
    fontFamily: 'monospace'
  }
})

module.exports = {
  LedgerBackupContent,
  LedgerBackupFooter
}
