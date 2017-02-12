/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

// Note that these are webpack requires, not CommonJS node requiring requires
const React = require('react')
const ImmutableComponent = require('../components/immutableComponent')
const Immutable = require('immutable')
const UrlUtil = require('../lib/urlutil')

// Components
const ModalOverlay = require('../components/modalOverlay')
const {SettingsList, SettingItem, SettingCheckbox, SiteSettingCheckbox} = require('../../app/renderer/components/settings')
const {SettingTextbox} = require('../../app/renderer/components/textbox')
const {SettingDropdown} = require('../../app/renderer/components/dropdown')
const Button = require('../components/button')

// Tabs
const PaymentsTab = require('../../app/renderer/components/preferences/paymentsTab')

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
const {changeSetting} = require('../../app/renderer/lib/settingsUtil')
const coinbaseCountries = require('../constants/coinbaseCountries')
const {passwordManagers, extensionIds} = require('../constants/passwordManagers')
const {startsWithOption, newTabMode, bookmarksToolbarMode, tabCloseAction, fullscreenOption} = require('../../app/common/constants/settingsEnums')

const WidevineInfo = require('../../app/renderer/components/widevineInfo')
const aboutActions = require('./aboutActions')
const getSetting = require('../settings').getSetting
const SortableTable = require('../components/sortableTable')
const searchProviders = require('../data/searchProviders')
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
    return <span className={cx({
      verified: true,
      disabled: !this.enabledForSite(synopsis)
    })} />
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

  banSite (hostPattern) {
    aboutActions.changeSiteSetting(hostPattern, 'ledgerPaymentsShown', false)
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
      {
        html: <div className='neverShowSiteIcon' onClick={this.banSite.bind(this, this.getHostPattern(synopsis))}><span className='fa fa-ban' /></div>,
        value: ''
      },
      rank,
      {
        html: <div className='site'>{verified ? this.getVerifiedIcon(synopsis) : null}<a href={publisherURL} target='_blank'>{faviconURL ? <img src={faviconURL} alt={site} /> : <span className='fa fa-file-o' />}<span>{site}</span></a></div>,
        value: site
      },
      {
        html: <SiteSettingCheckbox small hostPattern={this.getHostPattern(synopsis)} defaultValue={defaultSiteSetting} prefKey='ledgerPayments' siteSettings={this.props.siteSettings} checked={this.enabledForSite(synopsis)} />,
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
      <div className='hideExcludedSites'>
        <SettingCheckbox small
          dataL10nId='hideExcluded'
          prefKey={settings.HIDE_EXCLUDED_SITES}
          settings={this.props.settings}
          onChangeSetting={this.props.onChangeSetting}
        />
      </div>
      <SortableTable
        headings={['remove', 'rank', 'publisher', 'include', 'views', 'timeSpent', 'percentage']}
        defaultHeading='rank'
        columnClassNames={['', 'alignRight', '', '', 'alignRight', 'alignRight', 'alignRight']}
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
        rows={this.synopsis.filter((synopsis) => {
          return !getSetting(settings.HIDE_EXCLUDED_SITES, this.props.settings) || this.enabledForSite(synopsis)
        }).map((synopsis) => {
          return this.getRow(synopsis)
        }).toJS()}
        />
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
    var totalAmountStr = `${this.totalAmount} ${this.currency}`

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
      const punycodeUrl = UrlUtil.getPunycodeUrl(homepageValue)
      if (punycodeUrl.replace(/\/$/, '') !== homepageValue) {
        homepageValue = UrlUtil.getPunycodeUrl(homepageValue)
      }
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
          <SettingDropdown value={getSetting(settings.STARTUP_MODE, this.props.settings)}
            onChange={changeSetting.bind(null, this.props.onChangeSetting, settings.STARTUP_MODE)}>
            <option data-l10n-id='startsWithOptionLastTime' value={startsWithOption.WINDOWS_TABS_FROM_LAST_TIME} />
            <option data-l10n-id='startsWithOptionHomePage' value={startsWithOption.HOMEPAGE} />
            <option data-l10n-id='startsWithOptionNewTabPage' value={startsWithOption.NEW_TAB_PAGE} />
          </SettingDropdown>
        </SettingItem>
        <SettingItem dataL10nId='newTabMode'>
          <SettingDropdown value={getSetting(settings.NEWTAB_MODE, this.props.settings)}
            onChange={changeSetting.bind(null, this.props.onChangeSetting, settings.NEWTAB_MODE)} >
            <option data-l10n-id='newTabNewTabPage' value={newTabMode.NEW_TAB_PAGE} />
            <option data-l10n-id='newTabHomePage' value={newTabMode.HOMEPAGE} />
            <option data-l10n-id='newTabDefaultSearchEngine' value={newTabMode.DEFAULT_SEARCH_ENGINE} />
            <option data-l10n-id='newTabEmpty' value={newTabMode.EMPTY_NEW_TAB} />
          </SettingDropdown>
        </SettingItem>
        <div className='iconTitle'>
          <span data-l10n-id='myHomepage' />
          <span className='fa fa-info-circle iconLink' onClick={aboutActions.newFrame.bind(null, {
            location: 'https://github.com/brave/browser-laptop/wiki/End-User-FAQ#how-to-set-up-multiple-home-pages'
          }, true)}
            data-l10n-id='multipleHomePages' />
        </div>
        <SettingItem>
          <SettingTextbox
            spellCheck='false'
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
          <SettingDropdown id='bookmarksBarSelect' value={getSetting(settings.BOOKMARKS_TOOLBAR_MODE, this.props.settings)}
            onChange={changeSetting.bind(null, this.props.onChangeSetting, settings.BOOKMARKS_TOOLBAR_MODE)}>
            <option data-l10n-id='bookmarksBarTextOnly' value={bookmarksToolbarMode.TEXT_ONLY} />
            <option data-l10n-id='bookmarksBarTextAndFavicon' value={bookmarksToolbarMode.TEXT_AND_FAVICONS} />
            <option data-l10n-id='bookmarksBarFaviconOnly' value={bookmarksToolbarMode.FAVICONS_ONLY} />
          </SettingDropdown>
          <SettingCheckbox id='bookmarksBarSwitch' dataL10nId='bookmarkToolbar'
            prefKey={settings.SHOW_BOOKMARKS_TOOLBAR} settings={this.props.settings}
            onChangeSetting={this.props.onChangeSetting} />
        </SettingItem>
        <SettingItem dataL10nId='selectedLanguage'>
          <SettingDropdown value={getSetting(settings.LANGUAGE, this.props.settings) || defaultLanguage}
            onChange={changeSetting.bind(null, this.props.onChangeSetting, settings.LANGUAGE)}>
            {languageOptions}
          </SettingDropdown>
        </SettingItem>
        <SettingItem dataL10nId='defaultZoomLevel'>
          <SettingDropdown
            value={defaultZoomSetting === undefined || defaultZoomSetting === null ? config.zoom.defaultValue : defaultZoomSetting}
            data-type='float'
            onChange={changeSetting.bind(null, this.props.onChangeSetting, settings.DEFAULT_ZOOM_LEVEL)}>
            {
              config.zoom.zoomLevels.map((x) =>
                <option value={x} key={x}>{getZoomValuePercentage(x) + '%'}</option>)
            }
          </SettingDropdown>
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
          <SettingDropdown
            value={getSetting(settings.TABS_PER_PAGE, this.props.settings)}
            data-type='number'
            onChange={changeSetting.bind(null, this.props.onChangeSetting, settings.TABS_PER_PAGE)}>
            {
              // Sorry, Brad says he hates primes :'(
              [6, 8, 10, 20].map((x) =>
                <option value={x} key={x}>{x}</option>)
            }
          </SettingDropdown>
        </SettingItem>
        <SettingItem dataL10nId='tabCloseAction'>
          <SettingDropdown
            value={getSetting(settings.TAB_CLOSE_ACTION, this.props.settings)}
            onChange={changeSetting.bind(null, this.props.onChangeSetting, settings.TAB_CLOSE_ACTION)}>
            <option data-l10n-id='tabCloseActionLastActive' value={tabCloseAction.LAST_ACTIVE} />
            <option data-l10n-id='tabCloseActionNext' value={tabCloseAction.NEXT} />
            <option data-l10n-id='tabCloseActionParent' value={tabCloseAction.PARENT} />
          </SettingDropdown>
        </SettingItem>
        <SettingCheckbox dataL10nId='switchToNewTabs' prefKey={settings.SWITCH_TO_NEW_TABS} settings={this.props.settings} onChangeSetting={this.props.onChangeSetting} />
        <SettingCheckbox dataL10nId='paintTabs' prefKey={settings.PAINT_TABS} settings={this.props.settings} onChangeSetting={this.props.onChangeSetting} />
        <SettingCheckbox dataL10nId='showTabPreviews' prefKey={settings.SHOW_TAB_PREVIEWS} settings={this.props.settings} onChangeSetting={this.props.onChangeSetting} />
        <SettingItem dataL10nId='dashboardSettingsTitle'>
          <SettingCheckbox dataL10nId='dashboardShowImages' prefKey={settings.SHOW_DASHBOARD_IMAGES} settings={this.props.settings} onChangeSetting={this.props.onChangeSetting} />
        </SettingItem>
      </SettingsList>
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
          <SettingDropdown
            value={this.props.braveryDefaults.get('adControl')}
            onChange={this.onChangeAdControl}>
            <option data-l10n-id='showBraveAds' value='showBraveAds' />
            <option data-l10n-id='blockAds' value='blockAds' />
            <option data-l10n-id='allowAdsAndTracking' value='allowAdsAndTracking' />
          </SettingDropdown>
        </SettingItem>
        <SettingItem dataL10nId='cookieControl'>
          <SettingDropdown
            value={this.props.braveryDefaults.get('cookieControl')}
            onChange={this.onChangeCookieControl}>
            <option data-l10n-id='block3rdPartyCookie' value='block3rdPartyCookie' />
            <option data-l10n-id='allowAllCookies' value='allowAllCookies' />
          </SettingDropdown>
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
    aboutActions.clearBrowsingDataNow()
  }
  onToggleFlash (e) {
    aboutActions.setResourceEnabled(flash, e.target.value)
    if (e.target.value !== true) {
      // When flash is disabled, clear flash approvals
      aboutActions.clearSiteSettings('flash', {
        temporary: true
      })
      aboutActions.clearSiteSettings('flash', {
        temporary: false
      })
    }
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
          <SettingDropdown
            value={getSetting(settings.ACTIVE_PASSWORD_MANAGER, this.props.settings)}
            onChange={changeSetting.bind(null, this.props.onChangeSetting, settings.ACTIVE_PASSWORD_MANAGER)} >
            <option data-l10n-id='builtInPasswordManager' value={passwordManagers.BUILT_IN} />
            <option data-l10n-id='onePassword' value={passwordManagers.ONE_PASSWORD} />
            <option data-l10n-id='dashlane' value={passwordManagers.DASHLANE} />
            <option data-l10n-id='lastPass' value={passwordManagers.LAST_PASS} />
            { /* <option data-l10n-id='enpass' value={passwordManagers.ENPASS} /> */ }
            <option data-l10n-id='doNotManageMyPasswords' value={passwordManagers.UNMANAGED} />
          </SettingDropdown>
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
      <div className='sectionTitle' data-l10n-id='fullscreenContent' />
      <SettingsList>
        <SettingItem>
          <SettingDropdown
            value={getSetting(settings.FULLSCREEN_CONTENT, this.props.settings)}
            onChange={changeSetting.bind(null, this.props.onChangeSetting, settings.FULLSCREEN_CONTENT)}>
            <option data-l10n-id='alwaysAsk' value={fullscreenOption.ALWAYS_ASK} />
            <option data-l10n-id='alwaysAllow' value={fullscreenOption.ALWAYS_ALLOW} />
          </SettingDropdown>
        </SettingItem>
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

  hideAdvancedOverlays () {
    this.setState({
      advancedSettingsOverlayVisible: false,
      ledgerBackupOverlayVisible: false,
      ledgerRecoveryOverlayVisible: false
    })
    this.forceUpdate()
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
          hideOverlay={this.setOverlayVisible.bind(this, false)}
          hideAdvancedOverlays={this.hideAdvancedOverlays.bind(this)} />
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

module.exports = {
  AboutPreferences: <AboutPreferences />,
  BitcoinDashboard,
  LedgerTable,
  PaymentHistory
}
