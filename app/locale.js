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
    'ignoreSpelling',
    'lookupSelection',
    'showTabPreviews',
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
    'unknownError'
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
const DEFAULT_LANGUAGE = lang

const availableLanguages = [
  'eu',
  'bn-BD',
  'bn-IN',
  'zh-CN',
  'cs',
  'nl-NL',
  'en-US',
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
  'es',
  'ta',
  'te',
  'tr-TR',
  'uk'
]

const lcidCode = {
"af_ZA": 1078,
"am_ET": 1118,
"ar_AE": 14337,
"ar_BH": 15361,
"ar_DZ": 5121,
"ar_EG": 3073,
"ar_IQ": 2049,
"ar_JO": 11265,
"ar_KW": 13313,
"ar_LB": 12289,
"ar_LY": 4097,
"ar_MA": 6145,
"ar_OM": 8193,
"ar_QA": 16385,
"ar_SA": 1025,
"ar_SY": 10241,
"ar_TN": 7169,
"ar_YE": 9217,
"arn_CL": 1146,
"as_IN": 1101,
"az_AZ": 2092,
"ba_RU": 1133,
"be_BY": 1059,
"bg_BG": 1026,
"bn_IN": 1093,
"bo_BT": 2129,
"bo_CN": 1105,
"br_FR": 1150,
"bs_BA": 8218,
"ca_ES": 1027,
"co_FR": 1155,
"cs_CZ": 1029,
"cy_GB": 1106,
"da_DK": 1030,
"de_AT": 3079,
"de_CH": 2055,
"de_DE": 1031,
"de_LI": 5127,
"de_LU": 4103,
"div_MV": 1125,
"dsb_DE": 2094,
"el_GR": 1032,
"en_AU": 3081,
"en_BZ": 10249,
"en_CA": 4105,
"en_CB": 9225,
"en_GB": 2057,
"en_IE": 6153,
"en_IN": 18441,
"en_JA": 8201,
"en_MY": 17417,
"en_NZ": 5129,
"en_PH": 13321,
"en_TT": 11273,
"en_US": 1033,
"en_ZA": 7177,
"en_ZW": 12297,
"es_AR": 11274,
"es_BO": 16394,
"es_CL": 13322,
"es_CO": 9226,
"es_CR": 5130,
"es_DO": 7178,
"es_EC": 12298,
"es_ES": 3082,
"es_GT": 4106,
"es_HN": 18442,
"es_MX": 2058,
"es_NI": 19466,
"es_PA": 6154,
"es_PE": 10250,
"es_PR": 20490,
"es_PY": 15370,
"es_SV": 17418,
"es_UR": 14346,
"es_US": 21514,
"es_VE": 8202,
"et_EE": 1061,
"eu_ES": 1069,
"fa_IR": 1065,
"fi_FI": 1035,
"fil_PH": 1124,
"fo_FO": 1080,
"fr_BE": 2060,
"fr_CA": 3084,
"fr_CH": 4108,
"fr_FR": 1036,
"fr_LU": 5132,
"fr_MC": 6156,
"fy_NL": 1122,
"ga_IE": 2108,
"gbz_AF": 1164,
"gl_ES": 1110,
"gsw_FR": 1156,
"gu_IN": 1095,
"ha_NG": 1128,
"he_IL": 1037,
"hi_IN": 1081,
"hr_BA": 4122,
"hr_HR": 1050,
"hu_HU": 1038,
"hy_AM": 1067,
"id_ID": 1057,
"ii_CN": 1144,
"is_IS": 1039,
"it_CH": 2064,
"it_IT": 1040,
"iu_CA": 2141,
"ja_JP": 1041,
"ka_GE": 1079,
"kh_KH": 1107,
"kk_KZ": 1087,
"kl_GL": 1135,
"kn_IN": 1099,
"ko_KR": 1042,
"kok_IN": 1111,
"ky_KG": 1088,
"lb_LU": 1134,
"lo_LA": 1108,
"lt_LT": 1063,
"lv_LV": 1062,
"mi_NZ": 1153,
"mk_MK": 1071,
"ml_IN": 1100,
"mn_CN": 2128,
"mn_MN": 1104,
"moh_CA": 1148,
"mr_IN": 1102,
"ms_BN": 2110,
"ms_MY": 1086,
"mt_MT": 1082,
"my_MM": 1109,
"nb_NO": 1044,
"ne_NP": 1121,
"nl_BE": 2067,
"nl_NL": 1043,
"nn_NO": 2068,
"ns_ZA": 1132,
"oc_FR": 1154,
"or_IN": 1096,
"pa_IN": 1094,
"pl_PL": 1045,
"ps_AF": 1123,
"pt_BR": 1046,
"pt_PT": 2070,
"qut_GT": 1158,
"quz_BO": 1131,
"quz_EC": 2155,
"quz_PE": 3179,
"rm_CH": 1047,
"ro_RO": 1048,
"ru_RU": 1049,
"rw_RW": 1159,
"sa_IN": 1103,
"sah_RU": 1157,
"se_FI": 3131,
"se_NO": 1083,
"se_SE": 2107,
"si_LK": 1115,
"sk_SK": 1051,
"sl_SI": 1060,
"sma_NO": 6203,
"sma_SE": 7227,
"smj_NO": 4155,
"smj_SE": 5179,
"smn_FI": 9275,
"sms_FI": 8251,
"sq_AL": 1052,
"sr_BA": 7194,
"sr_SP": 3098,
"sv_FI": 2077,
"sv_SE": 1053,
"sw_KE": 1089,
"syr_SY": 1114,
"ta_IN": 1097,
"te_IN": 1098,
"tg_TJ": 1064,
"th_TH": 1054,
"tk_TM": 1090,
"tmz_DZ": 2143,
"tn_ZA": 1074,
"tr_TR": 1055,
"tt_RU": 1092,
"ug_CN": 1152,
"uk_UA": 1058,
"ur_IN": 2080,
"ur_PK": 1056,
"uz_UZ": 2115,
"vi_VN": 1066,
"wen_DE": 1070,
"wo_SN": 1160,
"xh_ZA": 1076,
"yo_NG": 1130,
"zh_CHS": 4,
"zh_CHT": 31748,
"zh_CN": 2052,
"zh_HK": 3076,
"zh_MO": 5124,
"zh_SG": 4100,
"zh_TW": 1028,
"zu_ZA": 1077
}

// Currently configured languages
const configuredLanguages = {}
availableLanguages.forEach(function (lang) {
  configuredLanguages[lang] = true
})

// Return the default locale in xx-XX format I.e. pt-BR
const defaultLocale = function () {
  var ln = null
  var childProcess = require('child_process');
  let output = null
  if (process.platform === 'win32') {
    output = '' + childProcess.execSync('wmic os get locale')
    var lcidCode = parseInt(output.replace('Locale', ''), 16);
    output = lcidi[lcidCode] || null;
  } else {
    output = '' + childProcess.execSync('echo $LANG')
  }
  if (output.length > 1) {
    let pos = output.indexOf('.')
    if (pos > -1)
      output =  output.substr(0, pos)
    ln = output.replace('_', '-')
    if (availableLanguages.indexOf(ln) === -1)
      ln = null
  }
  if (ln) return ln
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
      path.join(__dirname, 'extensions', 'brave', 'locales', lang, 'common.properties'))
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
