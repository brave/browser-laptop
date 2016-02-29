const fs = require('fs')
const appActions = require('../actions/appActions')
const siteTags = require('../constants/siteTags')
const siteUtil = require('../state/siteUtil')
const Immutable = require('immutable')
const appStoreRenderer = require('../stores/appStoreRenderer')

/**
 * Processes a single node from an exported HTML file from Firefox or Chrome
 * @param {Object} parserState - the current parser state
 * @param {Object} node - The current DOM node which is being processed
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
      if (!domNode.getAttribute('PERSONAL_TOOLBAR_FOLDER')) {
        const folder = {
          title: domNode.innerText,
          folderId: parserState.nextFolderId,
          parentFolderId: parserState.parentFolderId,
          lastAccessedTime: domNode.getAttribute('LAST_MODIFIED') || domNode.getAttribute('ADD_DATE'),
          tags: [siteTags.BOOKMARK_FOLDER]
        }
        parserState.lastFolderId = parserState.nextFolderId
        parserState.nextFolderId++
        parserState.sites.push(folder)
      } else {
        parserState.lastFolderId = 0
      }
      break
    case 'A':
      // Skip over Firefox smart folders
      if (domNode.href.startsWith('place:')) {
        break
      }
      const site = {
        title: domNode.innerText,
        location: domNode.href,
        parentFolderId: parserState.parentFolderId,
        lastAccessedTime: domNode.getAttribute('LAST_MODIFIED') || domNode.getAttribute('ADD_DATE'),
        tags: [siteTags.BOOKMARK]
      }
      parserState.sites.push(site)
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
        nextFolderId: siteUtil.getNextFolderId(appStoreRenderer.state.get('sites')),
        lastFolderId: -1,
        parentFolderId: -1,
        sites: []
      }

      // Process each of the nodes starting with the first DL node
      processBookmarkNode(parserState, doc.querySelector('dl'))

      // Add the sites to the app store in the main process
      appActions.addSite(Immutable.fromJS(parserState.sites))
      resolve({importCount: parserState.sites.length})
    })
  })
}
