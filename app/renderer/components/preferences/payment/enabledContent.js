/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const {StyleSheet, css} = require('aphrodite')

// util
const {btcToCurrencyString, formattedTimeFromNow, walletStatus} = require('../../../../common/lib/ledgerUtil')
const {l10nErrorText} = require('../../../../common/lib/httpUtil')
const {changeSetting} = require('../../../lib/settingsUtil')

// components
const ImmutableComponent = require('../../../../../js/components/immutableComponent')
const Button = require('../../../../../js/components/button')
const {FormTextbox} = require('../../textbox')
const {FormDropdown} = require('../../dropdown')
const {SettingsList, SettingItem} = require('../../settings')
const LedgerTable = require('./ledgerTable')

// style
const globalStyles = require('../../styles/global')
const {paymentStyles} = require('../../styles/payment')
const commonStyles = require('../../styles/commonStyles')
const cx = require('../../../../../js/lib/classSet')

// other
const getSetting = require('../../../../../js/settings').getSetting
const settings = require('../../../../../js/constants/settings')
const aboutActions = require('../../../../../js/about/aboutActions')

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

    return <Button
      testId={buttonText}
      test2Id={'addFunds'}
      l10nId={buttonText}
      className={css(commonStyles.buttonPrimary, styles.addFunds)}
      onClick={onButtonClick.bind(this)}
      disabled={ledgerData.get('creating')}
    />
  }

  paymentHistoryButton () {
    const ledgerData = this.props.ledgerData
    const walletCreated = ledgerData.get('created') && !ledgerData.get('creating')
    const walletTransactions = ledgerData.get('transactions')
    const walletHasTransactions = walletTransactions && walletTransactions.size
    const nextReconcileDateValue = this.nextReconcileDate()
    let buttonText

    if (!walletCreated || !nextReconcileDateValue) {
      return null
    } else if (!walletHasTransactions) {
      buttonText = 'noPaymentHistory'
      const now = new Date().getTime()
      const timestamp = this.props.ledgerData.get('reconcileStamp')
      if (timestamp <= now) {
        buttonText = (timestamp <= (now - (24 * 60 * 60 * 1000)))
          ? 'noPaymentOverDueHistory' : 'noPaymentDueHistory'
      }
    } else {
      buttonText = 'viewPaymentHistory'
    }

    const l10nDataArgs = {
      reconcileDate: nextReconcileDateValue
    }

    const onButtonClick = this.props.showOverlay.bind(this, 'paymentHistory')

    return <Button
      testId='paymentHistoryButton'
      className={css(styles.paymentHistoryButton)}
      l10nId={buttonText}
      l10nArgs={l10nDataArgs}
      onClick={onButtonClick.bind(this)}
      disabled={ledgerData.get('creating')}
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
      aboutActions.createWallet()
    }

    return () => {}
  }

  fundsAmount () {
    const ledgerData = this.props.ledgerData
    if (!ledgerData.get('created')) {
      return null
    }

    return <div className={css(styles.balance)}>
      {
        !(ledgerData.get('balance') === undefined || ledgerData.get('balance') === null)
          ? <FormTextbox data-test-id='fundsAmount' readOnly value={btcToCurrencyString(ledgerData.get('balance'), ledgerData)} />
          : <span className={css(styles.loading)}>
            <span className={css(styles.loadingText)} data-test-id='accountBalanceLoading' data-l10n-id='accountBalanceLoading' />
          </span>
      }
      <a className={css(styles.iconLink)} href='https://brave.com/Payments_FAQ.html' target='_blank'>
        <span className={cx({
          fa: true,
          'fa-question-circle': true,
          [css(styles.iconText)]: true
        })} />
      </a>
    </div>
  }

  nextReconcileDate () {
    const ledgerData = this.props.ledgerData
    if ((ledgerData.get('error')) || (!ledgerData.get('reconcileStamp'))) {
      return null
    }
    const timestamp = ledgerData.get('reconcileStamp')
    return formattedTimeFromNow(timestamp)
  }

  nextReconcileMessage () {
    const ledgerData = this.props.ledgerData
    const nextReconcileDateRelative = this.nextReconcileDate()
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

    return <div className={css(styles.nextReconcileDate)} data-l10n-args={JSON.stringify(l10nDataArgs)} data-l10n-id={l10nDataId} />
  }

  render () {
    const ledgerData = this.props.ledgerData
    const walletStatusText = walletStatus(ledgerData)

    return <div>
      <div className={css(styles.walletBar)} data-test-id='walletBar'>
        <table>
          <thead>
            <tr className={css(styles.tableTr)}>
              <th className={css(styles.tableTh)} data-l10n-id='monthlyBudget' />
              <th className={css(styles.tableTh)} data-l10n-id='accountBalance' />
              <th className={css(styles.tableTh)} data-l10n-id='status' />
            </tr>
          </thead>
          <tbody>
            <tr className={css(styles.tableTr)}>
              <td className={css(styles.tableTd)}>
                <SettingsList className={css(styles.listContainer)}>
                  <SettingItem>
                    <FormDropdown
                      data-test-id='fundsSelectBox'
                      value={getSetting(settings.PAYMENTS_CONTRIBUTION_AMOUNT, this.props.settings)}
                      onChange={changeSetting.bind(null, this.props.onChangeSetting, settings.PAYMENTS_CONTRIBUTION_AMOUNT)}>
                      {
                        [5, 10, 15, 20].map((amount) =>
                          <option value={amount}>{amount} {ledgerData.get('currency') || 'USD'}</option>
                        )
                      }
                    </FormDropdown>
                  </SettingItem>
                  <SettingItem>
                    {this.paymentHistoryButton()}
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
                          {this.walletButton()}
                        </SettingItem>
                      </SettingsList>
                    </div>
                }
              </td>
              <td className={css(styles.tableTd)}>
                <div data-test-id='walletStatus'
                  data-l10n-id={walletStatusText.id}
                  data-l10n-args={walletStatusText.args ? JSON.stringify(walletStatusText.args) : null}
                />
                {this.nextReconcileMessage()}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <LedgerTable ledgerData={this.props.ledgerData}
        settings={this.props.settings}
        onChangeSetting={this.props.onChangeSetting}
        siteSettings={this.props.siteSettings} />
    </div>
  }
}

const styles = StyleSheet.create({
  walletBar: {
    background: globalStyles.color.lightGray,
    borderRadius: globalStyles.radius.borderRadiusUIbox,
    padding: paymentStyles.padding.bar,
    margin: `${paymentStyles.margin.bar} 0`
  },

  listContainer: {
    marginBottom: 0
  },

  tableTh: {
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
    marginTop: paymentStyles.margin.barItem
  },

  nextReconcileDate: {
    marginTop: paymentStyles.margin.barItem,
    marginBottom: 0
  },

  settingsListContainer: {
    marginBottom: 0
  },

  paymentHistoryButton: {
    display: 'block',
    fontSize: paymentStyles.font.regular,
    lineHeight: '18px',
    color: globalStyles.color.braveOrange,
    height: 'auto',
    marginTop: paymentStyles.margin.barItem,
    padding: 0,
    textAlign: 'left',
    cursor: 'pointer',
    whiteSpace: 'normal'
  },

  addFunds: {
    minWidth: '180px',
    width: 'auto',
    marginTop: paymentStyles.margin.barItem
  },

  balance: {
    display: 'flex',
    alignItems: 'center',
    verticalAlign: 0,
    height: '100%',
    marginBottom: 0
  },

  loading: {
    height: '2.25em',
    display: 'flex',
    alignItems: 'center',
    margin: 0,
    padding: 0
  },

  loadingText: {
    fontSize: paymentStyles.font.regular,
    margin: 0,
    padding: 0
  },

  iconLink: {
    textDecoration: 'none',

    ':hover': {
      textDecoration: 'none'
    }
  },

  iconText: {
    color: globalStyles.color.gray,
    margin: '0 0 0 5px',
    fontSize: paymentStyles.font.regular
  }
})

module.exports = EnabledContent
