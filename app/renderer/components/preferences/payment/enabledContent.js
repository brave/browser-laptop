/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const {StyleSheet, css} = require('aphrodite')
const moment = require('moment')
const Immutable = require('immutable')

// util
const {batToCurrencyString, formatCurrentBalance, formattedDateFromTimestamp, walletStatus} = require('../../../../common/lib/ledgerUtil')
const {l10nErrorText} = require('../../../../common/lib/httpUtil')
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
const {SettingsList, SettingItem} = require('../../common/settings')
const LedgerTable = require('./ledgerTable')

// style
const globalStyles = require('../../styles/global')
const {paymentStyles, paymentStylesVariables} = require('../../styles/payment')
const {loaderAnimation} = require('../../styles/animations')
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
      <BrowserButton primaryColor
        testId={buttonText}
        test2Id={'addFunds'}
        l10nId={buttonText}
        custom={styles.addFunds}
        onClick={onButtonClick.bind(this)}
        disabled={!ledgerData.get('created')}
      />
      <a className={cx({
        fa: true,
        'fa-question-circle': true,
        [css(styles.balance__iconLink)]: true
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

    return <section className={css(styles.balance)}>
      <FormTextbox data-test-id='fundsAmount' readOnly value={formatCurrentBalance(ledgerData)} />
      <a className={css(styles.iconLink)} href='https://brave.com/Payments_FAQ.html' target='_blank' rel='noopener'>
        <span className={cx({
          fa: true,
          'fa-question-circle': true,
          [css(styles.iconText)]: true
        })} />
      </a>
    </section>
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

    return <section className={css(styles.contribution, styles.lastContribution)}>
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
      nextReconcileDateRelative = formattedDateFromTimestamp(moment().add(1, 'months'), 'MMMM Do')
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

    return <section className={css(styles.contribution, styles.nextContribution)}>
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

  render () {
    const ledgerData = this.props.ledgerData
    const walletStatusText = walletStatus(ledgerData)
    const contributionAmount = ledgerState.getContributionAmount(null, ledgerData.get('contributionAmount'), this.props.settings)
    const inTransition = ledgerData.getIn(['migration', 'btc2BatTransitionPending']) === true

    return <section className={css(styles.enabledContent)}>
      <div className={css(styles.enabledContent__loader, inTransition && styles.enabledContent__loader_show)}>
        <div className={css(styles.loader__text)}>
          <p data-l10n-id='leaderLoaderText1' />
          <p data-l10n-id='leaderLoaderText2' />
        </div>
        <div className={css(styles.leader__wrap)}>
          <div>
            <div className={css(styles.loader__line, styles.loader__line_1, !inTransition && styles.loader__line_off)} />
            <div className={css(styles.loader__line, styles.loader__line_2, !inTransition && styles.loader__line_off)} />
            <div className={css(styles.loader__line, styles.loader__line_3, !inTransition && styles.loader__line_off)} />
          </div>
        </div>
      </div>
      <div className={css(styles.walletBar)} data-test-id='walletBar'>
        <table>
          <thead>
            <tr className={css(styles.tableTr)}>
              <th className={css(styles.walletBar__tableTr__tableTh)} data-l10n-id='monthlyBudget' />
              <th className={css(styles.walletBar__tableTr__tableTh)} data-l10n-id='accountBalance' />
              <th className={css(styles.walletBar__tableTr__tableTh)}>
                {this.claimButton()}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr className={css(styles.tableTr)}>
              <td className={css(styles.tableTd)}>
                <SettingsList className={css(styles.listContainer)}>
                  <SettingItem>
                    <FormDropdown
                      data-test-id='fundsSelectBox'
                      value={contributionAmount}
                      onChange={changeSetting.bind(null, this.props.onChangeSetting, settings.PAYMENTS_CONTRIBUTION_AMOUNT)}>
                      {
                        [5.0, 7.5, 10.0, 17.5, 25.0, 50.0, 75.0, 100.0].map((amount) => {
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
                  </SettingItem>
                  <SettingItem>
                    {this.lastReconcileMessage()}
                  </SettingItem>
                </SettingsList>
              </td>
              <td className={css(styles.tableTd)}>
                {
                  ledgerData.get('error') && ledgerData.get('error').get('caller') === 'getWalletProperties'
                    ? <div>
                      <div data-l10n-id='accountBalanceConnectionError' />
                      <div className={css(styles.accountBalanceError)} data-l10n-id={this.ledgerDataErrorText()} />
                    </div>
                    : <div>
                      <SettingsList className={css(styles.listContainer)}>
                        <SettingItem>
                          {this.fundsAmount()}
                        </SettingItem>
                        <SettingItem>
                          {this.nextReconcileMessage()}
                        </SettingItem>
                      </SettingsList>
                    </div>
                }
              </td>
              <td className={css(styles.tableTd)}>
                {this.walletButton()}
                <div className={css(styles.walletStatus)}
                  data-test-id='walletStatus'
                  data-l10n-id={walletStatusText.id}
                  data-l10n-args={walletStatusText.args ? JSON.stringify(walletStatusText.args) : null}
                />
              </td>
            </tr>
          </tbody>
        </table>
        {this.statusMessage()}
      </div>
      <LedgerTable ledgerData={this.props.ledgerData}
        settings={this.props.settings}
        onChangeSetting={this.props.onChangeSetting}
        siteSettings={this.props.siteSettings} />
      <a data-l10n-id='termsOfService'
        className={css(styles.enabledContent__tos)}
        href='https://basicattentiontoken.org/contributor-terms-of-service/'
        target='_blank'
        rel='noreferrer noopener' />
    </section>
  }
}

const styles = StyleSheet.create({
  walletBar: {
    position: 'relative',
    background: globalStyles.color.lightGray,
    borderRadius: globalStyles.radius.borderRadiusUIbox,
    padding: globalStyles.spacing.panelPadding,
    margin: `${globalStyles.spacing.panelMargin} 0`
  },

  listContainer: {
    marginBottom: 0
  },

  walletBar__tableTr__tableTh: {
    color: paymentStylesVariables.tableHeader.fontColor,
    fontWeight: paymentStylesVariables.tableHeader.fontWeight,
    textAlign: 'left'
  },

  tableTr: {
    height: '1em'
  },

  tableTd: {
    fontSize: paymentStyles.font.regular,
    padding: '10px 30px 0 0',
    width: 'auto',
    minWidth: paymentStyles.width.tableRow,
    verticalAlign: 'top'
  },

  accountBalanceError: {
    marginTop: globalStyles.spacing.panelItemMargin
  },

  settingsListContainer: {
    marginBottom: 0
  },

  addFunds: {
    minWidth: '180px',
    width: 'auto',
    marginTop: 0,
    paddingTop: '6px',
    paddingBottom: '6px'
  },

  balance: {
    display: 'flex',
    alignItems: 'center',
    verticalAlign: 0,
    height: '100%',
    marginBottom: 0
  },

  iconLink: {
    textDecoration: 'none',

    ':hover': {
      textDecoration: 'none'
    }
  },

  iconText: {
    color: globalStyles.color.mediumGray,
    margin: '0 0 0 5px',

    // TODO: refactor preferences.less to remove !important
    fontSize: `${globalStyles.fontSize.settingItemSubtext} !important`
  },

  contribution: {
    lineHeight: 1.5
  },

  lastContribution: {
    marginTop: '16px',
    marginBottom: 0
  },

  nextContribution: {
    marginTop: '15px',
    marginBottom: 0
  },

  walletStatus: {
    marginTop: '15px',
    lineHeight: 1.5
  },

  balance__iconLink: {
    color: globalStyles.color.mediumGray,
    fontSize: globalStyles.fontSize.settingItemSubtext,
    marginLeft: '5px',
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
    fontSize: '13px',
    color: '#666',
    padding: '20px 60px'
  },

  enabledContent__loader: {
    background: '#fafafa',
    zIndex: 3,
    position: 'absolute',
    left: 0,
    top: 0,
    width: '100%',
    height: '100%',
    margin: 0,
    opacity: 0,
    transform: 'translateX(-1000%)',
    transition: 'opacity .4s ease-out, transform .1s .4s ease'
  },

  enabledContent__loader_show: {
    opacity: 1,
    transform: 'translateX(0)',
    transition: 'opacity .4s ease-out'
  },

  loader__text: {
    textAlign: 'center',
    padding: '50px 0 20px',
    display: 'block',
    color: '#444'
  },

  leader__wrap: {
    width: '45px',
    left: 0,
    right: 0,
    margin: '50px auto 0'
  },

  loader__line: {
    display: 'inline-block',
    width: '15px',
    height: '15px',
    borderRadius: '15px',
    animationName: [loaderAnimation],
    animationDuration: '.6s',
    animationIterationCount: 'infinite'
  },

  loader__line_1: {
    backgroundColor: '#FF5000',
    animationDelay: '.1s'
  },

  loader__line_2: {
    backgroundColor: '#9E1F63',
    animationDelay: '.2s'
  },

  loader__line_3: {
    backgroundColor: '#662D91',
    animationDelay: '.3s'
  },

  loader__line_off: {
    animationName: 'none'
  },

  claimButton: {
    marginTop: '10px'
  },

  enabledContent__grant: {
    position: 'absolute',
    zIndex: 3,
    top: 0,
    left: 0,
    width: '100%',
    minHeight: '100%',
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
  }
})

module.exports = EnabledContent
