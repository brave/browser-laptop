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
    'deleteDomainFromHistory',
    'deleteLedgerEntry',
    'ledgerBackupText1',
    'ledgerBackupText2',
    'ledgerBackupText3',
    'ledgerBackupText4',
    'ledgerBackupText5',
    'backupKeys',
    'backupKeysNow',
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
    'otherBookmarks',
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
    'sharePageLink',
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
    'publisherMediaName',
    'addToPublisherList',
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
    'updateLater',
    'updateHello',
    // notifications
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
    'dappDetected',
    'dappDismiss',
    'dappEnableExtension',
    'banSiteConfirmation',
    'paymentsDeleteWalletConfirmation',
    'messageBoxOk',
    'messageBoxCancel',
    // other
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
    'downloadCancelled',
    'downloadCompleted',
    'downloadInProgress',
    'downloadInProgressUnknownTotal',
    'downloadInterrupted',
    'downloadUnauthorized',
    'downloadLocalFile',
    'downloadPaused',
    'noDownloads',
    'torrentDesc',
    'multiSelectionBookmarks',
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
    'channelRelease',
    'channelBeta',
    'channelDeveloper',
    'channelNightly',
    'spellCheckLanguages',
    // Ledger
    'promotionGeneralErrorTitle',
    'promotionGeneralErrorMessage',
    'promotionGeneralErrorText',
    'promotionClaimedErrorMessage',
    'promotionClaimedErrorText',
    'promotionClaimedErrorTitle',
    'corruptedOverlayTitle',
    'corruptedOverlayMessage',
    'corruptedOverlayText',
    'ledgerNetworkErrorTitle',
    'ledgerNetworkErrorMessage',
    'ledgerNetworkErrorText'
  ].concat(countryCodes).concat(availableLanguages)
}

var ctx = null
var translations = {}
var lang = 'en-US'

// Return a translate token from cache or a placeholder
// indicating that no translation is available
exports.translation = function (token, replacements = {}) {
  if (translations[token]) {
    return exports.translationReplace(translations[token], replacements)
  } else {
    // This will return an identifier in upper case useful for determining if a translation was not requested in the menu
    // identifiers above.
    return token.toUpperCase()
  }
}

// todo: FSI/PDI stripping can probably be replaced once
// https://github.com/l20n/l20n.js/commit/2fea50bf43c43a8e930a519a37f0f64f3626e885
// is released
const FSI = '\u2068'
const PDI = '\u2069'

exports.translationReplace = function (translation, replacements = {}) {
  let returnVal = translation
  for (var key in replacements) {
    returnVal = returnVal.replace(new RegExp(FSI + '{{\\s*' + key + '\\s*}}' + PDI), replacements[key])
  }
  return returnVal
}

// Default language locale identifier
const DEFAULT_LANGUAGE = lang

// locale brave
var availableLanguages = []

const configuredLanguages = {
  // locale electron : locale brave
  'eu':'eu',
  'bn':'bn-BD',
  'bn-BD':'bn-BD',
  'bn':'bn-IN',
  'bn-IN':'bn-IN',
  'zh-CN':'zh-CN',
  'cs':'cs',
  'nl':'nl-NL',
  'nl':'nl',
  'en-US':'en-US',
  'en':'en-GB',
  'en-GB':'en-GB',
  'en-AU':'en-GB',
  'en-CA':'en-GB',
  'en-NZ':'en-GB',
  'en-ZA':'en-GB',
  'fr-FR':'fr-FR',
  'fr':'fr-FR',
  'fr-FR':'fr-FR',
  'fr-CA':'fr-FR',
  'fr-CH':'fr-FR',
  'de-DE':'de-DE',
  'de':'de-DE',
  'de-AT':'de-DE',
  'de-CH':'de-DE',
  'hi':'hi-IN',
  'hi-IN':'hi-IN',
  'id':'id-ID',
  'id-ID':'id-ID',
  'it':'it-IT',
  'it-IT':'it-IT',
  'it-CH':'it-IT',
  'ja':'ja-JP',
  'ja-JP':'ja-JP',
  'ko':'ko-KR',
  'ko-KR':'ko-KR',
  'ms':'ms-MY',
  'ms-MY':'ms-MY',
  'pl':'pl-PL',
  'pl-PL':'pl-PL',
  'pt':'pt-BR',
  'pt-BR':'pt-BR',
  'pt-PT':'pt-BR',
  'ru':'ru',
  'sl':'sl',
  'sv':'sv-SE',
  'sv-SE':'sv-SE',
  'es':'es',
  'es-419':'es',
  'ta':'ta',
  'te':'te',
  'tr':'tr-TR',
  'tr-TR':'tr-TR',
  'uk':'uk'
}

// Dynamic filling of the  array of locale
availableLanguages = [...new Set(Object.values(configuredLanguages))]

// Return the default locale in xx-XX format I.e. pt-BR
const defaultLocale = function () {
  // If electron has the locale
  if (app.getLocale()) {
    // Retrieve the language and convert _ to -
    lang = configuredLanguages[app.getLocale().replace('_', '-')] || null
    if (lang) {
      return lang
    }
  }
  return DEFAULT_LANGUAGE
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
      path.join(__dirname, 'extensions', 'brave', 'locales', lang, 'downloads.properties'),
      path.join(__dirname, 'extensions', 'brave', 'locales', lang, 'bookmarks.properties')
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
