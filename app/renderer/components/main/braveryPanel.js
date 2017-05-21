/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const Immutable = require('immutable')

// Components
const ImmutableComponent = require('../immutableComponent')
const Dialog = require('../common/dialog')
const SwitchControl = require('../common/switchControl')
const {BraveryPanelDropdown} = require('../common/dropdown')

// Constants
const config = require('../../../../js/constants/config')
const settings = require('../../../../js/constants/settings')

// Actions
const windowActions = require('../../../../js/actions/windowActions')
const appActions = require('../../../../js/actions/appActions')

// Utils
const urlParse = require('../../../common/urlParse')
const cx = require('../../../../js/lib/classSet')
const siteUtil = require('../../../../js/state/siteUtil')
const getSetting = require('../../../../js/settings').getSetting

const {StyleSheet, css} = require('aphrodite/no-important')
const globalStyles = require('../styles/global')
const commonStyles = require('../styles/commonStyles')

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
    appActions.loadURLRequested(this.props.frameProps.get('tabId'), this.props.lastCommittedURL)
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
    let ruleKey = siteUtil.getOrigin(this.props.lastCommittedURL)
    const parsedUrl = urlParse(this.props.lastCommittedURL)
    if (setting !== 'noScript' && (parsedUrl.protocol === 'https:' || parsedUrl.protocol === 'http:')) {
      ruleKey = `https?://${parsedUrl.host}`
    }
    appActions.changeSiteSetting(ruleKey, setting, e.target.value, this.isPrivate)
    this.onReload()
  }
  get displayHost () {
    const parsedUrl = urlParse(this.props.lastCommittedURL)
    if (parsedUrl.protocol === 'https:' || parsedUrl.protocol === 'http:') {
      return parsedUrl.host
    }
    return this.props.lastCommittedURL
  }

  get compactBraveryPanelHeader () {
    const shieldsUp = this.props.braverySettings.shieldsUp
    return <section className={css(
      styles.braveryPanel__header,
      styles.braveryPanel_compact__header
    )}>
      <div data-l10n-id='braveryPanelTitle' className={css(
        styles.braveryPanel__header_left,
        styles.braveryPanel_compact__header_top
      )} />
      <div className={css(
        styles.braveryPanel__header_right,
        styles.braveryPanel_compact__header_bottom
      )}>
        <div title={this.displayHost} className={css(styles.braveryPanel_compact__header__displayHost)}>{this.displayHost}</div>
        <div className={css(styles.braveryPanel_compact__header_bottom__shieldsSwitch)}>
          <SwitchControl large
            customWrapper={css(styles.braveryPanel_compact__header_bottom__shieldsSwitch__switchControl)}
            onClick={this.onToggleShields}
            leftl10nId='shieldsDown'
            rightl10nId='shieldsUp'
            checkedOn={shieldsUp}
          />
        </div>
      </div>
    </section>
  }

  get defaultBraveryPanelHeader () {
    const shieldsUp = this.props.braverySettings.shieldsUp
    return <section className={css(styles.braveryPanel__header)}>
      <div className={css(styles.braveryPanel__header_left)}>
        <div data-l10n-id='braveryPanelTitle' />
        <div title={this.displayHost} className={css(styles.braveryPanel__header__displayHost)}>{this.displayHost}</div>
      </div>
      <div className={css(styles.braveryPanel__header_right)}>
        <SwitchControl large
          customWrapper={css(styles.braveryPanel__header_right__switchControl)}
          customTopText={css(styles.braveryPanel__header_right__switchControl__topText)}
          onClick={this.onToggleShields}
          leftl10nId='shieldsDown'
          rightl10nId='shieldsUp'
          topl10nId='shields'
          checkedOn={shieldsUp}
        />
      </div>
    </section>
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
    const compactBraveryPanel = getSetting(settings.COMPACT_BRAVERY_PANEL)

    return <Dialog onHide={this.props.onHide} testId='braveryPanelContainer' isClickDismiss>
      <div className={css(
        commonStyles.flyoutDialog,
        styles.braveryPanel,
        compactBraveryPanel && styles.braveryPanel_compact
      )}
        onClick={(e) => e.stopPropagation()}
        data-test-id={compactBraveryPanel ? 'braveryPanelCompact' : 'braveryPanel'}>
        {
          compactBraveryPanel
          ? this.compactBraveryPanelHeader
          : this.defaultBraveryPanelHeader
        }
        <section className={css(
          styles.braveryPanel__stats,
          compactBraveryPanel && styles.braveryPanel_compact__stats
        )}>
          <div data-test-id='adsBlockedStat'
            onClick={this.onToggleAdsAndTracking}
            className={cx({
              [css(styles.braveryPanel__stats__item_count_clickable)]: !!adsBlockedStat,
              [css(styles.braveryPanel__stats__item_count_disabled)]: !shieldsUp || adControl === 'allowAdsAndTracking',
              [css(gridStyles.row1col1)]: !compactBraveryPanel,
              [css(gridStyles.row1col1)]: compactBraveryPanel,
              [css(styles.braveryPanel__stats__item_count_adsBlockedStat)]: true,
              [css(styles.braveryPanel__stats__item, styles.braveryPanel__stats__item_count)]: !compactBraveryPanel,
              [css(styles.braveryPanel_compact__stats__item_count)]: compactBraveryPanel
            })}>{adsBlockedStat}</div>

          <div data-test-id='redirectedResourcesStat'
            onClick={this.onToggleHttpseList}
            className={cx({
              [css(styles.braveryPanel__stats__item_count_clickable)]: !!this.redirectedResourcesSet.size,
              [css(styles.braveryPanel__stats__item_count_disabled)]: !shieldsUp || !httpseEnabled,
              [css(gridStyles.row1col2)]: !compactBraveryPanel,
              [css(gridStyles.row2col1)]: compactBraveryPanel,
              [css(styles.braveryPanel__stats__item_count_redirectedResourcesStat)]: true,
              [css(styles.braveryPanel__stats__item, styles.braveryPanel__stats__item_count)]: !compactBraveryPanel,
              [css(styles.braveryPanel_compact__stats__item_count)]: compactBraveryPanel
            })}>{httpsUpgradedResourceStat}</div>

          <div data-test-id='noScriptStat'
            onClick={this.onToggleNoScriptList}
            className={cx({
              [css(styles.braveryPanel__stats__item_count_clickable)]: !!scriptsBlockedStat,
              [css(styles.braveryPanel__stats__item_count_disabled)]: !shieldsUp || !noScriptEnabled,
              [css(gridStyles.row1col3)]: !compactBraveryPanel,
              [css(gridStyles.row3col1)]: compactBraveryPanel,
              [css(styles.braveryPanel__stats__item_count_noScriptStat)]: true,
              [css(styles.braveryPanel__stats__item, styles.braveryPanel__stats__item_count)]: !compactBraveryPanel,
              [css(styles.braveryPanel_compact__stats__item_count)]: compactBraveryPanel
            })}>{scriptsBlockedStat}</div>

          <div data-test-id='fpStat'
            onClick={this.onToggleFpList}
            className={cx({
              [css(styles.braveryPanel__stats__item_count_clickable)]: !!fpBlockedStat,
              [css(styles.braveryPanel__stats__item_count_disabled)]: !shieldsUp || !fpEnabled,
              [css(gridStyles.row1col4)]: !compactBraveryPanel,
              [css(gridStyles.row4col1)]: compactBraveryPanel,
              [css(styles.braveryPanel__stats__item_count_fpStat)]: true,
              [css(styles.braveryPanel__stats__item, styles.braveryPanel__stats__item_count)]: !compactBraveryPanel,
              [css(styles.braveryPanel_compact__stats__item_count)]: compactBraveryPanel
            })}>{fpBlockedStat}</div>

          <span className={cx({
            [css(styles.braveryPanel__stats__item_count_clickable)]: !!adsBlockedStat,
            [css(styles.braveryPanel__stats__item_count_disabled)]: !shieldsUp || adControl === 'allowAdsAndTracking',
            [css(gridStyles.row2col1)]: !compactBraveryPanel,
            [css(gridStyles.row1col2)]: compactBraveryPanel,
            [css(styles.braveryPanel__stats__item)]: !compactBraveryPanel,
            [css(styles.braveryPanel_compact__stats__item_label)]: compactBraveryPanel
          })}
            onClick={this.onToggleAdsAndTracking}
            data-l10n-id='adsBlocked'
            data-l10n-args={l10nArgs}
          />
          <span className={cx({
            [css(styles.braveryPanel__stats__item_count_clickable)]: !!this.redirectedResourcesSet.size,
            [css(styles.braveryPanel__stats__item_count_disabled)]: !shieldsUp || !httpseEnabled,
            [css(gridStyles.row2col2)]: !compactBraveryPanel,
            [css(gridStyles.row2col2)]: compactBraveryPanel,
            [css(styles.braveryPanel__stats__item)]: !compactBraveryPanel,
            [css(styles.braveryPanel_compact__stats__item_label)]: compactBraveryPanel
          })}
            onClick={this.onToggleHttpseList}
            data-l10n-id='httpReroutes'
            data-l10n-args={l10nArgs}
          />
          <span className={cx({
            [css(styles.braveryPanel__stats__item_count_clickable)]: !!scriptsBlockedStat,
            [css(styles.braveryPanel__stats__item_count_disabled)]: !shieldsUp || !noScriptEnabled,
            [css(gridStyles.row2col3)]: !compactBraveryPanel,
            [css(gridStyles.row3col2)]: compactBraveryPanel,
            [css(styles.braveryPanel__stats__item)]: !compactBraveryPanel,
            [css(styles.braveryPanel_compact__stats__item_label)]: compactBraveryPanel
          })}
            onClick={this.onToggleNoScriptList}
            data-l10n-id='scriptsBlockedNumber'
            data-l10n-args={l10nArgs}
          />
          <span className={cx({
            [css(styles.braveryPanel__stats__item_count_clickable)]: !!fpBlockedStat,
            [css(styles.braveryPanel__stats__item_count_disabled)]: !shieldsUp || !fpEnabled,
            [css(gridStyles.row2col4)]: !compactBraveryPanel,
            [css(gridStyles.row4col2)]: compactBraveryPanel,
            [css(styles.braveryPanel__stats__item)]: !compactBraveryPanel,
            [css(styles.braveryPanel_compact__stats__item_label)]: compactBraveryPanel
          })}
            onClick={this.onToggleFpList}
            data-l10n-id='fingerprintingBlocked'
            data-l10n-args={l10nArgs}
          />
        </section>

        <section className={css(
          styles.braveryPanel__body,
          compactBraveryPanel && styles.braveryPanel_compact__body
        )}>
          {
            (this.isBlockedAdsShown && (this.isBlockingAds || this.isBlockingTrackedContent))
            ? <ul data-test-id='braveryPanelBodyList'
              className={css(
                styles.braveryPanel__body__ul,
                compactBraveryPanel && styles.braveryPanel_compact__body__ul
              )}>
              {
                this.isBlockingAds
                ? this.blockedAds.map(site =>
                  <li data-test-id='braveryPanelBodyList'
                    className={css(
                      styles.braveryPanel__body__ul__li,
                      compactBraveryPanel && styles.braveryPanel_compact__body__ul__li
                    )}
                    key={site}>{site}</li>)
                : null
              }
              {
                this.isBlockingTrackedContent
                ? this.blockedByTrackingList.map(site =>
                  <li data-test-id='braveryPanelBodyList'
                    className={css(
                      styles.braveryPanel__body__ul__li,
                      compactBraveryPanel && styles.braveryPanel_compact__body__ul__li
                    )}
                    key={site}>{site}</li>)
                : null
              }
            </ul>
            : null
          }
          {
            this.isRedirectingResources && this.isHttpseShown
            ? <ul data-test-id='braveryPanelBodyList'
              className={css(
                styles.braveryPanel__body__ul,
                compactBraveryPanel && styles.braveryPanel_compact__body__ul
              )}>
              {
                this.redirectedResourcesSet.map((site) =>
                  <li data-test-id='braveryPanelBodyList'
                    className={css(
                      styles.braveryPanel__body__ul__li,
                      compactBraveryPanel && styles.braveryPanel_compact__body__ul__li
                    )}
                    key={site}>{site}</li>)
              }
            </ul>
            : null
          }
          {
            this.isBlockingScripts && this.isBlockedScriptsShown
            ? <ul data-test-id='braveryPanelBodyList'
              className={css(
                styles.braveryPanel__body__ul,
                compactBraveryPanel && styles.braveryPanel_compact__body__ul
              )}>
              {
                this.blockedScripts.map((site) =>
                  <li data-test-id='braveryPanelBodyList'
                    className={css(
                      styles.braveryPanel__body__ul__li,
                      compactBraveryPanel && styles.braveryPanel_compact__body__ul__li
                    )}
                    key={site}>{site}</li>)
              }
            </ul>
            : null
          }
          {
            this.isBlockingFingerprinting && this.isFpShown
            ? <ul data-test-id='braveryPanelBodyList'
              className={css(
                styles.braveryPanel__body__ul,
                compactBraveryPanel && styles.braveryPanel_compact__body__ul
              )}>
              {
                this.blockedFingerprinting.map((site) =>
                  <li data-test-id='braveryPanelBodyList'
                    className={css(
                      styles.braveryPanel__body__ul__li,
                      compactBraveryPanel && styles.braveryPanel_compact__body__ul__li
                    )}
                    key={site}>{site}</li>)
              }
            </ul>
            : null
          }
          <div onClick={this.onToggleAdvanced}
            className={css(
              styles.braveryPanel__body__advancedTitle,
              compactBraveryPanel && styles.braveryPanel_compact__body__advancedTitle
            )}>
            <div className={cx({
              fa: true,
              'fa-caret-down': this.isAdvancedExpanded,
              'fa-caret-right': !this.isAdvancedExpanded,
              [css(styles.braveryPanel__body__advancedTitle__indicator)]: true,
              [css(styles.braveryPanel_compact__body__advancedTitle__indicator)]: compactBraveryPanel
            })} />
            <div data-l10n-id='advancedControls' />
          </div>
          {
            this.isAdvancedExpanded
            ? <section>
              <hr className={css(
                styles.braveryPanel__body__hr,
                compactBraveryPanel && styles.braveryPanel_compact__body__hr
              )} />
              <div className={css(
                styles.braveryPanel__body__advanced__control,
                compactBraveryPanel && styles.braveryPanel_compact__body__advanced__control
              )}>
                <div data-l10n-id='adControl' className={cx({
                  [css(gridStyles.row1col1)]: true,
                  [css(styles.braveryPanel__body__advanced__control__forms__title_disabled)]: !shieldsUp,
                  [css(styles.braveryPanel__body__advanced__control__forms__title)]: !compactBraveryPanel,
                  [css(styles.braveryPanel_compact__body__advanced__control__forms__title)]: compactBraveryPanel
                })} />
                <div className={cx({
                  [css(gridStyles.row2col1)]: true,
                  [css(styles.braveryPanel__body__advanced__control__forms__dropdown_disabled)]: !shieldsUp,
                  [css(styles.braveryPanel__body__advanced__control__forms__dropdown)]: !compactBraveryPanel,
                  [css(styles.braveryPanel_compact__body__advanced__control__forms__dropdown)]: compactBraveryPanel
                })}>
                  <BraveryPanelDropdown data-test-id='adsBlockedControl' value={adControl} onChange={this.onToggleAdControl} disabled={!shieldsUp}>
                    <option data-l10n-id='showBraveAds' data-test-id='showBraveAds' value='showBraveAds' />
                    <option data-l10n-id='blockAds' data-test-id='blockAdsOption' value='blockAds' />
                    <option data-l10n-id='allowAdsAndTracking' data-test-id='showAdsOption' value='allowAdsAndTracking' />
                  </BraveryPanelDropdown>
                </div>
                <SwitchControl className={cx({
                  [css(gridStyles.row3col1)]: !compactBraveryPanel,
                  [css(gridStyles.row5col1)]: compactBraveryPanel,
                  [css(styles.braveryPanel_compact__body__advanced__control__switchControl)]: compactBraveryPanel
                })}
                  onClick={this.onToggleHTTPSE}
                  rightl10nId='httpsEverywhere'
                  checkedOn={httpseEnabled}
                  disabled={!shieldsUp}
                  testId='httpsEverywhereSwitch'
                />
                <SwitchControl className={cx({
                  [css(gridStyles.row4col1)]: !compactBraveryPanel,
                  [css(gridStyles.row6col1)]: compactBraveryPanel,
                  [css(styles.braveryPanel_compact__body__advanced__control__switchControl)]: compactBraveryPanel
                })}
                  onClick={this.onToggleNoScript}
                  rightl10nId='noScript'
                  checkedOn={noScriptEnabled}
                  disabled={!shieldsUp}
                  testId='noScriptSwitch'
                />
                <div data-l10n-id='cookieControl' className={cx({
                  [css(gridStyles.row1col2)]: !compactBraveryPanel,
                  [css(gridStyles.row3col1)]: compactBraveryPanel,
                  [css(styles.braveryPanel__body__advanced__control__forms__title_disabled)]: !shieldsUp,
                  [css(styles.braveryPanel__body__advanced__control__forms__title)]: !compactBraveryPanel,
                  [css(styles.braveryPanel_compact__body__advanced__control__forms__title)]: compactBraveryPanel
                })} />
                <div className={cx({
                  [css(gridStyles.row2col2)]: !compactBraveryPanel,
                  [css(gridStyles.row4col1)]: compactBraveryPanel,
                  [css(styles.braveryPanel__body__advanced__control__forms__dropdown_disabled)]: !shieldsUp,
                  [css(styles.braveryPanel__body__advanced__control__forms__dropdown)]: !compactBraveryPanel,
                  [css(styles.braveryPanel_compact__body__advanced__control__forms__dropdown)]: compactBraveryPanel
                })}>
                  <BraveryPanelDropdown data-test-id='cookieControl' value={this.props.braverySettings.cookieControl} onChange={this.onToggleCookieControl} disabled={!shieldsUp}>
                    <option data-l10n-id='block3rdPartyCookie' value='block3rdPartyCookie' />
                    <option data-l10n-id='allowAllCookies' data-test-id='allowAllCookies' value='allowAllCookies' />
                    <option data-l10n-id='blockAllCookies' data-test-id='blockAllCookies' value='blockAllCookies' />
                  </BraveryPanelDropdown>
                </div>
                <SwitchControl className={cx({
                  [css(gridStyles.row3col2)]: !compactBraveryPanel,
                  [css(gridStyles.row7col1)]: compactBraveryPanel,
                  [css(styles.braveryPanel_compact__body__advanced__control__switchControl)]: compactBraveryPanel
                })}
                  customInfoButton={css(styles.braveryPanel__body__advanced__control__switchControl__infoButton)}
                  onClick={this.onToggleFp}
                  rightl10nId='fingerprintingProtection'
                  checkedOn={fpEnabled}
                  disabled={!shieldsUp}
                  onInfoClick={this.onInfoClick}
                  infoTitle={config.fingerprintingInfoUrl}
                  testId='fingerprintingProtectionSwitch'
                />
                <SwitchControl className={cx({
                  [css(gridStyles.row4col2)]: !compactBraveryPanel,
                  [css(gridStyles.row8col1)]: compactBraveryPanel,
                  [css(styles.braveryPanel_compact__body__advanced__control__switchControl)]: compactBraveryPanel
                })}
                  onClick={this.onToggleSafeBrowsing}
                  rightl10nId='safeBrowsing'
                  checkedOn={this.props.braverySettings.safeBrowsing}
                  disabled={!shieldsUp}
                  testId='safeBrowsingSwitch'
                />
              </div>
            </section>
            : null
          }
          <hr className={css(
            styles.braveryPanel__body__hr,
            styles.braveryPanel__body__hr_splitter,
            compactBraveryPanel && styles.braveryPanel_compact__body__hr
          )} />
          <div className={css(styles.braveryPanel__body__footer)}>
            <span className={css(
              styles.braveryPanel__body__footer__edit,
              styles.braveryPanel__body__footer__edit_clickable,
              compactBraveryPanel && styles.braveryPanel_compact__body__footer__edit
            )}
              onClick={this.onEditGlobal}
              data-l10n-id='editBraveryGlobalSettings'
            />
            <div className={css(
              styles.braveryPanel__body__footer__reload,
              styles.braveryPanel__body__footer__reload_clickable
            )}
              onClick={this.onReload}>
              <span className={css(styles.braveryPanel__body__footer__reload__text)} data-l10n-id='reload' />
              <span className='fa fa-repeat' />
            </div>
          </div>
        </section>
      </div>
    </Dialog>
  }
}

const displayHost = {
  fontSize: '20px',
  fontWeight: 'normal',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  overflow: 'hidden'
}
const editGlobalMarginBottom = '.25rem'

const gridStyles = StyleSheet.create({
  row1col1: {
    gridRow: 1,
    gridColumn: 1
  },
  row1col2: {
    gridRow: 1,
    gridColumn: 2
  },
  row1col3: {
    gridRow: 1,
    gridColumn: 3
  },
  row1col4: {
    gridRow: 1,
    gridColumn: 4
  },
  row2col1: {
    gridRow: 2,
    gridColumn: 1
  },
  row2col2: {
    gridRow: 2,
    gridColumn: 2
  },
  row2col3: {
    gridRow: 2,
    gridColumn: 3
  },
  row2col4: {
    gridRow: 2,
    gridColumn: 4
  },
  row3col1: {
    gridRow: 3,
    gridColumn: 1
  },
  row3col2: {
    gridRow: 3,
    gridColumn: 2
  },
  row4col1: {
    gridRow: 4,
    gridColumn: 1
  },
  row4col2: {
    gridRow: 4,
    gridColumn: 2
  },
  row5col1: {
    gridRow: 5,
    gridColumn: 1
  },
  row6col1: {
    gridRow: 6,
    gridColumn: 1
  },
  row7col1: {
    gridRow: 7,
    gridColumn: 1
  },
  row8col1: {
    gridRow: 8,
    gridColumn: 1
  }
})

const styles = StyleSheet.create({
  braveryPanel: {
    padding: 0,
    width: '500px',
    right: '20px',
    userSelect: 'none',
    cursor: 'default',
    color: '#3B3B3B',
    overflowY: 'auto',
    maxHeight: `calc(100% - ${globalStyles.spacing.dialogTopOffset})`
  },
  braveryPanel_compact: {
    width: 'auto',
    maxWidth: '50vw'
  },

  // braveryPanelHeader - Common
  braveryPanel__header: {
    color: '#fff',
    display: 'flex',
    backgroundColor: '#808080',
    padding: '20px',
    borderTopLeftRadius: globalStyles.radius.borderRadius,
    borderTopRightRadius: globalStyles.radius.borderRadius
  },
  braveryPanel__header_left: {
    minWidth: 0
  },
  braveryPanel__header_right: {
    marginLeft: 'auto'
  },

  // braveryPanelHeader - Compact Panel
  braveryPanel_compact__header: {
    flexFlow: 'column nowrap',
    padding: '0.75rem 1rem'
  },
  braveryPanel_compact__header__displayHost: displayHost,
  braveryPanel_compact__header_top: {
    marginBottom: '5px'
  },
  braveryPanel_compact__header_bottom: {
    display: 'flex',
    justifyContent: 'space-between',
    marginLeft: 0
  },
  braveryPanel_compact__header_bottom__shieldsSwitch: {
    marginLeft: '1rem'
  },
  braveryPanel_compact__header_bottom__shieldsSwitch__switchControl: {
    padding: 0
  },

  // braveryPanelHeader - Normal Panel
  braveryPanel__header__displayHost: displayHost,

  braveryPanel__header_right__switchControl: {
    padding: 0
  },
  braveryPanel__header_right__switchControl__topText: {
    color: '#d3d3d3'
  },

  // braveryPanelStats - Common
  braveryPanel__stats: {
    boxSizing: 'border-box',
    display: 'grid',
    justifyContent: 'space-around',
    maxWidth: 'initial',
    width: '100%',
    backgroundColor: '#f7f7f7',
    padding: '20px'
  },
  braveryPanel__stats__item_count_adsBlockedStat: {
    color: globalStyles.color.statsRed
  },
  braveryPanel__stats__item_count_redirectedResourcesStat: {
    color: globalStyles.color.statsBlue
  },
  braveryPanel__stats__item_count_noScriptStat: {
    color: globalStyles.color.statsGray
  },
  braveryPanel__stats__item_count_fpStat: {
    color: globalStyles.color.statsYellow
  },
  braveryPanel__stats__item_count_clickable: {
    cursor: 'pointer'
  },
  braveryPanel__stats__item_count_disabled: {
    opacity: 0.3
  },

  // braveryPanelStats - Normal panel
  braveryPanel__stats__item: {
    maxWidth: '75px'

  },
  braveryPanel__stats__item_count: {
    fontSize: '40px'
  },

  // braveryPanelStats - Compact panel
  braveryPanel_compact__stats: {
    padding: '.5rem 1rem',
    alignItems: 'center',
    justifyContent: 'flex-start'
  },
  braveryPanel_compact__stats__item_count: {
    display: 'flex',
    justifyContent: 'flex-end',
    maxWidth: '100%',
    marginRight: '.3rem',
    fontSize: '1.7rem'
  },
  braveryPanel_compact__stats__item_label: {
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },

  // braveryPanelBody - Common
  braveryPanel__body: {
    background: '#eee',
    padding: '20px',
    borderBottomLeftRadius: globalStyles.radius.borderRadius,
    borderBottomRightRadius: globalStyles.radius.borderRadius
  },
  braveryPanel__body__advancedTitle: {
    display: 'flex'
  },
  braveryPanel__body__advancedTitle__indicator: {
    margin: '2px 5px 0 5px'
  },
  braveryPanel__body__ul: {
    fontSize: 'smaller',
    maxHeight: '300px',
    overflowY: 'scroll',
    marginTop: '-20px',
    padding: '10px',
    userSelect: 'initial',
    cursor: 'text'
  },
  braveryPanel__body__ul__li: {
    listStyleType: 'none',
    padding: '10px 0'
  },
  braveryPanel__body__hr: {
    backgroundColor: '#ccc',
    border: 0,
    height: '1px',
    margin: '10px 0'
  },
  braveryPanel__body__hr_splitter: {
    marginTop: '30px'
  },
  braveryPanel__body__footer: {
    display: 'flex',
    flexFlow: 'row wrap',
    justifyContent: 'space-between'
  },
  braveryPanel__body__footer__edit: {
    marginRight: '1rem'
  },
  braveryPanel__body__footer__edit_clickable: {
    cursor: 'pointer'
  },
  braveryPanel__body__footer__reload: {
    display: 'flex',
    alignItems: 'baseline'
  },
  braveryPanel__body__footer__reload__text: {
    marginRight: '.3rem'
  },
  braveryPanel__body__footer__reload_clickable: {
    cursor: 'pointer'
  },

  // braveryPanelBody - Compact Panel
  braveryPanel_compact__body: {
    padding: `1rem 1rem calc(1rem - ${editGlobalMarginBottom})`
  },
  braveryPanel_compact__body__advancedTitle: {
    alignItems: 'center'
  },
  braveryPanel_compact__body__advancedTitle__indicator: {
    margin: '0 .4rem 0 0',
    width: '5px'
  },
  braveryPanel_compact__body__hr: {
    marginTop: '.75rem',
    marginBottom: '.75rem'
  },
  braveryPanel_compact__body__ul: {
    padding: 0,
    margin: '0 0 .75rem 0',
    wordBreak: 'break-all',
    maxHeight: '10vh'
  },
  braveryPanel_compact__body__ul__li: {
    padding: '5px 0',

    ':first-of-type': {
      paddingTop: 0
    },
    ':last-of-type': {
      paddingBottom: 0
    }
  },
  braveryPanel_compact__body__advanced: {
    display: 'flex',
    flexFlow: 'column nowrap'
  },
  braveryPanel_compact__body__advanced__control__forms__title: {
    margin: '0 0 .25rem .25rem'
  },
  braveryPanel_compact__body__advanced__control__forms__dropdown: {
    marginBottom: '.75rem'
  },
  braveryPanel_compact__body__advanced__control__switchControl: {
    padding: '5px 0 5px .25rem'
  },
  braveryPanel_compact__body__footer__edit: {
    marginBottom: editGlobalMarginBottom
  },

  // controlWrapper - Common
  braveryPanel__body__advanced__control: {
    display: 'grid',
    gridColumnGap: '1rem',
    margin: '15px 10px'
  },
  braveryPanel__body__advanced__control__forms__title: {
    marginBottom: '4px',
    marginLeft: '8px'
  },
  braveryPanel__body__advanced__control__forms__title_disabled: {
    opacity: 0.3
  },
  braveryPanel__body__advanced__control__forms__dropdown_disabled: {
    opacity: 0.3
  },
  braveryPanel__body__advanced__control__switchControl__infoButton: {
    display: 'inline',
    cursor: 'pointer',
    paddingLeft: '2px',
    fontSize: '15px'
  },

  // controlWrapper - Normal Panel
  braveryPanel__body__advanced__control__forms__dropdown: {
    marginBottom: '25px'
  },

  // controlWrapper - Compact Panel
  braveryPanel_compact__body__advanced__control: {
    gridColumnGap: 0,
    margin: 0
  }
})

module.exports = BraveryPanel
