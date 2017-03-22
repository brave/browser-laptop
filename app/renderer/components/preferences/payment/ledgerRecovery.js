/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const {StyleSheet, css} = require('aphrodite')

// util
const {btcToCurrencyString} = require('../../../../common/lib/ledgerUtil')

// components
const ImmutableComponent = require('../../../../../js/components/immutableComponent')
const Button = require('../../../../../js/components/button')
const {RecoveryKeyTextbox} = require('../../textbox')
const {SettingsList, SettingItem} = require('../../settings')

// style
const globalStyles = require('../../styles/global')
const commonStyles = require('../../styles/commonStyles')
const {paymentCommon} = require('../../styles/payment')

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

    return <div className={css(paymentCommon.board)}>
      {
        recoverySucceeded === true
          ? <div className={css(styles.recoveryOverlay)}>
            <h1 className={css(styles.recoveryOverlay__h1)} data-l10n-id='ledgerRecoverySucceeded' />
            <p className={css(styles.recoveryOverlay__p, styles.spaceAround)}
              data-l10n-id='balanceRecovered'
              data-l10n-args={JSON.stringify(l10nDataArgs)}
            />
            <Button l10nId='ok'
              className={css(commonStyles.whiteButton, commonStyles.inlineButton)}
              onClick={this.clearRecoveryStatus.bind(this)}
            />
          </div>
          : null
      }
      {
        (recoverySucceeded === false && recoveryError && isNetworkError)
          ? <div className={css(styles.recoveryOverlay)}>
            <h1 className={css(styles.recoveryOverlay__h1)} data-l10n-id='ledgerRecoveryNetworkFailedTitle' data-test-id='recoveryError' />
            <p className={css(styles.recoveryOverlay__p, styles.spaceAround)}
              data-l10n-id='ledgerRecoveryNetworkFailedMessage'
            />
            <Button l10nId='ok'
              className={css(commonStyles.whiteButton, commonStyles.inlineButton)}
              onClick={this.clearRecoveryStatus.bind(this)}
            />
          </div>
          : null
      }
      {
        (recoverySucceeded === false && recoveryError && !isNetworkError)
          ? <div className={css(styles.recoveryOverlay)}>
            <h1 className={css(styles.recoveryOverlay__h1)} data-l10n-id='ledgerRecoveryFailedTitle' />
            <p className={css(styles.recoveryOverlay__p, styles.spaceAround)}
              data-l10n-id='ledgerRecoveryFailedMessage'
            />
            <Button l10nId='ok'
              className={css(commonStyles.whiteButton, commonStyles.inlineButton)}
              onClick={this.clearRecoveryStatus.bind(this)}
            />
          </div>
          : null
      }
      <div className={css(paymentCommon.panel, styles.recoveryContent)}>
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
      </div>
    </div>
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
    return <div className={css(paymentCommon.advanceFooter)}>
      <div className={css(styles.recoveryFooterButtons)}>
        <Button l10nId='recover'
          className={css(commonStyles.primaryButton)}
          onClick={this.recoverWallet}
        />
        <Button l10nId='recoverFromFile'
          className={css(commonStyles.primaryButton, paymentCommon.marginButtons)}
          onClick={this.recoverWalletFromFile}
        />
        <Button l10nId='cancel'
          className={css(commonStyles.whiteButton, commonStyles.inlineButton, paymentCommon.marginButtons)}
          onClick={this.props.hideOverlay.bind(this, 'ledgerRecovery')}
        />
      </div>
    </div>
  }
}

const styles = StyleSheet.create({
  recoveryContent: {
    paddingLeft: '50px',
    paddingRight: '50px',
    marginTop: 0,
    marginBottom: 0
  },
  recoveryContent__h4: {
    marginBottom: globalStyles.spacing.paymentsMargin
  },
  recoveryContent__h3: {
    marginBottom: globalStyles.spacing.modalPanelHeaderMarginBottom
  },
  ledgerRecoveryContent: {
    marginBottom: globalStyles.spacing.paymentsMargin
  },

  recoveryOverlay: {
    backgroundColor: globalStyles.color.black75,
    border: `1px solid ${globalStyles.color.black75}`,
    position: 'absolute',
    top: '-1px',
    left: '-1px',
    width: '100%',
    height: '100%',
    textAlign: 'center',
    zIndex: 999
  },
  recoveryOverlay__h1: {
    color: '#fff',
    marginTop: '120px'
  },
  recoveryOverlay__p: {
    color: '#fff'
  },
  spaceAround: {
    margin: '50px auto'
  },
  recoveryFooterButtons: {
    float: 'right'
  }
})

module.exports = {
  LedgerRecoveryContent,
  LedgerRecoveryFooter
}
