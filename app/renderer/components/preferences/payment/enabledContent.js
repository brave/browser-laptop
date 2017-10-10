/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const {StyleSheet, css} = require('aphrodite/no-important')
const moment = require('moment')

// util
const {batToCurrencyString, formatCurrentBalance, formattedDateFromTimestamp, walletStatus} = require('../../../../common/lib/ledgerUtil')
const {l10nErrorText} = require('../../../../common/lib/httpUtil')
const {changeSetting} = require('../../../lib/settingsUtil')
const getSetting = require('../../../../../js/settings').getSetting
const settings = require('../../../../../js/constants/settings')

// components
const ImmutableComponent = require('../../immutableComponent')
const BrowserButton = require('../../common/browserButton')
const {FormTextbox} = require('../../common/textbox')
const {PanelDropdown} = require('../../common/dropdown')
const LedgerTable = require('./ledgerTable')

// style
const globalStyles = require('../../styles/global')
const {paymentStylesVariables} = require('../../styles/payment')
const {loaderAnimation} = require('../../styles/animations')
const cx = require('../../../../../js/lib/classSet')

// Actions
const appActions = require('../../../../../js/actions/appActions')

// TODO: report when funds are too low
// TODO: support non-USD currency
class EnabledContent extends ImmutableComponent {
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
        [css(styles.balance__iconLink)]: true
      })}
        href='https://brave.com/faq-payments/#brave-payments'
        target='_blank' rel='noopener'
      />
    </div>
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
      <a className={cx({
        [globalStyles.appIcons.question]: true,
        [css(styles.balance__iconLink)]: true
      })}
        href='https://brave.com/Payments_FAQ.html'
        target='_blank' rel='noopener'
      />
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

    return <section>
      <div data-l10n-id='nextContribution' />
      <div data-l10n-args={JSON.stringify(l10nDataArgs)} data-l10n-id={l10nDataId} />
    </section>
  }

  render () {
    const ledgerData = this.props.ledgerData
    const walletStatusText = walletStatus(ledgerData)
    const inTransition = !(ledgerData.getIn(['migration', 'btc2BatTransitionDone']))

    return <section className={css(styles.enabledContent)}>
      <div className={css(styles.enabledContent__loader, inTransition && styles.enabledContent__loader_show)}>
        <p className={css(styles.loader__text)}>
          <p data-l10n-id='leaderLoaderText1' />
          <p data-l10n-id='leaderLoaderText2' />
        </p>
        <div className={css(styles.leader__wrap)}>
          <div>
            <div className={css(styles.loader__line, styles.loader__line_1, !inTransition && styles.loader__line_off)} />
            <div className={css(styles.loader__line, styles.loader__line_2, !inTransition && styles.loader__line_off)} />
            <div className={css(styles.loader__line, styles.loader__line_3, !inTransition && styles.loader__line_off)} />
          </div>
        </div>
      </div>
      <div className={css(styles.enabledContent__walletBar)} data-test-id='walletBar'>
        <div className={css(gridStyles.row1col1, styles.enabledContent__walletBar__title)} data-l10n-id='monthlyBudget' />
        <div className={css(gridStyles.row1col2, styles.enabledContent__walletBar__title)} data-l10n-id='accountBalance' />
        <div className={css(gridStyles.row1col3)} />
        <div className={css(gridStyles.row2col1)}>
          <PanelDropdown
            data-test-id='fundsSelectBox'
            value={getSetting(settings.PAYMENTS_CONTRIBUTION_AMOUNT, this.props.settings)}
            onChange={changeSetting.bind(null, this.props.onChangeSetting, settings.PAYMENTS_CONTRIBUTION_AMOUNT)}>
            {
              [25, 50, 75, 100].map((amount) => {
                let alternative = ''
                if (ledgerData.has('currentRate')) {
                  alternative = `(${batToCurrencyString(amount, ledgerData)})`
                }
                return <option value={amount}>{amount} BAT {alternative}</option>
              })
            }
          </PanelDropdown>
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
      </div>
      <LedgerTable ledgerData={this.props.ledgerData}
        settings={this.props.settings}
        onChangeSetting={this.props.onChangeSetting}
        siteSettings={this.props.siteSettings} />
    </section>
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
  },

  row2col1: {
    gridRow: 2,
    gridColumn: 1
  },

  row2col2: {
    gridRow: 2,
    gridColumn: 2
  },

  row2col3: {
    gridRow: 2,
    gridColumn: 3
  },

  row3col1: {
    gridRow: 3,
    gridColumn: 1
  },

  row3col2: {
    gridRow: 3,
    gridColumn: 2
  },

  row3col3: {
    gridRow: 3,
    gridColumn: 3
  }
})

const styles = StyleSheet.create({
  enabledContent__walletBar: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    background: globalStyles.color.lightGray,
    borderRadius: globalStyles.radius.borderRadiusUIbox,
    padding: globalStyles.spacing.panelPadding,
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

  balance: {
    display: 'flex',
    alignItems: 'center'
  },

  balance__iconLink: {
    color: globalStyles.color.mediumGray,
    fontSize: globalStyles.payments.fontSize.regular,
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
  }
})

module.exports = EnabledContent
