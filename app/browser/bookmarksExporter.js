/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'

const path = require('path')
const moment = require('moment')
const fs = require('fs')
const electron = require('electron')
const dialog = electron.dialog
const app = electron.app
const BrowserWindow = electron.BrowserWindow
const getSetting = require('../../js/settings').getSetting
const settings = require('../../js/constants/settings')
const siteTags = require('../../js/constants/siteTags')
const siteUtil = require('../../js/state/siteUtil')
const isWindows = process.platform === 'win32'
const indentLength = 2
const indentType = ' '

function showDialog (sites) {
  const focusedWindow = BrowserWindow.getFocusedWindow()
  const fileName = moment().format('DD_MM_YYYY') + '.html'
  const defaultPath = path.join(getSetting(settings.DEFAULT_DOWNLOAD_SAVE_PATH) || app.getPath('downloads'), fileName)
  let personal = []
  let other = []

  dialog.showSaveDialog(focusedWindow, {
    defaultPath: defaultPath,
    filters: [{
      name: 'HTML',
      extensions: ['html']
    }]
  }, (fileName) => {
    if (fileName) {
      personal = createBookmarkArray(sites)
      other = createBookmarkArray(sites, -1, false)
      fs.writeFileSync(fileName, createBookmarkHTML(personal, other))
    }
  })
}

function createBookmarkArray (sites, parentFolderId, first = true, depth = 1) {
  const filteredBookmarks = parentFolderId
    ? sites.filter((site) => site.get('parentFolderId') === parentFolderId)
    : sites.filter((site) => !site.get('parentFolderId'))
  let payload = []
  let title
  let indentFirst = indentType.repeat(depth * indentLength)
  let indentNext = (!first) ? indentFirst : indentType.repeat((depth + 1) * indentLength)

  if (first) payload.push(`${indentFirst}<DL><p>`)

  filteredBookmarks.forEach((site) => {
    if (site.get('tags').includes(siteTags.BOOKMARK) && site.get('location')) {
      title = site.get('customTitle') || site.get('title') || site.get('location')
      payload.push(`${indentNext}<DT><A HREF="${site.get('location')}">${title}</A>`)
    } else if (siteUtil.isFolder(site)) {
      const folderId = site.get('folderId')
      const submenuItems = sites.filter((bookmark) => bookmark.get('parentFolderId') === folderId)

      if (submenuItems.count() > 0) {
        title = site.get('customTitle') || site.get('title')
        payload.push(`${indentNext}<DT><H3>${title}</H3>`)
        payload = payload.concat(createBookmarkArray(sites, folderId, true, (depth + 1)))
      }
    }
  })

  if (first) payload.push(`${indentFirst}</DL><p>`)

  return payload
}

function createBookmarkHTML (personal, other) {
  const breakTag = (isWindows) ? '\r\n' : '\n'
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
