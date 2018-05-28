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
const {DeletedSitesFooter, DeletedSitesContent} = require('./payment/deletedSites')
const {LedgerBackupContent, LedgerBackupFooter} = require('./payment/ledgerBackup')
const {LedgerRecoveryContent, LedgerRecoveryFooter} = require('./payment/ledgerRecovery')

// Actions
const appActions = require('../../../../js/actions/appActions')

// State
const ledgerState = require('../../../common/state/ledgerState')

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

  get addFundsDialogContent () {
    const ledgerData = this.props.ledgerData || Immutable.Map()
    const addresses = ledgerData.get('addresses') || Immutable.List()
    const walletQR = ledgerData.get('walletQR') || Immutable.List()
    const wizardData = ledgerData.get('wizardData') || Immutable.Map()
    const funds = formatCurrentBalance(ledgerData, ledgerData.get('balance'))
    const budget = ledgerState.getContributionAmount(null, ledgerData.get('contributionAmount'), this.props.settings)
    const minAmount = batToCurrencyString(budget, ledgerData)

    return <AddFundsDialog
      addFundsDialog={wizardData}
      funds={funds}
      minAmount={minAmount}
      addresses={addresses}
      walletQR={walletQR}
    />
  }

  get addFundsDialogFooter () {
    const ledgerData = this.props.ledgerData || Immutable.Map()
    const wizardData = ledgerData.get('wizardData') || Immutable.Map()

    return (
      <AddFundsDialogFooter
        addFundsDialog={wizardData}
        onNavigate={this.props.onNavigate}
        onHide={this.props.hideOverlay.bind(this, 'addFunds')}
      />
    )
  }

  get getOverlayFunds () {
    const ledgerData = this.props.ledgerData || Immutable.Map()
    return formatCurrentBalance(ledgerData, ledgerData.get('balance'))
  }

  get deletedSitesFooter () {
    return (
      <DeletedSitesFooter
        onHide={this.props.hideOverlay.bind(this, 'deletedSites')}
      />
    )
  }

  get deletedSites () {
    const permissionName = 'ledgerPaymentsShown'
    const defaults = (this.props.braveryDefaults || Immutable.Map()).merge({ledgerPaymentsShown: true})
    const sites = []

    if (!this.props.siteSettings) {
      return sites
    }

    this.props.siteSettings.forEach((value, hostPattern) => {
      if (!value.size) {
        return
      }

      const granted = value.get(permissionName)
      if (
        defaults &&
        defaults.get(permissionName) === granted &&
        granted !== undefined
      ) {
        return
      }

      if (['boolean', 'number'].includes(typeof granted)) {
        let siteName = null
        if (value.has('siteName')) {
          siteName = value.get('siteName')
        }

        sites.push({
          siteName,
          hostPattern
        })
      }
    })

    return sites
  }

  deletedSitesContent (sites) {
    return <DeletedSitesContent
      sites={sites}
      onHide={this.props.hideOverlay.bind(this, 'deletedSites')}
    />
  }

  showAdvancedSettings () {
    this.props.showOverlay('advancedSettings')
    this.props.setOverlayName('advancedSettings')
  }

  showPaymentHistory () {
    this.props.showOverlay('paymentHistory')
    this.props.setOverlayName('paymentHistory')
  }

  hideOverlay () {
    this.props.hideOverlay('addFunds')
    appActions.onChangeAddFundsDialogStep('addFundsWizardMain')
  }

  render () {
    const enabled = this.props.ledgerData.get('created')
    const deletedSites = this.deletedSites
    const showDeletedSites = deletedSites.length > 0

    return <div className={cx({
      paymentsContainer: true,
      [css(styles.paymentsContainer)]: true
    })} data-test-id='paymentsContainer'>
      {
      this.enabled && this.props.addFundsOverlayVisible
        ? <ModalOverlay
          title={'addFundsHeader'}
          subTitle={'balance'}
          subTitleArgs={this.getOverlayFunds}
          content={this.addFundsDialogContent}
          footer={this.addFundsDialogFooter}
          onHide={this.hideOverlay}
        />
        : null
      }
      {
        this.enabled && this.props.deletedSitesOverlayVisible && showDeletedSites
        ? <ModalOverlay
          customDialogBodyWrapperClasses={css(styles.payments__deleted__wrapper)}
          title={'deletedSitesHeader'}
          content={this.deletedSitesContent(deletedSites)}
          footer={this.deletedSitesFooter}
          onHide={this.props.hideOverlay.bind(this, 'deletedSites')}
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
            setOverlayName={this.props.setOverlayName}
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
            onNavigate={this.props.onNavigate}
            hideOverlay={this.props.hideOverlay}
          />}
          onHide={this.props.hideOverlay.bind(this, 'ledgerBackup')} />
        : null
      }
      {
        this.enabled && this.props.ledgerRecoveryOverlayVisible
        ? <ModalOverlay
          title={'ledgerRecoveryTitle'}
          content={<LedgerRecoveryContent
            ledgerData={this.props.ledgerData}
            hideAdvancedOverlays={this.props.hideAdvancedOverlays.bind(this)}
            handleRecoveryKeyChange={this.handleRecoveryKeyChange.bind(this)}
            setOverlayName={this.props.setOverlayName}
          />}
          footer={<LedgerRecoveryFooter
            state={this.state}
            hideOverlay={this.props.hideOverlay}
            setOverlayName={this.props.setOverlayName}
          />}
          onHide={this.props.hideOverlay.bind(this, 'ledgerRecovery')}
          customDialogFooterClasses={css(styles.recoveryFooter)}
        />
        : null
      }

      <SectionTitleWrapper>
        <section className={css(styles.titleWrapper)}>
          { /* Note: This div cannot be replaced with SectionTitleLabelWrapper */ }
          <div className={css(
            gridStyles.row1col1,
            styles.titleWrapper__title,
            sectionTitleStyles.beta
          )}>
            <img className={css(styles.titleWrapper__logo)} src={batIcon} />
            <AboutPageSectionTitle>Brave Payments</AboutPageSectionTitle>
            <SectionLabelTitle>beta</SectionLabelTitle>
          </div>

          <div data-test-id='enablePaymentsSwitch' className={css(
            gridStyles.row1col2,
            styles.titleWrapper__switchWrap
          )}>
            <SettingCheckbox
              dataL10nId='on'
              dataL10nIdLeft='off'
              prefKey={settings.PAYMENTS_ENABLED}
              settings={this.props.settings}
              onChangeSetting={this.props.onChangeSetting}
              switchClassName={css(styles.switchWrap__switchControl)}
              leftLabelClassName={css(styles.switchWrap__label, styles.switchWrap__label_left)}
              rightLabelClassName={css(styles.switchWrap__label, styles.switchWrap__label_right)}
            />
            <a className={cx({
              fa: true,
              'fa-question-circle': true,
              [css(styles.autoSuggestSwitch__moreInfo, styles.autoSuggestSwitch__moreInfoBtnSuggest)]: true
            })}
              href='https://brave.com/Payments_FAQ.html'
              data-l10n-id='paymentsFAQLink'
              rel='noopener' target='_blank'
            />
          </div>

          <div className={css(gridStyles.row1col3)}>
            {
              this.enabled
              ? <div className={css(
                styles.switchWrap,
                styles.switchWrap__right
              )}>
                <div className={css(styles.switchWrap__autoSuggestSwitch)}>
                  <div className={css(styles.flexAlignCenter, styles.autoSuggestSwitch__subtext)}>
                    <SettingCheckbox
                      dataL10nId='autoSuggestSites'
                      prefKey={settings.PAYMENTS_SITES_AUTO_SUGGEST}
                      settings={this.props.settings}
                      disabled={!enabled}
                      onChangeSetting={this.props.onChangeSetting}
                      switchClassName={css(styles.switchWrap__switchControl)}
                    />
                  </div>
                </div>
                <div className={css(styles.switchWrap__mainIconsRight)}>
                  <a className={css(
                    styles.switchWrap__mainIcons,
                    styles.mainIcons__historyIcon,
                    !this.hasWalletTransaction && styles.mainIcons__historyDisabled
                  )}
                    data-test-id={this.hasWalletTransaction ? 'paymentHistoryButton' : 'disabledPaymentHistoryButton'}
                    data-l10n-id='paymentHistoryIcon'
                    onClick={(enabled && this.hasWalletTransaction) ? this.showPaymentHistory.bind(this, 'paymentHistory') : () => {}}
                  />
                  <a className={css(
                    styles.switchWrap__mainIcons,
                    styles.mainIcons__settingsIcon,
                    !enabled && styles.mainIcons__settingsIconDisabled
                  )}
                    data-test-id={!enabled ? 'advancedSettingsButtonLoading' : 'advancedSettingsButton'}
                    data-l10n-id='advancedSettingsIcon'
                    onClick={enabled ? this.showAdvancedSettings.bind(this) : () => {}}
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
          ? <EnabledContent
            settings={this.props.settings}
            onChangeSetting={this.props.onChangeSetting}
            ledgerData={this.props.ledgerData}
            showOverlay={this.props.showOverlay}
            siteSettings={this.props.siteSettings}
            showDeletedSites={showDeletedSites}
            setOverlayName={this.props.setOverlayName}
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
    gridColumn: 1
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
  flexAlignCenter: {
    display: 'flex',
    alignItems: 'center'
  },

  paymentsContainer: {
    position: 'relative',
    overflowX: 'hidden',
    width: '805px',
    paddingBottom: '40px' // cf: padding of .prefTabContainer
  },

  titleWrapper: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    alignItems: 'center',
    width: '100%',
    padding: `0 ${globalStyles.spacing.panelPadding}`
  },

  titleWrapper__title: {
    position: 'relative',
    right: globalStyles.spacing.panelPadding
  },

  titleWrapper__logo: {
    width: '40px'
  },

  titleWrapper__switchWrap: {
    display: 'flex',
    alignItems: 'center',
    width: '100%'
  },

  switchWrap__label: {
    color: '#999',
    fontWeight: 'bold'
  },

  switchWrap__label_left: {
    paddingRight: '.75ch !important'
  },

  switchWrap__label_right: {
    // TODO: Add 'position: relative' and 'bottom: 1px' for macOS (en_US) only.
    paddingLeft: '.75ch !important',
    color: globalStyles.color.braveOrange
  },

  switchWrap__right: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: `calc(100% + ${globalStyles.spacing.panelPadding})`
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
    // TODO: refactor preferences.less to remove !important
    ':hover': {
      textDecoration: 'none !important'
    }
  },

  // History and settings icons
  switchWrap__mainIconsRight: {
    position: 'relative',
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
  },
  switch__label_right: {
    // TODO: Add 'position: relative' and 'bottom: 1px' for macOS (en_US) only.
    paddingLeft: '.75ch',
    color: globalStyles.color.braveOrange
  },
  payments__deleted__wrapper: {
    maxHeight: '500px',
    borderRadius: 0,
    overflowY: 'scroll'
  },

  recoveryFooter: {
    justifyContent: 'normal'
  }
})

module.exports = PaymentsTab
