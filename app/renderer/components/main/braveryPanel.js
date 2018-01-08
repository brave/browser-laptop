/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const Immutable = require('immutable')
const {StyleSheet, css} = require('aphrodite/no-important')

// Components
const ReduxComponent = require('../reduxComponent')
const Dialog = require('../common/dialog')
const BrowserButton = require('../common/browserButton')
const SwitchControl = require('../common/switchControl')
const {FormDropdown} = require('../common/dropdown')

// Constants
const config = require('../../../../js/constants/config')
const settings = require('../../../../js/constants/settings')
const appConfig = require('../../../../js/constants/appConfig')

// Actions
const windowActions = require('../../../../js/actions/windowActions')
const appActions = require('../../../../js/actions/appActions')

// State
const siteSettingsState = require('../../../common/state/siteSettingsState')
const siteSettings = require('../../../../js/state/siteSettings')
const tabState = require('../../../common/state/tabState')

// Utils
const urlParse = require('../../../common/urlParse')
const cx = require('../../../../js/lib/classSet')
const {getSetting} = require('../../../../js/settings')
const frameStateUtil = require('../../../../js/state/frameStateUtil')
const braveryUtil = require('../../../common/lib/braveryPanelUtil')
const urlUtil = require('../../../../js/lib/urlutil')

// Styles
const globalStyles = require('../styles/global')
const commonStyles = require('../styles/commonStyles')
const closeButton = require('../../../../img/toolbar/braveryPanel_btn.svg')

class BraveryPanel extends React.Component {
  constructor () {
    super()
    this.onToggleSiteSetting = this.onToggleSiteSetting.bind(this)
    this.onToggleAdsAndTracking = this.onToggleAdsAndTracking.bind(this)
    this.onToggleHttpsList = this.onToggleHttpsList.bind(this)
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
    this.onNewTorCircuit = this.onNewTorCircuit.bind(this)
    this.onEditGlobal = this.onEditGlobal.bind(this)
    this.onInfoClick = this.onInfoClick.bind(this)
    this.onTorInfoClick = this.onTorInfoClick.bind(this)
  }

  onToggleAdsAndTracking (e) {
    windowActions.setBraveryPanelDetail({
      expandAdblock: !this.props.isBlockedAdsShown
    })
    e.stopPropagation()
  }

  onToggleHttpsList (e) {
    if (!this.props.isHttpsShown && this.props.redirectedResources &&
        this.props.redirectedResources.size) {
      // Display full list of rule sets in console for debugging
      console.log('https rule sets', JSON.stringify(this.props.redirectedResources.toJS()))
    }
    windowActions.setBraveryPanelDetail({
      expandHttpse: !this.props.isHttpsShown
    })
    e.stopPropagation()
  }

  onToggleFpList (e) {
    windowActions.setBraveryPanelDetail({
      expandFp: !this.props.isFpShown
    })
    e.stopPropagation()
  }

  onToggleNoScriptList (e) {
    windowActions.setBraveryPanelDetail({
      expandNoScript: !this.props.isBlockedScriptsShown
    })
    e.stopPropagation()
  }

  onToggleAdvanced () {
    windowActions.setBraveryPanelDetail({
      advancedControls: !this.props.isAdvancedExpanded
    })
  }

  onReload () {
    appActions.loadURLRequested(this.props.tabId, this.props.lastCommittedURL)
  }

  onNewTorCircuit () {
    appActions.setTorNewIdentity(this.props.tabId, this.props.lastCommittedURL)
  }

  onEditGlobal () {
    appActions.createTabRequested({
      url: 'about:preferences#shields'
    })
  }

  onInfoClick () {
    this.onHide()
    appActions.createTabRequested({
      url: config.fingerprintingInfoUrl
    })
  }

  onTorInfoClick () {
    this.onHide()
    appActions.createTabRequested({
      url: config.torCircuitInfoUrl,
      isPrivate: true,
      isTor: true
    })
  }

  onHide () {
    windowActions.setBraveryPanelDetail()
  }

  onToggleSiteSetting (setting, e) {
    if (setting !== 'shieldsUp' && !this.props.shieldsUp) {
      return
    }

    let ruleKey = urlUtil.getOrigin(this.props.lastCommittedURL)
    const parsedUrl = urlParse(this.props.lastCommittedURL)
    if (setting !== 'noScript' && (parsedUrl.protocol === 'https:' || parsedUrl.protocol === 'http:')) {
      ruleKey = `https?://${parsedUrl.host}`
    }
    appActions.changeSiteSetting(ruleKey, setting, e.target.value, this.props.isPrivate)
    this.onReload()
  }

  get compactBraveryPanelHeader () {
    return <section className={css(
      styles.braveryPanel__header,
      styles.braveryPanel_compact__header
    )}>
      <div className={css(styles.braveryPanel_compact__header__top)}>
        <span data-l10n-id='shields'
          className={css(styles.braveryPanel_compact__header__top__left)}
        />
        <div className={css(styles.braveryPanel_compact__header__top__right)}>
          <SwitchControl
            customStyleWrapper={styles.braveryPanel_compact__header__top__right__switchControl}
            onClick={this.onToggleShields}
            testId='shields-toggle'
            leftl10nId='shieldsDown'
            rightl10nId='shieldsUp'
            checkedOn={this.props.shieldsUp}
          />
          <BrowserButton custom={styles.braveryPanel_compact__header__top__right__close}
            testId='braveryCloseButton'
            onClick={this.onHide}
          />
        </div>
      </div>
      <div className={css(
        styles.braveryPanel__header__right,
        styles.braveryPanel_compact__header__bottom
      )}>
        <div data-l10n-id='braveryPanelTitle' className={css(styles.braveryPanel_compact__header__bottom__title)} />
        <div title={this.props.lastCommittedURL} className={css(styles.braveryPanel_compact__header__bottom__displayHost)}>{this.props.displayHost}</div>
      </div>
    </section>
  }

  get defaultBraveryPanelHeader () {
    return <section className={css(styles.braveryPanel__header)}>
      <div className={css(styles.braveryPanel__header__left)}>
        <div data-l10n-id='braveryPanelTitle' />
        <div title={this.props.lastCommittedURL} className={css(styles.braveryPanel__header__left__displayHost)}>{this.props.displayHost}</div>
      </div>
      <div className={css(styles.braveryPanel__header__right)}>
        <SwitchControl large
          customStyleWrapper={styles.braveryPanel__header__right__switchControl}
          customStyleTextTop={styles.braveryPanel__header__right__switchControl__topText}
          onClick={this.onToggleShields}
          testId='shields-toggle'
          leftl10nId='shieldsDown'
          rightl10nId='shieldsUp'
          topl10nId='shields'
          checkedOn={this.props.shieldsUp}
        />
      </div>
    </section>
  }

  mergeProps (state, ownProps) {
    const currentWindow = state.get('currentWindow')
    const activeFrame = frameStateUtil.getActiveFrame(currentWindow) || Immutable.Map()
    const lastCommittedURL = frameStateUtil.getLastCommittedURL(activeFrame)
    const allSiteSettings = siteSettingsState.getAllSiteSettings(state, activeFrame.get('isPrivate'))
    const activeSiteSettings = siteSettings.getSiteSettingsForURL(allSiteSettings, lastCommittedURL)
    const braverySettings = siteSettings.activeSettings(activeSiteSettings, state, appConfig)
    const braveryPanelDetail = currentWindow.get('braveryPanelDetail', Immutable.Map())
    const redirectedResources = activeFrame.get('httpsEverywhere', Immutable.List())

    const props = {}
    // used in renderer
    props.tabId = activeFrame.get('tabId', tabState.TAB_ID_NONE)
    props.blockedAds = activeFrame.getIn(['adblock', 'blocked'], Immutable.List())
    props.blockedByTrackingList = activeFrame.getIn(['trackingProtection', 'blocked'], Immutable.List())
    props.blockedScripts = activeFrame.getIn(['noScript', 'blocked'], Immutable.List())
    props.blockedFingerprinting = activeFrame.getIn(['fingerprintingProtection', 'blocked'], Immutable.List())
    props.redirectedResources = braveryUtil.getRedirectedResources(redirectedResources)
    props.shieldsUp = braverySettings.shieldsUp
    props.noScriptEnabled = braverySettings.noScript
    props.httpsEnabled = braverySettings.httpsEverywhere
    props.adControl = braverySettings.adControl
    props.isFpEnabled = braverySettings.fingerprintingProtection !== 'allowAllFingerprinting'
    props.fingerprintingProtection = braverySettings.fingerprintingProtection
    props.cookieControl = braverySettings.cookieControl
    props.safeBrowsing = braverySettings.safeBrowsing
    props.isCompactBraveryPanel = getSetting(settings.COMPACT_BRAVERY_PANEL)
    props.adsBlockedStat = props.blockedAds.size + props.blockedByTrackingList.size
    props.scriptsBlockedStat = props.blockedScripts.size
    props.fpBlockedStat = props.blockedFingerprinting.size
    props.httpsUpgradedResourceStat = props.redirectedResources.size
    props.displayHost = urlUtil.getDisplayHost(lastCommittedURL)
    props.isAdvancedExpanded = braveryPanelDetail.get('advancedControls') !== false
    props.isBlockedAdsShown = braveryPanelDetail.get('expandAdblock')
    props.isBlockingAds = props.blockedAds.size > 0
    props.isBlockingTrackedContent = props.blockedByTrackingList.size > 0
    props.showRedirectingResources = props.redirectedResources.size > 0
    props.isHttpsShown = braveryPanelDetail.get('expandHttpse')
    props.isBlockingScripts = props.blockedScripts.size > 0
    props.isBlockedScriptsShown = braveryPanelDetail.get('expandNoScript')
    props.isBlockingFingerprinting = props.blockedFingerprinting.size > 0
    props.isFpShown = braveryPanelDetail.get('expandFp')
    props.isTor = frameStateUtil.isTor(activeFrame)

    // used in other functions
    props.lastCommittedURL = lastCommittedURL
    props.isPrivate = activeFrame.get('isPrivate')

    return props
  }

  render () {
    const l10nArgs = JSON.stringify({
      blockedAdCount: this.props.adsBlockedStat,
      httpsUpgradeCount: this.props.httpsUpgradedResourceStat,
      blockedScriptCount: this.props.scriptsBlockedStat,
      blockedFingerprintCount: this.props.fpBlockedStat
    })

    return <Dialog onHide={this.onHide} testId='braveryPanelContainer' isClickDismiss>
      <div className={css(
        commonStyles.flyoutDialog,
        styles.braveryPanel,
        this.props.isCompactBraveryPanel && styles.braveryPanel_compact
      )}
        onClick={(e) => e.stopPropagation()}
        data-test-id={this.props.isCompactBraveryPanel ? 'braveryPanelCompact' : 'braveryPanel'}>
        {
          this.props.isCompactBraveryPanel
          ? this.compactBraveryPanelHeader
          : this.defaultBraveryPanelHeader
        }
        <section className={css(
          styles.braveryPanel__stats,
          this.props.isCompactBraveryPanel && styles.braveryPanel_compact__stats
        )}>
          <div className={css(
            styles.braveryPanel__stats__item_count_adsBlockedStat,
            (!this.props.shieldsUp || this.props.adControl === 'allowAdsAndTracking') && styles.braveryPanel__stats__item_count_disabled,
            gridStyles.row1col1,
            !this.props.isCompactBraveryPanel && styles.braveryPanel__stats__item,
            !this.props.isCompactBraveryPanel && styles.braveryPanel__stats__item_count,
            this.props.isCompactBraveryPanel && styles.braveryPanel_compact__stats__item_count
          )}>
            <span className={css(!!this.props.adsBlockedStat && styles.braveryPanel__stats__item_count_clickable)}
              onClick={this.onToggleAdsAndTracking}
              data-test-id='adsBlockedStat'
            >{this.props.adsBlockedStat}</span>
          </div>

          <div className={css(
            styles.braveryPanel__stats__item_count_redirectedResourcesStat,
            (!this.props.shieldsUp || !this.props.httpsEnabled) && styles.braveryPanel__stats__item_count_disabled,
            !this.props.isCompactBraveryPanel && gridStyles.row1col2,
            !this.props.isCompactBraveryPanel && styles.braveryPanel__stats__item,
            !this.props.isCompactBraveryPanel && styles.braveryPanel__stats__item_count,
            this.props.isCompactBraveryPanel && gridStyles.row2col1,
            this.props.isCompactBraveryPanel && styles.braveryPanel_compact__stats__item_count
          )}>
            <span className={css(!!this.props.httpsUpgradedResourceStat && styles.braveryPanel__stats__item_count_clickable)}
              onClick={this.onToggleHttpsList}
              data-test-id='redirectedResourcesStat'
            >{this.props.httpsUpgradedResourceStat}</span>
          </div>

          <div className={css(
            styles.braveryPanel__stats__item_count_noScriptStat,
            (!this.props.shieldsUp || !this.props.noScriptEnabled) && styles.braveryPanel__stats__item_count_disabled,
            !this.props.isCompactBraveryPanel && gridStyles.row1col3,
            !this.props.isCompactBraveryPanel && styles.braveryPanel__stats__item,
            !this.props.isCompactBraveryPanel && styles.braveryPanel__stats__item_count,
            this.props.isCompactBraveryPanel && gridStyles.row3col1,
            this.props.isCompactBraveryPanel && styles.braveryPanel_compact__stats__item_count
          )}>
            <span className={css(!!this.props.scriptsBlockedStat && styles.braveryPanel__stats__item_count_clickable)}
              onClick={this.onToggleNoScriptList}
              data-test-id='noScriptStat'
            >{this.props.scriptsBlockedStat}</span>
          </div>

          <div className={css(
            styles.braveryPanel__stats__item_count_fpStat,
            (!this.props.shieldsUp || !this.props.isFpEnabled) && styles.braveryPanel__stats__item_count_disabled,
            !this.props.isCompactBraveryPanel && gridStyles.row1col4,
            !this.props.isCompactBraveryPanel && styles.braveryPanel__stats__item,
            !this.props.isCompactBraveryPanel && styles.braveryPanel__stats__item_count,
            this.props.isCompactBraveryPanel && gridStyles.row4col1,
            this.props.isCompactBraveryPanel && styles.braveryPanel_compact__stats__item_count
          )}>
            <span className={css(!!this.props.fpBlockedStat && styles.braveryPanel__stats__item_count_clickable)}
              onClick={this.onToggleFpList}
              data-test-id='fpStat'
            >{this.props.fpBlockedStat}</span>
          </div>

          <span className={css(
            !!this.props.adsBlockedStat && styles.braveryPanel__stats__item_label_clickable,
            (!this.props.shieldsUp || this.props.adControl === 'allowAdsAndTracking') && styles.braveryPanel__stats__item_label_disabled,
            !this.props.isCompactBraveryPanel && gridStyles.row2col1,
            !this.props.isCompactBraveryPanel && styles.braveryPanel__stats__item,
            this.props.isCompactBraveryPanel && gridStyles.row1col2,
            this.props.isCompactBraveryPanel && styles.braveryPanel_compact__stats__item_label
          )}
            onClick={this.onToggleAdsAndTracking}
            data-l10n-id='adsBlocked'
            data-l10n-args={l10nArgs}
          />

          <span className={css(
            !!this.props.redirectedResources.size && styles.braveryPanel__stats__item_label_clickable,
            (!this.props.shieldsUp || !this.props.httpsEnabled) && styles.braveryPanel__stats__item_label_disabled,
            gridStyles.row2col2,
            !this.props.isCompactBraveryPanel && styles.braveryPanel__stats__item,
            this.props.isCompactBraveryPanel && styles.braveryPanel_compact__stats__item_label
          )}
            onClick={this.onToggleHttpsList}
            data-l10n-id='httpReroutes'
            data-l10n-args={l10nArgs}
          />

          <span className={css(
            !!this.props.scriptsBlockedStat && styles.braveryPanel__stats__item_label_clickable,
            (!this.props.shieldsUp || !this.props.noScriptEnabled) && styles.braveryPanel__stats__item_label_disabled,
            !this.props.isCompactBraveryPanel && gridStyles.row2col3,
            !this.props.isCompactBraveryPanel && styles.braveryPanel__stats__item,
            this.props.isCompactBraveryPanel && gridStyles.row3col2,
            this.props.isCompactBraveryPanel && styles.braveryPanel_compact__stats__item_label
          )}
            onClick={this.onToggleNoScriptList}
            data-l10n-id='scriptsBlockedNumber'
            data-l10n-args={l10nArgs}
          />

          <span className={css(
            !!this.props.fpBlockedStat && styles.braveryPanel__stats__item_label_clickable,
            (!this.props.shieldsUp || !this.props.isFpEnabled) && styles.braveryPanel__stats__item_label_disabled,
            !this.props.isCompactBraveryPanel && gridStyles.row2col4,
            !this.props.isCompactBraveryPanel && styles.braveryPanel__stats__item,
            this.props.isCompactBraveryPanel && gridStyles.row4col2,
            this.props.isCompactBraveryPanel && styles.braveryPanel_compact__stats__item_label
          )}
            onClick={this.onToggleFpList}
            data-l10n-id='fingerprintingBlocked'
            data-l10n-args={l10nArgs}
          />
        </section>

        <section className={css(
          styles.braveryPanel__body,
          this.props.isCompactBraveryPanel && styles.braveryPanel_compact__body
        )}>
          {
            (this.props.isBlockedAdsShown && (this.props.isBlockingAds || this.props.isBlockingTrackedContent))
            ? <ul data-test-id='braveryPanelBodyList'
              className={css(
                styles.braveryPanel__body__ul,
                this.props.isCompactBraveryPanel && styles.braveryPanel_compact__body__ul
              )}>
              {
                this.props.isBlockingAds
                ? this.props.blockedAds.map(site =>
                  <li data-test-id='braveryPanelBodyList'
                    className={css(
                      styles.braveryPanel__body__ul__li,
                      this.props.isCompactBraveryPanel && styles.braveryPanel_compact__body__ul__li
                    )}
                    key={site}>{site}</li>)
                : null
              }
              {
                this.props.isBlockingTrackedContent
                ? this.props.blockedByTrackingList.map(site =>
                  <li data-test-id='braveryPanelBodyList'
                    className={css(
                      styles.braveryPanel__body__ul__li,
                      this.props.isCompactBraveryPanel && styles.braveryPanel_compact__body__ul__li
                    )}
                    key={site}>{site}</li>)
                : null
              }
            </ul>
            : null
          }
          {
            this.props.showRedirectingResources && this.props.isHttpsShown
            ? <ul data-test-id='braveryPanelBodyList'
              className={css(
                styles.braveryPanel__body__ul,
                this.props.isCompactBraveryPanel && styles.braveryPanel_compact__body__ul
              )}>
              {
                this.props.redirectedResources.map((site) =>
                  <li data-test-id='braveryPanelBodyList'
                    className={css(
                      styles.braveryPanel__body__ul__li,
                      this.props.isCompactBraveryPanel && styles.braveryPanel_compact__body__ul__li
                    )}
                    key={site}>{site}</li>)
              }
            </ul>
            : null
          }
          {
            this.props.isBlockingScripts && this.props.isBlockedScriptsShown
            ? <ul data-test-id='braveryPanelBodyList'
              className={css(
                styles.braveryPanel__body__ul,
                this.props.isCompactBraveryPanel && styles.braveryPanel_compact__body__ul
              )}>
              {
                this.props.blockedScripts.map((site) =>
                  <li data-test-id='braveryPanelBodyList'
                    className={css(
                      styles.braveryPanel__body__ul__li,
                      this.props.isCompactBraveryPanel && styles.braveryPanel_compact__body__ul__li
                    )}
                    key={site}>{site}</li>)
              }
            </ul>
            : null
          }
          {
            this.props.isBlockingFingerprinting && this.props.isFpShown
            ? <ul data-test-id='braveryPanelBodyList'
              className={css(
                styles.braveryPanel__body__ul,
                this.props.isCompactBraveryPanel && styles.braveryPanel_compact__body__ul
              )}>
              {
                this.props.blockedFingerprinting.map((site) =>
                  <li data-test-id='braveryPanelBodyList'
                    className={css(
                      styles.braveryPanel__body__ul__li,
                      this.props.isCompactBraveryPanel && styles.braveryPanel_compact__body__ul__li
                    )}
                    key={site}>{site}</li>)
              }
            </ul>
            : null
          }
          <div onClick={this.onToggleAdvanced}
            className={css(
              styles.braveryPanel__body__advancedTitle,
              this.props.isCompactBraveryPanel && styles.braveryPanel_compact__body__advancedTitle
            )}>
            <div className={cx({
              fa: true,
              'fa-caret-down': this.props.isAdvancedExpanded,
              'fa-caret-right': !this.props.isAdvancedExpanded,
              [css(styles.braveryPanel__body__advancedTitle__indicator)]: true,
              [css(styles.braveryPanel_compact__body__advancedTitle__indicator)]: this.props.isCompactBraveryPanel
            })} />
            <div data-l10n-id='advancedControls' />
          </div>
          {
            this.props.isAdvancedExpanded
            ? <section>
              <hr className={css(
                styles.braveryPanel__body__hr,
                this.props.isCompactBraveryPanel && styles.braveryPanel_compact__body__hr
              )} />
              <div className={css(
                styles.braveryPanel__body__advanced__control,
                this.props.isCompactBraveryPanel && styles.braveryPanel_compact__body__advanced__control
              )}>
                <div data-l10n-id='adControl' className={css(
                  !this.props.shieldsUp && styles.braveryPanel__body__advanced__control__forms__title_disabled,
                  gridStyles.row1col1,
                  styles.braveryPanel__body__advanced__control__forms__title
                )} />

                <div className={css(
                  !this.props.shieldsUp && styles.braveryPanel__body__advanced__control__forms__dropdown_disabled,
                  gridStyles.row2col1,
                  !this.props.isCompactBraveryPanel && styles.braveryPanel__body__advanced__control__forms__dropdown,
                  this.props.isCompactBraveryPanel && styles.braveryPanel_compact__body__advanced__control__forms__dropdown
                )}>
                  <FormDropdown
                    data-isFullWidth
                    data-isBraveryPanel
                    data-test-id='adsBlockedControl'
                    value={this.props.adControl}
                    onChange={this.onToggleAdControl}
                    disabled={!this.props.shieldsUp}
                  >
                    <option data-l10n-id='showBraveAds' data-test-id='showBraveAds' value='showBraveAds' />
                    <option data-l10n-id='blockAds' data-test-id='blockAdsOption' value='blockAds' />
                    <option data-l10n-id='allowAdsAndTracking' data-test-id='showAdsOption' value='allowAdsAndTracking' />
                  </FormDropdown>
                </div>

                <SwitchControl customStyleWrapper={[
                  !this.props.isCompactBraveryPanel && gridStyles.row5col1,
                  this.props.isCompactBraveryPanel && gridStyles.row7col1,
                  this.props.isCompactBraveryPanel && styles.braveryPanel_compact__body__advanced__control__switchControl
                ]}
                  onClick={this.onToggleHTTPSE}
                  rightl10nId='httpsEverywhere'
                  checkedOn={this.props.httpsEnabled}
                  disabled={!this.props.shieldsUp}
                  testId='httpsEverywhereSwitch'
                />

                <SwitchControl customStyleWrapper={[
                  !this.props.isCompactBraveryPanel && gridStyles.row6col1,
                  this.props.isCompactBraveryPanel && gridStyles.row8col1,
                  !this.props.isCompactBraveryPanel && styles.braveryPanel__body__advanced__control__switchControl_noScript,
                  this.props.isCompactBraveryPanel && styles.braveryPanel_compact__body__advanced__control__switchControl
                ]}
                  onClick={this.onToggleNoScript}
                  rightl10nId='noScript'
                  checkedOn={this.props.noScriptEnabled}
                  disabled={!this.props.shieldsUp}
                  testId='noScriptSwitch'
                />

                <div data-l10n-id='cookieControl' className={css(
                  !this.props.shieldsUp && styles.braveryPanel__body__advanced__control__forms__title_disabled,
                  !this.props.isCompactBraveryPanel && gridStyles.row1col2,
                  this.props.isCompactBraveryPanel && gridStyles.row3col1,
                  styles.braveryPanel__body__advanced__control__forms__title
                )} />

                <div className={css(
                  !this.props.shieldsUp && styles.braveryPanel__body__advanced__control__forms__dropdown_disabled,
                  !this.props.isCompactBraveryPanel && gridStyles.row2col2,
                  !this.props.isCompactBraveryPanel && styles.braveryPanel__body__advanced__control__forms__dropdown,
                  this.props.isCompactBraveryPanel && gridStyles.row4col1,
                  this.props.isCompactBraveryPanel && styles.braveryPanel_compact__body__advanced__control__forms__dropdown
                )}>
                  <FormDropdown
                    data-isFullWidth
                    data-isBraveryPanel
                    data-test-id='cookieControl'
                    value={this.props.cookieControl}
                    onChange={this.onToggleCookieControl}
                    disabled={!this.props.shieldsUp}
                  >
                    <option data-l10n-id='block3rdPartyCookie' value='block3rdPartyCookie' />
                    <option data-l10n-id='allowAllCookies' data-test-id='allowAllCookies' value='allowAllCookies' />
                    <option data-l10n-id='blockAllCookies' data-test-id='blockAllCookies' value='blockAllCookies' />
                  </FormDropdown>
                </div>

                <div className={css(
                  !this.props.shieldsUp && styles.braveryPanel__body__advanced__control__forms__title_disabled,
                  !this.props.isCompactBraveryPanel && gridStyles.row3col1,
                  this.props.isCompactBraveryPanel && gridStyles.row5col1,
                  styles.braveryPanel__body__advanced__control__fpWrapper,
                  styles.braveryPanel__body__advanced__control__forms__title
                )}>
                  <span data-l10n-id='fingerprintingProtection' />
                  <span className={globalStyles.appIcons.question}
                    title={config.fingerprintingInfoUrl}
                    onClick={this.onInfoClick}
                  />
                </div>

                <div className={css(
                  !this.props.shieldsUp && styles.braveryPanel__body__advanced__control__forms__dropdown_disabled,
                  !this.props.isCompactBraveryPanel && gridStyles.row4col1,
                  !this.props.isCompactBraveryPanel && styles.braveryPanel__body__advanced__control__forms__dropdown,
                  this.props.isCompactBraveryPanel && gridStyles.row6col1,
                  this.props.isCompactBraveryPanel && styles.braveryPanel_compact__body__advanced__control__forms__dropdown
                )}>
                  <FormDropdown
                    data-isFullWidth
                    data-isBraveryPanel
                    data-test-id='fpControl'
                    value={this.props.fingerprintingProtection}
                    onChange={this.onToggleFp}
                    disabled={!this.props.shieldsUp}
                  >
                    <option data-l10n-id='block3rdPartyFingerprinting' data-test-id='block3rdPartyFingerprinting' value='block3rdPartyFingerprinting' />
                    <option data-l10n-id='allowAllFingerprinting' data-test-id='allowAllFingerprinting' value='allowAllFingerprinting' />
                    <option data-l10n-id='blockAllFingerprinting' data-test-id='blockAllFingerprinting' value='blockAllFingerprinting' />
                  </FormDropdown>
                </div>

                <SwitchControl customStyleWrapper={[
                  !this.props.isCompactBraveryPanel && gridStyles.row5col2,
                  this.props.isCompactBraveryPanel && gridStyles.row9col1,
                  this.props.isCompactBraveryPanel && styles.braveryPanel_compact__body__advanced__control__switchControl
                ]}
                  onClick={this.onToggleSafeBrowsing}
                  rightl10nId='safeBrowsing'
                  checkedOn={this.props.safeBrowsing}
                  disabled={!this.props.shieldsUp}
                  testId='safeBrowsingSwitch'
                />
              </div>
            </section>
            : null
          }
          {
            this.props.isTor
            ? <div className={css(
              styles.braveryPanel__body__footer__tor,
              this.props.isCompactBraveryPanel && styles.braveryPanel_compact__body__footer__tor
            )}
              data-l10n-id='braveryTorWarning'
            />
            : null
          }
          <hr className={css(
            styles.braveryPanel__body__hr,
            this.props.isCompactBraveryPanel && styles.braveryPanel_compact__body__hr
          )} />
          <div className={css(
            styles.braveryPanel__body__footer,
            this.props.isCompactBraveryPanel && styles.braveryPanel_compact__body__footer
          )}>
            <span className={css(
              styles.braveryPanel__body__footer__edit,
              styles.braveryPanel__body__footer__edit_clickable,
              this.props.isCompactBraveryPanel && styles.braveryPanel_compact__body__footer__edit
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
          {
            this.props.isTor
              ? <div>
                <span className={css(
                  styles.braveryPanel__body__footer__tor,
                  styles.braveryPanel__body__footer__edit_clickable,
                  this.props.isCompactBraveryPanel && styles.braveryPanel_compact__body__footer__tor
                )}
                  onClick={this.onNewTorCircuit}
                  data-l10n-id='newTorCircuit'
                />
                <span className={globalStyles.appIcons.question}
                  title={config.torCircuitInfoUrl}
                  onClick={this.onTorInfoClick}
                />
              </div>
            : null
          }
        </section>
      </div>
    </Dialog>
  }
}

module.exports = ReduxComponent.connect(BraveryPanel)

const displayHost = {
  fontSize: '20px',
  fontWeight: 'normal',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  overflow: 'hidden',

  // See #11878: avoid a very long domain drom covering the webview.
  // The value should maintain the panel width until 0.19.
  // https://github.com/brave/browser-laptop/blob/0.19.x/app/renderer/components/main/braveryPanel.js#L708
  maxWidth: '320px'
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
  row5col2: {
    gridRow: 5,
    gridColumn: 2
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
  },
  row9col1: {
    gridRow: 9,
    gridColumn: 1
  }
})

const buttonSize = '13px'

const styles = StyleSheet.create({
  braveryPanel: {
    padding: 0,
    right: '20px',
    userSelect: 'none',
    cursor: 'default',
    color: globalStyles.braveryPanel.color,
    overflowY: 'auto',
    maxHeight: `calc(100% - ${globalStyles.spacing.dialogTopOffset})`,
    maxWidth: 'calc(100% - 40px)'
  },
  braveryPanel_compact: {
    width: 'auto',
    maxWidth: '50vw'
  },

  // braveryPanelHeader - Common
  braveryPanel__header: {
    color: globalStyles.braveryPanel.header.color,
    background: globalStyles.braveryPanel.header.background,
    display: 'flex',
    padding: '20px',
    borderTopLeftRadius: globalStyles.radius.borderRadius,
    borderTopRightRadius: globalStyles.radius.borderRadius
  },
  braveryPanel__header__left: {
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    marginRight: '10px'
  },
  braveryPanel__header__right: {
    marginLeft: 'auto'
  },

  // braveryPanelHeader - Compact Panel
  braveryPanel_compact__header: {
    flexFlow: 'column nowrap',
    padding: '0.75rem'
  },
  braveryPanel_compact__header__top: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '0 .25rem .5rem .25rem',
    borderBottom: globalStyles.braveryPanel.header.border
  },
  braveryPanel_compact__header__top__left: {
    fontSize: '1.1em'
  },
  braveryPanel_compact__header__top__right: {
    display: 'flex',
    alignItems: 'center'
  },
  braveryPanel_compact__header__top__right__switchControl: {
    padding: '0 25px'
  },
  braveryPanel_compact__header__top__right__close: {
    // ref: https://github.com/brave/browser-laptop/blob/master/app/renderer/components/common/modalOverlay.js#L160
    display: 'inline-block',
    color: globalStyles.braveryPanel.header.color,
    height: buttonSize,
    width: buttonSize,
    cursor: 'pointer',
    position: 'absolute',
    top: '15px',
    right: '10px',

    // TODO: refactor button to remove !important
    padding: '0 !important',
    background: `url(${closeButton}) center no-repeat !important`,
    backgroundSize: `${buttonSize} ${buttonSize} !important`,

    ':focus': {
      outline: 'none'
    }
  },
  braveryPanel_compact__header__bottom: {
    display: 'flex',
    flexFlow: 'column nowrap',
    marginLeft: 0,
    padding: '.5rem .25rem 0'
  },
  braveryPanel_compact__header__bottom__title: {
    fontWeight: 300
  },
  braveryPanel_compact__header__bottom__displayHost: displayHost,

  // braveryPanelHeader - Normal Panel
  braveryPanel__header__left__displayHost: displayHost,
  braveryPanel__header__right__switchControl: {
    padding: 0
  },
  braveryPanel__header__right__switchControl__topText: {
    color: globalStyles.braveryPanel.header.switchControlTopTextColor
  },

  // braveryPanelStats - Common
  braveryPanel__stats: {
    boxSizing: 'border-box',
    display: 'grid',
    justifyContent: 'space-around',
    maxWidth: 'initial',
    width: '100%',
    background: globalStyles.braveryPanel.stats.background,
    padding: '20px'
  },
  braveryPanel__stats__item_count_adsBlockedStat: {
    color: globalStyles.braveryPanel.stats.colorAds
  },
  braveryPanel__stats__item_count_redirectedResourcesStat: {
    color: globalStyles.braveryPanel.stats.colorRedirected
  },
  braveryPanel__stats__item_count_noScriptStat: {
    color: globalStyles.braveryPanel.stats.colorNoScript
  },
  braveryPanel__stats__item_count_fpStat: {
    color: globalStyles.braveryPanel.stats.colorFp
  },
  braveryPanel__stats__item_count_clickable: {
    cursor: 'pointer'
  },
  braveryPanel__stats__item_count_disabled: {
    opacity: 0.3
  },
  braveryPanel__stats__item_label_clickable: {
    cursor: 'pointer'
  },
  braveryPanel__stats__item_label_disabled: {
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
    padding: '.5rem .75rem',
    alignItems: 'center',
    justifyContent: 'flex-start'
  },
  braveryPanel_compact__stats__item_count: {
    display: 'flex',
    justifyContent: 'flex-end',
    maxWidth: '100%',
    fontSize: '1.7rem',
    minWidth: '2ch'
  },
  braveryPanel_compact__stats__item_label: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    paddingLeft: '.3rem'
  },

  // braveryPanelBody - Common
  braveryPanel__body: {
    background: globalStyles.braveryPanel.body.background,
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
    overflowY: 'auto',
    marginTop: '-20px',
    padding: '10px',

    // #11641
    userSelect: 'text'
  },
  braveryPanel__body__ul__li: {
    listStyleType: 'none',
    padding: '10px 0',
    cursor: 'text',

    // #9839 and #11878: Avoid the panel width from increasing.
    width: 0,
    whiteSpace: 'nowrap'
  },
  braveryPanel__body__hr: {
    background: globalStyles.braveryPanel.body.hr.background,
    border: 0,
    height: '1px',
    margin: '1rem 0'
  },
  braveryPanel__body__footer: {
    display: 'flex',
    flexFlow: 'row wrap',
    justifyContent: 'space-between'
  },
  braveryPanel__body__footer__edit: {
    marginRight: '1rem'
  },
  braveryPanel__body__footer__tor: {
    marginTop: '10px'
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
    padding: `1rem .75rem calc(1rem - ${editGlobalMarginBottom})`
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
    padding: '0 .5rem 1rem',
    margin: '0 0 .25rem 0',
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
  braveryPanel_compact__body__advanced__control__forms__dropdown: {
    marginBottom: '.75rem'
  },
  braveryPanel_compact__body__advanced__control__switchControl: {
    padding: '5px .25rem'
  },
  braveryPanel_compact__body__footer: {
    padding: '0 .25rem'
  },
  braveryPanel_compact__body__footer__edit: {
    marginBottom: editGlobalMarginBottom
  },
  braveryPanel_compact__body__footer__tor: {
    maxWidth: '300px',
    marginLeft: '4px'
  },

  // controlWrapper - Common
  braveryPanel__body__advanced__control: {
    display: 'grid',
    gridColumnGap: '1rem',
    gridTemplateColumns: 'max-content max-content',
    margin: '15px 10px'
  },
  braveryPanel__body__advanced__control__forms__title: {
    margin: '0 .25rem .25rem .25rem'
  },
  braveryPanel__body__advanced__control__forms__title_disabled: {
    opacity: 0.3
  },
  braveryPanel__body__advanced__control__forms__dropdown_disabled: {
    opacity: 0.3
  },
  braveryPanel__body__advanced__control__fpWrapper: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  braveryPanel__body__advanced__control__switchControl_noScript: {
    marginTop: '2.5px'
  },
  braveryPanel__body__advanced__control__switchControl__infoButton: {
    display: 'inline',
    cursor: 'pointer',
    paddingLeft: '2px',
    fontSize: '15px'
  },

  // controlWrapper - Normal Panel
  braveryPanel__body__advanced__control__forms__dropdown: {
    marginBottom: '1rem'
  },

  // controlWrapper - Compact Panel
  braveryPanel_compact__body__advanced__control: {
    gridColumnGap: 0,
    gridTemplateColumns: 'initial',
    margin: 0,

    // Align the advanced control wrapper with the counters
    padding: '0 4px'
  }
})
