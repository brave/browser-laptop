/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const {StyleSheet, css} = require('aphrodite/no-important')
const addMonths = require('date-fns/add_months')
const Immutable = require('immutable')

// Components
const ImmutableComponent = require('../../immutableComponent')
const BrowserButton = require('../../common/browserButton')
const {FormDropdown} = require('../../common/dropdown')
const LedgerTable = require('./ledgerTable')
const Captcha = require('./captcha')

// State
const ledgerState = require('../../../../common/state/ledgerState')

// Actions
const appActions = require('../../../../../js/actions/appActions')

// Constants
const ledgerStatuses = require('../../../../common/constants/ledgerStatuses')
const settings = require('../../../../../js/constants/settings')

// Utils
const {
  batToCurrencyString,
  formatCurrentBalance,
  formattedDateFromTimestamp,
  walletStatus
} = require('../../../../common/lib/ledgerUtil')
const {l10nErrorText} = require('../../../../common/lib/httpUtil')
const ledgerUtil = require('../../../../common/lib/ledgerUtil')
const {changeSetting} = require('../../../lib/settingsUtil')
const locale = require('../../../../../js/l10n')

// Styles
const globalStyles = require('../../styles/global')
const cx = require('../../../../../js/lib/classSet')
const {paymentStylesVariables} = require('../../styles/payment')
const closeButton = require('../../../../../img/toolbar/stoploading_btn.svg')
const promotionStatuses = require('../../../../common/constants/promotionStatuses')

// TODO: report when funds are too low
class EnabledContent extends ImmutableComponent {
  constructor (props) {
    super(props)
    this.claimButton = this.claimButton.bind(this)
    this.onClaimClick = this.onClaimClick.bind(this)
    this.closePromotionClick = this.closePromotionClick.bind(this)
    this.recoverStatusClick = this.recoverStatusClick.bind(this)
  }

  showAddFunds () {
    this.props.showOverlay('addFunds')
    this.props.setOverlayName('addFunds')
  }

  walletButton () {
    const ledgerData = this.props.ledgerData
    const buttonText = ledgerData.get('created')
      ? 'addFundsTitle'
      : (ledgerData.get('creating') ? 'creatingWallet' : 'createWallet')
    const onButtonClick = ledgerData.get('created')
      ? this.showAddFunds.bind(this)
      : (ledgerData.get('creating') ? () => {} : this.createWallet())

    let buttonDisabled = !ledgerData.get('created')

    if (buttonText === 'createWallet') {
      buttonDisabled = false
    }

    return <div>
      <BrowserButton
        primaryColor
        panelItem
        testId={buttonText}
        test2Id={'addFunds'}
        l10nId={buttonText}
        onClick={onButtonClick.bind(this)}
        disabled={buttonDisabled}
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
    appActions.onPromotionClick()
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
    if (!ledgerData) {
      return
    }

    const total = formatCurrentBalance(ledgerData, ledgerData.get('balance'), false) || ''
    const userFunded = formatCurrentBalance(ledgerData, ledgerData.get('userFunded')) || ''
    const grants = ledgerData.get('grants') || Immutable.List()

    return <div className={css(styles.fundsAmount)}>
      <div className={css(styles.fundsAmount__item)}>{userFunded}</div>
      {
        grants.map(grant => {
          return <div className={css(styles.fundsAmount__item)}>
            {formatCurrentBalance(ledgerData, grant.get('amount'), false)}
            <span> (<span data-l10n-id='expires' /> {new Date(grant.get('expirationDate') * 1000).toLocaleDateString()})</span>
          </div>
        })
      }
      <div className={css(styles.fundsAmount__item, styles.fundsAmount__total)}>
        {total} (<span data-l10n-id='total' />)
      </div>
    </div>
  }

  lastReconcileMessage () {
    const ledgerData = this.props.ledgerData
    const walletCreated = ledgerData.get('created') && !ledgerData.get('creating')
    const walletTransactions = ledgerData.get('transactions')
    const walletHasTransactions = walletTransactions && walletTransactions.size
    const walletHasReconcile = ledgerData.get('reconcileStamp')
    let prevReconcileDateValue
    let text

    if (ledgerData.get('status') === ledgerStatuses.IN_PROGRESS) {
      text = 'paymentInProgress'
    } else if (!walletCreated || !walletHasReconcile || !walletHasTransactions) {
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
      {
        prevReconcileDateValue
        ? <span data-l10n-id='lastContribution' className={css(styles.lastContribution)} />
        : null
      }
      <span data-l10n-id={text} data-l10n-args={JSON.stringify(l10nDataArgs)} />
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
      <span data-l10n-id='nextContribution' /> <span data-l10n-args={JSON.stringify(l10nDataArgs)} data-l10n-id={l10nDataId} />
    </section>
  }

  closePromotionClick () {
    const promo = this.props.ledgerData.get('promotion') || Immutable.Map()
    const status = promo.get('promotionStatus')
    if (status && !promo.has('claimedTimestamp')) {
      if (status === promotionStatuses.PROMO_EXPIRED) {
        appActions.onPromotionRemoval()
      } else {
        appActions.onPromotionClose()
      }
    } else {
      appActions.onPromotionRemoval()
    }
  }

  recoverStatusClick () {
    appActions.loadURLRequested(
      parseInt(this.props.ledgerData.get('tabId')),
      'about:preferences#payments?ledgerRecoveryOverlayVisible',
      true
    )
  }

  captchaOverlay (promo) {
    return <Captcha promo={promo} />
  }

  statusMessage () {
    const promo = this.props.ledgerData.get('promotion') || Immutable.Map()
    const status = this.props.ledgerData.get('status') || ''
    const successText = promo.getIn(['panel', 'successText'])
    const promotionStatus = promo.get('promotionStatus')
    let isPromotion = true

    if ((!successText || !promo.has('claimedTimestamp')) && !promotionStatus) {
      isPromotion = false
      if (status.length === 0) {
        return
      }
    }

    let title, message, text, rightButton, leftButton, showClose

    if (isPromotion) {
      showClose = true
      title = successText.get('title')
      message = successText.get('message')
      text = promo.getIn(['panel', 'disclaimer'])
      rightButton = <BrowserButton
        secondaryColor
        l10nId={'paymentHistoryOKText'}
        custom={styles.enabledContent__overlay_button}
        onClick={this.closePromotionClick}
      />

      if (promotionStatus) {
        switch (promotionStatus) {
          case promotionStatuses.GENERAL_ERROR:
            {
              title = locale.translation('promotionGeneralErrorTitle')
              message = locale.translation('promotionGeneralErrorMessage')
              text = locale.translation('promotionGeneralErrorText')
              break
            }
          case promotionStatuses.PROMO_EXPIRED:
            {
              title = locale.translation('promotionClaimedErrorTitle')
              message = locale.translation('promotionClaimedErrorMessage')
              text = locale.translation('promotionClaimedErrorText')
              break
            }
          case promotionStatuses.CAPTCHA_CHECK:
          case promotionStatuses.CAPTCHA_ERROR:
            {
              return this.captchaOverlay(promo)
            }
        }
      }
    } else {
      switch (status) {
        case ledgerStatuses.CORRUPTED_SEED:
          {
            showClose = false
            title = locale.translation('corruptedOverlayTitle')
            message = locale.translation('corruptedOverlayMessage')
            text = locale.translation('corruptedOverlayText')
            leftButton = <a
              data-l10n-id='corruptedOverlayFAQ'
              className={css(styles.enabledContent__overlay_link)}
              href='https://brave.com/faq-payments#corrupted-wallet'
              target='_blank'
            />
            rightButton = <BrowserButton
              secondaryColor
              l10nId={'corruptedOverlayButton'}
              custom={styles.enabledContent__overlay_button}
              onClick={this.recoverStatusClick}
            />
            break
          }
        case ledgerStatuses.SERVER_PROBLEM:
          {
            showClose = false
            title = locale.translation('ledgerNetworkErrorTitle')
            message = locale.translation('ledgerNetworkErrorMessage')
            text = locale.translation('ledgerNetworkErrorText')
            break
          }
        default:
          {
            return
          }
      }
    }

    return <div className={cx({[css(styles.enabledContent__overlay)]: true, 'enabledContent__overlay': true})}>
      {
        showClose ? <div
          className={css(styles.enabledContent__overlay_close)}
          onClick={this.closePromotionClick}
          /> : null
      }
      <p className={css(styles.enabledContent__overlay_title)}>
        <span className={css(styles.enabledContent__overlay_bold)}>{title}</span>
        <span>{message}</span>
      </p>
      <p className={css(styles.enabledContent__overlay_text)}>
        {text}
      </p>
      <div className={css(styles.enabledContent__overlay_buttons)}>
        <div className={css(gridStyles.row1col1, styles.enabledContent__overlay_buttons_left)}>{leftButton}</div>
        <div className={css(gridStyles.row1col2, styles.enabledContent__overlay_buttons_right)}>{rightButton}</div>
      </div>
    </div>
  }

  showDeletedSites () {
    this.props.showOverlay('deletedSites')
    this.props.setOverlayName('deletedSites')
  }

  get deletedSitesLink () {
    if (this.props.showDeletedSites) {
      return <span>
        <a data-l10n-id='showDeletedSitesDialog'
          data-test-id='showDeletedSitesDialog'
          className={css(styles.enabledContent__footer__link)}
          onClick={this.showDeletedSites.bind(this)}
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
    const walletStatusText = walletStatus(ledgerData, this.props.settings)
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
        <div className={css(gridStyles.row2col2, gridStyles.mergeRow23Col2)}>
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
  },

  mergeRow23Col2: {
    gridRow: '2 / span 2'
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

  enabledContent__overlay: {
    position: 'absolute',
    zIndex: 3,
    top: 0,
    left: 0,
    width: '100%',
    minHeight: '159px',
    background: '#f3f3f3',
    borderRadius: '8px',
    padding: '27px 50px 17px',
    boxSizing: 'border-box',
    boxShadow: '4px 6px 3px #dadada'
  },

  enabledContent__overlay_close: {
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

  enabledContent__overlay_title: {
    color: '#5f5f5f',
    fontSize: '20px',
    display: 'block',
    marginBottom: '10px'
  },

  enabledContent__overlay_bold: {
    color: '#ff5500',
    paddingRight: '5px'
  },

  enabledContent__overlay_text: {
    fontSize: '16px',
    color: '#828282',
    maxWidth: '700px',
    lineHeight: '25px',
    padding: '5px 5px 5px 0'
  },

  enabledContent__overlay_buttons_left: {
    marginLeft: 0
  },

  enabledContent__overlay_buttons_right: {
    marginRight: 0
  },

  enabledContent__overlay_button: {
    float: 'right'
  },

  enabledContent__overlay_link: {
    color: '#5f5f5f',
    fontSize: '16px',
    textDecoration: 'none',

    ':hover': {
      textDecoration: 'underline'
    }
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
  },

  fundsAmount__item: {
    marginBottom: '4px',
    width: '215px',
    fontSize: '14.5px'
  },

  fundsAmount__total: {
    marginTop: '10px',
    paddingTop: '12px',
    borderTop: '1px solid #999',
    fontSize: '15px'
  },

  lastContribution: {
    paddingRight: '4px'
  }
})

module.exports = EnabledContent
