/* global describe, it, before */

const Brave = require('../lib/brave')
const {urlInput} = require('../lib/selectors')
const {getTargetAboutUrl} = require('../../js/lib/appUrlUtil')
const siteTags = require('../../js/constants/siteTags')
const aboutBookmarksUrl = getTargetAboutUrl('about:bookmarks')

describe('about:bookmarks', function () {
  const folderId = Math.random()
  const lastVisit = 1476140184441
  const bookmarkTag = [siteTags.BOOKMARK]
  const browseableSiteUrl = 'page1.html'
  const browseableSiteTitle = 'Page 1'

  function * setup (client) {
    yield client
      .waitForUrl(Brave.newTabUrl)
      .waitForBrowserWindow()
      .waitForVisible(urlInput)
      .windowByUrl(Brave.browserWindowUrl)
  }

  function * addDemoSitesWithAndWithoutFavicon (client) {
    const siteWithFavicon = Brave.server.url('favicon.html')
    const favicon = Brave.server.url('img/test.ico')
    const siteWithoutFavicon = Brave.server.url('page_favicon_not_found.html')
    yield client
      .addSite({ location: siteWithFavicon, title: 'Page with Favicon', favicon: favicon, tags: bookmarkTag, parentFolderId: 0, lastAccessedTime: lastVisit }, siteTags.BOOKMARK)
      .addSite({ location: siteWithoutFavicon, title: 'Page without Favicon', tags: bookmarkTag, parentFolderId: 0, lastAccessedTime: lastVisit }, siteTags.BOOKMARK)
  }

  function * addDemoSites (client) {
    yield client
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
      .waitForExist('[data-test-id="tab"][data-frame-key="1"]')
      .tabByIndex(0)
      .url(aboutBookmarksUrl)
  }

  function * addBrowseableSite (client) {
    const site = Brave.server.url(browseableSiteUrl)
    yield client
      .addSite({
        location: site,
        title: browseableSiteTitle,
        tags: bookmarkTag,
        parentFolderId: 0,
        lastAccessedTime: lastVisit
      }, siteTags.BOOKMARK)
      .waitForExist('[data-test-id="tab"][data-frame-key="1"]')
      .tabByIndex(0)
      .url(aboutBookmarksUrl)
  }

  describe('page content', function () {
    Brave.beforeAll(this)

    before(function * () {
      yield setup(this.app.client)
      yield addDemoSites(this.app.client)
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

  describe('double click behavior', function () {
    Brave.beforeAll(this)

    before(function * () {
      yield setup(this.app.client)
      yield addBrowseableSite(this.app.client)
    })

    it('opens a new tab with the location of the entry when double clicked', function * () {
      const site = Brave.server.url(browseableSiteUrl)
      yield this.app.client
        .tabByUrl(aboutBookmarksUrl)
        .doubleClick('table.sortableTable td.title[data-sort="' + browseableSiteTitle + '"]')
        .waitForTabCount(2)
        .waitForUrl(site)
        .tabByIndex(0)
    })
  })

  describe('multi-select behavior', function () {
    Brave.beforeAll(this)

    before(function * () {
      yield setup(this.app.client)
      yield addDemoSites(this.app.client)
    })

    it('selects multiple rows when clicked with cmd/control', function * () {
      yield this.app.client
        .tabByUrl(aboutBookmarksUrl)
        .loadUrl(aboutBookmarksUrl)
        .click('table.sortableTable td.title[data-sort="Brave"]')
        .isDarwin().then((val) => {
          if (val === true) {
            return this.app.client.keys(Brave.keys.COMMAND)
          } else {
            return this.app.client.keys(Brave.keys.CONTROL)
          }
        })
        .click('table.sortableTable td.title[data-sort="https://www.youtube.com"]')
        .waitForVisible('table.sortableTable tr.selected td.title[data-sort="Brave"]')
        .waitForVisible('table.sortableTable tr.selected td.title[data-sort="https://www.youtube.com"]')
        .waitForVisible('table.sortableTable td.title[data-sort="customTest"]')
        // key depressed
        .isDarwin().then((val) => {
          if (val === true) {
            return this.app.client.keys(Brave.keys.COMMAND)
          } else {
            return this.app.client.keys(Brave.keys.CONTROL)
          }
        })
        .click('table.sortableTable td.title[data-sort="facebook"]')
        .waitForVisible('table.sortableTable tr.selected td.title[data-sort="facebook"]')
        .waitForVisible('table.sortableTable td.title[data-sort="customTest"]')
        .waitForVisible('table.sortableTable td.title[data-sort="Brave"]')
        .waitForVisible('table.sortableTable td.title[data-sort="https://www.youtube.com"]')
        // reset state
        .click('table.sortableTable td.title[data-sort="facebook"]')
        .waitForVisible('table.sortableTable td.title[data-sort="facebook"]')
    })
    it('selects multiple contiguous rows when shift clicked', function * () {
      yield this.app.client
        .tabByUrl(aboutBookmarksUrl)
        .loadUrl(aboutBookmarksUrl)
        .click('table.sortableTable td.title[data-sort="Brave"]')
        .keys(Brave.keys.SHIFT)
        .click('table.sortableTable td.title[data-sort="https://www.youtube.com"]')
        .waitForVisible('table.sortableTable tr.selected td.title[data-sort="Brave"]')
        .waitForVisible('table.sortableTable tr.selected td.title[data-sort="https://www.youtube.com"]')
        .waitForVisible('table.sortableTable tr.selected td.title[data-sort="customTest"]')
        .waitForVisible('table.sortableTable td.title[data-sort="facebook"]')
        // key depressed
        .keys(Brave.keys.SHIFT)
        .click('table.sortableTable td.title[data-sort="facebook"]')
        .waitForVisible('table.sortableTable tr.selected td.title[data-sort="facebook"]')
        .isDarwin().then((val) => {
          if (val === true) {
            return this.app.client.keys(Brave.keys.COMMAND)
          } else {
            return this.app.client.keys(Brave.keys.CONTROL)
          }
        })
        .click('table.sortableTable td.title[data-sort="https://www.youtube.com"]')
        .waitForVisible('table.sortableTable tr.selected td.title[data-sort="https://www.youtube.com"]')
        // key depressed
        .isDarwin().then((val) => {
          if (val === true) {
            return this.app.client.keys(Brave.keys.COMMAND)
          } else {
            return this.app.client.keys(Brave.keys.CONTROL)
          }
        })
        .keys(Brave.keys.SHIFT)
        .click('table.sortableTable td.title[data-sort="Brave"]')
        .waitForVisible('table.sortableTable tr.selected td.title[data-sort="Brave"]')
        .waitForVisible('table.sortableTable tr.selected td.title[data-sort="https://www.youtube.com"]')
        .waitForVisible('table.sortableTable tr.selected td.title[data-sort="customTest"]')
        .waitForVisible('table.sortableTable tr.selected td.title[data-sort="facebook"]')
        // reset state
        // key depressed
        .keys(Brave.keys.SHIFT)
        .click('table.sortableTable td.title[data-sort="Brave"]')
    })
    it('deselects everything if something other than a row is clicked', function * () {
      yield this.app.client
        .tabByUrl(aboutBookmarksUrl)
        .loadUrl(aboutBookmarksUrl)
        // Click one bookmark, to select it
        .click('table.sortableTable td.title[data-sort="Brave"]')
        .waitForVisible('table.sortableTable tr.selected td.title[data-sort="Brave"]')
        // Click the header; this should dismiss and release selection
        .click('table.sortableTable th')
        .waitForVisible('table.sortableTable tr.selected td.title[data-sort="Brave"]', 5000, true)
    })
  })

  describe('display favicon on bookmarks manager', function () {
    Brave.beforeAll(this)

    before(function * () {
      yield setup(this.app.client)
      yield addDemoSitesWithAndWithoutFavicon(this.app.client)
    })

    it('display favicon for url inside bookmarks toolbar', function * () {
      yield this.app.client
        .tabByUrl(aboutBookmarksUrl)
        .loadUrl(aboutBookmarksUrl)
        .getCssProperty('td.title[data-sort="Page with Favicon"] .bookmarkFavicon', 'background-image')
        .then((val) => {
          return val === `url("${Brave.server.url('img/test.ico')}")`
        })
    })

    it('fallback to default favicon when url has no favicon inside bookmarks toolbar', function * () {
      yield this.app.client
        .tabByUrl(aboutBookmarksUrl)
        .loadUrl(aboutBookmarksUrl)
        .getAttribute('td.title[data-sort="Page without Favicon"] .bookmarkFavicon', 'class')
        .then((val) => {
          return val === 'bookmarkFavicon bookmarkFile fa fa-file-o'
        })
    })
  })
})
