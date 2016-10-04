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
const {showImportWarning, showImportSuccess} = require('./aboutDialog')
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

const getParentFolderId = (path, pathMap, sites, topLevelFolderId, nextFolderIdObject) => {
  const pathLen = path.length
  if (!pathLen) {
    return topLevelFolderId
  }
  const parentFolder = path.pop()
  let parentFolderId = pathMap[parentFolder]
  if (parentFolderId === undefined) {
    parentFolderId = nextFolderIdObject.id++
    pathMap[parentFolder] = parentFolderId
    const folder = {
      customTitle: parentFolder,
      folderId: parentFolderId,
      parentFolderId: getParentFolderId(path, pathMap, sites, topLevelFolderId, nextFolderIdObject),
      lastAccessedTime: (new Date()).getTime(),
      tags: [siteTags.BOOKMARK_FOLDER]
    }
    sites.push(folder)
  }
  return parentFolderId
}

importer.on('add-bookmarks', (e, bookmarks, topLevelFolder) => {
  let nextFolderId = siteUtil.getNextFolderId(AppStore.getState().get('sites'))
  let nextFolderIdObject = { id: nextFolderId }
  let pathMap = {}
  let sites = []
  let topLevelFolderId = 0
  if (!isMergeFavorites) {
    topLevelFolderId = nextFolderIdObject.id++
    sites.push({
      customTitle: topLevelFolder,
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
    let path = bookmarks[i].path
    let parentFolderId = getParentFolderId(path, pathMap, sites, topLevelFolderId, nextFolderIdObject)
    if (bookmarks[i].is_folder) {
      const folderId = nextFolderIdObject.id++
      pathMap[bookmarks[i].title] = folderId
      const folder = {
        customTitle: bookmarks[i].title,
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
  let faviconMap = {}
  detail.forEach((entry) => {
    if (entry.favicon_url.startsWith('made-up-favicon:')) {
      faviconMap[entry.urls[0]] = entry.png_data
    } else {
      faviconMap[entry.urls[0]] = entry.favicon_url
    }
  })
  let sites = AppStore.getState().get('sites')
  sites = sites.map((site) => {
    if (site.get('favicon') === undefined && site.get('location') !== undefined &&
      faviconMap[site.get('location')] !== undefined) {
      return site.set('favicon', faviconMap[site.get('location')])
    } else {
      return site
    }
  })
  appActions.addSite(sites)
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

importer.on('import-success', (e) => {
  showImportSuccess()
})

importer.on('import-dismiss', (e) => {
})
