/* global describe, it, before, beforeEach, after */

const crypto = require('crypto')
const settings = require('../../js/constants/settings')
const {newTabMode} = require('../../app/common/constants/settingsEnums')
const siteTags = require('../../js/constants/siteTags')
const Brave = require('../lib/brave')
const Immutable = require('immutable')
const {adsBlockedControl, allowAllCookiesOption, bookmarksToolbar, braveMenu, braveryPanel, cookieControl, doneButton, fpSwitch, httpsEverywhereSwitch, navigatorBookmarked, navigatorNotBookmarked, noScriptSwitch, urlInput, removeButton, safeBrowsingSwitch, showAdsOption, syncTab, syncSwitch} = require('../lib/selectors')
const {getTargetAboutUrl} = require('../../js/lib/appUrlUtil')
const aboutBookmarksUrl = getTargetAboutUrl('about:bookmarks')
const aboutHistoryUrl = getTargetAboutUrl('about:history')

const prefsUrl = 'about:preferences'
const startButton = '[data-l10n-id="syncStart"]'
const addButton = '[data-l10n-id="syncAdd"]'
const createButton = '[data-l10n-id="syncCreate"]'
const newDeviceButton = '[data-l10n-id="syncNewDevice"]'

const PANEL_SEED = Immutable.fromJS(Array(32).fill(0))

function toHex (byteArray) {
  let str = ''
  for (var i = 0; i < byteArray.length; i++) {
    let char = byteArray[i].toString(16)
    if (char.length === 1) {
      char = '0' + char
    }
    str = str + char
  }
  return str
}

const checkBookmark = function (siteTitle, presence = true) {
  return function () {
    return this.getText(bookmarksToolbar)
      .then((allBookmarks) => allBookmarks.includes(siteTitle) === presence)
  }
}

const checkSiteSetting = function (hostPattern, setting, value) {
  return function () {
    return this.getAppState().then((val) => {
      return val.value.siteSettings[hostPattern][setting] === value
    })
  }
}

function * setupBrave (client) {
  Brave.addCommands()
  yield client
    .waitForUrl(Brave.newTabUrl)
    .waitForBrowserWindow()
}

function * toggleSync (client, expectedState) {
  if (typeof expectedState === 'undefined') {
    throw new Error('expectedState is required')
  }
  yield client
    .waitForTabCount(1)
    .tabByIndex(0)
    .loadUrl(prefsUrl)
    .waitForVisible(syncTab)
    .click(syncTab)
    .waitForVisible(syncSwitch)
    .click(syncSwitch)
    .waitForBrowserWindow()
    .waitUntil(function () {
      return this.getAppState().then((val) => {
        return val.value.settings['sync.enabled'] === expectedState
      })
    })
}

function * setupSync (client, seed) {
  yield client
    .waitForBrowserWindow()
    .saveSyncInitData(seed, Immutable.fromJS([0]), 0, 'data:image/png;base64,foo')
  yield toggleSync(client, true)
  // When Sync initializes, it requests AWS credentials from server
  // then performs an initial sync.
  yield client.waitUntil(function () {
    return this.getAppState().then((val) => {
      return val.value.sync['lastFetchTimestamp'] > 0
    })
  })
}

function * bookmarkUrl (url, title, folderId) {
  yield Brave.app.client
    .tabByIndex(0)
    .loadUrl(url)
    .windowParentByUrl(url)
    .activateURLMode()
    .waitForVisible(navigatorNotBookmarked)
    .click(navigatorNotBookmarked)
    .waitForVisible(doneButton)
    .waitForVisible('#bookmarkName input')
    .setInputText('#bookmarkName input', title)
    .waitForBookmarkDetail(url, title)
  if (folderId) {
    const folderOption = `#bookmarkParentFolder select option[value="${folderId}"`
    yield Brave.app.client
      .waitForVisible('#bookmarkParentFolder select')
      .click('#bookmarkParentFolder select')
      .waitForVisible(folderOption)
      .click(folderOption)
  }
  yield Brave.app.client
    .waitForEnabled(doneButton)
    .click(doneButton)
}

function * addBookmarkFolder (title) {
  yield Brave.app.client
    .tabByIndex(0)
    .url(aboutBookmarksUrl)
    .waitForVisible('.addBookmarkFolder')
    .click('.addBookmarkFolder')
    .windowParentByUrl(aboutBookmarksUrl)
    .waitForExist('#bookmarkName input')
    .setInputText('#bookmarkName input', title)
    .waitForEnabled(doneButton)
    .click(doneButton)
}

describe('Sync Panel', function () {
  function * setup (client) {
    yield client
      .waitForTabCount(1)
      .waitForBrowserWindow()
      .waitForVisible(urlInput)
  }

  describe('sync setup', function () {
    Brave.beforeEach(this)
    beforeEach(function * () {
      yield setup(this.app.client)
    })

    it('sync profile can be created', function * () {
      yield this.app.client
        .tabByIndex(0)
        .loadUrl(prefsUrl)
        .waitForVisible(syncTab)
        .click(syncTab)
        .waitForVisible(startButton)
        .click(startButton)
        .waitForVisible(createButton)
        .setValue('input', 'pyramid 0')
        .click(createButton)
        .windowByUrl(Brave.browserWindowUrl)
        .waitUntil(function () {
          return this.getAppState().then((val) => {
            return val.value.settings['sync.enabled'] === true &&
              val.value.settings['sync.device-name'] === 'pyramid 0'
          })
        })
    })

    it('sync profile can be recreated', function * () {
      const codewords = 'Idyllic undergrowth sheepman chez wishy undergroundeR verseman plyer  a, a, a, a, a, a, a, a '
      const hex = '68c2ecccc83a2080fc8beccbf55da43c00000000000000000000000000000000'
      yield this.app.client
        .tabByIndex(0)
        .loadUrl(prefsUrl)
        .waitForVisible(syncTab)
        .click(syncTab)
        .waitForVisible(addButton)
        .click(addButton)
        .setValue('textarea', codewords)
        .setValue('input', 'pyramid 1')
        .click(createButton)
        .windowByUrl(Brave.browserWindowUrl)
        .waitUntil(function () {
          return this.getAppState().then((val) => {
            return val.value.settings['sync.enabled'] === true &&
              val.value.settings['sync.device-name'] === 'pyramid 1' &&
              toHex(val.value.sync.seed) === hex &&
              val.value.sync.seedQr.startsWith('data:image/png;base64,')
          })
        })
        .tabByIndex(0)
        .loadUrl(prefsUrl)
        .waitForVisible(syncTab)
        .click(syncTab)
        .waitForExist(newDeviceButton)
        .click(newDeviceButton)
        .click('[data-l10n-id="syncShowPassphrase"]')
        .waitForTextValue('#syncPassphrase', 'idyllic undergrowth sheepman chez\nwishy undergrounder verseman plyer\na a a a\na a a a')
    })
  })

  describe('sync setup failure', function () {
    Brave.beforeAll(this)
    before(function * () {
      yield setup(this.app.client)
    })

    it('shows error when sync fails', function * () {
      yield this.app.client
        .changeSetting(settings.SYNC_NETWORK_DISABLED, true)
        .tabByIndex(0)
        .loadUrl(prefsUrl)
        .waitForVisible(syncTab)
        .click(syncTab)
        .waitForVisible(startButton)
        .click(startButton)
        .waitForVisible(createButton)
        .click(createButton)
        .waitUntil(function () {
          return this.getText('.setupError').then((val) => {
            return val.includes('connection failed')
          })
        })
        .windowByUrl(Brave.browserWindowUrl)
    })

    it('can retry sync connection', function * () {
      const retryButton = '[data-l10n-id="syncRetryButton"]'
      yield this.app.client
        .changeSetting(settings.SYNC_NETWORK_DISABLED, true)
        .tabByIndex(0)
        .loadUrl(prefsUrl)
        .waitForVisible(syncTab)
        .click(syncTab)
        .waitForVisible(retryButton)
        .click(retryButton)
        .windowByUrl(Brave.browserWindowUrl)
        .changeSetting(settings.SYNC_NETWORK_DISABLED, false)
        .tabByIndex(0)
        .waitForVisible(retryButton)
        .click(retryButton)
        .waitForVisible(syncSwitch)
    })
  })

  describe('sync post-setup', function () {
    Brave.beforeEach(this)
    beforeEach(function * () {
      yield setup(this.app.client)
      yield this.app.client.saveSyncInitData(PANEL_SEED, Immutable.fromJS([0]), 0, 'data:image/png;base64,foo')
    })

    it('sync can be toggled', function * () {
      yield this.app.client
        .tabByIndex(0)
        .loadUrl(prefsUrl)
        .waitForVisible(syncTab)
        .click(syncTab)
        .waitForVisible(syncSwitch)
        .click(syncSwitch)
        .windowByUrl(Brave.browserWindowUrl)
        .waitUntil(function () {
          return this.getAppState().then((val) => {
            return val.value.settings['sync.enabled'] === true
          })
        })
        .tabByIndex(0)
        .waitForVisible(syncSwitch)
        .click(syncSwitch)
        .windowByUrl(Brave.browserWindowUrl)
        .waitUntil(function () {
          return this.getAppState().then((val) => {
            return val.value.settings['sync.enabled'] === false
          })
        })
    })

    it('sync categories can be enabled', function * () {
      yield this.app.client
        .tabByIndex(0)
        .loadUrl(prefsUrl)
        .waitForVisible(syncTab)
        .click(syncTab)
        .waitForVisible(syncSwitch)
        .click(syncSwitch)
        .waitForExist('#syncData .switchBackground')
        .click('#syncData .switchBackground')
        .windowByUrl(Brave.browserWindowUrl)
        .waitUntil(function () {
          return this.getAppState().then((val) => {
            return val.value.settings['sync.type.bookmark'] === false
          })
        })
    })

    it('shows sync QR code and words', function * () {
      yield this.app.client
        .tabByIndex(0)
        .loadUrl(prefsUrl)
        .waitForVisible(syncTab)
        .click(syncTab)
        .waitForVisible(syncSwitch)
        .click(syncSwitch)
        .waitForExist(newDeviceButton)
        .click(newDeviceButton)
        .click('[data-l10n-id="syncShowPassphrase"]')
        .waitForTextValue('#syncPassphrase', 'a a a a\na a a a\na a a a\na a a a')
        .click('[data-l10n-id="syncShowQR"]')
        .waitUntil(function () {
          return this.getAttribute('#syncQR', 'src').then((text) => {
            return text === 'data:image/png;base64,foo'
          })
        })
    })
  })
})

describe('Syncing bookmarks', function () {
  Brave.beforeAllServerSetup(this)

  function * setup (seed) {
    yield Brave.startApp()
    yield setupBrave(Brave.app.client)
    yield setupSync(Brave.app.client, seed)
  }

  before(function * () {
    this.page1Url = Brave.server.url('page1.html')
    this.page1Title = 'Page 1'
    this.page2Url = Brave.server.url('page2.html')
    this.page2Title = 'Page 2 - to be Renamed'
    this.page2TitleUpdated = 'All shall hail pyramids'
    this.page3Url = Brave.server.url('page3.html')
    this.page3Title = 'Page 3 - to be Deleted'
    this.folder1Title = 'Folder 1'
    this.folder1Page1Url = Brave.server.url('page4.html')
    this.folder1Page1Title = 'Page 1.4'
    this.folder1Page2Url = Brave.server.url('page5.html')
    this.folder1Page2Title = 'Page 1.5'
    this.folder2Title = 'Folder 2 - to be Deleted'
    this.folder2Page1Url = Brave.server.url('page6.html')
    this.folder2Page1Title = 'Page - to be Deleted'
    this.seed = new Immutable.List(crypto.randomBytes(32))
    yield setup(this.seed)

    // For Create: Bookmark page 1
    yield bookmarkUrl(this.page1Url, this.page1Title)

    // For Update: Bookmark page 2 and rename it
    yield Brave.app.client
      .tabByIndex(0)
      .waitForUrl(this.page1Url)
    yield bookmarkUrl(this.page2Url, this.page2Title)
    yield Brave.app.client
      .activateURLMode()
      .waitForVisible(navigatorBookmarked)
      .click(navigatorBookmarked)
      .waitForVisible(doneButton)
      .waitForExist('#bookmarkName input')
      .setInputText('#bookmarkName input', this.page2TitleUpdated)
      .waitForBookmarkDetail(this.page2Url, this.page2TitleUpdated)
      .waitForEnabled(doneButton)
      .click(doneButton)

    // For Delete: Bookmark page 3 and delete it
    yield Brave.app.client
      .tabByIndex(0)
      .waitForUrl(this.page2Url)
    yield bookmarkUrl(this.page3Url, this.page3Title)
    yield Brave.app.client
      .activateURLMode()
      .waitForVisible(navigatorBookmarked)
      .click(navigatorBookmarked)
      .waitForExist(removeButton)
      .click(removeButton)

    // Create folder then add a bookmark
    yield addBookmarkFolder(this.folder1Title)
    const folder1Id = 1 // XXX: Hardcoded
    yield bookmarkUrl(this.folder1Page1Url, this.folder1Page1Title, folder1Id)

    // Update a page to be in the folder
    yield Brave.app.client
      .tabByIndex(0)
      .waitForUrl(this.folder1Page1Url)
    yield bookmarkUrl(this.folder1Page2Url, this.folder1Page2Title)
    const folder1Option = `#bookmarkParentFolder select option[value="${folder1Id}"`
    yield Brave.app.client
      .activateURLMode()
      .waitForVisible(navigatorBookmarked)
      .click(navigatorBookmarked)
      .waitForVisible(doneButton)
      .click('#bookmarkParentFolder select')
      .waitForVisible(folder1Option)
      .click(folder1Option)
      .click(doneButton)

    // Delete folder (Create, add bookmark, Delete)
    yield addBookmarkFolder(this.folder2Title)
    const folder2Id = 2 // XXX: Hardcoded
    yield Brave.app.client
    yield bookmarkUrl(this.folder2Page1Url, this.folder2Page1Title, folder2Id)
    yield Brave.app.client
      .removeSite({ folderId: folder2Id }, siteTags.BOOKMARK_FOLDER)

    // XXX: Wait for sync to upload records to S3
    yield Brave.app.client.pause(1000)

    // Finally start a fresh profile and setup sync
    yield Brave.stopApp()
    yield setup(this.seed)
    // The bookmarks toolbar should appear automatically
    yield Brave.app.client
      .waitForSettingValue(settings.SHOW_BOOKMARKS_TOOLBAR, true)
  })

  after(function * () {
    yield Brave.stopApp()
  })

  it('create', function * () {
    yield Brave.app.client
      .waitUntil(checkBookmark(this.page1Title))
  })

  it('update (rename)', function * () {
    yield Brave.app.client
      .waitUntil(checkBookmark(this.page2TitleUpdated))
  })

  it('delete', function * () {
    yield Brave.app.client
      .waitUntil(checkBookmark(this.page3Title, false))
  })

  it('create folder', function * () {
    yield Brave.app.client
      .waitUntil(checkBookmark(this.folder1Title))
  })

  it('create bookmark in folder', function * () {
    const pageNthChild = 1
    const folderTitle = this.folder1Title
    const pageTitle = this.folder1Page1Title
    const folder = `[data-test-id="bookmarkToolbarButton"][title="${folderTitle}"]`
    yield Brave.app.client
      .waitForVisible(folder)
      .click(folder)
      .waitForVisible('.contextMenu')
      .waitForTextValue(`.contextMenuItem:nth-child(${pageNthChild})`, pageTitle)
  })

  it('update bookmark, moving it into the folder', function * () {
    const pageNthChild = 2
    const folderTitle = this.folder1Title
    const pageTitle = this.folder1Page2Title
    const folder = `[data-test-id="bookmarkToolbarButton"][title="${folderTitle}"]`
    yield Brave.app.client
      .waitForVisible(folder)
      .click(folder)
      .waitForVisible('.contextMenu')
      .waitForTextValue(`.contextMenuItem:nth-child(${pageNthChild})`, pageTitle)
  })

  it('delete folder', function * () {
    yield Brave.app.client
      .waitUntil(checkBookmark(this.folder2Title, false))
  })

  it('delete folder deletes pages within', function * () {
    yield Brave.app.client
      .waitUntil(checkBookmark(this.folder2Page1Title, false))
  })

  it('sync order', function * () {
    const pageTitle = this.page1Title
    const updatedTitle = this.page2TitleUpdated
    const folder1Title = this.folder1Title

    yield Brave.app.client
      .waitUntil(function () {
        return this.getText('[data-test-id="bookmarkToolbarButton"]:nth-child(1) [data-test-id="bookmarkText"]')
          .then((title) => title === pageTitle)
      })
      .waitUntil(function () {
        return this.getText('[data-test-id="bookmarkToolbarButton"]:nth-child(2) [data-test-id="bookmarkText"]')
          .then((title) => title === updatedTitle)
      })
      .waitUntil(function () {
        return this.getText('[data-test-id="bookmarkToolbarButton"]:nth-child(3) [data-test-id="bookmarkText"]')
          .then((title) => title === folder1Title)
      })
  })
})

describe('Syncing bookmarks from an existing profile', function () {
  Brave.beforeAllServerSetup(this)

  before(function * () {
    this.page1Url = Brave.server.url('page1.html')
    this.page1Title = 'Page 1'
    this.page2Url = Brave.server.url('page2.html')
    this.page2Title = 'Page 2 - to be Renamed'
    this.page2TitleUpdated = 'All shall hail pyramids'
    this.folder1Title = 'Folder 1'
    this.folder1Page1Url = Brave.server.url('page4.html')
    this.folder1Page1Title = 'Page 1.4'
    this.folder1Page2Url = Brave.server.url('page5.html')
    this.folder1Page2Title = 'Page 1.5'
    yield Brave.startApp()
    yield setupBrave(Brave.app.client)
    yield Brave.app.client
      .waitForTabCount(1)
      .waitForBrowserWindow()

    // Bookmark page 1
    yield bookmarkUrl(this.page1Url, this.page1Title)

    yield bookmarkUrl(this.page2Url, this.page2Title)
    yield Brave.app.client
      .waitForBrowserWindow()
      .activateURLMode()
      .waitForVisible(navigatorBookmarked)
      .click(navigatorBookmarked)
      .waitForVisible(doneButton)
      .waitForVisible('#bookmarkName input')
      .setInputText('#bookmarkName input', this.page2TitleUpdated)
      .waitForBookmarkDetail(this.page2Url, this.page2TitleUpdated)
      .waitForEnabled(doneButton)
      .click(doneButton)

    // Create folder then add a bookmark
    yield addBookmarkFolder(this.folder1Title)
    const folder1Id = 1 // XXX: Hardcoded
    yield bookmarkUrl(this.folder1Page1Url, this.folder1Page1Title, folder1Id)

    // Update a page to be in the folder
    yield Brave.app.client
      .tabByIndex(0)
      .waitForUrl(this.folder1Page1Url)
    yield bookmarkUrl(this.folder1Page2Url, this.folder1Page2Title)
    const folder1Option = `#bookmarkParentFolder select option[value="${folder1Id}"`
    yield Brave.app.client
      .waitForBrowserWindow()
      .activateURLMode()
      .waitForVisible(navigatorBookmarked)
      .click(navigatorBookmarked)
      .waitForVisible(doneButton)
      .waitForVisible('#bookmarkParentFolder select')
      .click('#bookmarkParentFolder select')
      .waitForVisible(folder1Option)
      .click(folder1Option)
      .waitForEnabled(doneButton)
      .click(doneButton)

    // Enable Sync
    this.seed = new Immutable.List(crypto.randomBytes(32))
    yield setupSync(Brave.app.client, this.seed)
    // XXX: Wait for sync to upload records to S3
    yield Brave.app.client.pause(1000)

    // Finally start a fresh profile and setup sync
    yield Brave.stopApp()
    yield Brave.startApp()
    yield setupBrave(Brave.app.client)
    yield setupSync(Brave.app.client, this.seed)
    // The bookmarks toolbar should appear automatically
    yield Brave.app.client
      .waitForSettingValue(settings.SHOW_BOOKMARKS_TOOLBAR, true)
  })

  after(function * () {
    yield Brave.stopApp()
  })

  it('create', function * () {
    yield Brave.app.client
      .waitUntil(checkBookmark(this.page1Title))
  })

  it('update (rename)', function * () {
    yield Brave.app.client
      .waitUntil(checkBookmark(this.page2TitleUpdated))
  })

  it('create folder', function * () {
    yield Brave.app.client
      .waitUntil(checkBookmark(this.folder1Title))
  })

  it('create bookmark in folder', function * () {
    const pageNthChild = 1
    const folderTitle = this.folder1Title
    const pageTitle = this.folder1Page1Title
    const folder = `[data-test-id="bookmarkToolbarButton"][title="${folderTitle}"]`
    yield Brave.app.client
      .waitForVisible(folder)
      .click(folder)
      .waitForVisible('.contextMenu')
      .waitForTextValue(`.contextMenuItem:nth-child(${pageNthChild})`, pageTitle)
  })

  it('update bookmark, moving it into the folder', function * () {
    const pageNthChild = 2
    const folderTitle = this.folder1Title
    const pageTitle = this.folder1Page2Title
    const folder = `[data-test-id="bookmarkToolbarButton"][title="${folderTitle}"]`
    yield Brave.app.client
      .waitForVisible(folder)
      .click(folder)
      .waitForVisible('.contextMenu')
      .waitForTextValue(`.contextMenuItem:nth-child(${pageNthChild})`, pageTitle)
  })

  it('sync order', function * () {
    const pageTitle = this.page1Title
    const updatedTitle = this.page2TitleUpdated
    const folder1Title = this.folder1Title

    yield Brave.app.client
      .waitUntil(function () {
        return this.getText('[data-test-id="bookmarkToolbarButton"]:nth-child(1) [data-test-id="bookmarkText"]')
          .then((title) => title === pageTitle)
      })
      .waitUntil(function () {
        return this.getText('[data-test-id="bookmarkToolbarButton"]:nth-child(2) [data-test-id="bookmarkText"]')
          .then((title) => title === updatedTitle)
      })
      .waitUntil(function () {
        return this.getText('[data-test-id="bookmarkToolbarButton"]:nth-child(3) [data-test-id="bookmarkText"]')
          .then((title) => title === folder1Title)
      })
  })
})

describe('Syncing history', function () {
  Brave.beforeAllServerSetup(this)

  function * setup (seed) {
    yield Brave.startApp()
    yield setupBrave(Brave.app.client)
    // New tab sites appear in history; so clear them out.
    yield Brave.app.client
      .onClearBrowsingData({browserHistory: true})
      .changeSetting(settings.NEWTAB_MODE, newTabMode.EMPTY_NEW_TAB)
      .changeSetting(settings.SYNC_TYPE_HISTORY, true)
    yield setupSync(Brave.app.client, seed)
  }

  before(function * () {
    this.page1Url = Brave.server.url('page1.html')
    this.page1Title = 'Page 1'
    this.page2Url = Brave.server.url('page2.html')
    this.page2Title = 'Page 2'
    this.page3Url = Brave.server.url('fingerprinting.html')
    this.page3Title = this.page3Url
    this.seed = new Immutable.List(crypto.randomBytes(32))
    yield setup(this.seed)

    // For Create: Visit page 1
    yield Brave.app.client
      .tabByIndex(0)
      .loadUrl(this.page1Url)
      .windowParentByUrl(this.page1Url)
      .waitForSiteEntry(this.page1Url)

    // For order: Visit page 2
    yield Brave.app.client
      .waitForUrl(this.page1Url)
      .loadUrl(this.page2Url)

    // Private tab should not sync
    yield Brave.app.client
      .waitForUrl(this.page2Url)
      .windowParentByUrl(this.page2Url)
      .newTab({ url: this.page3Url, isPrivate: true })
      .waitForUrl(this.page3Url)

    // XXX: Wait for sync to upload records to S3
    yield Brave.app.client.pause(1000)

    // Finally start a fresh profile and setup sync
    yield Brave.stopApp()
    yield setup(this.seed)
    yield Brave.app.client
      .tabByIndex(0)
      .url(aboutHistoryUrl)
  })

  after(function * () {
    yield Brave.stopApp()
  })

  it('create', function * () {
    yield Brave.app.client
      .waitForVisible(`table.sortableTable td.title[data-sort="${this.page1Title}"]`)
      .waitForVisible(`table.sortableTable td.title[data-sort="${this.page2Title}"]`)
  })

  it('sync order', function * () {
    const page1Title = this.page1Title
    const page2Title = this.page2Title

    yield Brave.app.client
      .waitForTextValue('table.sortableTable tbody tr:nth-child(1) td.title', page2Title)
      .waitForTextValue('table.sortableTable tbody tr:nth-child(2) td.title', page1Title)
  })

  it('private browsing does not sync', function * () {
    yield Brave.app.client
      .waitForElementCount('table.sortableTable tbody tr', 2)
      .waitForElementCount(`table.sortableTable td.title[data-sort="${this.page3Title}"]`, 0)
  })
})

describe('Syncing site settings', function () {
  Brave.beforeAllServerSetup(this)

  function * setup (seed) {
    yield Brave.startApp()
    yield setupBrave(Brave.app.client)
    yield setupSync(Brave.app.client, seed)
  }

  before(function * () {
    this.page1Url = 'https://www.brave.com/'
    this.page1HostPattern = 'https?://www.brave.com'
    this.page1HostPatternNoScript = 'https://www.brave.com'
    this.seed = new Immutable.List(crypto.randomBytes(32))
    yield setup(this.seed)

    // Visit page 1 and poke everything
    yield Brave.app.client
      .waitForTabCount(1)
      .tabByIndex(0)
      .loadUrl(this.page1Url)
      .openBraveMenu(braveMenu, braveryPanel)
      .waitForVisible(httpsEverywhereSwitch)
      .click(httpsEverywhereSwitch)
      .click(noScriptSwitch)
      .click(fpSwitch)
      .click(safeBrowsingSwitch)
      .click(adsBlockedControl)
      .waitForVisible(showAdsOption)
      .click(showAdsOption)
      .click(cookieControl)
      .waitForVisible(allowAllCookiesOption)
      .click(allowAllCookiesOption)

    // XXX: Wait for sync to upload records to S3
    yield Brave.app.client.pause(1000)

    // Finally start a fresh profile and setup sync
    yield Brave.stopApp()
    yield setup(this.seed)
    yield Brave.app.client
      .waitForTabCount(1)
      .tabByIndex(0)
      .loadUrl(this.page1Url)
  })

  after(function * () {
    yield Brave.stopApp()
  })

  it('works', function * () {
    const hostPattern = this.page1HostPattern
    const hostPatternNoScript = this.page1HostPatternNoScript
    yield Brave.app.client
      .windowByUrl(Brave.browserWindowUrl)
      .waitUntil(checkSiteSetting(hostPattern, 'httpsEverywhere', false))
      .waitUntil(checkSiteSetting(hostPattern, 'fingerprintingProtection', true))
      .waitUntil(checkSiteSetting(hostPattern, 'safeBrowsing', false))
      .waitUntil(checkSiteSetting(hostPattern, 'adControl', 'allowAdsAndTracking'))
      .waitUntil(checkSiteSetting(hostPattern, 'cookieControl', 'allowAllCookies'))
      .waitUntil(checkSiteSetting(hostPatternNoScript, 'noScript', true))
  })
})

describe('Syncing and clearing data prevents it from syncing', function () {
  Brave.beforeAllServerSetup(this)

  function * setup (seed) {
    yield Brave.startApp()
    yield setupBrave(Brave.app.client)
    // New tab sites appear in history; so first clear them out.
    yield Brave.app.client
      .onClearBrowsingData({browserHistory: true})
      .changeSetting(settings.NEWTAB_MODE, newTabMode.EMPTY_NEW_TAB)
      .changeSetting(settings.SYNC_TYPE_HISTORY, true)
    yield setupSync(Brave.app.client, seed)
  }

  before(function * () {
    this.page1Url = 'https://www.brave.com/'
    this.page1HostPatternNoScript = 'https://www.brave.com'
    const hostPattern = this.page1HostPatternNoScript
    this.seed = new Immutable.List(crypto.randomBytes(32))
    yield setup(this.seed)

    yield Brave.app.client
      .tabByIndex(0)
      .loadUrl(this.page1Url)
      .openBraveMenu(braveMenu, braveryPanel)
      .waitForVisible(noScriptSwitch)
      .click(noScriptSwitch)
      .waitUntil(checkSiteSetting(hostPattern, 'noScript', true))
      .pause(1000) // XXX: Wait for sync to upload records to S3
      .onClearBrowsingData({browserHistory: true, savedSiteSettings: true})
      .pause(500) // XXX: Wait for sync to delete records from S3

    // Finally start a fresh profile and setup sync
    yield Brave.stopApp()
    yield setup(this.seed)
    yield Brave.app.client
      .tabByIndex(0)
      .loadUrl(aboutHistoryUrl)
      .pause(500) // XXX: Wait for history to load
  })

  after(function * () {
    yield Brave.stopApp()
  })

  it('history', function * () {
    yield Brave.app.client
      .waitForElementCount('table.sortableTable', 0)
  })

  it('site settings', function * () {
    const hostPattern = this.page1HostPatternNoScript
    yield Brave.app.client
      .windowByUrl(Brave.browserWindowUrl)
      .waitUntil(function () {
        return this.getAppState().then((val) => {
          return val.value.siteSettings.hasOwnProperty(hostPattern) === false
        })
      })
  })
})

describe('Syncing then turning it off stops syncing', function () {
  Brave.beforeAllServerSetup(this)

  function * setup (seed) {
    yield Brave.startApp()
    yield setupBrave(Brave.app.client)
    // New tab sites appear in history; so first clear them out.
    yield Brave.app.client
      .onClearBrowsingData({browserHistory: true})
      .changeSetting(settings.NEWTAB_MODE, newTabMode.EMPTY_NEW_TAB)
      .changeSetting(settings.SHOW_BOOKMARKS_TOOLBAR, true)
      .changeSetting(settings.SYNC_TYPE_HISTORY, true)
    yield setupSync(Brave.app.client, seed)
  }

  before(function * () {
    this.page1Url = Brave.server.url('page1.html')
    this.page1Title = 'Page 1'
    this.page2Url = Brave.server.url('page2.html')
    this.page2Title = 'Page 2'
    this.page3Url = 'https://www.brave.com/'
    this.page3HostPattern = 'https?://www.brave.com'
    this.hostPattern1 = this.page3HostPattern
    this.page4Url = 'https://www.eff.org/'
    this.page4HostPattern = 'https?://www.eff.org'
    this.hostPattern2 = this.page4HostPattern
    this.siteSettingName = 'fingerprintingProtection'
    this.seed = new Immutable.List(crypto.randomBytes(32))
    yield setup(this.seed)

    // Sync On - browsing activity which is synced
    yield bookmarkUrl(this.page1Url, this.page1Title)
    yield Brave.app.client
      .tabByIndex(0)
      .loadUrl(this.page3Url)
      .openBraveMenu(braveMenu, braveryPanel)
      .waitForVisible(fpSwitch)
      .click(fpSwitch)
      .waitUntil(checkSiteSetting(this.hostPattern1, this.siteSettingName, true))
      .keys(Brave.keys.ESCAPE)
      .pause(1000) // XXX: Wait for Sync to upload records to S3

    // Sync Off - browsing activity NOT synced
    yield toggleSync(Brave.app.client, false)
    yield bookmarkUrl(this.page2Url, this.page2Title)
    yield Brave.app.client
      .tabByIndex(0)
      .loadUrl(this.page4Url)
      .openBraveMenu(braveMenu, braveryPanel)
      .waitForVisible(fpSwitch)
      .click(fpSwitch)
      .waitUntil(checkSiteSetting(this.hostPattern2, this.siteSettingName, true))

    // Finally start a fresh profile and setup sync
    yield Brave.stopApp()
    yield setup(this.seed)
    yield Brave.app.client
      .tabByIndex(0)
      .loadUrl(aboutHistoryUrl)
      .pause(500) // XXX: Wait for history to load
  })

  after(function * () {
    yield Brave.stopApp()
  })

  it('bookmarks', function * () {
    yield Brave.app.client
      .windowByUrl(Brave.browserWindowUrl)
      .waitUntil(checkBookmark(this.page1Title))
      .waitUntil(checkBookmark(this.page2Title, false))
  })

  it('history', function * () {
    yield Brave.app.client
      .tabByIndex(0)
      .waitForElementCount('table.sortableTable tbody tr', 2)
      .waitForVisible(`table.sortableTable td.title[data-sort="${this.page1Title}"]`)
      .waitForElementCount(`table.sortableTable td.title[data-sort="${this.page2Title}"]`, 0)
  })

  it('site settings', function * () {
    const hostPattern1 = this.hostPattern1
    const hostPattern2 = this.hostPattern2
    yield Brave.app.client
      .windowByUrl(Brave.browserWindowUrl)
      .waitUntil(checkSiteSetting(hostPattern1, this.siteSettingName, true))
      .waitUntil(function () {
        return this.getAppState().then((val) => {
          return val.value.siteSettings.hasOwnProperty(hostPattern2) === false
        })
      })
  })
})
