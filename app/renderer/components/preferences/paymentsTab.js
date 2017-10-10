/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const Immutable = require('immutable')
const {StyleSheet, css} = require('aphrodite/no-important')

// Components
const cx = require('../../../../js/lib/classSet')
const ImmutableComponent = require('../immutableComponent')
const ModalOverlay = require('../common/modalOverlay')

const {SettingCheckbox} = require('../common/settings')
const {
  sectionTitleStyles,
  SectionTitleWrapper,
  AboutPageSectionTitle,
  SectionLabelTitle
} = require('../common/sectionTitle')

const DisabledContent = require('./payment/disabledContent')
const EnabledContent = require('./payment/enabledContent')
const AddFundsDialog = require('./payment/addFundsDialog/addFundsDialog')
const AddFundsDialogFooter = require('./payment/addFundsDialog/addFundsDialogFooter')
const {AdvancedSettingsContent, AdvancedSettingsFooter} = require('./payment/advancedSettings')
const {HistoryContent, HistoryFooter} = require('./payment/history')
const {LedgerBackupContent, LedgerBackupFooter} = require('./payment/ledgerBackup')
const {LedgerRecoveryContent, LedgerRecoveryFooter} = require('./payment/ledgerRecovery')

// Actions
const appActions = require('../../../../js/actions/appActions')

// Style
const globalStyles = require('../styles/global')
const {paymentStyles, paymentStylesVariables} = require('../styles/payment')
const settingsIcon = require('../../../extensions/brave/img/ledger/icon_settings.svg')
const historyIcon = require('../../../extensions/brave/img/ledger/icon_history.svg')
const batIcon = require('../../../extensions/brave/img/ledger/cryptoIcons/BAT_icon.svg')

// Other
const getSetting = require('../../../../js/settings').getSetting
const settings = require('../../../../js/constants/settings')
const {formatCurrentBalance, batToCurrencyString} = require('../../../common/lib/ledgerUtil')

class PaymentsTab extends ImmutableComponent {
  constructor () {
    super()
    this.state = {
      recoveryKey: ''
    }

    this.handleRecoveryKeyChange = this.handleRecoveryKeyChange.bind(this)
    this.hideOverlay = this.hideOverlay.bind(this)
  }

  handleRecoveryKeyChange (key) {
    this.setState({recoveryKey: key})
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

  get overlayContent () {
    const ledgerData = this.props.ledgerData || Immutable.Map()
    const addresses = ledgerData.get('addresses') || Immutable.List()
    const walletQR = ledgerData.get('walletQR') || Immutable.List()
    const wizardData = ledgerData.get('wizardData') || Immutable.Map()
    const funds = formatCurrentBalance(ledgerData)
    const budget = getSetting(settings.PAYMENTS_CONTRIBUTION_AMOUNT, this.props.settings)
    const minAmount = batToCurrencyString(budget, ledgerData)

    return <AddFundsDialog
      addFundsDialog={wizardData}
      funds={funds}
      minAmount={minAmount}
      addresses={addresses}
      walletQR={walletQR}
    />
  }

  get overlayFooter () {
    const ledgerData = this.props.ledgerData || Immutable.Map()
    const wizardData = ledgerData.get('wizardData') || Immutable.Map()

    return (
      <AddFundsDialogFooter
        addFundsDialog={wizardData}
        onHide={this.props.hideOverlay.bind(this, 'addFunds')}
      />
    )
  }

  get getOverlayFounds () {
    const ledgerData = this.props.ledgerData || Immutable.Map()
    return formatCurrentBalance(ledgerData)
  }

  hideOverlay () {
    this.props.hideOverlay('addFunds')
    appActions.onChangeAddFundsDialogStep('addFundsWizardMain')
  }

  render () {
    const enabled = this.props.ledgerData.get('created')
    return <div className={cx({
      paymentsContainer: true,
      [css(styles.paymentsContainer)]: true
    })} data-test-id='paymentsContainer'>
      {
      this.enabled && this.props.addFundsOverlayVisible
        ? <ModalOverlay
          title={'addFundsHeader'}
          subTitle={'balance'}
          subTitleArgs={this.getOverlayFounds}
          content={this.overlayContent}
          footer={this.overlayFooter}
          onHide={this.hideOverlay}
        />
        : null
      }
      {
        this.enabled && this.props.paymentHistoryOverlayVisible
          ? <ModalOverlay
            title={'paymentHistoryTitle'}
            customDialogClasses={'paymentHistory'}
            customDialogHeaderClasses={css(styles.paymentHistoryOverlay__header)}
            customDialogBodyClasses={css(styles.paymentHistoryOverlay__body)}
            customDialogFooterClasses={css(styles.paymentHistoryOverlay__footer)}
            customTitleClasses={css(styles.paymentHistoryOverlay__title)}
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
            handleRecoveryKeyChange={this.handleRecoveryKeyChange.bind(this)}
          />}
          footer={<LedgerRecoveryFooter
            state={this.state}
            hideOverlay={this.props.hideOverlay}
          />}
          onHide={this.props.hideOverlay.bind(this, 'ledgerRecovery')}
        />
        : null
      }

      <SectionTitleWrapper>
        { /* Note: This div cannot be replaced with SectionTitleLabelWrapper */ }
        <div className={cx({
          [css(styles.titleWrapper)]: true,
          [css(sectionTitleStyles.beta)]: true
        })}>
          <img className={css(styles.batLogo)} src={batIcon} />
          <AboutPageSectionTitle>Brave Payments</AboutPageSectionTitle>
          <SectionLabelTitle>beta</SectionLabelTitle>
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
                    prefKey={settings.PAYMENTS_SITES_AUTO_SUGGEST}
                    settings={this.props.settings}
                    disabled={!enabled}
                    onChangeSetting={this.props.onChangeSetting}
                    switchClassName={css(styles.switchWrap__switchControl)}
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
                    styles.mainIcons__settingsIcon,
                    !enabled && styles.mainIcons__settingsIconDisabled
                  )}
                  onClick={enabled ? this.props.showOverlay.bind(this, 'advancedSettings') : () => {}}
                />
              </div>
            </div>
            : null
          }
        </div>
      </SectionTitleWrapper>
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
    paddingBottom: '40px' // cf: padding of .prefTabContainer
  },
  paymentsSwitches: {
    display: 'flex',
    position: 'relative',
    bottom: '2px',
    minHeight: '29px'
  },

  titleWrapper: {
    position: 'relative',
    minWidth: '240px'
  },

  batLogo: {
    width: '40px'
  },

  switchWrap: {
    width: paymentStyles.width.tableCell,

    // TODO: Remove this when #10913 is merged to master
    position: 'relative',
    left: '1rem'
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

  // Auto suggest switch
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
    top: '-1px',
    left: '8px',
    cursor: 'pointer',

    // TODO: refactor preferences.less to remove !important
    ':hover': {
      textDecoration: 'none !important'
    }
  },

  // History and settings icons
  switchWrap__mainIconsRight: {
    position: 'relative',
    top: '3.5px',

    // See: #11367
    right: '1rem'
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
  mainIcons__settingsIcon: {
    WebkitMaskImage: `url(${settingsIcon})`,

    ':hover': {
      backgroundColor: globalStyles.color.braveDarkOrange
    }
  },
  mainIcons__settingsIconDisabled: {
    backgroundColor: globalStyles.color.chromeTertiary,
    cursor: 'default',

    ':hover': {
      backgroundColor: globalStyles.color.chromeTertiary
    }
  },

  paymentHistoryOverlay__header: {
    paddingLeft: `${paymentStylesVariables.spacing.paymentHistoryTablePadding} !important`
  },
  paymentHistoryOverlay__body: {
    background: '#fff',
    height: '300px',
    overflowY: 'auto',
    padding: '0 !important'
  },
  paymentHistoryOverlay__footer: {
    display: 'block !important',
    paddingLeft: `${paymentStylesVariables.spacing.paymentHistoryTablePadding} !important`,
    paddingTop: '10px !important',
    paddingBottom: '10px !important'
  },
  paymentHistoryOverlay__title: {
    // TODO: refactor preferences.less to remove !important

    color: `${globalStyles.color.braveMediumOrange} !important`,
    textIndent: '0 !important'
  }
})

module.exports = PaymentsTab
