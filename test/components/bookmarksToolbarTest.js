/* global describe, it, beforeEach */

const Brave = require('../lib/brave')
const {urlInput, bookmarksToolbar, navigator, navigatorNotBookmarked, doneButton} = require('../lib/selectors')
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
        .waitForVisible(bookmarksToolbar)
    })

    it('hides the bookmarks toolbar if the setting is disabled', function * () {
      yield this.app.client
        .changeSetting(settings.SHOW_BOOKMARKS_TOOLBAR, false)
        .waitForElementCount(bookmarksToolbar, 0)
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
        .waitForVisible(bookmarksToolbar)
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
        .waitForVisible('.contextMenuItemText[data-l10n-id=emptyFolderItem]')
    })

    it('automatically opens context menu if you move mouse over a different folder', function * () {
      this.page1Url = Brave.server.url('page1.html')

      const folderId1 = Math.random()
      const folderId2 = Math.random()

      yield this.app.client
        .changeSetting(settings.SHOW_BOOKMARKS_TOOLBAR, true)
        .waitForVisible(bookmarksToolbar)
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
        .waitForSiteEntry(this.page1Url)
        .waitForVisible(navigator)
        .moveToObject(navigator)
        .waitForVisible(navigatorNotBookmarked)
        .click(navigatorNotBookmarked)
        .waitForVisible(doneButton)
        .waitForEnabled(doneButton)
        .selectByValue('#bookmarkParentFolder select', folderId2)
        .click(doneButton)
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
        .waitForVisible(bookmarksToolbar)
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
        .waitForSiteEntry(this.page1Url)
        .waitForVisible(navigator)
        .moveToObject(navigator)
        .waitForVisible(navigatorNotBookmarked)
        .click(navigatorNotBookmarked)
        .waitForVisible(doneButton)
        .waitForEnabled(doneButton)
        .setValue('#bookmarkName input', 'test1')
        .click(doneButton)
        .waitForVisible('.bookmarkToolbarButton[title^=test1]')
        .click('.bookmarkToolbarButton[title=demo1]')
        .waitForVisible('.contextMenuItemText[data-l10n-id=emptyFolderItem]')
        .moveToObject('.bookmarkToolbarButton[title^=test1]')
        .waitForElementCount('.contextMenuItemText', 0)
    })
  })

  describe('display favicon on bookmarks toolbar', function () {
    Brave.beforeEach(this)
    beforeEach(function * () {
      yield setup(this.app.client)
    })

    it('display bookmark favicon for url that has it', function * () {
      const pageWithFavicon = Brave.server.url('favicon.html')

      yield this.app.client
        .changeSetting(settings.SHOW_BOOKMARKS_TOOLBAR, true)
        .changeSetting(settings.SHOW_BOOKMARKS_TOOLBAR_FAVICON, true)
        .waitForVisible(bookmarksToolbar)
        .waitForUrl(Brave.newTabUrl)
        .loadUrl(pageWithFavicon)
        .windowParentByUrl(pageWithFavicon)
        .waitForSiteEntry(pageWithFavicon)
        .waitForVisible(navigator)
        .moveToObject(navigator)
        .waitForVisible(navigatorNotBookmarked)
        .click(navigatorNotBookmarked)
        .waitForVisible(doneButton)
        .waitForEnabled(doneButton)
        .click(doneButton)

      yield this.app.client.waitUntil(() =>
        this.app.client.getCssProperty('.bookmarkFavicon', 'background-image').then((backgroundImage) =>
          backgroundImage.value === `url("${Brave.server.url('img/test.ico')}")`
      ))
    })

    it('fallback to default bookmark icon when url has no favicon', function * () {
      const pageWithoutFavicon = Brave.server.url('page_favicon_not_found.html')

      yield this.app.client
        .changeSetting(settings.SHOW_BOOKMARKS_TOOLBAR, true)
        .changeSetting(settings.SHOW_BOOKMARKS_TOOLBAR_FAVICON, true)
        .waitForVisible(bookmarksToolbar)
        .waitForUrl(Brave.newTabUrl)
        .loadUrl(pageWithoutFavicon)
        .windowParentByUrl(pageWithoutFavicon)
        .waitForSiteEntry(pageWithoutFavicon)
        .waitForVisible(navigator)
        .moveToObject(navigator)
        .waitForVisible(navigatorNotBookmarked)
        .click(navigatorNotBookmarked)
        .waitForVisible(doneButton)
        .waitForEnabled(doneButton)
        .click(doneButton)

      yield this.app.client.waitUntil(() =>
        this.app.client.getAttribute('.bookmarkFavicon', 'class').then((className) =>
          className === 'bookmarkFavicon bookmarkFile fa fa-file-o'
      ))
    })
  })
})
