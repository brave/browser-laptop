/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'strict mode'

const electron = require('electron')
const app = electron.app
const importer = electron.importer
const dialog = electron.dialog
const BrowserWindow = electron.BrowserWindow
const session = electron.session

// Store
const appStore = require('../js/stores/appStore')

// State
const tabState = require('./common/state/tabState')
const bookmarksState = require('./common/state/bookmarksState')
const bookmarkFoldersState = require('./common/state/bookmarkFoldersState')

// Constants
const messages = require('../js/constants/messages')
const settings = require('../js/constants/settings')

// Actions
const appActions = require('../js/actions/appActions')

// Utils
const {getSetting} = require('../js/settings')
const locale = require('./locale')
const tabMessageBox = require('./browser/tabMessageBox')
const {makeImmutable} = require('./common/state/immutableUtil')
const bookmarkFoldersUtil = require('./common/lib/bookmarkFoldersUtil')
const FunctionBuffer = require('../js/lib/functionBuffer')

let isImportingBookmarks = false
let hasBookmarks
let bookmarkList

exports.init = () => {
  importer.initialize()
}

exports.importData = (selected) => {
  if (selected.get('favorites')) {
    isImportingBookmarks = true
    const state = appStore.getState()
    hasBookmarks = bookmarksState.getBookmarks(state).size > 0 || bookmarkFoldersState.getFolders(state).size > 0
  }
  if (selected !== undefined) {
    importer.importData(selected.toJS())
  }
}

exports.importHTML = (selected) => {
  isImportingBookmarks = true
  const state = appStore.getState()
  hasBookmarks = bookmarksState.getBookmarks(state).size > 0 || bookmarkFoldersState.getFolders(state).size > 0
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
  isImportingBookmarks = false
  if (BrowserWindow.getFocusedWindow()) {
    BrowserWindow.getFocusedWindow().webContents.send(messages.IMPORTER_LIST, detail)
  }
})

importer.on('add-history-page', (e, history) => {
  let sites = []
  for (let i = 0; i < history.length; ++i) {
    const site = {
      title: history[i].title,
      location: history[i].url,
      lastAccessedTime: history[i].last_visit * 1000
    }
    sites.push(site)
  }
  appActions.addHistorySite(makeImmutable(sites))
})

importer.on('add-homepage', (e, detail) => {
})

const getParentFolderId = (path, pathMap, addFolderFunction, topLevelFolderId, nextFolderIdObject) => {
  const pathLen = path.length
  if (!pathLen) {
    return topLevelFolderId
  }

  const parentFolder = path.pop()
  let parentFolderId = pathMap[parentFolder]
  if (parentFolderId === undefined) {
    parentFolderId = nextFolderIdObject.id++
    pathMap[parentFolder] = parentFolderId
    addFolderFunction({
      title: parentFolder,
      folderId: parentFolderId,
      parentFolderId: getParentFolderId(path, pathMap, addFolderFunction, topLevelFolderId, nextFolderIdObject)
    })
  }
  return parentFolderId
}

importer.on('add-bookmarks', (e, importedBookmarks, topLevelFolder) => {
  const state = appStore.getState()
  const bookmarkFolders = bookmarkFoldersState.getFolders(state)
  let nextFolderId = bookmarkFoldersUtil.getNextFolderId(bookmarkFolders)
  let nextFolderIdObject = { id: nextFolderId }
  let pathMap = {}
  let folders = []
  let bookmarks = []
  let topLevelFolderId = nextFolderIdObject.id++
  const functionBuffer = new FunctionBuffer((args) => makeImmutable(args), this)
  const bufferedAddFolder = (folder) => {
    functionBuffer.buffer(appActions.addBookmarkFolder, folder)
    folders.push(folder)
  }

  const importTopLevelFolder = {
    title: bookmarkFoldersUtil.getNextFolderName(bookmarkFolders, topLevelFolder),
    folderId: topLevelFolderId,
    parentFolderId: 0
  }
  bufferedAddFolder(importTopLevelFolder)

  for (let i = 0; i < importedBookmarks.length; ++i) {
    const importedBookmark = importedBookmarks[i]
    const path = importedBookmark.path
    const title = importedBookmark.title
    const parentFolderId = getParentFolderId(path, pathMap, bufferedAddFolder, topLevelFolderId, nextFolderIdObject)
    if (importedBookmark.is_folder) {
      const folderId = nextFolderIdObject.id++
      pathMap[title] = folderId
      const folder = {
        title,
        folderId,
        parentFolderId
      }
      functionBuffer.buffer(appActions.addBookmarkFolder, folder)
      folders.push(folder)
    } else {
      const location = importedBookmark.url
      const bookmark = {
        title,
        location,
        parentFolderId
      }
      functionBuffer.buffer(appActions.addBookmark, bookmark)
      bookmarks.push(bookmark)
    }
  }
  functionBuffer.flush()
  bookmarkList = makeImmutable(bookmarks)
})

importer.on('add-favicons', (e, detail) => {
  let faviconMap = {}
  detail.forEach((entry) => {
    if (entry.favicon_url.includes('made-up-favicon')) {
      for (let url of entry.urls) {
        faviconMap[url] = entry.png_data
      }
    } else {
      for (let url of entry.urls) {
        faviconMap[url] = entry.favicon_url
      }
    }
  })
  let updatedSites = bookmarkList.map((site) => {
    if (
      (
        site.get('favicon') === undefined &&
        site.get('location') !== undefined &&
        faviconMap[site.get('location')] !== undefined
      ) ||
      (
        site.get('favicon') !== undefined &&
        site.get('favicon').includes('made-up-favicon'))
    ) {
      return site.set('favicon', faviconMap[site.get('location')])
    } else {
      return site
    }
  })
  // TODO can we call addBookmark only once? we need to create a new functions addFavicons
  appActions.addBookmark(updatedSites)
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

const getActiveTabId = () => {
  return tabState.getActiveTabId(appStore.getState())
}

const showImportWarning = function () {
  const tabId = getActiveTabId()
  if (tabId) {
    tabMessageBox.show(tabId, {
      message: `${locale.translation('closeFirefoxWarning')}`,
      title: 'Brave',
      buttons: [locale.translation('closeFirefoxWarningOk')]
    })
  }
}

const showImportSuccess = function () {
  const tabId = getActiveTabId()
  if (tabId) {
    tabMessageBox.show(tabId, {
      message: `${locale.translation('importSuccess')}`,
      title: 'Brave',
      buttons: [locale.translation('importSuccessOk')]
    })
  }
}

app.on('show-warning-dialog', (e) => {
  showImportWarning()
})

importer.on('import-success', (e) => {
  if (isImportingBookmarks) {
    const showBookmarksToolbar = getSetting(settings.SHOW_BOOKMARKS_TOOLBAR)
    if (!showBookmarksToolbar && !hasBookmarks) {
      appActions.changeSetting(settings.SHOW_BOOKMARKS_TOOLBAR, true)
    }
  }
  showImportSuccess()
})

importer.on('import-dismiss', (e) => {
})
