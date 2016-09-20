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
    'openInNewWindow',
    'openInNewSessionTab',
    'openInNewPrivateTab',
    'openInNewTab',
    'openAllInTabs',
    'disableAdBlock',
    'disableTrackingProtection',
    'muteTab',
    'unmuteTab',
    'pinTab',
    'unpinTab',
    'deleteFolder',
    'deleteBookmark',
    'deleteHistoryEntry',
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
    'bookmarkPage',
    'bookmarkLink',
    'openFile',
    'openLocation',
    'openSearch',
    'importFrom',
    'closeWindow',
    'savePageAs',
    'spreadTheWord',
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
    'findOnPage',
    'find',
    'checkForUpdates',
    'preferences',
    'settings',
    'bookmarksManager',
    'importBookmarks',
    'reportAnIssue',
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
    // Other identifiers
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
    'copyToClipboard',
    'smartphoneTitle',
    'displayQRCode',
    'updateLater',
    'updateHello',
    'notificationPasswordWithUserName',
    'notificationPassword',
    'notificationPasswordSettings',
    'notificationPaymentDone',
    'prefsRestart',
    'yes',
    'no',
    'neverForThisSite',
    'passwordsManager',
    'downloadItemPause',
    'downloadItemResume',
    'downloadItemCancel',
    'downloadItemRedownload',
    'downloadItemCopyLink',
    'downloadItemPath',
    'downloadItemDelete',
    'downloadItemClear',
    'downloadToolbarHide',
    'downloadItemClearCompleted'
  ]
}

var ctx = null
var translations = {}
var lang = 'en-US'

// Return a translate token from cache or a placeholder
// indicating that no translation is available
exports.translation = function (token) {
  if (translations[token]) {
    return translations[token]
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
    propertyFiles.push(path.join(__dirname, 'extensions', 'brave', 'locales', lang, 'menu.properties'),
      path.join(__dirname, 'extensions', 'brave', 'locales', lang, 'app.properties'),
      path.join(__dirname, 'extensions', 'brave', 'locales', lang, 'error.properties'),
      path.join(__dirname, 'extensions', 'brave', 'locales', lang, 'passwords.properties'))
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
