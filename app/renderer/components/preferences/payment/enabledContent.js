/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const {StyleSheet, css} = require('aphrodite/no-important')
const addMonths = require('date-fns/add_months')
const Immutable = require('immutable')

// util
const {batToCurrencyString, formatCurrentBalance, formattedDateFromTimestamp, walletStatus} = require('../../../../common/lib/ledgerUtil')
const {l10nErrorText} = require('../../../../common/lib/httpUtil')
const ledgerUtil = require('../../../../common/lib/ledgerUtil')
const {changeSetting} = require('../../../lib/settingsUtil')
const settings = require('../../../../../js/constants/settings')
const locale = require('../../../../../js/l10n')

// State
const ledgerState = require('../../../../common/state/ledgerState')

// components
const ImmutableComponent = require('../../immutableComponent')
const BrowserButton = require('../../common/browserButton')
const {FormTextbox} = require('../../common/textbox')
const {FormDropdown} = require('../../common/dropdown')
const LedgerTable = require('./ledgerTable')

// style
const globalStyles = require('../../styles/global')
const {paymentStylesVariables} = require('../../styles/payment')
const closeButton = require('../../../../../img/toolbar/stoploading_btn.svg')
const cx = require('../../../../../js/lib/classSet')

// Actions
const appActions = require('../../../../../js/actions/appActions')

// TODO: report when funds are too low
// TODO: support non-USD currency
class EnabledContent extends ImmutableComponent {
  constructor (props) {
    super(props)
    this.claimButton = this.claimButton.bind(this)
    this.onClaimClick = this.onClaimClick.bind(this)
    this.closeClick = this.closeClick.bind(this)
  }

  walletButton () {
    const ledgerData = this.props.ledgerData
    const buttonText = ledgerData.get('created')
      ? 'addFundsTitle'
      : (ledgerData.get('creating') ? 'creatingWallet' : 'createWallet')
    const onButtonClick = ledgerData.get('created')
      ? this.props.showOverlay.bind(this, 'addFunds')
      : (ledgerData.get('creating') ? () => {} : this.createWallet())

    return <div>
      <BrowserButton
        primaryColor
        panelItem
        testId={buttonText}
        test2Id={'addFunds'}
        l10nId={buttonText}
        onClick={onButtonClick.bind(this)}
        disabled={!ledgerData.get('created')}
      />
      <a className={cx({
        [globalStyles.appIcons.question]: true,
        [css(styles.iconLink)]: true
      })}
        href='https://brave.com/faq-payments/#brave-payments'
        target='_blank' rel='noopener'
      />
    </div>
  }

  onClaimClick () {
    appActions.onPromotionClaim()
  }

  claimButton () {
    const ledgerData = this.props.ledgerData || Immutable.Map()
    const promotion = ledgerData.get('promotion')

    if (promotion == null || promotion.isEmpty() || promotion.has('claimedTimestamp') || !ledgerData.get('created')) {
      return null
    }

    return <BrowserButton
      custom={[
        styles.claimButton
      ]}
      secondaryColor
      panelItem
      testId={'claimButton'}
      onClick={this.onClaimClick}
      disabled={!ledgerData.get('created')}
      label={promotion.getIn(['panel', 'optedInButton'])}
    />
  }

  ledgerDataErrorText () {
    const ledgerData = this.props.ledgerData
    const ledgerError = ledgerData.get('error')

    if (!ledgerError) {
      return null
    }

    // 'error' here is a chromium webRequest error as returned by request.js
    const errorCode = ledgerError.get('error').get('errorCode')
    return l10nErrorText(errorCode)
  }

  createWallet () {
    const ledgerData = this.props.ledgerData
    if (!ledgerData.get('created')) {
      appActions.onLedgerWalletCreate()
    }

    return () => {}
  }

  fundsAmount () {
    const ledgerData = this.props.ledgerData

    return <FormTextbox
      readOnly
      data-test-id='fundsAmount'
      value={formatCurrentBalance(ledgerData)}
    />
  }

  lastReconcileMessage () {
    const ledgerData = this.props.ledgerData
    const walletCreated = ledgerData.get('created') && !ledgerData.get('creating')
    const walletTransactions = ledgerData.get('transactions')
    const walletHasTransactions = walletTransactions && walletTransactions.size
    const walletHasReconcile = ledgerData.get('reconcileStamp')
    let prevReconcileDateValue
    let text

    if (!walletCreated || !walletHasReconcile || !walletHasTransactions) {
      text = 'noPaymentHistory'
    } else {
      text = 'viewPaymentHistory'
      const walletHasTransactionsSorted = walletTransactions
        .sort((first, second) => first.get('submissionStamp') - second.get('submissionStamp'))
      prevReconcileDateValue = this.lastReconcileDate(walletHasTransactionsSorted.last())
    }

    const l10nDataArgs = {
      date: prevReconcileDateValue
    }

    return <section>
      <div data-l10n-id='lastContribution' />
      <div data-l10n-id={text} data-l10n-args={JSON.stringify(l10nDataArgs)} />
    </section>
  }

  lastReconcileDate (transaction) {
    const timestamp = transaction.get('submissionStamp')
    return formattedDateFromTimestamp(timestamp, 'MMMM Do')
  }

  nextReconcileDate () {
    const ledgerData = this.props.ledgerData
    if ((ledgerData.get('error')) || (!ledgerData.get('reconcileStamp'))) {
      return null
    }
    const timestamp = ledgerData.get('reconcileStamp')
    return formattedDateFromTimestamp(timestamp, 'MMMM Do')
  }

  nextReconcileMessage () {
    const ledgerData = this.props.ledgerData
    let nextReconcileDateRelative = this.nextReconcileDate()
    let l10nDataId = 'statusNextReconcileDate'

    if (!nextReconcileDateRelative) {
      nextReconcileDateRelative = formattedDateFromTimestamp(addMonths(Date.now(), 1), 'MMMM Do')
    } else {
      const timestamp = ledgerData.get('reconcileStamp')
      const now = new Date().getTime()

      if (timestamp <= now) {
        l10nDataId = (timestamp <= (now - (24 * 60 * 60 * 1000)))
          ? 'statusNextReconcileOverdue' : 'statusNextReconcileToday'
      }
    }

    const l10nDataArgs = {
      reconcileDate: nextReconcileDateRelative
    }

    return <section>
      <div data-l10n-id='nextContribution' />
      <div data-l10n-args={JSON.stringify(l10nDataArgs)} data-l10n-id={l10nDataId} />
    </section>
  }

  closeClick () {
    const promo = this.props.ledgerData.get('promotion') || Immutable.Map()
    const status = promo.get('promotionStatus')
    if (status && !promo.has('claimedTimestamp')) {
      if (status === 'expiredError') {
        appActions.onPromotionRemoval()
      } else {
        appActions.onPromotionClose()
      }
    } else {
      appActions.onPromotionRemoval()
    }
  }

  statusMessage () {
    const promo = this.props.ledgerData.get('promotion') || Immutable.Map()
    const successText = promo.getIn(['panel', 'successText'])
    let status = promo.get('promotionStatus')

    if ((!successText || !promo.has('claimedTimestamp')) && !status) {
      return
    }

    let title = successText.get('title')
    let message = successText.get('message')
    let text = promo.getIn(['panel', 'disclaimer'])

    if (status) {
      switch (status) {
        case 'generalError':
          {
            title = locale.translation('promotionGeneralErrorTitle')
            message = locale.translation('promotionGeneralErrorMessage')
            text = locale.translation('promotionGeneralErrorText')
            break
          }
        case 'expiredError':
          {
            title = locale.translation('promotionClaimedErrorTitle')
            message = locale.translation('promotionClaimedErrorMessage')
            text = locale.translation('promotionClaimedErrorText')
            break
          }
      }
    }

    return <div className={cx({[css(styles.enabledContent__grant)]: true, 'enabledContent__grant': true})}>
      <div
        className={css(styles.enabledContent__grant_close)}
        onClick={this.closeClick}
      />
      <p className={css(styles.enabledContent__grant_title)}>
        <span className={css(styles.enabledContent__grant_bold)}>{title}</span> {message}
      </p>
      <p className={css(styles.enabledContent__grant_text)}>
        {text}
      </p>
      <BrowserButton
        secondaryColor
        l10nId={'paymentHistoryOKText'}
        custom={styles.enabledContent__grant_button}
        onClick={this.closeClick}
      />
    </div>
  }

  get deletedSitesLink () {
    if (this.props.showDeletedSites) {
      return <span>
        <a data-l10n-id='showDeletedSitesDialog'
          data-test-id='showDeletedSitesDialog'
          className={css(styles.enabledContent__footer__link)}
          onClick={this.props.showOverlay.bind(this, 'deletedSites')}
        />
        <span
          className={css(styles.enabledContent__footer__link, styles.enabledContent__footer__separator)}
        >|</span>
      </span>
    }

    return null
  }

  render () {
    const ledgerData = this.props.ledgerData
    const walletStatusText = walletStatus(ledgerData)
    const contributionAmount = ledgerState.getContributionAmount(null, ledgerData.get('contributionAmount'), this.props.settings)
    const amountList = ledgerData.get('monthlyAmounts') || ledgerUtil.defaultMonthlyAmounts

    return <section className={css(styles.enabledContent)}>
      <div className={css(styles.enabledContent__walletBar)} data-test-id='walletBar'>
        <div className={css(gridStyles.row1col1, styles.enabledContent__walletBar__title)} data-l10n-id='monthlyBudget' />
        <div className={css(gridStyles.row1col2, styles.enabledContent__walletBar__title)} data-l10n-id='accountBalance' />
        <div className={css(gridStyles.row1col3)}>
          {this.claimButton()}
        </div>
        <div className={css(gridStyles.row2col1)}>
          <FormDropdown
            data-isPanel
            data-test-id='fundsSelectBox'
            value={contributionAmount}
            onChange={changeSetting.bind(null, this.props.onChangeSetting, settings.PAYMENTS_CONTRIBUTION_AMOUNT)}
          >
            {
              amountList.map((amount) => {
                let alternative = ''
                if (ledgerData.has('currentRate')) {
                  const converted = batToCurrencyString(amount, ledgerData)

                  if (converted) {
                    alternative = `(${converted})`
                  }
                }
                const displayAmount = Number(amount).toFixed(1)

                return <option value={amount}>{displayAmount} BAT {alternative}</option>
              })
            }
          </FormDropdown>
        </div>
        <div className={css(gridStyles.row2col2)}>
          {
            ledgerData.get('error') && ledgerData.get('error').get('caller') === 'getWalletProperties'
              ? <div data-l10n-id='accountBalanceConnectionError' />
              : <div>{this.fundsAmount()}</div>
          }
        </div>
        <div className={css(gridStyles.row2col3)}>
          {this.walletButton()}
        </div>
        <div className={css(gridStyles.row3col1, styles.enabledContent__walletBar__message)}>
          {this.lastReconcileMessage()}
        </div>
        <div className={css(gridStyles.row3col2, styles.enabledContent__walletBar__message)}>
          {
            ledgerData.get('error') && ledgerData.get('error').get('caller') === 'getWalletProperties'
              ? <div data-l10n-id={this.ledgerDataErrorText()} />
              : <div>{this.nextReconcileMessage()}</div>
          }
        </div>
        <div className={css(gridStyles.row3col3, styles.enabledContent__walletBar__message)}
          data-test-id='walletStatus'
          data-l10n-id={walletStatusText.id}
          data-l10n-args={walletStatusText.args ? JSON.stringify(walletStatusText.args) : null}
        />
        {this.statusMessage()}
      </div>
      <LedgerTable ledgerData={this.props.ledgerData}
        settings={this.props.settings}
        onChangeSetting={this.props.onChangeSetting}
        siteSettings={this.props.siteSettings} />
      <div className={css(styles.enabledContent__tos)}>
        { this.deletedSitesLink }
        <a data-l10n-id='termsOfService'
          data-test-id='termsOfService'
          className={css(styles.enabledContent__footer__link)}
          href='https://basicattentiontoken.org/contributor-terms-of-service/'
          target='_blank'
          rel='noreferrer noopener' />
      </div>
    </section>
  }
}

const gridStyles = StyleSheet.create({
  row1col1: {
    gridRow: 1,
    gridColumn: 1,
    marginTop: globalStyles.spacing.panelPadding,
    marginLeft: globalStyles.spacing.panelPadding
  },

  row1col2: {
    gridRow: 1,
    gridColumn: 2,
    marginTop: globalStyles.spacing.panelPadding,
    marginRight: `calc(${globalStyles.spacing.panelPadding} / 2)`,
    marginLeft: `calc(${globalStyles.spacing.panelPadding} / 2)`
  },

  row1col3: {
    gridRow: 1,
    gridColumn: 3,
    marginRight: globalStyles.spacing.panelPadding
  },

  row2col1: {
    gridRow: 2,
    gridColumn: 1,
    marginLeft: globalStyles.spacing.panelPadding
  },

  row2col2: {
    gridRow: 2,
    gridColumn: 2,
    marginRight: `calc(${globalStyles.spacing.panelPadding} / 2)`,
    marginLeft: `calc(${globalStyles.spacing.panelPadding} / 2)`
  },

  row2col3: {
    gridRow: 2,
    gridColumn: 3,
    marginRight: globalStyles.spacing.panelPadding
  },

  row3col1: {
    gridRow: 3,
    gridColumn: 1,
    marginBottom: globalStyles.spacing.panelPadding,
    marginLeft: globalStyles.spacing.panelPadding
  },

  row3col2: {
    gridRow: 3,
    gridColumn: 2,
    marginRight: `calc(${globalStyles.spacing.panelPadding} / 2)`,
    marginBottom: globalStyles.spacing.panelPadding,
    marginLeft: `calc(${globalStyles.spacing.panelPadding} / 2)`
  },

  row3col3: {
    gridRow: 3,
    gridColumn: 3,
    marginRight: globalStyles.spacing.panelPadding,
    marginBottom: globalStyles.spacing.panelPadding
  }
})

const styles = StyleSheet.create({
  claimButton: {
    marginTop: '10px'
  },

  iconLink: {
    color: globalStyles.color.mediumGray,
    fontSize: globalStyles.payments.fontSize.regular,
    marginLeft: '10px',
    textDecoration: 'none',

    ':hover': {
      textDecoration: 'none !important'
    }
  },

  enabledContent: {
    position: 'relative',
    zIndex: 2
  },

  enabledContent__tos: {
    float: 'right',
    padding: '20px 60px'
  },

  enabledContent__footer__link: {
    fontSize: '13px',
    color: '#666'
  },

  enabledContent__footer__separator: {
    display: 'inline-block',
    padding: '0 10px'
  },

  enabledContent__grant: {
    position: 'absolute',
    zIndex: 3,
    top: 0,
    left: 0,
    width: '100%',
    minHeight: '159px',
    background: '#f3f3f3',
    borderRadius: '8px',
    padding: '30px 50px 20px',
    boxSizing: 'border-box',
    boxShadow: '4px 6px 3px #dadada'
  },

  enabledContent__grant_close: {
    position: 'absolute',
    right: '15px',
    top: '15px',
    height: '15px',
    width: '15px',
    cursor: 'pointer',

    background: `url(${closeButton}) center no-repeat`,
    backgroundSize: `15px`,

    ':focus': {
      outline: 'none'
    }
  },

  enabledContent__grant_title: {
    color: '#5f5f5f',
    fontSize: '20px',
    display: 'block',
    marginBottom: '10px'
  },

  enabledContent__grant_bold: {
    color: '#ff5500'
  },

  enabledContent__grant_text: {
    fontSize: '16px',
    color: '#9b9b9b',
    maxWidth: '600px'
  },

  enabledContent__grant_button: {
    float: 'right'
  },

  enabledContent__walletBar: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    background: globalStyles.color.lightGray,
    borderRadius: globalStyles.radius.borderRadiusUIbox,
    margin: `${globalStyles.spacing.panelMargin} 0`
  },

  enabledContent__walletBar__title: {
    color: paymentStylesVariables.tableHeader.fontColor,
    fontWeight: paymentStylesVariables.tableHeader.fontWeight,
    marginBottom: `calc(${globalStyles.spacing.panelPadding} / 1.5)`
  },

  enabledContent__walletBar__message: {
    fontSize: globalStyles.payments.fontSize.regular,
    lineHeight: 1.5,
    marginTop: globalStyles.spacing.panelPadding
  }
})

module.exports = EnabledContent
