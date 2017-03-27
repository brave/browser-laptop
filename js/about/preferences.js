/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

// Note that these are webpack requires, not CommonJS node requiring requires
const React = require('react')
const ImmutableComponent = require('../components/immutableComponent')
const Immutable = require('immutable')
const UrlUtil = require('../lib/urlutil')

// Components
const PreferenceNavigation = require('../../app/renderer/components/preferences/preferenceNavigation')
const {SettingsList, SettingItem, SettingCheckbox, SettingItemIcon} = require('../../app/renderer/components/settings')
const {SettingTextbox} = require('../../app/renderer/components/textbox')
const {SettingDropdown} = require('../../app/renderer/components/dropdown')
const Button = require('../components/button')

// Tabs
const PaymentsTab = require('../../app/renderer/components/preferences/paymentsTab')
const SyncTab = require('../../app/renderer/components/preferences/syncTab')
const PluginsTab = require('../../app/renderer/components/preferences/pluginsTab')

const {getZoomValuePercentage} = require('../lib/zoom')

const config = require('../constants/config')
const appConfig = require('../constants/appConfig')
const preferenceTabs = require('../constants/preferenceTabs')
const messages = require('../constants/messages')
const settings = require('../constants/settings')
const {changeSetting} = require('../../app/renderer/lib/settingsUtil')
const {passwordManagers, extensionIds} = require('../constants/passwordManagers')
const {startsWithOption, newTabMode, bookmarksToolbarMode, tabCloseAction, fullscreenOption} = require('../../app/common/constants/settingsEnums')

const aboutActions = require('./aboutActions')
const appActions = require('../actions/appActions')
const getSetting = require('../settings').getSetting
const SortableTable = require('../components/sortableTable')
const searchProviders = require('../data/searchProviders')

const adblock = appConfig.resourceNames.ADBLOCK
const cookieblock = appConfig.resourceNames.COOKIEBLOCK
const cookieblockAll = appConfig.resourceNames.COOKIEBLOCK_ALL
const adInsertion = appConfig.resourceNames.AD_INSERTION
const trackingProtection = appConfig.resourceNames.TRACKING_PROTECTION
const httpsEverywhere = appConfig.resourceNames.HTTPS_EVERYWHERE
const safeBrowsing = appConfig.resourceNames.SAFE_BROWSING
const noScript = appConfig.resourceNames.NOSCRIPT
const flash = appConfig.resourceNames.FLASH

const isDarwin = navigator.platform === 'MacIntel'

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

  openDownloadDialog () {
    appActions.defaultDownloadPath()
  }

  render () {
    const languageOptions = this.props.languageCodes.map(function (lc) {
      return (
        <option data-l10n-id={lc} value={lc} />
      )
    })

    let homepageValue = getSetting(settings.HOMEPAGE, this.props.settings)
    if (typeof homepageValue === 'string') {
      const punycodeUrl = UrlUtil.getPunycodeUrl(homepageValue)
      if (punycodeUrl.replace(/\/$/, '') !== homepageValue) {
        homepageValue = UrlUtil.getPunycodeUrl(homepageValue)
      }

      // we use | as a separator for multiple home pages
      homepageValue = homepageValue.replace(/%7C/g, '|')
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
        <SettingItemIcon dataL10nId='downloadDefaultPath' position='right' icon={require('../../img/icon_pencil.svg')} clickAction={this.openDownloadDialog}>
          <SettingTextbox
            spellCheck='false'
            readOnly='true'
            data-l10n-id='downloadDefaultPathInput'
            value={getSetting(settings.DOWNLOAD_DEFAULT_PATH, this.props.settings)}
            onClick={this.openDownloadDialog} />
        </SettingItemIcon>
        <SettingCheckbox dataL10nId='downloadAlwaysAsk' prefKey={settings.DOWNLOAD_ALWAYS_ASK}
          settings={this.props.settings}
          onChangeSetting={this.props.onChangeSetting} />
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
      <div data-l10n-id='requiresRestart' className='requiresRestart' />
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
              [6, 8, 10, 20, 100].map((x) =>
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
    aboutActions.setResourceEnabled(cookieblockAll, e.target.value === 'blockAllCookies')
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
            <option data-l10n-id='blockAllCookies' value='blockAllCookies' />
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
  render () {
    const lastPassPreferencesUrl = ('chrome-extension://' + extensionIds[passwordManagers.LAST_PASS] + '/tabDialog.html?dialog=preferences&cmd=open')

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
            { /* <option data-l10n-id='bitwarden' value={passwordManagers.BITWARDEN} /> */ }
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
      <SitePermissionsPage siteSettings={this.props.siteSettings} names={permissionNames} />
      <div data-l10n-id='requiresRestart' className='requiresRestart' />
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
      <div data-l10n-id='requiresRestart' className='requiresRestart' />
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
      syncStartOverlayVisible: false,
      syncAddOverlayVisible: false,
      syncNewDeviceOverlayVisible: false,
      syncQRVisible: false,
      syncPassphraseVisible: false,
      syncResetOverlayVisible: false,
      syncRestoreEnabled: false,
      preferenceTab: this.tabFromCurrentHash,
      hintNumber: this.getNextHintNumber(),
      languageCodes: Immutable.Map(),
      flashInstalled: false,
      settings: Immutable.Map(),
      siteSettings: Immutable.Map(),
      braveryDefaults: Immutable.Map(),
      ledgerData: Immutable.Map(),
      syncData: Immutable.Map(),
      firstRecoveryKey: '',
      secondRecoveryKey: ''
    }

    ipc.on(messages.SETTINGS_UPDATED, (e, settings) => {
      this.setState({ settings: Immutable.fromJS(settings || {}) })
    })
    ipc.on(messages.LEDGER_UPDATED, (e, ledgerData) => {
      this.setState({ ledgerData: Immutable.fromJS(ledgerData) })
    })
    ipc.on(messages.SYNC_UPDATED, (e, syncData) => {
      this.setState({ syncData: Immutable.fromJS(syncData) })
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
    this.enableSyncRestore = this.enableSyncRestore.bind(this)
  }

  hideAdvancedOverlays () {
    this.setState({
      advancedSettingsOverlayVisible: false,
      ledgerBackupOverlayVisible: false,
      ledgerRecoveryOverlayVisible: false
    })
    this.forceUpdate()
  }

  enableSyncRestore (enabled) {
    this.setState({
      syncRestoreEnabled: enabled
    })
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
    const syncData = this.state.syncData
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
      case preferenceTabs.PLUGINS:
        tab = <PluginsTab settings={settings} siteSettings={siteSettings} braveryDefaults={braveryDefaults} onChangeSetting={this.onChangeSetting} />
        break
      case preferenceTabs.SYNC:
        tab = <SyncTab
          settings={settings}
          onChangeSetting={this.onChangeSetting}
          enableSyncRestore={this.enableSyncRestore}
          syncRestoreEnabled={this.state.syncRestoreEnabled}
          syncData={syncData}
          showOverlay={this.setOverlayVisible.bind(this, true)}
          hideOverlay={this.setOverlayVisible.bind(this, false)}
          syncStartOverlayVisible={this.state.syncStartOverlayVisible}
          syncAddOverlayVisible={this.state.syncAddOverlayVisible}
          syncNewDeviceOverlayVisible={this.state.syncNewDeviceOverlayVisible}
          syncQRVisible={this.state.syncQRVisible}
          showQR={() => {
            this.setState({
              syncQRVisible: true
            })
          }}
          hideQR={() => {
            this.setState({
              syncQRVisible: false
            })
          }}
          syncPassphraseVisible={this.state.syncPassphraseVisible}
          showPassphrase={() => {
            this.setState({
              syncPassphraseVisible: true
            })
          }}
          hidePassphrase={() => {
            this.setState({
              syncPassphraseVisible: false
            })
          }}
          syncResetOverlayVisible={this.state.syncResetOverlayVisible}
        />
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

module.exports = {
  AboutPreferences: <AboutPreferences />
}
