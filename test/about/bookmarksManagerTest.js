/* global describe, it, before */

const Brave = require('../lib/brave')
const {urlInput, bookmarkNameInput} = require('../lib/selectors')
const {getTargetAboutUrl} = require('../../js/lib/appUrlUtil')
const siteTags = require('../../js/constants/siteTags')
const aboutBookmarksUrl = getTargetAboutUrl('about:bookmarks')
const Immutable = require('immutable')

describe('about:bookmarks', function () {
  const folderId = Math.floor(Math.random() * (100 - 1 + 1)) + 1
  const lastVisit = 1476140184441
  const browseableSiteUrl = 'page1.html'
  const browseableSiteTitle = 'Page 1'

  function * setup (client) {
    yield client
      .waitForUrl(Brave.newTabUrl)
      .waitForBrowserWindow()
      .waitForVisible(urlInput)
  }

  function * addDemoSitesWithAndWithoutFavicon (client) {
    const siteWithFavicon = Brave.server.url('favicon.html')
    const favicon = Brave.server.url('img/test.ico')
    const siteWithoutFavicon = Brave.server.url('page_favicon_not_found.html')
    const sites = Immutable.fromJS([
      {
        location: siteWithFavicon,
        title: 'Page with Favicon',
        favicon: favicon,
        type: siteTags.BOOKMARK,
        parentFolderId: 0,
        lastAccessedTime: lastVisit
      },
      {
        location: siteWithoutFavicon,
        title: 'Page without Favicon',
        type: siteTags.BOOKMARK,
        parentFolderId: 0,
        lastAccessedTime: lastVisit
      }
    ])
    yield client
      .addBookmarks(sites)
      .tabByIndex(0)
      .loadUrl(aboutBookmarksUrl)
  }

  function * addDemoSites (client) {
    const sites = Immutable.fromJS([
      {
        location: 'https://brave.com',
        title: 'Brave',
        parentFolderId: 0,
        lastAccessedTime: lastVisit
      },
      {
        location: 'https://brave.com/test',
        title: 'customTest',
        parentFolderId: 0,
        lastAccessedTime: lastVisit
      },
      {
        location: 'https://www.youtube.com',
        parentFolderId: 0,
        lastAccessedTime: lastVisit
      },
      {
        location: 'https://www.facebook.com',
        title: 'facebook',
        parentFolderId: 0,
        lastAccessedTime: lastVisit
      },
      {
        location: 'https://duckduckgo.com',
        title: 'duckduckgo',
        parentFolderId: folderId,
        lastAccessedTime: lastVisit
      },
      {
        location: 'https://google.com',
        title: 'Google',
        parentFolderId: folderId,
        lastAccessedTime: lastVisit
      },
      {
        location: 'https://bing.com',
        title: 'Bing',
        parentFolderId: folderId,
        lastAccessedTime: lastVisit
      }
    ])

    yield client
      .waitForBrowserWindow()
      .addBookmarkFolder({
        title: 'demo1',
        folderId: folderId,
        parentFolderId: 0
      })
      .addBookmarks(sites)
      .tabByIndex(0)
      .loadUrl(aboutBookmarksUrl)
  }

  function * addBrowseableSite (client) {
    const site = Brave.server.url(browseableSiteUrl)
    yield client
      .waitForBrowserWindow()
      .addBookmark({
        location: site,
        title: browseableSiteTitle,
        type: siteTags.BOOKMARK,
        parentFolderId: 0,
        lastAccessedTime: lastVisit
      })
      .tabByIndex(0)
      .loadUrl(aboutBookmarksUrl)
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

    it('shows bookmark folders', function * () {
      yield this.app.client
        .waitForVisible('.bookmarkFolderList .listItem[data-folder-id="' + folderId + '"]')
    })

    it('can add bookmark folder', function * () {
      const addFolderButton = '.addBookmarkFolder'
      yield this.app.client
        .waitForVisible(addFolderButton)
        .click(addFolderButton)
        .windowByUrl(Brave.browserWindowUrl)
        .waitForExist(bookmarkNameInput)
        .tabByIndex(0)
        .loadUrl(aboutBookmarksUrl)
    })

    it('can add bookmark', function * () {
      const addButton = '.addBookmark'
      yield this.app.client
        .waitForVisible(addButton)
        .click(addButton)
        .windowByUrl(Brave.browserWindowUrl)
        .waitForExist(bookmarkNameInput)
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
      const target = 'table.sortableTable td.title[data-sort="' + browseableSiteTitle + '"]'
      yield this.app.client
        .waitForVisible(target)
        .doubleClick(target)
        .waitForUrl(site)
        .waitForBrowserWindow()
        .waitForTabCount(2)
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
        // Click one bookmark, to select it
        .click('table.sortableTable td.title[data-sort="Brave"]')
        .waitForVisible('table.sortableTable tr.selected td.title[data-sort="Brave"]')
        // Click the header; this should dismiss and release selection
        .click('table.sortableTable th')
        .waitForElementCount('table.sortableTable tr.selected td.title[data-sort="Brave"]', 0)
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
        .waitForVisible('td.title[data-sort="Page with Favicon"] .bookmarkFavicon')
        .getCssProperty('td.title[data-sort="Page with Favicon"] .bookmarkFavicon', 'background-image')
        .then((val) => {
          return val === `url("${Brave.server.url('img/test.ico')}")`
        })
    })

    it('fallback to default favicon when url has no favicon inside bookmarks toolbar', function * () {
      yield this.app.client
        .waitForVisible('td.title[data-sort="Page without Favicon"] .bookmarkFavicon')
        .getAttribute('td.title[data-sort="Page without Favicon"] .bookmarkFavicon', 'class')
        .then((val) => {
          return val === 'bookmarkFavicon bookmarkFile fa fa-file-o'
        })
    })
  })
})
