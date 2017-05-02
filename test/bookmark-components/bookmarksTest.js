/* global describe, it, before */

const Brave = require('../lib/brave')
const Immutable = require('immutable')
const {urlInput, navigator, navigatorBookmarked, navigatorNotBookmarked, doneButton, removeButton, bookmarkNameInput, bookmarkLocationInput} = require('../lib/selectors')
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
          .waitForExist(bookmarkLocationInput)
          .waitForBookmarkDetail(this.page1Url, 'Page 1')
      })
      it('add custom title', function * () {
        yield this.app.client
          .waitForExist(bookmarkNameInput)
          .waitForBookmarkDetail(this.page1Url, 'Page 1')
          .setValue(bookmarkNameInput, 'Custom Page 1')
          .waitForEnabled(doneButton)
          .click(doneButton)
      })
      it('check custom title', function * () {
        yield this.app.client
          .activateURLMode()
          .waitForVisible(navigatorBookmarked)
          .click(navigatorBookmarked)
          .waitForVisible(doneButton)
          .waitForInputText(bookmarkNameInput, 'Custom Page 1')
          .click(doneButton)
      })
      it('can delete custom title', function * () {
        yield this.app.client
          .activateURLMode()
          .waitForVisible(navigatorBookmarked)
          .click(navigatorBookmarked)
          .waitForVisible(doneButton)
          .keys(Brave.keys.BACKSPACE)
          .waitForInputText(bookmarkNameInput, '')
      })
      it('display punycode custom title and location', function * () {
        yield this.app.client
          .activateURLMode()
          .waitForVisible(navigatorBookmarked)
          .click(navigatorBookmarked)
          .waitForVisible(doneButton)
          .setValue(bookmarkNameInput, 'https://www.brave.com')
          .keys(Brave.keys.END)
          .keys('а')
          .waitForInputText(bookmarkNameInput, 'https://www.brave.xn--com-8cd/')
          .setValue(bookmarkLocationInput, 'https://www.brave.com')
          .keys(Brave.keys.END)
          .keys('а')
          .waitForInputText(bookmarkLocationInput, 'https://www.brave.xn--com-8cd/')
          .click(removeButton)
      })
      it('custom title and location can be backspaced', function * () {
        yield this.app.client
          .activateURLMode()
          .waitForVisible(navigatorBookmarked)
          .click(navigatorBookmarked)
          .waitForVisible(doneButton)
          .setValue(bookmarkNameInput, 'https://www.brave.com/1')
          .keys(Brave.keys.END)
          .keys(Brave.keys.BACKSPACE)
          .keys(Brave.keys.BACKSPACE)
          .keys(Brave.keys.BACKSPACE)
          .waitForInputText(bookmarkNameInput, 'https://www.brave.co')
          .setValue(bookmarkLocationInput, 'https://www.brave.com/1')
          .keys(Brave.keys.END)
          .keys(Brave.keys.BACKSPACE)
          .keys(Brave.keys.BACKSPACE)
          .keys(Brave.keys.BACKSPACE)
          .waitForInputText(bookmarkLocationInput, 'https://www.brave.co')
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
          .waitForExist(bookmarkNameInput)
          .waitForBookmarkDetail(this.page1Url, 'Page 1')
          .waitForEnabled(doneButton)
          .waitForInputText(bookmarkNameInput, 'Page 1')
      })

      it('does not show the url field', function * () {
        yield this.app.client
          .waitForElementCount(bookmarkLocationInput, 0)
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
            .waitForTextValue('[data-test-id="bookmarkText"]', 'Page 1')
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
              .waitForElementCount('[data-test-id="bookmarkText"]', 0)
          })
        })
      })
    })

    describe('pages without title', function () {
      Brave.beforeAll(this)

      before(function * () {
        this.pageNoTitle = Brave.server.url('page_no_title.html')
        this.title = this.pageNoTitle.replace(/http:\/\//, '')

        yield setup(this.app.client)

        yield this.app.client
          .waitForUrl(Brave.newTabUrl)
          .loadUrl(this.pageNoTitle)
          .windowParentByUrl(this.pageNoTitle)
          .activateURLMode()
          .waitForExist(navigatorNotBookmarked)
          .click(navigatorNotBookmarked)
          .waitForBookmarkDetail(this.pageNoTitle, this.title)
          .waitForEnabled(doneButton + ':not([disabled]')
      })

      it('sets the title to the url', function * () {
        yield this.app.client
          .waitForExist(bookmarkNameInput)
          .waitForInputText(bookmarkNameInput, this.title)
      })

      it('does not show the url field', function * () {
        yield this.app.client
          .waitForElementCount(bookmarkLocationInput, 0)
      })
    })

    describe('bookmark pdf', function () {
      Brave.beforeAll(this)

      before(function * () {
        yield setup(this.app.client)
      })
      it('load pdf', function * () {
        const page1Url = Brave.server.url('img/test.pdf')
        yield this.app.client
          .windowByUrl(Brave.browserWindowUrl)
          .waitUntil(function () {
            return this.getAppState().then((val) => {
              return val.value.extensions['jdbefljfgobbmcidnmpjamcbhnbphjnb']
            })
          })
        yield this.app.client.tabByIndex(0).url(page1Url).windowParentByUrl(page1Url)
        yield this.app.client
          .activateURLMode()
          .waitForInputText(urlInput, page1Url)
      })
      it('check location', function * () {
        const page1Url = Brave.server.url('img/test.pdf')
        let title = 'test.ico - test.pdf'
        yield this.app.client
          .windowParentByUrl(page1Url)
          .windowByUrl(page1Url)
          .activateURLMode()
          .waitForVisible(navigatorNotBookmarked)
          .click(navigatorNotBookmarked)
          .waitForVisible(doneButton)
          .waitUntil(function () {
            return this.getAppState().then((val) => {
              title = val.value.tabs[0].title
              return title !== undefined
            })
          })
          .waitForBookmarkDetail(page1Url, title)
          .waitForEnabled(doneButton)
          .click(doneButton)
          .activateURLMode()
          .waitForVisible(navigatorBookmarked)
          .click(navigatorBookmarked)
          .waitForVisible(doneButton)
          .waitForInputText(bookmarkLocationInput, page1Url)
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
        .waitForBrowserWindow()
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
