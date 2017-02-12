/* global describe, it, before */

const Brave = require('../lib/brave')
const Immutable = require('immutable')
const {urlInput, navigator, navigatorBookmarked, navigatorNotBookmarked, doneButton, removeButton} = require('../lib/selectors')
const siteTags = require('../../js/constants/siteTags')

describe('bookmark tests', function () {
  function * setup (client) {
    yield client
      .waitForUrl(Brave.newTabUrl)
      .waitForBrowserWindow()
      .waitForEnabled(urlInput)
  }

  describe('bookmarks', function () {
    describe('Editing a bookmark', function () {
      Brave.beforeAll(this)
      before(function * () {
        this.page1Url = Brave.server.url('page1.html')
        yield setup(this.app.client)
        yield this.app.client
          .waitForUrl(Brave.newTabUrl)
          .loadUrl(this.page1Url)
          .windowParentByUrl(this.page1Url)
          .activateURLMode()
          .waitForVisible(navigatorNotBookmarked)
          .click(navigatorNotBookmarked)
          .waitForVisible(doneButton)
          .waitForBookmarkDetail(this.page1Url, 'Page 1')
          .waitForEnabled(doneButton)
          .click(doneButton)
          .activateURLMode()
          .waitForVisible(navigatorBookmarked)
          .click(navigatorBookmarked)
          .waitForVisible(doneButton)
      })

      it('fills in the url field', function * () {
        yield this.app.client
          .waitForExist('#bookmarkLocation input')
          .waitForBookmarkDetail(this.page1Url, 'Page 1')
      })
      it('add custom title', function * () {
        yield this.app.client
          .waitForExist('#bookmarkName input')
          .waitForBookmarkDetail(this.page1Url, 'Page 1')
          .setValue('#bookmarkName input', 'Custom Page 1')
          .waitForEnabled(doneButton)
          .click(doneButton)
      })
      it('check custom title', function * () {
        yield this.app.client
          .activateURLMode()
          .waitForVisible(navigatorBookmarked)
          .click(navigatorBookmarked)
          .waitForVisible(doneButton)
          .getValue('#bookmarkName input').should.eventually.be.equal('Custom Page 1')
          .click(doneButton)
      })
      it('display punycode custom title and location', function * () {
        yield this.app.client
          .activateURLMode()
          .waitForVisible(navigatorBookmarked)
          .click(navigatorBookmarked)
          .waitForVisible(doneButton)
          .setValue('#bookmarkName input', 'https://www.brave.com')
          .keys('\uE010') // send END key
          .keys('а')
          .getValue('#bookmarkName input').should.eventually.be.equal('https://www.brave.xn--com-8cd/')
          .setValue('#bookmarkLocation input', 'https://www.brave.com')
          .keys('\uE010') // send END key
          .keys('а')
          .getValue('#bookmarkLocation input').should.eventually.be.equal('https://www.brave.xn--com-8cd/')
          .click(removeButton)
      })
      it('custom title and location can be backspaced', function * () {
        yield this.app.client
          .activateURLMode()
          .waitForVisible(navigatorBookmarked)
          .click(navigatorBookmarked)
          .waitForVisible(doneButton)
          .setValue('#bookmarkName input', 'https://www.brave.com/1')
          .keys('\uE010') // send END key
          .keys(Brave.keys.BACKSPACE)
          .keys(Brave.keys.BACKSPACE)
          .keys(Brave.keys.BACKSPACE)
          .getValue('#bookmarkName input').should.eventually.be.equal('https://www.brave.co')
          .setValue('#bookmarkLocation input', 'https://www.brave.com/1')
          .keys('\uE010') // send END key
          .keys(Brave.keys.BACKSPACE)
          .keys(Brave.keys.BACKSPACE)
          .keys(Brave.keys.BACKSPACE)
          .getValue('#bookmarkLocation input').should.eventually.be.equal('https://www.brave.co')
          .click(removeButton)
      })
    })

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
          .activateURLMode()
          .waitForVisible(navigatorNotBookmarked)
          .click(navigatorNotBookmarked)
          .waitForVisible(doneButton)
      })

      it('fills in the title field', function * () {
        yield this.app.client
          .waitForExist('#bookmarkName input')
          .waitForBookmarkDetail(this.page1Url, 'Page 1')
          .waitForEnabled(doneButton)
          .getValue('#bookmarkName input').should.eventually.be.equal('Page 1')
      })

      it('does not show the url field', function * () {
        yield this.app.client
          .waitForExist('#bookmarkLocation input', Brave.defaultTimeout, true)
      })

      describe('saved with a title', function () {
        before(function * () {
          yield this.app.client
            .waitForBookmarkDetail(this.page1Url, 'Page 1')
            .waitForEnabled(doneButton)
            .click(doneButton)
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
              .activateURLMode()
              .waitForVisible(navigatorNotBookmarked)
              .click(navigatorNotBookmarked)
              .waitForVisible(removeButton)
              .click(removeButton)
          })
          it('removes the bookmark from the toolbar', function * () {
            yield this.app.client
              .waitForExist('.bookmarkText', Brave.defaultTimeout, true)
          })
        })
      })
    })

    describe('pages without title', function () {
      Brave.beforeAll(this)

      before(function * () {
        this.pageNoTitle = Brave.server.url('page_no_title.html')

        yield setup(this.app.client)

        yield this.app.client
          .waitForUrl(Brave.newTabUrl)
          .loadUrl(this.pageNoTitle)
          .windowParentByUrl(this.pageNoTitle)
          .activateURLMode()
          .waitForExist(navigatorNotBookmarked)
          .activateURLMode()
          .click(navigatorNotBookmarked)
          .waitForBookmarkDetail(this.pageNoTitle, '')
          .waitForEnabled(doneButton + ':not([disabled]')
      })

      it('leaves the title field blank', function * () {
        yield this.app.client
          .waitForExist('#bookmarkName input')
          .getValue('#bookmarkName input').should.eventually.be.equal('')
      })

      it('does not show the url field', function * () {
        yield this.app.client
          .waitForExist('#bookmarkLocation input', Brave.defaultTimeout, true)
      })

      describe('saved without a title', function () {
        before(function * () {
          yield this.app.client
            .waitForBookmarkDetail(this.pageNoTitle, '')
            .waitForEnabled(doneButton)
            .click(doneButton)
        })
        it('displays URL', function * () {
          const pageNoTitle = this.pageNoTitle
          yield this.app.client
            .waitUntil(function () {
              return this.getText('.bookmarkText')
                .then((val) => val === pageNoTitle)
            })
        })
        describe('and then removed', function () {
          before(function * () {
            yield this.app.client
              .click(navigatorNotBookmarked)
              .waitForExist(removeButton)
              .click(removeButton)
          })
          it('removes the bookmark from the toolbar', function * () {
            yield this.app.client
              .waitForExist('.bookmarkText', Brave.defaultTimeout, true)
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

    it('rebuilds the menu when add a list of items', function * () {
      const bookmarkTitle = 'bookmark-rebuild-menu-demo'
      const folderName = 'bookmark-folder-rebuild-menu-demo'
      const sites = Immutable.fromJS([
        {
          customTitle: folderName,
          folderId: 1,
          parentFolderId: 0,
          tags: [siteTags.BOOKMARK_FOLDER]
        },
        {
          lastAccessedTime: 123,
          title: bookmarkTitle,
          location: 'https://brave.com',
          tags: [siteTags.BOOKMARK]
        }
      ])
      yield this.app.client
        .addSiteList(sites)
        .waitUntil(function () {
          return this.getAppState().then((val) => {
            const bookmarksMenu = val.value.menu.template.find((item) => {
              return item.label === 'Bookmarks'
            })
            if (bookmarksMenu && bookmarksMenu.submenu) {
              const bookmark = bookmarksMenu.submenu.find((item) => {
                return item.label === bookmarkTitle
              })
              const bookmarkFolder = bookmarksMenu.submenu.find((item) => {
                return item.label === folderName
              })
              if (bookmark && bookmarkFolder) return true
            }
            return false
          })
        })
    })
  })
})
