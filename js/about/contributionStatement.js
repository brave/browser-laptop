/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const ReactDOM = require('react-dom')
const Immutable = require('immutable')
const {makeImmutable} = require('../../app/common/state/immutableUtil')
const {getBase64FromImageUrl} = require('../lib/imageUtil')

const ledgerExportUtil = require('../../app/common/lib/ledgerExportUtil')
const getTransactionCSVRows = ledgerExportUtil.getTransactionCSVRows
const addExportFilenamePrefixToTransactions = ledgerExportUtil.addExportFilenamePrefixToTransactions

const moment = require('moment')

const messages = require('../constants/messages')

const aboutUrls = require('../lib/appUrlUtil').aboutUrls
const aboutContributionsUrl = aboutUrls.get('about:contributions')

const aboutActions = require('./aboutActions')

const ipc = window.chrome.ipcRenderer

const {StyleSheet, css} = require('aphrodite/no-important')
const globalStyles = require('../../app/renderer/components/styles/global')

const braveLogo = require('../../app/extensions/brave/img/braveAbout.png')
const verifiedIcon = require('../../app/extensions/brave/img/ledger/verified_green_icon.svg')

class ContributionStatement extends React.Component {
  constructor () {
    super()

    let hash = window.location.hash ? window.location.hash.slice(1) : ''

    this.state = {
      ledgerData: Immutable.Map(),
      publisherSynopsisMap: {},
      synopsis: [],
      savedPDF: false,
      braveLogo: '',
      verifiedIcon: ''
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

      // Pop up the save dialog (but don't close the statement)
      if (!this.state.savedPDF) {
        this.setState({savedPDF: true})
        setTimeout(function () {
          this.renderPdf()
        }.bind(this), 250)
      }

      this.forceUpdate()

      return true
    } else {
      return false
    }
  }

  componentDidMount () {
    const aboutContributionsOrigin = new window.URL(aboutContributionsUrl).origin
    const imgSource = (source) => `${aboutContributionsOrigin}/${source.replace('.', '')}`

    // Convert images to base64 so it can be seen if PDF is saved as HTML
    getBase64FromImageUrl(imgSource(braveLogo)).then(src => this.setState({braveLogo: src}))
    getBase64FromImageUrl(verifiedIcon).then(src => this.setState({verifiedIcon: src}))
  }

  get htmlDataURL () {
    let generatedStylesheet = document.head.querySelector('style').outerHTML
    let dataURL = 'data:text/html,' + encodeURIComponent('<html><head><meta charset="utf-8">' + generatedStylesheet + '</head><body>' + ReactDOM.findDOMNode(this).outerHTML + '</body></html>')

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
    const imgStyle = StyleSheet.create({
      titleWrapper__braveLogo: {
        background: `url(${this.state.braveLogo})`,
        backgroundSize: 'contain',
        backgroundRepeat: 'no-repeat',
        width: '50px',
        height: '50px'
      }
    })
    return (
      <div className={css(styles.flexJustifyBetween, styles.statement__header)} data-test-id='contributionStatementHeader'>
        <div className={css(styles.flexAlignCenter, styles.header__titleWrapper)}>
          <div id='braveLogo' className={css(imgStyle.titleWrapper__braveLogo)} />
          <span className={css(styles.titleWrapper__sectionTitle, styles.sectionTitle__bravePayments)} data-l10n-id='bravePayments' />
          <sup className={css(styles.titleWrapper__sectionSubTitle)} data-l10n-id='beta' />
        </div>
        <div className={css(styles.header__titleWrapper)}>
          <span className={css(styles.titleWrapper__sectionTitle)} data-l10n-id='contributionStatement' />
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
      <div className={css(styles.flexJustifyEnd, styles.statement__summaryBox)}
        data-test-id='contributionStatementSummaryBox'>
        <table className={css(styles.statement__summaryBoxTable)} data-test-id='contributionStatementSummaryBoxTable'>
          <tbody>
            <tr>
              <td className={css(styles.summaryBoxTable__leftColumn)} data-l10n-id='contributionDate' />
              <td className={css(styles.summaryBoxTable__rightColumn)}>{this.contributionDate}</td>
            </tr>
            <tr>
              <td className={css(styles.summaryBoxTable__leftColumn)} data-l10n-id='contributionTime' />
              <td className={css(styles.summaryBoxTable__rightColumn)}>{this.contributionTime}</td>
            </tr>
            <tr>
              <td className={css(styles.summaryBoxTable__leftColumn)} data-l10n-id='contributionAmount' />
              <td className={css(styles.summaryBoxTable__rightColumn)}>{this.contributionAmount}</td>
            </tr>
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

  get contributionDateRangeString () {
    if (this.lastContributionHumanFormattedDate !== '') {
      return (
        <div className={css(styles.statement__dates)}>
          { this.lastContributionHumanFormattedDate + ' - ' + this.thisContributionHumanFormattedDate }
        </div>
      )
    }
    return null
  }

  ContributionStatementDetailTable (page, pageIdx, totalPages) {
    const imgStyle = StyleSheet.create({
      verified: {
        height: '20px',
        width: '20px',
        background: `url(${this.state.verifiedIcon})`,
        position: 'relative',
        backgroundSize: 'contain',
        backgroundRepeat: 'no-repeat'
      }
    })

    return (
      <div className={css(styles.detailTable__container)}>
        <div>
          <div className={css(styles.flexJustifyEnd)}>
            { this.contributionDateRangeString }
          </div>
          <table className={css(styles.detailTable__table)}>
            <tbody>
              <tr className={css(styles.textAlignRight, styles.table__tr, styles.table__headingRow)}>
                <th className={css(styles.table__th)} data-test-id='rankColumn' data-l10n-id='rank' />
                <th className={css(styles.table__th, styles.table__siteColumn)} data-test-id='siteColumnTh' data-l10n-id='site' />
                <th className={css(styles.table__th)} data-test-id='fractionColumn' data-l10n-id='percentPaid' />
                <th className={css(styles.table__th)} data-test-id='fiatColumn' data-l10n-id='dollarsPaid' />
              </tr>
              <tr className={css(styles.table__tr, styles.table__spacingRow)} />
              {
              page.map(function (row, idx) {
                let publisherSynopsis = (this.synopsis.filter((entry) => { return entry.site === row[0] }) || [])[0] || {}

                let verified = publisherSynopsis.verified
                let site = row[0]
                let fractionStr = (parseFloat(row[2]) * 100).toFixed(2)
                let fiatStr = row[4]

                return (
                  <tr className={css(styles.textAlignRight, styles.table__tr)}>
                    <td className='rankColumn'>{(pageIdx * this.PER_PAGE) + idx + 1}</td>
                    <td className={css(
                      styles.flexJustifyStart,
                      styles.flexAlignCenter,
                      styles.table__siteColumn)}
                      data-test-id='siteColumnTr'>
                      {verified ? <span className={css(imgStyle.verified, styles.table__verified)} /> : null}
                      <span className={verified ? css(styles.table__verifiedSite) : site}>{site}</span>
                    </td>
                    <td className='fractionColumn'>{fractionStr}</td>
                    <td className='fiatColumn'>{fiatStr}</td>
                  </tr>
                )
              }.bind(this))
             }
              <tr className='spacingRow' />
            </tbody>
          </table>
          <div className={css(styles.flexAlignCenter, styles.verifiedExplainer__wrapper)}>
            <div className={css(styles.flexAlignCenter)} data-test-id='verifiedExplainer'>
              <span className={css(imgStyle.verified)} />
              <span className={css(styles.verifiedExplainer__text)} data-l10n-id='verifiedExplainerText' />
            </div>
            <div className={css(styles.verifiedExplainer__pageIndicator)}
              data-test-id='pageIndicator'
              data-l10n-id='pageNofMText'
              data-l10n-args={JSON.stringify({ n: (pageIdx + 1), m: totalPages })}
            />
          </div>
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
      <div className={css(styles.footer__noteWrapper)}>
        <div className={css(styles.noteWrapper__heading)}
          data-test-id='noteHeading'
          data-l10n-id={headingIds[pageIdx % headingIds.length]}
        />
        <div className='noteBody' data-l10n-id={messageIds[pageIdx % messageIds.length]} />
      </div>
    )
  }

  get ContributionStatementPageFooter () {
    const l10nDataArgs = {
      currentYear: new Date().getFullYear().toString(10)
    }

    return (
      <div className={css(styles.footer__footerWrapper)} data-test-id='pageFooterBox'>
        <span className={css(styles.footerWrapper__body)}
          data-test-id='pageFooterBody'
          data-l10n-id='contributionStatementCopyrightFooter'
          data-l10n-args={JSON.stringify(l10nDataArgs)}
        />
      </div>
    )
  }

  ContributionStatementPage (page, pageIdx, pages) {
    let totalPages = pages.length
    let pageContent = [
      (this.ContributionStatementHeader),
      (pageIdx ? null : (this.ContributionStatementSummaryBox)),
      (this.ContributionStatementDetailTable(page, pageIdx, totalPages)),
      (this.ContributionStatementFooterNoteBox(pageIdx)),
      (this.ContributionStatementPageFooter)
    ]

    return (
      <div className={css(styles.statement__page)} data-test-id='contributionStatementPage'>
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
        <div className={css(styles.list)} data-test-id='contributionList'>
          <div className={css(styles.list__sectionTitleHeader)} data-l10n-id='contributionStatements' />
          <div className={css(styles.list__sectionTitle)} data-l10n-id='listOfContributionStatements' />
          <div>
            <ul className={css(styles.list__ul)}>
              {
                transactions.map(function (tx) {
                  return (
                    <li>
                      <a className={css(styles.list__anchor)} href={aboutContributionsUrl + '#' + tx.get('viewingId')} target='_blank'>
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
        <div className={css(styles.statement__container)} data-test-id='contributionStatementContainer'>
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

const containerMargin = '25px'
const boxMargin = '15px'
const summaryBoxTableBorder = '10px'
const summaryBoxTableMargin = '10px'
const summaryBoxTablePadding = '10px'
const lightGray = '#f7f7f7'

const styles = StyleSheet.create({
  flexAlignCenter: {
    display: 'flex',
    alignItems: 'center'
  },
  flexJustifyBetween: {
    display: 'flex',
    justifyContent: 'space-between'
  },
  flexJustifyStart: {
    display: 'flex',
    justifyContent: 'flex-start'
  },
  flexJustifyEnd: {
    display: 'flex',
    justifyContent: 'flex-end'
  },
  textAlignRight: {
    textAlign: 'right'
  },

  // ContributionStatementHeader
  statement__header: {
    flexFlow: 'row wrap',
    alignItems: 'center',
    marginBottom: '25px'
  },
  header__titleWrapper: {
    position: 'relative'
  },
  titleWrapper__sectionTitle: {
    color: '#3B3B3B',
    fontSize: '28px'
  },
  sectionTitle__bravePayments: {
    position: 'relative'
  },
  titleWrapper__sectionSubTitle: {
    color: '#ff5000',
    fontSize: '15px',
    position: 'absolute',
    bottom: '36px',
    right: '-20px'
  },

  // ContributionStatementSummaryBox
  statement__summaryBox: {
    marginBottom: '25px'
  },
  statement__summaryBoxTable: {
    borderSpacing: summaryBoxTableBorder,
    position: 'relative',
    left: summaryBoxTableBorder
  },
  summaryBoxTable__leftColumn: {
    textAlign: 'right',
    padding: summaryBoxTablePadding,
    margin: summaryBoxTableMargin,
    backgroundColor: lightGray
  },
  summaryBoxTable__rightColumn: {
    textAlign: 'center',
    padding: summaryBoxTablePadding,
    margin: summaryBoxTableMargin,
    border: 'solid 3px #e7e7e7',
    fontWeight: 'bold'
  },

  // contributionDateRangeString
  statement__dates: {
    marginBottom: boxMargin
  },

  // ContributionStatementDetailTable
  detailTable__container: {
    marginTop: boxMargin,
    marginBottom: boxMargin
  },
  detailTable__table: {
    width: '100%',
    border: `5px solid ${lightGray}`
  },
  table__siteColumn: {
    paddingLeft: '40px',
    textAlign: 'left'
  },
  table__headingRow: {
    background: lightGray
  },
  table__spacingRow: {
    ':before': {
      lineHeight: '16px',
      content: "'_'",
      display: 'block',
      color: 'white'
    }
  },
  table__th: {
    whiteSpace: 'nowrap',
    fontWeight: 'normal'
  },
  table__tr: {
    height: '22px'
  },
  table__verified: {
    left: '-25px'
  },
  table__verifiedSite: {
    position: 'relative',
    left: '-20px'
  },
  verifiedExplainer__wrapper: {
    marginTop: boxMargin,
    justifyContent: 'space-between',
    flexFlow: 'row wrap',
    paddingLeft: '10px',
    paddingRight: '10px'
  },
  verifiedExplainer__text: {
    marginLeft: '.5em'
  },
  verifiedExplainer__pageIndicator: {
    marginLeft: '.5em'
  },

  // ContributionStatementFooterNoteBox
  footer__noteWrapper: {
    background: lightGray,
    padding: containerMargin
  },
  noteWrapper__heading: {
    color: '#ff5000',
    marginBottom: '5px'
  },

  // ContributionStatementPageFooter
  footer__footerWrapper: {
    margin: `${containerMargin} ${containerMargin} 0`
  },
  footerWrapper__body: {
    color: globalStyles.color.gray
  },

  // ContributionStatementPage
  statement__page: {
    display: 'flex',
    flexFlow: 'column nowrap',
    pageBreakAfter: 'always'
  },

  list: {
    fontFamily: 'Arial',
    color: '#3B3B3B',
    margin: '0',
    padding: '0 24px'
  },
  list__sectionTitleHeader: {
    fontSize: '24px',
    fontWeight: '200',
    display: 'inline-block',
    color: '#ff5000',
    cursor: 'default'
  },
  list__sectionTitle: {
    marginTop: '24px',
    marginBottom: '12px',
    fontSize: '16px',
    color: '#ff5000',
    cursor: 'default',
    userSelect: 'none'
  },
  list__anchor: {
    color: '#3B3B3B',
    fontSize: '16px',
    fontWeight: '200',

    ':-webkit-any-link': {
      textDecoration: 'underline',
      cursor: 'auto'
    },

    ':focus': {
      outline: '-webkit-focus-ring-color auto 5px'
    }
  },
  list__ul: {
    marginLeft: '48px',
    display: 'block',
    listStyleType: 'disc',
    WebkitMarginBefore: '1em',
    WebkitMarginAfter: '1em',
    WebkitMarginStart: 0,
    WebkitMarginEnd: 0,
    WebkitPaddingStart: '40px'
  },
  statement__container: {
    background: '#fff',
    color: '#3B3B3B',
    display: 'block',
    fontFamily: 'Arial',
    fontSize: '16px',
    hyphens: 'auto',
    margin: `${containerMargin} 0`,
    overflowX: 'hidden',
    padding: '10px',
    position: 'relative',
    WebkitFontSmoothing: 'antialiased',
    WebkitPrintColorAdjust: 'exact',
    userSelect: 'none',
    width: '805px'
  }
})

module.exports = <ContributionStatement />
