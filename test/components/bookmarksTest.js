/* global describe, it, before */

const Brave = require('../lib/brave')
const {urlInput, navigator, navigatorNotBookmarked, saveButton, deleteButton} = require('../lib/selectors')
const siteTags = require('../../js/constants/siteTags')

describe('bookmark tests', function () {
  function * setup (client) {
    yield client
      .waitUntilWindowLoaded()
      .waitForUrl(Brave.newTabUrl)
      .waitForBrowserWindow()
      .waitForVisible('#window')
      .waitForEnabled(urlInput)
  }

  describe('bookmarks', function () {
    describe('pages with title', function () {
      Brave.beforeAll(this)

      before(function * () {
        this.page1Url = Brave.server.url('page1.html')

        yield setup(this.app.client)

        yield this.app.client
          .waitForUrl(Brave.newTabUrl)
          .loadUrl(this.page1Url)
          .windowParentByUrl(this.page1Url)
          .waitForVisible(navigator)
          .moveToObject(navigator)
          .waitForVisible(navigatorNotBookmarked)
          .click(navigatorNotBookmarked)
          .waitForVisible(saveButton)
      })

      it('fills in the title field', function * () {
        yield this.app.client
          .waitForExist('#bookmarkName input')
          .getValue('#bookmarkName input').should.eventually.be.equal('Page 1')
      })

      it('fills in the url field', function * () {
        yield this.app.client
          .waitForExist('#bookmarkLocation input')
          .getValue('#bookmarkLocation input').should.eventually.be.equal(this.page1Url)
      })

      describe('saved with a title', function () {
        before(function * () {
          yield this.app.client
            .click(saveButton)
        })

        it('displays title', function * () {
          yield this.app.client
            .waitUntil(function () {
              return this.getText('.bookmarkText')
                .then((val) => val === 'Page 1')
            })
        })

        describe('and then removed', function () {
          before(function * () {
            yield this.app.client
              .waitForVisible(navigator)
              .moveToObject(navigator)
              .waitForVisible(navigatorNotBookmarked)
              .click(navigatorNotBookmarked)
              .waitForVisible(deleteButton)
              .click(deleteButton)
          })
          it('removes the bookmark from the toolbar', function * () {
            yield this.app.client
              .waitForExist('.bookmarkText', 1000, true)
          })
        })
      })
    })

    describe('pages without title', function () {
      Brave.beforeAll(this)

      before(function * () {
        this.page1Url = Brave.server.url('page_no_title.html')

        yield setup(this.app.client)

        yield this.app.client
          .waitForUrl(Brave.newTabUrl)
          .loadUrl(this.page1Url)
          .windowParentByUrl(this.page1Url)
          .moveToObject(navigator)
          .waitForExist(navigatorNotBookmarked)
          .moveToObject(navigator)
          .click(navigatorNotBookmarked)
          .waitForVisible(saveButton + ':not([disabled]')
      })

      it('leaves the title field blank', function * () {
        yield this.app.client
          .waitForExist('#bookmarkName input')
          .getValue('#bookmarkName input').should.eventually.be.equal('')
      })

      it('fills in the url field', function * () {
        yield this.app.client
          .waitForExist('#bookmarkLocation input')
          .getValue('#bookmarkLocation input').should.eventually.be.equal(this.page1Url)
      })

      describe('saved without a title', function () {
        before(function * () {
          yield this.app.client
            .click(saveButton)
        })
        it('displays URL', function * () {
          const page1Url = this.page1Url
          yield this.app.client
            .waitUntil(function () {
              return this.getText('.bookmarkText')
                .then((val) => val === page1Url)
            })
        })
        describe('and then removed', function () {
          before(function * () {
            yield this.app.client
              .click(navigatorNotBookmarked)
              .waitForExist(deleteButton)
              .click(deleteButton)
          })
          it('removes the bookmark from the toolbar', function * () {
            yield this.app.client
              .waitForExist('.bookmarkText', 1000, true)
          })
        })
      })
    })
  })

  describe('menu behavior', function () {
    Brave.beforeAll(this)

    before(function * () {
      yield setup(this.app.client)
    })

    it('rebuilds the menu when a folder is added', function * () {
      const folderName = 'bookmark-folder-rebuild-menu-demo'

      yield this.app.client
        .addSite({
          customTitle: folderName,
          folderId: 1,
          parentFolderId: 0,
          tags: [siteTags.BOOKMARK_FOLDER]
        }, siteTags.BOOKMARK_FOLDER)
        .waitUntil(function () {
          return this.getAppState().then((val) => {
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
          })
        })
    })

    it('rebuilds the menu when a bookmark is added', function * () {
      const bookmarkTitle = 'bookmark-rebuild-menu-demo'

      yield this.app.client
        .addSite({
          lastAccessedTime: 456,
          tags: [siteTags.BOOKMARK],
          location: 'https://brave.com',
          title: bookmarkTitle
        }, siteTags.BOOKMARK)
        .waitUntil(function () {
          return this.getAppState().then((val) => {
            const bookmarksMenu = val.value.menu.template.find((item) => {
              return item.label === 'Bookmarks'
            })
            if (bookmarksMenu && bookmarksMenu.submenu) {
              const bookmark = bookmarksMenu.submenu.find((item) => {
                return item.label === bookmarkTitle
              })
              if (bookmark) return true
            }
            return false
          })
        })
    })
  })
})
