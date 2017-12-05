/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const Immutable = require('immutable')

// Actions
const appActions = require('../../../js/actions/appActions')

// Constant
const siteTags = require('../../../js/constants/siteTags')

// Utils
const tabs = require('../../browser/tabs')
const {makeImmutable} = require('../../common/state/immutableUtil')

// Styles
const globalStyles = require('../../renderer/components/styles/global')

const fontSize = globalStyles.spacing.bookmarksItemFontSize
const fontFamily = globalStyles.typography.default.family

const calcText = (item, type) => {
  const title = type === siteTags.BOOKMARK
    ? item.get('title') || item.get('location')
    : item.get('title')

  if (title && title.length === 0) {
    return
  }

  const param = `
    (function() {
      let ctx = document.createElement('canvas').getContext('2d')
      ctx.font = '${fontSize} ${fontFamily}'
      const width = ctx.measureText('${title}').width

      return width
    })()
  `

  tabs.executeScriptInBackground(param, (err, url, result) => {
    if (err) {
      throw err
    }

    if (type === siteTags.BOOKMARK) {
      appActions.onBookmarkWidthChanged(Immutable.fromJS([
        {
          key: item.get('key'),
          parentFolderId: item.get('parentFolderId'),
          width: result[0]
        }
      ]))
    } else {
      appActions.onBookmarkFolderWidthChanged(Immutable.fromJS([
        {
          key: item.get('key'),
          parentFolderId: item.get('parentFolderId'),
          width: result[0]
        }
      ]))
    }
  })
}

const calcTextList = (list) => {
  const take = 500
  list = makeImmutable(list)

  if (list.size === 0) {
    return
  }

  let paramList = JSON.stringify(list.take(take))
    .replace(/'/g, '!')
    .replace(/\\"/g, '!')
    .replace(/\\\\/g, '//')

  const param = `
    (function() {
      const ctx = document.createElement('canvas').getContext('2d')
      ctx.font = '${fontSize} ${fontFamily}'
      const bookmarks = []
      const folders = []
      const list = JSON.parse('${paramList}')

      list.forEach(item => {
        if (item.type === '${siteTags.BOOKMARK}') {
          bookmarks.push({
            key: item.key,
            parentFolderId: item.parentFolderId,
            width: ctx.measureText(item.title || item.location).width
          })
        } else {
          folders.push({
            key: item.key,
            parentFolderId: item.parentFolderId,
            width: ctx.measureText(item.title).width
          })
        }
      })

      const result = {
        bookmarks: bookmarks,
        folders: folders
      }

      return JSON.stringify(result)
    })()
  `

  tabs.executeScriptInBackground(param, (err, url, result) => {
    if (err) {
      console.error('Error in executeScriptInBackground (textCalcUtil.js)')
    }

    if (result[0]) {
      const data = JSON.parse(result[0])
      if (data.bookmarks.length > 0) {
        appActions.onBookmarkWidthChanged(Immutable.fromJS(data.bookmarks))
      }

      if (data.folders.length > 0) {
        appActions.onBookmarkFolderWidthChanged(Immutable.fromJS(data.folders))
      }
    } else {
      console.error('Error, cant parse bookmarks in executeScriptInBackground')
    }

    list = list.skip(take)

    if (list.size > 0) {
      calcTextList(list)
    }
  })
}

module.exports = {
  calcText,
  calcTextList
}
