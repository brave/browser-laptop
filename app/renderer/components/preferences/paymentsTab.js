/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

// Note that these are webpack requires, not CommonJS node requiring requires
const React = require('react')
const {StyleSheet, css} = require('aphrodite/no-important')

// Components
const ImmutableComponent = require('../../../../js/components/immutableComponent')
const ModalOverlay = require('../../../../js/components/modalOverlay')
const {SettingCheckbox} = require('../settings')
const DisabledContent = require('./payment/disabledContent')
const EnabledContent = require('./payment/enabledContent')
const BitcoinDashboard = require('./payment/bitcoinDashboard')
const {AdvancedSettingsContent, AdvancedSettingsFooter} = require('./payment/advancedSettings')
const {HistoryContent, HistoryFooter} = require('./payment/history')
const {LedgerBackupContent, LedgerBackupFooter} = require('./payment/ledgerBackup')
const {LedgerRecoveryContent, LedgerRecoveryFooter} = require('./payment/ledgerRecovery')

// style
const cx = require('../../../../js/lib/classSet')
const globalStyles = require('../styles/global')
const {paymentStyles} = require('../styles/payment')
const settingIcon = require('../../../extensions/brave/img/ledger/icon_settings.svg')
const historyIcon = require('../../../extensions/brave/img/ledger/icon_history.svg')

// other
const getSetting = require('../../../../js/settings').getSetting
const settings = require('../../../../js/constants/settings')
const coinbaseCountries = require('../../../../js/constants/coinbaseCountries')

class PaymentsTab extends ImmutableComponent {
  constructor () {
    super()
    this.state = {
      FirstRecoveryKey: '',
      SecondRecoveryKey: ''
    }

    this.handleFirstRecoveryKeyChange = this.handleFirstRecoveryKeyChange.bind(this)
    this.handleSecondRecoveryKeyChange = this.handleSecondRecoveryKeyChange.bind(this)
  }

  handleFirstRecoveryKeyChange (key) {
    this.setState({FirstRecoveryKey: key})
    this.forceUpdate()
  }

  handleSecondRecoveryKeyChange (key) {
    this.setState({SecondRecoveryKey: key})
    this.forceUpdate()
  }

  get hasWalletTransaction () {
    const ledgerData = this.props.ledgerData
    const walletCreated = ledgerData.get('created') && !ledgerData.get('creating')
    const walletTransactions = ledgerData.get('transactions')
    const walletHasReconcile = ledgerData.get('reconcileStamp')
    const walletHasTransactions = walletTransactions && walletTransactions.size

    return !(!walletCreated || !walletHasTransactions || !walletHasReconcile)
  }

  get enabled () {
    return getSetting(settings.PAYMENTS_ENABLED, this.props.settings)
  }

  get overlayTitle () {
    if (coinbaseCountries.indexOf(this.props.ledgerData.get('countryCode')) > -1) {
      return 'addFunds'
    } else {
      return 'addFundsAlternate'
    }
  }

  get overlayContent () {
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

  render () {
    const enabled = this.props.ledgerData.get('created')
    return <div className={cx({
      paymentsContainer: true,
      [css(styles.paymentsContainer)]: true
    })} data-test-id='paymentsContainer'>
      {
      this.enabled && this.props.addFundsOverlayVisible
        ? <ModalOverlay title={this.overlayTitle} content={this.overlayContent} onHide={this.props.hideOverlay.bind(this, 'addFunds')} />
        : null
      }
      {
        this.enabled && this.props.paymentHistoryOverlayVisible
          ? <ModalOverlay
            title={'paymentHistoryTitle'}
            customTitleClasses={'paymentHistory'}
            content={<HistoryContent
              ledgerData={this.props.ledgerData}
            />}
            footer={<HistoryFooter
              ledgerData={this.props.ledgerData}
              hideOverlay={this.props.hideOverlay}
            />}
            onHide={this.props.hideOverlay.bind(this, 'paymentHistory')}
          />
          : null
      }
      {
        this.enabled && this.props.advancedSettingsOverlayVisible
        ? <ModalOverlay
          title={'advancedSettingsTitle'}
          content={<AdvancedSettingsContent
            ledgerData={this.props.ledgerData}
            settings={this.props.settings}
            onChangeSetting={this.props.onChangeSetting}
          />}
          footer={<AdvancedSettingsFooter
            showOverlay={this.props.showOverlay}
            hideOverlay={this.props.hideOverlay}
          />}
          onHide={this.props.hideOverlay.bind(this, 'advancedSettings')}
        />
        : null
      }
      {
        this.enabled && this.props.ledgerBackupOverlayVisible
        ? <ModalOverlay
          title={'ledgerBackupTitle'}
          content={<LedgerBackupContent
            ledgerData={this.props.ledgerData}
          />}
          footer={<LedgerBackupFooter
            hideOverlay={this.props.hideOverlay}
          />}
          onHide={this.props.hideOverlay.bind(this, 'ledgerBackup')} />
        : null
      }
      {
        this.enabled && this.props.ledgerRecoveryOverlayVisible
        ? <ModalOverlay title={'ledgerRecoveryTitle'}
          content={<LedgerRecoveryContent
            ledgerData={this.props.ledgerData}
            hideAdvancedOverlays={this.props.hideAdvancedOverlays.bind(this)}
            handleFirstRecoveryKeyChange={this.handleFirstRecoveryKeyChange.bind(this)}
            handleSecondRecoveryKeyChange={this.handleSecondRecoveryKeyChange.bind(this)}
          />}
          footer={<LedgerRecoveryFooter
            state={this.state}
            hideOverlay={this.props.hideOverlay}
          />}
          onHide={this.props.hideOverlay.bind(this, 'ledgerRecovery')}
        />
        : null
      }

      <div className={css(styles.flexAlignEnd)}>
        <div className='sectionTitleWrapper'>
          <span className='sectionTitle'>Brave Payments</span>
          <span className='sectionSubTitle'>beta</span>
        </div>

        <div className={css(
          styles.flexAlignCenter,
          styles.paymentsSwitches
        )}>
          <div className={css(styles.flexAlignEnd, styles.switchWrap)} data-test-id='enablePaymentsSwitch'>
            <span className={css(styles.switchWrap__switchSpan)} data-l10n-id='off' />
            <SettingCheckbox dataL10nId='on'
              prefKey={settings.PAYMENTS_ENABLED}
              settings={this.props.settings}
              onChangeSetting={this.props.onChangeSetting}
              switchClassName={css(styles.switchWrap__switchControl)}
              labelClassName={css(styles.switchWrap__label)}
            />
          </div>
          {
            this.enabled
            ? <div className={css(
                styles.flexAlignCenter,
                styles.switchWrap,
                styles.switchWrap__right
              )}>
              <div className={css(styles.switchWrap__autoSuggestSwitch)}>
                <div className={css(styles.flexAlignCenter, styles.autoSuggestSwitch__subtext)}>
                  <SettingCheckbox dataL10nId='autoSuggestSites'
                    prefKey={settings.AUTO_SUGGEST_SITES}
                    settings={this.props.settings}
                    disabled={!enabled}
                    onChangeSetting={this.props.onChangeSetting}
                    switchClassName={css(styles.switchWrap__switchControl)}
                  />
                  <a className={cx({
                    fa: true,
                    'fa-question-circle': true,
                    [css(styles.autoSuggestSwitch__moreInfo)]: true,
                    [css(styles.autoSuggestSwitch__moreInfoBtnSuggest)]: true
                  })}
                    href='https://brave.com/Payments_FAQ.html'
                    target='_blank'
                    data-l10n-id='paymentsFAQLink'
                  />
                </div>
              </div>
              <div className={css(styles.switchWrap__mainIconsRight)}>
                <a
                  data-test-id={this.hasWalletTransaction ? 'paymentHistoryButton' : 'disabledPaymentHistoryButton'}
                  data-l10n-id='paymentHistoryIcon'
                  className={css(
                    styles.switchWrap__mainIcons,
                    styles.mainIcons__historyIcon,
                    !this.hasWalletTransaction && styles.mainIcons__historyDisabled
                  )}
                  onClick={(enabled && this.hasWalletTransaction) ? this.props.showOverlay.bind(this, 'paymentHistory') : () => {}}
                />
                <a
                  data-test-id={!enabled ? 'advancedSettingsButtonLoading' : 'advancedSettingsButton'}
                  data-l10n-id='advancedSettingsIcon'
                  className={css(
                    styles.switchWrap__mainIcons,
                    styles.mainIcons__settingIcon,
                    !enabled && styles.mainIcons__settingIconDisabled
                  )}
                  onClick={enabled ? this.props.showOverlay.bind(this, 'advancedSettings') : () => {}}
                />
              </div>
            </div>
            : null
          }
        </div>
      </div>
      {
        this.enabled
          ? <EnabledContent settings={this.props.settings}
            onChangeSetting={this.props.onChangeSetting}
            ledgerData={this.props.ledgerData}
            showOverlay={this.props.showOverlay}
            siteSettings={this.props.siteSettings}
          />
          : <DisabledContent />
      }
    </div>
  }
}

const styles = StyleSheet.create({
  flexAlignCenter: {
    display: 'flex',
    alignItems: 'center'
  },
  flexAlignEnd: {
    display: 'flex',
    alignItems: 'flex-end'
  },

  paymentsContainer: {
    position: 'relative',
    overflowX: 'hidden',
    width: '805px',
    marginTop: '15px'
  },
  paymentsSwitches: {
    display: 'flex',
    position: 'relative',
    bottom: '2px',
    minHeight: '29px'
  },

  switchWrap: {
    width: paymentStyles.width.tableCell
  },
  switchWrap__switchControl: {
    // TODO: Refactor switchControls.less
    paddingTop: '0 !important',
    paddingBottom: '0 !important'
  },
  switchWrap__switchSpan: {
    color: '#999',
    fontWeight: 'bold'
  },
  switchWrap__label: {
    fontWeight: 'bold',
    color: globalStyles.color.braveOrange
  },
  switchWrap__right: {
    justifyContent: 'space-between',
    position: 'relative'
  },

  switchWrap__autoSuggestSwitch: {
    // TODO: Refactor switchControls.less
    position: 'relative',
    right: '5px',
    top: '1px'
  },
  autoSuggestSwitch__subtext: {
    fontSize: globalStyles.fontSize.settingItemSubtext
  },
  autoSuggestSwitch__moreInfo: {
    color: globalStyles.color.commonTextColor
  },
  autoSuggestSwitch__moreInfoBtnSuggest: {
    position: 'relative',
    left: '5px',
    cursor: 'pointer',

    // TODO: refactor preferences.less to remove !important
    ':hover': {
      textDecoration: 'none !important'
    }
  },

  switchWrap__mainIconsRight: {
    position: 'relative',
    right: '12px',
    top: '3.5px'
  },
  switchWrap__mainIcons: {
    backgroundColor: globalStyles.color.braveOrange,
    width: '25px',
    height: '26px',
    display: 'inline-block',
    position: 'relative',

    ':hover': {
      backgroundColor: globalStyles.color.braveDarkOrange
    }
  },

  mainIcons__historyIcon: {
    right: '5px',
    WebkitMaskImage: `url(${historyIcon})`,

    ':hover': {
      backgroundColor: globalStyles.color.braveDarkOrange
    }
  },
  mainIcons__historyDisabled: {
    backgroundColor: globalStyles.color.chromeTertiary,
    cursor: 'default',

    ':hover': {
      backgroundColor: globalStyles.color.chromeTertiary
    }
  },
  mainIcons__settingIcon: {
    WebkitMaskImage: `url(${settingIcon})`,

    ':hover': {
      backgroundColor: globalStyles.color.braveDarkOrange
    }
  },
  mainIcons__settingIconDisabled: {
    backgroundColor: globalStyles.color.chromeTertiary,
    cursor: 'default',

    ':hover': {
      backgroundColor: globalStyles.color.chromeTertiary
    }
  }
})

module.exports = PaymentsTab
