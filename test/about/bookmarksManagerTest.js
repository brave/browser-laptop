/* global describe, it, before */

const Brave = require('../lib/brave')
const {urlInput} = require('../lib/selectors')
const {getTargetAboutUrl} = require('../../js/lib/appUrlUtil')
const siteTags = require('../../js/constants/siteTags')
const aboutBookmarksUrl = getTargetAboutUrl('about:bookmarks')

describe('about:bookmarks', function () {
  Brave.beforeAll(this)

  const folderId = Math.random()
  const lastVisit = 1476140184441
  const bookmarkTag = [siteTags.BOOKMARK]

  before(function * () {
    yield this.app.client
      .waitUntilWindowLoaded()
      .waitForUrl(Brave.newTabUrl)
      .waitForBrowserWindow()
      .waitForVisible(urlInput)
      .windowByUrl(Brave.browserWindowUrl)
      .addSite({
        customTitle: 'demo1',
        folderId: folderId,
        parentFolderId: 0,
        tags: [siteTags.BOOKMARK_FOLDER]
      }, siteTags.BOOKMARK_FOLDER)
      .addSite({ location: 'https://brave.com', title: 'Brave', tags: bookmarkTag, parentFolderId: 0, lastAccessedTime: lastVisit }, siteTags.BOOKMARK)
      .addSite({ location: 'https://brave.com/test', title: 'Test', customTitle: 'customTest', tags: bookmarkTag, parentFolderId: 0, lastAccessedTime: lastVisit }, siteTags.BOOKMARK)
      .addSite({ location: 'https://www.youtube.com', tags: bookmarkTag, parentFolderId: 0, lastAccessedTime: lastVisit }, siteTags.BOOKMARK)
      .addSite({ location: 'https://www.facebook.com', title: 'facebook', tags: bookmarkTag, parentFolderId: 0, lastAccessedTime: lastVisit }, siteTags.BOOKMARK)
      .addSite({ location: 'https://duckduckgo.com', title: 'duckduckgo', tags: bookmarkTag, parentFolderId: folderId, lastAccessedTime: lastVisit }, siteTags.BOOKMARK)
      .addSite({ location: 'https://google.com', title: 'Google', tags: bookmarkTag, parentFolderId: folderId, lastAccessedTime: lastVisit }, siteTags.BOOKMARK)
      .addSite({ location: 'https://bing.com', title: 'Bing', tags: bookmarkTag, parentFolderId: folderId, lastAccessedTime: lastVisit }, siteTags.BOOKMARK)
      .waitForExist('.tab[data-frame-key="1"]')
      .tabByIndex(0)
      .url(aboutBookmarksUrl)
  })

  it('displays entries with title', function * () {
    yield this.app.client
      .waitForVisible('table.sortableTable td.title[data-sort="Brave"]')
  })

  it('displays entries without a title using their URL', function * () {
    yield this.app.client
      .waitForVisible('table.sortableTable td.title[data-sort="https://www.youtube.com"]')
  })

  it('displays entries using customTitle (if available)', function * () {
    yield this.app.client
      .waitForVisible('table.sortableTable td.title[data-sort="customTest"]')
  })

  it('shows bookmark folders', function * () {
    yield this.app.client
      .waitForVisible('.bookmarkFolderList .listItem[data-folder-id="' + folderId + '"]')
  })
})
