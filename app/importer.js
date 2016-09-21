/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'strict mode'

const electron = require('electron')
const importer = electron.importer
const dialog = electron.dialog
const BrowserWindow = electron.BrowserWindow
const session = electron.session
const Immutable = require('immutable')
const showImportWarning = require('./aboutDialog').showImportWarning
const siteUtil = require('../js/state/siteUtil')
const AppStore = require('../js/stores/appStore')
const siteTags = require('../js/constants/siteTags')
const appActions = require('../js/actions/appActions')
const messages = require('../js/constants/messages')

var isMergeFavorites = false

exports.init = () => {
  importer.initialize()
}

exports.importData = (selected) => {
  if (selected.get('mergeFavorites')) {
    isMergeFavorites = true
  }
  if (selected !== undefined) {
    importer.importData(selected.toJS())
  }
}

exports.importHTML = (selected) => {
  if (selected.get('mergeFavorites')) {
    isMergeFavorites = true
  }
  const files = dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [{
      name: 'HTML',
      extensions: ['html', 'htm']
    }]
  })
  if (files && files.length > 0) {
    const file = files[0]
    importer.importHTML(file)
  }
}

importer.on('update-supported-browsers', (e, detail) => {
  isMergeFavorites = false
  if (BrowserWindow.getFocusedWindow()) {
    BrowserWindow.getFocusedWindow().webContents.send(messages.IMPORTER_LIST, detail)
  }
})

importer.on('show-warning-dialog', (e) => {
})

importer.on('add-password-form', (e, detail) => {
})

importer.on('add-history-page', (e, history, visitSource) => {
  let sites = []
  for (let i = 0; i < history.length; ++i) {
    const site = {
      title: history[i].title,
      location: history[i].url,
      lastAccessedTime: history[i].last_visit * 1000
    }
    sites.push(site)
  }
  appActions.addSite(Immutable.fromJS(sites))
})

importer.on('add-homepage', (e, detail) => {
})

importer.on('add-bookmarks', (e, bookmarks, topLevelFolder) => {
  let nextFolderId = siteUtil.getNextFolderId(AppStore.getState().get('sites'))
  let pathMap = {}
  let sites = []
  let topLevelFolderId = 0
  if (!isMergeFavorites) {
    topLevelFolderId = nextFolderId++
    sites.push({
      title: topLevelFolder,
      folderId: topLevelFolderId,
      parentFolderId: 0,
      lastAccessedTime: (new Date()).getTime(),
      tags: [siteTags.BOOKMARK_FOLDER]
    })
  } else {
    // Merge into existing bookmark toolbar
    pathMap[topLevelFolder] = topLevelFolderId
    pathMap['Bookmarks Toolbar'] = 0 // Firefox
    pathMap['Bookmarks Bar'] = 0 // Chrome on mac
    pathMap['Other Bookmarks'] = -1 // Chrome on mac
    pathMap['Bookmarks bar'] = 0 // Chrome on win/linux
    pathMap['Other bookmarks'] = -1 // Chrome on win/linux
    pathMap['Bookmark Bar'] = 0 // Safari
    pathMap['Links'] = 0 // Edge, IE
  }
  for (let i = 0; i < bookmarks.length; ++i) {
    const pathLen = bookmarks[i].path.length
    let parentFolderId = topLevelFolderId
    if (pathLen) {
      const parentFolder = bookmarks[i].path[pathLen - 1]
      parentFolderId = pathMap[parentFolder]
      if (parentFolderId === undefined) {
        parentFolderId = nextFolderId++
        pathMap[parentFolder] = parentFolderId
        const folder = {
          title: parentFolder,
          folderId: parentFolderId,
          parentFolderId: pathMap[bookmarks[i].path[pathLen - 2]] === undefined ? topLevelFolderId : pathMap[bookmarks[i].path[pathLen - 2]],
          lastAccessedTime: (new Date()).getTime(),
          tags: [siteTags.BOOKMARK_FOLDER]
        }
        sites.push(folder)
      }
    }
    if (bookmarks[i].is_folder) {
      const folderId = nextFolderId++
      pathMap[bookmarks[i].title] = folderId
      const folder = {
        title: bookmarks[i].title,
        folderId: folderId,
        parentFolderId: parentFolderId,
        lastAccessedTime: bookmarks[i].creation_time * 1000,
        tags: [siteTags.BOOKMARK_FOLDER]
      }
      sites.push(folder)
    } else {
      const site = {
        title: bookmarks[i].title,
        location: bookmarks[i].url,
        parentFolderId: parentFolderId,
        lastAccessedTime: bookmarks[i].creation_time * 1000,
        tags: [siteTags.BOOKMARK]
      }
      sites.push(site)
    }
  }
  appActions.addSite(Immutable.fromJS(sites))
})

importer.on('add-favicons', (e, detail) => {
})

importer.on('add-keywords', (e, templateUrls, uniqueOnHostAndPath) => {
})

importer.on('add-autofill-form-data-entries', (e, detail) => {
})

importer.on('add-cookies', (e, cookies) => {
  for (let i = 0; i < cookies.length; ++i) {
    const cookie = {
      url: cookies[i].url,
      name: cookies[i].name,
      value: cookies[i].value,
      domain: cookies[i].domain,
      path: cookies[i].path,
      secure: cookies[i].secure,
      httpOnly: cookies[i].httponly,
      expirationDate: cookies[i].expiry_date
    }
    session.defaultSession.cookies.set(cookie, (error) => {
      if (error) {
        console.error(error)
      }
    })
  }
})

importer.on('show-warning-dialog', (e) => {
  showImportWarning()
})
