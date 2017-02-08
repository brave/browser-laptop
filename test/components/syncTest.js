/* global describe, it, before, beforeEach, after */

const crypto = require('crypto')
const settings = require('../../js/constants/settings')
const Brave = require('../lib/brave')
const Immutable = require('immutable')
const {doneButton, navigatorBookmarked, navigatorNotBookmarked, urlInput, removeButton, syncTab, syncSwitch} = require('../lib/selectors')

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

describe('Sync Panel', function () {
  function * setup (client) {
    yield client
      .waitForUrl(Brave.newTabUrl)
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
        .waitUntil(function () {
          return this.getText('#syncPassphrase').then((text) => {
            return text === 'idyllic undergrowth sheepman chez\nwishy undergrounder verseman plyer\na a a a\na a a a'
          })
        })
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
        .waitUntil(function () {
          return this.getText('#syncPassphrase').then((text) => {
            return text === 'a a a a\na a a a\na a a a\na a a a'
          })
        })
        .click('[data-l10n-id="syncShowQR"]')
        .waitUntil(function () {
          return this.getAttribute('#syncQR', 'src').then((text) => {
            return text === 'data:image/png;base64,foo'
          })
        })
    })
  })
})

describe('Syncing', function () {
  function * setupBrave (client) {
    Brave.addCommands()
  }

  function * setupSync (client, seed) {
    yield setupBrave(Brave.app.client)
    yield Brave.app.client.saveSyncInitData(seed, Immutable.fromJS([0]), 0, 'data:image/png;base64,foo')

    yield Brave.app.client
      .windowByUrl(Brave.browserWindowUrl)
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
      .pause(1000) // XXX: Wait for sync init (request AWS credentials from server)
  }

  describe('bookmarks', function () {
    Brave.beforeAllServerSetup(this)

    function * bookmarkUrl (url, title) {
      yield Brave.app.client
        .tabByIndex(0)
        .loadUrl(url)
        .windowParentByUrl(url)
        .activateURLMode()
        .waitForVisible(navigatorNotBookmarked)
        .click(navigatorNotBookmarked)
        .waitForVisible(doneButton)
        .setInputText('#bookmarkName input', title)
        .waitForBookmarkDetail(url, title)
        .waitForEnabled(doneButton)
        .click(doneButton)
    }

    before(function * () {
      this.page1Url = Brave.server.url('page1.html')
      this.page1Title = 'Page 1'
      this.page2Url = Brave.server.url('page2.html')
      this.page2Title = 'Page 2'
      this.page2TitleUpdated = 'All shall hail pyramids'
      this.page3Url = Brave.server.url('page3.html')
      this.page3Title = 'Page 3'
      this.seed = new Immutable.List(crypto.randomBytes(32))
      yield Brave.startApp()
      yield setupSync(Brave.app.client, this.seed)

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
        // .pause(500) // XXX: Wait for sync
        .activateURLMode()
        .waitForVisible(navigatorBookmarked)
        .click(navigatorBookmarked)
        .waitForExist(removeButton)
        .click(removeButton)

      // XXX: Wait to upload sync records to S3
      yield Brave.app.client.pause(1000)

      // Finally start a fresh profile and setup sync
      yield Brave.stopApp()
      yield Brave.startApp()
      yield setupSync(Brave.app.client, this.seed)
      yield Brave.app.client
        .changeSetting(settings.SHOW_BOOKMARKS_TOOLBAR, true)
    })

    after(function * () {
      yield Brave.stopApp()
    })

    it('create', function * () {
      const pageTitle = this.page1Title
      yield Brave.app.client
        .waitUntil(function () {
          return this.getText('.bookmarksToolbar')
            .then((allBookmarks) => allBookmarks.includes(pageTitle))
        })
    })

    it('update (rename)', function * () {
      const updatedTitle = this.page2TitleUpdated
      yield Brave.app.client
        .waitUntil(function () {
          return this.getText('.bookmarksToolbar')
            .then((allBookmarks) => allBookmarks.includes(updatedTitle))
        })
    })

    it('delete', function * () {
      const deletedTitle = this.page3Title
      yield Brave.app.client
        .waitUntil(function () {
          return this.getText('.bookmarksToolbar')
            .then((allBookmarks) => allBookmarks.includes(deletedTitle) === false)
        })
    })

    it('sync order', function * () {
      const pageTitle = this.page1Title
      const updatedTitle = this.page2TitleUpdated

      yield Brave.app.client
        .waitUntil(function () {
          return this.getText('.bookmarkToolbarButton:nth-child(1) .bookmarkText')
            .then((title) => title === pageTitle)
        })
        .waitUntil(function () {
          return this.getText('.bookmarkToolbarButton:nth-child(2) .bookmarkText')
            .then((title) => title === updatedTitle)
        })
    })
  })
})
