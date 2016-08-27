/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

// Note that these are webpack requires, not CommonJS node requiring requires
const React = require('react')
const ImmutableComponent = require('../components/immutableComponent')
const Immutable = require('immutable')
const SwitchControl = require('../components/switchControl')
const ModalOverlay = require('../components/modalOverlay')
const cx = require('../lib/classSet.js')
const { getZoomValuePercentage } = require('../lib/zoom')
const config = require('../constants/config')
const appConfig = require('../constants/appConfig')
const preferenceTabs = require('../constants/preferenceTabs')
const messages = require('../constants/messages')
const settings = require('../constants/settings')
const {passwordManagers, extensionIds} = require('../constants/passwordManagers')
const aboutActions = require('./aboutActions')
const getSetting = require('../settings').getSetting
const SortableTable = require('../components/sortableTable')
const Button = require('../components/button')
const searchProviders = require('../data/searchProviders')
const pad = require('underscore.string/pad')

const adblock = appConfig.resourceNames.ADBLOCK
const cookieblock = appConfig.resourceNames.COOKIEBLOCK
const adInsertion = appConfig.resourceNames.AD_INSERTION
const trackingProtection = appConfig.resourceNames.TRACKING_PROTECTION
const httpsEverywhere = appConfig.resourceNames.HTTPS_EVERYWHERE
const safeBrowsing = appConfig.resourceNames.SAFE_BROWSING
const noScript = appConfig.resourceNames.NOSCRIPT
const flash = appConfig.resourceNames.FLASH

const isDarwin = navigator.platform === 'MacIntel'
const isWindows = navigator.platform && navigator.platform.includes('Win')

const ipc = window.chrome.ipc

// TODO: Determine this from the l20n file automatically
const hintCount = 3

// Stylesheets

require('../../less/switchControls.less')
require('../../less/about/preferences.less')
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
  'flash': ['boolean', 'number']
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
      <span data-l10n-id={this.props.dataL10nId} />
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
    return <div style={this.props.style} className='settingItem'>
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

class LedgerTableRow extends ImmutableComponent {
  get synopsis () {
    return this.props.synopsis
  }

  get formattedTime () {
    var d = this.synopsis.get('daysSpent')
    var h = this.synopsis.get('hoursSpent')
    var m = this.synopsis.get('minutesSpent')
    var s = this.synopsis.get('secondsSpent')
    if (d << 0 > 364) {
      return '>1y'
    }
    d = (d << 0 === 0) ? '' : (d + 'd ')
    h = (h << 0 === 0) ? '' : (h + 'h ')
    m = (m << 0 === 0) ? '' : (m + 'm ')
    s = (s << 0 === 0) ? '' : (s + 's ')
    return (d + h + m + s + '')
  }

  padLeft (v) { return pad(v, 12, '0') }

  get hostPattern () {
    return `https?://${this.synopsis.get('site')}`
  }

  get enabled () {
    const hostSettings = this.props.siteSettings.get(this.hostPattern)
    if (hostSettings) {
      const result = hostSettings.get('ledgerPayments')
      if (typeof result === 'boolean') {
        return result
      }
    }
    return true
  }

  render () {
    const faviconURL = this.synopsis.get('faviconURL') || appConfig.defaultFavicon
    const rank = this.synopsis.get('rank')
    const views = this.synopsis.get('views')
    const duration = this.synopsis.get('duration')
    const publisherURL = this.synopsis.get('publisherURL')
    // TODO: This should redistribute percentages accordingly when a site is
    // enabled/disabled for payments.
    const percentage = this.synopsis.get('percentage')
    const site = this.synopsis.get('site')
    const defaultSiteSetting = true

    return <tr className={this.enabled ? '' : 'paymentsDisabled'}>
      <td className='narrow' data-sort={this.padLeft(rank)}>{rank}</td>
      <td className='wide'><a href={publisherURL} target='_blank'><img src={faviconURL} alt={site} /><span>{site}</span></a></td>
      <td className='narrow'><SiteSettingCheckbox hostPattern={this.hostPattern} defaultValue={defaultSiteSetting} prefKey='ledgerPayments' siteSettings={this.props.siteSettings} checked={this.enabled} /></td>
      <td data-sort={this.padLeft(views)}>{views}</td>
      <td data-sort={this.padLeft(duration)}>{this.formattedTime}</td>
      <td data-sort={this.padLeft(percentage)}>{percentage}</td>
    </tr>
  }
}

class LedgerTable extends ImmutableComponent {
  render () {
    const synopsis = this.props.ledgerData.get('synopsis')
    if (!synopsis || !synopsis.size) {
      return null
    }
    return <div id='ledgerTable'>
      <table className='sort'>
        <thead>
          <tr>
            <th className='sort-header' data-l10n-id='rank' />
            <th className='sort-header' data-l10n-id='publisher' />
            <th className='sort-header' data-l10n-id='include' />
            <th className='sort-header' data-l10n-id='views' />
            <th className='sort-header' data-l10n-id='timeSpent' />
            <th className='sort-header'>&#37;</th>
          </tr>
        </thead>
        <tbody>
        {
          synopsis.map((row) => <LedgerTableRow synopsis={row}
            siteSettings={this.props.siteSettings} />)
        }
        </tbody>
      </table>
    </div>
  }
}

class BitcoinDashboard extends ImmutableComponent {
  constructor () {
    super()
    this.buyCompleted = false
  }
  get ledgerData () {
    return this.props.ledgerData
  }
  get overlayContent () {
    return <iframe src={this.ledgerData.get('buyURL')} />
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
// if someone can figure out how to get a localized title attribute (bitcoinCopyAddress) here, please do so!
    return <div id='bitcoinDashboard'>
      {
      this.props.bitcoinOverlayVisible
        ? <ModalOverlay title={'bitcoinBuy'} content={this.overlayContent} emptyDialog={emptyDialog} onHide={this.props.hideOverlay.bind(this)} />
        : null
      }
      <div className='board'>
        <div className='panel'>
          <div className='settingsListTitle' data-l10n-id='moneyAdd' />
          <div id='coinbaseLogo' />
          <Button l10nId='add' className='primaryButton' onClick={this.props.showOverlay.bind(this)} />
        </div>
        <div className='panel'>
          <div className='settingsListTitle' data-l10n-id='bitcoinAdd' />
          {
            this.ledgerData.get('address') && this.ledgerData.get('paymentURL')
              ? <div>
                <img src={this.ledgerData.get('paymentIMG')} title='Brave wallet QR code' />
                {
                  this.ledgerData.get('hasBitcoinHandler')
                    ? <div>
                      <a href={this.ledgerData.get('paymentURL')} target='_blank'>
                        <Button l10nId='bitcoinVisitAccount' className='primaryButton' />
                      </a>
                      <div data-l10n-id='bitcoinAddress' className='labelText' />
                      <span className='fa fa-clipboard settingsListCopy alt' title='Copy to clipboard' onClick={this.copyToClipboard.bind(this, this.ledgerData.get('address'))} />
                      <span className='smallText'>{this.ledgerData.get('address')}</span>
                    </div>
                    : <div>
                      <div data-l10n-id='bitcoinPaymentURL' className='labelText' />
                      <span id='bitcoinPaymentURL' title='Copy to clipboard' onClick={this.copyToClipboard.bind(this, this.ledgerData.get('paymentURL'))}>{this.ledgerData.get('paymentURL')}</span>
                    </div>
                }
              </div>
            : <div data-l10n-id='bitcoinWalletNotAvailable' />
          }
        </div>
      </div>
    </div>
  }
}

class GeneralTab extends ImmutableComponent {
  enabled (keyArray) {
    return keyArray.every((key) => getSetting(key, this.props.settings) === true)
  }

  render () {
    var languageOptions = this.props.languageCodes.map(function (lc) {
      return (
        <option data-l10n-id={lc} value={lc} />
      )
    })
    const defaultLanguage = this.props.languageCodes.find((lang) => lang.includes(navigator.language)) || 'en-US'
    return <SettingsList>
      <div className='sectionTitle' data-l10n-id='generalSettings' />
      <SettingsList>
        <SettingItem dataL10nId='startsWith'>
          <select value={getSetting(settings.STARTUP_MODE, this.props.settings)}
            onChange={changeSetting.bind(null, this.props.onChangeSetting, settings.STARTUP_MODE)} >
            <option data-l10n-id='startsWithOptionLastTime' value='lastTime' />
            <option data-l10n-id='startsWithOptionHomePage' value='homePage' />
            <option data-l10n-id='startsWithOptionNewTabPage' value='newTabPage' />
          </select>
        </SettingItem>
        <SettingItem dataL10nId='myHomepage'>
          <input spellCheck='false'
            data-l10n-id='homepageInput'
            value={getSetting(settings.HOMEPAGE, this.props.settings)}
            onChange={changeSetting.bind(null, this.props.onChangeSetting, settings.HOMEPAGE)} />
        </SettingItem>
        <SettingItem dataL10nId='selectedLanguage'>
          <select value={getSetting(settings.LANGUAGE, this.props.settings) || defaultLanguage}
            onChange={changeSetting.bind(null, this.props.onChangeSetting, settings.LANGUAGE)} >
            {languageOptions}
          </select>
        </SettingItem>
      </SettingsList>
      <div className='sectionTitle' data-l10n-id='bookmarkToolbarSettings' />
      <SettingsList>
        <SettingCheckbox dataL10nId='bookmarkToolbar' prefKey={settings.SHOW_BOOKMARKS_TOOLBAR} settings={this.props.settings} onChangeSetting={this.props.onChangeSetting} />
        <SettingCheckbox dataL10nId='bookmarkToolbarShowFavicon' style={{ display: this.enabled([settings.SHOW_BOOKMARKS_TOOLBAR]) ? 'block' : 'none' }} prefKey={settings.SHOW_BOOKMARKS_TOOLBAR_FAVICON} settings={this.props.settings} onChangeSetting={this.props.onChangeSetting} />
        <SettingCheckbox dataL10nId='bookmarkToolbarShowOnlyFavicon' style={{ display: this.enabled([settings.SHOW_BOOKMARKS_TOOLBAR, settings.SHOW_BOOKMARKS_TOOLBAR_FAVICON]) ? 'block' : 'none' }} prefKey={settings.SHOW_BOOKMARKS_TOOLBAR_ONLY_FAVICON} settings={this.props.settings} onChangeSetting={this.props.onChangeSetting} />
      </SettingsList>
      <div className='sectionTitle' data-l10n-id='appearanceSettings' />
      <SettingsList>
        <SettingCheckbox dataL10nId='showHomeButton' prefKey={settings.SHOW_HOME_BUTTON} settings={this.props.settings} onChangeSetting={this.props.onChangeSetting} />
        {
          isDarwin ? null : <SettingCheckbox dataL10nId='autoHideMenuBar' prefKey={settings.AUTO_HIDE_MENU} settings={this.props.settings} onChangeSetting={this.props.onChangeSetting} />
        }
        <SettingCheckbox dataL10nId='disableTitleMode' prefKey={settings.DISABLE_TITLE_MODE} settings={this.props.settings} onChangeSetting={this.props.onChangeSetting} />
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
      array.push([<SearchSelectEntry name={entry.name} settings={this.props.settings} />,
        <SearchEntry name={entry.name} iconStyle={iconStyle}
          onChangeSetting={this.props.onChangeSetting} />,
        <SearchShortcutEntry shortcut={entry.shortcut} />])
    })
    return array
  }

  hoverCallback (rows) {
    this.props.onChangeSetting(settings.DEFAULT_SEARCH_ENGINE, rows[1].props.children.props.name)
  }

  render () {
    return <div>
      <div className='sectionTitle' data-l10n-id='searchSettings' />
      <SortableTable headings={['default', 'searchEngine', 'engineGoKey']} rows={this.searchProviders}
        addHoverClass onClick={this.hoverCallback.bind(this)} />
      <div className='sectionTitle' data-l10n-id='locationBarSettings' />
      <SettingsList>
        <SettingCheckbox dataL10nId='showHistoryMatches' prefKey={settings.HISTORY_SUGGESTIONS} settings={this.props.settings} onChangeSetting={this.props.onChangeSetting} />
        <SettingCheckbox dataL10nId='showBookmarkMatches' prefKey={settings.BOOKMARK_SUGGESTIONS} settings={this.props.settings} onChangeSetting={this.props.onChangeSetting} />
        <SettingCheckbox dataL10nId='showOpenedTabMatches' prefKey={settings.OPENED_TAB_SUGGESTIONS} settings={this.props.settings} onChangeSetting={this.props.onChangeSetting} />
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
    this.createWallet = this.createWallet.bind(this)
  }

  createWallet () {
    if (!this.props.ledgerData.get('created')) {
      aboutActions.createWallet()
    }
  }

  get enabled () {
    return getSetting(settings.PAYMENTS_ENABLED, this.props.settings)
  }

  get walletButton () {
    const buttonText = this.props.ledgerData.get('created')
      ? 'addFundsTitle'
      : (this.props.ledgerData.get('creating') ? 'creatingWallet' : 'createWallet')
    const onButtonClick = this.props.ledgerData.get('created')
      ? this.props.showOverlay.bind(this, 'addFunds')
      : (this.props.ledgerData.get('creating') ? () => {} : this.createWallet)
    return <Button l10nId={buttonText} className='primaryButton' onClick={onButtonClick.bind(this)} disabled={this.props.ledgerData.get('creating')} />
  }

  get walletStatus () {
    let status = {}
    if (this.props.ledgerData.get('created')) {
      const transactions = this.props.ledgerData.get('transactions')
      const pendingFunds = Number(this.props.ledgerData.get('unconfirmed') || 0)
      if (pendingFunds + Number(this.props.ledgerData.get('balance') || 0) <
          Number(this.props.ledgerData.get('btc') || 0)) {
        status.id = 'insufficientFundsStatus'
      } else if (pendingFunds > 0) {
        status.id = 'pendingFundsStatus'
        status.args = {funds: this.btcToCurrencyString(pendingFunds)}
      } else if (transactions && transactions.size > 0) {
        status.id = 'defaultWalletStatus'
      } else {
        status.id = 'createdWalletStatus'
      }
    } else if (this.props.ledgerData.get('creating')) {
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

  get overlayContent () {
    return <BitcoinDashboard ledgerData={this.props.ledgerData}
      bitcoinOverlayVisible={this.props.bitcoinOverlayVisible}
      showOverlay={this.props.showOverlay.bind(this, 'bitcoin')}
      hideOverlay={this.props.hideOverlay.bind(this, 'bitcoin')}
      hideParentOverlay={this.props.hideOverlay.bind(this, 'addFunds')} />
  }

  btcToCurrencyString (btc) {
    const balance = Number(btc || 0)
    const currency = this.props.ledgerData.get('currency')
    if (!currency) {
      return `${balance} BTC`
    }
    if (balance === 0) {
      return `0 ${currency}`
    }
    if (this.props.ledgerData.get('btc') &&
        typeof this.props.ledgerData.get('amount') === 'number') {
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
              <th data-l10n-id='accountBalance' />
              <th data-l10n-id='monthlyBudget' />
              <th data-l10n-id='status' />
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <span id='fundsAmount'>
                {this.btcToCurrencyString(this.props.ledgerData.get('balance'))}
                </span>
                {this.walletButton}
              </td>
              <td>
                <SettingsList>
                  <SettingItem>
                    <select id='fundsSelectBox'
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
              <td data-l10n-id={this.walletStatus.id}
                data-l10n-args={this.walletStatus.args ? JSON.stringify(this.walletStatus.args) : null} />
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
          ? <ModalOverlay title={'addFunds'} content={this.overlayContent} onHide={this.props.hideOverlay.bind(this, 'addFunds')} />
          : null
        }
      <div className='titleBar'>
        <div className='sectionTitleWrapper pull-left'>
          <span className='sectionTitle' data-l10n-id='publisherPaymentsTitle' />
          <span className='sectionSubTitle' data-l10n-id='publisherPaymentsTitleBeta' />
        </div>
        <div className='pull-left' id='enablePaymentsSwitch'>
          <span data-l10n-id='off' />
          <SettingCheckbox dataL10nId='on' prefKey={settings.PAYMENTS_ENABLED} settings={this.props.settings} onChangeSetting={this.props.onChangeSetting} />
          {this.enabled ? <SettingCheckbox dataL10nId='notifications' prefKey={settings.PAYMENTS_NOTIFICATIONS} settings={this.props.settings} onChangeSetting={this.props.onChangeSetting} /> : null}
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
            <div>
              <span data-l10n-id='paymentsWelcomeText5' />&nbsp;
              <a href='https://brave.com/Payments_FAQ.html' target='_blank' data-l10n-id='paymentsWelcomeLink' />&nbsp;
              <span data-l10n-id='paymentsWelcomeText6' />
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
      return value.get && permissionNames[name] ? permissionNames[name].includes(typeof value.get(name)) : false
    })
  }

  isPermissionsNonEmpty () {
    // Check whether there is at least one permission set
    return this.props.siteSettings.some((value) => {
      if (value && value.get) {
        for (let name in permissionNames) {
          if (permissionNames[name].includes(typeof value.get(name))) {
            return true
          }
        }
      }
      return false
    })
  }

  deletePermission (name, hostPattern) {
    aboutActions.removeSiteSetting(hostPattern, name)
  }

  render () {
    return this.isPermissionsNonEmpty()
    ? <div id='sitePermissionsPage'>
      <div className='sectionTitle' data-l10n-id='sitePermissions' />
      <ul className='sitePermissions'>
        {
          Object.keys(permissionNames).map((name) =>
            this.hasEntryForPermission(name)
            ? <li>
              <div data-l10n-id={name} className='permissionName' />
              <ul>
              {
                this.props.siteSettings.map((value, hostPattern) => {
                  if (!value.size) {
                    return null
                  }
                  const granted = value.get(name)
                  if (permissionNames[name].includes(typeof granted)) {
                    let statusText
                    let statusArgs
                    if (name === 'flash') {
                      if (granted === 1) {
                        // Flash is allowed just one time
                        statusText = 'flashAllowOnce'
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
                    } else {
                      statusText = granted ? 'alwaysAllow' : 'alwaysDeny'
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
          <select value={this.props.braveryDefaults.get('adControl')} onChange={this.onChangeAdControl}>
            <option data-l10n-id='showBraveAds' value='showBraveAds' />
            <option data-l10n-id='blockAds' value='blockAds' />
            <option data-l10n-id='allowAdsAndTracking' value='allowAdsAndTracking' />
          </select>
        </SettingItem>
        <SettingItem dataL10nId='cookieControl'>
          <select value={this.props.braveryDefaults.get('cookieControl')} onChange={this.onChangeCookieControl}>
            <option data-l10n-id='block3rdPartyCookie' value='block3rdPartyCookie' />
            <option data-l10n-id='allowAllCookies' value='allowAllCookies' />
          </select>
        </SettingItem>
        <SettingCheckbox checked={this.props.braveryDefaults.get('httpsEverywhere')} dataL10nId='httpsEverywhere' onChange={this.onToggleHTTPSE} />
        <SettingCheckbox checked={this.props.braveryDefaults.get('safeBrowsing')} dataL10nId='safeBrowsing' onChange={this.onToggleSafeBrowsing} />
        <SettingCheckbox checked={this.props.braveryDefaults.get('noScript')} dataL10nId='noScript' onChange={this.onToggleNoScript} />
        <SettingCheckbox dataL10nId='blockCanvasFingerprinting' prefKey={settings.BLOCK_CANVAS_FINGERPRINTING} settings={this.props.settings} onChangeSetting={this.props.onChangeSetting} />
      </SettingsList>
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
  render () {
    const lastPassPreferencesUrl = ('chrome-extension://' + extensionIds[passwordManagers.LAST_PASS] + '/tabDialog.html?dialog=preferences&cmd=open')

    return <div>
      <div className='sectionTitle' data-l10n-id='privateData' />
      <SettingsList dataL10nId='privateDataMessage'>
        <SettingCheckbox dataL10nId='browsingHistory' prefKey={settings.SHUTDOWN_CLEAR_HISTORY} settings={this.props.settings} onChangeSetting={this.props.onChangeSetting} />
        <SettingCheckbox dataL10nId='downloadHistory' prefKey={settings.SHUTDOWN_CLEAR_DOWNLOADS} settings={this.props.settings} onChangeSetting={this.props.onChangeSetting} />
        <SettingCheckbox dataL10nId='cachedImagesAndFiles' prefKey={settings.SHUTDOWN_CLEAR_CACHE} settings={this.props.settings} onChangeSetting={this.props.onChangeSetting} />
        <SettingCheckbox dataL10nId='allSiteCookies' prefKey={settings.SHUTDOWN_CLEAR_ALL_SITE_COOKIES} settings={this.props.settings} onChangeSetting={this.props.onChangeSetting} />
        <Button l10nId='clearBrowsingDataNow' className='primaryButton clearBrowsingDataButton' onClick={this.clearBrowsingDataNow} />
      </SettingsList>
      <div className='sectionTitle' data-l10n-id='passwordsAndForms' />
      <SettingsList>
        <SettingItem dataL10nId='passwordManager'>
          <select value={getSetting(settings.ACTIVE_PASSWORD_MANAGER, this.props.settings)} onChange={changeSetting.bind(null, this.props.onChangeSetting, settings.ACTIVE_PASSWORD_MANAGER)} >
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
          }, true)} />
      </SettingsList>
      <div className='sectionTitle' data-l10n-id='doNotTrackTitle' />
      <SettingsList>
        <SettingCheckbox dataL10nId='doNotTrack' prefKey={settings.DO_NOT_TRACK} settings={this.props.settings} onChangeSetting={this.props.onChangeSetting} />
      </SettingsList>
      <div className='sectionTitle' data-l10n-id='pluginSettings' />
      <SettingsList>
        <SettingCheckbox checked={this.props.flashInstalled ? this.props.braveryDefaults.get('flash') : false} dataL10nId='enableFlash' onChange={this.onToggleFlash} disabled={!this.props.flashInstalled} />
        <span className='subtext'>
          <span className='fa fa-info-circle' id='flashInfoIcon' />
        {
          isDarwin || isWindows
            ? <span><span data-l10n-id='enableFlashSubtext' />&nbsp;
              <span className='linkText' onClick={aboutActions.newFrame.bind(null, {
                location: 'https://get.adobe.com/flashplayer'
              })}>{'Adobe'}</span>.</span>
            : <span data-l10n-id='enableFlashSubtextLinux' />
        }
        </span>
      </SettingsList>
      <SitePermissionsPage siteSettings={this.props.siteSettings} />
    </div>
  }
}

class AdvancedTab extends ImmutableComponent {
  render () {
    const defaultZoomSetting = getSetting(settings.DEFAULT_ZOOM_LEVEL, this.props.settings)
    return <div>
      <div className='sectionTitle' data-l10n-id='contentSettings' />
      <SettingsList>
        <SettingItem dataL10nId='defaultZoomLevel'>
          <select
            value={defaultZoomSetting === undefined || defaultZoomSetting === null ? config.zoom.defaultValue : defaultZoomSetting}
            data-type='float'
            onChange={changeSetting.bind(null, this.props.onChangeSetting, settings.DEFAULT_ZOOM_LEVEL)}>
            {
              config.zoom.zoomLevels.map((x) =>
                <option value={x} key={x}>{getZoomValuePercentage(x) + '%'}</option>)
            }
          </select>
        </SettingItem>
        <SettingCheckbox dataL10nId='useHardwareAcceleration' prefKey={settings.HARDWARE_ACCELERATION_ENABLED} settings={this.props.settings} onChangeSetting={this.props.onChangeSetting} />
        <SettingCheckbox dataL10nId='usePDFJS' prefKey={settings.PDFJS_ENABLED} settings={this.props.settings} onChangeSetting={this.props.onChangeSetting} />
        <SettingCheckbox dataL10nId='useSmoothScroll' prefKey={settings.SMOOTH_SCROLL_ENABLED} settings={this.props.settings} onChangeSetting={this.props.onChangeSetting} />
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
        <a data-l10n-id='sendUsFeedback' href={appConfig.contactUrl} />
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
      addFundsOverlayVisible: false,
      preferenceTab: hash.toUpperCase() in preferenceTabs ? hash : preferenceTabs.GENERAL,
      hintNumber: this.getNextHintNumber(),
      languageCodes: Immutable.Map(),
      flashInstalled: false,
      settings: Immutable.Map(),
      siteSettings: Immutable.Map(),
      braveryDefaults: Immutable.Map(),
      ledgerData: Immutable.Map()
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
    ipc.on(messages.LANGUAGE, (e, {languageCodes}) => {
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
      key === settings.PDFJS_ENABLED || key === settings.SMOOTH_SCROLL_ENABLED) {
      ipc.send(messages.PREFS_RESTART, key, value)
    }
    if (key === settings.PAYMENTS_ENABLED) {
      this.onChangeSetting(settings.PAYMENTS_NOTIFICATIONS, value)
    }
  }

  setOverlayVisible (isVisible, overlayName) {
    let stateDiff = {}
    stateDiff[`${overlayName}OverlayVisible`] = isVisible
    if (overlayName === 'addFunds' && isVisible === false) {
      // Hide the child overlay when the parent is closed
      stateDiff['bitcoinOverlayVisible'] = false
    }
    this.setState(stateDiff)
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
          bitcoinOverlayVisible={this.state.bitcoinOverlayVisible}
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

module.exports = <AboutPreferences />
