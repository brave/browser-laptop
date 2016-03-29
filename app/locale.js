/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'

const L20n = require('l20n')
const path = require('path')

var menuIdentifiers = () => {
  return [
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
    'readingView',
    'tabManager',
    'textEncoding',
    'toggleDeveloperTools',
    'toggleBrowserConsole',
    'toggleFullScreenView',
    'home',
    'back',
    'forward',
    'reopenLastClosedWindow',
    'showAllHistory',
    'clearHistory',
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
    'httpsEverywhere'
  ]
}

var ctx = null
var translations = {}
var lang = 'en-US'

exports.translation = (token) => {
  if (translations[token]) {
    return translations[token]
  } else {
    return `[${token.toUpperCase()}]`
  }
}

exports.init = (language) => {
  lang = language
  const langs = [
    { code: 'en-US' }
  ]

  if (!translations.about) {
    // fetchResource is node-specific, Env isn't
    const env = new L20n.Env(L20n.fetchResource)

    const propertyFiles = [
      path.join(__dirname, 'locales', lang, 'menu.properties'),
      path.join(__dirname, 'locales', lang, 'app.properties'),
      path.join(__dirname, 'locales', lang, 'password.properties')
    ]

    // contexts are immutable if langs change a new context must be created
    ctx = env.createContext(langs, propertyFiles)

    var identifiers = menuIdentifiers()
    ctx.formatValues.apply(ctx, identifiers).then((values) => {
      values.forEach((value, idx) => {
        translations[identifiers[idx]] = value
      })
    })
  }
}

// Default
exports.init('en-US')
