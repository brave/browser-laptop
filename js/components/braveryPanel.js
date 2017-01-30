/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const Immutable = require('immutable')
const ImmutableComponent = require('./immutableComponent')
const config = require('../constants/config')
const Dialog = require('./dialog')
const SwitchControl = require('./switchControl')
const {FormDropdown} = require('../../app/renderer/components/dropdown')
const windowActions = require('../actions/windowActions')
const appActions = require('../actions/appActions')
const urlParse = require('../../app/common/urlParse')
const cx = require('../lib/classSet')
const siteUtil = require('../state/siteUtil')

class BraveryPanel extends ImmutableComponent {
  constructor () {
    super()
    this.onToggleSiteSetting = this.onToggleSiteSetting.bind(this)
    this.onToggleAdsAndTracking = this.onToggleAdsAndTracking.bind(this)
    this.onToggleHttpseList = this.onToggleHttpseList.bind(this)
    this.onToggleNoScriptList = this.onToggleNoScriptList.bind(this)
    this.onToggleFpList = this.onToggleFpList.bind(this)
    this.onToggleAdvanced = this.onToggleAdvanced.bind(this)
    this.onToggleShields = this.onToggleSiteSetting.bind(this, 'shieldsUp')
    this.onToggleAdControl = this.onToggleSiteSetting.bind(this, 'adControl')
    this.onToggleSafeBrowsing = this.onToggleSiteSetting.bind(this, 'safeBrowsing')
    this.onToggleNoScript = this.onToggleSiteSetting.bind(this, 'noScript')
    this.onToggleCookieControl = this.onToggleSiteSetting.bind(this, 'cookieControl')
    this.onToggleHTTPSE = this.onToggleSiteSetting.bind(this, 'httpsEverywhere')
    this.onToggleFp = this.onToggleSiteSetting.bind(this, 'fingerprintingProtection')
    this.onReload = this.onReload.bind(this)
    this.onEditGlobal = this.onEditGlobal.bind(this)
    this.onInfoClick = this.onInfoClick.bind(this)
  }
  get isBlockingTrackedContent () {
    return this.blockedByTrackingList && this.blockedByTrackingList.size > 0
  }
  get blockedByTrackingList () {
    return this.props.frameProps.getIn(['trackingProtection', 'blocked'])
  }
  get isAdvancedExpanded () {
    return this.props.braveryPanelDetail.get('advancedControls') !== false
  }
  get blockedAds () {
    return this.props.frameProps.getIn(['adblock', 'blocked'])
  }
  get isBlockingAds () {
    return this.blockedAds && this.blockedAds.size > 0
  }
  get isBlockedAdsShown () {
    return this.props.braveryPanelDetail.get('expandAdblock')
  }
  get blockedScripts () {
    return this.props.frameProps.getIn(['noScript', 'blocked'])
  }
  get isBlockingScripts () {
    return this.blockedScripts && this.blockedScripts.size > 0
  }
  get isBlockedScriptsShown () {
    return this.props.braveryPanelDetail.get('expandNoScript')
  }
  get isBlockingFingerprinting () {
    return this.blockedFingerprinting && this.blockedFingerprinting.size > 0
  }
  get blockedFingerprinting () {
    return this.props.frameProps.getIn(['fingerprintingProtection', 'blocked'])
  }
  get isHttpseShown () {
    return this.props.braveryPanelDetail.get('expandHttpse')
  }
  get isFpShown () {
    return this.props.braveryPanelDetail.get('expandFp')
  }
  get isPrivate () {
    return this.props.frameProps.getIn(['isPrivate'])
  }
  get redirectedResources () {
    return this.props.frameProps.get('httpsEverywhere')
  }
  get redirectedResourcesSet () {
    let result = new Immutable.Set([])
    if (this.redirectedResources) {
      this.redirectedResources.forEach((urls) => {
        if (urls) {
          result = result.union(urls)
        }
      })
    }
    return result
  }
  get isRedirectingResources () {
    return this.redirectedResources && this.redirectedResources.size > 0
  }
  onToggleAdsAndTracking (e) {
    windowActions.setBraveryPanelDetail({
      expandAdblock: !this.isBlockedAdsShown
    })
    e.stopPropagation()
  }
  onToggleHttpseList (e) {
    if (!this.isHttpseShown && this.redirectedResources &&
        this.redirectedResources.size) {
      // Display full list of rulesets in console for debugging
      console.log('httpse rulesets', JSON.stringify(this.redirectedResources.toJS()))
    }
    windowActions.setBraveryPanelDetail({
      expandHttpse: !this.isHttpseShown
    })
    e.stopPropagation()
  }
  onToggleFpList (e) {
    windowActions.setBraveryPanelDetail({
      expandFp: !this.isFpShown
    })
    e.stopPropagation()
  }
  onToggleNoScriptList (e) {
    windowActions.setBraveryPanelDetail({
      expandNoScript: !this.isBlockedScriptsShown
    })
    e.stopPropagation()
  }
  onToggleAdvanced () {
    windowActions.setBraveryPanelDetail({
      advancedControls: !this.isAdvancedExpanded
    })
  }
  onReload () {
    appActions.loadURLRequested(this.props.frameProps.get('tabId'), this.props.activeRequestedLocation)
  }
  onEditGlobal () {
    appActions.createTabRequested({
      url: 'about:preferences#shields'
    })
  }
  onInfoClick () {
    appActions.createTabRequested({
      url: config.fingerprintingInfoUrl
    })
  }
  onToggleSiteSetting (setting, e) {
    if (setting !== 'shieldsUp' && !this.props.braverySettings.shieldsUp) {
      return
    }
    let ruleKey = siteUtil.getOrigin(this.props.activeRequestedLocation)
    const parsedUrl = urlParse(this.props.activeRequestedLocation)
    if (setting !== 'noScript' && (parsedUrl.protocol === 'https:' || parsedUrl.protocol === 'http:')) {
      ruleKey = `https?://${parsedUrl.host}`
    }
    appActions.changeSiteSetting(ruleKey, setting, e.target.value, this.isPrivate)
    this.onReload()
  }
  get displayHost () {
    const parsedUrl = urlParse(this.props.activeRequestedLocation)
    if (parsedUrl.protocol === 'https:' || parsedUrl.protocol === 'http:') {
      return parsedUrl.host
    }
    return this.props.activeRequestedLocation
  }
  render () {
    const shieldsUp = this.props.braverySettings.shieldsUp
    const noScriptEnabled = this.props.braverySettings.noScript
    const httpseEnabled = this.props.braverySettings.httpsEverywhere
    const adControl = this.props.braverySettings.adControl
    const fpEnabled = this.props.braverySettings.fingerprintingProtection
    const adsBlockedStat = (this.blockedAds ? this.blockedAds.size : 0) + (this.blockedByTrackingList ? this.blockedByTrackingList.size : 0)
    const scriptsBlockedStat = this.blockedScripts ? this.blockedScripts.size : 0
    const fpBlockedStat = this.blockedFingerprinting ? this.blockedFingerprinting.size : 0
    const httpsUpgradedResourceStat = this.redirectedResourcesSet.size || 0
    const l10nArgs = JSON.stringify({
      blockedAdCount: adsBlockedStat,
      httpsUpgradeCount: httpsUpgradedResourceStat,
      blockedScriptCount: scriptsBlockedStat,
      blockedFingerprintCount: fpBlockedStat
    })
    return <Dialog onHide={this.props.onHide} className='braveryPanelContainer' isClickDismiss>
      <div className='braveryPanel' onClick={(e) => e.stopPropagation()}>
        <div className='braveryPanelHeader'>
          <div className='braveryPanelHeaderLeft'>
            <div data-l10n-id='braveryPanelTitle' />
            <span title={this.displayHost} className='braverySettingsFor'>{this.displayHost}</span>
          </div>
          <div className='braveryPanelHeaderRight'>
            <div className='braveryShieldsUpDown'>
              <SwitchControl onClick={this.onToggleShields} leftl10nId='shieldsDown' rightl10nId='shieldsUp' topl10nId='shields' checkedOn={shieldsUp} large />
            </div>
          </div>
        </div>
        <div className='braveryPanelStats'>
          <div onClick={this.onToggleAdsAndTracking} className={cx({
            statClickable: !!adsBlockedStat,
            statDisabled: !shieldsUp || adControl === 'allowAdsAndTracking'
          })}>
            <div className='braveryStat adsBlockedStat'>{adsBlockedStat}</div>
            <div data-l10n-id='adsBlocked' data-l10n-args={l10nArgs} />
          </div>
          <div onClick={this.onToggleHttpseList} className={cx({
            statClickable: !!this.redirectedResourcesSet.size,
            statDisabled: !shieldsUp || !httpseEnabled
          })}>
            <div className='braveryStat redirectedResourcesStat'>{httpsUpgradedResourceStat}</div>
            <div data-l10n-id='httpReroutes' data-l10n-args={l10nArgs} />
          </div>
          <div onClick={this.onToggleNoScriptList} className={cx({
            statClickable: !!scriptsBlockedStat,
            statDisabled: !shieldsUp || !noScriptEnabled
          })}>
            <div className='braveryStat noScriptStat'>{scriptsBlockedStat}</div>
            <div data-l10n-id='scriptsBlockedNumber' data-l10n-args={l10nArgs} />
          </div>
          <div onClick={this.onToggleFpList} className={cx({
            statClickable: !!fpBlockedStat,
            statDisabled: !shieldsUp || !fpEnabled
          })}>
            <div className='braveryStat fpStat'>{fpBlockedStat}</div>
            <div data-l10n-id='fingerprintingBlocked' data-l10n-args={l10nArgs} />
          </div>
        </div>
        <div className='braveryPanelBody'>
          <ul>
            {
              this.isBlockedAdsShown
              ? <li><ul>
                {
                  this.isBlockingAds
                  ? this.blockedAds.map((site) => <li key={site}>{site}</li>)
                  : null
                }
                {
                  this.isBlockingTrackedContent
                  ? this.blockedByTrackingList.map((site) => <li key={site}>{site}</li>)
                  : null
                }
              </ul></li>
              : null
            }
            {
              this.isRedirectingResources && this.isHttpseShown
              ? <li><ul>
                {
                  this.redirectedResourcesSet.map((site) =>
                    <li key={site}>{site}</li>)
                }
              </ul></li>
              : null
            }
            {
              this.isBlockingScripts && this.isBlockedScriptsShown
              ? <li><ul>
                {
                  this.blockedScripts.map((site) =>
                    <li key={site}>{site}</li>)
                }
              </ul></li>
              : null
            }
            {
              this.isBlockingFingerprinting && this.isFpShown
              ? <li><ul>
                {
                  this.blockedFingerprinting.map((site) =>
                    <li key={site}>{site}</li>)
                }
              </ul></li>
              : null
            }
          </ul>
          <div className={cx({
            braveryAdvancedTitle: true,
            disabled: !shieldsUp
          })} onClick={this.onToggleAdvanced}>
            <div className={cx({
              fa: true,
              'fa-caret-down': this.isAdvancedExpanded,
              'fa-caret-right': !this.isAdvancedExpanded,
              braveryAdvancedIndicator: true
            })} />
            <div data-l10n-id='advancedControls' />
          </div>
          {
            this.isAdvancedExpanded
            ? <span>
              <hr />
              <div className='braveryAdvanced'>
                <div className='braveryControlGroup'>
                  <div className={cx({
                    braverySelectTitle: true,
                    disabled: !shieldsUp
                  })} data-l10n-id='adControl' />
                  <FormDropdown data-test-id='adsBlockedControl' value={adControl} onChange={this.onToggleAdControl} disabled={!shieldsUp}>
                    <option data-l10n-id='showBraveAds' value='showBraveAds' />
                    <option data-l10n-id='blockAds' value='blockAds' />
                    <option data-l10n-id='allowAdsAndTracking' value='allowAdsAndTracking' />
                  </FormDropdown>
                  <SwitchControl onClick={this.onToggleHTTPSE} rightl10nId='httpsEverywhere' checkedOn={httpseEnabled} disabled={!shieldsUp} className='httpsEverywhereSwitch' />
                  <SwitchControl onClick={this.onToggleNoScript} rightl10nId='noScript' checkedOn={noScriptEnabled} disabled={!shieldsUp} className='noScriptSwitch' />
                </div>
                <div className='braveryControlGroup'>
                  <div className={cx({
                    braverySelectTitle: true,
                    disabled: !shieldsUp
                  })} data-l10n-id='cookieControl' />
                  <FormDropdown data-test-id='cookieControl' value={this.props.braverySettings.cookieControl} onChange={this.onToggleCookieControl} disabled={!shieldsUp}>
                    <option data-l10n-id='block3rdPartyCookie' value='block3rdPartyCookie' />
                    <option data-l10n-id='allowAllCookies' value='allowAllCookies' />
                    <option data-l10n-id='blockAllCookies' value='blockAllCookies' />
                  </FormDropdown>
                  <SwitchControl onClick={this.onToggleFp} rightl10nId='fingerprintingProtection' checkedOn={fpEnabled} disabled={!shieldsUp} onInfoClick={this.onInfoClick} infoTitle={config.fingerprintingInfoUrl} className='fingerprintingProtectionSwitch' />
                  <SwitchControl onClick={this.onToggleSafeBrowsing} rightl10nId='safeBrowsing' checkedOn={this.props.braverySettings.safeBrowsing} disabled={!shieldsUp} className='safeBrowsingSwitch' />
                </div>
              </div></span>
            : null
          }
          <hr className='braveryBottomSplitter' />
          <div className='braveryPanelFooter'>
            <span className='clickable' onClick={this.onEditGlobal} data-l10n-id='editBraveryGlobalSettings' />
            <span className='reloadButton clickable' onClick={this.onReload}>
              <div className='reloadText' data-l10n-id='reload' />
              <div className='fa fa-repeat' />
            </span>
          </div>
        </div>
      </div>
    </Dialog>
  }
}

module.exports = BraveryPanel
