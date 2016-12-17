/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const ReactDOM = require('react-dom')
const Immutable = require('immutable')
const ImmutableComponent = require('../components/immutableComponent')
const {makeImmutable} = require('../../app/common/state/immutableUtil')

const ledgerExportUtil = require('../../app/common/lib/ledgerExportUtil')
const getTransactionCSVRows = ledgerExportUtil.getTransactionCSVRows
const addExportFilenamePrefixToTransactions = ledgerExportUtil.addExportFilenamePrefixToTransactions

const moment = require('moment')

const messages = require('../constants/messages')

const aboutUrls = require('../lib/appUrlUtil').aboutUrls
const aboutContributionsUrl = aboutUrls.get('about:contributions')

const aboutActions = require('./aboutActions')

const ipc = window.chrome.ipcRenderer

require('../../less/contributionStatement.less')

class ContributionStatement extends ImmutableComponent {
  constructor () {
    super()

    let hash = window.location.hash ? window.location.hash.slice(1) : ''

    this.state = {
      ledgerData: Immutable.Map(),
      publisherSynopsisMap: {},
      synopsis: [],
      savedPDF: false
    }

    ipc.on(messages.LEDGER_UPDATED, function (e, ledgerData) {
      if (ledgerData) {
        this.setState({
          ledgerData: Immutable.fromJS(ledgerData),
          synopsis: ledgerData.synopsis || [],
          transactions: Immutable.fromJS(
            addExportFilenamePrefixToTransactions(ledgerData.transactions)
          )
        })
        this.initializePublisherMap(ledgerData.synopsis || [])
      }

      // if hash is a valid transaction ID, then re-render using that transaction
      if (hash) {
        this.setTransaction(hash)
      } else {
        this.forceUpdate()
      }
    }.bind(this))
  }

  initializePublisherMap (synopsis) {
    synopsis = makeImmutable(synopsis || this.synopsis)

    let publisherMap = {}

    synopsis.forEach((synopsisRow) => {
      publisherMap[synopsisRow.get('publisherURL')] = synopsisRow.toJS()
    })

    this.setState({
      publisherSynopsisMap: publisherMap
    })
  }

  get transactions () {
    return this.state.transactions || Immutable.fromJS([])
  }

  get transactionIds () {
    let transactions = this.transactions.toJS()
    return transactions.map(function (tx) { return tx.viewingId })
  }

  getTransactionById (txId) {
    let transactionIds = this.transactionIds

    if (!transactionIds || transactionIds.indexOf(txId) === -1) {
      return null
    } else {
      return Immutable.fromJS((this.transactions.toJS())[transactionIds.indexOf(txId)])
    }
  }

  setTransaction (transactionId) {
    let transaction = this.getTransactionById(transactionId)

    if (transaction) {
      this.setState({transaction: transaction})

      if (!this.state.savedPDF) {
        this.setState({savedPDF: true})
        setTimeout(function () {
          this.renderPdf()
          window.close()
        }.bind(this), 250)
      }

      this.forceUpdate()

      return true
    } else {
      return false
    }
  }

  get htmlDataURL () {
    let generatedStylesheet = document.head.querySelector('style').outerHTML
    let dataURL = 'data:text/html,' + encodeURIComponent('<html><head><meta charset="utf-8">' + generatedStylesheet + '</head><body style="-webkit-print-color-adjust:exact">' + ReactDOM.findDOMNode(this).outerHTML + '</body></html>')

    return dataURL
  }

  receiptFileName (transaction) {
    transaction = makeImmutable(transaction || this.transaction)
    return `${transaction.get('exportFilenamePrefix')}.pdf`
  }

  renderPdf () {
    aboutActions.renderUrlToPdf(this.htmlDataURL, this.receiptFileName())
  }

  get transaction () {
    return this.state.transaction
  }

  get synopsis () {
    return this.state.synopsis
  }

  get publisherSynopsisMap () {
    return this.state.publisherSynopsisMap
  }

  get timestamp () {
    if (!this.transaction) {
      return null
    } else {
      return this.transaction.get('submissionStamp')
    }
  }

  get formattedDate () {
    return formattedDateFromTimestamp(this.timestamp)
  }

  get formattedTime () {
    return formattedTimeFromTimestamp(this.timestamp)
  }

  get ContributionStatementHeader () {
    return (
      <div className='titleBar contributionStatementHeader'>
        <div className='sectionTitleWrapper pull-left'>
          <div id='braveLogo' />
          <span className='sectionTitle' data-l10n-id='bravePayments' />
          <span className='sectionSubTitle' data-l10n-id='beta' />
        </div>
        <div className='sectionTitleWrapper pull-right'>
          <span className='sectionTitle smaller pull-right' data-l10n-id='contributionStatement' />
        </div>
      </div>
     )
  }

  get contributionDate () {
    return this.formattedDate
  }

  get contributionTime () {
    return this.formattedTime
  }

  get contributionAmount () {
    var fiatAmount = this.transaction.getIn(['contribution', 'fiat', 'amount'])
    var currency = this.transaction.getIn(['contribution', 'fiat', 'currency']) || 'USD'
    return (fiatAmount && typeof fiatAmount === 'number' ? fiatAmount.toFixed(2) : '0.00') + ' ' + currency
  }

  get ContributionStatementSummaryBox () {
    return (
      <div className='contributionStatementSummaryBox pull-right'>
        <table className='contributionStatementSummaryBoxTable'>
          <tbody>
            <tr><td className='leftColumn' data-l10n-id='contributionDate' /><td className='rightColumn'>{this.contributionDate}</td></tr>
            <tr><td className='leftColumn' data-l10n-id='contributionTime' /><td className='rightColumn'>{this.contributionTime}</td></tr>
            <tr><td className='leftColumn' data-l10n-id='contributionAmount' /><td className='rightColumn'>{this.contributionAmount}</td></tr>
          </tbody>
        </table>
      </div>
    )
  }

  get lastContributionHumanFormattedDate () {
    if (!this.transactionIds || !this.transactionIds.length || !this.transaction) {
      return ''
    }

    let transactionIds = this.transactionIds
    let currentTxIdx = transactionIds.indexOf(this.transaction.get('viewingId'))
    let lastTxIdx = (currentTxIdx ? currentTxIdx - 1 : -1)
    let date = ''
    if (lastTxIdx > -1) {
      let previousTransaction = this.transactions.toJS()[lastTxIdx] || {}
      let previousTimestamp = previousTransaction.submissionStamp

      if (previousTimestamp && previousTimestamp < this.timestamp) {
        date = longFormattedDateFromTimestamp(previousTimestamp)
      }
    }
    return date
  }

  get thisContributionHumanFormattedDate () {
    return longFormattedDateFromTimestamp(this.timestamp)
  }

  get rows () {
    if (!this.transaction) {
      // without a transaction there are no rows to process
      // this typically happens before the ledgerData is loaded
      return []
    }

    const sortPublishersByContribution = true
    const addTotalsRow = false
    return getTransactionCSVRows(this.transaction.toJS(), undefined, addTotalsRow, sortPublishersByContribution).map(function (row) {
      return row.split(',')
    }).slice(1)
  }

  get PER_PAGE () {
    return 20
  }

  get pages () {
    const PER_PAGE = this.PER_PAGE
    let rows = this.rows

    let pages = []

    rows.forEach(function (row, idx) {
      let pageIdx = Math.floor(idx / PER_PAGE)

      if (!pages[pageIdx]) {
        pages[pageIdx] = []
      }

      pages[pageIdx][idx % PER_PAGE] = row
    })

    return pages
  }

  ContributionStatementDetailTable (page, pageIdx, totalPages) {
    return (
      <div className='contributionStatementDetailTableContainer'>
        <div>
          <span className='statementDatesCoveredText pull-right'>
            { this.lastContributionHumanFormattedDate } - { this.thisContributionHumanFormattedDate }
          </span>
          <table className='contributionStatementDetailTable'>
            <tbody>
              <tr className='headingRow detailTableRow'>
                <td className='rankColumn' data-l10n-id='rank' />
                <td className='siteColumn' data-l10n-id='site' />
                <td className='fractionColumn' data-l10n-id='percentPaid' />
                <td className='fiatColumn' data-l10n-id='dollarsPaid' />
              </tr>
              <tr className='spacingRow' />
              {
              page.map(function (row, idx) {
                let publisherSynopsis = (this.synopsis.filter((entry) => { return entry.site === row[0] }) || [])[0] || {}

                let verified = publisherSynopsis.verified
                let site = row[0]
                let fractionStr = (parseFloat(row[2]) * 100).toFixed(2)
                let fiatStr = row[4]

                return (
                  <tr className='detailTableRow'>
                    <td className='rankColumn'>{(pageIdx * this.PER_PAGE) + idx + 1}</td>
                    <td className='siteColumn'>{verified ? <span className='verified' /> : null}<span className='site'>{site}</span></td>
                    <td className='fractionColumn'>{fractionStr}</td>
                    <td className='fiatColumn'>{fiatStr}</td>
                  </tr>
                )
              }.bind(this))
             }
              <tr className='spacingRow' />
            </tbody>
          </table>
          <div className='verifiedExplainer'><span className='verified' /> <span data-l10n-id='verifiedExplainerText' /></div>
          <div className='pageIndicator pull-right' data-l10n-id='pageNofMText' data-l10n-args={JSON.stringify({ n: (pageIdx + 1), m: totalPages })} />
        </div>
      </div>
    )
  }

  ContributionStatementFooterNoteBox (pageIdx) {
    const headingIds = [
      'contributionStatementFooterNoteBoxHeading1',
      'contributionStatementFooterNoteBoxHeading2'
    ]

    const messageIds = [
      'contributionStatementFooterNoteBoxBody1',
      'contributionStatementFooterNoteBoxBody2'
    ]

    return (
      <div className='footerNoteBox'>
        <span className='noteHeading' data-l10n-id={headingIds[pageIdx % headingIds.length]} />
        <br />
        <span className='noteBody' data-l10n-id={messageIds[pageIdx % messageIds.length]} />
      </div>
    )
  }

  get ContributionStatementPageFooter () {
    return (
      <div className='pageFooterBox'>
        <span className='pageFooterBody' data-l10n-id='contributionStatementCopyrightFooter' />
      </div>
    )
  }

  ContributionStatementPage (page, pageIdx, pages) {
    let totalPages = pages.length
    let pageContent = [
      <div className='contributionStatementSection'>
        {this.ContributionStatementHeader}
      </div>,
      pageIdx ? null : (
        <div className='contributionStatementSection'>
          {this.ContributionStatementSummaryBox}
        </div>
      ),
      <div className='contributionStatementSection'>
        {this.ContributionStatementDetailTable(page, pageIdx, totalPages)}
      </div>,
      <div className='contributionStatementSection'>
        {this.ContributionStatementFooterNoteBox(pageIdx)}
      </div>,
      <div className='contributionStatementSection'>
        {this.ContributionStatementPageFooter}
      </div>
    ]

    return (
      <div className='contributionStatementPage'>
        {pageContent}
      </div>
    )
  }

  render () {
    let pages = this.pages

    let transactions = this.transactions
    let transaction = this.transaction

    if (!transaction && transactions && transactions.toJS().length) {
      return (
        <div className='contributionList'>
          <div className='sectionTitleHeader' data-l10n-id='contributionStatements' />
          <div className='sectionTitle' data-l10n-id='listOfContributionStatements' />
          <div>
            <ul>
              {
                transactions.map(function (tx) {
                  return (
                    <li>
                      <a href={aboutContributionsUrl + '#' + tx.get('viewingId')} target='_blank'>
                        {this.receiptFileName(tx)}
                      </a>
                    </li>
                  )
                }.bind(this))
              }
            </ul>
          </div>
        </div>
      )
    } else {
      return (
        <div className='contributionStatementContainer'>
          { pages.map(this.ContributionStatementPage.bind(this)) }
        </div>
      )
    }
  }
}

function formattedDateFromTimestamp (timestamp) {
  // e.g. 2016-11-15
  return moment(new Date(timestamp)).format('YYYY-MM-DD')
}

function formattedTimeFromTimestamp (timestamp) {
  // e.g. 4:00pm
  return moment(new Date(timestamp)).format('h:mma')
}

function longFormattedDateFromTimestamp (timestamp) {
  let momentDate = moment(new Date(timestamp))

  // e.g. June 15th at 4:00pm
  return `${momentDate.format('MMMM Do')} at ${momentDate.format('h:mma')}`
}

module.exports = <ContributionStatement />
