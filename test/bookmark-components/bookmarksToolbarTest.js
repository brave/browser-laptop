/* global describe, it, beforeEach */

const Brave = require('../lib/brave')
const {urlInput, bookmarksToolbar, navigator, navigatorNotBookmarked, doneButton, bookmarkNameInput} = require('../lib/selectors')
const settings = require('../../js/constants/settings')

function * setup (client) {
  yield client
    .waitForUrl(Brave.newTabUrl)
    .waitForBrowserWindow()
    .waitForEnabled(urlInput)
}

const findBookmarkFolder = (val, id, folderName) => {
  return val.value.bookmarkFolders[id] && val.value.bookmarkFolders[id].title === folderName
}

describe('bookmarksToolbar', function () {
  describe('configuration settings', function () {
    Brave.beforeAll(this)

    beforeEach(function * () {
      yield setup(this.app.client)
    })

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
        .addBookmarkFolder({
          title: 'demo1',
          folderId: 105,
          parentFolderId: 0
        })
        .waitForVisible('[data-test-id="bookmarkToolbarButton"][title=demo1]')
        .click(bookmarksToolbar)
        .click('[data-test-id="bookmarkToolbarButton"][title=demo1]')
        .waitForVisible('.contextMenuItemText[data-l10n-id=emptyFolderItem]')
    })

    it('automatically opens context menu if you move mouse over a different folder', function * () {
      this.page1Url = Brave.server.url('page1.html')

      const folderId1 = 50
      const folderId2 = 60

      yield this.app.client
        .changeSetting(settings.SHOW_BOOKMARKS_TOOLBAR, true)
        .waitForVisible(bookmarksToolbar)
        .addBookmarkFolder({
          title: 'demo1',
          folderId: folderId1,
          parentFolderId: 0
        })
        .waitUntil(function () {
          return this.getAppState().then((val) => {
            return findBookmarkFolder(val, folderId1, 'demo1')
          })
        })
        .addBookmarkFolder({
          title: 'demo2',
          folderId: folderId2,
          parentFolderId: 0
        })
        .waitUntil(function () {
          return this.getAppState().then((val) => {
            return findBookmarkFolder(val, folderId2, 'demo2')
          })
        })
        .waitForUrl(Brave.newTabUrl)
        .loadUrl(this.page1Url)
        .windowParentByUrl(this.page1Url)
        .waitForHistoryEntry(this.page1Url)
        .waitForVisible(navigator)
        .activateURLMode()
        .waitForVisible(navigatorNotBookmarked)
        .click(navigatorNotBookmarked)
        .waitForVisible(doneButton)
        .waitForBookmarkDetail(this.page1Url, 'Page 1')
        .waitForEnabled(doneButton)
        .selectByValue('[data-test-id="bookmarkParentFolder"]', folderId2)
        .click(doneButton)
        .click('[data-test-id="bookmarkToolbarButton"][title=demo1]')
        .moveToObject('[data-test-id="bookmarkToolbarButton"][title=demo2]')
        .waitForTextValue('.contextMenuItemText', 'Page 1')
    })

    it('hides context menu when mousing over regular bookmark', function * () {
      this.page1Url = Brave.server.url('page1.html')
      const folderId1 = 40
      yield this.app.client
        .changeSetting(settings.SHOW_BOOKMARKS_TOOLBAR, true)
        .waitForVisible(bookmarksToolbar)
        .addBookmarkFolder({
          title: 'demo1',
          folderId: folderId1,
          parentFolderId: 0
        })
        .waitUntil(function () {
          return this.getAppState().then((val) => {
            return findBookmarkFolder(val, folderId1, 'demo1')
          })
        })
        .waitForUrl(Brave.newTabUrl)
        .loadUrl(this.page1Url)
        .windowParentByUrl(this.page1Url)
        .waitForHistoryEntry(this.page1Url)
        .waitForVisible(navigator)
        .activateURLMode()
        .waitForVisible(navigatorNotBookmarked)
        .click(navigatorNotBookmarked)
        .waitForVisible(doneButton)
        .waitForBookmarkDetail(this.page1Url, 'Page 1')
        .typeText(bookmarkNameInput, 'test1')
        .waitForEnabled(doneButton)
        .click(doneButton)
        .waitForVisible('[data-test-id="bookmarkToolbarButton"][title^=test1]')
        .click('[data-test-id="bookmarkToolbarButton"][title=demo1]')
        .waitForVisible('.contextMenuItemText[data-l10n-id=emptyFolderItem]')
        .moveToObject('[data-test-id="bookmarkToolbarButton"][title^=test1]')
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
        .waitForHistoryEntry(pageWithFavicon, false)
        .activateURLMode()
        .waitForVisible(navigatorNotBookmarked)
        .click(navigatorNotBookmarked)
        .waitForVisible(doneButton)
        .waitForBookmarkDetail(pageWithFavicon, pageWithFavicon.replace(/http:\/\//, ''))
        .waitForEnabled(doneButton)
        .click(doneButton)

      yield this.app.client.waitUntil(() =>
        this.app.client.getCssProperty('[data-test-id="bookmarkFavicon"]', 'background-image').then((backgroundImage) =>
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
        .waitForHistoryEntry(pageWithoutFavicon, false)
        .activateURLMode()
        .waitForVisible(navigatorNotBookmarked)
        .click(navigatorNotBookmarked)
        .waitForVisible(doneButton)
        .waitForBookmarkDetail(pageWithoutFavicon, 'Favicon is not found page')
        .waitForEnabled(doneButton)
        .click(doneButton)

      yield this.app.client.waitUntil(() =>
        this.app.client.getAttribute('[data-test-id="bookmarkFavicon"]', 'class').then((className) =>
          className.includes('bookmarkFile fa fa-file-o')
      ))
    })
  })
})
