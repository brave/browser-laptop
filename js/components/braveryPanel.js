/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const ipc = require('electron').ipcRenderer
const ImmutableComponent = require('./immutableComponent')
const Dialog = require('./dialog')
const SwitchControl = require('./switchControl')
const windowActions = require('../actions/windowActions')
const appActions = require('../actions/appActions')
const urlParse = require('url').parse
const cx = require('../lib/classSet')
const messages = require('../constants/messages')
const siteUtil = require('../state/siteUtil')

class BraveryPanel extends ImmutableComponent {
  constructor () {
    super()
    this.onToggleSiteSetting = this.onToggleSiteSetting.bind(this)
    this.onToggleBlockedAds = this.onToggleBlockedAds.bind(this)
    this.onToggleTPList = this.onToggleTPList.bind(this)
    this.onToggleHttpseList = this.onToggleHttpseList.bind(this)
    this.onToggleAdvanced = this.onToggleAdvanced.bind(this)
    this.onToggleShields = this.onToggleSiteSetting.bind(this, 'shieldsUp')
    this.onToggleAdControl = this.onToggleSiteSetting.bind(this, 'adControl')
    this.onToggleSafeBrowsing = this.onToggleSiteSetting.bind(this, 'safeBrowsing')
    this.onToggleNoScript = this.onToggleSiteSetting.bind(this, 'noScript')
    this.onToggleCookieControl = this.onToggleSiteSetting.bind(this, 'cookieControl')
    this.onToggleHTTPSE = this.onToggleSiteSetting.bind(this, 'httpsEverywhere')
    this.onReload = this.onReload.bind(this)
  }
  get isBlockingTrackedContent () {
    return this.blockedByTrackingList && this.blockedByTrackingList.size > 0
  }
  get blockedByTrackingList () {
    return this.props.frameProps.getIn(['trackingProtection', 'blocked'])
  }
  get isTPListShown () {
    return this.props.braveryPanelDetail.get('expandTrackingProtection')
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
  get isHttpseShown () {
    return this.props.braveryPanelDetail.get('expandHttpse')
  }
  get redirectedResources () {
    return this.props.frameProps.get('httpsEverywhere')
  }
  get isRedirectingResources () {
    return this.redirectedResources && this.redirectedResources.size > 0
  }
  onToggleTPList (e) {
    windowActions.setBraveryPanelDetail({
      expandTrackingProtection: !this.isTPListShown
    })
    e.stopPropagation()
  }
  onToggleBlockedAds (e) {
    windowActions.setBraveryPanelDetail({
      expandAdblock: !this.isBlockedAdsShown
    })
    e.stopPropagation()
  }
  onToggleHttpseList (e) {
    windowActions.setBraveryPanelDetail({
      expandHttpse: !this.isHttpseShown
    })
    e.stopPropagation()
  }
  onToggleAdvanced () {
    windowActions.setBraveryPanelDetail({
      advancedControls: !this.isAdvancedExpanded
    })
  }
  onReload () {
    ipc.emit(messages.SHORTCUT_ACTIVE_FRAME_LOAD_URL, {}, this.props.activeRequestedLocation)
  }
  getSiteSetting (setting, defaultValue) {
    if (!this.props.activeSiteSettings) {
      return defaultValue
    }
    const val = this.props.activeSiteSettings.get(setting)
    if (val === undefined) {
      return defaultValue
    }
    return val
  }
  onToggleSiteSetting (setting, e) {
    let ruleKey = siteUtil.getOrigin(this.props.activeRequestedLocation)
    const parsedUrl = urlParse(this.props.activeRequestedLocation)
    if (setting !== 'noScript' && (parsedUrl.protocol === 'https:' || parsedUrl.protocol === 'http:')) {
      ruleKey = `https?://${parsedUrl.host}`
    }
    appActions.changeSiteSetting(ruleKey, setting, e.target.value)
  }
  get displayHost () {
    const parsedUrl = urlParse(this.props.activeRequestedLocation)
    if (parsedUrl.protocol === 'https:' || parsedUrl.protocol === 'http:') {
      return parsedUrl.host
    }
    return this.props.activeRequestedLocation
  }
  render () {
    const shieldsUp = this.getSiteSetting('shieldsUp', true)
    return <Dialog onHide={this.props.onHide} className='braveryPanelContainer' isClickDismiss>
      <div className='braveryPanel' onClick={(e) => e.stopPropagation()}>
        <div className='braveryPanelHeader'>
          <div className='braveryPanelHeaderLeft'>
            <div data-l10n-id='braveryPanelTitle' />
            <span className='braverySettingsFor'>{this.displayHost}</span>
          </div>
          <div className='braveryPanelHeaderRight'>
            <div className='braveryShieldsUpDown'>
              <SwitchControl onClick={this.onToggleShields} leftl10nId='shieldsDown' rightl10nId='shieldsUp' topl10nId='shields' checkedOn={shieldsUp} large />
            </div>
          </div>
        </div>
        <div className='braveryPanelStats'>
          <div onClick={this.onToggleBlockedAds}>
            <div className='braveryStat adsBlockedStat'>{this.blockedAds ? this.blockedAds.size : 0}</div>
            <div data-l10n-id='adsBlocked' />
          </div>
          <div onClick={this.onToggleTPList}>
            <div className='braveryStat trackersBlockedStat'>{this.blockedByTrackingList ? this.blockedByTrackingList.size : 0}</div>
            <div data-l10n-id='trackersBlocked' />
          </div>
          <div onClick={this.onToggleHttpseList}>
            <div className='braveryStat redirectedResourcesStat'>{this.redirectedResources ? this.redirectedResources.reduce((reduction, value) => {
              return reduction + value.size
            }, 0) : 0}</div>
            <div data-l10n-id='httpReroutes' />
          </div>
        </div>
        <div className='braveryPanelBody'>
          <ul>
          {
            this.isTPListShown && this.blockedByTrackingList && this.blockedByTrackingList.size > 0
            ? <li><ul>
            {
              this.blockedByTrackingList.map((site) => <li key={site}>{site}</li>)
            }
            </ul></li>
            : null
          }
          {
            this.isBlockingAds && this.isBlockedAdsShown
            ? <li><ul>
            {
              this.blockedAds.map((site) => <li key={site}>{site}</li>)
            }
            </ul></li>
            : null
          }
          {
            this.isRedirectingResources && this.isHttpseShown
            ? <li><ul>
            {
              this.redirectedResources.map((sites, ruleset) =>
                <li key={ruleset}>{[ruleset, JSON.stringify(sites.toJS())].join(': ')}</li>)
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
                  <select value={this.getSiteSetting('adControl', this.props.braveryDefaults.adControl)} onChange={this.onToggleAdControl} disabled={!shieldsUp}>
                    <option data-l10n-id='showBraveAds' value='showBraveAds' />
                    <option data-l10n-id='blockAds' value='blockAds' />
                    <option data-l10n-id='allowAdsAndTracking' value='allowAdsAndTracking' />
                  </select>
                  <SwitchControl onClick={this.onToggleHTTPSE} rightl10nId='httpsEverywhere' checkedOn={this.getSiteSetting('httpsEverywhere', this.props.braveryDefaults.httpsEverywhere)} disabled={!shieldsUp} />
                  <SwitchControl onClick={this.onToggleSafeBrowsing} rightl10nId='safeBrowsing' checkedOn={this.getSiteSetting('safeBrowsing', this.props.braveryDefaults.safeBrowsing)} disabled={!shieldsUp} />
                </div>
                <div className='braveryControlGroup'>
                  <div className={cx({
                    braverySelectTitle: true,
                    disabled: !shieldsUp
                  })} data-l10n-id='cookieControl' />
                  <select value={this.getSiteSetting('cookieControl', this.props.braveryDefaults.cookieControl)} onChange={this.onToggleCookieControl} disabled={!shieldsUp}>
                    <option data-l10n-id='block3rdPartyCookie' value='block3rdPartyCookie' />
                    <option data-l10n-id='allowAllCookies' value='allowAllCookies' />
                  </select>
                  <SwitchControl onClick={this.onToggleNoScript} rightl10nId='noScript' checkedOn={this.getSiteSetting('noScript', this.props.braveryDefaults.noScript)} disabled={!shieldsUp} />
                </div>
              </div></span>
            : null
          }
          <hr className='braveryBottomSplitter' />
          <div className='reloadButton' onClick={this.onReload}>
            <div className='reloadText'>Reload</div><div className='fa fa-repeat' />
          </div>
        </div>
      </div>
    </Dialog>
  }
}

module.exports = BraveryPanel
