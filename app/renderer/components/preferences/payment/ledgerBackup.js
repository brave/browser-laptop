/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const {StyleSheet, css} = require('aphrodite/no-important')

// components
const ImmutableComponent = require('../../immutableComponent')
const Button = require('../../../../../js/components/button')

// style
const globalStyles = require('../../styles/global')
const commonStyles = require('../../styles/commonStyles')
const {paymentCommon} = require('../../styles/payment')

// other
const aboutActions = require('../../../../../js/about/aboutActions')

class LedgerBackupContent extends ImmutableComponent {
  copyToClipboard (text) {
    aboutActions.setClipboard(text)
  }

  render () {
    const paymentId = this.props.ledgerData.get('paymentId')
    const passphrase = this.props.ledgerData.get('passphrase')

    return <div>
      <span data-l10n-id='ledgerBackupContent' />
      <div className={css(styles.copyKeyContainer)}>
        {/* TODO: refactor button */}
        <Button className='whiteButton'
          l10nId='copy'
          testId='copyButtonFirst'
          onClick={this.copyToClipboard.bind(this, paymentId)}
        />
        <div className={css(styles.keyContainer)}>
          <h3 className={css(styles.keyContainer__h3)} data-l10n-id='firstKey' />
          <span className={css(styles.keyContainer__span)}>{paymentId}</span>
        </div>
      </div>
      <div className={css(styles.copyKeyContainer)}>
        {/* TODO: refactor button */}
        <Button className='whiteButton'
          l10nId='copy'
          testId='copyButtonSecond'
          onClick={this.copyToClipboard.bind(this, passphrase)}
        />
        <div className={css(styles.keyContainer)}>
          <h3 className={css(styles.keyContainer__h3)} data-l10n-id='secondKey' />
          <span className={css(styles.keyContainer__span)}>{passphrase}</span>
        </div>
      </div>
    </div>
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
    return <div>
      <Button className='primaryButton'
        l10nId='printKeys'
        testId='printKeysButton'
        onClick={this.printKeys}
      />
      <Button className='primaryButton'
        l10nId='saveRecoveryFile'
        testId='saveRecoveryFileButton'
        onClick={this.saveKeys}
      />
      <Button className='whiteButton'
        l10nId='done'
        testId='doneButton'
        onClick={this.props.hideOverlay.bind(this, 'ledgerBackup')}
      />
    </div>
  }
}

const styles = StyleSheet.create({
  copyKeyContainer: {
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'center',
    margin: `${globalStyles.spacing.dialogInsideMargin} auto`
  },

  keyContainer: {
    marginLeft: '2em'
  },
  keyContainer__h3: {
    marginBottom: globalStyles.spacing.modalPanelHeaderMarginBottom
  },
  keyContainer__span: {
    whiteSpace: 'nowrap',
    userSelect: 'initial',
    cursor: 'initial'
  }
})

module.exports = {
  LedgerBackupContent,
  LedgerBackupFooter
}
