/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const {StyleSheet, css} = require('aphrodite/no-important')

// util
const {batToCurrencyString} = require('../../../../common/lib/ledgerUtil')

// components
const ImmutableComponent = require('../../immutableComponent')
const BrowserButton = require('../../common/browserButton')
const {SettingsList, SettingItem} = require('../../common/settings')

// style
const globalStyles = require('../../styles/global')
const commonStyles = require('../../styles/commonStyles')

// other
const aboutActions = require('../../../../../js/about/aboutActions')
const appActions = require('../../../../../js/actions/appActions')
const keyCodes = require('../../../../../app/common/constants/keyCodes')

class LedgerRecoveryContent extends ImmutableComponent {
  constructor () {
    super()
    this.handleRecoveryKeyChange = this.handleRecoveryKeyChange.bind(this)
  }

  componentDidUpdate () {
    if (this.refs.ledgerRecoveryOverlay) {
      this.refs.ledgerRecoveryOverlay.focus()
    }
  }

  handleRecoveryKeyChange (e) {
    this.props.handleRecoveryKeyChange(e.target.value)
  }

  clearRecoveryStatus (success) {
    if (success) {
      this.props.hideAdvancedOverlays()
    }
    appActions.resetRecoverStatus()
  }

  onRecoveryOverlay (success) {
    this.clearRecoveryStatus(success)
    this.refs.ledgerRecoveryOverlay = null
    this.props.setOverlayName('ledgerRecovery')
  }

  onEscape (e, status) {
    e.stopPropagation()
    if (e.keyCode === keyCodes.ESC) {
      this.onRecoveryOverlay(status)
    }
  }

  render () {
    const l10nDataArgs = {
      balance: batToCurrencyString(this.props.ledgerData.get('balance'), this.props.ledgerData)
    }
    const recoverySucceeded = this.props.ledgerData.get('recoverySucceeded')
    const recoveryError = this.props.ledgerData.getIn(['error', 'error'])
    const recoveryInProgress = this.props.ledgerData.get('recoveryInProgress')
    const recoveryBalanceRecalculated = this.props.ledgerData.get('recoveryBalanceRecalculated') || false
    const isNetworkError = typeof recoveryError === 'object'

    return <section>
      {
        recoverySucceeded === true && recoveryBalanceRecalculated === false
          ? <section className={css(styles.recoveryOverlay)} onKeyDown={(e) => this.onEscape(e, true)} ref='ledgerRecoveryOverlay' tabIndex='0'>
            <h1 className={css(styles.recoveryOverlay__textColor)} data-l10n-id='ledgerRecoverySucceeded' />
            <p className={css(styles.recoveryOverlay__textColor, styles.recoveryOverlay__spaceAround)}
              data-l10n-id='recalculatingBalance'
              data-test-id='recalculatingBalance'
              data-l10n-args={JSON.stringify({balance: batToCurrencyString(this.props.ledgerData.get('balance'), this.props.ledgerData)})}
            />
            <BrowserButton secondaryColor
              l10nId='ok'
              testId='recoveryOverlayOkButton'
              onClick={this.onRecoveryOverlay.bind(this, true)}
            />
          </section>
          : null
      }
      {
        recoverySucceeded === true && recoveryBalanceRecalculated === true
          ? <section className={css(styles.recoveryOverlay)} onKeyDown={(e) => this.onEscape(e, true)} ref='ledgerRecoveryOverlay' tabIndex='0'>
            <h1 className={css(styles.recoveryOverlay__textColor)} data-l10n-id='ledgerRecoverySucceeded' />
            <p className={css(styles.recoveryOverlay__textColor, styles.recoveryOverlay__spaceAround)}
              data-l10n-id='balanceRecovered'
              data-test-id='balanceRecoveredMessage'
              data-l10n-args={JSON.stringify(l10nDataArgs)}
            />
            <BrowserButton secondaryColor
              l10nId='ok'
              testId='recoveryOverlayOkButton'
              onClick={this.onRecoveryOverlay.bind(this, true)}
            />
          </section>
          : null
      }
      {
        (recoverySucceeded === false && recoveryError && isNetworkError)
          ? <section className={css(styles.recoveryOverlay)} onKeyDown={(e) => this.onEscape(e, false)} ref='ledgerRecoveryOverlay' tabIndex='0'>
            <h1 className={css(styles.recoveryOverlay__textColor)} data-l10n-id='ledgerRecoveryNetworkFailedTitle' data-test-id='recoveryError' />
            <p className={css(styles.recoveryOverlay__textColor, styles.recoveryOverlay__spaceAround)}
              data-l10n-id='ledgerRecoveryNetworkFailedMessage'
              data-test-id='ledgerRecoveryFailedMessage'
            />
            <BrowserButton secondaryColor
              l10nId='ok'
              testId='recoveryOverlayErrorButton'
              onClick={this.onRecoveryOverlay.bind(this, false)}
            />
          </section>
          : null
      }
      {
        (recoverySucceeded === false && recoveryError && !isNetworkError)
          ? <section className={css(styles.recoveryOverlay)} onKeyDown={(e) => this.onEscape(e, false)} ref='ledgerRecoveryOverlay' tabIndex='0'>
            <h1 className={css(styles.recoveryOverlay__textColor)} data-l10n-id='ledgerRecoveryFailedTitle' />
            <p className={css(styles.recoveryOverlay__textColor, styles.recoveryOverlay__spaceAround)}
              data-l10n-id='ledgerRecoveryFailedMessage'
              data-test-id='ledgerRecoveryFailedMessage'
            />
            <BrowserButton secondaryColor
              l10nId='ok'
              testId='recoveryOverlayErrorButton'
              onClick={this.onRecoveryOverlay.bind(this, false)}
            />
          </section>
          : null
      }
      {
        recoveryInProgress === true
          ? <section className={css(styles.recoveryOverlay)} onKeyDown={(e) => this.onEscape(e, false)} ref='ledgerRecoveryOverlay' tabIndex='0'>
            <h1 className={css(styles.recoveryOverlay__textColor)} data-l10n-id='ledgerRecoveryInProgressTitle' />
            <p className={css(styles.recoveryOverlay__textColor, styles.recoveryOverlay__spaceAround)}
              data-l10n-id='ledgerRecoveryInProgress'
              data-test-id='ledgerRecoveryInProgress'
            />
            <BrowserButton secondaryColor
              l10nId='cancel'
              testId='recoveryOverlayErrorButton'
              onClick={this.onRecoveryOverlay.bind(this, false)}
            />
          </section>
          : null
      }
      <h4 className={css(styles.recoveryContent__h4)} data-l10n-id='ledgerRecoverySubtitle' />
      <SettingsList className={css(commonStyles.noMarginBottom)}>
        <SettingItem>
          <textarea className={css(
            commonStyles.formControl,
            commonStyles.textArea,
            styles.recoveryContent__recoveryKey
          )}
            id='recoveryKey'
            spellCheck='false'
            onChange={this.handleRecoveryKeyChange}
          />
        </SettingItem>
      </SettingsList>
      <div className={css(styles.ledgerRecoveryContent)} data-l10n-id='ledgerRecoveryContent' />
    </section>
  }
}

class LedgerRecoveryFooter extends ImmutableComponent {
  constructor () {
    super()
    this.recoverWallet = this.recoverWallet.bind(this)
  }

  recoverWallet () {
    aboutActions.ledgerRecoverWallet(this.props.state.recoveryKey)
    this.props.setOverlayName('ledgerRecoveryStatus')
  }

  recoverWalletFromFile () {
    aboutActions.ledgerRecoverWalletFromFile()
    this.props.setOverlayName('ledgerRecoveryStatus')
  }

  render () {
    return <div className={css(styles.footer__wrapper)}>
      <div className={css(styles.footer__wrapper__left)}>
        <BrowserButton groupedItem secondaryColor
          l10nId='recoverFromFile'
          testId='recoverFromFileButton'
          onClick={this.recoverWalletFromFile.bind(this)}
        />
      </div>
      <div>
        <BrowserButton groupedItem secondaryColor
          l10nId='cancel'
          testId='cancelButton'
          onClick={this.props.hideOverlay.bind(this, 'ledgerRecovery')}
        />
        <BrowserButton groupedItem primaryColor
          l10nId='recover'
          testId='recoverButton'
          onClick={this.recoverWallet.bind(this)}
        />
      </div>
    </div>
  }
}

const styles = StyleSheet.create({
  recoveryContent__h4: {
    margin: '15px 0',
    fontSize: '17px'
  },
  recoveryContent__h3: {
    marginBottom: globalStyles.spacing.modalPanelHeaderMarginBottom
  },
  recoveryContent__recoveryKey: {
    height: '65px'
  },
  ledgerRecoveryContent: {
    marginBottom: globalStyles.spacing.dialogInsideMargin,
    fontSize: '13px',
    marginTop: '15px'
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
    zIndex: 999,
    outline: 'none'
  },
  recoveryOverlay__textColor: {
    color: '#fff'
  },
  recoveryOverlay__spaceAround: {
    margin: '50px auto'
  },

  footer__wrapper: {
    flex: 1,
    display: 'flex'
  },

  footer__wrapper__left: {
    flex: 1
  }
})

module.exports = {
  LedgerRecoveryContent,
  LedgerRecoveryFooter
}
