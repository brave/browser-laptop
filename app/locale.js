/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'

const L20n = require('l20n')
const path = require('path')
const ipcMain = require('electron').ipcMain
const electron = require('electron')
const app = electron.app

// Exhaustive list of identifiers used by top and context menus
var rendererIdentifiers = function () {
  return [
    'downloadsManager',
    'confirmClearPasswords',
    'about',
    'quit',
    'addToReadingList',
    'viewPageSource',
    'copyImageAddress',
    'openImageInNewTab',
    'saveImage',
    'copyLinkAddress',
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
    'editFolder',
    'editBookmark',
    'unmuteTabs',
    'muteTabs',
    'addBookmark',
    'addFolder',
    'newTab',
    'closeTab',
    'bookmarkPage',
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
    'reloadPage',
    'reloadTab',
    'cleanReload',
    'reload',
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
    'clearHistory',
    'clearSiteData',
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
    'hideOthers',
    'showAll',
    'newPrivateTab',
    'newSessionTab',
    'newWindow',
    'reopenLastClosedTab',
    'print',
    'findOnPage',
    'checkForUpdates',
    'preferences',
    'bookmarksManager',
    'importBookmarks',
    'reportAnIssue',
    'submitFeedback',
    'bookmarksToolbar',
    'bravery',
    'replaceAds',
    'blockAds',
    'allowAdsAndTracking',
    'block3rdPartyCookie',
    'blockPopups',
    'httpsEverywhere',
    // Other identifiers
    'urlCopied'
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
    // This will return an identifier in upper case enclosed in square brackets
    // Useful for determining if a translation was not requested in the menu
    // identifiers above.
    return token.toUpperCase()
  }
}

// Default language locale identifier
const DEFAULT_LANGUAGE = 'en-US'

const availableLanguages = [
  'en-US',
  'pr-BR',
  'nl-NL',
  'fr-FR'
]

// Currently configured languages - TODO (make this dynamic)
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

// Initialize translations for a language providing an optional
// callback executed after the translation caching process
// is complete.
exports.init = function (language, cb) {
  // Default to noop callback
  cb = cb || function () {}

  // Currently selected language identifier I.e. 'en-US'
  lang = language || defaultLocale()

  // Languages to support - TODO retrieve this dynamically
  const langs = availableLanguages.map(function (lang) {
    return { code: lang }
  })

  const propertyFiles = []
  const appendLangProperties = (lang) => {
    // Property files to parse (only ones containing menu specific identifiers)
    propertyFiles.push(path.join(__dirname, 'extensions', 'brave', 'locales', lang, 'menu.properties'),
      path.join(__dirname, 'extensions', 'brave', 'locales', lang, 'app.properties'),
      path.join(__dirname, 'extensions', 'brave', 'locales', lang, 'password.properties'))
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
  ctx.formatValues.apply(ctx, identifiers).then(function (values) {
    // Cache the translations for later retrieval
    values.forEach(function (value, idx) {
      translations[identifiers[idx]] = value
    })
    // Signal when complete
    cb(translations)
  })
}

// If this is in the main process
if (ipcMain) {
  // Respond to requests for translations from the renderer process
  ipcMain.on('translations', function (event, arg) {
    // Return the entire set of translations synchronously
    event.returnValue = translations
  })

  // Respond to requests for the currently configured language code
  ipcMain.on('request-language', function (event) {
    event.sender.send('language', lang)
  })
}
