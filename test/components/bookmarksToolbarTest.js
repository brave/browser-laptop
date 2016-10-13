/* global describe, it, beforeEach */

const Brave = require('../lib/brave')
const { urlInput, bookmarksToolbar, navigator, navigatorNotBookmarked, saveButton } = require('../lib/selectors')
const settings = require('../../js/constants/settings')
const siteTags = require('../../js/constants/siteTags')
const assert = require('assert')

function * setup (client) {
  yield client
    .waitForUrl(Brave.newTabUrl)
    .waitForBrowserWindow()
    .waitForEnabled(urlInput)
}

const findBookmarkFolder = (folderName, val) => {
  const bookmarksMenu = val.value.menu.template.find((item) => {
    return item.label === 'Bookmarks'
  })
  if (bookmarksMenu && bookmarksMenu.submenu) {
    const bookmarkFolder = bookmarksMenu.submenu.find((item) => {
      return item.label === folderName
    })
    if (bookmarkFolder) return true
  }
  return false
}

describe('bookmarksToolbar', function () {
  describe('configuration settings', function () {
    Brave.beforeAll(this)

    it('shows the bookmarks toolbar if the setting is enabled', function * () {
      yield this.app.client
        .changeSetting(settings.SHOW_BOOKMARKS_TOOLBAR, true)
        .waitForVisible(bookmarksToolbar, 1000)
    })

    it('hides the bookmarks toolbar if the setting is disabled', function * () {
      yield this.app.client
        .changeSetting(settings.SHOW_BOOKMARKS_TOOLBAR, false)
        .waitForVisible(bookmarksToolbar, 1000, true)
    })
  })

  describe('when clicking a bookmark folder', function () {
    Brave.beforeEach(this)
    beforeEach(function * () {
      yield setup(this.app.client)
    })

    it('shows a context menu', function * () {
      yield this.app.client
        .changeSetting(settings.SHOW_BOOKMARKS_TOOLBAR, true)
        .waitForVisible(bookmarksToolbar, 1000)
        .addSite({
          customTitle: 'demo1',
          folderId: Math.random(),
          parentFolderId: 0,
          tags: [siteTags.BOOKMARK_FOLDER]
        }, siteTags.BOOKMARK_FOLDER)
        .waitUntil(function () {
          return this.getAppState().then((val) => {
            return findBookmarkFolder('demo1', val)
          })
        })
        .click('.bookmarkToolbarButton[title=demo1]')
        .waitForVisible('.contextMenuItemText[data-l10n-id=emptyFolderItem]', 1000)
    })

    it('automatically opens context menu if you move mouse over a different folder', function * () {
      this.page1Url = Brave.server.url('page1.html')

      const folderId1 = Math.random()
      const folderId2 = Math.random()

      yield this.app.client
        .changeSetting(settings.SHOW_BOOKMARKS_TOOLBAR, true)
        .waitForVisible(bookmarksToolbar, 1000)
        .addSite({
          customTitle: 'demo1',
          folderId: folderId1,
          parentFolderId: 0,
          tags: [siteTags.BOOKMARK_FOLDER]
        }, siteTags.BOOKMARK_FOLDER)
        .waitUntil(function () {
          return this.getAppState().then((val) => {
            return findBookmarkFolder('demo1', val)
          })
        })
        .addSite({
          customTitle: 'demo2',
          folderId: folderId2,
          parentFolderId: 0,
          tags: [siteTags.BOOKMARK_FOLDER]
        }, siteTags.BOOKMARK_FOLDER)
        .waitUntil(function () {
          return this.getAppState().then((val) => {
            return findBookmarkFolder('demo2', val)
          })
        })
        .waitForUrl(Brave.newTabUrl)
        .loadUrl(this.page1Url)
        .windowParentByUrl(this.page1Url)
        .waitForVisible(navigator)
        .moveToObject(navigator)
        .waitForVisible(navigatorNotBookmarked)
        .click(navigatorNotBookmarked)
        .waitForVisible(saveButton)
        .selectByValue('#bookmarkParentFolder select', folderId2)
        .click(saveButton)
        .click('.bookmarkToolbarButton[title=demo1]')
        .moveToObject('.bookmarkToolbarButton[title=demo2]')
        .getText('.contextMenuItemText').then((val) => {
          assert(val === 'Page 1')
        })
    })

    it('hides context menu when mousing over regular bookmark', function * () {
      this.page1Url = Brave.server.url('page1.html')

      yield this.app.client
        .changeSetting(settings.SHOW_BOOKMARKS_TOOLBAR, true)
        .waitForVisible(bookmarksToolbar, 1000)
        .addSite({
          customTitle: 'demo1',
          folderId: Math.random(),
          parentFolderId: 0,
          tags: [siteTags.BOOKMARK_FOLDER]
        }, siteTags.BOOKMARK_FOLDER)
        .waitUntil(function () {
          return this.getAppState().then((val) => {
            return findBookmarkFolder('demo1', val)
          })
        })
        .waitForUrl(Brave.newTabUrl)
        .loadUrl(this.page1Url)
        .windowParentByUrl(this.page1Url)
        .waitForVisible(navigator)
        .moveToObject(navigator)
        .waitForVisible(navigatorNotBookmarked)
        .click(navigatorNotBookmarked)
        .waitForVisible(saveButton)
        .setValue('#bookmarkName input', 'test1')
        .click(saveButton)
        .waitForVisible('.bookmarkToolbarButton[title^=test1]')
        .click('.bookmarkToolbarButton[title=demo1]')
        .waitForVisible('.contextMenuItemText[data-l10n-id=emptyFolderItem]', 1000)
        .moveToObject('.bookmarkToolbarButton[title^=test1]')
        .waitForVisible('.contextMenuItemText', 1000, true)
    })
  })
})
