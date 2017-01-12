/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

// Note that these are webpack requires, not CommonJS node requiring requires
const React = require('react')
const ImmutableComponent = require('../components/immutableComponent')
const Immutable = require('immutable')
const SwitchControl = require('../components/switchControl')
const ModalOverlay = require('../components/modalOverlay')
const cx = require('../lib/classSet')
const ledgerExportUtil = require('../../app/common/lib/ledgerExportUtil')
const addExportFilenamePrefixToTransactions = ledgerExportUtil.addExportFilenamePrefixToTransactions
const appUrlUtil = require('../lib/appUrlUtil')
const aboutUrls = appUrlUtil.aboutUrls
const aboutContributionsUrl = aboutUrls.get('about:contributions')

const {getZoomValuePercentage} = require('../lib/zoom')

const config = require('../constants/config')
const appConfig = require('../constants/appConfig')
const preferenceTabs = require('../constants/preferenceTabs')
const messages = require('../constants/messages')
const settings = require('../constants/settings')
const coinbaseCountries = require('../constants/coinbaseCountries')
const getSymbolFromCurrency = require('currency-symbol-map').getSymbolFromCurrency
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

const ipc = window.chrome.ipcRenderer

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
        html: <div className='site'>{verified ? this.getVerifiedIcon() : null}<a href={publisherURL} target='_blank'>{faviconURL ? <img src={faviconURL} alt={site} /> : <span className='fa fa-file-o' />}<span>{site}</span></a></div>,
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
    return <div className='ledgerTable'>
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
  }
  get ledgerData () {
    return this.props.ledgerData
  }
  get bitcoinOverlayContent () {
    return <iframe src={this.ledgerData.get('buyURL')} />
  }
  get bitcoinPurchaseButton () {
    if (!this.ledgerData.get('buyURLFrame')) return <Button l10nId='add' className='primaryButton' onClick={this.props.showOverlay.bind(this)} />
    return <a href={this.ledgerData.get('buyURL')} target='_blank' onClick={this.openBuyURLTab}><Button l10nId='add' className='primaryButton' /></a>
  }
  get qrcodeOverlayContent () {
    return <div>
      <img src={this.ledgerData.get('paymentIMG')} title='Brave wallet QR code' />
      <div className='bitcoinQRTitle' data-l10n-id='bitcoinQR' />
    </div>
  }
  get qrcodeOverlayFooter () {
    if (coinbaseCountries.indexOf(this.props.ledgerData.get('countryCode')) > -1) {
      return <div className='qrcodeOverlayFooter'>
        <div className='coinbaseLogo' />
        <a target='_blank' className='appstoreLogo' href='https://itunes.apple.com/us/app/coinbase-bitcoin-wallet/id886427730?mt=8' />
        <a target='_blank' className='playstoreLogo' href='https://play.google.com/store/apps/details?id=com.coinbase.android' />
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
        <a target='_blank' href='https://www.buybitcoinworldwide.com/'>
          <button className='browserButton primaryButton'>buybitcoinworldwide.com</button>
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
          <div className='settingsListTitle subTitle' data-l10n-id='moneyAddSubTitle' />
        </div>
        <div className='settingsPanelDivider'>
          {this.bitcoinPurchaseButton}
          <div className='settingsListTitle subTitle' data-l10n-id='transferTime' />
        </div>
      </div>
    } else {
      return <div className='panel disabledPanel'>
        <div className='settingsPanelDivider'>
          <span className='fa fa-credit-card' />
          <div className='settingsListTitle' data-l10n-id='moneyAdd' />
          <div className='settingsListTitle subTitle' data-l10n-id='moneyAddSubTitle' />
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
          <a target='_blank' href={url}>
            <button className='browserButton primaryButton'>{name}</button>
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
        <Button l10nId='done' className='whiteButton' onClick={this.props.hideParentOverlay} />
      </div>
    } else if (coinbaseCountries.indexOf(this.props.ledgerData.get('countryCode')) > -1) {
      return <div className='panelFooter coinbaseFooter'>
        <div className='coinbase'>
          <div className='coinbaseLogo' />
          <span className='coinbaseMessage' data-l10n-id='coinbaseMessage' />
        </div>
        <Button l10nId='done' className='whiteButton' onClick={this.props.hideParentOverlay} />
      </div>
    } else {
      return <div className='panelFooter'>
        <Button l10nId='done' className='whiteButton' onClick={this.props.hideParentOverlay} />
      </div>
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
    return <div className='bitcoinDashboard'>
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
      <div className='board addFundsBoard'>
        {
          (this.userInAmerica || this.ledgerData.get('buyURLFrame'))
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
            <div className='settingsListTitle subTitle' data-l10n-id='bitcoinAddDescription' />
          </div>
          {
            this.ledgerData.get('address')
              ? <div className='settingsPanelDivider'>
                {
                  this.ledgerData.get('hasBitcoinHandler') && this.ledgerData.get('paymentURL')
                    ? <div className='hasBitcoinHandler'>
                      <a href={this.ledgerData.get('paymentURL')} target='_blank'>
                        <Button l10nId='bitcoinVisitAccount' className='primaryButton bitcoinAddressButton' />
                      </a>
                      <div data-l10n-id='bitcoinAddress' className='walletLabelText' />
                    </div>
                    : <div>
                      <div data-l10n-id='bitcoinPaymentURL' className='walletLabelText' />
                    </div>
                }
                <div className='walletAddressText'>{this.ledgerData.get('address')}</div>
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

    return <div className='paymentHistoryTable'>
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

  render () {
    var date = this.formattedDate
    var totalAmountStr = `${getSymbolFromCurrency(this.currency)} ${this.totalAmount}`

    return <tr>
      <td className='narrow' data-sort={this.timestamp}>{date}</td>
      <td className='wide' data-sort={this.satoshis}>{totalAmountStr}</td>
      <td className='wide'>
        <a href={aboutContributionsUrl + '#' + this.viewingId} target='_blank'>{this.receiptFileName}</a>
      </td>
    </tr>
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

    return <div className='balance'>
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
          <div className='minimumPageTimeSetting' data-l10n-id='minimumPageTimeSetting' />
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
          <div className='minimumVisitsSetting' data-l10n-id='minimumVisitsSetting' />
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
            ? <SettingsList>
              <SettingCheckbox
                dataL10nId='minimumPercentage'
                prefKey={settings.MINIMUM_PERCENTAGE}
                settings={this.props.settings}
                onChangeSetting={this.props.onChangeSetting} />
              <SettingCheckbox
                dataL10nId='notifications'
                prefKey={settings.PAYMENTS_NOTIFICATIONS}
                settings={this.props.settings}
                onChangeSetting={this.props.onChangeSetting} />
            </SettingsList>
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
      <div className='panel ledgerBackupContent'>
        <span data-l10n-id='ledgerBackupContent' />
        <div className='copyKeyContainer'>
          <div className='copyContainer'>
            <Button l10nId='copy' className='copyButton whiteButton' onClick={this.copyToClipboard.bind(this, paymentId)} />
          </div>
          <div className='keyContainer'>
            <h3 data-l10n-id='firstKey' />
            <span>{paymentId}</span>
          </div>
        </div>
        <div className='copyKeyContainer'>
          <div className='copyContainer'>
            <Button l10nId='copy' className='copyButton whiteButton' onClick={this.copyToClipboard.bind(this, passphrase)} />
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
        <div className='ledgerRecoveryContent' data-l10n-id='ledgerRecoveryContent' />
        <SettingsList>
          <SettingItem>
            <h3 data-l10n-id='firstRecoveryKey' />
            <input className='form-control firstRecoveryKey' onChange={this.handleFirstRecoveryKeyChange} type='text' />
            <h3 data-l10n-id='secondRecoveryKey' />
            <input className='form-control secondRecoveryKey' onChange={this.handleSecondRecoveryKeyChange} type='text' />
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
    const currency = getSymbolFromCurrency(this.props.ledgerData.get('currency')) || getSymbolFromCurrency('USD')
    if (balance === 0) {
      return `${currency} 0`
    }
    if (this.props.ledgerData.get('btc') && typeof this.props.ledgerData.get('amount') === 'number') {
      const btcValue = this.props.ledgerData.get('btc') / this.props.ledgerData.get('amount')
      return `${currency} ${(balance / btcValue).toFixed(2)}`
    }
    return `${balance} BTC`
  }

  get disabledContent () {
    return <div className='disabledContent'>
      <div className='paymentsMessage'>
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
      <div className='paymentsSidebar'>
        <h2 data-l10n-id='paymentsSidebarText1' />
        <div data-l10n-id='paymentsSidebarText2' />
        <a href='https://www.privateinternetaccess.com/' target='_blank'><div className='paymentsSidebarPIA' /></a>
        <div data-l10n-id='paymentsSidebarText3' />
        <a href='https://www.bitgo.com/' target='_blank'><div className='paymentsSidebarBitgo' /></a>
        <div data-l10n-id='paymentsSidebarText4' />
        <a href='https://www.coinbase.com/' target='_blank'><div className='paymentsSidebarCoinbase' /></a>
      </div>
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
                    <select className='form-control fundsSelectBox'
                      value={getSetting(settings.PAYMENTS_CONTRIBUTION_AMOUNT,
                        this.props.settings)}
                      onChange={changeSetting.bind(null, this.props.onChangeSetting, settings.PAYMENTS_CONTRIBUTION_AMOUNT)} >
                      {
                        [5, 10, 15, 20].map((amount) =>
                          <option value={amount}>{getSymbolFromCurrency(this.props.ledgerData.get('currency')) || getSymbolFromCurrency('USD')} {amount}</option>
                        )
                      }
                    </select>
                  </SettingItem>
                  <SettingItem>
                    {this.paymentHistoryButton}
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
                        </SettingItem>
                      </SettingsList>
                    </div>
                }
              </td>
              <td>
                <div className='walletStatus' data-l10n-id={this.walletStatus.id} data-l10n-args={this.walletStatus.args ? JSON.stringify(this.walletStatus.args) : null} />
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
    return <div className='paymentsContainer'>
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
        <div className='paymentsSwitches'>
          <div className='enablePaymentsSwitch'>
            <span data-l10n-id='off' />
            <SettingCheckbox dataL10nId='on' prefKey={settings.PAYMENTS_ENABLED} settings={this.props.settings} onChangeSetting={this.props.onChangeSetting} />
          </div>
          { this.props.ledgerData.get('created') && this.enabled ? <Button l10nId='advancedSettings' className='advancedSettings whiteButton' onClick={this.props.showOverlay.bind(this, 'advancedSettings')} /> : null }
        </div>
      </div>
      {
        this.enabled
          ? this.enabledContent
          : this.disabledContent
      }
    </div>
  }
}

class SyncTab extends ImmutableComponent {
  get enabled () {
    return getSetting(settings.SYNC_ENABLED, this.props.settings)
  }

  render () {
    return <div id='syncContainer'>
      <div className='sectionTitle' data-l10n-id='syncTitle' />
      <div className='settingsListContainer'>
        <span className='settingsListTitle syncTitleMessage' data-l10n-id='syncTitleMessage' />
        <a href='https://github.com/brave/sync/wiki/Design' target='_blank'>
          <span className='fa fa-question-circle fundsFAQ' />
        </a>
        <div className='settingsList'>
          <SettingCheckbox dataL10nId='syncEnable' prefKey={settings.SYNC_ENABLED} settings={this.props.settings} onChangeSetting={this.props.onChangeSetting} />
        </div>
      </div>
      {
        this.enabled
          ? <div id='syncData'><div className='sectionTitle' data-l10n-id='syncData' />
            <SettingsList dataL10nId='syncDataMessage'>
              <SettingCheckbox dataL10nId='syncBookmarks' prefKey={settings.SYNC_TYPE_BOOKMARK} settings={this.props.settings} onChangeSetting={this.props.onChangeSetting} />
              <SettingCheckbox dataL10nId='syncSiteSettings' prefKey={settings.SYNC_TYPE_SITE_SETTING} settings={this.props.settings} onChangeSetting={this.props.onChangeSetting} />
              <SettingCheckbox dataL10nId='syncHistory' prefKey={settings.SYNC_TYPE_HISTORY} settings={this.props.settings} onChangeSetting={this.props.onChangeSetting} />
            </SettingsList>
          </div>
          : null
      }
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
        <Button l10nId='manageAdblockSettings' className='primaryButton manageAdblockSettings'
          onClick={aboutActions.newFrame.bind(null, {
            location: 'about:adblock'
          }, true)} />
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
  }
  onToggleWidevine (e) {
    aboutActions.setResourceEnabled(widevine, e.target.value)
  }
  render () {
    const lastPassPreferencesUrl = ('chrome-extension://' + extensionIds[passwordManagers.LAST_PASS] + '/tabDialog.html?dialog=preferences&cmd=open')
    const isLinux = navigator.appVersion.indexOf('Linux') !== -1
    const flashInstalled = getSetting(settings.FLASH_INSTALLED, this.props.settings)

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
        <SettingCheckbox checked={flashInstalled ? this.props.braveryDefaults.get('flash') : false} dataL10nId='enableFlash' onChange={this.onToggleFlash} disabled={!flashInstalled} />
        <div className='subtext flashText'>
          {
            isDarwin || isWindows
              ? <div>
                <span className='fa fa-info-circle flashInfoIcon' />
                <span data-l10n-id='enableFlashSubtext' />&nbsp;
                <span className='linkText' onClick={aboutActions.newFrame.bind(null, {
                  location: appConfig.flash.installUrl
                }, true)} title={appConfig.flash.installUrl}>{'Adobe'}</span>.
              </div>
              : <div>
                <span className='fa fa-info-circle flashInfoIcon' />
                <span data-l10n-id='enableFlashSubtextLinux' />
              </div>
          }
          <div>
            <span className='fa fa-info-circle flashInfoIcon' />
            <span data-l10n-id='flashTroubleshooting' />&nbsp;
            <span className='linkText' onClick={aboutActions.newFrame.bind(null, {
              location: 'https://github.com/brave/browser-laptop/wiki/Flash-Support-Deprecation-Proposal#troubleshooting-flash-issues'
            }, true)} title='https://github.com/brave/browser-laptop/wiki/Flash-Support-Deprecation-Proposal#troubleshooting-flash-issues'>{'wiki'}</span>.
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
        <Button l10nId='viewInstalledExtensions' className='primaryButton viewExtensionsInfo'
          onClick={aboutActions.newFrame.bind(null, {
            location: 'about:extensions'
          }, true)} />
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
        <a target='_blank' href='https://community.brave.com/' data-l10n-id='submitFeedback' />
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
      <PreferenceNavigationButton icon='fa-brave-sync'
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
    this.state = {
      bitcoinOverlayVisible: false,
      qrcodeOverlayVisible: false,
      paymentHistoryOverlayVisible: false,
      advancedSettingsOverlayVisible: false,
      ledgerBackupOverlayVisible: false,
      ledgerRecoveryOverlayVisible: false,
      addFundsOverlayVisible: false,
      preferenceTab: this.tabFromCurrentHash,
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
    ipc.on(messages.LANGUAGE, (e, {langCode, languageCodes}) => {
      this.setState({ languageCodes })
    })
    ipc.send(messages.REQUEST_LANGUAGE)
    this.onChangeSetting = this.onChangeSetting.bind(this)
    this.updateTabFromAnchor = this.updateTabFromAnchor.bind(this)
  }

  componentDidMount () {
    window.addEventListener('popstate', this.updateTabFromAnchor)
  }

  componentWillUnmount () {
    window.removeEventListener('popstate', this.updateTabFromAnchor)
  }

  updateTabFromAnchor () {
    this.setState({
      preferenceTab: this.tabFromCurrentHash
    })
  }

  get hash () {
    return window.location.hash ? window.location.hash.slice(1) : ''
  }

  get tabFromCurrentHash () {
    return this.hash.toUpperCase() in preferenceTabs ? this.hash : preferenceTabs.GENERAL
  }

  changeTab (preferenceTab) {
    window.location.hash = preferenceTab.toLowerCase()
    this.updateTabFromAnchor()
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
    if (key === settings.HARDWARE_ACCELERATION_ENABLED ||
        key === settings.DO_NOT_TRACK ||
        key === settings.LANGUAGE ||
        (key === settings.SYNC_ENABLED && value === true) ||
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
        tab = <SecurityTab settings={settings} siteSettings={siteSettings} braveryDefaults={braveryDefaults} onChangeSetting={this.onChangeSetting} />
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

function formattedTimeFromNow (timestamp) {
  return moment(new Date(timestamp)).fromNow()
}

module.exports = <AboutPreferences />
