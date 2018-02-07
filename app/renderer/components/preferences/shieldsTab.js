/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const ImmutableComponent = require('../immutableComponent')

// Components
const {SettingsList, SettingItem, SettingCheckbox} = require('../common/settings')
const {SettingDropdown} = require('../common/dropdown')
const {DefaultSectionTitle} = require('../common/sectionTitle')
const BrowserButton = require('../common/browserButton')
const SitePermissionsPage = require('./sitePermissionsPage')

// Actions
const appActions = require('../../../../js/actions/appActions')

// Constants
const settings = require('../../../../js/constants/settings')
const appConfig = require('../../../../js/constants/appConfig')

const adblock = appConfig.resourceNames.ADBLOCK
const cookieblock = appConfig.resourceNames.COOKIEBLOCK
const cookieblockAll = appConfig.resourceNames.COOKIEBLOCK_ALL
const fingerprintingProtection = appConfig.resourceNames.FINGERPRINTING_PROTECTION
const fingerprintingProtectionAll = appConfig.resourceNames.FINGERPRINTING_PROTECTION_ALL
const adInsertion = appConfig.resourceNames.AD_INSERTION
const trackingProtection = appConfig.resourceNames.TRACKING_PROTECTION
const httpsEverywhere = appConfig.resourceNames.HTTPS_EVERYWHERE
const safeBrowsing = appConfig.resourceNames.SAFE_BROWSING
const noScript = appConfig.resourceNames.NOSCRIPT

const braveryPermissionNames = {
  'shieldsUp': ['boolean'],
  'adControl': ['string'],
  'cookieControl': ['string'],
  'safeBrowsing': ['boolean'],
  'httpsEverywhere': ['boolean'],
  'fingerprintingProtection': ['string'],
  'noScript': ['boolean', 'number']
}

class ShieldsTab extends ImmutableComponent {
  constructor (props) {
    super(props)
    this.onChangeAdControl = this.onChangeAdControl.bind(this)
    this.onToggleHTTPSE = this.onToggleSetting.bind(this, httpsEverywhere)
    this.onToggleSafeBrowsing = this.onToggleSetting.bind(this, safeBrowsing)
    this.onToggleNoScript = this.onToggleSetting.bind(this, noScript)
  }
  onChangeAdControl (e) {
    if (e.target.value === 'showBraveAds') {
      appActions.setResourceEnabled(adblock, true)
      appActions.setResourceEnabled(trackingProtection, true)
      appActions.setResourceEnabled(adInsertion, true)
    } else if (e.target.value === 'blockAds') {
      appActions.setResourceEnabled(adblock, true)
      appActions.setResourceEnabled(trackingProtection, true)
      appActions.setResourceEnabled(adInsertion, false)
    } else {
      appActions.setResourceEnabled(adblock, false)
      appActions.setResourceEnabled(trackingProtection, false)
      appActions.setResourceEnabled(adInsertion, false)
    }
  }
  onChangeCookieControl (e) {
    appActions.setResourceEnabled(cookieblock, e.target.value === 'block3rdPartyCookie')
    appActions.setResourceEnabled(cookieblockAll, e.target.value === 'blockAllCookies')
  }
  onChangeFingerprintingProtection (e) {
    appActions.setResourceEnabled(fingerprintingProtection, e.target.value === 'block3rdPartyFingerprinting')
    appActions.setResourceEnabled(fingerprintingProtectionAll, e.target.value === 'blockAllFingerprinting')
  }
  onToggleSetting (setting, e) {
    appActions.setResourceEnabled(setting, e.target.value)
  }
  render () {
    return <div id='shieldsContainer'>
      <DefaultSectionTitle data-l10n-id='braveryDefaults' />
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
            <option data-l10n-id='blockAllCookies' value='blockAllCookies' />
          </SettingDropdown>
        </SettingItem>
        <SettingItem dataL10nId='fingerprintingProtection'>
          <SettingDropdown
            value={this.props.braveryDefaults.get('fingerprintingProtection')}
            onChange={this.onChangeFingerprintingProtection}>
            <option data-l10n-id='block3rdPartyFingerprinting' value='block3rdPartyFingerprinting' />
            <option data-l10n-id='allowAllFingerprinting' value='allowAllFingerprinting' />
            <option data-l10n-id='blockAllFingerprinting' value='blockAllFingerprinting' />
          </SettingDropdown>
        </SettingItem>
        <SettingCheckbox checked={this.props.braveryDefaults.get('httpsEverywhere')} dataL10nId='httpsEverywhere' onChange={this.onToggleHTTPSE} />
        <SettingCheckbox checked={this.props.braveryDefaults.get('noScript')} dataL10nId='noScriptPref' onChange={this.onToggleNoScript} />
        <SettingCheckbox checked={this.props.braveryDefaults.get('safeBrowsing')} dataL10nId='safeBrowsing' onChange={this.onToggleSafeBrowsing} />
        {/* TODO: move this inline style to Aphrodite once refactored */}
        <div style={{marginTop: '15px'}}>
          <BrowserButton
            primaryColor
            l10nId='manageAdblockSettings'
            onClick={appActions.createTabRequested.bind(null, {
              url: 'about:adblock'
            })} />
        </div>
      </SettingsList>
      <DefaultSectionTitle data-l10n-id='shieldsPanelOptions' />
      <SettingsList>
        <SettingCheckbox dataL10nId='blockedCountBadge' prefKey={settings.BLOCKED_COUNT_BADGE} settings={this.props.settings} onChangeSetting={this.props.onChangeSetting} />
        <SettingCheckbox
          dataL10nId='compactBraveryPanel'
          dataTestId='compactBraveryPanelSwitch'
          prefKey={settings.COMPACT_BRAVERY_PANEL}
          settings={this.props.settings}
          onChangeSetting={this.props.onChangeSetting}
        />
      </SettingsList>
      <SitePermissionsPage
        siteSettings={this.props.siteSettings}
        names={braveryPermissionNames}
        defaults={this.props.braveryDefaults.merge({
          ledgerPaymentsShown: true, shieldsUp: true})
        }
      />
    </div>
  }
}

module.exports = ShieldsTab
