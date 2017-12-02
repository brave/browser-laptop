/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const Immutable = require('immutable')
const {StyleSheet, css} = require('aphrodite/no-important')

// Components
const ImmutableComponent = require('../immutableComponent')
const ModalOverlay = require('../common/modalOverlay')

const BrowserButton = require('../common/browserButton')
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
const {paymentStylesVariables} = require('../styles/payment')
const settingsIcon = require('../../../extensions/brave/img/ledger/icon_settings.svg')
const historyIcon = require('../../../extensions/brave/img/ledger/icon_history.svg')
const batIcon = require('../../../extensions/brave/img/ledger/cryptoIcons/BAT_icon.svg')

// Other
const getSetting = require('../../../../js/settings').getSetting
const settings = require('../../../../js/constants/settings')
const {formatCurrentBalance, batToCurrencyString} = require('../../../common/lib/ledgerUtil')
const aboutActions = require('../../../../js/about/aboutActions')

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
    const inTransition = this.props.ledgerData.getIn(['migration', 'btc2BatTransitionPending']) === true
    const enableSettings = enabled && !inTransition

    return <div className={css(styles.payments)} data-test-id='paymentsContainer'>
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
          customDialogHeaderClasses={css(styles.payments__history__header)}
          customDialogBodyClasses={css(styles.payments__history__body)}
          customDialogFooterClasses={css(styles.payments__history__footer)}
          customTitleClasses={css(styles.payments__history__title)}
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
          onHide={this.props.hideOverlay.bind(this, 'ledgerBackup')}
        />
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
        <section className={css(styles.payments__title)}>
          { /* Note: This div cannot be replaced with SectionTitleLabelWrapper */ }
          <div className={css(
            gridStyles.row1col1,
            sectionTitleStyles.beta
          )}>
            <img className={css(styles.payments__title__icon_bat)} src={batIcon} />
            <AboutPageSectionTitle>Brave Payments</AboutPageSectionTitle>
            <SectionLabelTitle>beta</SectionLabelTitle>
          </div>

          <div data-test-id='enablePaymentsSwitch' className={css(
            gridStyles.row1col2,
            styles.payments__title__switch
          )}>
            <SettingCheckbox
              dataL10nIdLeft='off'
              dataL10nId='on'
              prefKey={settings.PAYMENTS_ENABLED}
              settings={this.props.settings}
              onChangeSetting={this.props.onChangeSetting}
              switchClassName={css(styles.switch__switchControl)}
              leftLabelClassName={css(
                styles.switch__label,
                styles.switch__label_left,
                styles.switch__label_left_off
              )}
              rightLabelClassName={css(
                styles.switch__label,
                styles.switch__label_right
              )}
            />
            <BrowserButton
              iconOnly
              iconClass={globalStyles.appIcons.question}
              size='.95rem'
              custom={styles.payments__title__switch__moreInfo}
              l10nId='paymentsFAQLink'
              onClick={aboutActions.createTabRequested.bind(null, {
                url: 'https://brave.com/faq-payments/#brave-payments'
              })}
            />
          </div>

          <div className={css(gridStyles.row1col3)}>
            {
              this.enabled
              ? <div className={css(styles.payments__title__actions)}>
                <SettingCheckbox
                  dataL10nId='autoSuggestSites'
                  prefKey={settings.PAYMENTS_SITES_AUTO_SUGGEST}
                  settings={this.props.settings}
                  disabled={!enabled}
                  onChangeSetting={this.props.onChangeSetting}
                  switchClassName={css(
                    styles.payments__title__actions__autoSuggest,
                    styles.switch__switchControl
                  )}
                />
                <div className={css(styles.payments__title__actions__icons)}>
                  <BrowserButton
                    iconOnly
                    size='25px'
                    custom={[
                      styles.payments__title__actions__icons__icon,
                      styles.payments__title__actions__icons__icon_history,
                      !this.hasWalletTransaction && styles.payments__title__actions__icons__icon_disabled
                    ]}
                    testId={this.hasWalletTransaction ? 'paymentHistoryButton' : 'disabledPaymentHistoryButton'}
                    l10nId='paymentHistoryIcon'
                    onClick={(enabled && this.hasWalletTransaction) ? this.props.showOverlay.bind(this, 'paymentHistory') : () => {}}
                  />
                  <BrowserButton
                    iconOnly
                    size='25px'
                    custom={[
                      styles.payments__title__actions__icons__icon,
                      styles.payments__title__actions__icons__icon_settings,
                      !enableSettings && styles.payments__title__actions__icons__icon_disabled
                    ]}
                    testId={!enableSettings ? 'advancedSettingsButtonLoading' : 'advancedSettingsButton'}
                    l10nId='advancedSettingsIcon'
                    onClick={enableSettings ? this.props.showOverlay.bind(this, 'advancedSettings') : () => {}}
                  />
                </div>
              </div>
              : null
            }
          </div>
        </section>
      </SectionTitleWrapper>
      {
        this.enabled
        ? <EnabledContent settings={this.props.settings}
          onChangeSetting={this.props.onChangeSetting}
          ledgerData={this.props.ledgerData}
          showOverlay={this.props.showOverlay}
          siteSettings={this.props.siteSettings}
        />
        : <DisabledContent
          ledgerData={this.props.ledgerData}
        />
      }
    </div>
  }
}

const gridStyles = StyleSheet.create({
  row1col1: {
    gridRow: 1,
    gridColumn: 1,

    // Ensure the spacing between switch__label on a small viewport
    paddingRight: globalStyles.spacing.panelPadding
  },

  row1col2: {
    gridRow: 1,
    gridColumn: 2
  },

  row1col3: {
    gridRow: 1,
    gridColumn: 3
  }
})

const styles = StyleSheet.create({
  payments: {
    width: '805px',

    // cf: padding of .prefTabContainer
    paddingBottom: '40px'
  },

  payments__history__header: {
    paddingLeft: `${paymentStylesVariables.spacing.paymentHistoryTablePadding} !important`
  },

  payments__history__body: {
    height: '300px',
    overflowY: 'auto',
    padding: '0 !important'
  },

  payments__history__footer: {
    display: 'block !important',
    paddingLeft: `${paymentStylesVariables.spacing.paymentHistoryTablePadding} !important`,
    paddingTop: '10px !important',
    paddingBottom: '10px !important'
  },

  payments__history__title: {
    // TODO: refactor preferences.less to remove !important
    color: `${globalStyles.color.braveMediumOrange} !important`,
    textIndent: '0 !important'
  },

  payments__title: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    alignItems: 'center',
    width: '100%'
  },

  payments__title__icon_bat: {
    width: globalStyles.spacing.batIconWidth
  },

  payments__title__switch: {
    display: 'flex',
    alignItems: 'center'
  },

  payments__title__switch__moreInfo: {
    color: globalStyles.color.commonTextColor,
    position: 'relative',
    left: '3px',
    cursor: 'pointer',
    fontSize: globalStyles.payments.fontSize.regular,

    // TODO: refactor preferences.less to remove !important
    ':hover': {
      textDecoration: 'none !important'
    }
  },

  payments__title__actions: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  },

  payments__title__actions__autoSuggest: {
    fontSize: globalStyles.fontSize.settingItemSubtext,
    display: 'flex',
    alignItems: 'center',

    // TODO: Refactor switchControls.less
    position: 'relative',
    top: '1px'
  },

  payments__title__actions__icons: {
    display: 'flex',
    position: 'relative',
    top: '3.5px',
    whiteSpace: 'nowrap' // See: #11580
  },

  payments__title__actions__icons__icon: {
    backgroundColor: globalStyles.color.braveOrange,
    position: 'relative',

    ':hover': {
      backgroundColor: globalStyles.color.braveDarkOrange
    }
  },

  payments__title__actions__icons__icon_history: {
    right: '5px',
    WebkitMaskImage: `url(${historyIcon})`
  },

  payments__title__actions__icons__icon_settings: {
    WebkitMaskImage: `url(${settingsIcon})`
  },

  payments__title__actions__icons__icon_disabled: {
    backgroundColor: globalStyles.color.chromeTertiary,
    cursor: 'default',

    ':hover': {
      backgroundColor: globalStyles.color.chromeTertiary
    }
  },

  switch__switchControl: {
    // TODO: Refactor switchControls.less
    padding: '0 !important'
  },

  switch__label: {
    fontWeight: 'bold',
    color: globalStyles.color.braveOrange
  },

  switch__label_left: {
    paddingRight: '.75ch !important'
  },

  switch__label_left_off: {
    color: '#999'
  },

  switch__label_right: {
    // TODO: Add 'position: relative' and 'bottom: 1px' for macOS (en_US) only.
    paddingLeft: '.75ch !important',
    color: globalStyles.color.braveOrange
  }
})

module.exports = PaymentsTab
