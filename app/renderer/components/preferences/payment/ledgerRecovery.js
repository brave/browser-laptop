/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const {StyleSheet, css} = require('aphrodite/no-important')

// util
const {btcToCurrencyString} = require('../../../../common/lib/ledgerUtil')

// components
const ImmutableComponent = require('../../immutableComponent')
const {BrowserButton} = require('../../common/browserButton')
const {RecoveryKeyTextbox} = require('../../common/textbox')
const {SettingsList, SettingItem} = require('../../common/settings')

// style
const globalStyles = require('../../styles/global')
const commonStyles = require('../../styles/commonStyles')

// other
const aboutActions = require('../../../../../js/about/aboutActions')

class LedgerRecoveryContent extends ImmutableComponent {
  constructor () {
    super()
    this.handleFirstRecoveryKeyChange = this.handleFirstRecoveryKeyChange.bind(this)
    this.handleSecondRecoveryKeyChange = this.handleSecondRecoveryKeyChange.bind(this)
  }

  handleFirstRecoveryKeyChange (e) {
    this.props.handleFirstRecoveryKeyChange(e.target.value)
  }

  handleSecondRecoveryKeyChange (e) {
    this.props.handleSecondRecoveryKeyChange(e.target.value)
  }

  clearRecoveryStatus () {
    aboutActions.clearRecoveryStatus()
    this.props.hideAdvancedOverlays()
  }

  render () {
    const l10nDataArgs = {
      balance: btcToCurrencyString(this.props.ledgerData.get('balance'), this.props.ledgerData)
    }
    const recoverySucceeded = this.props.ledgerData.get('recoverySucceeded')
    const recoveryError = this.props.ledgerData.getIn(['error', 'error'])
    const isNetworkError = typeof recoveryError === 'object'

    return <section>
      {
        recoverySucceeded === true
          ? <section className={css(styles.recoveryOverlay)}>
            <h1 className={css(styles.recoveryOverlay__textColor)} data-l10n-id='ledgerRecoverySucceeded' />
            <p className={css(styles.recoveryOverlay__textColor, styles.recoveryOverlay__spaceAround)}
              data-l10n-id='balanceRecovered'
              data-l10n-args={JSON.stringify(l10nDataArgs)}
            />
            <BrowserButton secondaryColor
              l10nId='ok'
              testId='okButton'
              onClick={this.clearRecoveryStatus.bind(this)}
            />
          </section>
          : null
      }
      {
        (recoverySucceeded === false && recoveryError && isNetworkError)
          ? <section className={css(styles.recoveryOverlay)}>
            <h1 className={css(styles.recoveryOverlay__textColor)} data-l10n-id='ledgerRecoveryNetworkFailedTitle' data-test-id='recoveryError' />
            <p className={css(styles.recoveryOverlay__textColor, styles.recoveryOverlay__spaceAround)}
              data-l10n-id='ledgerRecoveryNetworkFailedMessage'
            />
            <BrowserButton secondaryColor
              l10nId='ok'
              testId='okButton'
              onClick={this.clearRecoveryStatus.bind(this)}
            />
          </section>
          : null
      }
      {
        (recoverySucceeded === false && recoveryError && !isNetworkError)
          ? <section className={css(styles.recoveryOverlay)}>
            <h1 className={css(styles.recoveryOverlay__textColor)} data-l10n-id='ledgerRecoveryFailedTitle' />
            <p className={css(styles.recoveryOverlay__textColor, styles.recoveryOverlay__spaceAround)}
              data-l10n-id='ledgerRecoveryFailedMessage'
            />
            <BrowserButton secondaryColor
              l10nId='ok'
              testId='okButton'
              onClick={this.clearRecoveryStatus.bind(this)}
            />
          </section>
          : null
      }
      <h4 className={css(styles.recoveryContent__h4)} data-l10n-id='ledgerRecoverySubtitle' />
      <div className={css(styles.ledgerRecoveryContent)} data-l10n-id='ledgerRecoveryContent' />
      <SettingsList className={css(commonStyles.noMarginBottom)}>
        <SettingItem>
          <h3 data-l10n-id='firstRecoveryKey' />
          <RecoveryKeyTextbox id='firstRecoveryKey' onChange={this.handleFirstRecoveryKeyChange} />
          <h3 className={css(styles.recoveryContent__h3)} data-l10n-id='secondRecoveryKey' />
          <RecoveryKeyTextbox id='secondRecoveryKey' onChange={this.handleSecondRecoveryKeyChange} />
        </SettingItem>
      </SettingsList>
    </section>
  }
}

class LedgerRecoveryFooter extends ImmutableComponent {
  constructor () {
    super()
    this.recoverWallet = this.recoverWallet.bind(this)
  }

  recoverWallet () {
    aboutActions.ledgerRecoverWallet(this.props.state.FirstRecoveryKey, this.props.state.SecondRecoveryKey)
  }

  recoverWalletFromFile () {
    aboutActions.ledgerRecoverWalletFromFile()
  }

  render () {
    return <div>
      <BrowserButton groupedItem primaryColor
        l10nId='recover'
        testId='recoverButton'
        onClick={this.recoverWallet}
      />
      <BrowserButton groupedItem primaryColor
        l10nId='recoverFromFile'
        testId='recoverFromFileButton'
        onClick={this.recoverWalletFromFile}
      />
      <BrowserButton groupedItem secondaryColor
        l10nId='cancel'
        testId='cancelButton'
        onClick={this.props.hideOverlay.bind(this, 'ledgerRecovery')}
      />
    </div>
  }
}

const styles = StyleSheet.create({
  recoveryContent__h4: {
    marginBottom: globalStyles.spacing.dialogInsideMargin
  },
  recoveryContent__h3: {
    marginBottom: globalStyles.spacing.modalPanelHeaderMarginBottom
  },
  ledgerRecoveryContent: {
    marginBottom: globalStyles.spacing.dialogInsideMargin
  },

  recoveryOverlay: {
    display: 'flex',
    flexFlow: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: globalStyles.color.black75,
    border: `1px solid ${globalStyles.color.black75}`,
    position: 'absolute',
    top: '-1px',
    left: '-1px',
    width: '100%',
    height: '100%',
    zIndex: 999
  },
  recoveryOverlay__textColor: {
    color: '#fff'
  },
  recoveryOverlay__spaceAround: {
    margin: '50px auto'
  }
})

module.exports = {
  LedgerRecoveryContent,
  LedgerRecoveryFooter
}
