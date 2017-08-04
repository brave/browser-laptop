/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const fs = require('fs')
const appActions = require('../actions/appActions')
const Immutable = require('immutable')
const appStoreRenderer = require('../stores/appStoreRenderer')
const bookmarFoldersUtil = require('../../app/common/lib/bookmarkFoldersUtil')
const bookmarkFoldersState = require('../../app/common/state/bookmarkFoldersState')

/**
 * Processes a single node from an exported HTML file from Firefox or Chrome
 * @param {Object} parserState - the current parser state
 * @param {Object} domNode - The current DOM node which is being processed
 */
function processBookmarkNode (parserState, domNode) {
  switch (domNode.tagName) {
    case 'DL':
      const backupParentFolderId = parserState.parentFolderId
      parserState.parentFolderId = parserState.lastFolderId
      for (let i = 0; i < domNode.children.length; i++) {
        processBookmarkNode(parserState, domNode.children[i])
      }
      parserState.parentFolderId = backupParentFolderId
      break
    case 'DT':
      for (let i = 0; i < domNode.children.length; i++) {
        processBookmarkNode(parserState, domNode.children[i])
      }
      break
    case 'H3':
      if (!domNode.getAttribute('PERSONAL_TOOLBAR_FOLDER') &&
          // Safari doesn't have a PERSONAL_TOOLBAR_FOLDER attribute but it has node
          // text of Favorites and it's the first item.
          (domNode.innerText !== 'Favorites' || parserState.foundBookmarksToolbar)) {
        const folder = {
          title: domNode.innerText,
          folderId: parserState.nextFolderId,
          parentFolderId: parserState.parentFolderId,
          lastAccessedTime: (domNode.getAttribute('LAST_MODIFIED') || domNode.getAttribute('ADD_DATE') || 0) * 1000
        }
        parserState.lastFolderId = parserState.nextFolderId
        parserState.nextFolderId++
        parserState.bookmarkFolders.push(folder)
      } else {
        parserState.lastFolderId = 0
        parserState.foundBookmarksToolbar = true
      }
      break
    case 'A':
      // Skip over Firefox smart folders
      if (domNode.href.startsWith('place:')) {
        break
      }
      const bookmarks = {
        title: domNode.innerText,
        location: domNode.href,
        favicon: domNode.getAttribute('ICON'),
        parentFolderId: parserState.parentFolderId
      }
      parserState.bookmarks.push(bookmarks)
      break
  }
}

/**
 * Loads an html file which was exported from Chrome or another browser
 *
 * @param {string} path - The path fo the HTML file to import from
 * @return a promise which rejects on error and resolves when the import has completed,
 *   passing in an object with a importCount property.
 */
module.exports.importFromHTML = (path) => {
  return new Promise((resolve, reject) => {
    fs.readFile(path, (err, data) => {
      if (err || !data) {
        reject(err)
        return
      }
      const parser = new window.DOMParser()
      const doc = parser.parseFromString(data.toString()
        // The presence of DD tags causes the parser to think that
        // DL isn't a child of the parent DT, so get rid of them.
        // They are ignored and so are text nodes.
        .replace(/<DD>/g, ''), 'text/html')

      // Each window's appStoreRenderer holds a copy of the app state, but it's not
      // mutable, so this is only used for getting the current list of sites.
      const parserState = {
        nextFolderId: bookmarFoldersUtil.getNextFolderId(bookmarkFoldersState.getFolders(appStoreRenderer.state)),
        lastFolderId: -1,
        parentFolderId: -1,
        bookmarks: [],
        bookmarkFolders: []
      }

      // Process each of the nodes starting with the first node which is either DL or DT
      processBookmarkNode(parserState, doc.querySelector('dl, dt'))

      // Add the sites to the app store in the main process
      appActions.addBookmark(Immutable.fromJS(parserState.bookmarks))
      appActions.addBookmarkFolder(Immutable.fromJS(parserState.bookmarkFolders))
      resolve({importCount: parserState.sites.length})
    })
  })
}
