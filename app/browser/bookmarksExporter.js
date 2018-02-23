/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'

const path = require('path')
const format = require('date-fns/format')
const fs = require('fs')
const electron = require('electron')
const dialog = electron.dialog
const app = electron.app
const BrowserWindow = electron.BrowserWindow

// State
const bookmarksState = require('../common/state/bookmarksState')

// Constants
const settings = require('../../js/constants/settings')

// Utils
const {getSetting} = require('../../js/settings')
const platformUtil = require('../common/lib/platformUtil')
const bookmarkFoldersUtil = require('../common/lib/bookmarkFoldersUtil')
const bookmarkUtil = require('../common/lib/bookmarkUtil')

const indentLength = 2
const indentType = ' '

const showDialog = (state) => {
  const focusedWindow = BrowserWindow.getFocusedWindow()
  const fileName = format(new Date(), 'DD_MM_YYYY') + '.html'
  const defaultPath = path.join(getSetting(settings.DOWNLOAD_DEFAULT_PATH) || app.getPath('downloads'), fileName)
  let personal = []
  let other = []

  dialog.showDialog(focusedWindow, {
    defaultPath: defaultPath,
    type: 'select-saveas-file',
    extensions: [['html']]
  }, (fileNames) => {
    if (fileNames && fileNames.length === 1) {
      personal = createBookmarkArray(state)
      other = createBookmarkArray(state, -1, false)
      try {
        fs.writeFileSync(fileNames[0], createBookmarkHTML(personal, other))
      } catch (e) {
        console.log('Error exporting bookmarks: ', e)
      }
    }
  })
}

const encodeHref = (string) => {
  return (string || '')
    .replace(/"/g, '&quot;')
}

const encodeTitle = (string) => {
  return (string || '')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

const createBookmarkArray = (state, parentFolderId = 0, first = true, depth = 1) => {
  const bookmarks = bookmarksState.getBookmarksWithFolders(state, parentFolderId)
  let payload = []
  let title
  let indentFirst = indentType.repeat(depth * indentLength)
  let indentNext = (!first) ? indentFirst : indentType.repeat((depth + 1) * indentLength)

  if (first) payload.push(`${indentFirst}<DL><p>`)

  for (let site of bookmarks) {
    if (bookmarkUtil.isBookmark(site) && site.get('location')) {
      title = encodeTitle(site.get('title', site.get('location')))
      const href = encodeHref(site.get('location'))
      payload.push(`${indentNext}<DT><A HREF="${href}">${title}</A>`)
    } else if (bookmarkFoldersUtil.isFolder(site)) {
      title = encodeTitle(site.get('title'))
      payload.push(`${indentNext}<DT><H3>${title}</H3>`)
      payload = payload.concat(createBookmarkArray(state, site.get('folderId'), true, (depth + 1)))
    }
  }

  if (first) payload.push(`${indentFirst}</DL><p>`)

  return payload
}

const createBookmarkHTML = (personal, other) => {
  const breakTag = (platformUtil.isWindows()) ? '\r\n' : '\n'
  const title = 'Bookmarks'

  return `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<!-- This is an automatically generated file. It will be read and overwritten. DO NOT EDIT! -->
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<TITLE>${title}</TITLE>
<H1>${title}</H1>
<DL><p>
  <DT><H3 PERSONAL_TOOLBAR_FOLDER="true">Bookmarks Bar</H3>
${personal.join(breakTag)}
${other.join(breakTag)}
</DL><p>`
}

module.exports = {
  createBookmarkArray,
  createBookmarkHTML,
  showDialog
}
