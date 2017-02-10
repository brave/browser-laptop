/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

// Note that these are webpack requires, not CommonJS node requiring requires
const React = require('react')
const ImmutableComponent = require('../../../../js/components/immutableComponent')
const {l10nErrorText} = require('../../../common/lib/httpUtil')
const aboutActions = require('../../../../js/about/aboutActions')
const getSetting = require('../../../../js/settings').getSetting
const settings = require('../../../../js/constants/settings')
const ModalOverlay = require('../../../../js/components/modalOverlay')
const coinbaseCountries = require('../../../../js/constants/coinbaseCountries')
const {changeSetting} = require('../../lib/settingsUtil')
const moment = require('moment')
moment.locale(navigator.language)

// Components
const Button = require('../../../../js/components/button')
const {FormTextbox, RecoveryKeyTextbox} = require('../textbox')
const {FormDropdown, SettingDropdown} = require('../dropdown')
const {SettingsList, SettingItem, SettingCheckbox} = require('../settings')

class PaymentsTab extends ImmutableComponent {
  constructor () {
    super()
    this.state = {
      FirstRecoveryKey: '',
      SecondRecoveryKey: ''
    }

    this.printKeys = this.printKeys.bind(this)
    this.saveKeys = this.saveKeys.bind(this)
    this.createWallet = this.createWallet.bind(this)
    this.recoverWallet = this.recoverWallet.bind(this)
    this.handleFirstRecoveryKeyChange = this.handleFirstRecoveryKeyChange.bind(this)
    this.handleSecondRecoveryKeyChange = this.handleSecondRecoveryKeyChange.bind(this)
  }

  createWallet () {
    if (!this.props.ledgerData.get('created')) {
      aboutActions.createWallet()
    }
  }

  handleFirstRecoveryKeyChange (e) {
    this.setState({FirstRecoveryKey: e.target.value})
  }

  handleSecondRecoveryKeyChange (e) {
    this.setState({SecondRecoveryKey: e.target.value})
  }

  recoverWallet () {
    aboutActions.ledgerRecoverWallet(this.state.FirstRecoveryKey, this.state.SecondRecoveryKey)
  }

  recoverWalletFromFile () {
    aboutActions.ledgerRecoverWalletFromFile()
  }

  copyToClipboard (text) {
    aboutActions.setClipboard(text)
  }

  generateKeyFile (backupAction) {
    aboutActions.ledgerGenerateKeyFile(backupAction)
  }

  clearRecoveryStatus () {
    aboutActions.clearRecoveryStatus()
    this.props.hideAdvancedOverlays()
  }

  printKeys () {
    this.generateKeyFile('print')
  }

  saveKeys () {
    this.generateKeyFile('save')
  }

  get enabled () {
    return getSetting(settings.PAYMENTS_ENABLED, this.props.settings)
  }

  get fundsAmount () {
    if (!this.props.ledgerData.get('created')) {
      return null
    }

    return <div className='balance'>
      {
      !(this.props.ledgerData.get('balance') === undefined || this.props.ledgerData.get('balance') === null)
        ? <FormTextbox data-test-id='fundsAmount' readOnly value={this.btcToCurrencyString(this.props.ledgerData.get('balance'))} />
        : <span><span data-test-id='accountBalanceLoading' data-l10n-id='accountBalanceLoading' /></span>
      }
      <a href='https://brave.com/Payments_FAQ.html' target='_blank'>
        <span className='fa fa-question-circle fundsFAQ' />
      </a>
    </div>
  }

  get walletButton () {
    const buttonText = this.props.ledgerData.get('created')
      ? 'addFundsTitle'
      : (this.props.ledgerData.get('creating') ? 'creatingWallet' : 'createWallet')
    const onButtonClick = this.props.ledgerData.get('created')
      ? this.props.showOverlay.bind(this, 'addFunds')
      : (this.props.ledgerData.get('creating') ? () => {} : this.createWallet)
    return <Button data-test-id={buttonText} l10nId={buttonText} className='primaryButton addFunds' onClick={onButtonClick.bind(this)} disabled={this.props.ledgerData.get('creating')} />
  }

  get paymentHistoryButton () {
    const walletCreated = this.props.ledgerData.get('created') && !this.props.ledgerData.get('creating')
    const walletTransactions = this.props.ledgerData.get('transactions')
    const walletHasTransactions = walletTransactions && walletTransactions.size
    let buttonText

    if ((!walletCreated) || (!this.nextReconcileDate)) {
      return null
    } else if (!walletHasTransactions) {
      buttonText = 'noPaymentHistory'
    } else {
      buttonText = 'viewPaymentHistory'
    }

    const l10nDataArgs = {
      reconcileDate: this.nextReconcileDate
    }

    const onButtonClick = this.props.showOverlay.bind(this, 'paymentHistory')

    return <Button
      className='paymentHistoryButton'
      l10nId={buttonText}
      l10nArgs={l10nDataArgs}
      onClick={onButtonClick.bind(this)}
      disabled={this.props.ledgerData.get('creating')}
      />
  }

  get walletStatus () {
    const ledgerData = this.props.ledgerData
    let status = {}
    if (ledgerData.get('error')) {
      status.id = 'statusOnError'
    } else if (ledgerData.get('created')) {
      const transactions = ledgerData.get('transactions')
      const pendingFunds = Number(ledgerData.get('unconfirmed') || 0)
      if (pendingFunds + Number(ledgerData.get('balance') || 0) <
          0.9 * Number(ledgerData.get('btc') || 0)) {
        status.id = 'insufficientFundsStatus'
      } else if (pendingFunds > 0) {
        status.id = 'pendingFundsStatus'
        status.args = {funds: this.btcToCurrencyString(pendingFunds)}
      } else if (transactions && transactions.size > 0) {
        status.id = 'defaultWalletStatus'
      } else {
        status.id = 'createdWalletStatus'
      }
    } else if (ledgerData.get('creating')) {
      status.id = 'creatingWalletStatus'
    } else {
      status.id = 'createWalletStatus'
    }
    return status
  }

  get tableContent () {
    const {LedgerTable} = require('../../../../js/about/preferences')
    // TODO: This should be sortable. #2497
    return <LedgerTable ledgerData={this.props.ledgerData}
      settings={this.props.settings}
      onChangeSetting={this.props.onChangeSetting}
      siteSettings={this.props.siteSettings} />
  }

  get overlayTitle () {
    if (coinbaseCountries.indexOf(this.props.ledgerData.get('countryCode')) > -1) {
      return 'addFunds'
    } else {
      return 'addFundsAlternate'
    }
  }

  get overlayContent () {
    const {BitcoinDashboard} = require('../../../../js/about/preferences')
    return <BitcoinDashboard ledgerData={this.props.ledgerData}
      settings={this.props.settings}
      bitcoinOverlayVisible={this.props.bitcoinOverlayVisible}
      qrcodeOverlayVisible={this.props.qrcodeOverlayVisible}
      showOverlay={this.props.showOverlay.bind(this, 'bitcoin')}
      hideOverlay={this.props.hideOverlay.bind(this, 'bitcoin')}
      showQRcode={this.props.showOverlay.bind(this, 'qrcode')}
      hideQRcode={this.props.hideOverlay.bind(this, 'qrcode')}
      hideParentOverlay={this.props.hideOverlay.bind(this, 'addFunds')} />
  }

  get paymentHistoryContent () {
    const {PaymentHistory} = require('../../../../js/about/preferences')
    return <PaymentHistory ledgerData={this.props.ledgerData} />
  }

  get paymentHistoryFooter () {
    let ledgerData = this.props.ledgerData
    if (!ledgerData.get('reconcileStamp')) {
      return null
    }
    const timestamp = ledgerData.get('reconcileStamp')
    const now = new Date().getTime()
    let l10nDataId = 'paymentHistoryFooterText'
    if (timestamp <= now) {
      l10nDataId = (timestamp <= (now - (24 * 60 * 60 * 1000)))
                     ? 'paymentHistoryOverdueFooterText' : 'paymentHistoryDueFooterText'
    }

    const nextReconcileDateRelative = formattedTimeFromNow(timestamp)
    const l10nDataArgs = {
      reconcileDate: nextReconcileDateRelative
    }
    return <div className='paymentHistoryFooter'>
      <div className='nextPaymentSubmission'>
        <span data-l10n-id={l10nDataId} data-l10n-args={JSON.stringify(l10nDataArgs)} />
      </div>
      <Button l10nId='paymentHistoryOKText' className='okButton primaryButton' onClick={this.props.hideOverlay.bind(this, 'paymentHistory')} />
    </div>
  }

  get advancedSettingsContent () {
    const minDuration = this.props.ledgerData.getIn(['synopsisOptions', 'minDuration'])
    const minPublisherVisits = this.props.ledgerData.getIn(['synopsisOptions', 'minPublisherVisits'])

    return <div className='board'>
      <div className='panel advancedSettings'>
        <div className='settingsPanelDivider'>
          <div className='minimumPageTimeSetting' data-l10n-id='minimumPageTimeSetting' />
          <SettingsList>
            <SettingItem>
              <SettingDropdown
                data-test-id='durationSelector'
                defaultValue={minDuration || 8000}
                onChange={changeSetting.bind(null, this.props.onChangeSetting, settings.MINIMUM_VISIT_TIME)}>>
                <option value='5000'>5 seconds</option>
                <option value='8000'>8 seconds</option>
                <option value='60000'>1 minute</option>
              </SettingDropdown>
            </SettingItem>
          </SettingsList>
          <div className='minimumVisitsSetting' data-l10n-id='minimumVisitsSetting' />
          <SettingsList>
            <SettingItem>
              <SettingDropdown
                data-test-id='visitSelector'
                defaultValue={minPublisherVisits || 1}
                onChange={changeSetting.bind(null, this.props.onChangeSetting, settings.MINIMUM_VISITS)}>>>
                <option value='1'>1 visits</option>
                <option value='5'>5 visits</option>
                <option value='10'>10 visits</option>
              </SettingDropdown>
            </SettingItem>
          </SettingsList>
        </div>
        <div className='settingsPanelDivider'>
          {this.enabled
            ? <SettingsList>
              <SettingCheckbox
                dataL10nId='minimumPercentage'
                prefKey={settings.MINIMUM_PERCENTAGE}
                settings={this.props.settings}
                onChangeSetting={this.props.onChangeSetting} />
              <SettingCheckbox
                dataL10nId='notifications'
                prefKey={settings.PAYMENTS_NOTIFICATIONS}
                settings={this.props.settings}
                onChangeSetting={this.props.onChangeSetting} />
            </SettingsList>
            : null}
        </div>
      </div>
    </div>
  }

  get advancedSettingsFooter () {
    return <div className='panel advancedSettingsFooter'>
      <Button l10nId='backupLedger' className='primaryButton' onClick={this.props.showOverlay.bind(this, 'ledgerBackup')} />
      <Button l10nId='recoverLedger' className='primaryButton' onClick={this.props.showOverlay.bind(this, 'ledgerRecovery')} />
      <Button l10nId='done' className='whiteButton inlineButton' onClick={this.props.hideOverlay.bind(this, 'advancedSettings')} />
    </div>
  }

  get ledgerBackupContent () {
    const paymentId = this.props.ledgerData.get('paymentId')
    const passphrase = this.props.ledgerData.get('passphrase')

    return <div className='board'>
      <div className='panel ledgerBackupContent'>
        <span data-l10n-id='ledgerBackupContent' />
        <div className='copyKeyContainer'>
          <div className='copyContainer'>
            <Button l10nId='copy' className='copyButton whiteButton' onClick={this.copyToClipboard.bind(this, paymentId)} />
          </div>
          <div className='keyContainer'>
            <h3 data-l10n-id='firstKey' />
            <span>{paymentId}</span>
          </div>
        </div>
        <div className='copyKeyContainer'>
          <div className='copyContainer'>
            <Button l10nId='copy' className='copyButton whiteButton' onClick={this.copyToClipboard.bind(this, passphrase)} />
          </div>
          <div className='keyContainer'>
            <h3 data-l10n-id='secondKey' />
            <span>{passphrase}</span>
          </div>
        </div>
      </div>
    </div>
  }

  get ledgerBackupFooter () {
    return <div className='panel advancedSettingsFooter'>
      <Button l10nId='printKeys' className='primaryButton' onClick={this.printKeys} />
      <Button l10nId='saveRecoveryFile' className='primaryButton' onClick={this.saveKeys} />
      <Button l10nId='done' className='whiteButton inlineButton' onClick={this.props.hideOverlay.bind(this, 'ledgerBackup')} />
    </div>
  }

  get ledgerRecoveryContent () {
    const l10nDataArgs = {
      balance: this.btcToCurrencyString(this.props.ledgerData.get('balance'))
    }
    const recoverySucceeded = this.props.ledgerData.get('recoverySucceeded')
    const recoveryError = this.props.ledgerData.getIn(['error', 'error'])
    const isNetworkError = typeof recoveryError === 'object'

    return <div className='board'>
      {
        recoverySucceeded === true
        ? <div className='recoveryOverlay'>
          <h1 data-l10n-id='ledgerRecoverySucceeded' />
          <p className='spaceAround' data-l10n-id='balanceRecovered' data-l10n-args={JSON.stringify(l10nDataArgs)} />
          <Button l10nId='ok' className='whiteButton inlineButton' onClick={this.clearRecoveryStatus.bind(this)} />
        </div>
        : null
      }
      {
        (recoverySucceeded === false && recoveryError && isNetworkError)
        ? <div className='recoveryOverlay'>
          <h1 data-l10n-id='ledgerRecoveryNetworkFailedTitle' className='recoveryError' />
          <p data-l10n-id='ledgerRecoveryNetworkFailedMessage' className='spaceAround' />
          <Button l10nId='ok' className='whiteButton inlineButton' onClick={this.clearRecoveryStatus.bind(this)} />
        </div>
        : null
      }
      {
        (recoverySucceeded === false && recoveryError && !isNetworkError)
        ? <div className='recoveryOverlay'>
          <h1 data-l10n-id='ledgerRecoveryFailedTitle' />
          <p data-l10n-id='ledgerRecoveryFailedMessage' className='spaceAround' />
          <Button l10nId='ok' className='whiteButton inlineButton' onClick={this.clearRecoveryStatus.bind(this)} />
        </div>
        : null
      }
      <div className='panel recoveryContent'>
        <h4 data-l10n-id='ledgerRecoverySubtitle' />
        <div className='ledgerRecoveryContent' data-l10n-id='ledgerRecoveryContent' />
        <SettingsList>
          <SettingItem>
            <h3 data-l10n-id='firstRecoveryKey' />
            <RecoveryKeyTextbox id='firstRecoveryKey' onChange={this.handleFirstRecoveryKeyChange} />
            <h3 data-l10n-id='secondRecoveryKey' />
            <RecoveryKeyTextbox id='secondRecoveryKey' onChange={this.handleSecondRecoveryKeyChange} />
          </SettingItem>
        </SettingsList>
      </div>
    </div>
  }

  get ledgerRecoveryFooter () {
    return <div className='panel advancedSettingsFooter'>
      <div className='recoveryFooterButtons'>
        <Button l10nId='recover' className='primaryButton' onClick={this.recoverWallet} />
        <Button l10nId='recoverFromFile' className='primaryButton' onClick={this.recoverWalletFromFile} />
        <Button l10nId='cancel' className='whiteButton' onClick={this.props.hideOverlay.bind(this, 'ledgerRecovery')} />
      </div>
    </div>
  }

  get nextReconcileDate () {
    const ledgerData = this.props.ledgerData
    if ((ledgerData.get('error')) || (!ledgerData.get('reconcileStamp'))) {
      return null
    }
    const timestamp = ledgerData.get('reconcileStamp')
    return formattedTimeFromNow(timestamp)
  }

  get nextReconcileMessage () {
    const ledgerData = this.props.ledgerData
    const nextReconcileDateRelative = this.nextReconcileDate
    if (!nextReconcileDateRelative) {
      return null
    }

    const timestamp = ledgerData.get('reconcileStamp')
    const now = new Date().getTime()
    let l10nDataId = 'statusNextReconcileDate'
    if (timestamp <= now) {
      l10nDataId = (timestamp <= (now - (24 * 60 * 60 * 1000)))
                     ? 'paymentHistoryOverdueFooterText' : 'statusNextReconcileToday'
    }

    const l10nDataArgs = {
      reconcileDate: nextReconcileDateRelative
    }
    return <div className='nextReconcileDate' data-l10n-args={JSON.stringify(l10nDataArgs)} data-l10n-id={l10nDataId} />
  }

  get ledgerDataErrorText () {
    const ledgerError = this.props.ledgerData.get('error')
    if (!ledgerError) {
      return null
    }
    // 'error' here is a chromium webRequest error as returned by request.js
    const errorCode = ledgerError.get('error').get('errorCode')
    return l10nErrorText(errorCode)
  }

  btcToCurrencyString (btc) {
    const balance = Number(btc || 0)
    const currency = this.props.ledgerData.get('currency') || 'USD'
    if (balance === 0) {
      return `0 ${currency}`
    }
    if (this.props.ledgerData.get('btc') && typeof this.props.ledgerData.get('amount') === 'number') {
      const btcValue = this.props.ledgerData.get('btc') / this.props.ledgerData.get('amount')
      const fiatValue = (balance / btcValue).toFixed(2)
      let roundedValue = Math.floor(fiatValue)
      const diff = fiatValue - roundedValue

      if (diff > 0.74) roundedValue += 0.75
      else if (diff > 0.49) roundedValue += 0.50
      else if (diff > 0.24) roundedValue += 0.25
      return `${roundedValue.toFixed(2)} ${currency}`
    }
    return `${balance} BTC`
  }

  get disabledContent () {
    return <div className='disabledContent'>
      <div className='paymentsMessage'>
        <h3 data-l10n-id='paymentsWelcomeTitle' />
        <div data-l10n-id='paymentsWelcomeText1' />
        <div className='boldText' data-l10n-id='paymentsWelcomeText2' />
        <div data-l10n-id='paymentsWelcomeText3' />
        <div data-l10n-id='paymentsWelcomeText4' />
        <div data-l10n-id='paymentsWelcomeText5' />
        <div>
          <span data-l10n-id='paymentsWelcomeText6' />&nbsp;
          <a href='https://brave.com/Payments_FAQ.html' target='_blank' data-l10n-id='paymentsWelcomeLink' />&nbsp;
          <span data-l10n-id='paymentsWelcomeText7' />
        </div>
      </div>
      <div className='paymentsSidebar'>
        <h2 data-l10n-id='paymentsSidebarText1' />
        <div data-l10n-id='paymentsSidebarText2' />
        <a href='https://www.privateinternetaccess.com/' target='_blank'><div className='paymentsSidebarPIA' /></a>
        <div data-l10n-id='paymentsSidebarText3' />
        <a href='https://www.bitgo.com/' target='_blank'><div className='paymentsSidebarBitgo' /></a>
        <div data-l10n-id='paymentsSidebarText4' />
        <a href='https://www.coinbase.com/' target='_blank'><div className='paymentsSidebarCoinbase' /></a>
      </div>
    </div>
  }

  get enabledContent () {
    // TODO: report when funds are too low
    // TODO: support non-USD currency
    return <div>
      <div className='walletBar'>
        <table>
          <thead>
            <tr>
              <th data-l10n-id='monthlyBudget' />
              <th data-l10n-id='accountBalance' />
              <th data-l10n-id='status' />
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <SettingsList>
                  <SettingItem>
                    <FormDropdown
                      data-test-id='fundsSelectBox'
                      value={getSetting(settings.PAYMENTS_CONTRIBUTION_AMOUNT,
                        this.props.settings)}
                      onChange={changeSetting.bind(null, this.props.onChangeSetting, settings.PAYMENTS_CONTRIBUTION_AMOUNT)}>
                      {
                        [5, 10, 15, 20].map((amount) =>
                          <option value={amount}>{amount} {this.props.ledgerData.get('currency') || 'USD'}</option>
                        )
                      }
                    </FormDropdown>
                  </SettingItem>
                  <SettingItem>
                    {this.paymentHistoryButton}
                  </SettingItem>
                </SettingsList>
              </td>
              <td>
                {
                  this.props.ledgerData.get('error') && this.props.ledgerData.get('error').get('caller') === 'getWalletProperties'
                    ? <div>
                      <div data-l10n-id='accountBalanceConnectionError' />
                      <div className='accountBalanceError' data-l10n-id={this.ledgerDataErrorText} />
                    </div>
                    : <div>
                      <SettingsList>
                        <SettingItem>
                          {this.fundsAmount}
                          {this.walletButton}
                        </SettingItem>
                      </SettingsList>
                    </div>
                }
              </td>
              <td>
                <div className='walletStatus' data-l10n-id={this.walletStatus.id} data-l10n-args={this.walletStatus.args ? JSON.stringify(this.walletStatus.args) : null} />
                {this.nextReconcileMessage}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      {this.tableContent}
    </div>
  }

  render () {
    return <div className='paymentsContainer'>
      {
      this.enabled && this.props.addFundsOverlayVisible
        ? <ModalOverlay title={this.overlayTitle} content={this.overlayContent} onHide={this.props.hideOverlay.bind(this, 'addFunds')} />
        : null
      }
      {
        this.enabled && this.props.paymentHistoryOverlayVisible
        ? <ModalOverlay title={'paymentHistoryTitle'} customTitleClasses={'paymentHistory'} content={this.paymentHistoryContent} footer={this.paymentHistoryFooter} onHide={this.props.hideOverlay.bind(this, 'paymentHistory')} />
        : null
      }
      {
        this.enabled && this.props.advancedSettingsOverlayVisible
        ? <ModalOverlay title={'advancedSettingsTitle'} content={this.advancedSettingsContent} footer={this.advancedSettingsFooter} onHide={this.props.hideOverlay.bind(this, 'advancedSettings')} />
        : null
      }
      {
        this.enabled && this.props.ledgerBackupOverlayVisible
        ? <ModalOverlay title={'ledgerBackupTitle'} content={this.ledgerBackupContent} footer={this.ledgerBackupFooter} onHide={this.props.hideOverlay.bind(this, 'ledgerBackup')} />
        : null
      }
      {
        this.enabled && this.props.ledgerRecoveryOverlayVisible
        ? <ModalOverlay title={'ledgerRecoveryTitle'} content={this.ledgerRecoveryContent} footer={this.ledgerRecoveryFooter} onHide={this.props.hideOverlay.bind(this, 'ledgerRecovery')} />
        : null
      }
      <div className='advancedSettingsWrapper'>
        {
          this.props.ledgerData.get('created') && this.enabled
          ? <Button
            l10nId='advancedSettings'
            className='advancedSettings whiteButton'
            onClick={this.props.showOverlay.bind(this, 'advancedSettings')} />
          : null
        }
      </div>
      <div className='titleBar'>
        <div className='sectionTitleWrapper pull-left'>
          <span className='sectionTitle'>Brave Payments</span>
          <span className='sectionSubTitle'>beta</span>
        </div>
        <div className='paymentsSwitches'>
          <div className='enablePaymentsSwitch'>
            <span data-l10n-id='off' />
            <SettingCheckbox dataL10nId='on' prefKey={settings.PAYMENTS_ENABLED} settings={this.props.settings} onChangeSetting={this.props.onChangeSetting} />
          </div>
          {
            this.props.ledgerData.get('created') && this.enabled
            ? <div className='autoSuggestSwitch'>
              <SettingCheckbox dataL10nId='autoSuggestSites' prefKey={settings.AUTO_SUGGEST_SITES} settings={this.props.settings} onChangeSetting={this.props.onChangeSetting} />
              <a className='moreInfoBtn fa fa-question-circle' href='https://brave.com/Payments_FAQ.html' target='_blank' data-l10n-id='paymentsFAQLink' />
            </div>
            : null
          }
        </div>
      </div>
      {
        this.enabled
          ? this.enabledContent
          : this.disabledContent
      }
    </div>
  }
}

function formattedTimeFromNow (timestamp) {
  return moment(new Date(timestamp)).fromNow()
}

module.exports = PaymentsTab
