/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const Immutable = require('immutable')
const {StyleSheet, css} = require('aphrodite/no-important')

// util
const {addExportFilenamePrefixToTransactions} = require('../../../../common/lib/ledgerExportUtil')
const {formattedTimeFromNow, formattedDateFromTimestamp} = require('../../../../common/lib/ledgerUtil')
const appUrlUtil = require('../../../../../js/lib/appUrlUtil')

// components
const {BrowserButton} = require('../../common/browserButton')
const ImmutableComponent = require('../../immutableComponent')

// style
const globalStyles = require('../../styles/global')
const {paymentStylesVariables} = require('../../styles/payment')

// other
const aboutUrls = appUrlUtil.aboutUrls
const aboutContributionsUrl = aboutUrls.get('about:contributions')
const moment = require('moment')
moment.locale(navigator.language)

class HistoryContent extends ImmutableComponent {
  render () {
    const transactions = Immutable.fromJS(
      addExportFilenamePrefixToTransactions(this.props.ledgerData.get('transactions').toJS())
    )

    return <table className={css(styles.paymentHistoryTable)}>
      <thead className={css(styles.headerContainer__wrapper)}>
        <tr className={css(styles.flex, styles.headerContainer)}>
          <th className={css(styles.header, styles.column, styles.leftRow, styles.column__narrow)} data-l10n-id='date' />
          <th className={css(styles.header, styles.column, styles.column__narrow)} data-l10n-id='totalAmount' />
          <th className={css(styles.header, styles.column, styles.column__wide)} data-l10n-id='receiptLink' />
        </tr>
      </thead>
      <tbody>
        {
          transactions.map(row => <HistoryRow transaction={row} ledgerData={this.props.ledgerData} />)
        }
      </tbody>
    </table>
  }
}

class HistoryRow extends ImmutableComponent {
  get transaction () {
    return this.props.transaction
  }

  get formattedDate () {
    const timestamp = this.transaction.get('submissionStamp')
    return formattedDateFromTimestamp(timestamp, 'YYYY-MM-DD')
  }

  get satoshis () {
    return this.transaction.getIn(['contribution', 'satoshis'])
  }

  get currency () {
    return this.transaction.getIn(['contribution', 'fiat', 'currency'])
  }

  get totalAmount () {
    const fiatAmount = this.transaction.getIn(['contribution', 'fiat', 'amount'])
    return (fiatAmount && typeof fiatAmount === 'number' ? fiatAmount.toFixed(2) : '0.00')
  }

  get viewingId () {
    return this.transaction.get('viewingId')
  }

  get receiptFileName () {
    return `${this.transaction.get('exportFilenamePrefix')}.pdf`
  }

  get totalAmountStr () {
    return `${this.totalAmount} ${this.currency}`
  }

  render () {
    return <tr className={css(styles.flex, styles.rowData)}>
      <td className={css(styles.flexAlignCenter, styles.column, styles.leftRow, styles.column__narrow)} data-sort={this.timestamp}>{this.formattedDate}</td>
      <td className={css(styles.flexAlignCenter, styles.column, styles.column__amount, styles.column__narrow)} data-sort={this.satoshis}>{this.totalAmountStr}</td>
      <td className={css(styles.flexAlignCenter, styles.column, styles.column__wide)}>
        <a href={`${aboutContributionsUrl}#${this.viewingId}`} target='_blank'>{this.receiptFileName}</a>
      </td>
    </tr>
  }
}

class HistoryFooter extends ImmutableComponent {
  render () {
    const ledgerData = this.props.ledgerData
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

    const l10nDataArgs = {
      reconcileDate: formattedTimeFromNow(timestamp)
    }

    return <section className={css(styles.flexAlignCenter, styles.historyFooter)}>
      <div className={css(styles.historyFooter__nextPayment)}>
        <span data-l10n-id={l10nDataId} data-l10n-args={JSON.stringify(l10nDataArgs)} />
      </div>
      <BrowserButton primaryColor
        l10nId='paymentHistoryOKText'
        testId='paymentHistoryOKText'
        onClick={this.props.hideOverlay.bind(this, 'paymentHistory')}
      />
    </section>
  }
}

const columnHeight = '1.5rem'
const columnPadding = '.25rem'
const headerBorderWidth = '2px'

const styles = StyleSheet.create({
  flex: {
    display: 'flex'
  },
  flexAlignCenter: {
    display: 'flex',
    alignItems: 'center'
  },
  // TODO: refactor modalOverlay and preferences.less
  // See: .paymentsContainer .modal .dialog.paymentHistory .dialog-footer in preferences.less
  leftRow: {
    paddingLeft: paymentStylesVariables.spacing.paymentHistoryTablePadding
  },

  paymentHistoryTable: {
    display: 'flex',
    flexFlow: 'column nowrap',
    borderSpacing: '0'
  },

  headerContainer__wrapper: {
    position: 'sticky',
    top: 0
  },
  headerContainer: {
    paddingTop: columnPadding,
    paddingBottom: columnPadding,
    borderBottom: `${headerBorderWidth} solid ${globalStyles.color.lightGray}`,
    height: columnHeight,
    alignItems: 'center',
    cursor: 'default',
    userSelect: 'none'
  },
  header: {
    color: paymentStylesVariables.tableHeader.fontColor,
    fontWeight: paymentStylesVariables.tableHeader.fontWeight,
    textAlign: 'left',

    // cancel border-bottom of headerContainer
    position: 'relative',
    top: headerBorderWidth
  },

  column: {
    height: columnHeight
  },
  column__narrow: {
    flex: '1'
  },
  column__amount: {
    color: globalStyles.color.mediumGray
  },
  column__wide: {
    flex: '2'
  },

  rowData: {
    padding: `${columnPadding} 0`,

    ':nth-child(even)': {
      backgroundColor: globalStyles.color.veryLightGray
    },
    ':hover': {
      backgroundColor: globalStyles.color.defaultIconBackground
    }
  },

  historyFooter: {
    justifyContent: 'space-between',
    cursor: 'default',
    userSelect: 'none'
  },
  historyFooter__nextPayment: {
    // 16px * 0.875 = 14px
    fontSize: '0.875rem'
  }
})

module.exports = {
  HistoryContent,
  HistoryFooter
}
