/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

// Note that these are webpack requires, not CommonJS node requiring requires
const React = require('react')
const ReactDOMServer = require('react-dom/server')
const ImmutableComponent = require('../components/immutableComponent')
const Immutable = require('immutable')
const SwitchControl = require('../components/switchControl')
const ModalOverlay = require('../components/modalOverlay')
const cx = require('../lib/classSet')
const ledgerExportUtil = require('../lib/ledgerExportUtil')
const transactionsToCSVDataURL = ledgerExportUtil.transactionsToCSVDataURL
const getTransactionCSVRows = ledgerExportUtil.getTransactionCSVRows
const addExportFilenamePrefixToTransactions = ledgerExportUtil.addExportFilenamePrefixToTransactions
const {getZoomValuePercentage} = require('../lib/zoom')
const config = require('../constants/config')
const appConfig = require('../constants/appConfig')
const preferenceTabs = require('../constants/preferenceTabs')
const messages = require('../constants/messages')
const settings = require('../constants/settings')
const coinbaseCountries = require('../constants/coinbaseCountries')
const {passwordManagers, extensionIds} = require('../constants/passwordManagers')
const {startsWithOption, newTabMode, bookmarksToolbarMode} = require('../../app/common/constants/settingsEnums')
const {l10nErrorText} = require('../../app/common/lib/httpUtil')

const WidevineInfo = require('../../app/renderer/components/widevineInfo')
const aboutActions = require('./aboutActions')
const getSetting = require('../settings').getSetting
const SortableTable = require('../components/sortableTable')
const Button = require('../components/button')
const searchProviders = require('../data/searchProviders')
const punycode = require('punycode')
const moment = require('moment')
moment.locale(navigator.language)

const adblock = appConfig.resourceNames.ADBLOCK
const cookieblock = appConfig.resourceNames.COOKIEBLOCK
const adInsertion = appConfig.resourceNames.AD_INSERTION
const trackingProtection = appConfig.resourceNames.TRACKING_PROTECTION
const httpsEverywhere = appConfig.resourceNames.HTTPS_EVERYWHERE
const safeBrowsing = appConfig.resourceNames.SAFE_BROWSING
const noScript = appConfig.resourceNames.NOSCRIPT
const flash = appConfig.resourceNames.FLASH
const widevine = appConfig.resourceNames.WIDEVINE

const isDarwin = navigator.platform === 'MacIntel'
const isWindows = navigator.platform && navigator.platform.includes('Win')

const ipc = window.chrome.ipc

// TODO: Determine this from the l20n file automatically
const hintCount = 3

// Stylesheets

require('../../less/switchControls.less')
require('../../less/about/preferences.less')
require('../../less/forms.less')
require('../../less/button.less')
require('../../node_modules/font-awesome/css/font-awesome.css')

const permissionNames = {
  'mediaPermission': ['boolean'],
  'geolocationPermission': ['boolean'],
  'notificationsPermission': ['boolean'],
  'midiSysexPermission': ['boolean'],
  'pointerLockPermission': ['boolean'],
  'fullscreenPermission': ['boolean'],
  'openExternalPermission': ['boolean'],
  'protocolRegistrationPermission': ['boolean'],
  'flash': ['boolean', 'number'],
  'widevine': ['boolean', 'number']
}

const braveryPermissionNames = {
  'ledgerPaymentsShown': ['boolean', 'number'],
  'shieldsUp': ['boolean'],
  'adControl': ['string'],
  'cookieControl': ['string'],
  'safeBrowsing': ['boolean'],
  'httpsEverywhere': ['boolean'],
  'fingerprintingProtection': ['boolean'],
  'noScript': ['boolean', 'number']
}

const changeSetting = (cb, key, e) => {
  if (e.target.type === 'checkbox') {
    cb(key, e.target.value)
  } else {
    let value = e.target.value
    if (e.target.dataset && e.target.dataset.type === 'number') {
      value = parseInt(value, 10)
    } else if (e.target.dataset && e.target.dataset.type === 'float') {
      value = parseFloat(value)
    }
    if (e.target.type === 'number') {
      value = value.replace(/\D/g, '')
      value = parseInt(value, 10)
      if (Number.isNaN(value)) {
        return
      }
      value = Math.min(e.target.getAttribute('max'), Math.max(value, e.target.getAttribute('min')))
    }
    cb(key, value)
  }
}

class SettingsList extends ImmutableComponent {
  render () {
    return <div className='settingsListContainer'>
      {
        this.props.dataL10nId
        ? <div className='settingsListTitle' data-l10n-id={this.props.dataL10nId} />
        : null
      }
      <div className='settingsList'>
        {this.props.children}
      </div>
    </div>
  }
}

class SettingItem extends ImmutableComponent {
  render () {
    return <div className='settingItem'>
      {
        this.props.dataL10nId
          ? <span data-l10n-id={this.props.dataL10nId} />
          : null
      }
      {this.props.children}
    </div>
  }
}

class SettingCheckbox extends ImmutableComponent {
  constructor () {
    super()
    this.onClick = this.onClick.bind(this)
  }

  onClick (e) {
    if (this.props.disabled) {
      return
    }
    return this.props.onChange ? this.props.onChange(e) : changeSetting(this.props.onChangeSetting, this.props.prefKey, e)
  }

  render () {
    const props = {
      style: this.props.style,
      className: 'settingItem'
    }
    if (this.props.id) {
      props.id = this.props.id
    }
    return <div {...props}>
      <SwitchControl id={this.props.prefKey}
        disabled={this.props.disabled}
        onClick={this.onClick}
        checkedOn={this.props.checked !== undefined ? this.props.checked : getSetting(this.props.prefKey, this.props.settings)} />
      <label data-l10n-id={this.props.dataL10nId} htmlFor={this.props.prefKey} />
      {this.props.options}
    </div>
  }
}

class SiteSettingCheckbox extends ImmutableComponent {
  constructor () {
    super()
    this.onClick = this.onClick.bind(this)
  }

  onClick (e) {
    if (this.props.disabled || !this.props.hostPattern) {
      return
    } else {
      const value = !!e.target.value
      value === this.props.defaultValue
        ? aboutActions.removeSiteSetting(this.props.hostPattern,
            this.props.prefKey)
        : aboutActions.changeSiteSetting(this.props.hostPattern,
            this.props.prefKey, value)
    }
  }

  render () {
    return <div style={this.props.style} className='settingItem siteSettingItem'>
      <SwitchControl
        disabled={this.props.disabled}
        onClick={this.onClick}
        checkedOn={this.props.checked} />
    </div>
  }
}

class LedgerTable extends ImmutableComponent {
  get synopsis () {
    return this.props.ledgerData.get('synopsis')
  }

  getFormattedTime (synopsis) {
    var d = synopsis.get('daysSpent')
    var h = synopsis.get('hoursSpent')
    var m = synopsis.get('minutesSpent')
    var s = synopsis.get('secondsSpent')
    if (d << 0 > 364) {
      return '>1y'
    }
    d = (d << 0 === 0) ? '' : (d + 'd ')
    h = (h << 0 === 0) ? '' : (h + 'h ')
    m = (m << 0 === 0) ? '' : (m + 'm ')
    s = (s << 0 === 0) ? '' : (s + 's ')
    return (d + h + m + s + '')
  }

  getHostPattern (synopsis) {
    return `https?://${synopsis.get('site')}`
  }

  getVerifiedIcon (synopsis) {
    return <span className='verified' />
  }

  enabledForSite (synopsis) {
    const hostSettings = this.props.siteSettings.get(this.getHostPattern(synopsis))
    if (hostSettings) {
      const result = hostSettings.get('ledgerPayments')
      if (typeof result === 'boolean') {
        return result
      }
    }
    return true
  }

  shouldShow (synopsis) {
    const hostSettings = this.props.siteSettings.get(this.getHostPattern(synopsis))
    if (hostSettings) {
      const result = hostSettings.get('ledgerPaymentsShown')
      if (typeof result === 'boolean') {
        return result
      }
    }
    return true
  }

  getRow (synopsis) {
    if (!synopsis || !synopsis.get || !this.shouldShow(synopsis)) {
      return []
    }
    const faviconURL = synopsis.get('faviconURL')
    const rank = synopsis.get('rank')
    const views = synopsis.get('views')
    const verified = synopsis.get('verified')
    const duration = synopsis.get('duration')
    const publisherURL = synopsis.get('publisherURL')
    const percentage = synopsis.get('percentage')
    const site = synopsis.get('site')
    const defaultSiteSetting = true

    return [
      rank,
      {
        html: <a href={publisherURL} target='_blank'>{verified ? this.getVerifiedIcon() : null}{faviconURL ? <img src={faviconURL} alt={site} /> : <span className='fa fa-file-o' />}<span>{site}</span></a>,
        value: site
      },
      {
        html: <SiteSettingCheckbox hostPattern={this.getHostPattern(synopsis)} defaultValue={defaultSiteSetting} prefKey='ledgerPayments' siteSettings={this.props.siteSettings} checked={this.enabledForSite(synopsis)} />,
        value: this.enabledForSite(synopsis) ? 1 : 0
      },
      views,
      {
        html: this.getFormattedTime(synopsis),
        value: duration
      },
      percentage
    ]
  }

  render () {
    if (!this.synopsis || !this.synopsis.size) {
      return null
    }
    return <div id='ledgerTable'>
      <SortableTable
        headings={['rank', 'publisher', 'include', 'views', 'timeSpent', 'percentage']}
        defaultHeading='rank'
        overrideDefaultStyle
        columnClassNames={['alignRight', '', '', 'alignRight', 'alignRight', 'alignRight']}
        rowClassNames={
          this.synopsis.map((item) =>
            this.enabledForSite(item) ? '' : 'paymentsDisabled').toJS()
        }
        onContextMenu={aboutActions.contextMenu}
        contextMenuName='synopsis'
        rowObjects={this.synopsis.map((entry) => {
          return {
            hostPattern: this.getHostPattern(entry),
            location: entry.get('publisherURL')
          }
        }).toJS()}
        rows={this.synopsis.map((synopsis) => this.getRow(synopsis)).toJS()} />
    </div>
  }
}

class BitcoinDashboard extends ImmutableComponent {
  constructor () {
    super()
    this.buyCompleted = false
    this.openBuyURLTab = this.openBuyURLTab.bind(this)
  }
  openBuyURLTab () {
    // close parent dialog
    this.props.hideParentOverlay()
    // open the new buyURL frame
    aboutActions.newFrame({ location: this.ledgerData.get('buyURL') }, true)
  }
  get ledgerData () {
    return this.props.ledgerData
  }
  get bitcoinOverlayContent () {
    return <iframe src={this.ledgerData.get('buyURL')} />
  }
  get bitcoinPurchaseButton () {
    if (!this.ledgerData.get('buyURLFrame')) return <Button l10nId='add' className='primaryButton' onClick={this.props.showOverlay.bind(this)} />
// should also do this.props.hideParentalOverlay
    return <Button l10nId='add' className='primaryButton' onClick={this.openBuyURLTab} />
  }
  get qrcodeOverlayContent () {
    return <div>
      <img src={this.ledgerData.get('paymentIMG')} title='Brave wallet QR code' />
      <div className='bitcoinQRTitle' data-l10n-id='bitcoinQR' />
    </div>
  }
  get qrcodeOverlayFooter () {
    if (coinbaseCountries.indexOf(this.props.ledgerData.get('countryCode')) > -1) {
      return <div>
        <div id='coinbaseLogo' />
        <a href='https://itunes.apple.com/us/app/coinbase-bitcoin-wallet/id886427730?mt=8' target='_blank' id='appstoreLogo' />
        <a href='https://play.google.com/store/apps/details?id=com.coinbase.android' target='_blank' id='playstoreLogo' />
      </div>
    } else {
      return null
    }
  }
  get currency () {
    return this.props.ledgerData.get('currency') || 'USD'
  }
  get amount () {
    return getSetting(settings.PAYMENTS_CONTRIBUTION_AMOUNT, this.props.settings) || 0
  }
  get canUseCoinbase () {
    if (!this.props.ledgerData.get('buyMaximumUSD')) return true

    return this.currency === 'USD' && this.amount < this.props.ledgerData.get('buyMaximumUSD')
  }
  get userInAmerica () {
    const countryCode = this.props.ledgerData.get('countryCode')
    return !(countryCode && countryCode !== 'US')
  }
  get worldWidePanel () {
    return <div className='panel'>
      <div className='settingsPanelDivider'>
        <span className='fa fa-credit-card' />
        <div className='settingsListTitle' data-l10n-id='outsideUSAPayment' />
      </div>
      <div className='settingsPanelDivider'>
        <a target='_blank' className='browserButton primaryButton' href='https://www.buybitcoinworldwide.com/'>
          buybitcoinworldwide.com
        </a>
      </div>
    </div>
  }
  get coinbasePanel () {
    if (this.canUseCoinbase) {
      return <div className='panel'>
        <div className='settingsPanelDivider'>
          <span className='fa fa-credit-card' />
          <div className='settingsListTitle' data-l10n-id='moneyAdd' />
          <div className='settingsListSubTitle' data-l10n-id='moneyAddSubTitle' />
        </div>
        <div className='settingsPanelDivider'>
          {this.bitcoinPurchaseButton}
          <div className='settingsListSubTitle' data-l10n-id='transferTime' />
        </div>
      </div>
    } else {
      return <div className='panel disabledPanel'>
        <div className='settingsPanelDivider'>
          <span className='fa fa-credit-card' />
          <div className='settingsListTitle' data-l10n-id='moneyAdd' />
          <div className='settingsListSubTitle' data-l10n-id='moneyAddSubTitle' />
        </div>
        <div className='settingsPanelDivider'>
          <div data-l10n-id='coinbaseNotAvailable' />
        </div>
      </div>
    }
  }
  get exchangePanel () {
    const url = this.props.ledgerData.getIn(['exchangeInfo', 'exchangeURL'])
    const name = this.props.ledgerData.getIn(['exchangeInfo', 'exchangeName'])
    // Call worldWidePanel if we don't have the URL or Name
    if (!url || !name) {
      return this.worldWidePanel
    } else {
      return <div className='panel'>
        <div className='settingsPanelDivider'>
          <span className='fa fa-credit-card' />
          <div className='settingsListTitle' data-l10n-id='outsideUSAPayment' />
        </div>
        <div className='settingsPanelDivider'>
          <a target='_blank' className='browserButton primaryButton' href={url}>
            {name}
          </a>
        </div>
      </div>
    }
  }
  get smartphonePanel () {
    return <div className='panel'>
      <div className='settingsPanelDivider'>
        <span className='fa fa-mobile' />
        <div className='settingsListTitle' data-l10n-id='smartphoneTitle' />
      </div>
      <div className='settingsPanelDivider'>
        <Button l10nId='displayQRCode' className='primaryButton' onClick={this.props.showQRcode.bind(this)} />
      </div>
    </div>
  }
  get panelFooter () {
    if (this.ledgerData.get('buyURLFrame')) {
      return <div className='panelFooter'>
        <Button l10nId='done' className='pull-right whiteButton' onClick={this.props.hideParentOverlay} />
      </div>
    } else if (coinbaseCountries.indexOf(this.props.ledgerData.get('countryCode')) > -1) {
      return <div className='panelFooter'>
        <div id='coinbaseLogo' />
        <span className='coinbaseMessage' data-l10n-id='coinbaseMessage' />
        <Button l10nId='done' className='pull-right whiteButton' onClick={this.props.hideParentOverlay} />
      </div>
    } else {
      return null
    }
  }
  copyToClipboard (text) {
    aboutActions.setClipboard(text)
  }
  onMessage (e) {
    if (!e.data || e.origin !== config.coinbaseOrigin) {
      return
    }
    if (e.data.event === 'modal_closed') {
      if (this.buyCompleted) {
        this.props.hideParentOverlay()
        this.buyCompleted = false
      } else {
        this.props.hideOverlay()
      }
    } else if (e.data.event === 'buy_completed') {
      this.buyCompleted = true
    }
  }
  render () {
    window.addEventListener('message', this.onMessage.bind(this), false)
    var emptyDialog = true
    return <div id='bitcoinDashboard'>
      {
      this.props.bitcoinOverlayVisible
        ? <ModalOverlay title={'bitcoinBuy'} content={this.bitcoinOverlayContent} customTitleClasses={'coinbaseOverlay'} emptyDialog={emptyDialog} onHide={this.props.hideOverlay.bind(this)} />
        : null
      }
      {
        this.props.qrcodeOverlayVisible
        ? <ModalOverlay content={this.qrcodeOverlayContent} customTitleClasses={'qrcodeOverlay'} footer={this.qrcodeOverlayFooter} onHide={this.props.hideQRcode.bind(this)} />
        : null
      }
      <div className='board'>
        {
          this.userInAmerica
          ? this.coinbasePanel
          : this.exchangePanel
        }
        <div className='panel'>
          <div className='settingsPanelDivider'>
            <span className='bitcoinIcon fa-stack fa-lg'>
              <span className='fa fa-circle fa-stack-2x' />
              <span className='fa fa-bitcoin fa-stack-1x' />
            </span>
            <div className='settingsListTitle' data-l10n-id='bitcoinAdd' />
            <div className='settingsListSubTitle' data-l10n-id='bitcoinAddDescription' />
          </div>
          {
            this.ledgerData.get('address')
              ? <div className='settingsPanelDivider'>
                {
                  this.ledgerData.get('hasBitcoinHandler') && this.ledgerData.get('paymentURL')
                    ? <div>
                      <a href={this.ledgerData.get('paymentURL')} target='_blank'>
                        <Button l10nId='bitcoinVisitAccount' className='primaryButton' />
                      </a>
                      <div data-l10n-id='bitcoinAddress' className='labelText' />
                    </div>
                    : <div>
                      <div data-l10n-id='bitcoinPaymentURL' className='labelText' />
                    </div>
                }
                <span className='smallText'>{this.ledgerData.get('address')}</span>
                <Button className='primaryButton' l10nId='copyToClipboard' onClick={this.copyToClipboard.bind(this, this.ledgerData.get('address'))} />
              </div>
            : <div className='settingsPanelDivider'>
              <div data-l10n-id='bitcoinWalletNotAvailable' />
            </div>
          }
        </div>
        {this.smartphonePanel}
        {this.panelFooter}
      </div>
    </div>
  }
}

class PaymentHistory extends ImmutableComponent {
  get ledgerData () {
    return this.props.ledgerData
  }

  render () {
    const transactions = Immutable.fromJS(
        addExportFilenamePrefixToTransactions(this.props.ledgerData.get('transactions').toJS())
    )

    return <div id='paymentHistory'>
      <table className='sort'>
        <thead>
          <tr>
            <th className='sort-header' data-l10n-id='date' />
            <th className='sort-header' data-l10n-id='totalAmount' />
            <th className='sort-header' data-l10n-id='receiptLink' />
          </tr>
        </thead>
        <tbody>
          {
            transactions.map(function (row) {
              return <PaymentHistoryRow transaction={row} ledgerData={this.props.ledgerData} />
            }.bind(this))
          }
        </tbody>
      </table>
    </div>
  }
}

class PaymentHistoryRow extends ImmutableComponent {

  get transaction () {
    return this.props.transaction
  }

  get timestamp () {
    return this.transaction.get('submissionStamp')
  }

  get formattedDate () {
    return formattedDateFromTimestamp(this.timestamp)
  }

  get ledgerData () {
    return this.props.ledgerData
  }

  get satoshis () {
    return this.transaction.getIn(['contribution', 'satoshis'])
  }

  get currency () {
    return this.transaction.getIn(['contribution', 'fiat', 'currency'])
  }

  get totalAmount () {
    var fiatAmount = this.transaction.getIn(['contribution', 'fiat', 'amount'])
    return (fiatAmount && typeof fiatAmount === 'number' ? fiatAmount.toFixed(2) : '0.00')
  }

  get viewingId () {
    return this.transaction.get('viewingId')
  }

  get receiptFileName () {
    return `${this.transaction.get('exportFilenamePrefix')}.pdf`
  }

  get htmlDataURL () {
    let dataURL = 'data:text/html,' + encodeURIComponent('<html><head><meta charset="UTF-8" /></head><body style="-webkit-print-color-adjust:exact">' + ReactDOMServer.renderToStaticMarkup(<ContributionStatement transaction={this.transaction} synopsis={this.ledgerData.get('synopsis')} />) + '</body></html>')
    return dataURL
  }

  get csvDataURL () {
    return transactionsToCSVDataURL(this.transaction.toJS())
  }

  renderPdf () {
    aboutActions.renderUrlToPdf(this.htmlDataURL, this.receiptFileName)
  }

  render () {
    var date = this.formattedDate
    var totalAmountStr = `${this.totalAmount} ${this.currency}`

    return <tr>
      <td className='narrow' data-sort={this.timestamp}>{date}</td>
      <td className='wide' data-sort={this.satoshis}>{totalAmountStr}</td>
      <td className='wide'><a onClick={this.renderPdf.bind(this)}>{this.receiptFileName}</a></td>
    </tr>
  }
}

class ContributionStatement extends ImmutableComponent {
  componentWillMount () {
    let synopsis = this.synopsis

    let publisherMap = {}

    synopsis.forEach((synopsisRow) => {
      publisherMap[synopsisRow.get('publisherURL')] = synopsisRow.toJS()
    })

    this.setState({
      publisherSynopsisMap: publisherMap
    })
  }

  get transaction () {
    return this.props.transaction
  }

  get synopsis () {
    return this.props.synopsis
  }

  get publisherSynopsisMap () {
    return this.state.publisherSynopsisMap
  }

  get timestamp () {
    return this.transaction.get('submissionStamp')
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
          <span className='sectionTitle'>Brave Payments</span>
          <span className='sectionSubTitle'>beta</span>
        </div>
        <div className='sectionTitleWrapper pull-right'>
          <span className='sectionTitle smaller pull-right'>Contribution Statement</span>
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
            <tr><td className='leftColumn'>Contribution Date</td><td className='rightColumn'>{this.contributionDate}</td></tr>
            <tr><td className='leftColumn'>Contribution Time</td><td className='rightColumn'>{this.contributionTime}</td></tr>
            <tr><td className='leftColumn'>Contribution Amount</td><td className='rightColumn'>{this.contributionAmount}</td></tr>
          </tbody>
        </table>
      </div>
    )
  }

  get lastContributionHumanFormattedDate () {
    return ''
  }

  get thisContributionHumanFormattedDate () {
    return ''
  }

  get rows () {
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
        <div className='pull-right'>{ this.lastContributionHumanFormattedDate } - { this.contributionHumanFormattedDate }</div>
        <div>
          <table className='contributionStatementDetailTable'>
            <tbody>
              <tr className='headingRow detailTableRow'>
                <td className='rankColumn'>Rank</td>
                <td className='siteColumn'>Site</td>
                <td className='fractionColumn'>% Paid</td>
                <td className='fiatColumn'>$ Paid</td>
              </tr>
              <tr className='spacingRow' />
              {
              page.map(function (row, idx) {
                let publisherSynopsis = this.synopsis[row.siteColumn] || {}

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
          <div className='verifiedExplainer'><span className='verified' /> = publisher has verified their wallet</div>
          <div className='pageIndicator pull-right'>Page {pageIdx + 1} of {totalPages}</div>
        </div>
      </div>
    )
  }

  ContributionStatementFooterNoteBox (pageIdx) {
    const headings = [
      'Note:',
      'About publisher distributions'
    ]

    const messages = [
      'To protect your privacy, this Brave Payments contribution statement is not saved, recorded or logged anywhere other than on your device (this computer). It cannot be retrieved from Brave in the event of data loss on your device.',
      'Brave Payments uses a statistical model that removes any ability to identify Brave users based on their browsing behaviors. Anonymous contributions are first combined in the Brave vault and then redistributed into publisher wallets which are confirmed and then collected by the publisher.'
    ]

    return (
      <div className='footerNoteBox'>
        <span className='noteHeading'>
          { headings[pageIdx % headings.length] }
        </span>
        <br />
        <span className='noteBody'>
          { messages[pageIdx % messages.length] }
        </span>
      </div>
    )
  }

  get ContributionStatementPageFooter () {
    return (
      <div className='pageFooterBox'>
        <span className='pageFooterBody'>{"\u00a9 2016 Brave Software. Brave is a registered trademark of Brave Software. Site names may be trademarks or registered trademarks of the site owner."}</span>
      </div>
    )
  }

  ContributionStatementPage (page, pageIdx, pages) {
    let totalPages = pages.length
    return [
      <div className='contributionStatementSection'>
        {this.ContributionStatementHeader}
      </div>,
      pageIdx ? null
        : (
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
  }

  get staticStyles () {
    /** since the ContributionStatement is rendered into a PDF from a self-contained data URL, we have to hardcode all the requisite CSS like this **/
    return (
      <style dangerouslySetInnerHTML={{__html: '\n\
* {\n\
  color: #3B3B3B;\n\
  font-family: Arial;\n\
  margin: 0;\n\
  padding: 0;\n\
}\n\
.contributionStatementContainer {\n\
  position: relative;\n\
  width: 805px;\n\
  overflow-x: hidden;\n\
  display: block;\n\
  background-color: #ffffff;\n\
  padding: 10px;\n\
}\n\
.contributionStatementSection {\n\
  margin: 0;\n\
  padding: 0;\n\
  clear: left;\n\
}\n\
.sectionTitleWrapper .sectionTitle {\n\
  color: #3B3B3B;\n\
  font-size: 28px;\n\
}\n\
.sectionTitleWrapper #braveLogo + span.sectionTitle {\n\
  display: inline-block;\n\
  vertical-align: middle;\n\
  top: -20px;\n\
  left: 5px;\n\
  position: relative;\n\
}\n\
.sectionTitleWrapper .sectionSubTitle {\n\
  color: #ff5000;\n\
  font-size: 15px;\n\
  top: -35px;\n\
  right: 5px;\n\
  position: relative;\n\
}\n\
.sectionTitleWrapper.pull-right {\n\
  margin-top: 15px;\n\
}\n\
.sectionTitleWrapper .sectionTitle.smaller {\n\
  white-space: nowrap;\n\
}\n\
.contributionStatementDetailTableContainer {\n\
  margin-top: 25px;\n\
  margin-bottom: 25px;\n\
}\n\
.contributionStatementDetailTable {\n\
  width: 100%;\n\
  border-width: 5px;\n\
  border-style: solid;\n\
  border-color: #f7f7f7;\n\
}\n\
.contributionStatementDetailTable tbody tr.spacingRow:before {\n\
  line-height: 0.5em;\n\
  content: "_";\n\
  display: block;\n\
  color: white;\n\
}\n\
.contributionStatementDetailTable tr.headingRow.detailTableRow, .contributionStatementDetailTable tbody tr.detailTableRow {\n\
  text-align: right;\n\
}\n\
.contributionStatementDetailTable tr.headingRow.detailTableRow {\n\
  background-color: #f7f7f7;\n\
}\n\
.detailTableRow tr.headingRow td.rankColumn, .detailTableRow td.rankColumn {\n\
  width: 30px;\n\
}\n\
.detailTableRow tr.headingRow td.siteColumn, .detailTableRow td.siteColumn {\n\
  text-align: left;\n\
  padding-left: 40px;\n\
}\n\
.contributionStatementSummaryBox {\n\
  margin-top: 25px;\n\
  margin-bottom: 25px;\n\
}\n\
table.contributionStatementSummaryBoxTable {\n\
  border-spacing: 10px;\n\
}\n\
.contributionStatementSummaryBoxTable tbody tr td.leftColumn {\n\
  text-align: right;\n\
  padding: 10px;\n\
  margin: 10px;\n\
  background-color: #f7f7f7;\n\
}\n\
.contributionStatementSummaryBoxTable tbody tr td.rightColumn {\n\
  text-align: center;\n\
  padding: 10px;\n\
  margin: 10px;\n\
  border-style: solid;\n\
  border-width: 3px;\n\
  border-color: #e7e7e7;\n\
  font-weight: bold;\n\
}\n\
.contributionStatementHeader {\n\
  margin-top: 25px;\n\
  margin-bottom: 25px;\n\
  width: 100%;\n\
}\n\
.pull-left {\n\
  float: left;\n\
}\n\
.pull-right {\n\
  float: right;\n\
}\n\
      #braveLogo {\n\
background: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAD0AAABICAYAAABFjf2bAAAACXBIWXMAAAsTAAALEwEAmpwYAAA7lGlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4KPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNS42LWMxMTEgNzkuMTU4MzI1LCAyMDE1LzA5LzEwLTAxOjEwOjIwICAgICAgICAiPgogICA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPgogICAgICA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIgogICAgICAgICAgICB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIKICAgICAgICAgICAgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiCiAgICAgICAgICAgIHhtbG5zOnN0RXZ0PSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VFdmVudCMiCiAgICAgICAgICAgIHhtbG5zOnhtcD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wLyIKICAgICAgICAgICAgeG1sbnM6ZGM9Imh0dHA6Ly9wdXJsLm9yZy9kYy9lbGVtZW50cy8xLjEvIgogICAgICAgICAgICB4bWxuczpwaG90b3Nob3A9Imh0dHA6Ly9ucy5hZG9iZS5jb20vcGhvdG9zaG9wLzEuMC8iCiAgICAgICAgICAgIHhtbG5zOnRpZmY9Imh0dHA6Ly9ucy5hZG9iZS5jb20vdGlmZi8xLjAvIgogICAgICAgICAgICB4bWxuczpleGlmPSJodHRwOi8vbnMuYWRvYmUuY29tL2V4aWYvMS4wLyI+CiAgICAgICAgIDx4bXBNTTpEb2N1bWVudElEPmFkb2JlOmRvY2lkOnBob3Rvc2hvcDpjNGIzNDYyNi01ZGE2LTExNzktOGI5Ny04N2NjOWE1MjlkZjE8L3htcE1NOkRvY3VtZW50SUQ+CiAgICAgICAgIDx4bXBNTTpJbnN0YW5jZUlEPnhtcC5paWQ6NDZjYTg0ZTktNjA0Yy00YjUzLTk1NzktZTBlOTk5YzUwZTIyPC94bXBNTTpJbnN0YW5jZUlEPgogICAgICAgICA8eG1wTU06RGVyaXZlZEZyb20gcmRmOnBhcnNlVHlwZT0iUmVzb3VyY2UiPgogICAgICAgICAgICA8c3RSZWY6aW5zdGFuY2VJRD5hZG9iZTpkb2NpZDpwaG90b3Nob3A6ZDZjZjFlNjQtMDM5MC0xMTc5LTkwYzItYTg4ZWRjMTExZDM1PC9zdFJlZjppbnN0YW5jZUlEPgogICAgICAgICAgICA8c3RSZWY6ZG9jdW1lbnRJRD5hZG9iZTpkb2NpZDpwaG90b3Nob3A6ZDZjZjFlNjQtMDM5MC0xMTc5LTkwYzItYTg4ZWRjMTExZDM1PC9zdFJlZjpkb2N1bWVudElEPgogICAgICAgICA8L3htcE1NOkRlcml2ZWRGcm9tPgogICAgICAgICA8eG1wTU06T3JpZ2luYWxEb2N1bWVudElEPnhtcC5kaWQ6ODFGRjFENjNCQzEyMTFFNTkzN0JFRDI2NEE0RTU0REI8L3htcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD4KICAgICAgICAgPHhtcE1NOkhpc3Rvcnk+CiAgICAgICAgICAgIDxyZGY6U2VxPgogICAgICAgICAgICAgICA8cmRmOmxpIHJkZjpwYXJzZVR5cGU9IlJlc291cmNlIj4KICAgICAgICAgICAgICAgICAgPHN0RXZ0OmFjdGlvbj5zYXZlZDwvc3RFdnQ6YWN0aW9uPgogICAgICAgICAgICAgICAgICA8c3RFdnQ6aW5zdGFuY2VJRD54bXAuaWlkOmFhYmE3NjNjLTBmMGQtNGNhMC04NWJiLTVlOWYwYzM5M2EwOTwvc3RFdnQ6aW5zdGFuY2VJRD4KICAgICAgICAgICAgICAgICAgPHN0RXZ0OndoZW4+MjAxNi0wNS0xOVQxODo1MDowNi0wNzowMDwvc3RFdnQ6d2hlbj4KICAgICAgICAgICAgICAgICAgPHN0RXZ0OnNvZnR3YXJlQWdlbnQ+QWRvYmUgUGhvdG9zaG9wIENDIDIwMTUgKE1hY2ludG9zaCk8L3N0RXZ0OnNvZnR3YXJlQWdlbnQ+CiAgICAgICAgICAgICAgICAgIDxzdEV2dDpjaGFuZ2VkPi88L3N0RXZ0OmNoYW5nZWQ+CiAgICAgICAgICAgICAgIDwvcmRmOmxpPgogICAgICAgICAgICAgICA8cmRmOmxpIHJkZjpwYXJzZVR5cGU9IlJlc291cmNlIj4KICAgICAgICAgICAgICAgICAgPHN0RXZ0OmFjdGlvbj5zYXZlZDwvc3RFdnQ6YWN0aW9uPgogICAgICAgICAgICAgICAgICA8c3RFdnQ6aW5zdGFuY2VJRD54bXAuaWlkOjQ2Y2E4NGU5LTYwNGMtNGI1My05NTc5LWUwZTk5OWM1MGUyMjwvc3RFdnQ6aW5zdGFuY2VJRD4KICAgICAgICAgICAgICAgICAgPHN0RXZ0OndoZW4+MjAxNi0wNS0xOVQxODo1MDowNi0wNzowMDwvc3RFdnQ6d2hlbj4KICAgICAgICAgICAgICAgICAgPHN0RXZ0OnNvZnR3YXJlQWdlbnQ+QWRvYmUgUGhvdG9zaG9wIENDIDIwMTUgKE1hY2ludG9zaCk8L3N0RXZ0OnNvZnR3YXJlQWdlbnQ+CiAgICAgICAgICAgICAgICAgIDxzdEV2dDpjaGFuZ2VkPi88L3N0RXZ0OmNoYW5nZWQ+CiAgICAgICAgICAgICAgIDwvcmRmOmxpPgogICAgICAgICAgICA8L3JkZjpTZXE+CiAgICAgICAgIDwveG1wTU06SGlzdG9yeT4KICAgICAgICAgPHhtcDpDcmVhdG9yVG9vbD5BZG9iZSBQaG90b3Nob3AgQ0MgMjAxNSAoTWFjaW50b3NoKTwveG1wOkNyZWF0b3JUb29sPgogICAgICAgICA8eG1wOkNyZWF0ZURhdGU+MjAxNi0wMS0yNlQyMToyNjoyOC0wODowMDwveG1wOkNyZWF0ZURhdGU+CiAgICAgICAgIDx4bXA6TW9kaWZ5RGF0ZT4yMDE2LTA1LTE5VDE4OjUwOjA2LTA3OjAwPC94bXA6TW9kaWZ5RGF0ZT4KICAgICAgICAgPHhtcDpNZXRhZGF0YURhdGU+MjAxNi0wNS0xOVQxODo1MDowNi0wNzowMDwveG1wOk1ldGFkYXRhRGF0ZT4KICAgICAgICAgPGRjOmZvcm1hdD5pbWFnZS9wbmc8L2RjOmZvcm1hdD4KICAgICAgICAgPHBob3Rvc2hvcDpDb2xvck1vZGU+MzwvcGhvdG9zaG9wOkNvbG9yTW9kZT4KICAgICAgICAgPHRpZmY6T3JpZW50YXRpb24+MTwvdGlmZjpPcmllbnRhdGlvbj4KICAgICAgICAgPHRpZmY6WFJlc29sdXRpb24+NzIwMDAwLzEwMDAwPC90aWZmOlhSZXNvbHV0aW9uPgogICAgICAgICA8dGlmZjpZUmVzb2x1dGlvbj43MjAwMDAvMTAwMDA8L3RpZmY6WVJlc29sdXRpb24+CiAgICAgICAgIDx0aWZmOlJlc29sdXRpb25Vbml0PjI8L3RpZmY6UmVzb2x1dGlvblVuaXQ+CiAgICAgICAgIDxleGlmOkNvbG9yU3BhY2U+NjU1MzU8L2V4aWY6Q29sb3JTcGFjZT4KICAgICAgICAgPGV4aWY6UGl4ZWxYRGltZW5zaW9uPjYxPC9leGlmOlBpeGVsWERpbWVuc2lvbj4KICAgICAgICAgPGV4aWY6UGl4ZWxZRGltZW5zaW9uPjcyPC9leGlmOlBpeGVsWURpbWVuc2lvbj4KICAgICAgPC9yZGY6RGVzY3JpcHRpb24+CiAgIDwvcmRmOlJERj4KPC94OnhtcG1ldGE+CiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgCjw/eHBhY2tldCBlbmQ9InciPz7B5c20AAAAIGNIUk0AAHolAACAgwAA+f8AAIDpAAB1MAAA6mAAADqYAAAXb5JfxUYAAET4SURBVHgBAOhEF7sA739JAO9/SQDvf0kA739JAO9/SQDvhUsA8IpMAPGPTgDwl00A75hMAPCWTQDwlU0A8JdNAPChRgDwokUA8aNEAPOqOwD0sDAA97cgBvi6GbL4uRrs+Lka5Pi5Guj4uRrn+Lka5vi5Gun4uRrv+Lka7/i5Gu/4uRrv+Lka7/i5Gu/4uRrv+Lka7/i5Gu/4uRrv+Lka7/i5Guv4uRrm+Lka5/i5Gu/4uhm197cgB/SwMADzqjsA8aREAO+fSQDvnkoA8JZNAPCVTQDwlk0A75lLAPCXTQDxj04A8IpMAO+FSwDvf0kA739JAO9/SQDvf0kA739JAADvf0kA739JAO9/SQDvf0kA739JAO+FSwDwikwA8Y9OAPCXTQDvmEwA8JZNAPCVTQDwl00A8KFGAPCiRQDxo0QA86o7APSwLgD1tCix9bMo//WzKf/1syn/9bMp//WzKf/1syn/9bMp//WzKf/1syn/9bMp//WzKf/1syn/9bMp//WzKf/1syn/9bMp//WzKf/1syn/9bMp//WzKf/1syn/9bMp//WzKP/1tCiz9LAuAPOqOwDxpEQA759JAO+eSgDwlk0A8JVNAPCWTQDvmUsA8JdNAPGPTgDwikwA74VLAO9/SQDvf0kA739JAO9/SQDvf0kAAO9/SQDvf0kA739JAO9/SQDvf0kA74VLAPCKTADxj04A8JdNAO+YTADwlk0A8JVNAPCXTQDwoUYA8KJFAPGjRADzrDkA9K8ynfSuNf/zrTX/8601//OtNf/zrTX/8601//OtNf/zrTX/8601//OtNf/zrTX/8601//OtNf/zrTX/8601//OtNf/zrTX/8601//OtNf/zrTX/8601//OtNf/zrTX/8601//SuNf/0rzKh86w5APGkRADvn0kA755KAPCWTQDwlU0A8JZNAO+ZSwDwl00A8Y9OAPCKTADvhUsA739JAO9/SQDvf0kA739JAO9/SQAA739JAO9/SQDvf0kA739JAO9/SQDvhUsA8IpMAPGPTgDwl00A75hMAPCWTQDwlU0A8JdNAPCiRQDwo0QA8aRCAPKoPofyqD//8qg///KoP//yqD//8qg///KoP//yqD//8qg///KoP//yqD//8qg///KoP//yqD//8qg///KoP//yqD//8qg///KoP//yqD//8qg///KoP//yqD//8qg///KoP//yqD//8qg///KoP//yqD6L8aRCAO+fSADvnkoA8JZNAPCVTQDwlk0A75lLAPCXTQDxj04A8IpMAO+FSwDvf0kA739JAO9/SQDvf0kA739JAADvf0kA739JAO9/SQDvf0kA739JAO+FSwDwikwA8Y9OAPCXTQDvmEwA8JZNAPCVTQDwl00A8J9HAPChRQDwo0V08KJG//CiRv/wokb/8KJG//CiRv/wokb/8KJG//CiRv/wokb/8KJG//CiRv/wokb/8KJG//CiRv/wokb/8KJG//CiRv/wokb/8KJG//CiRv/wokb/8KJG//CiRv/wokb/8KJG//CiRv/wokb/8KJG//CiRv/wokV976FIAO+fSQDwlk0A8JVNAPCWTQDvmUsA8JdNAPGPTgDwikwA74VLAO9/SQDvf0kA739JAO9/SQDvf0kAAO9/SQDvf0kA739JAO9/SQDvf0kA74VLAPCKTADxj04A8JdNAO+YTADwlk0A8JZNAPCWTQDwlkwA75xLYe+dS//vnUv/751L/++dS//vnUv/751L/++dS//vnUv/751L/++dS//vnUv/751L/++dS//vnUv/751L/++dS//vnUv/751L/++dS//vnUv/751L/++dS//vnUv/751L/++dS//vnUv/751L/++dS//vnUv/751L/++dS//vnkpt8JpLAPCWTQDwlk0A8JZNAO+aSwDwl00A8Y9OAPCKTADvhUsA739JAO9/SQDvf0kA739JAO9/SQAA739JAO9/SQDvf0kA739JAO9/SQDvhUsA8IpMAPGQTgDwl00D75hNbfCXTWLwl0068JdNEvCXTVDwmEz/8JhM//CYTP/wmEz/8JhM//CYTP/wmEz/8JhM//CYTP/wmEz/8JhM//CYTP/wmEz/8JhM//CYTP/wmEz/8JhM//CYTP/wmEz/8JhM//CYTP/wmEz/8JhM//CYTP/wmEz/8JhM//CYTP/wmEz/8JhM//CYTP/wmEz/8JhM//CYTP/wlk1f8JdNJfCXTUrwl01w75hMefCXTQbxkE4A8IpMAO+FSwDvf0kA739JAO9/SQDvf0kA739JAADvf0kA739JAO9/SQDvf0kA739JAO+FSwDwikwA8ZFNAPGUTqnxk07/8ZNO//GTTv/xk07m8ZNO//GTTv/xk07/8ZNO//GTTv/xk07/8ZNO//GTTv/xk07/8ZNO//GTTv/xk07/8ZNO//GTTv/xk07/8ZNO//GTTv/xk07/8ZNO//GTTv/xk07/8ZNO//GTTv/xk07/8ZNO//GTTv/xk07/8ZNO//GTTv/xk07/8ZNO//GTTv/xk07/8ZNO//GTTv/xk07z8ZNO//GTTv/xk07/8ZROr/GRTQDwikwA74VLAO9/SQDvf0kA739JAO9/SQDvf0kAAO9/SQDvf0kA739JAO9/SQDvf0kA74VLAPCLTADwjU2h8IxN//CMTf/wjE3/8IxN//CMTf/wjE3/8IxN//CMTf/wjE3/8IxN//CMTf/wjE3/8IxN//CMTf/wjE3/8IxN//CMTf/wjE3/8IxN//CMTf/wjE3/8IxN//CMTf/wjE3/8IxN//CMTf/wjE3/8IxN//CMTf/wjE3/8IxN//CMTf/wjE3/8IxN//CMTf/wjE3/8IxN//CMTf/wjE3/8IxN//CMTf/wjE3/8IxN//CMTf/wjE3/8I1Nq/CLTADvhUsA739JAO9/SQDvf0kA739JAO9/SQAA739JAO9/SQDvf0kA739JAO+ASgDvhksA74hMmu+HTP/vh0z/74dM/++HTP/vh0z/74dM/++HTP/vh0z/74dM/++HTP/vh0z/74dM/++HTP/vh0z/74dM/++HTP/vh0z/74dM/++HTP/vh0z/74dM/++HS//ugUT/7n9A/+6CRP/vh0v/74dM/++HTP/vh0z/74dM/++HTP/vh0z/74dM/++HTP/vh0z/74dM/++HTP/vh0z/74dM/++HTP/vh0z/74dM/++HTP/vh0z/74dM/++HTP/vh0z/74hMou+GSwDvgEoA739JAO9/SQDvf0kA739JAADvgEkA74BJAO+ASQDvgEkA74BKB+6DS5bugkr/7oJK/+6CSv/ugkr/7oJK/+6CSv/ugkr/7oNM/+18Qv/tdTn/7Xc7/+17Qf/uf0f/7oJK/+6CS//ugkr/7oJK/+6CS//ugkv/7n5E/+13O//tczX/7HM1/++ETf/wjVr/74NN/+xzNf/tczX/7Xc7/+5+RP/ugkv/7oJL/+6CSv/ugkr/7oJL/+6CSv/uf0b/7XtA/+13O//tdTj/7XxC/+6DTP/ugkr/7oJK/+6CSv/ugkr/7oJK/+6CSv/ugkr/7oNLo++ASgvvgEkA74BJAO+ASQDvgEkAAPB9SQDwfUkA8H1JAPB9SQDwfUlU8H1J//B9Sf/wfUn/8H1J//B9Sf/wfUn/8H1J//B+Sv/vdD3/8YFO//Sed//yi13/8X5K/+9wN//uaCz/720z/+90Pf/weEL/73I6/+5oLP/wdD3/8oxe//aujf/61ML//eri//7z7//96uL/+tTC//aujP/yjF3/8HQ9/+5oLP/vcjr/8HhB/+90PP/vbTL/7mgs/+9xOf/xf0z/8o1g//Shev/xgU//73Q8//B+Sv/wfUn/8H1J//B9Sf/wfUn/8H1J//B9Sf/wfUn/8H1JU/B9SQDwfUkA8H1JAPB9SQAA8HpHAPB6RwDwekcA8HpHAPB6R0LxeUf/8XlH//F5R//xeUf/8XlH//F5R//xekj/8HM///BuOP/61MT////////6+P/85Nr/+cy5//i5nv/1o4H/8ope//F8S//zjWP/9rKU//vVxf//+vn////////////////////////////////////////6+P/71cX/9rKU//OOY//xfU3/84xg//Wlg//3uqD/+s68//zm3f///Pz///////rUxf/wbzn/8HM+//F6SP/xeUf/8XlH//F5R//xeUf/8XlH//F5R//wekc78HpHAPB6RwDwekcA8HpHAADydkUA8nZFAPJ2RQDydkUA8nZFB/J1ROLydUT/8nVE//J1RP/ydUT/8nZF//JzQf/wYSr/+buj///////////////////////////////////////+9/T//u/q///6+f////////////////////////////////////////////////////////////////////////r5//7w6///+PX///////////////////////////////////////m7o//xYir/8nNB//J2Rf/ydUT/8nVE//J1RP/ydUT/8nVE3vJ2RQLydkUA8nZFAPJ2RQDydkUAAPRwQAD0cEAA9HBAAPRwQAD0cEAF83FA4vNxQP/zcUD/83FA//NxQP/0cUD/8loi//eeff////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////iff//yWiL/9HFA//NxQP/zcUD/83FA//NxQP/zcUDi9HBAB/RwQAD0cEAA9HBAAPRwQAAA9Wo6APVqOgD1ajoA9Wo6APRsPIb0bDz/9Gw8//RsPP/0bDz/9G4+//NbJv/2f1b///f0//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////f0//aAV//zWyb/9G4+//RsPP/0bDz/9Gw8//RsPP/0bDyL9Wo6APVqOgD1ajoA9Wo6AAD1ZzYA9Wc2APVnNgD1Zzch9Gk5+/RpOf/0aTn/9Gk5//RqOv/0Xyz/82Eu//3m3////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////ebf//NiMP/0Xyz/9Go6//RpOf/0aTn/9Gk5//RpOf31Zzck9Wc2APVnNgD1ZzYAAPZmNAD2ZjQA9mY0APVmNa31ZjX/9WY1//VmNf/1Zjb/9WMy//RTHP/7wKz/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////+8Kv//RTHP/1YzL/9WY2//VmNf/1ZjX/9WY1//VmNbL2ZjQA9WY1APVmNQAA92IwAPdiMAD3YjBC9mMx//ZjMf/2YzH/9mMx//djMf/1TRT/+ZFu///////////////////////+8ez/+7CX//mUcv/6lHL/+ZJv//iFXv/4g1z/+pp5//zFs///9vT///////////////////////////////////////////////////////////////////////718v/8xLH/+ph3//iDW//4hF3/+ZBt//mRb//5k2//+6+W//7x7P//////////////////////+ZNw//VNFP/3YzH/9mMx//ZjMf/2YzH/9mMx//diMEf3YC0A92AtAAD4XigA+F8qAPhfLdH4Xy3/+F8t//hfLf/4YS7/91Ia//hhL//+7ef////////////////////////49v/8wa3/+YRd//dRGv/2PAD/9kAD//ZJDv/2SRD/91Md//huP//7nn///dHC//////////////////////////////////////////////////3Qwv/7nX7/+Gw+//dTHP/2ShD/9kkO//ZAA//1PQD/91Ue//mHYP/8xLD///j2////////////////////////7un/+GMx//dRGv/4YS7/+F8t//hfLf/4Xy3/+F8s1vhdKgD4XSkAAPhcIQD4XiRk+F4m//hdJv/4XSb/+F4m//hbI//3Rwj//caz/////////////////////////////////////////////u/q//y/qf/6hVv/+Fge//dFBP/3TQ//904S//dHCf/3Sg3/+YJW//7z7/////////////////////////////7z7v/5gVX/90oM//dICf/3ThL/900P//dFBP/4WSD/+ode//3Brf//8u3////////////////////////////////////////////9ybb/90gJ//hbI//4Xib/+F0m//hdJv/4Xib/+F4ma/hdJAAA+FshEfhbIu34WyH/+Fsh//hbIf/4WyH/90oK//qJX//////////////////////////////////////////////////////////////////93M///KmK//lyP//4UBH/+E0O//hWGv/3QQD//dnL/////////////////////////////dnK//dCAP/4Vxr/+E0O//hQEv/5c0H//KuM//3e0v/////////////////////////////////////////////////////////////////6iF3/90oJ//hbIf/4WyH/+Fsh//hbIf/4WyHx+FsgFAD5WRyR+Vkd//lZHf/5WR3/+Vkd//lVFv/5VRf//t/T//////////////////////////////////////////////////////////////////////////////n3//3Gsv/7cT7/+UQD//pjKv//7+n/////////////////////////////7+n/+mMq//lEA//7cj///ci0///6+P////////////////////////////////////////////////////////////////////////////7e0v/5Vxn/+VQW//lZHf/5WR3/+Vkd//lZHf/5WRyZAPpXF/D6Vxf/+lcX//pXF//6Vxf/+ksG//pxO//////////////////////////////////////////////////////////////////////////////////////////////38//6Vxr/+3Q////////////////////////////////////////7dD//+lca///49P////////////////////////////////////////////////////////////////////////////////////////////t0QP/6SgX/+lcX//pXF//6Vxf/+lcX//pXF/EA+1UPt/tVD//7VQ//+1UP//tVD//7SgD/+28w//////////////////////////////////////////////////////////////////////////////////////////////////yLW//8hVL///////////////////////////////////////yFUv/8jFv/////////////////////////////////////////////////////////////////////////////////////////////////+28w//tKAP/7VQ//+1UP//tVD//7VQ//+1UPtAD8VAN0/FQD//xUA//8VAP//FQD//xRAP/8SgH//8Wn/////////////////////////////////////////////////////////////////////////////////////////////YpS//2rhP///////////////////////////////////////a2F//2JUf/////////////////////////////////////////////////////////////////////////////////////////////Co//8SQD//FEA//xUA//8VAP//FQD//xUA//8VARyAP1TADv9UwD//VMA//1TAP/9UwD//VMA//1IAP/9TAD//9jC///////////////////////////////////////////////////////////////////////////////////w6f/9YhX//97N////////////////////////////////////////39D//WAT///v6P/////////////////////////////////////////////////////////////////////////////////+07v//UkA//1JAP/9UwD//VMA//1TAP/9UwD//VMA//1TADsA/lIAB/5SAOT+UgD//lIA//5SAP/+UgD//lQA//5CAP/+Tgr//9C2/////////////////////////////////////////////////////////////////////////////ql///5dEf///fz////////////////////////////////////////9/P/+XRH//qh8/////////////////////////////////////////////////////////////////////////////86z//5MBv/+QgD//lQA//5SAP/+UgD//lIA//5SAP/+UgDk/lIABgD/UQAA/1EArP9RAP//UQD//1EA//9RAP//UQD//1MA//9BAP//SwT//8Wp////////////////////////////////////////////////////////////////////////XBP//39E//////////////////////////////////////////////////+BRv//WxH////////////////////////////////////////////////////////////////////////Cpf//SQH//0IA//9TAP//UQD//1EA//9RAP//UQD//1EA//9RAKz/UQAAAP9QAAD/UABn/1AA//9QAP//UAD//1AA//9QAP//UQD//1IA//9DAP//PwD//76d/////////////////////////////////////////////////////////////9XC//8qAP//vp///////////////////////////////////////////////////7+i//8qAP//07//////////////////////////////////////////////////////////////vJr//z8A//9DAP//UgD//1EA//9QAP//UAD//1AA//9QAP//UAD//1AAZ/9QAAAA/lEAAP5RACr+UQD//lEA//5RAP/+UQD//lEA//5RAP/+UQD//lMA//5EAP/+PgD//7SO///////////////////////////////////////////////////////+kFv//iwA//+vi///9O/////////////////////////////////////////18P//sIz//iwA//6NWP///////////////////////////////////////////////////////7GL//49AP/+RQD//lMA//5RAP/+UQD//lEA//5RAP/+UQD//lEA//5RAP/+UQAq/lEAAAD/UAAA/1AABP9QANf/UAD//1AA//9QAP//UAD//1AA//9QAP//UAD//1IA//9GAP//PwD//6Z///////////////////////////////////////////////////+Yaf//LgD//00A//9kHP//hE3//6N7//+9n///zLX//8Gl//+pgf//iFP//2Ue//9NAP//LgD//5ho//////////////////////////////////////////////////+lfP//PgD//0cA//9SAP//UAD//1AA//9QAP//UAD//1AA//9QAP//UAD//1AA2P9QAAT/UAAAAP9PAAD/TwAA/08An/9PAP//TwD//08A//9PAP//TwD//08A//9PAP//TwD//1EA//9HAP//NgD//55x//////////////////////////////////////////////Hq//9xNP//MQD//0EA//89AP//NQD//z0A//9HAP//PwD//zQA//88AP//QQD//zEA//9wNP//8er/////////////////////////////////////////////nW///zcA//9HAP//UQD//08A//9PAP//TwD//08A//9PAP//TwD//08A//9PAP//TwCh/08AAP9PAAAA/08AAP9PAAD/TwBh/08A//9PAP//TwD//08A//9PAP//TwD//08A//9PAP//TwD//1EA//9IAP//MgD//5hp///+/v////////////////////////////////////////z4//+IVf//NgD//0oA//9RAP//TAD//0kA//9MAP//UAD//0oA//81AP//h1T///z4/////////////////////////////////////////v7//5do//8zAP//SQD//1EA//9PAP//TwD//08A//9PAP//TwD//08A//9PAP//TwD//08A//9PAGP/TwAA/08AAAD/TwAA/08AAP9PACP/TwD8/08A//9PAP//TwD//08A//9PAP//TwD//08A//9PAP//TwD//1AA//9FAP//QgD//9nH//////////////////////////////////////////////////+bcP//OAD//0YA//9RAP//TwD//1EA//9GAP//OAD//5lu///////////////////////////////////////////////////byv//QwD//0UA//9QAP//TwD//08A//9PAP//TwD//08A//9PAP//TwD//08A//9PAP//TwD9/08AJP9PAAD/TwAAAP9PAAD/TwAA/08AAP9PAM7/TwD//08A//9PAP//TwD//08A//9PAP//TwD//08A//9PAP//TwD//0cA//9OAP//49b///////////////////////////////////////////////////////+wjf//QAD//0EA//9TAP//QgD//z4A//+ui////////////////////////////////////////////////////////+bb//9QA///RgD//08A//9PAP//TwD//08A//9PAP//TwD//08A//9PAP//TwD//08A//9PAND/TwAA/08AAP9PAAAA/08AAP9PAAD/TwAA/08Ajv9PAP//TwD//08A//9PAP//TwD//08A//9PAP//TwD//08A//9RAP//NgD//4tW///////////////////////////////////////////////////////////////////Eqf//UAv//0IA//9QCf//w6b//////////////////////////////////////////////////////////////////45b//82AP//UAD//08A//9PAP//TwD//08A//9PAP//TwD//08A//9PAP//TwD//08AkP9PAAD/TwAA/08AAAD/TwAA/08AAP9PAAD/TwBX/04A//9OAP//TgD//04A//9OAP//TgD//04A//9OAP//TgD//0oA//9BAP//0r3///////////////////////////////////////////////////////////////////////+2kv//GAD//7OO////////////////////////////////////////////////////////////////////////1sP//0MA//9JAP//TgD//04A//9OAP//TgD//04A//9OAP//TgD//04A//9OAP//TwBZ/08AAP9PAAD/TwAAAP9OAAD/TgAA/04AAP9OABz/TgD3/04A//9OAP//TgD//04A//9OAP//TgD//04A//9OAP//PAD//20n/////////////////////////////////////////////////////////////////////////////6B2//8fAP//nXH/////////////////////////////////////////////////////////////////////////////cCz//zsA//9OAP//TgD//04A//9OAP//TgD//04A//9OAP//TgD//04A+P9OAB//TgAA/04AAP9OAAAA/04AAP9OAAD/TgAA/04AAP9PAMr/TwD//08A//9PAP//TwD//08A//9PAP//TwD//08A//86AP//f0T///////////////////////////////////////////////////////////////////////+le///QQD//0sA//9AAP//oXf///////////////////////////////////////////////////////////////////////+CSf//OwD//08A//9PAP//TwD//08A//9PAP//TwD//08A//9PAP//TwDM/04AAP9OAAD/TgAA/04AAAD/UAAA/1AAAP9QAAD/UAAA/1AAh/9QAP//UAD//1AA//9QAP//UAD//1AA//9QAP//UAD//0EA//9nIP//+vj/////////////////////////////////////////////////////////////lWf//zoA//9JAP//UwD//0oA//85AP//kWL/////////////////////////////////////////////////////////////+/r//2kj//9AAP//UAD//1AA//9QAP//UAD//1AA//9QAP//UAD//1AA//9QAIr/UAAA/1AAAP9QAAD/UAAAAP9QAAD/UAAA/1AAAP9QAAD/UABG/1AA//9QAP//UAD//1AA//9QAP//UAD//1AA//9QAP//TQD//z0A///Irf//////////////////////////////////////////////////+fT//4pX//8zAP//PgD//0AA//8/AP//PwD//z4A//8zAP//hlP///fy///////////////////////////////////////////////////Lsv//PgD//00A//9QAP//UAD//1AA//9QAP//UAD//1AA//9QAP//UAD//1AASv9QAAD/UAAA/1AAAP9QAAAA/1AAAP9QAAD/UAAA/1AAAP9QABL/UADx/1AA//9QAP//UAD//1AA//9QAP//UAD//1AA//9RAP//PgD//2ko///+/f///////////////////////////////////////9G6//9oJf//JgD//zMA//9cFf//lGT//8On//+XZ///XRf//zQA//8mAP//ZB///821//////////////////////////////////////////3//2or//89AP//UQD//1AA//9QAP//UAD//1AA//9QAP//UAD//1AA//9QAPL/UAAU/1AAAP9QAAD/UAAA/1AAAAD/UAAA/1AAAP9QAAD/UAAA/1AAAP9QALz/UAD//1AA//9QAP//UAD//1AA//9QAP//UAD//1AA//9QAP//PQD//4BK///59f///////////////////////9C9//+FU///NAD//zEA//9tL///tZL//+7n///////////////////w6f//t5X//28z//8zAP//MgD//4FP///Nt/////////////////////////r2//+BS///PQD//1AA//9QAP//UAD//1AA//9QAP//UAD//1AA//9QAP//UAD//1AAwP9QAAD/UAAA/1AAAP9QAAD/UAAAAP9QAAD/UAAA/1AAAP9QAAD/UAAA/1AAgv9QAP//UAD//1AA//9QAP//UAD//1AA//9QAP//UAD//1EA//9PAP//OgD//3I5///czP//+PX//9G7//98R///NgD//yYA//9tNP//vqL///z6/////////////////////////////////////////vv//8Ko//90PP//KQD//zIA//93QP//z7j///fz///by///czr//zoA//9PAP//UQD//1AA//9QAP//UAD//1AA//9QAP//UAD//1AA//9QAP//UACG/1AAAP9QAAD/UAAA/1AAAP9QAAAA/1AAAP9QAAD/UAAA/1AAAP9QAAD/UAA+/1AA//9QAP//UAD//1AA//9QAP//UAD//1AA//9QAP//UAD//1EA//9QAP//PQD//08A//9pIP//PQD//yMA//9mIv//v6L////////////////////////////////////////////////////////////////////////Irv//cTL//ycA//85AP//aB///04A//89AP//UAD//1EA//9QAP//UAD//1AA//9QAP//UAD//1AA//9QAP//UAD//1AA//9QAEP/UAAA/1AAAP9QAAD/UAAA/1AAAAD/UQAA/1EAAP9RAAD/UQAA/1EAAP9RAAz/UQDo/1EA//9RAP//UQD//1EA//9RAP//UQD//1EA//9RAP//UQD//1EA//9SAP//SQD//zgA//9ZEv//wKD///37////////////////////////////////////////////////////////////////////////////////////////zrf//18c//83AP//SQD//1IA//9RAP//UQD//1EA//9RAP//UQD//1EA//9RAP//UQD//1EA//9RAP//UQDr/1EADv9RAAD/UQAA/1EAAP9RAAD/UQAAAP9QAAD/UAAA/1AAAP9QAAD/UAAA/1AAAP9QAKz/UAD//1AA//9QAP//UAD//1AA//9QAP//UAD//1AA//9QAP//UAD//1AA//9QAP//PwD//2wn////////////////////////////////////////////////////////////////////////////////////////////////////////bi3//0AA//9QAP//UAD//1AA//9QAP//UAD//1AA//9QAP//UAD//1AA//9QAP//UAD//1AA//9QALH/UAAA/1AAAP9QAAD/UAAA/1AAAP9QAAAA/1AAAP9QAAD/UAAA/1AAAP9QAAD/UAAA/1AAc/9QAP//UAD//1AA//9QAP//UAD//1AA//9QAP//UAD//1AA//9QAP//UAD//1AA//9QAP//QwD//20z///ezf//////////////////////////////////////////////////////////////////////////////////2cX//2Yn//9CAP//UQD//1AA//9QAP//UAD//1AA//9QAP//UAD//1AA//9QAP//UAD//1AA//9QAP//UAD//1AAef9QAAD/UAAA/1AAAP9QAAD/UAAA/1AAAAD/UAAA/1AAAP9QAAD/UAAA/1AAAP9QAAD/UAA5/1AA//9QAP//UAD//1AA//9QAP//UAD//1AA//9QAP//UAD//1AA//9QAP//UAD//1EA//9QAP//OgD//00I//+ykv///////////////////////////////////////////////////////////////////////62L//9LBP//OwD//1AA//9RAP//UAD//1AA//9QAP//UAD//1AA//9QAP//UAD//1AA//9QAP//UAD//1AA//9QAP//UAA//1AAAP9QAAD/UAAA/1AAAP9QAAD/UAAAAP9QAAD/UAAA/1AAAP9QAAD/UAAA/1AAAP9QAAf/UADi/1AA//9QAP//UAD//1AA//9QAP//UAD//1AA//9QAP//UAD//1AA//9QAP//UAD//1AA//9SAP//RgD//zgA//+EU///8un///////////////////////////////////////////////////Ho//+CUP//NwD//0cA//9SAP//UAD//1AA//9QAP//UAD//1AA//9QAP//UAD//1AA//9QAP//UAD//1AA//9QAP//UAD//1AA6P9QAAr/UAAA/1AAAP9QAAD/UAAA/1AAAP9QAAAA/1AAAP9QAAD/UAAA/1AAAP9QAAD/UAAA/1AAAP9QAKf/UAD//1AA//9QAP//UAD//1AA//9QAP//UAD//1AA//9QAP//UAD//1AA//9QAP//UAD//1AA//9RAP//TAD//zQA//9kJ///5Nb////////////////////////////////////////l1v//Yyb//zQA//9NAP//UQD//1AA//9QAP//UAD//1AA//9QAP//UAD//1AA//9QAP//UAD//1AA//9QAP//UAD//1AA//9QAP//UACu/1AAAP9QAAD/UAAA/1AAAP9QAAD/UAAA/1AAAAD/UAAA/1AAAP9QAAD/UAAA/1AAAP9QAAD/UAAA/1AAY/9QAP//UAD//1AA//9QAP//UAD//1AA//9QAP//UAD//1AA//9QAP//UAD//1AA//9QAP//UAD//1AA//9RAP//UAD//zsA//9SEf//0bj/////////////////////////////07v//1MR//87AP//UAD//1EA//9QAP//UAD//1AA//9QAP//UAD//1AA//9QAP//UAD//1AA//9QAP//UAD//1AA//9QAP//UAD//1AA//9QAGr/UAAA/1AAAP9QAAD/UAAA/1AAAP9QAAD/UAAAAP9QAAD/UAAA/1AAAP9QAAD/UAAA/1AAAP9QAAD/UAAp/1AA/v9QAP//UAD//1AA//9QAP//UAD//1AA//9QAP//UAD//1AA//9QAP//UAD//1AA//9QAP//UAD//1AA//9QAP//UgD//z8A//9JAv//v6T//////////////////8Gm//9JA///PwD//1IA//9QAP//UAD//1AA//9QAP//UAD//1AA//9QAP//UAD//1AA//9QAP//UAD//1AA//9QAP//UAD//1AA//9QAP//UAD//1AAL/9QAAD/UAAA/1AAAP9QAAD/UAAA/1AAAP9QAAAA/1AAAP9QAAD/UAAA/1AAAP9QAAD/UAAA/1AAAP9QAAD/UADS/1AA//9QAP//UAD//1AA//9QAP//UAD//1AA//9QAP//UAD//1AA//9QAP//UAD//1AA//9QAP//UAD//1AA//9QAP//UgD//0EA//9BAP//rYf//+TX//+sh///QgD//0EA//9SAP//UAD//1AA//9QAP//UAD//1AA//9QAP//UAD//1AA//9QAP//UAD//1AA//9QAP//UAD//1AA//9QAP//UAD//1AA//9QANn/UAAA/1AAAP9QAAD/UAAA/1AAAP9QAAD/UAAA/1AAAAD/UAAA/1AAAP9QAAD/UAAA/1AAAP9QAAD/UAAA/1AAAP9QAG3/UAD//1AA//9QAP//UAD//1AA//9QAP//UAD//1AA//9QAP//UAD//1AA//9QAP//UAD//1AA//9QAP//UAD//1AA//9QAP//UgD//0kA//9DAP//UgP//0IA//9JAP//UgD//1AA//9QAP//UAD//1AA//9QAP//UAD//1AA//9QAP//UAD//1AA//9QAP//UAD//1AA//9QAP//UAD//1AA//9QAP//UAD//1AAdP9QAAD/UAAA/1AAAP9QAAD/UAAA/1AAAP9QAAD/UAAAAP9QAAD/UAAA/1AAAP9QAAD/UAAA/1AAAP9QAAD/UAAA/1AACv9QAOL/UAD//1AA//9QAP//UAD//1AA//9QAP//UAD//1AA//9QAP//UAD//1AA//9QAP//UAD//1AA//9QAP//UAD//1AA//9QAP//UAD//04A//9KAP//TwD//1AA//9QAP//UAD//1AA//9QAP//UAD//1AA//9QAP//UAD//1AA//9QAP//UAD//1AA//9QAP//UAD//1AA//9QAP//UAD//1AA//9QAOf/UAAN/1AAAP9QAAD/UAAA/1AAAP9QAAD/UAAA/1AAAP9QAAAA/1AAAP9QAAD/UAAA/1AAAP9QAAD/UAAA/1AAAP9QAAD/UAAA/1AATf9QAP//UAD//1AA//9QAP//UAD//1AA//9QAP//UAD//1AA//9QAP//UAD//1AA//9QAP//UAD//1AA//9QAP//UAD//1AA//9QAP//UAD//1AA//9QAP//UAD//1AA//9QAP//UAD//1AA//9QAP//UAD//1AA//9QAP//UAD//1AA//9QAP//UAD//1AA//9QAP//UAD//1AA//9QAP//UAD//1AAUv9QAAD/UAAA/1AAAP9QAAD/UAAA/1AAAP9QAAD/UAAA/1AAAAD/UAAA/1AAAP9QAAD/UAAA/1AAAP9QAAD/UAAA/1AAAP9QAAD/UAAA/1AAhP9QAP//UAD//1AA//9QAP//UAD//1AA//9QAP//UAD//1AA//9QAP//UAD//1AA//9QAP//UAD//1AA//9QAP//UAD//1AA//9QAP//UAD//1AA//9QAP//UAD//1AA//9QAP//UAD//1AA//9QAP//UAD//1AA//9QAP//UAD//1AA//9QAP//UAD//1AA//9QAP//UAD//1AA//9QAIf/UAAA/1AAAP9QAAD/UAAA/1AAAP9QAAD/UAAA/1AAAP9QAAD/UAAAAP9QAAD/UAAA/1AAAP9QAAD/UAAA/1AAAP9QAAD/UAAA/1AAAP9QAAD/UAAA/1AAlP9QAP//UAD//1AA//9QAP//UAD//1AA//9QAP//UAD//1AA//9QAP//UAD//1AA//9QAP//UAD//1AA//9QAP//UAD//1AA//9QAP//UAD//1AA//9QAP//UAD//1AA//9QAP//UAD//1AA//9QAP//UAD//1AA//9QAP//UAD//1AA//9QAP//UAD//1AA//9QAP//UACX/1AAAP9QAAD/UAAA/1AAAP9QAAD/UAAA/1AAAP9QAAD/UAAA/1AAAP9QAAAA/1AAAP9QAAD/UAAA/1AAAP9QAAD/UAAA/1AAAP9QAAD/UAAA/1AAAP9QAAD/UAAA/1AAcf9QAPf/UAD//1AA//9QAP//UAD//1AA//9QAP//UAD//1AA//9QAP//UAD//1AA//9QAP//UAD//1AA//9QAP//UAD//1AA//9QAP//UAD//1AA//9QAP//UAD//1AA//9QAP//UAD//1AA//9QAP//UAD//1AA//9QAP//UAD//1AA//9QAP//UAD4/1AAcv9QAAD/UAAA/1AAAP9QAAD/UAAA/1AAAP9QAAD/UAAA/1AAAP9QAAD/UAAA/1AAAAD/UAAA/1AAAP9QAAD/UAAA/1AAAP9QAAD/UAAA/1AAAP9QAAD/UAAA/1AAAP9QAAD/UAAA/1AAJf9QAK//UAD//1AA//9QAP//UAD//1AA//9QAP//UAD//1AA//9QAP//UAD//1AA//9QAP//UAD//1AA//9QAP//UAD//1AA//9QAP//UAD//1AA//9QAP//UAD//1AA//9QAP//UAD//1AA//9QAP//UAD//1AA//9QAP//UAD//1AAsP9QACX/UAAA/1AAAP9QAAD/UAAA/1AAAP9QAAD/UAAA/1AAAP9QAAD/UAAA/1AAAP9QAAD/UAAAAP9QAAD/UAAA/1AAAP9QAAD/UAAA/1AAAP9QAAD/UAAA/1AAAP9QAAD/UAAA/1AAAP9QAAD/UAAA/1AAAP9QAGD/UADi/1AA//9QAP//UAD//1AA//9QAP//UAD//1AA//9QAP//UAD//1AA//9QAP//UAD//1AA//9QAP//UAD//1AA//9QAP//UAD//1AA//9QAP//UAD//1AA//9QAP//UAD//1AA//9QAP//UAD//1AA5P9QAGL/UAAA/1AAAP9QAAD/UAAA/1AAAP9QAAD/UAAA/1AAAP9QAAD/UAAA/1AAAP9QAAD/UAAA/1AAAP9QAAAA/1AAAP9QAAD/UAAA/1AAAP9QAAD/UAAA/1AAAP9QAAD/UAAA/1AAAP9QAAD/UAAA/1AAAP9QAAD/UAAA/1AAAP9QABn/UACi/1AA//9QAP//UAD//1AA//9QAP//UAD//1AA//9QAP//UAD//1AA//9QAP//UAD//1AA//9QAP//UAD//1AA//9QAP//UAD//1AA//9QAP//UAD//1AA//9QAP//UAD//1AA//9QAKb/UAAc/1AAAP9QAAD/UAAA/1AAAP9QAAD/UAAA/1AAAP9QAAD/UAAA/1AAAP9QAAD/UAAA/1AAAP9QAAD/UAAA/1AAAAD/UAAA/1AAAP9QAAD/UAAA/1AAAP9QAAD/UAAA/1AAAP9QAAD/UAAA/1AAAP9QAAD/UAAA/1AAAP9QAAD/UAAA/1AAAP9QAAD/UABV/1AA3/9QAP//UAD//1AA//9QAP//UAD//1AA//9QAP//UAD//1AA//9QAP//UAD//1AA//9QAP//UAD//1AA//9QAP//UAD//1AA//9QAP//UAD//1AA//9QAOT/UABZ/1AAAP9QAAD/UAAA/1AAAP9QAAD/UAAA/1AAAP9QAAD/UAAA/1AAAP9QAAD/UAAA/1AAAP9QAAD/UAAA/1AAAP9QAAD/UAAAAP9QAAD/UAAA/1AAAP9QAAD/UAAA/1AAAP9QAAD/UAAA/1AAAP9QAAD/UAAA/1AAAP9QAAD/UAAA/1AAAP9QAAD/UAAA/1AAAP9QAAD/UAAV/1AAmv9QAP//UAD//1AA//9QAP//UAD//1AA//9QAP//UAD//1AA//9QAP//UAD//1AA//9QAP//UAD//1AA//9QAP//UAD//1AA//9QAP//UACe/1AAGP9QAAD/UAAA/1AAAP9QAAD/UAAA/1AAAP9QAAD/UAAA/1AAAP9QAAD/UAAA/1AAAP9QAAD/UAAA/1AAAP9QAAD/UAAA/1AAAP9QAAAA/1AAAP9QAAD/UAAA/1AAAP9QAAD/UAAA/1AAAP9QAAD/UAAA/1AAAP9QAAD/UAAA/1AAAP9QAAD/UAAA/1AAAP9QAAD/UAAA/1AAAP9QAAD/UAAA/1AAUf9QAN7/UAD//1AA//9QAP//UAD//1AA//9QAP//UAD//1AA//9QAP//UAD//1AA//9QAP//UAD//1AA//9QAP//UADi/1AAVv9QAAD/UAAA/1AAAP9QAAD/UAAA/1AAAP9QAAD/UAAA/1AAAP9QAAD/UAAA/1AAAP9QAAD/UAAA/1AAAP9QAAD/UAAA/1AAAP9QAAD/UAAA/1AAAAD/UAAA/1AAAP9QAAD/UAAA/1AAAP9QAAD/UAAA/1AAAP9QAAD/UAAA/1AAAP9QAAD/UAAA/1AAAP9QAAD/UAAA/1AAAP9QAAD/UAAA/1AAAP9QAAD/UAAA/1AADf9QAJj/UAD//1AA//9QAP//UAD//1AA//9QAP//UAD//1AA//9QAP//UAD//1AA//9QAP//UAD//1AAn/9QABH/UAAA/1AAAP9QAAD/UAAA/1AAAP9QAAD/UAAA/1AAAP9QAAD/UAAA/1AAAP9QAAD/UAAA/1AAAP9QAAD/UAAA/1AAAP9QAAD/UAAA/1AAAP9QAAD/UAAAAP9QAAD/UAAA/1AAAP9QAAD/UAAA/1AAAP9QAAD/UAAA/1AAAP9QAAD/UAAA/1AAAP9QAAD/UAAA/1AAAP9QAAD/UAAA/1AAAP9QAAD/UAAA/1AAAP9QAAD/UAAA/1AAAP9QAFz/UADr/1AA//9QAP//UAD//1AA//9QAP//UAD//1AA//9QAP//UAD//1AA8P9QAGT/UAAA/1AAAP9QAAD/UAAA/1AAAP9QAAD/UAAA/1AAAP9QAAD/UAAA/1AAAP9QAAD/UAAA/1AAAP9QAAD/UAAA/1AAAP9QAAD/UAAA/1AAAP9QAAD/UAAA/1AAAP9QAAAA/1AAAP9QAAD/UAAA/1AAAP9QAAD/UAAA/1AAAP9QAAD/UAAA/1AAAP9QAAD/UAAA/1AAAP9QAAD/UAAA/1AAAP9QAAD/UAAA/1AAAP9QAAD/UAAA/1AAAP9QAAD/UAAA/1AAAP9QACr/UADH/1AA//9QAP//UAD//1AA//9QAP//UAD//1AA//9QAM7/UAAx/1AAAP9QAAD/UAAA/1AAAP9QAAD/UAAA/1AAAP9QAAD/UAAA/1AAAP9QAAD/UAAA/1AAAP9QAAD/UAAA/1AAAP9QAAD/UAAA/1AAAP9QAAD/UAAA/1AAAP9QAAD/UAAA/1AAAAD/UAAA/1AAAP9QAAD/UAAA/1AAAP9QAAD/UAAA/1AAAP9QAAD/UAAA/1AAAP9QAAD/UAAA/1AAAP9QAAD/UAAA/1AAAP9QAAD/UAAA/1AAAP9QAAD/UAAA/1AAAP9QAAD/UAAA/1AAAP9QAAD/UACO/1AA//9QAP//UAD//1AA//9QAP//UACX/1AAAf9QAAD/UAAA/1AAAP9QAAD/UAAA/1AAAP9QAAD/UAAA/1AAAP9QAAD/UAAA/1AAAP9QAAD/UAAA/1AAAP9QAAD/UAAA/1AAAP9QAAD/UAAA/1AAAP9QAAD/UAAA/1AAAP9QAAD/UAAAAP9QAAD/UAAA/1AAAP9QAAD/UAAA/1AAAP9QAAD/UAAA/1AAAP9QAAD/UAAA/1AAAP9QAAD/UAAA/1AAAP9QAAD/UAAA/1AAAP9QAAD/UAAA/1AAAP9QAAD/UAAA/1AAAP9QAAD/UAAA/1AAAP9QAAD/UABc/1AA0P9QAO//UADU/1AAY/9QAAD/UAAA/1AAAP9QAAD/UAAA/1AAAP9QAAD/UAAA/1AAAP9QAAD/UAAA/1AAAP9QAAD/UAAA/1AAAP9QAAD/UAAA/1AAAP9QAAD/UAAA/1AAAP9QAAD/UAAA/1AAAP9QAAD/UAAA/1AAAP9QAAABAAD//2YyukhnqUCJAAAAAElFTkSuQmCC);\n\
background-size: 41px 50px;\n\
width: 41px;\n\
height: 50px;\n\
display: inline-block;\n\
       }\n\
  .detailTableRow .siteColumn img {\n\
    width: 1.5em;\n\
    height: 1.5em;\n\
    margin-right: 6px;\n\
    vertical-align: middle;\n\
  }\n\
span.verified {\n\
  height: 20px;\n\
  width: 20px;\n\
  background: url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA2MS41MSA3MS44Ij48ZGVmcz48c3R5bGU+LmNscy0xe2ZpbGw6IzcyYmY0NDt9LmNscy0ye2ZpbGw6I2ZmZjt9PC9zdHlsZT48L2RlZnM+PHRpdGxlPnZlcmlmaWVkX2dyZWVuX2ljb248L3RpdGxlPjxnIGlkPSJMYXllcl8yIiBkYXRhLW5hbWU9IkxheWVyIDIiPjxnIGlkPSJMYXllcl8xLTIiIGRhdGEtbmFtZT0iTGF5ZXIgMSI+PHBhdGggY2xhc3M9ImNscy0xIiBkPSJNLjA3LDE4LjA2LDMwLjY4LDAsNjEuNTEsMTguMDZWNTMuNDJMMzEuMTIsNzEuOC4xLDUzLjg2Uy0uMSwzNC42Mi4wNywxOC4wNloiLz48cG9seWdvbiBjbGFzcz0iY2xzLTIiIHBvaW50cz0iMTcuNTQgMjkuNTMgMTMuMDEgMzQuMDYgMjkuNDMgNTAuNDUgNTIuNDIgMjcuNTkgNDcuMTkgMjIuNzEgMjkuMzcgNDAuODggMTcuNTQgMjkuNTMiLz48L2c+PC9nPjwvc3ZnPg==) center no-repeat;\n\
  display: inline-block;\n\
  position: relative;\n\
  vertical-align: middle;\n\
}\n\
.detailTableRow span.verified {\n\
  left: -25px;\n\
}\n\
span.verified + span.site {\n\
  position: relative;\n\
  left: -20px;\n\
}\n\
span.site {\n\
  vertical-align: middle;\n\
}\n\
div.verifiedExplainer {\n\
  margin-top: 10px;\n\
  margin-left: 10px;\n\
  display: inline-block;\n\
}\n\
div.pageIndicator {\n\
  margin-top: 10px;\n\
}\n\
div.footerNoteBox {\n\
  background-color: #f7f7f7;\n\
  padding: 20px;\n\
  float: bottom;\n\
}\n\
span.noteHeading {\n\
  color: #ff5000;\n\
  margin-bottom: 5px;\n\
}\n\
div.pageFooterBox {\n\
  padding: 20px;\n\
  float: bottom;\n\
  page-break-after: always;\n\
}\n\
span.pageFooterBody {\n\
  color: #aaaaaa;\n\
}\n\
span.noteBody {\n\
}\n\
'}} />
    )
  }

  render () {
    let pages = this.pages

    return (
      <div className='contributionStatementContainer'>
        { this.staticStyles }
        { pages.map(this.ContributionStatementPage.bind(this)) }
      </div>
    )
  }
}

class GeneralTab extends ImmutableComponent {
  constructor (e) {
    super()
    this.importBrowserDataNow = this.importBrowserDataNow.bind(this)
    this.onChangeSetting = this.onChangeSetting.bind(this)
    this.setAsDefaultBrowser = this.setAsDefaultBrowser.bind(this)
  }

  importBrowserDataNow () {
    aboutActions.importBrowserDataNow()
  }

  onChangeSetting (key, value) {
    // disable "SHOW_HOME_BUTTON" if it's enabled and homepage is blank
    if (key === settings.HOMEPAGE && getSetting(settings.SHOW_HOME_BUTTON, this.props.settings)) {
      const homepage = value && value.trim()
      if (!homepage || !homepage.length) {
        this.props.onChangeSetting(settings.SHOW_HOME_BUTTON, false)
      }
    }
    this.props.onChangeSetting(key, value)
  }

  setAsDefaultBrowser () {
    aboutActions.setAsDefaultBrowser()
  }

  enabled (keyArray) {
    return keyArray.every((key) => getSetting(key, this.props.settings) === true)
  }

  render () {
    var languageOptions = this.props.languageCodes.map(function (lc) {
      return (
        <option data-l10n-id={lc} value={lc} />
      )
    })
    var homepageValue = getSetting(settings.HOMEPAGE, this.props.settings)
    if (typeof homepageValue === 'string') {
      homepageValue = punycode.toASCII(homepageValue)
    }
    const homepage = homepageValue && homepageValue.trim()
    const disableShowHomeButton = !homepage || !homepage.length
    const defaultLanguage = this.props.languageCodes.find((lang) => lang.includes(navigator.language)) || 'en-US'
    const defaultBrowser = getSetting(settings.IS_DEFAULT_BROWSER, this.props.settings)
      ? <SettingItem dataL10nId='defaultBrowser' />
      : <SettingItem dataL10nId='notDefaultBrowser' >
        <Button l10nId='setAsDefault' className='primaryButton setAsDefaultButton'
          onClick={this.setAsDefaultBrowser} />
      </SettingItem>

    const defaultZoomSetting = getSetting(settings.DEFAULT_ZOOM_LEVEL, this.props.settings)
    return <SettingsList>
      <div className='sectionTitle' data-l10n-id='generalSettings' />
      <SettingsList>
        <SettingItem dataL10nId='startsWith'>
          <select className='form-control' value={getSetting(settings.STARTUP_MODE, this.props.settings)}
            onChange={changeSetting.bind(null, this.props.onChangeSetting, settings.STARTUP_MODE)} >
            <option data-l10n-id='startsWithOptionLastTime' value={startsWithOption.WINDOWS_TABS_FROM_LAST_TIME} />
            <option data-l10n-id='startsWithOptionHomePage' value={startsWithOption.HOMEPAGE} />
            <option data-l10n-id='startsWithOptionNewTabPage' value={startsWithOption.NEW_TAB_PAGE} />
          </select>
        </SettingItem>
        <SettingItem dataL10nId='newTabMode'>
          <select className='form-control' value={getSetting(settings.NEWTAB_MODE, this.props.settings)}
            onChange={changeSetting.bind(null, this.props.onChangeSetting, settings.NEWTAB_MODE)} >
            <option data-l10n-id='newTabNewTabPage' value={newTabMode.NEW_TAB_PAGE} />
            <option data-l10n-id='newTabHomePage' value={newTabMode.HOMEPAGE} />
            <option data-l10n-id='newTabDefaultSearchEngine' value={newTabMode.DEFAULT_SEARCH_ENGINE} />
            <option data-l10n-id='newTabEmpty' value={newTabMode.EMPTY_NEW_TAB} />
          </select>
        </SettingItem>
        <SettingItem dataL10nId='myHomepage'>
          <input spellCheck='false'
            className='form-control'
            data-l10n-id='homepageInput'
            value={homepageValue}
            onChange={changeSetting.bind(null, this.onChangeSetting, settings.HOMEPAGE)} />
        </SettingItem>
        <SettingCheckbox dataL10nId='showHomeButton' prefKey={settings.SHOW_HOME_BUTTON}
          settings={this.props.settings} onChangeSetting={this.props.onChangeSetting}
          disabled={disableShowHomeButton} />
        {
          isDarwin ? null : <SettingCheckbox dataL10nId='autoHideMenuBar' prefKey={settings.AUTO_HIDE_MENU} settings={this.props.settings} onChangeSetting={this.props.onChangeSetting} />
        }
        <SettingCheckbox dataL10nId='disableTitleMode' prefKey={settings.DISABLE_TITLE_MODE} settings={this.props.settings} onChangeSetting={this.props.onChangeSetting} />
        <SettingItem dataL10nId='bookmarkToolbarSettings'>
          <select className='form-control' id='bookmarksBarSelect' value={getSetting(settings.BOOKMARKS_TOOLBAR_MODE, this.props.settings)}
            onChange={changeSetting.bind(null, this.props.onChangeSetting, settings.BOOKMARKS_TOOLBAR_MODE)} >
            <option data-l10n-id='bookmarksBarTextOnly' value={bookmarksToolbarMode.TEXT_ONLY} />
            <option data-l10n-id='bookmarksBarTextAndFavicon' value={bookmarksToolbarMode.TEXT_AND_FAVICONS} />
            <option data-l10n-id='bookmarksBarFaviconOnly' value={bookmarksToolbarMode.FAVICONS_ONLY} />
          </select>
          <SettingCheckbox id='bookmarksBarSwitch' dataL10nId='bookmarkToolbar'
            prefKey={settings.SHOW_BOOKMARKS_TOOLBAR} settings={this.props.settings}
            onChangeSetting={this.props.onChangeSetting} />
        </SettingItem>
        <SettingItem dataL10nId='selectedLanguage'>
          <select className='form-control' value={getSetting(settings.LANGUAGE, this.props.settings) || defaultLanguage}
            onChange={changeSetting.bind(null, this.props.onChangeSetting, settings.LANGUAGE)} >
            {languageOptions}
          </select>
        </SettingItem>
        <SettingItem dataL10nId='defaultZoomLevel'>
          <select
            className='form-control'
            value={defaultZoomSetting === undefined || defaultZoomSetting === null ? config.zoom.defaultValue : defaultZoomSetting}
            data-type='float'
            onChange={changeSetting.bind(null, this.props.onChangeSetting, settings.DEFAULT_ZOOM_LEVEL)}>
            {
              config.zoom.zoomLevels.map((x) =>
                <option value={x} key={x}>{getZoomValuePercentage(x) + '%'}</option>)
            }
          </select>
        </SettingItem>
        <SettingItem dataL10nId='importBrowserData'>
          <Button l10nId='importNow' className='primaryButton importNowButton'
            onClick={this.importBrowserDataNow} />
        </SettingItem>
        {defaultBrowser}
        <SettingItem>
          <SettingCheckbox dataL10nId='checkDefaultOnStartup' prefKey={settings.CHECK_DEFAULT_ON_STARTUP}
            settings={this.props.settings} onChangeSetting={this.props.onChangeSetting} />
        </SettingItem>
      </SettingsList>
    </SettingsList>
  }
}

class SearchSelectEntry extends ImmutableComponent {
  render () {
    return <div>
      {getSetting(settings.DEFAULT_SEARCH_ENGINE, this.props.settings) === this.props.name
        ? <span className='fa fa-check-square' id='searchSelectIcon' /> : null}
    </div>
  }
}

class SearchEntry extends ImmutableComponent {
  render () {
    return <div>
      <span style={this.props.iconStyle} />
      <span style={{paddingLeft: '5px', verticalAlign: 'middle'}}>{this.props.name}</span>
    </div>
  }
}

class SearchShortcutEntry extends ImmutableComponent {
  render () {
    return <div style={{paddingLeft: '5px', verticalAlign: 'middle'}}>
      {this.props.shortcut}
    </div>
  }
}

class SearchTab extends ImmutableComponent {
  get searchProviders () {
    let entries = searchProviders.providers
    let array = []
    const iconSize = 16
    entries.forEach((entry) => {
      let iconStyle = {
        backgroundImage: `url(${entry.image})`,
        minWidth: iconSize,
        width: iconSize,
        backgroundSize: iconSize,
        height: iconSize,
        display: 'inline-block',
        verticalAlign: 'middle'
      }
      array.push([
        {
          html: <SearchSelectEntry name={entry.name} settings={this.props.settings} />,
          value: entry.name
        },
        {
          html: <SearchEntry name={entry.name} iconStyle={iconStyle} onChangeSetting={this.props.onChangeSetting} />,
          value: entry.name
        },
        {
          html: <SearchShortcutEntry shortcut={entry.shortcut} />,
          value: entry.shortcut
        }
      ])
    })
    return array
  }

  hoverCallback (rows) {
    this.props.onChangeSetting(settings.DEFAULT_SEARCH_ENGINE, rows[1].value)
  }

  render () {
    return <div>
      <div className='sectionTitle' data-l10n-id='searchSettings' />
      <SortableTable headings={['default', 'searchEngine', 'engineGoKey']} rows={this.searchProviders}
        defaultHeading='searchEngine'
        addHoverClass onClick={this.hoverCallback.bind(this)}
        columnClassNames={['default', 'searchEngine', 'engineGoKey']} />
      <div className='sectionTitle' data-l10n-id='locationBarSettings' />
      <SettingsList>
        <SettingCheckbox dataL10nId='showOpenedTabMatches' prefKey={settings.OPENED_TAB_SUGGESTIONS} settings={this.props.settings} onChangeSetting={this.props.onChangeSetting} />
        <SettingCheckbox dataL10nId='showHistoryMatches' prefKey={settings.HISTORY_SUGGESTIONS} settings={this.props.settings} onChangeSetting={this.props.onChangeSetting} />
        <SettingCheckbox dataL10nId='showBookmarkMatches' prefKey={settings.BOOKMARK_SUGGESTIONS} settings={this.props.settings} onChangeSetting={this.props.onChangeSetting} />
        <SettingCheckbox dataL10nId='offerSearchSuggestions' prefKey={settings.OFFER_SEARCH_SUGGESTIONS} settings={this.props.settings} onChangeSetting={this.props.onChangeSetting} />
      </SettingsList>
    </div>
  }
}

class TabsTab extends ImmutableComponent {
  render () {
    return <div>
      <div className='sectionTitle' data-l10n-id='tabSettings' />
      <SettingsList>
        <SettingItem dataL10nId='tabsPerTabPage'>
          <select
            className='form-control'
            value={getSetting(settings.TABS_PER_PAGE, this.props.settings)}
            data-type='number'
            onChange={changeSetting.bind(null, this.props.onChangeSetting, settings.TABS_PER_PAGE)}>
            {
              // Sorry, Brad says he hates primes :'(
              [6, 8, 10, 20].map((x) =>
                <option value={x} key={x}>{x}</option>)
            }
          </select>
        </SettingItem>
        <SettingCheckbox dataL10nId='switchToNewTabs' prefKey={settings.SWITCH_TO_NEW_TABS} settings={this.props.settings} onChangeSetting={this.props.onChangeSetting} />
        <SettingCheckbox dataL10nId='paintTabs' prefKey={settings.PAINT_TABS} settings={this.props.settings} onChangeSetting={this.props.onChangeSetting} />
        <SettingCheckbox dataL10nId='showTabPreviews' prefKey={settings.SHOW_TAB_PREVIEWS} settings={this.props.settings} onChangeSetting={this.props.onChangeSetting} />
      </SettingsList>
    </div>
  }
}

class PaymentsTab extends ImmutableComponent {
  constructor () {
    super()

    this.printKeys = this.printKeys.bind(this)
    this.saveKeys = this.saveKeys.bind(this)
    this.createWallet = this.createWallet.bind(this)
    this.recoverWallet = this.recoverWallet.bind(this)
    this.handleFirstRecoveryKeyChange = this.handleFirstRecoveryKeyChange.bind(this)
    this.handleSecondRecoveryKeyChange = this.handleSecondRecoveryKeyChange.bind(this)
  }

  createWallet () {
    if (!this.props.ledgerData.get('created')) {
      aboutActions.createWallet()
    }
  }

  handleFirstRecoveryKeyChange (e) {
    this.setState({FirstRecoveryKey: e.target.value})
  }

  handleSecondRecoveryKeyChange (e) {
    this.setState({SecondRecoveryKey: e.target.value})
  }

  recoverWallet () {
    aboutActions.ledgerRecoverWallet(this.state.FirstRecoveryKey, this.state.SecondRecoveryKey)
  }

  copyToClipboard (text) {
    aboutActions.setClipboard(text)
  }

  generateKeyFile (backupAction) {
    aboutActions.ledgerGenerateKeyFile(backupAction)
  }

  clearRecoveryStatus () {
    aboutActions.clearRecoveryStatus()
  }

  printKeys () {
    this.generateKeyFile('print')
  }

  saveKeys () {
    this.generateKeyFile('save')
  }

  get enabled () {
    return getSetting(settings.PAYMENTS_ENABLED, this.props.settings)
  }

  get fundsAmount () {
    if (!this.props.ledgerData.get('created')) {
      return null
    }

    return <div>
      {
      !(this.props.ledgerData.get('balance') === undefined || this.props.ledgerData.get('balance') === null)
        ? <input className='form-control fundsAmount' readOnly value={this.btcToCurrencyString(this.props.ledgerData.get('balance'))} />
        : <span><span data-l10n-id='accountBalanceLoading' /></span>
      }
      <a href='https://brave.com/Payments_FAQ.html' target='_blank'>
        <span className='fa fa-question-circle fundsFAQ' />
      </a>
    </div>
  }

  get walletButton () {
    const buttonText = this.props.ledgerData.get('created')
      ? 'addFundsTitle'
      : (this.props.ledgerData.get('creating') ? 'creatingWallet' : 'createWallet')
    const onButtonClick = this.props.ledgerData.get('created')
      ? this.props.showOverlay.bind(this, 'addFunds')
      : (this.props.ledgerData.get('creating') ? () => {} : this.createWallet)
    return <Button l10nId={buttonText} className='primaryButton addFunds' onClick={onButtonClick.bind(this)} disabled={this.props.ledgerData.get('creating')} />
  }

  get paymentHistoryButton () {
    const walletCreated = this.props.ledgerData.get('created') && !this.props.ledgerData.get('creating')
    const walletTransactions = this.props.ledgerData.get('transactions')
    const walletHasTransactions = walletTransactions && walletTransactions.size

    if (!walletCreated || !walletHasTransactions) {
      return null
    }

    const buttonText = 'viewPaymentHistory'
    const onButtonClick = this.props.showOverlay.bind(this, 'paymentHistory')
    return <Button className='paymentHistoryButton' l10nId={buttonText} onClick={onButtonClick.bind(this)} disabled={this.props.ledgerData.get('creating')} />
  }

  get walletStatus () {
    const ledgerData = this.props.ledgerData
    let status = {}
    if (ledgerData.get('error')) {
      status.id = 'statusOnError'
    } else if (ledgerData.get('created')) {
      const transactions = ledgerData.get('transactions')
      const pendingFunds = Number(ledgerData.get('unconfirmed') || 0)
      if (pendingFunds + Number(ledgerData.get('balance') || 0) <
          0.9 * Number(ledgerData.get('btc') || 0)) {
        status.id = 'insufficientFundsStatus'
      } else if (pendingFunds > 0) {
        status.id = 'pendingFundsStatus'
        status.args = {funds: this.btcToCurrencyString(pendingFunds)}
      } else if (transactions && transactions.size > 0) {
        status.id = 'defaultWalletStatus'
      } else {
        status.id = 'createdWalletStatus'
      }
    } else if (ledgerData.get('creating')) {
      status.id = 'creatingWalletStatus'
    } else {
      status.id = 'createWalletStatus'
    }
    return status
  }

  get tableContent () {
    // TODO: This should be sortable. #2497
    return <LedgerTable ledgerData={this.props.ledgerData}
      siteSettings={this.props.siteSettings} />
  }

  get overlayTitle () {
    if (coinbaseCountries.indexOf(this.props.ledgerData.get('countryCode')) > -1) {
      return 'addFunds'
    } else {
      return 'addFundsAlternate'
    }
  }

  get overlayContent () {
    return <BitcoinDashboard ledgerData={this.props.ledgerData}
      settings={this.props.settings}
      bitcoinOverlayVisible={this.props.bitcoinOverlayVisible}
      qrcodeOverlayVisible={this.props.qrcodeOverlayVisible}
      showOverlay={this.props.showOverlay.bind(this, 'bitcoin')}
      hideOverlay={this.props.hideOverlay.bind(this, 'bitcoin')}
      showQRcode={this.props.showOverlay.bind(this, 'qrcode')}
      hideQRcode={this.props.hideOverlay.bind(this, 'qrcode')}
      hideParentOverlay={this.props.hideOverlay.bind(this, 'addFunds')} />
  }

  get paymentHistoryContent () {
    return <PaymentHistory ledgerData={this.props.ledgerData} />
  }

  get paymentHistoryFooter () {
    let ledgerData = this.props.ledgerData
    if (!ledgerData.get('reconcileStamp')) {
      return null
    }
    const timestamp = ledgerData.get('reconcileStamp')
    const nextReconcileDateRelative = formattedTimeFromNow(timestamp)
    const l10nDataArgs = {
      reconcileDate: nextReconcileDateRelative
    }
    return <div className='paymentHistoryFooter'>
      <div className='nextPaymentSubmission'>
        <span data-l10n-id='paymentHistoryFooterText' data-l10n-args={JSON.stringify(l10nDataArgs)} />
      </div>
      <Button l10nId='paymentHistoryOKText' className='okButton primaryButton' onClick={this.props.hideOverlay.bind(this, 'paymentHistory')} />
    </div>
  }

  get advancedSettingsContent () {
    const minDuration = this.props.ledgerData.getIn(['synopsisOptions', 'minDuration'])
    const minPublisherVisits = this.props.ledgerData.getIn(['synopsisOptions', 'minPublisherVisits'])

    return <div className='board'>
      <div className='panel advancedSettings'>
        <div className='settingsPanelDivider'>
          <div data-l10n-id='minimumPageTimeSetting' />
          <SettingsList>
            <SettingItem>
              <select
                className='form-control'
                defaultValue={minDuration || 8000}
                onChange={changeSetting.bind(null, this.props.onChangeSetting, settings.MINIMUM_VISIT_TIME)}>>
                <option value='5000'>5 seconds</option>
                <option value='8000'>8 seconds</option>
                <option value='60000'>1 minute</option>
              </select>
            </SettingItem>
          </SettingsList>
          <div data-l10n-id='minimumVisitsSetting' />
          <SettingsList>
            <SettingItem>
              <select
                className='form-control'
                defaultValue={minPublisherVisits || 5}
                onChange={changeSetting.bind(null, this.props.onChangeSetting, settings.MINIMUM_VISITS)}>>>
                <option value='2'>2 visits</option>
                <option value='5'>5 visits</option>
                <option value='10'>10 visits</option>
              </select>
            </SettingItem>
          </SettingsList>
        </div>
        <div className='settingsPanelDivider'>
          {this.enabled
            ? <SettingCheckbox
              dataL10nId='notifications'
              prefKey={settings.PAYMENTS_NOTIFICATIONS}
              settings={this.props.settings}
              onChangeSetting={this.props.onChangeSetting} />
            : null}
        </div>
      </div>
    </div>
  }

  get advancedSettingsFooter () {
    return <div className='panel advancedSettingsFooter'>
      <Button l10nId='backupLedger' className='primaryButton' onClick={this.props.showOverlay.bind(this, 'ledgerBackup')} />
      <Button l10nId='recoverLedger' className='primaryButton' onClick={this.props.showOverlay.bind(this, 'ledgerRecovery')} />
      <Button l10nId='done' className='whiteButton inlineButton' onClick={this.props.hideOverlay.bind(this, 'advancedSettings')} />
    </div>
  }

  get ledgerBackupContent () {
    const paymentId = this.props.ledgerData.get('paymentId')
    const passphrase = this.props.ledgerData.get('passphrase')

    return <div className='board'>
      <div className='panel'>
        <span data-l10n-id='ledgerBackupContent' />
        <div className='copyKeyContainer'>
          <div className='copyContainer'>
            <Button l10nId='copy' className='copyButton whiteButton wideButton' onClick={this.copyToClipboard.bind(this, paymentId)} />
          </div>
          <div className='keyContainer'>
            <h3 data-l10n-id='firstKey' />
            <span>{paymentId}</span>
          </div>
        </div>
        <div className='copyKeyContainer'>
          <div className='copyContainer'>
            <Button l10nId='copy' className='copyButton whiteButton wideButton' onClick={this.copyToClipboard.bind(this, passphrase)} />
          </div>
          <div className='keyContainer'>
            <h3 data-l10n-id='secondKey' />
            <span>{passphrase}</span>
          </div>
        </div>
      </div>
    </div>
  }

  get ledgerBackupFooter () {
    return <div className='panel advancedSettingsFooter'>
      <Button l10nId='printKeys' className='primaryButton' onClick={this.printKeys} />
      <Button l10nId='saveRecoveryFile' className='primaryButton' onClick={this.saveKeys} />
      <Button l10nId='done' className='whiteButton inlineButton' onClick={this.props.hideOverlay.bind(this, 'ledgerBackup')} />
    </div>
  }

  get ledgerRecoveryContent () {
    const l10nDataArgs = {
      balance: this.props.ledgerData.get('balance')
    }
    return <div className='board'>
      {
        this.props.ledgerData.get('recoverySucceeded') === true
        ? <div className='recoveryOverlay'>
          <h1>Success!</h1>
          <p className='spaceAround' data-l10n-id='balanceRecovered' data-l10n-args={JSON.stringify(l10nDataArgs)} />
          <Button l10nId='ok' className='whiteButton inlineButton' onClick={this.clearRecoveryStatus} />
        </div>
        : null
      }
      {
        this.props.ledgerData.get('recoverySucceeded') === false
        ? <div className='recoveryOverlay'>
          <h1>Recovery failed</h1>
          <p className='spaceAround'>Please re-enter keys or try different keys.</p>
          <Button l10nId='ok' className='whiteButton inlineButton' onClick={this.clearRecoveryStatus} />
        </div>
        : null
      }
      <div className='panel recoveryContent'>
        <h4 data-l10n-id='ledgerRecoverySubtitle' />
        <span data-l10n-id='ledgerRecoveryContent' />
        <SettingsList>
          <SettingItem>
            <h3 data-l10n-id='firstRecoveryKey' />
            <input className='form-control' onChange={this.handleFirstRecoveryKeyChange} type='text' />
            <h3 data-l10n-id='secondRecoveryKey' />
            <input className='form-control' onChange={this.handleSecondRecoveryKeyChange} type='text' />
          </SettingItem>
        </SettingsList>
      </div>
    </div>
  }

  get ledgerRecoveryFooter () {
    return <div className='panel advancedSettingsFooter'>
      <div className='recoveryFooterButtons'>
        <Button l10nId='recover' className='primaryButton' onClick={this.recoverWallet} />
        <Button l10nId='cancel' className='whiteButton' onClick={this.props.hideOverlay.bind(this, 'ledgerRecovery')} />
      </div>
    </div>
  }

  get nextReconcileDate () {
    const ledgerData = this.props.ledgerData
    if ((ledgerData.get('error')) || (!ledgerData.get('reconcileStamp'))) {
      return null
    }
    const timestamp = ledgerData.get('reconcileStamp')
    const nextReconcileDateRelative = formattedTimeFromNow(timestamp)
    const l10nDataArgs = {
      reconcileDate: nextReconcileDateRelative
    }
    return <div className='nextReconcileDate' data-l10n-args={JSON.stringify(l10nDataArgs)} data-l10n-id='statusNextReconcileDate' />
  }

  get ledgerDataErrorText () {
    const ledgerError = this.props.ledgerData.get('error')
    if (!ledgerError) {
      return null
    }
    // 'error' here is a chromium webRequest error as returned by request.js
    const errorCode = ledgerError.get('error').get('errorCode')
    return l10nErrorText(errorCode)
  }

  btcToCurrencyString (btc) {
    const balance = Number(btc || 0)
    const currency = this.props.ledgerData.get('currency') || 'USD'
    if (balance === 0) {
      return `0 ${currency}`
    }
    if (this.props.ledgerData.get('btc') && typeof this.props.ledgerData.get('amount') === 'number') {
      const btcValue = this.props.ledgerData.get('btc') / this.props.ledgerData.get('amount')
      return `${(balance / btcValue).toFixed(2)} ${currency}`
    }
    return `${balance} BTC`
  }

  get sidebarContent () {
    return <div id='paymentsSidebar'>
      <h2 data-l10n-id='paymentsSidebarText1' />
      <div data-l10n-id='paymentsSidebarText2' />
      <a href='https://www.privateinternetaccess.com/' target='_blank'><div className='paymentsSidebarPIA' /></a>
      <div data-l10n-id='paymentsSidebarText3' />
      <a href='https://www.bitgo.com/' target='_blank'><div className='paymentsSidebarBitgo' /></a>
      <div data-l10n-id='paymentsSidebarText4' />
      <a href='https://www.coinbase.com/' target='_blank'><div className='paymentsSidebarCoinbase' /></a>
    </div>
  }

  get enabledContent () {
    // TODO: report when funds are too low
    // TODO: support non-USD currency
    return <div>
      <div className='walletBar'>
        <table>
          <thead>
            <tr>
              <th data-l10n-id='monthlyBudget' />
              <th data-l10n-id='accountBalance' />
              <th data-l10n-id='status' />
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <SettingsList>
                  <SettingItem>
                    <select className='form-control' id='fundsSelectBox'
                      value={getSetting(settings.PAYMENTS_CONTRIBUTION_AMOUNT,
                        this.props.settings)}
                      onChange={changeSetting.bind(null, this.props.onChangeSetting, settings.PAYMENTS_CONTRIBUTION_AMOUNT)} >
                      {
                        [5, 10, 15, 20].map((amount) =>
                          <option value={amount}>{amount} {this.props.ledgerData.get('currency') || 'USD'}</option>
                        )
                      }
                    </select>
                  </SettingItem>
                </SettingsList>
              </td>
              <td>
                {
                  this.props.ledgerData.get('error') && this.props.ledgerData.get('error').get('caller') === 'getWalletProperties'
                    ? <div>
                      <div data-l10n-id='accountBalanceConnectionError' />
                      <div className='accountBalanceError' data-l10n-id={this.ledgerDataErrorText} />
                    </div>
                    : <div>
                      <SettingsList>
                        <SettingItem>
                          {this.fundsAmount}
                          {this.walletButton}
                          {this.paymentHistoryButton}
                        </SettingItem>
                      </SettingsList>
                    </div>
                }
              </td>
              <td>
                <div id='walletStatus' data-l10n-id={this.walletStatus.id} data-l10n-args={this.walletStatus.args ? JSON.stringify(this.walletStatus.args) : null} />
                {this.nextReconcileDate}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      {this.tableContent}
    </div>
  }

  render () {
    return <div id='paymentsContainer'>
      {
      this.enabled && this.props.addFundsOverlayVisible
        ? <ModalOverlay title={this.overlayTitle} content={this.overlayContent} onHide={this.props.hideOverlay.bind(this, 'addFunds')} />
        : null
      }
      {
        this.enabled && this.props.paymentHistoryOverlayVisible
        ? <ModalOverlay title={'paymentHistoryTitle'} customTitleClasses={'paymentHistory'} content={this.paymentHistoryContent} footer={this.paymentHistoryFooter} onHide={this.props.hideOverlay.bind(this, 'paymentHistory')} />
        : null
      }
      {
        this.enabled && this.props.advancedSettingsOverlayVisible
        ? <ModalOverlay title={'advancedSettingsTitle'} content={this.advancedSettingsContent} footer={this.advancedSettingsFooter} onHide={this.props.hideOverlay.bind(this, 'advancedSettings')} />
        : null
      }
      {
        this.enabled && this.props.ledgerBackupOverlayVisible
        ? <ModalOverlay title={'ledgerBackupTitle'} content={this.ledgerBackupContent} footer={this.ledgerBackupFooter} onHide={this.props.hideOverlay.bind(this, 'ledgerBackup')} />
        : null
      }
      {
        this.enabled && this.props.ledgerRecoveryOverlayVisible
        ? <ModalOverlay title={'ledgerRecoveryTitle'} content={this.ledgerRecoveryContent} footer={this.ledgerRecoveryFooter} onHide={this.props.hideOverlay.bind(this, 'ledgerRecovery')} />
        : null
      }
      <div className='titleBar'>
        <div className='sectionTitleWrapper pull-left'>
          <span className='sectionTitle'>Brave Payments</span>
          <span className='sectionSubTitle'>beta</span>
        </div>
        <div className='pull-left' id='paymentsSwitches'>
          <div className='enablePaymentsSwitch'>
            <span data-l10n-id='off' />
            <SettingCheckbox dataL10nId='on' prefKey={settings.PAYMENTS_ENABLED} settings={this.props.settings} onChangeSetting={this.props.onChangeSetting} />
          </div>
          { this.props.ledgerData.get('created') && this.enabled ? <Button l10nId='advancedSettings' className='advancedSettings whiteButton inlineButton wideButton' onClick={this.props.showOverlay.bind(this, 'advancedSettings')} /> : null }
        </div>
      </div>
      {
        this.enabled
          ? this.enabledContent
          : <div className='paymentsMessage'>
            <h3 data-l10n-id='paymentsWelcomeTitle' />
            <div data-l10n-id='paymentsWelcomeText1' />
            <div className='boldText' data-l10n-id='paymentsWelcomeText2' />
            <div data-l10n-id='paymentsWelcomeText3' />
            <div data-l10n-id='paymentsWelcomeText4' />
            <div data-l10n-id='paymentsWelcomeText5' />
            <div>
              <span data-l10n-id='paymentsWelcomeText6' />&nbsp;
              <a href='https://brave.com/Payments_FAQ.html' target='_blank' data-l10n-id='paymentsWelcomeLink' />&nbsp;
              <span data-l10n-id='paymentsWelcomeText7' />
            </div>
          </div>
      }
      {this.enabled ? null : this.sidebarContent}
    </div>
  }
}

class SyncTab extends ImmutableComponent {
  render () {
    return <div>
      Sync settings coming soon
    </div>
  }
}

class SitePermissionsPage extends React.Component {
  hasEntryForPermission (name) {
    return this.props.siteSettings.some((value) => {
      return value.get && this.props.names[name] ? this.props.names[name].includes(typeof value.get(name)) : false
    })
  }

  isPermissionsNonEmpty () {
    // Check whether there is at least one permission set
    return this.props.siteSettings.some((value) => {
      if (value && value.get) {
        for (let name in this.props.names) {
          const granted = value.get(name)
          if (this.props.names[name].includes(typeof granted)) {
            if (this.props.defaults) {
              return this.props.defaults.get(name) !== granted
            } else {
              return true
            }
          }
        }
      }
      return false
    })
  }

  deletePermission (name, hostPattern) {
    aboutActions.removeSiteSetting(hostPattern, name)
  }

  clearPermissions (name) {
    aboutActions.clearSiteSettings(name)
  }

  render () {
    return this.isPermissionsNonEmpty()
    ? <div id='sitePermissionsPage'>
      <div className='sectionTitle'
        data-l10n-id={this.props.defaults ? 'sitePermissionsExceptions' : 'sitePermissions'} />
      <ul className='sitePermissions'>
        {
          Object.keys(this.props.names).map((name) =>
            this.hasEntryForPermission(name)
            ? <li>
              <div>
                <span data-l10n-id={name} className='permissionName' />
                <span className='clearAll'>
                  (
                  <span className='clearAllLink' data-l10n-id='clearAll'
                    onClick={this.clearPermissions.bind(this, name)} />
                  )
                </span>
              </div>
              <ul>
                {
                  this.props.siteSettings.map((value, hostPattern) => {
                    if (!value.size) {
                      return null
                    }
                    const granted = value.get(name)
                    if (this.props.defaults &&
                        this.props.defaults.get(name) === granted &&
                        granted !== undefined) {
                      return null
                    }
                    let statusText = ''
                    let statusArgs
                    if (this.props.names[name].includes(typeof granted)) {
                      if (name === 'flash') {
                        if (granted === 1) {
                          // Flash is allowed just one time
                          statusText = 'allowOnce'
                        } else if (granted === false) {
                          // Flash installer is never intercepted
                          statusText = 'alwaysDeny'
                        } else {
                          // Show the number of days/hrs/min til expiration
                          statusText = 'flashAllowAlways'
                          statusArgs = {
                            time: new Date(granted).toLocaleString()
                          }
                        }
                      } else if (name === 'widevine') {
                        if (granted === 1) {
                          statusText = 'alwaysAllow'
                        } else if (granted === 0) {
                          statusText = 'allowOnce'
                        } else {
                          statusText = 'alwaysDeny'
                        }
                      } else if (name === 'noScript' && typeof granted === 'number') {
                        if (granted === 1) {
                          statusText = 'allowUntilRestart'
                        } else if (granted === 0) {
                          statusText = 'allowOnce'
                        }
                      } else if (typeof granted === 'string') {
                        statusText = granted
                      } else if (!this.props.defaults) {
                        statusText = granted ? 'alwaysAllow' : 'alwaysDeny'
                      } else {
                        statusText = granted ? 'on' : 'off'
                      }
                      return <div className='permissionItem'>
                        <span className='fa fa-times permissionAction'
                          onClick={this.deletePermission.bind(this, name, hostPattern)} />
                        <span className='permissionHost'>{hostPattern + ': '}</span>
                        <span className='permissionStatus'
                          data-l10n-id={statusText}
                          data-l10n-args={statusArgs ? JSON.stringify(statusArgs) : null} />
                      </div>
                    }
                    return null
                  })
                }
              </ul>
            </li>
            : null)
        }
      </ul>
    </div>
    : null
  }
}

class ShieldsTab extends ImmutableComponent {
  constructor () {
    super()
    this.onChangeAdControl = this.onChangeAdControl.bind(this)
    this.onToggleHTTPSE = this.onToggleSetting.bind(this, httpsEverywhere)
    this.onToggleSafeBrowsing = this.onToggleSetting.bind(this, safeBrowsing)
    this.onToggleNoScript = this.onToggleSetting.bind(this, noScript)
  }
  onChangeAdControl (e) {
    if (e.target.value === 'showBraveAds') {
      aboutActions.setResourceEnabled(adblock, true)
      aboutActions.setResourceEnabled(trackingProtection, true)
      aboutActions.setResourceEnabled(adInsertion, true)
    } else if (e.target.value === 'blockAds') {
      aboutActions.setResourceEnabled(adblock, true)
      aboutActions.setResourceEnabled(trackingProtection, true)
      aboutActions.setResourceEnabled(adInsertion, false)
    } else {
      aboutActions.setResourceEnabled(adblock, false)
      aboutActions.setResourceEnabled(trackingProtection, false)
      aboutActions.setResourceEnabled(adInsertion, false)
    }
  }
  onChangeCookieControl (e) {
    aboutActions.setResourceEnabled(cookieblock, e.target.value === 'block3rdPartyCookie')
  }
  onToggleSetting (setting, e) {
    aboutActions.setResourceEnabled(setting, e.target.value)
  }
  render () {
    return <div id='shieldsContainer'>
      <div className='sectionTitle' data-l10n-id='braveryDefaults' />
      <SettingsList>
        <SettingItem dataL10nId='adControl'>
          <select className='form-control'
            value={this.props.braveryDefaults.get('adControl')}
            onChange={this.onChangeAdControl}>
            <option data-l10n-id='showBraveAds' value='showBraveAds' />
            <option data-l10n-id='blockAds' value='blockAds' />
            <option data-l10n-id='allowAdsAndTracking' value='allowAdsAndTracking' />
          </select>
        </SettingItem>
        <SettingItem dataL10nId='cookieControl'>
          <select className='form-control'
            value={this.props.braveryDefaults.get('cookieControl')}
            onChange={this.onChangeCookieControl}>
            <option data-l10n-id='block3rdPartyCookie' value='block3rdPartyCookie' />
            <option data-l10n-id='allowAllCookies' value='allowAllCookies' />
          </select>
        </SettingItem>
        <SettingCheckbox checked={this.props.braveryDefaults.get('httpsEverywhere')} dataL10nId='httpsEverywhere' onChange={this.onToggleHTTPSE} />
        <SettingCheckbox checked={this.props.braveryDefaults.get('safeBrowsing')} dataL10nId='safeBrowsing' onChange={this.onToggleSafeBrowsing} />
        <SettingCheckbox checked={this.props.braveryDefaults.get('noScript')} dataL10nId='noScriptPref' onChange={this.onToggleNoScript} />
        <SettingCheckbox dataL10nId='blockCanvasFingerprinting' prefKey={settings.BLOCK_CANVAS_FINGERPRINTING} settings={this.props.settings} onChangeSetting={this.props.onChangeSetting} />
        <SettingItem>
          <Button l10nId='manageAdblockSettings' className='primaryButton manageAdblockSettings'
            onClick={aboutActions.newFrame.bind(null, {
              location: 'about:adblock'
            }, true)} />
        </SettingItem>
      </SettingsList>
      <SitePermissionsPage siteSettings={this.props.siteSettings}
        names={braveryPermissionNames}
        defaults={this.props.braveryDefaults.merge({
          ledgerPaymentsShown: true, shieldsUp: true})
        } />
    </div>
  }
}

class SecurityTab extends ImmutableComponent {
  constructor (e) {
    super()
    this.clearBrowsingDataNow = this.clearBrowsingDataNow.bind(this)
  }
  clearBrowsingDataNow () {
    aboutActions.clearBrowsingDataNow({browserHistory: true})
  }
  onToggleFlash (e) {
    aboutActions.setResourceEnabled(flash, e.target.value)
    ipc.send(messages.PREFS_RESTART, flash, e.target.value)
  }
  onToggleWidevine (e) {
    aboutActions.setResourceEnabled(widevine, e.target.value)
  }
  render () {
    const lastPassPreferencesUrl = ('chrome-extension://' + extensionIds[passwordManagers.LAST_PASS] + '/tabDialog.html?dialog=preferences&cmd=open')

    const isLinux = navigator.appVersion.indexOf('Linux') !== -1

    return <div>
      <div className='sectionTitle' data-l10n-id='privateData' />
      <SettingsList dataL10nId='privateDataMessage'>
        <SettingCheckbox dataL10nId='browsingHistory' prefKey={settings.SHUTDOWN_CLEAR_HISTORY} settings={this.props.settings} onChangeSetting={this.props.onChangeSetting} />
        <SettingCheckbox dataL10nId='downloadHistory' prefKey={settings.SHUTDOWN_CLEAR_DOWNLOADS} settings={this.props.settings} onChangeSetting={this.props.onChangeSetting} />
        <SettingCheckbox dataL10nId='cachedImagesAndFiles' prefKey={settings.SHUTDOWN_CLEAR_CACHE} settings={this.props.settings} onChangeSetting={this.props.onChangeSetting} />
        <SettingCheckbox dataL10nId='allSiteCookies' prefKey={settings.SHUTDOWN_CLEAR_ALL_SITE_COOKIES} settings={this.props.settings} onChangeSetting={this.props.onChangeSetting} />
        <SettingCheckbox dataL10nId='autocompleteData' prefKey={settings.SHUTDOWN_CLEAR_AUTOCOMPLETE_DATA} settings={this.props.settings} onChangeSetting={this.props.onChangeSetting} />
        <SettingCheckbox dataL10nId='autofillData' prefKey={settings.SHUTDOWN_CLEAR_AUTOFILL_DATA} settings={this.props.settings} onChangeSetting={this.props.onChangeSetting} />
        <SettingCheckbox dataL10nId='savedSiteSettings' prefKey={settings.SHUTDOWN_CLEAR_SITE_SETTINGS} settings={this.props.settings} onChangeSetting={this.props.onChangeSetting} />
        <Button l10nId='clearBrowsingDataNow' className='primaryButton clearBrowsingDataButton' onClick={this.clearBrowsingDataNow} />
      </SettingsList>
      <div className='sectionTitle' data-l10n-id='passwordsAndForms' />
      <SettingsList>
        <SettingItem dataL10nId='passwordManager'>
          <select className='form-control'
            value={getSetting(settings.ACTIVE_PASSWORD_MANAGER, this.props.settings)}
            onChange={changeSetting.bind(null, this.props.onChangeSetting, settings.ACTIVE_PASSWORD_MANAGER)} >
            <option data-l10n-id='builtInPasswordManager' value={passwordManagers.BUILT_IN} />
            <option data-l10n-id='onePassword' value={passwordManagers.ONE_PASSWORD} />
            <option data-l10n-id='dashlane' value={passwordManagers.DASHLANE} />
            <option data-l10n-id='lastPass' value={passwordManagers.LAST_PASS} />
            <option data-l10n-id='doNotManageMyPasswords' value={passwordManagers.UNMANAGED} />
          </select>
        </SettingItem>
        {
          getSetting(settings.ACTIVE_PASSWORD_MANAGER, this.props.settings) === passwordManagers.BUILT_IN
          ? <label className='linkTextSmall' data-l10n-id='managePasswords'
            onClick={aboutActions.newFrame.bind(null, {
              location: 'about:passwords'
            }, true)} />
          : null
        }
        {
          getSetting(settings.ACTIVE_PASSWORD_MANAGER, this.props.settings) === passwordManagers.LAST_PASS
          ? <label className='linkTextSmall' data-l10n-id='preferences'
            onClick={aboutActions.newFrame.bind(null, {
              location: lastPassPreferencesUrl
            }, true)} />
          : null
        }
      </SettingsList>
      <div className='sectionTitle' data-l10n-id='autofillSettings' />
      <SettingsList>
        <SettingCheckbox dataL10nId='enableAutofill' prefKey={settings.AUTOFILL_ENABLED} settings={this.props.settings} onChangeSetting={this.props.onChangeSetting} />
        <Button l10nId='manageAutofillData' className='primaryButton manageAutofillDataButton'
          onClick={aboutActions.newFrame.bind(null, {
            location: 'about:autofill'
          }, true)} disabled={!getSetting(settings.AUTOFILL_ENABLED, this.props.settings)} />
      </SettingsList>
      <div className='sectionTitle' data-l10n-id='doNotTrackTitle' />
      <SettingsList>
        <SettingCheckbox dataL10nId='doNotTrack' prefKey={settings.DO_NOT_TRACK} settings={this.props.settings} onChangeSetting={this.props.onChangeSetting} />
      </SettingsList>
      <div className='sectionTitle' data-l10n-id='pluginSettings' />
      <SettingsList>
        <SettingCheckbox checked={this.props.flashInstalled ? this.props.braveryDefaults.get('flash') : false} dataL10nId='enableFlash' onChange={this.onToggleFlash} disabled={!this.props.flashInstalled} />
        <div className='subtext flashText'>
          {
            isDarwin || isWindows
              ? <div>
                <span className='fa fa-info-circle' id='flashInfoIcon' />
                <span data-l10n-id='enableFlashSubtext' />&nbsp;
                <span className='linkText' onClick={aboutActions.newFrame.bind(null, {
                  location: appConfig.flash.installUrl
                }, true)}>{'Adobe'}</span>.
                </div>
              : <div>
                <span className='fa fa-info-circle' id='flashInfoIcon' />
                <span data-l10n-id='enableFlashSubtextLinux' />
              </div>
          }
          <div>
            <span className='fa fa-info-circle' id='flashInfoIcon' />
            <span data-l10n-id='flashTroubleshooting' />&nbsp;
            <span className='linkText' onClick={aboutActions.newFrame.bind(null, {
              location: 'https://github.com/brave/browser-laptop/wiki/Flash-Support-Deprecation-Proposal#troubleshooting-flash-issues'
            }, true)}>{'wiki'}</span>.
          </div>
        </div>
      </SettingsList>
      { !isLinux
      ? <div>
        <div className='sectionTitle' data-l10n-id='widevineSection' />
        <SettingsList>
          <WidevineInfo newFrameAction={aboutActions.newFrame} />
          <SettingCheckbox checked={this.props.braveryDefaults.get('widevine')} dataL10nId='enableWidevine' onChange={this.onToggleWidevine} />
        </SettingsList>
      </div>
      : null
      }
      <SitePermissionsPage siteSettings={this.props.siteSettings} names={permissionNames} />
    </div>
  }
}

class AdvancedTab extends ImmutableComponent {
  render () {
    return <div>
      <div className='sectionTitle' data-l10n-id='contentSettings' />
      <SettingsList>
        <SettingCheckbox dataL10nId='useHardwareAcceleration' prefKey={settings.HARDWARE_ACCELERATION_ENABLED} settings={this.props.settings} onChangeSetting={this.props.onChangeSetting} />
        <SettingCheckbox dataL10nId='useSmoothScroll' prefKey={settings.SMOOTH_SCROLL_ENABLED} settings={this.props.settings} onChangeSetting={this.props.onChangeSetting} />
        <SettingCheckbox dataL10nId='sendCrashReports' prefKey={settings.SEND_CRASH_REPORTS} settings={this.props.settings} onChangeSetting={this.props.onChangeSetting} />
        <SettingCheckbox dataL10nId='sendUsageStatistics' prefKey={settings.SEND_USAGE_STATISTICS} settings={this.props.settings} onChangeSetting={this.props.onChangeSetting} />
      </SettingsList>
      <div className='sectionTitle' data-l10n-id='extensions' />
      <SettingsList>
        <SettingCheckbox dataL10nId='usePDFJS' prefKey={settings.PDFJS_ENABLED} settings={this.props.settings} onChangeSetting={this.props.onChangeSetting} />
        <SettingCheckbox dataL10nId='useTorrentViewer' prefKey={settings.TORRENT_VIEWER_ENABLED} settings={this.props.settings} onChangeSetting={this.props.onChangeSetting} />
        <SettingCheckbox dataL10nId='enablePocket' prefKey={settings.POCKET_ENABLED} settings={this.props.settings} onChangeSetting={this.props.onChangeSetting} />
        <SettingItem>
          <Button l10nId='viewInstalledExtensions' className='primaryButton viewExtensionsInfo'
            onClick={aboutActions.newFrame.bind(null, {
              location: 'about:extensions'
            }, true)} />
        </SettingItem>
        <div data-l10n-id='moreExtensionsComingSoon' className='moreExtensionsComingSoon' />
      </SettingsList>
    </div>
  }
}

class PreferenceNavigationButton extends ImmutableComponent {
  render () {
    return <div className={cx({
      selected: this.props.selected,
      [this.props.className]: !!this.props.className
    })}>
      <div onClick={this.props.onClick}
        className={cx({
          topBarButton: true,
          fa: true,
          [this.props.icon]: true
        })}>
        <i className={this.props.icon.replace('fa-', 'i-')} />
        <div className='tabMarkerText'
          data-l10n-id={this.props.dataL10nId} />
      </div>
      {
        this.props.selected
        ? <div className='tabMarkerContainer'>
          <div className='tabMarker' />
        </div>
        : null
      }
    </div>
  }
}

class HelpfulHints extends ImmutableComponent {
  render () {
    return <div className='helpfulHints'>
      <span className='hintsTitleContainer'>
        <span data-l10n-id='hintsTitle' />
        <span className='hintsRefresh fa fa-refresh'
          onClick={this.props.refreshHint} />
      </span>
      <div data-l10n-id={`hint${this.props.hintNumber}`} />
      <div className='helpfulHintsBottom'>
        <a data-l10n-id='sendUsFeedback' onClick={aboutActions.submitFeedback} />
      </div>
    </div>
  }
}

class PreferenceNavigation extends ImmutableComponent {
  render () {
    return <div className='prefAside'>
      <div />
      <PreferenceNavigationButton icon='fa-list-alt'
        dataL10nId='general'
        onClick={this.props.changeTab.bind(null, preferenceTabs.GENERAL)}
        selected={this.props.preferenceTab === preferenceTabs.GENERAL}
      />
      <PreferenceNavigationButton icon='fa-search'
        dataL10nId='search'
        onClick={this.props.changeTab.bind(null, preferenceTabs.SEARCH)}
        selected={this.props.preferenceTab === preferenceTabs.SEARCH}
      />
      <PreferenceNavigationButton icon='fa-bookmark-o'
        dataL10nId='tabs'
        onClick={this.props.changeTab.bind(null, preferenceTabs.TABS)}
        selected={this.props.preferenceTab === preferenceTabs.TABS}
      />
      <PreferenceNavigationButton icon='fa-lock'
        dataL10nId='security'
        onClick={this.props.changeTab.bind(null, preferenceTabs.SECURITY)}
        selected={this.props.preferenceTab === preferenceTabs.SECURITY}
      />
      <PreferenceNavigationButton icon='fa-user'
        dataL10nId='shields'
        onClick={this.props.changeTab.bind(null, preferenceTabs.SHIELDS)}
        selected={this.props.preferenceTab === preferenceTabs.SHIELDS}
      />
      <PreferenceNavigationButton icon='fa-bitcoin'
        dataL10nId='payments'
        onClick={this.props.changeTab.bind(null, preferenceTabs.PAYMENTS)}
        selected={this.props.preferenceTab === preferenceTabs.PAYMENTS}
      />
      <PreferenceNavigationButton icon='fa-refresh'
        className='notImplemented'
        dataL10nId='sync'
        onClick={this.props.changeTab.bind(null, preferenceTabs.SYNC)}
        selected={this.props.preferenceTab === preferenceTabs.SYNC}
      />
      <PreferenceNavigationButton icon='fa-server'
        dataL10nId='advanced'
        onClick={this.props.changeTab.bind(null, preferenceTabs.ADVANCED)}
        selected={this.props.preferenceTab === preferenceTabs.ADVANCED}
      />
      <HelpfulHints hintNumber={this.props.hintNumber} refreshHint={this.props.refreshHint} />
    </div>
  }
}

class AboutPreferences extends React.Component {
  constructor () {
    super()
    let hash = window.location.hash ? window.location.hash.slice(1) : ''
    this.state = {
      bitcoinOverlayVisible: false,
      qrcodeOverlayVisible: false,
      paymentHistoryOverlayVisible: false,
      advancedSettingsOverlayVisible: false,
      ledgerBackupOverlayVisible: false,
      ledgerRecoveryOverlayVisible: false,
      addFundsOverlayVisible: false,
      preferenceTab: hash.toUpperCase() in preferenceTabs ? hash : preferenceTabs.GENERAL,
      hintNumber: this.getNextHintNumber(),
      languageCodes: Immutable.Map(),
      flashInstalled: false,
      settings: Immutable.Map(),
      siteSettings: Immutable.Map(),
      braveryDefaults: Immutable.Map(),
      ledgerData: Immutable.Map(),
      firstRecoveryKey: '',
      secondRecoveryKey: ''
    }
    aboutActions.checkFlashInstalled()

    ipc.on(messages.SETTINGS_UPDATED, (e, settings) => {
      this.setState({ settings: Immutable.fromJS(settings || {}) })
    })
    ipc.on(messages.LEDGER_UPDATED, (e, ledgerData) => {
      this.setState({ ledgerData: Immutable.fromJS(ledgerData) })
    })
    ipc.on(messages.SITE_SETTINGS_UPDATED, (e, siteSettings) => {
      this.setState({ siteSettings: Immutable.fromJS(siteSettings || {}) })
    })
    ipc.on(messages.BRAVERY_DEFAULTS_UPDATED, (e, braveryDefaults) => {
      this.setState({ braveryDefaults: Immutable.fromJS(braveryDefaults || {}) })
    })
    ipc.on(messages.FLASH_UPDATED, (e, flashInstalled) => {
      this.setState({ flashInstalled })
    })
    ipc.on(messages.LANGUAGE, (e, {langCode, languageCodes}) => {
      this.setState({ languageCodes })
    })
    ipc.send(messages.REQUEST_LANGUAGE)
    this.onChangeSetting = this.onChangeSetting.bind(this)
  }

  changeTab (preferenceTab) {
    window.location.hash = preferenceTab.toLowerCase()
    this.setState({
      preferenceTab
    })
  }

  refreshHint () {
    this.setState({
      hintNumber: this.getNextHintNumber()
    })
  }

  getNextHintNumber () {
    // Try for a new random number at most 10 times.
    // Avoiding the same tip twice is good because people may think the
    // refresh button is broken.
    let newNumber
    for (let i = 0; i < 10; ++i) {
      newNumber = Math.random() * hintCount | 0
      if (!this.state || newNumber !== this.state.hintNumber) {
        break
      }
    }
    return newNumber
  }

  onChangeSetting (key, value) {
    this.setState({
      settings: this.state.settings.set(key, value)
    })
    aboutActions.changeSetting(key, value)
    if (key === settings.DO_NOT_TRACK || key === settings.HARDWARE_ACCELERATION_ENABLED ||
        key === settings.PDFJS_ENABLED || key === settings.TORRENT_VIEWER_ENABLED ||
        key === settings.SMOOTH_SCROLL_ENABLED || key === settings.SEND_CRASH_REPORTS) {
      ipc.send(messages.PREFS_RESTART, key, value)
    }
    if (key === settings.PAYMENTS_ENABLED) {
      this.onChangeSetting(settings.PAYMENTS_NOTIFICATIONS, value)
      if (value === true) {
        this.createWallet()
      }
    }
  }

  setOverlayVisible (isVisible, overlayName) {
    let stateDiff = {}
    stateDiff[`${overlayName}OverlayVisible`] = isVisible
    if (overlayName === 'addFunds' && isVisible === false) {
      // Hide the child overlays when the parent is closed
      stateDiff['bitcoinOverlayVisible'] = false
      stateDiff['qrcodeOverlayVisible'] = false
    }
    this.setState(stateDiff)
    // Tell ledger when Add Funds overlay is closed
    if (isVisible === false && overlayName === 'addFunds') {
      ipc.send(messages.ADD_FUNDS_CLOSED)
    }
  }

  createWallet () {
    if (this.state.ledgerData && !this.state.ledgerData.get('created')) {
      aboutActions.createWallet()
    }
  }

  render () {
    let tab
    const settings = this.state.settings
    const siteSettings = this.state.siteSettings
    const braveryDefaults = this.state.braveryDefaults
    const languageCodes = this.state.languageCodes
    const ledgerData = this.state.ledgerData
    switch (this.state.preferenceTab) {
      case preferenceTabs.GENERAL:
        tab = <GeneralTab settings={settings} onChangeSetting={this.onChangeSetting} languageCodes={languageCodes} />
        break
      case preferenceTabs.SEARCH:
        tab = <SearchTab settings={settings} onChangeSetting={this.onChangeSetting} />
        break
      case preferenceTabs.TABS:
        tab = <TabsTab settings={settings} onChangeSetting={this.onChangeSetting} />
        break
      case preferenceTabs.SYNC:
        tab = <SyncTab settings={settings} onChangeSetting={this.onChangeSetting} />
        break
      case preferenceTabs.SHIELDS:
        tab = <ShieldsTab settings={settings} siteSettings={siteSettings} braveryDefaults={braveryDefaults} onChangeSetting={this.onChangeSetting} />
        break
      case preferenceTabs.PAYMENTS:
        tab = <PaymentsTab settings={settings} siteSettings={siteSettings}
          braveryDefaults={braveryDefaults} ledgerData={ledgerData}
          onChangeSetting={this.onChangeSetting}
          firstRecoveryKey={this.state.firstRecoveryKey}
          secondRecoveryKey={this.state.secondRecoveryKey}
          bitcoinOverlayVisible={this.state.bitcoinOverlayVisible}
          qrcodeOverlayVisible={this.state.qrcodeOverlayVisible}
          paymentHistoryOverlayVisible={this.state.paymentHistoryOverlayVisible}
          advancedSettingsOverlayVisible={this.state.advancedSettingsOverlayVisible}
          ledgerBackupOverlayVisible={this.state.ledgerBackupOverlayVisible}
          ledgerRecoveryOverlayVisible={this.state.ledgerRecoveryOverlayVisible}
          addFundsOverlayVisible={this.state.addFundsOverlayVisible}
          showOverlay={this.setOverlayVisible.bind(this, true)}
          hideOverlay={this.setOverlayVisible.bind(this, false)} />
        break
      case preferenceTabs.SECURITY:
        tab = <SecurityTab settings={settings} siteSettings={siteSettings} braveryDefaults={braveryDefaults} flashInstalled={this.state.flashInstalled} onChangeSetting={this.onChangeSetting} />
        break
      case preferenceTabs.ADVANCED:
        tab = <AdvancedTab settings={settings} onChangeSetting={this.onChangeSetting} />
        break
    }
    return <div>
      <PreferenceNavigation preferenceTab={this.state.preferenceTab} hintNumber={this.state.hintNumber}
        changeTab={this.changeTab.bind(this)}
        refreshHint={this.refreshHint.bind(this)}
        getNextHintNumber={this.getNextHintNumber.bind(this)} />
      <div className='prefBody'>
        <div className='prefTabContainer'>
          {tab}
        </div>
      </div>
    </div>
  }
}

function formattedDateFromTimestamp (timestamp) {
  return moment(new Date(timestamp)).format('YYYY-MM-DD')
}

function formattedTimeFromTimestamp (timestamp) {
  return moment(new Date(timestamp)).format('hh:mm a')
}

function formattedTimeFromNow (timestamp) {
  return moment(new Date(timestamp)).fromNow()
}

module.exports = <AboutPreferences />
