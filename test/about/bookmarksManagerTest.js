/* global describe, it, before */

const Brave = require('../lib/brave')
const {urlInput, bookmarkNameInput} = require('../lib/selectors')
const {getTargetAboutUrl} = require('../../js/lib/appUrlUtil')
const siteTags = require('../../js/constants/siteTags')
const aboutBookmarksUrl = getTargetAboutUrl('about:bookmarks')
const Immutable = require('immutable')

describe('about:bookmarks', function () {
  const folderId = Math.floor(Math.random() * (100 - 1 + 1)) + 1
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
        parentFolderId: 0
      },
      {
        location: siteWithoutFavicon,
        title: 'Page without Favicon',
        type: siteTags.BOOKMARK,
        parentFolderId: 0
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
        parentFolderId: 0
      },
      {
        location: 'https://brave.com/test',
        title: 'customTest',
        parentFolderId: 0
      },
      {
        location: 'https://www.youtube.com',
        parentFolderId: 0
      },
      {
        location: 'https://www.facebook.com',
        title: 'facebook',
        parentFolderId: 0
      },
      {
        location: 'https://duckduckgo.com',
        title: 'duckduckgo',
        parentFolderId: folderId
      },
      {
        location: 'https://google.com',
        title: 'Google',
        parentFolderId: folderId
      },
      {
        location: 'https://bing.com',
        title: 'Bing',
        parentFolderId: folderId
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
        parentFolderId: 0
      })
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
        .waitForVisible('[data-test-id="sortableTable"] [data-test-id="title"][data-sort="Brave"]')
    })

    it('displays entries without a title using their URL', function * () {
      yield this.app.client
        .waitForVisible('[data-test-id="sortableTable"] [data-test-id="title"][data-sort="https://www.youtube.com"]')
    })

    it('shows bookmark folders', function * () {
      yield this.app.client
        .waitForVisible('[data-test-id="bookmarkFolderList"] [data-test-id="bookmarkFolderListItem"][data-folder-id="' + folderId + '"]')
    })

    it('can add bookmark folder', function * () {
      const addFolderButton = '[data-test-id="addBookmarkFolder"]'
      yield this.app.client
        .waitForVisible(addFolderButton)
        .click(addFolderButton)
        .windowByUrl(Brave.browserWindowUrl)
        .waitForExist(bookmarkNameInput)
        .tabByIndex(0)
        .loadUrl(aboutBookmarksUrl)
    })

    it('can add bookmark', function * () {
      const addButton = '[data-test-id="addBookmark"]'
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
      const target = '[data-test-id="sortableTable"] [data-test-id="title"][data-sort="' + browseableSiteTitle + '"]'
      yield this.app.client
        .tabByUrl(aboutBookmarksUrl)
        .waitForVisible(target)
        .doubleClick(target)
        .waitForTabCount(2)
        .waitForUrl(site)
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
        .waitForVisible('[data-test-id="sortableTable"] [data-test-id="title"][data-sort="Brave"]')
        .click('[data-test-id="sortableTable"] [data-test-id="title"][data-sort="Brave"]')
        .isDarwin().then((val) => {
          if (val === true) {
            return this.app.client.keys(Brave.keys.COMMAND)
          } else {
            return this.app.client.keys(Brave.keys.CONTROL)
          }
        })
        .click('[data-test-id="sortableTable"] [data-test-id="title"][data-sort="https://www.youtube.com"]')
        .waitForVisible('[data-test-id="sortableTable"] [data-test-id="selected"] [data-test-id="title"][data-sort="Brave"]')
        .waitForVisible('[data-test-id="sortableTable"] [data-test-id="selected"] [data-test-id="title"][data-sort="https://www.youtube.com"]')
        .waitForVisible('[data-test-id="sortableTable"] [data-test-id="title"][data-sort="customTest"]')
        // key depressed
        .isDarwin().then((val) => {
          if (val === true) {
            return this.app.client.keys(Brave.keys.COMMAND)
          } else {
            return this.app.client.keys(Brave.keys.CONTROL)
          }
        })
        .click('[data-test-id="sortableTable"] [data-test-id="title"][data-sort="facebook"]')
        .waitForVisible('[data-test-id="sortableTable"] [data-test-id="selected"] [data-test-id="title"][data-sort="facebook"]')
        .waitForVisible('[data-test-id="sortableTable"] [data-test-id="title"][data-sort="customTest"]')
        .waitForVisible('[data-test-id="sortableTable"] [data-test-id="title"][data-sort="Brave"]')
        .waitForVisible('[data-test-id="sortableTable"] [data-test-id="title"][data-sort="https://www.youtube.com"]')
        // reset state
        .click('[data-test-id="sortableTable"] [data-test-id="title"][data-sort="facebook"]')
        .waitForVisible('[data-test-id="sortableTable"] [data-test-id="title"][data-sort="facebook"]')
    })
    it('selects multiple contiguous rows when shift clicked', function * () {
      yield this.app.client
        .waitForVisible('[data-test-id="sortableTable"] [data-test-id="title"][data-sort="Brave"]')
        .click('[data-test-id="sortableTable"] [data-test-id="title"][data-sort="Brave"]')
        .keys(Brave.keys.SHIFT)
        .click('[data-test-id="sortableTable"] [data-test-id="title"][data-sort="https://www.youtube.com"]')
        .waitForVisible('[data-test-id="sortableTable"] [data-test-id="selected"] [data-test-id="title"][data-sort="Brave"]')
        .waitForVisible('[data-test-id="sortableTable"] [data-test-id="selected"] [data-test-id="title"][data-sort="https://www.youtube.com"]')
        .waitForVisible('[data-test-id="sortableTable"] [data-test-id="selected"] [data-test-id="title"][data-sort="customTest"]')
        .waitForVisible('[data-test-id="sortableTable"] [data-test-id="title"][data-sort="facebook"]')
        // key depressed
        .keys(Brave.keys.SHIFT)
        .click('[data-test-id="sortableTable"] [data-test-id="title"][data-sort="facebook"]')
        .waitForVisible('[data-test-id="sortableTable"] [data-test-id="selected"] [data-test-id="title"][data-sort="facebook"]')
        .isDarwin().then((val) => {
          if (val === true) {
            return this.app.client.keys(Brave.keys.COMMAND)
          } else {
            return this.app.client.keys(Brave.keys.CONTROL)
          }
        })
        .click('[data-test-id="sortableTable"] [data-test-id="title"][data-sort="https://www.youtube.com"]')
        .waitForVisible('[data-test-id="sortableTable"] [data-test-id="selected"] [data-test-id="title"][data-sort="https://www.youtube.com"]')
        // key depressed
        .isDarwin().then((val) => {
          if (val === true) {
            return this.app.client.keys(Brave.keys.COMMAND)
          } else {
            return this.app.client.keys(Brave.keys.CONTROL)
          }
        })
        .keys(Brave.keys.SHIFT)
        .click('[data-test-id="sortableTable"] [data-test-id="title"][data-sort="Brave"]')
        .waitForVisible('[data-test-id="sortableTable"] [data-test-id="selected"] [data-test-id="title"][data-sort="Brave"]')
        .waitForVisible('[data-test-id="sortableTable"] [data-test-id="selected"] [data-test-id="title"][data-sort="https://www.youtube.com"]')
        .waitForVisible('[data-test-id="sortableTable"] [data-test-id="selected"] [data-test-id="title"][data-sort="customTest"]')
        .waitForVisible('[data-test-id="sortableTable"] [data-test-id="selected"] [data-test-id="title"][data-sort="facebook"]')
        // reset state
        // key depressed
        .keys(Brave.keys.SHIFT)
        .click('[data-test-id="sortableTable"] [data-test-id="title"][data-sort="Brave"]')
    })
    it('deselects everything if something other than a row is clicked', function * () {
      yield this.app.client
        // Click one bookmark, to select it
        .click('[data-test-id="sortableTable"] [data-test-id="title"][data-sort="Brave"]')
        .waitForVisible('[data-test-id="sortableTable"] [data-test-id="selected"] [data-test-id="title"][data-sort="Brave"]')
        // Click the header; this should dismiss and release selection
        .click('[data-test-id="sortableTable"] th')
        .waitForElementCount('[data-test-id="sortableTable"] [data-test-id="selected"] [data-test-id="title"][data-sort="Brave"]', 0)
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
        .waitForVisible('[data-test-id="title"][data-sort="Page with Favicon"] [data-test-id="bookmarkFavicon"]')
        .getCssProperty('[data-test-id="title"][data-sort="Page with Favicon"] [data-test-id="bookmarkFavicon"]', 'background-image')
        .then((val) => {
          return val === `url("${Brave.server.url('img/test.ico')}")`
        })
    })

    it('fallback to default favicon when url has no favicon inside bookmarks toolbar', function * () {
      yield this.app.client
        .waitForVisible('[data-test-id="title"][data-sort="Page without Favicon"] [data-test2-id="defaultIcon"]')
    })
  })
})
