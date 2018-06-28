/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

// Note that these are webpack requires, not CommonJS node requiring requires
const React = require('react')
const ImmutableComponent = require('../../app/renderer/components/immutableComponent')
const Immutable = require('immutable')
const {StyleSheet, css} = require('aphrodite/no-important')
const globalStyles = require('../../app/renderer/components/styles/global')
const commonStyles = require('../../app/renderer/components/styles/commonStyles')

// Components
const PreferenceNavigation = require('../../app/renderer/components/preferences/preferenceNavigation')
const {SettingsList, SettingItem, SettingCheckbox, SettingItemIcon} = require('../../app/renderer/components/common/settings')
const {SettingTextbox} = require('../../app/renderer/components/common/textbox')
const {SettingDropdown} = require('../../app/renderer/components/common/dropdown')
const {DefaultSectionTitle} = require('../../app/renderer/components/common/sectionTitle')
const BrowserButton = require('../../app/renderer/components/common/browserButton')
const SitePermissionsPage = require('../../app/renderer/components/preferences/sitePermissionsPage')

// Tabs
const PaymentsTab = require('../../app/renderer/components/preferences/paymentsTab')
const TabsTab = require('../../app/renderer/components/preferences/tabsTab')
const ShieldsTab = require('../../app/renderer/components/preferences/shieldsTab')
const SyncTab = require('../../app/renderer/components/preferences/syncTab')
const PluginsTab = require('../../app/renderer/components/preferences/pluginsTab')
const ExtensionsTab = require('../../app/renderer/components/preferences/extensionsTab')
const AdvancedTab = require('../../app/renderer/components/preferences/advancedTab')
const {populateDefaultExtensions} = require('../../app/renderer/lib/extensionsUtil')
const {getZoomValuePercentage} = require('../lib/zoom')

const config = require('../constants/config')
const appConfig = require('../constants/appConfig')
const preferenceTabs = require('../constants/preferenceTabs')
const messages = require('../constants/messages')
const settings = require('../constants/settings')
const webrtcConstants = require('../constants/webrtcConstants')
const {changeSetting} = require('../../app/renderer/lib/settingsUtil')
const {passwordManagers, extensionIds} = require('../constants/passwordManagers')
const {startsWithOption, newTabMode, bookmarksToolbarMode, fullscreenOption, autoplayOption} = require('../../app/common/constants/settingsEnums')

const aboutActions = require('./aboutActions')
const appActions = require('../actions/appActions')
const getSetting = require('../settings').getSetting
const SortableTable = require('../../app/renderer/components/common/sortableTable')
const searchProviders = require('../data/searchProviders')
const keyCodes = require('../../app/common/constants/keyCodes')

const firewall = appConfig.resourceNames.FIREWALL

const isDarwin = navigator.platform === 'MacIntel'

const ipc = window.chrome.ipcRenderer

// TODO: Determine this from the l20n file automatically
const hintCount = 3

// Stylesheets
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
  'widevine': ['boolean', 'number'],
  'autoplay': ['boolean']
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
    appActions.selectDefaultDownloadPath()
  }

  render () {
    const homepage = getSetting(settings.HOMEPAGE, this.props.settings)
    const disableShowHomeButton = !homepage || !homepage.length
    const defaultBrowser = getSetting(settings.IS_DEFAULT_BROWSER, this.props.settings)
      ? <SettingItem dataL10nId='defaultBrowser' />
      : <SettingItem dataL10nId='notDefaultBrowser' >
        <BrowserButton
          primaryColor
          l10nId='setAsDefault'
          onClick={this.setAsDefaultBrowser}
        />
      </SettingItem>
    const defaultZoomSetting = getSetting(settings.DEFAULT_ZOOM_LEVEL, this.props.settings)
    return <SettingsList>
      <DefaultSectionTitle data-test-id='generalSettings' data-l10n-id='generalSettings' />
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
          <BrowserButton
            iconOnly
            iconClass={globalStyles.appIcons.moreInfo}
            size='.95rem'
            custom={styles.appIcons_moreInfo}
            onClick={aboutActions.createTabRequested.bind(null, {
              url: 'https://community.brave.com/t/how-to-set-up-multiple-home-pages/'
            })}
            l10nId='multipleHomePages'
          />
        </div>
        <SettingItem>
          <SettingTextbox
            spellCheck='false'
            data-l10n-id='homepageInput'
            data-test-id='homepageInput'
            value={homepage}
            onChange={changeSetting.bind(null, this.onChangeSetting, settings.HOMEPAGE)} />
        </SettingItem>
        <SettingCheckbox dataL10nId='showHomeButton' prefKey={settings.SHOW_HOME_BUTTON}
          settings={this.props.settings} onChangeSetting={this.props.onChangeSetting}
          disabled={disableShowHomeButton} />
        {
          isDarwin ? null : <SettingCheckbox dataL10nId='autoHideMenuBar' prefKey={settings.AUTO_HIDE_MENU} settings={this.props.settings} onChangeSetting={this.props.onChangeSetting} />
        }
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
          <BrowserButton
            primaryColor
            l10nId='importNow'
            onClick={this.importBrowserDataNow}
          />
        </SettingItem>
        {defaultBrowser}
        <SettingItem>
          <SettingCheckbox dataL10nId='checkDefaultOnStartup' prefKey={settings.CHECK_DEFAULT_ON_STARTUP}
            settings={this.props.settings} onChangeSetting={this.props.onChangeSetting} />
        </SettingItem>
      </SettingsList>
      <div data-l10n-id='requiresRestart' className={css(commonStyles.requiresRestart)} />
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
    return <div className={css(styles.searchEntry)}>
      <span className={css(styles.searchEntry__icon)} style={this.props.iconStyle} />
      <span className={css(styles.searchEntry__name)}>{this.props.name}</span>
    </div>
  }
}

class SearchShortcutEntry extends ImmutableComponent {
  render () {
    return <span className={css(styles.searchShortcutEntry)}>
      {this.props.shortcut}
    </span>
  }
}

class SearchTab extends ImmutableComponent {
  get searchProviders () {
    let entries = searchProviders.providers
    let array = []

    entries.forEach((entry) => {
      let iconStyle = {backgroundImage: `url(${entry.localImage})`}

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
      <DefaultSectionTitle data-test-id='searchSettings' data-l10n-id='searchSettings' />
      <SortableTable headings={['default', 'searchEngine', 'engineGoKey']} rows={this.searchProviders}
        defaultHeading='searchEngine'
        addHoverClass
        onClick={this.hoverCallback.bind(this)}
        tableClassNames={css(styles.sortableTable_searchTab)}
      />
      <SettingsList>
        <DefaultSectionTitle data-l10n-id='privateTabsSearchSettingsTitle' />
        <SettingCheckbox dataL10nId='useDuckDuckGoForPrivateSearch' prefKey={settings.USE_ALTERNATIVE_PRIVATE_SEARCH_ENGINE} settings={this.props.settings} onChangeSetting={this.props.onChangeSetting} />
        <SettingCheckbox dataL10nId='useDuckDuckGoForPrivateSearchTor' prefKey={settings.USE_ALTERNATIVE_PRIVATE_SEARCH_ENGINE_TOR} settings={this.props.settings} onChangeSetting={this.props.onChangeSetting} />
      </SettingsList>
      <DefaultSectionTitle data-l10n-id='locationBarSettings' />
      <SettingsList>
        <SettingCheckbox dataL10nId='showOpenedTabMatches' prefKey={settings.OPENED_TAB_SUGGESTIONS} settings={this.props.settings} onChangeSetting={this.props.onChangeSetting} />
        <SettingCheckbox dataL10nId='showHistoryMatches' prefKey={settings.HISTORY_SUGGESTIONS} settings={this.props.settings} onChangeSetting={this.props.onChangeSetting} />
        <SettingCheckbox dataL10nId='showBookmarkMatches' prefKey={settings.BOOKMARK_SUGGESTIONS} settings={this.props.settings} onChangeSetting={this.props.onChangeSetting} />
        <SettingCheckbox dataL10nId='showTopsiteSuggestions' prefKey={settings.TOPSITE_SUGGESTIONS} settings={this.props.settings} onChangeSetting={this.props.onChangeSetting} />
        <SettingCheckbox dataL10nId='offerSearchSuggestions' prefKey={settings.OFFER_SEARCH_SUGGESTIONS} settings={this.props.settings} onChangeSetting={this.props.onChangeSetting} />
      </SettingsList>
    </div>
  }
}

class SecurityTab extends ImmutableComponent {
  constructor (e) {
    super()
    this.clearBrowsingDataNow = this.clearBrowsingDataNow.bind(this)
    this.onToggleFirewall = this.onToggleFirewall.bind(this)
  }
  onToggleFirewall (e) {
    aboutActions.setResourceEnabled(firewall, e.target.value)
  }
  clearBrowsingDataNow () {
    aboutActions.clearBrowsingDataNow()
  }
  render () {
    const lastPassPreferencesUrl = ('chrome-extension://' + extensionIds[passwordManagers.LAST_PASS] + '/tabDialog.html?dialog=preferences&cmd=open')

    return <div>
      <DefaultSectionTitle data-l10n-id='privateData' />
      <SettingsList dataL10nId='privateDataMessage'>
        <SettingCheckbox dataTestId='clearBrowsingHistory' dataL10nId='browsingHistory' prefKey={settings.SHUTDOWN_CLEAR_HISTORY} settings={this.props.settings} onChangeSetting={this.props.onChangeSetting} />
        <SettingCheckbox dataL10nId='downloadHistory' prefKey={settings.SHUTDOWN_CLEAR_DOWNLOADS} settings={this.props.settings} onChangeSetting={this.props.onChangeSetting} />
        <SettingCheckbox dataL10nId='cachedImagesAndFiles' prefKey={settings.SHUTDOWN_CLEAR_CACHE} settings={this.props.settings} onChangeSetting={this.props.onChangeSetting} />
        <SettingCheckbox dataL10nId='allSiteCookies' prefKey={settings.SHUTDOWN_CLEAR_ALL_SITE_COOKIES} settings={this.props.settings} onChangeSetting={this.props.onChangeSetting} />
        <SettingCheckbox dataL10nId='autocompleteData' prefKey={settings.SHUTDOWN_CLEAR_AUTOCOMPLETE_DATA} settings={this.props.settings} onChangeSetting={this.props.onChangeSetting} />
        <SettingCheckbox dataL10nId='autofillData' prefKey={settings.SHUTDOWN_CLEAR_AUTOFILL_DATA} settings={this.props.settings} onChangeSetting={this.props.onChangeSetting} />
        <SettingCheckbox dataL10nId='savedSiteSettings' prefKey={settings.SHUTDOWN_CLEAR_SITE_SETTINGS} settings={this.props.settings} onChangeSetting={this.props.onChangeSetting} />
        <SettingCheckbox dataL10nId='publishersClear' prefKey={settings.SHUTDOWN_CLEAR_PUBLISHERS} settings={this.props.settings} onChangeSetting={this.props.onChangeSetting} />
        {/* TODO: move this inline style to Aphrodite once refactored */}
        <div style={{marginTop: '15px'}}>
          <BrowserButton
            primaryColor
            l10nId='clearBrowsingDataNow'
            testId='clearBrowsingDataButton'
            onClick={this.clearBrowsingDataNow}
          />
        </div>
      </SettingsList>
      <DefaultSectionTitle data-l10n-id='passwordsAndForms' />
      <SettingsList>
        <SettingItem dataL10nId='passwordManager'>
          <SettingDropdown
            value={getSetting(settings.ACTIVE_PASSWORD_MANAGER, this.props.settings)}
            onChange={changeSetting.bind(null, this.props.onChangeSetting, settings.ACTIVE_PASSWORD_MANAGER)} >
            <option data-l10n-id='builtInPasswordManager' value={passwordManagers.BUILT_IN} />
            <option data-l10n-id='onePassword' value={passwordManagers.ONE_PASSWORD} />
            <option data-l10n-id='dashlane' value={passwordManagers.DASHLANE} />
            <option data-l10n-id='lastPass' value={passwordManagers.LAST_PASS} />
            <option data-l10n-id='bitwarden' value={passwordManagers.BITWARDEN} />
            { /* <option data-l10n-id='enpass' value={passwordManagers.ENPASS} /> */ }
            <option data-l10n-id='doNotManageMyPasswords' value={passwordManagers.UNMANAGED} />
          </SettingDropdown>
        </SettingItem>
        {
          getSetting(settings.ACTIVE_PASSWORD_MANAGER, this.props.settings) === passwordManagers.BUILT_IN
          ? <label className={css(commonStyles.linkText, commonStyles.linkText_small)} data-l10n-id='managePasswords'
            onClick={aboutActions.createTabRequested.bind(null, {
              url: 'about:passwords'
            })} />
          : null
        }
        {
          getSetting(settings.ACTIVE_PASSWORD_MANAGER, this.props.settings) === passwordManagers.LAST_PASS
          ? <label className={css(commonStyles.linkText, commonStyles.linkText_small)} data-l10n-id='preferences'
            onClick={aboutActions.createTabRequested.bind(null, {
              url: lastPassPreferencesUrl
            })} />
          : null
        }
      </SettingsList>
      <DefaultSectionTitle data-l10n-id='autofillSettings' />
      <SettingsList>
        <SettingCheckbox dataL10nId='enableAutofill' prefKey={settings.AUTOFILL_ENABLED} settings={this.props.settings} onChangeSetting={this.props.onChangeSetting} />
        {/* TODO: move this inline style to Aphrodite once refactored */}
        <div style={{marginTop: '15px'}}>
          <BrowserButton
            primaryColor
            l10nId='manageAutofillData'
            disabled={!getSetting(settings.AUTOFILL_ENABLED, this.props.settings)}
            onClick={aboutActions.createTabRequested.bind(null, {
              url: 'about:autofill'
            })}
          />
        </div>
      </SettingsList>
      <DefaultSectionTitle data-l10n-id='fullscreenContent' />
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
      <DefaultSectionTitle data-l10n-id='autoplay' />
      <SettingsList>
        <SettingItem>
          <SettingDropdown
            value={getSetting(settings.AUTOPLAY_MEDIA, this.props.settings)}
            onChange={changeSetting.bind(null, this.props.onChangeSetting, settings.AUTOPLAY_MEDIA)}>
            <option data-l10n-id='alwaysAsk' value={autoplayOption.ALWAYS_ASK} />
            <option data-l10n-id='alwaysAllow' value={autoplayOption.ALWAYS_ALLOW} />
            <option data-l10n-id='alwaysDeny' value={autoplayOption.ALWAYS_DENY} />
          </SettingDropdown>
        </SettingItem>
      </SettingsList>
      <DefaultSectionTitle data-l10n-id='doNotTrackTitle' />
      <SettingsList>
        <SettingCheckbox dataL10nId='doNotTrack' prefKey={settings.DO_NOT_TRACK} settings={this.props.settings} onChangeSetting={this.props.onChangeSetting} />
      </SettingsList>
      <DefaultSectionTitle data-l10n-id='siteIsolation' />
      <SettingsList>
        <SettingCheckbox dataL10nId='useSiteIsolation' prefKey={settings.SITE_ISOLATION_ENABLED} settings={this.props.settings} onChangeSetting={this.props.onChangeSetting} />
      </SettingsList>
      <DefaultSectionTitle data-l10n-id='webrtcPolicy' />
      <SettingsList>
        <SettingDropdown
          value={(
            getSetting(settings.WEBRTC_POLICY, this.props.settings)
          )}
          onChange={changeSetting.bind(
            null,
            this.props.onChangeSetting,
            settings.WEBRTC_POLICY
          )}>
          {
            Object.keys(webrtcConstants)
              .map((policy) => <option data-l10n-id={policy} value={webrtcConstants[policy]} />)
          }
        </SettingDropdown>
        <label
          className={css(styles.link)}
          data-l10n-id='webrtcPolicyExplanation'
          onClick={aboutActions.createTabRequested.bind(null, {
            url: 'https://github.com/brave/browser-laptop/wiki/WebRTC-Custom-Settings'
          })}
        />
      </SettingsList>
      <DefaultSectionTitle data-l10n-id='firewall' />
      <SettingsList>
        <SettingCheckbox dataL10nId='useFirewall' checked={this.props.braveryDefaults.get(firewall)} onChange={this.onToggleFirewall} />
      </SettingsList>
      <SitePermissionsPage siteSettings={this.props.siteSettings} names={permissionNames} />
      <div data-l10n-id='requiresRestart' className={css(commonStyles.requiresRestart)} />
    </div>
  }
}

class AboutPreferences extends React.Component {
  constructor (props) {
    super(props)
    this.focusElement = null
    this.overlayName = ''
    this.setFocusElement = element => {
      this.focusElement = element
    }
    this.state = {
      paymentHistoryOverlayVisible: false,
      deletedSitesOverlayVisible: false,
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
      syncData: Immutable.Map()
    }

    // Similar to tabFromCurrentHash, this allows to set
    // state via a query string inside the hash.
    const params = this.hashParams
    if (params && typeof this.state[params] === 'boolean') {
      this.state[params] = true
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
    ipc.on(messages.EXTENSIONS_UPDATED, (e, extensionsData) => {
      const extensions = populateDefaultExtensions(extensionsData)
      this.setState({ extensions: Immutable.fromJS(extensions || {}) })
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
    this.removeParams()
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
    const newState = {
      preferenceTab: this.tabFromCurrentHash
    }
    // first attempt at solving https://github.com/brave/browser-laptop/issues/8966
    // only handles one param and sets it to true
    const params = this.hashParams
    if (params && typeof this.state[params] === 'boolean') {
      newState[params] = true
    }
    this.setState(newState)
  }

  /**
   * Using the history API, this removes any parameters
   * from the current URL, leaving only the needed hash (ex #payments)
   * This does not reload the page, it only modifies the browser history state,
   * which replaces what is entered in the address bar
   */
  removeParams () {
    window.history.replaceState(null, null, `#${this.hash}`)
  }

  /**
   * Parses a query string like:
   * about:preferences#payments?ledgerBackupOverlayVisible
   * and returns the part:
   * `payments`
   */
  get hash () {
    const hash = window.location.hash ? window.location.hash.slice(1) : ''
    return hash.split('?', 2)[0]
  }

  /**
   * Parses a query string like:
   * about:preferences#payments?ledgerBackupOverlayVisible
   * and returns the part:
   * `ledgerBackupOverlayVisible`
   */
  get hashParams () {
    const hash = window.location.hash ? window.location.hash.slice(1) : ''
    const splitHash = hash.split('?', 2)
    if (splitHash.length === 2) {
      return splitHash[1]
    }
    return undefined
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
    const settingsRequiringRestart = [
      settings.HARDWARE_ACCELERATION_ENABLED,
      settings.DO_NOT_TRACK,
      settings.LANGUAGE,
      settings.PDFJS_ENABLED,
      settings.TORRENT_VIEWER_ENABLED,
      settings.SMOOTH_SCROLL_ENABLED,
      settings.SITE_ISOLATION_ENABLED,
      settings.SEND_CRASH_REPORTS,
      settings.SPELLCHECK_ENABLED,
      settings.SPELLCHECK_LANGUAGES
    ]
    if (settingsRequiringRestart.includes(key)) {
      aboutActions.requireRestart(key, value)
    }
    if (key === settings.PAYMENTS_ENABLED && value === true) {
      this.createWallet()
    }
  }

  /**
   * Sets the overlay name listened to on escape key
   * @param {string} name - Prefix name of the overlay
   * @returns {void}
   */
  setOverlayName = (name) => {
    this.overlayName = name
    this.focusElement.focus()
  }

  /**
   * Executes when navigating back and forth through a wizard dialog
   * @returns {void}
   */
  onNavigate = () => {
    this.focusElement.focus()
  }

  /**
   * Listens for when 'escape' is pressed
   * @param {event} e - current event
   * @returns {void}
   */
  onEscape = (e) => {
    if (e.keyCode === keyCodes.ESC && this.overlayName !== '') {
      e.stopPropagation()
      this.setOverlayVisible(false, this.overlayName)
    }
  }

  setOverlayVisible (isVisible, overlayName) {
    let stateDiff = {}
    stateDiff[`${overlayName}OverlayVisible`] = isVisible
    this.setState(stateDiff)
    if (isVisible === false) {
      // Tell ledger when Add Funds overlay is closed
      if (overlayName === 'addFunds') {
        appActions.onAddFundsClosed()
        appActions.onChangeAddFundsDialogStep('addFundsWizardMain')
      } else if (overlayName === 'ledgerBackup' || overlayName === 'ledgerRecovery') {
        this.setOverlayName('advancedSettings')
        this.focusElement.focus()
      } else {
        this.setOverlayName('')
      }
      this.removeParams()
    }
  }

  createWallet () {
    if (this.state.ledgerData && !this.state.ledgerData.get('created')) {
      appActions.onLedgerWalletCreate()
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
    const extensions = this.state.extensions
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
          setOverlayName={this.setOverlayName}
          onNavigate={this.onNavigate}
          showQR={() => {
            this.setState({
              syncQRVisible: true
            })
            this.onNavigate()
          }}
          hideQR={() => {
            this.setState({
              syncQRVisible: false
            })
            this.onNavigate()
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
          paymentHistoryOverlayVisible={this.state.paymentHistoryOverlayVisible}
          deletedSitesOverlayVisible={this.state.deletedSitesOverlayVisible}
          advancedSettingsOverlayVisible={this.state.advancedSettingsOverlayVisible}
          ledgerBackupOverlayVisible={this.state.ledgerBackupOverlayVisible}
          ledgerRecoveryOverlayVisible={this.state.ledgerRecoveryOverlayVisible}
          addFundsOverlayVisible={this.state.addFundsOverlayVisible}
          showOverlay={this.setOverlayVisible.bind(this, true)}
          hideOverlay={this.setOverlayVisible.bind(this, false)}
          hideAdvancedOverlays={this.hideAdvancedOverlays.bind(this)}
          setOverlayName={this.setOverlayName}
          onNavigate={this.onNavigate}
        />
        break
      case preferenceTabs.EXTENSIONS:
        tab = <ExtensionsTab extensions={extensions} settings={settings} onChangeSetting={this.onChangeSetting} />
        break
      case preferenceTabs.SECURITY:
        tab = <SecurityTab settings={settings} siteSettings={siteSettings} braveryDefaults={braveryDefaults} onChangeSetting={this.onChangeSetting} />
        break
      case preferenceTabs.ADVANCED:
        tab = <AdvancedTab
          settings={settings}
          languageCodes={languageCodes}
          onChangeSetting={this.onChangeSetting} />
        break
    }
    return <div>
      <PreferenceNavigation preferenceTab={this.state.preferenceTab} hintNumber={this.state.hintNumber}
        changeTab={this.changeTab.bind(this)}
        refreshHint={this.refreshHint.bind(this)}
        getNextHintNumber={this.getNextHintNumber.bind(this)} />
      <div className='prefBody' onKeyDown={(e) => this.onEscape(e)} ref={this.setFocusElement} tabIndex='0'>
        <div className='prefTabContainer'>
          {tab}
        </div>
      </div>
    </div>
  }
}

const styles = StyleSheet.create({
  appIcons_moreInfo: {
    marginLeft: '5px'
  },

  sortableTable_searchTab: {
    width: '704px',
    marginBottom: globalStyles.spacing.settingsListContainerMargin // See syncTab.js for use cases
  },

  searchEntry: {
    display: 'flex',
    alignItems: 'center'
  },

  searchEntry__icon: {
    height: '1rem',
    width: '1rem',
    backgroundSize: '1rem',

    // See table__tbody__tr__td on sortableTable.js
    marginRight: globalStyles.sortableTable.cell.normal.padding
  },

  searchEntry__name: {
    fontSize: '1rem'
  },

  searchShortcutEntry: {
    fontSize: '1rem'
  },

  link: {
    cursor: 'pointer',
    fontSize: '14px',
    lineHeight: '3em',
    textDecoration: 'underline'
  }
})

module.exports = {
  AboutPreferences: <AboutPreferences />
}
