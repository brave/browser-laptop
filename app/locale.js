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
  const countryCodes = require('./common/constants/countryCodes')

  return [
    'about',
    'aboutApp',
    'actualSize',
    'addBookmark',
    'addFolder',
    'addToFavoritesBar',
    'addToReadingList',
    'allowFlashAlways',
    'allowFlashOnce',
    'allowFlashPlayer',
    'allowWidevine',
    'back',
    'blockPopups',
    'bookmarkLink',
    'bookmarkPage',
    'bookmarks',
    'bookmarksManager',
    'bookmarksToolbar',
    'bravery',
    'braveryGlobal',
    'braveryPayments',
    'braverySite',
    'braveryStartUsingPayments',
    'bringAllToFront',
    'bufferPageLink',
    'checkForUpdates',
    'cleanReload',
    'clearBrowsingData',
    'clearCache',
    'clearHistory',
    'clearSiteData',
    'clone',
    'closeOtherTabs',
    'closeTab',
    'closeTabPage',
    'closeTabsToLeft',
    'closeTabsToRight',
    'closeWindow',
    'confirmClearPasswords',
    'copy',
    'copyEmailAddress',
    'copyImage',
    'copyImageAddress',
    'copyLinkAddress',
    'cut',
    'delete',
    'deleteBookmark',
    'deleteBookmarks',
    'deleteFolder',
    'deleteHistoryEntries',
    'deleteHistoryEntry',
    'deleteLedgerEntry',
    'detach',
    'disableAdBlock',
    'disableTrackingProtection',
    'downloads',
    'downloadsManager',
    'edit',
    'editBookmark',
    'editFolder',
    'emailPageLink',
    'exportBookmarks',
    'facebookPageLink',
    'file',
    'find',
    'findNext',
    'findOnPage',
    'findPrevious',
    'flashInstalled',
    'forgetLearnedSpelling',
    'forward',
    'goToAdobe',
    'goToPrefs',
    'googlePlusPageLink',
    'help',
    'hideBrave',
    'hideOthers',
    'history',
    'home',
    'importBrowserData',
    'importFrom',
    'inspectElement',
    'learnSpelling',
    'ledgerBackupText1',
    'ledgerBackupText2',
    'ledgerBackupText3',
    'ledgerBackupText4',
    'ledgerBackupText5',
    'linkedInPageLink',
    'lookupSelection',
    'mergeAllWindows',
    'minimize',
    'moveTabToNewWindow',
    'muteOtherTabs',
    'muteTab',
    'muteTabs',
    'newPrivateTab',
    'newSessionTab',
    'newTab',
    'newWindow',
    'openAllInTabs',
    'openFile',
    'openFlashPreferences',
    'openImageInNewTab',
    'openInNewPrivateTab',
    'openInNewPrivateTabs',
    'openInNewSessionTab',
    'openInNewSessionTabs',
    'openInNewTab',
    'openInNewTabs',
    'openInNewWindow',
    'openLocation',
    'openSearch',
    'passwordCopied',
    'paste',
    'pasteAndGo',
    'pasteAndSearch',
    'pasteWithoutFormatting',
    'pinTab',
    'pinterestPageLink',
    'preferences',
    'print',
    'publisherMediaName',
    'quit',
    'quitApp',
    'readingView',
    'recentlyClosed',
    'recentlyVisited',
    'redditPageLink',
    'redo',
    'reload',
    'reloadPage',
    'reloadTab',
    'reopenLastClosedTab',
    'reopenLastClosedWindow',
    'saveImage',
    'saveLinkAs',
    'savePageAs',
    'searchImage',
    'selectAll',
    'selectNextTab',
    'selectPreviousTab',
    'sendUsFeedback',
    'services',
    'settings',
    'share',
    'showAll',
    'showAllHistory',
    'stop',
    'submitFeedback',
    'tabManager',
    'textEncoding',
    'toggleBrowserConsole',
    'toggleDeveloperTools',
    'toggleFullScreenView',
    'toolbars',
    'tweetPageLink',
    'undo',
    'unmuteTab',
    'unmuteTabs',
    'unpinTab',
    'view',
    'viewPageSource',
    'window',
    'zoom',
    'zoomIn',
    'zoomOut',

    // Other identifiers
    'aboutBlankTitle',
    'aboutPagesSuggestionTitle',
    'addFunds',
    'addFundsNotification',
    'allow',
    'autoHideMenuBar',
    'bookmarksSuggestionTitle',
    'copyToClipboard',
    'deny',
    'historySuggestionTitle',
    'licenseText',
    'permissionCameraMicrophone',
    'permissionDisableCursor',
    'permissionExternal',
    'permissionFullscreen',
    'permissionLocation',
    'permissionMessage',
    'permissionNotifications',
    'permissionProtocolRegistration',
    'permissionWebMidi',
    'reconciliationNotification',
    'reviewSites',
    'searchSuggestionTitle',
    'smartphoneTitle',
    'tabsSuggestionTitle',
    'topSiteSuggestionTitle',
    'turnOffNotifications',
    'unexpectedErrorWindowReload',
    'updateChannel',
    'updateHello',
    'updateLater',
    'urlCopied',
    'downloadCancelled',
    'downloadCompleted',
    'downloadInProgress',
    'downloadInProgressUnknownTotal',
    'downloadInterrupted',
    'downloadItemCancel',
    'downloadItemClear',
    'downloadItemClearCompleted',
    'downloadItemCopyLink',
    'downloadItemDelete',
    'downloadItemPath',
    'downloadItemPause',
    'downloadItemRedownload',
    'downloadItemResume',
    'downloadLocalFile',
    'downloadPaused',
    'downloadToolbarHide',
    'downloadUnauthorized',
    'extensionsManager',
    'noDownloads',
    'passwordsManager',
    'torrentDesc',
    'allowAutoplay',
    'autoplayMedia',
    'closeFirefoxWarning',
    'closeFirefoxWarningOk',
    'connectionError',
    'importSuccess',
    'importSuccessOk',
    'licenseTextOk',
    'unknownError',
    'spellCheckLanguages',

    // notifications
    'areYouSure',
    'dappDetected',
    'dappDismiss',
    'dappEnableExtension',
    'dismiss',
    'neverForThisSite',
    'no',
    'noThanks',
    'notificationPassword',
    'notificationPasswordSettings',
    'notificationPasswordWithUserName',
    'notificationPaymentDone',
    'notificationTryPayments',
    'notificationTryPaymentsYes',
    'notificationUpdatePassword',
    'notificationUpdatePasswordWithUserName',
    'prefsRestart',
    'walletConvertedBackup',
    'walletConvertedDismiss',
    'walletConvertedLearnMore',
    'walletConvertedToBat',
    'yes',

    // Caption buttons in titlebar (min/max/close - Windows only)
    'windowCaptionButtonClose',
    'windowCaptionButtonMaximize',
    'windowCaptionButtonMinimize',
    'windowCaptionButtonRestore',

    // Release channels
    'channelRelease',
    'channelBeta',
    'channelDeveloper',
    'channelNightly'
  ].concat(countryCodes).concat(availableLanguages)
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
  'bn-BD',
  'bn-IN',
  'cs',
  'de-DE',
  'en-GB',
  'en-US',
  'es',
  'eu',
  'fr-FR',
  'hi-IN',
  'id-ID',
  'it-IT',
  'ja-JP',
  'ko-KR',
  'ms-MY',
  'nl-NL',
  'pl-PL',
  'pt-BR',
  'ru',
  'sl',
  'sv-SE',
  'ta',
  'te',
  'tr-TR',
  'uk',
  'zh-CN'
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
      path.join(__dirname, 'extensions', 'brave', 'locales', lang, 'countries.properties'),
      path.join(__dirname, 'extensions', 'brave', 'locales', lang, 'locales.properties'),
      path.join(__dirname, 'extensions', 'brave', 'locales', lang, 'preferences.properties'),
      path.join(__dirname, 'extensions', 'brave', 'locales', lang, 'downloads.properties')
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
