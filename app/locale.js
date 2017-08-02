/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'

const L20n = require('l20n')
const path = require('path')
const ipcMain = require('electron').ipcMain
const electron = require('electron')
const app = electron.app
const {LANGUAGE, REQUEST_LANGUAGE} = require('../js/constants/messages')

// Exhaustive list of identifiers used by top and context menus
var rendererIdentifiers = function () {
  return [
    'downloadsManager',
    'confirmClearPasswords',
    'passwordCopied',
    'flashInstalled',
    'goToPrefs',
    'goToAdobe',
    'allowFlashPlayer',
    'allowWidevine',
    'about',
    'aboutApp',
    'quit',
    'quitApp',
    'addToReadingList',
    'viewPageSource',
    'copyImageAddress',
    'openImageInNewTab',
    'saveImage',
    'copyImage',
    'searchImage',
    'copyLinkAddress',
    'copyEmailAddress',
    'saveLinkAs',
    'allowFlashOnce',
    'allowFlashAlways',
    'openFlashPreferences',
    'openInNewWindow',
    'openInNewSessionTab',
    'openInNewSessionTabs',
    'openInNewPrivateTab',
    'openInNewPrivateTabs',
    'openInNewTab',
    'openInNewTabs',
    'openAllInTabs',
    'disableAdBlock',
    'disableTrackingProtection',
    'muteTab',
    'unmuteTab',
    'pinTab',
    'unpinTab',
    'deleteFolder',
    'deleteBookmark',
    'deleteBookmarks',
    'deleteHistoryEntry',
    'deleteHistoryEntries',
    'deleteLedgerEntry',
    'ledgerBackupText1',
    'ledgerBackupText2',
    'ledgerBackupText3',
    'ledgerBackupText4',
    'ledgerBackupText5',
    'editFolder',
    'editBookmark',
    'unmuteTabs',
    'muteTabs',
    'muteOtherTabs',
    'addBookmark',
    'addFolder',
    'newTab',
    'closeTab',
    'closeOtherTabs',
    'closeTabsToRight',
    'closeTabsToLeft',
    'closeTabPage',
    'bookmarkPage',
    'bookmarkLink',
    'openFile',
    'openLocation',
    'openSearch',
    'importFrom',
    'closeWindow',
    'savePageAs',
    'share',
    'undo',
    'redo',
    'cut',
    'copy',
    'paste',
    'pasteAndGo',
    'pasteAndSearch',
    'pasteWithoutFormatting',
    'delete',
    'selectAll',
    'findNext',
    'findPrevious',
    'file',
    'edit',
    'view',
    'actualSize',
    'zoomIn',
    'zoomOut',
    'toolbars',
    'stop',
    'reloadPage',
    'reloadTab',
    'cleanReload',
    'reload',
    'clone',
    'detach',
    'readingView',
    'tabManager',
    'textEncoding',
    'inspectElement',
    'toggleDeveloperTools',
    'toggleBrowserConsole',
    'toggleFullScreenView',
    'home',
    'back',
    'forward',
    'reopenLastClosedWindow',
    'showAllHistory',
    'clearCache',
    'clearHistory',
    'clearSiteData',
    'clearBrowsingData',
    'recentlyClosed',
    'recentlyVisited',
    'bookmarks',
    'addToFavoritesBar',
    'window',
    'minimize',
    'zoom',
    'selectNextTab',
    'selectPreviousTab',
    'moveTabToNewWindow',
    'mergeAllWindows',
    'downloads',
    'history',
    'bringAllToFront',
    'help',
    'sendUsFeedback',
    'services',
    'hideBrave',
    'hideOthers',
    'showAll',
    'newPrivateTab',
    'newSessionTab',
    'newWindow',
    'reopenLastClosedTab',
    'print',
    'emailPageLink',
    'tweetPageLink',
    'facebookPageLink',
    'pinterestPageLink',
    'googlePlusPageLink',
    'linkedInPageLink',
    'bufferPageLink',
    'redditPageLink',
    'findOnPage',
    'find',
    'checkForUpdates',
    'preferences',
    'settings',
    'bookmarksManager',
    'importBrowserData',
    'exportBookmarks',
    'submitFeedback',
    'bookmarksToolbar',
    'bravery',
    'braverySite',
    'braveryGlobal',
    'braveryPayments',
    'braveryStartUsingPayments',
    'blockPopups',
    'learnSpelling',
    'forgetLearnedSpelling',
    'lookupSelection',
    // Other identifiers
    'aboutBlankTitle',
    'urlCopied',
    'autoHideMenuBar',
    'unexpectedErrorWindowReload',
    'updateChannel',
    'licenseText',
    'allow',
    'deny',
    'permissionCameraMicrophone',
    'permissionLocation',
    'permissionNotifications',
    'permissionWebMidi',
    'permissionDisableCursor',
    'permissionFullscreen',
    'permissionExternal',
    'permissionProtocolRegistration',
    'permissionMessage',
    'tabsSuggestionTitle',
    'bookmarksSuggestionTitle',
    'historySuggestionTitle',
    'aboutPagesSuggestionTitle',
    'searchSuggestionTitle',
    'topSiteSuggestionTitle',
    'addFundsNotification',
    'reconciliationNotification',
    'reviewSites',
    'addFunds',
    'turnOffNotifications',
    'copyToClipboard',
    'smartphoneTitle',
    'displayQRCode',
    'updateLater',
    'updateHello',
    'notificationPasswordWithUserName',
    'notificationUpdatePasswordWithUserName',
    'notificationUpdatePassword',
    'notificationPassword',
    'notificationPasswordSettings',
    'notificationPaymentDone',
    'notificationTryPayments',
    'notificationTryPaymentsYes',
    'prefsRestart',
    'areYouSure',
    'dismiss',
    'yes',
    'no',
    'noThanks',
    'neverForThisSite',
    'passwordsManager',
    'extensionsManager',
    'downloadItemPause',
    'downloadItemResume',
    'downloadItemCancel',
    'downloadItemRedownload',
    'downloadItemCopyLink',
    'downloadItemPath',
    'downloadItemDelete',
    'downloadItemClear',
    'downloadToolbarHide',
    'downloadItemClearCompleted',
    'torrentDesc',
    // Caption buttons in titlebar (min/max/close - Windows only)
    'windowCaptionButtonMinimize',
    'windowCaptionButtonMaximize',
    'windowCaptionButtonRestore',
    'windowCaptionButtonClose',
    'closeFirefoxWarning',
    'importSuccess',
    'licenseTextOk',
    'closeFirefoxWarningOk',
    'importSuccessOk',
    'connectionError',
    'unknownError',
    'allowAutoplay',
    'autoplayMedia',
    // Release channels
    'channelDev',
    'channelBeta',
    // Country Codes,
    'AF',
    'AX',
    'AL',
    'DZ',
    'AS',
    'AD',
    'AO',
    'AI',
    'AQ',
    'AG',
    'AR',
    'AM',
    'AW',
    'AU',
    'AT',
    'AZ',
    'BS',
    'BH',
    'BD',
    'BB',
    'BY',
    'BE',
    'BZ',
    'BJ',
    'BM',
    'BT',
    'BO',
    'BQ',
    'BA',
    'BW',
    'BV',
    'BR',
    'IO',
    'BN',
    'BG',
    'BF',
    'BI',
    'KH',
    'CM',
    'CA',
    'CV',
    'KY',
    'CF',
    'TD',
    'CL',
    'CN',
    'CX',
    'CC',
    'CO',
    'KM',
    'CG',
    'CD',
    'CK',
    'CR',
    'CI',
    'HR',
    'CU',
    'CW',
    'CY',
    'CZ',
    'DK',
    'DJ',
    'DM',
    'DO',
    'EC',
    'EG',
    'SV',
    'GQ',
    'ER',
    'EE',
    'ET',
    'FK',
    'FO',
    'FJ',
    'FI',
    'FR',
    'GF',
    'PF',
    'TF',
    'GA',
    'GM',
    'GE',
    'DE',
    'GH',
    'GI',
    'GR',
    'GL',
    'GD',
    'GP',
    'GU',
    'GT',
    'GG',
    'GN',
    'GW',
    'GY',
    'HT',
    'HM',
    'VA',
    'HN',
    'HK',
    'HU',
    'IS',
    'IN',
    'ID',
    'IR',
    'IQ',
    'IE',
    'IM',
    'IL',
    'IT',
    'JM',
    'JP',
    'JE',
    'JO',
    'KZ',
    'KE',
    'KI',
    'KP',
    'KR',
    'KW',
    'KG',
    'LA',
    'LV',
    'LB',
    'LS',
    'LR',
    'LY',
    'LI',
    'LT',
    'LU',
    'MO',
    'MK',
    'MG',
    'MW',
    'MY',
    'MV',
    'ML',
    'MT',
    'MH',
    'MQ',
    'MR',
    'MU',
    'YT',
    'MX',
    'FM',
    'MD',
    'MC',
    'MN',
    'ME',
    'MS',
    'MA',
    'MZ',
    'MM',
    'NA',
    'NR',
    'NP',
    'NL',
    'NC',
    'NZ',
    'NI',
    'NE',
    'NG',
    'NU',
    'NF',
    'MP',
    'NO',
    'OM',
    'PK',
    'PW',
    'PS',
    'PA',
    'PG',
    'PY',
    'PE',
    'PH',
    'PN',
    'PL',
    'PT',
    'PR',
    'QA',
    'RE',
    'RO',
    'RU',
    'RW',
    'BL',
    'SH',
    'KN',
    'LC',
    'MF',
    'PM',
    'VC',
    'WS',
    'SM',
    'ST',
    'SA',
    'SN',
    'RS',
    'SC',
    'SL',
    'SG',
    'SX',
    'SK',
    'SI',
    'SB',
    'SO',
    'ZA',
    'GS',
    'SS',
    'ES',
    'LK',
    'SD',
    'SR',
    'SJ',
    'SZ',
    'SE',
    'CH',
    'SY',
    'TW',
    'TJ',
    'TZ',
    'TH',
    'TL',
    'TG',
    'TK',
    'TO',
    'TT',
    'TN',
    'TR',
    'TM',
    'TC',
    'TV',
    'UG',
    'UA',
    'AE',
    'GB',
    'US',
    'UM',
    'UY',
    'UZ',
    'VU',
    'VE',
    'VN',
    'VG',
    'VI',
    'WF',
    'EH',
    'YE',
    'ZM',
    'ZW'
  ]
}

var ctx = null
var translations = {}
var lang = 'en-US'

// todo: FSI/PDI stripping can probably be replaced once
// https://github.com/l20n/l20n.js/commit/2fea50bf43c43a8e930a519a37f0f64f3626e885
// is released
const FSI = '\u2068'
const PDI = '\u2069'

// Return a translate token from cache or a placeholder
// indicating that no translation is available
exports.translation = function (token, replacements = {}) {
  if (translations[token]) {
    let returnVal = translations[token]
    for (var key in replacements) {
      returnVal = returnVal.replace(new RegExp(FSI + '{{\\s*' + key + '\\s*}}' + PDI), replacements[key])
    }
    return returnVal
  } else {
    // This will return an identifier in upper case useful for determining if a translation was not requested in the menu
    // identifiers above.
    return token.toUpperCase()
  }
}

// Default language locale identifier
const DEFAULT_LANGUAGE = 'en-US'

const availableLanguages = [
  'eu',
  'bn-BD',
  'bn-IN',
  'zh-CN',
  'cs',
  'nl-NL',
  'en-US',
  'en-GB',
  'fr-FR',
  'de-DE',
  'hi-IN',
  'id-ID',
  'it-IT',
  'ja-JP',
  'ko-KR',
  'ms-MY',
  'pl-PL',
  'pt-BR',
  'ru',
  'sl',
  'sv-SE',
  'es',
  'ta',
  'te',
  'tr-TR',
  'uk'
]

// Currently configured languages
const configuredLanguages = {}
availableLanguages.forEach(function (lang) {
  configuredLanguages[lang] = true
})

// Return the default locale in xx-XX format I.e. pt-BR
const defaultLocale = function () {
  // If electron has the locale
  if (app.getLocale()) {
    // Retrieve the language and convert _ to -
    var lang = app.getLocale().replace('_', '-')
    // If there is no country code designated use the language code
    if (!lang.match(/-/)) {
      lang = lang + '-' + lang.toUpperCase()
    }
    // If we have the language configured
    if (configuredLanguages[lang]) {
      return lang
    } else {
      return DEFAULT_LANGUAGE
    }
  } else {
    return DEFAULT_LANGUAGE
  }
}

// Initialize translations for a language
exports.init = function (language) {
  // If this is in the main process
  if (ipcMain) {
    // Respond to requests for translations from the renderer process
    ipcMain.on('translations', function (event, arg) {
      // Return the entire set of translations synchronously
      event.returnValue = translations
    })

    // TODO: There shouldn't need to be a REQUEST_LANGUAGE event at all
    // Respond to requests for the currently configured language code
    ipcMain.on(REQUEST_LANGUAGE, function (event) {
      event.sender.send(LANGUAGE, {
        langCode: lang,
        languageCodes: availableLanguages
      })
    })
  }

  // Currently selected language identifier I.e. 'en-US'
  lang = language || defaultLocale()

  // Languages to support
  const langs = availableLanguages.map(function (lang) {
    return { code: lang }
  })

  const propertyFiles = []
  const appendLangProperties = function (lang) {
    // Property files to parse (only ones containing menu specific identifiers)
    propertyFiles.push(
      path.join(__dirname, 'extensions', 'brave', 'locales', lang, 'menu.properties'),
      path.join(__dirname, 'extensions', 'brave', 'locales', lang, 'app.properties'),
      path.join(__dirname, 'extensions', 'brave', 'locales', lang, 'error.properties'),
      path.join(__dirname, 'extensions', 'brave', 'locales', lang, 'passwords.properties'),
      path.join(__dirname, 'extensions', 'brave', 'locales', lang, 'common.properties'),
      path.join(__dirname, 'extensions', 'brave', 'locales', lang, 'countries.properties')
      )
  }

  appendLangProperties(lang)
  if (lang !== DEFAULT_LANGUAGE) {
    // Pass in the default locale as well
    appendLangProperties(DEFAULT_LANGUAGE)
  }

  // If langs change a new context must be created
  const env = new L20n.Env(L20n.fetchResource)
  ctx = env.createContext(langs, propertyFiles)

  // Translate the renderer identifiers
  var identifiers = rendererIdentifiers()
  return ctx.formatValues.apply(ctx, identifiers).then(function (values) {
    // Cache the translations for later retrieval
    values.forEach(function (value, idx) {
      translations[identifiers[idx]] = value
    })
    return lang
  })
}
