/* This Source Code Form is subject to the terms of the Mozilla Public * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const siteTags = require('../../../js/constants/siteTags')

const isFolderNameValid = (title) => {
  return title != null && title.trim().length > 0
}

const getNextFolderIdItem = (folders) =>
  folders.max((folderA, folderB) => {
    const folderIdA = folderA.get('folderId')
    const folderIdB = folderB.get('folderId')

    if (folderIdA === folderIdB) {
      return 0
    }
    if (folderIdA === undefined) {
      return false
    }
    if (folderIdB === undefined) {
      return true
    }
    return folderIdA > folderIdB
  })

const getNextFolderId = (folders) => {
  const defaultFolderId = 0
  if (!folders) {
    return defaultFolderId
  }
  const maxIdItem = getNextFolderIdItem(folders)
  return (maxIdItem ? (maxIdItem.get('folderId') || 0) : 0) + 1
}

const getNextFolderName = (folders, name) => {
  if (!folders) {
    return name
  }
  const site = folders.find((site) => site.get('title') === name)
  if (!site) {
    return name
  }
  const filenameFormat = /(.*) \((\d+)\)/
  let result = filenameFormat.exec(name)
  if (!result) {
    return getNextFolderName(folders, name + ' (1)')
  }

  const nextNum = parseInt(result[2]) + 1
  return getNextFolderName(folders, result[1] + ' (' + nextNum + ')')
}

const isFolder = (folder) => {
  return folder.get('type') === siteTags.BOOKMARK_FOLDER
}

const getKey = (folderDetails) => {
  if (!folderDetails) {
    return null
  }

  const folderId = folderDetails.get('folderId')
  if (folderId != null) {
    return folderId.toString()
  }

  return null
}

/**
 * Called by isMoveAllowed
 * Trace a folder's ancestory, collecting all parent folderIds until reaching Bookmarks Toolbar (folderId=0)
 */
const getAncestorFolderIds = (parentFolderIds, bookmarkFolder, allBookmarks) => {
  if (bookmarkFolder.get('parentFolderId')) {
    parentFolderIds.push(bookmarkFolder.get('parentFolderId'))
    const nextItem = allBookmarks.find((item) => item.get('folderId') === bookmarkFolder.get('parentFolderId'))
    if (nextItem) {
      getAncestorFolderIds(parentFolderIds, nextItem, allBookmarks)
    }
  }
}

/**
 * Determine if a proposed move is valid
 *
 * @param sites The application state's Immutable sites list
 * @param sourceDetail The site detail to move
 * @param destinationDetail The site detail to move to
 */
const isMoveAllowed = (sites, sourceDetail, destinationDetail) => {
  if (typeof destinationDetail.get('parentFolderId') === 'number' && typeof sourceDetail.get('folderId') === 'number') {
    // Folder can't be its own parent
    if (sourceDetail.get('folderId') === destinationDetail.get('folderId')) {
      return false
    }
    // Ancestor folder can't be moved into a descendant
    let ancestorFolderIds = []
    getAncestorFolderIds(ancestorFolderIds, destinationDetail, sites)
    if (ancestorFolderIds.includes(sourceDetail.get('folderId'))) {
      return false
    }
  }
  return true
}

module.exports = {
  isFolderNameValid,
  getNextFolderId,
  getNextFolderName,
  isFolder,
  getKey,
  isMoveAllowed
}
